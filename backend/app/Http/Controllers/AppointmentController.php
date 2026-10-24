<?php
namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Jobs\SendAppointmentNotification;
use App\Models\Dentist;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentController extends Controller
{
    const DOWN_PAYMENT = 200;   // dummy amount (PHP)
    const MIN_DAYS_AHEAD = 2;   // teacher's rule: book at least 2 days before

    public function index(Request $r)
    {
        $q = Appointment::with(['dentist', 'service', 'user'])->orderBy('date')->orderBy('start_time');
        if ($r->user()->role !== 'admin') $q->where('user_id', $r->user()->id);
        return $q->get();
    }

    /** Free/taken slots for one dentist on one date. */
    public function slots(Request $r)
    {
        $r->validate(['dentist_id' => 'required|exists:dentists,id', 'date' => 'required|date_format:Y-m-d']);
        $this->checkDate($r->date);

        $dentist = Dentist::findOrFail($r->dentist_id);
        $taken = $this->takenTimes($dentist->id, $r->date, $r->exclude);

        return collect($dentist->slotsFor($r->date))
            ->map(fn ($s) => $s + ['available' => !in_array($s['start'], $taken)])
            ->values();
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'dentist_id'  => 'required|exists:dentists,id',
            'service_id'  => 'required|exists:services,id',
            'date'        => 'required|date_format:Y-m-d',
            'start_time'  => 'required|date_format:H:i',
            'payment_ref' => 'required|string|max:50', // from the dummy QR payment step
        ]);
        $this->assertDentistOffersService($data['dentist_id'], $data['service_id']);
        $this->checkDate($data['date']);
        $slot = $this->findSlot($data['dentist_id'], $data['date'], $data['start_time']);

        try {
            $appt = DB::transaction(function () use ($r, $data, $slot) {
                $this->assertFree($data['dentist_id'], $data['date'], $data['start_time']);
                return Appointment::create([
                    'user_id'      => $r->user()->id,
                    'dentist_id'   => $data['dentist_id'],
                    'service_id'   => $data['service_id'],
                    'date'         => $data['date'],
                    'start_time'   => $slot['start'],
                    'end_time'     => $slot['end'],
                    'status'       => 'pending',
                    'down_payment' => self::DOWN_PAYMENT,
                    'payment_ref'  => $data['payment_ref'],
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            // Two people booked the same slot at the same moment; the database let only one through.
            throw $this->slotTakenError();
        }

        $this->notify($appt, 'booked (pending approval)');
        return response()->json($appt->load(['dentist', 'service']), 201);
    }

    /** Reschedule (patient or admin). */
    public function update(Request $r, Appointment $appointment)
    {
        $this->authorizeAppt($r, $appointment);
        abort_if($appointment->status === 'cancelled', 422, 'This appointment is already cancelled.');
        abort_if($appointment->status === 'done', 422, 'This appointment is already done.');

        $data = $r->validate(['date' => 'required|date_format:Y-m-d', 'start_time' => 'required|date_format:H:i']);
        $this->assertDentistOffersService($appointment->dentist_id, $appointment->service_id);
        $this->checkDate($data['date']);
        $slot = $this->findSlot($appointment->dentist_id, $data['date'], $data['start_time']);

        try {
            DB::transaction(function () use ($appointment, $data, $slot, $r) {
                $this->assertFree($appointment->dentist_id, $data['date'], $data['start_time'], $appointment->id);
                $appointment->update([
                    'date' => $data['date'], 'start_time' => $slot['start'], 'end_time' => $slot['end'],
                    'status' => $r->user()->role === 'admin' ? $appointment->status : 'pending',
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            throw $this->slotTakenError();
        }

        $this->notify($appointment, 'rescheduled');
        return $appointment->load(['dentist', 'service']);
    }

    public function cancel(Request $r, Appointment $appointment)
    {
        $this->authorizeAppt($r, $appointment);
        abort_if($appointment->status === 'done', 422, 'This appointment is already done.');
        $appointment->update(['status' => 'cancelled']);
        $this->notify($appointment, 'cancelled');
        return $appointment;
    }

    /** Admin: approve, cancel, or mark as done. */
    public function setStatus(Request $r, Appointment $appointment)
    {
        $r->validate(['status' => 'required|in:approved,cancelled,done']);
        if ($r->status === 'done') {
            // only an approved appointment can be marked as done
            abort_unless($appointment->status === 'approved', 422, 'Only approved appointments can be marked as done.');
            // ...and only on the day of the appointment (or after, if it was never marked). Uses APP_TIMEZONE.
            abort_if($appointment->date->toDateString() > Carbon::today()->toDateString(), 422,
                'This appointment can only be marked as done on the day of the appointment.');
            $appointment->update(['status' => 'done']);
            return $appointment->load(['dentist', 'service', 'user']);
        }
        abort_if($appointment->status === 'done', 422, 'This appointment is already done.');

        if ($appointment->status === 'cancelled' && $r->status !== 'cancelled') {
            // Bringing a cancelled appointment back: its slot may have been booked by someone else meanwhile.
            try {
                DB::transaction(function () use ($appointment, $r) {
                    $this->assertFree($appointment->dentist_id, $appointment->date->toDateString(), $appointment->start_time, $appointment->id);
                    $appointment->update(['status' => $r->status]);
                });
            } catch (UniqueConstraintViolationException) {
                throw $this->slotTakenError();
            }
        } else {
            $appointment->update(['status' => $r->status]);
        }
        $this->notify($appointment, $r->status === 'approved' ? 'approved' : 'cancelled');
        return $appointment->load(['dentist', 'service', 'user']);
    }

    public function dashboard()
    {
        $active = Appointment::where('status', '!=', 'cancelled');
        return [
            'today_count'   => (clone $active)->whereDate('date', today())->count(),
            'pending_count' => Appointment::where('status', 'pending')->count(),
            'week_count'    => (clone $active)->whereBetween('date', [now()->startOfWeek()->toDateString(), now()->endOfWeek()->toDateString()])->count(),
            'today'         => Appointment::with(['dentist', 'service', 'user'])
                                ->whereDate('date', today())->where('status', '!=', 'cancelled')
                                ->orderBy('start_time')->get(),
        ];
    }

    // ---------- helpers ----------

    private function checkDate(string $date): void
    {
        $min = Carbon::today()->addDays(self::MIN_DAYS_AHEAD);
        if (Carbon::parse($date)->lt($min)) {
            throw ValidationException::withMessages([
                'date' => 'Please pick a date at least ' . self::MIN_DAYS_AHEAD . ' days from today (' . $min->format('M d, Y') . ' or later).',
            ]);
        }
    }

    private function findSlot($dentistId, string $date, string $start): array
    {
        $slot = collect(Dentist::findOrFail($dentistId)->slotsFor($date))->firstWhere('start', $start);
        if (!$slot) {
            throw ValidationException::withMessages(['start_time' => 'That time is not in the dentist\'s schedule.']);
        }
        return $slot;
    }

    private function assertDentistOffersService($dentistId, $serviceId): void
    {
        if (!Dentist::whereKey($dentistId)->whereHas('services', fn ($query) => $query->whereKey($serviceId))->exists()) {
            throw ValidationException::withMessages([
                'service_id' => "This dentist doesn't offer that service.",
            ]);
        }
    }

    private function takenTimes($dentistId, string $date, $exclude = null): array
    {
        return Appointment::where('dentist_id', $dentistId)->where('date', $date)
            ->where('status', '!=', 'cancelled')
            ->when($exclude, fn ($q) => $q->where('id', '!=', $exclude))
            ->pluck('start_time')->all();
    }

    private function assertFree($dentistId, string $date, string $start, $exclude = null): void
    {
        $taken = Appointment::where('dentist_id', $dentistId)->where('date', $date)
            ->where('start_time', $start)->where('status', '!=', 'cancelled')
            ->when($exclude, fn ($q) => $q->where('id', '!=', $exclude))
            ->lockForUpdate()->exists();
        if ($taken) {
            throw $this->slotTakenError();
        }
    }

    private function slotTakenError(): ValidationException
    {
        return ValidationException::withMessages(['start_time' => 'Sorry, that slot was just taken. Pick another one.']);
    }

    private function authorizeAppt(Request $r, Appointment $a): void
    {
        abort_unless($r->user()->role === 'admin' || $a->user_id === $r->user()->id, 403, 'Not your appointment.');
    }

    /** Email + SMS confirmation. Sent after the response, so the patient never waits for Gmail/Semaphore. */
    private function notify(Appointment $a, string $event): void
    {
        SendAppointmentNotification::dispatchAfterResponse($a->id, $event);
    }
}
