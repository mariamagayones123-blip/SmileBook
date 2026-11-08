<?php
namespace App\Jobs;

use App\Models\Appointment;
use App\Services\EmailService;
use App\Services\SmsService;
use Carbon\Carbon;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;
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
        // Runs after the response is sent. Whatever goes wrong here must never surface as an error to the patient.
        try {
            $this->send();
        } catch (Throwable $e) {
            Log::warning("Appointment #{$this->appointmentId} notification failed: " . $e->getMessage());
        }
    }

    private function send(): void
    {
        $a = Appointment::with(['user', 'dentist', 'service'])->find($this->appointmentId);
        if (!$a || !$a->user || !$a->dentist || !$a->service) {
            return;
        }

        $date  = $a->date->format('F j, Y');
        $start = Carbon::parse($a->start_time)->format('g:i A');
        $time  = $a->end_time
            ? $start . ' to ' . Carbon::parse($a->end_time)->format('g:i A')
            : $start;

        // Formal wording per event: [subject, opening sentence]
        [$subject, $line] = match (true) {
            $this->event === 'approved' => [
                'Appointment Approved - SmileBook',
                'We are pleased to inform you that your appointment has been approved.',
            ],
            $this->event === 'rescheduled' => [
                'Appointment Rescheduled - SmileBook',
                $a->status === 'pending'
                    ? 'Your appointment has been rescheduled. Please note that the new schedule is subject to approval by our clinic. The updated details are below.'
                    : 'Your appointment has been successfully rescheduled. The updated details are below.',
            ],
            $this->event === 'cancelled' => [
                'Appointment Cancelled - SmileBook',
                'This is to confirm that your appointment has been cancelled.',
            ],
            default => [
                'Appointment Received - SmileBook',
                'Thank you for booking with SmileBook. Your appointment request has been received and is awaiting approval by our clinic.',
            ],
        };

        // Full formal message for email
        $email = "Dear {$a->user->name},\n\n"
               . "{$line}\n\n"
               . "Appointment Details\n"
               . "Reference No.: #{$a->id}\n"
               . "Service: {$a->service->name}\n"
               . "Dentist: {$a->dentist->name}\n"
               . "Date: {$date}\n"
               . "Time: {$time}\n"
               . "Status: " . ($a->status === 'pending' ? 'Pending approval' : ucfirst($a->status)) . "\n\n"
               . "If you have any questions or need to make changes, please log in to your SmileBook account or contact the clinic.\n\n"
               . "Sincerely,\n"
               . "SmileBook Dental Clinic";

        // Short version for SMS (keeps the message cheap and within one or two texts)
        $msg = "SmileBook: Dear {$a->user->name}, your {$a->service->name} with {$a->dentist->name} on {$date} at {$start} is {$this->event}. Ref #{$a->id}.";

        // Email and SMS are independent: if one fails, the other still goes out.
        try {
            EmailService::send($a->user->email, $subject, $email);
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
