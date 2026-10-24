<?php
namespace App\Jobs;

use App\Models\Appointment;
use App\Services\SmsService;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Email + SMS for an appointment event.
 *
 * Dispatched with ::dispatchAfterResponse(), so the patient gets their answer
 * right away and Gmail/Semaphore run afterwards. No queue worker is needed.
 * (To move this to a real queue later: add `implements ShouldQueue` + `use Queueable`,
 * call ::dispatch() instead, and run `php artisan queue:work`.)
 */
class SendAppointmentNotification
{
    use Dispatchable;

    public function __construct(public int $appointmentId, public string $event) {}

    public function handle(): void
    {
        $a = Appointment::with(['user', 'dentist', 'service'])->find($this->appointmentId);
        if (!$a || !$a->user || !$a->dentist || !$a->service) {
            return;
        }

        $msg = "SmileBook: Hi {$a->user->name}, your {$a->service->name} with {$a->dentist->name} on "
             . $a->date->format('M d, Y') . " at {$a->start_time} is {$this->event}. Ref #{$a->id}.";

        // Email and SMS are independent: if one fails, the other still goes out.
        try {
            Mail::raw($msg, fn ($m) => $m->to($a->user->email)->subject('SmileBook Appointment Update'));
        } catch (Throwable $e) {
            Log::warning("Appointment #{$a->id} email failed: " . $e->getMessage());
        }

        try {
            SmsService::send($a->user->phone, $msg);
        } catch (Throwable $e) {
            Log::warning("Appointment #{$a->id} SMS failed: " . $e->getMessage());
        }
    }
}
