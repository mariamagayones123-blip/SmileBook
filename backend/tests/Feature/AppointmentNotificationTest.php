<?php
namespace Tests\Feature;

use App\Jobs\SendAppointmentNotification;
use App\Models\Appointment;
use App\Models\Dentist;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AppointmentNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function appointment(string $status = 'pending', string $start = '13:30', string $end = '14:30'): Appointment
    {
        $dentist = Dentist::create(['name' => 'Dr. Maria Santos', 'specialty' => 'General', 'start_time' => '08:30',
            'end_time' => '17:00', 'slot_minutes' => 60, 'work_days' => [1, 2, 3, 4, 5]]);
        $service = Service::create(['name' => 'Teeth Cleaning', 'price' => 500]);
        $user = User::create(['name' => 'Mark Lorence Magayones', 'email' => 'p@test.com', 'phone' => '09171234567',
            'password' => 'Secret1!', 'role' => 'patient']);

        return Appointment::create(['user_id' => $user->id, 'dentist_id' => $dentist->id, 'service_id' => $service->id,
            'date' => '2026-11-17', 'start_time' => $start, 'end_time' => $end, 'status' => $status,
            'down_payment' => 200, 'payment_ref' => 'X']);
    }

    private function sentEmail(): object
    {
        $messages = Mail::mailer('array')->getSymfonyTransport()->messages();
        $this->assertCount(1, $messages);
        return $messages[0]->getOriginalMessage();
    }

    public function test_approved_email_is_formal_and_shows_am_pm(): void
    {
        $a = $this->appointment('approved', '08:30', '09:30');
        (new SendAppointmentNotification($a->id, 'approved'))->handle();

        $mail = $this->sentEmail();
        $this->assertSame('Appointment Approved - SmileBook', $mail->getSubject());
        $body = $mail->getTextBody();
        $this->assertStringContainsString('Dear Mark Lorence Magayones,', $body);
        $this->assertStringContainsString('Date: November 17, 2026', $body);
        $this->assertStringContainsString('Time: 8:30 AM to 9:30 AM', $body);
        $this->assertStringContainsString('Status: Approved', $body);
    }

    public function test_afternoon_time_shows_pm(): void
    {
        $a = $this->appointment('approved', '13:30', '14:30');
        (new SendAppointmentNotification($a->id, 'approved'))->handle();

        $this->assertStringContainsString('Time: 1:30 PM to 2:30 PM', $this->sentEmail()->getTextBody());
    }

    public function test_patient_reschedule_email_says_it_needs_approval(): void
    {
        $a = $this->appointment('pending');
        (new SendAppointmentNotification($a->id, 'rescheduled'))->handle();

        $mail = $this->sentEmail();
        $this->assertSame('Appointment Rescheduled - SmileBook', $mail->getSubject());
        $this->assertStringContainsString('subject to approval', $mail->getTextBody());
        $this->assertStringContainsString('Status: Pending approval', $mail->getTextBody());
    }

    public function test_cancelled_email(): void
    {
        $a = $this->appointment('cancelled');
        (new SendAppointmentNotification($a->id, 'cancelled'))->handle();

        $mail = $this->sentEmail();
        $this->assertSame('Appointment Cancelled - SmileBook', $mail->getSubject());
        $this->assertStringContainsString('Status: Cancelled', $mail->getTextBody());
    }

    public function test_new_booking_email(): void
    {
        $a = $this->appointment('pending');
        (new SendAppointmentNotification($a->id, 'booked (pending approval)'))->handle();

        $this->assertSame('Appointment Received - SmileBook', $this->sentEmail()->getSubject());
    }

    public function test_a_missing_appointment_does_not_throw(): void
    {
        (new SendAppointmentNotification(999999, 'approved'))->handle();

        $this->assertCount(0, Mail::mailer('array')->getSymfonyTransport()->messages());
    }

    public function test_bad_data_never_throws(): void
    {
        $a = $this->appointment('approved', 'not-a-time', 'also-bad');
        (new SendAppointmentNotification($a->id, 'approved'))->handle();

        $this->assertTrue(true); // reaching this line means nothing blew up
    }
}
