<?php
namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Dentist;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AppointmentBookingTest extends TestCase
{
    use RefreshDatabase;

    private Dentist $dentist;
    private Service $service;
    private string $date;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dentist = Dentist::create([
            'name' => 'Dr. Test', 'specialty' => 'General', 'start_time' => '09:00', 'end_time' => '17:00',
            'slot_minutes' => 60, 'work_days' => [1, 2, 3, 4, 5],
        ]);
        $this->service = Service::create(['name' => 'Teeth Cleaning', 'price' => 500]);
        $this->dentist->services()->attach($this->service->id);

        // first weekday that is at least 3 days from today (the clinic requires 2+ days notice)
        $d = Carbon::today()->addDays(3);
        while (!in_array($d->dayOfWeek, [1, 2, 3, 4, 5])) $d->addDay();
        $this->date = $d->toDateString();
    }

    private function patient(string $email = 'p@test.com', string $phone = '09171234567'): User
    {
        return User::create(['name' => 'Pat Ient', 'email' => $email, 'phone' => $phone,
                             'password' => 'Secret1!', 'role' => 'patient']);
    }

    private function book(User $u, string $time = '10:00')
    {
        return $this->actingAs($u, 'sanctum')->postJson('/api/appointments', [
            'dentist_id' => $this->dentist->id, 'service_id' => $this->service->id,
            'date' => $this->date, 'start_time' => $time, 'payment_ref' => 'TEST-1',
        ]);
    }

    private function raw(User $u, string $status = 'pending', string $time = '10:00'): Appointment
    {
        return Appointment::create([
            'user_id' => $u->id, 'dentist_id' => $this->dentist->id, 'service_id' => $this->service->id,
            'date' => $this->date, 'start_time' => $time, 'end_time' => '11:00',
            'status' => $status, 'down_payment' => 200, 'payment_ref' => 'X',
        ]);
    }

    // ---------- double-booking ----------

    public function test_second_booking_for_the_same_slot_is_rejected(): void
    {
        $this->book($this->patient('a@test.com'))->assertCreated();
        $this->book($this->patient('b@test.com'))->assertStatus(422)->assertJsonValidationErrors('start_time');
        $this->assertSame(1, Appointment::count());
    }

    public function test_database_itself_refuses_a_double_booking(): void
    {
        $u = $this->patient();
        $this->raw($u);
        $this->expectException(UniqueConstraintViolationException::class);
        $this->raw($u);   // same dentist/date/time, bypassing the controller's check
    }

    public function test_cancelled_slot_can_be_booked_again(): void
    {
        $u = $this->patient();
        $this->raw($u, 'cancelled');
        $this->book($u)->assertCreated();
    }

    public function test_reapproving_a_cancelled_appointment_fails_if_the_slot_was_rebooked(): void
    {
        $u = $this->patient();
        $old = $this->raw($u, 'cancelled');
        $this->raw($this->patient('b@test.com'));   // someone else took the slot meanwhile

        $admin = User::create(['name' => 'Admin', 'email' => 'ad@test.com', 'phone' => '09170000000',
                               'password' => 'Secret1!', 'role' => 'admin']);
        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/appointments/{$old->id}/status", ['status' => 'approved'])
            ->assertStatus(422)->assertJsonValidationErrors('start_time');
        $this->assertSame('cancelled', $old->fresh()->status);
    }

    public function test_reapproving_a_cancelled_appointment_works_if_the_slot_is_still_free(): void
    {
        $old = $this->raw($this->patient(), 'cancelled');
        $admin = User::create(['name' => 'Admin', 'email' => 'ad@test.com', 'phone' => '09170000000',
                               'password' => 'Secret1!', 'role' => 'admin']);
        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/appointments/{$old->id}/status", ['status' => 'approved'])->assertOk();
        $this->assertSame('approved', $old->fresh()->status);
    }

    // ---------- "Done" only on the appointment day ----------

    private function admin(): User
    {
        return User::create(['name' => 'Admin', 'email' => 'ad@test.com', 'phone' => '09170000000',
                             'password' => 'Secret1!', 'role' => 'admin']);
    }

    private function approvedOn(string $date): Appointment
    {
        $a = $this->raw($this->patient(), 'approved');
        $a->update(['date' => $date]);
        return $a;
    }

    public function test_cannot_mark_a_future_appointment_as_done(): void
    {
        $a = $this->approvedOn(Carbon::today()->addDay()->toDateString());
        $this->actingAs($this->admin(), 'sanctum')->postJson("/api/admin/appointments/{$a->id}/status", ['status' => 'done'])
            ->assertStatus(422);
        $this->assertSame('approved', $a->fresh()->status);
    }

    public function test_can_mark_todays_appointment_as_done(): void
    {
        $a = $this->approvedOn(Carbon::today()->toDateString());
        $this->actingAs($this->admin(), 'sanctum')->postJson("/api/admin/appointments/{$a->id}/status", ['status' => 'done'])
            ->assertOk();
        $this->assertSame('done', $a->fresh()->status);
    }

    public function test_can_mark_a_past_unmarked_appointment_as_done(): void
    {
        $a = $this->approvedOn(Carbon::today()->subDays(2)->toDateString());
        $this->actingAs($this->admin(), 'sanctum')->postJson("/api/admin/appointments/{$a->id}/status", ['status' => 'done'])
            ->assertOk();
    }

    // ---------- notifications ----------

    public function test_booking_sends_an_email_and_an_sms(): void
    {
        config(['services.semaphore.key' => 'test-key']);
        Http::fake(['api.semaphore.co/*' => Http::response([['message_id' => 1, 'status' => 'Pending']], 200)]);

        $this->book($this->patient())->assertCreated();

        Http::assertSent(fn ($req) => $req->url() === 'https://api.semaphore.co/api/v4/messages'
            && $req['number'] === '09171234567' && str_contains($req['message'], 'booked (pending approval)'));
        $this->assertCount(1, Mail::mailer('array')->getSymfonyTransport()->messages());
    }

    public function test_booking_still_succeeds_when_the_sms_provider_is_down(): void
    {
        config(['services.semaphore.key' => 'test-key']);
        Http::fake(['api.semaphore.co/*' => Http::response('Server error', 500)]);

        $this->book($this->patient())->assertCreated();
        $this->assertSame(1, Appointment::count());
    }
}
