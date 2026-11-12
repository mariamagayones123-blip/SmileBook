<?php
namespace Tests\Feature;

use App\Models\EmailVerificationOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/** Sign-up must prove the person owns the Gmail address before the account can be used. */
class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function payload(string $email = 'juan@gmail.com', string $password = 'Secret1!'): array
    {
        return ['name' => 'Juan Dela Cruz', 'email' => $email, 'phone' => '09171234567',
                'password' => $password, 'password_confirmation' => $password];
    }

    /** Replace whatever code was emailed with a known one, so the test can type it. */
    private function knownCode(string $email = 'juan@gmail.com', string $code = '123456'): EmailVerificationOtp
    {
        EmailVerificationOtp::query()->delete();
        return EmailVerificationOtp::create(['email' => $email, 'otp_hash' => Hash::make($code), 'expires_at' => now()->addMinutes(10)]);
    }

    private function verify(string $code, string $email = 'juan@gmail.com')
    {
        return $this->postJson('/api/verify-email', ['email' => $email, 'otp' => $code]);
    }

    public function test_register_makes_an_unverified_account_and_gives_no_token(): void
    {
        $res = $this->postJson('/api/register', $this->payload())->assertCreated();

        $res->assertJson(['needs_verification' => true, 'email' => 'juan@gmail.com']);
        $this->assertArrayNotHasKey('token', $res->json());
        $this->assertNull(User::first()->email_verified_at);
        $this->assertSame(1, EmailVerificationOtp::where('email', 'juan@gmail.com')->count());
    }

    public function test_cannot_log_in_before_verifying_but_gets_the_code_screen_signal(): void
    {
        $this->postJson('/api/register', $this->payload());

        $this->postJson('/api/login', ['email' => 'juan@gmail.com', 'password' => 'Secret1!'])
            ->assertStatus(403)->assertJson(['needs_verification' => true, 'email' => 'juan@gmail.com']);
        // a wrong password still looks like any other wrong password (no hint that the account exists)
        $this->postJson('/api/login', ['email' => 'juan@gmail.com', 'password' => 'Wrong1!'])
            ->assertStatus(422)->assertJsonMissing(['needs_verification' => true]);
    }

    public function test_correct_code_verifies_the_email_and_logs_in(): void
    {
        $this->postJson('/api/register', $this->payload());
        $this->knownCode();

        $this->verify('123456')->assertOk()->assertJsonStructure(['token', 'user']);

        $this->assertNotNull(User::first()->email_verified_at);
        $this->postJson('/api/login', ['email' => 'juan@gmail.com', 'password' => 'Secret1!'])->assertOk();
    }

    public function test_a_code_works_only_once(): void
    {
        $this->postJson('/api/register', $this->payload());
        $this->knownCode();
        $this->verify('123456')->assertOk();
        $this->verify('123456')->assertStatus(422)->assertJsonValidationErrors('otp');
    }

    public function test_wrong_codes_lock_the_code_after_five_tries(): void
    {
        $this->postJson('/api/register', $this->payload());
        $this->knownCode();
        for ($i = 0; $i < 5; $i++) {
            $this->verify('000000')->assertStatus(422)->assertJsonValidationErrors('otp');
        }
        $this->verify('123456')->assertStatus(422);      // right code, but this one is locked
        $this->assertNull(User::first()->email_verified_at);
    }

    public function test_expired_code_is_rejected(): void
    {
        $this->postJson('/api/register', $this->payload());
        $this->knownCode()->update(['expires_at' => now()->subMinute()]);
        $this->verify('123456')->assertStatus(422)->assertJsonValidationErrors('otp');
    }

    public function test_code_for_unknown_email_is_rejected(): void
    {
        $this->verify('123456', 'nobody@gmail.com')->assertStatus(422)->assertJsonValidationErrors('otp');
    }

    // ---------- squatting / takeover tries ----------

    public function test_nobody_can_overwrite_a_signup_while_its_code_is_still_alive(): void
    {
        // the real owner signs up and gets a code ...
        $this->postJson('/api/register', $this->payload('juan@gmail.com', 'Owner1!pass'));
        // ... an attacker signs up with the same Gmail and their own password
        $this->postJson('/api/register', $this->payload('juan@gmail.com', 'Hacker1!pass'))
            ->assertStatus(422)->assertJsonValidationErrors('email');

        $this->knownCode();
        $this->verify('123456')->assertOk();
        $this->assertTrue(Hash::check('Owner1!pass', User::first()->password));
        $this->assertFalse(Hash::check('Hacker1!pass', User::first()->password));
    }

    public function test_real_owner_can_sign_up_after_someone_squatted_their_email_and_the_code_expired(): void
    {
        $this->postJson('/api/register', $this->payload('juan@gmail.com', 'Hacker1!pass'));
        EmailVerificationOtp::query()->update(['expires_at' => now()->subMinute()]);
        RateLimiter::clear('verify-send:juan@gmail.com');

        $this->postJson('/api/register', $this->payload('juan@gmail.com', 'Owner1!pass'))->assertCreated();

        $this->assertSame(1, User::count());
        $this->assertTrue(Hash::check('Owner1!pass', User::first()->password));
        $this->assertFalse(Hash::check('Hacker1!pass', User::first()->password));
    }

    public function test_verified_email_cannot_be_signed_up_again(): void
    {
        $this->postJson('/api/register', $this->payload());
        User::first()->forceFill(['email_verified_at' => now()])->save();
        $this->postJson('/api/register', $this->payload('juan@gmail.com', 'Hacker1!pass'))
            ->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_account_linked_to_google_or_facebook_cannot_be_taken_over_by_signup(): void
    {
        User::create(['name' => 'Fb User', 'email' => 'juan@gmail.com', 'role' => 'patient', 'facebook_id' => 'fb-1']);
        $this->postJson('/api/register', $this->payload())->assertStatus(422)->assertJsonValidationErrors('email');
        $this->assertNull(User::first()->password);
    }

    // ---------- resend ----------

    public function test_resend_sends_a_new_code_but_not_twice_in_one_minute(): void
    {
        $this->postJson('/api/register', $this->payload());
        $this->assertSame(1, EmailVerificationOtp::count());

        RateLimiter::clear('verify-send:juan@gmail.com');              // pretend the minute has passed
        $this->postJson('/api/resend-verification', ['email' => 'juan@gmail.com'])->assertOk();
        $this->assertSame(2, EmailVerificationOtp::count());
        $this->assertSame(1, EmailVerificationOtp::whereNull('used_at')->count());   // old code was retired

        $this->postJson('/api/resend-verification', ['email' => 'juan@gmail.com'])->assertOk();
        $this->assertSame(2, EmailVerificationOtp::count());           // cooldown: nothing new was sent
    }

    public function test_resend_answers_the_same_for_unknown_emails(): void
    {
        $a = $this->postJson('/api/resend-verification', ['email' => 'nobody@gmail.com'])->assertOk();
        $this->postJson('/api/register', $this->payload());
        RateLimiter::clear('verify-send:juan@gmail.com');
        $b = $this->postJson('/api/resend-verification', ['email' => 'juan@gmail.com'])->assertOk();
        $this->assertSame($a->json('message'), $b->json('message'));
        $this->assertSame(0, EmailVerificationOtp::where('email', 'nobody@gmail.com')->count());
    }

    // ---------- other ways to prove the email ----------

    public function test_google_login_counts_as_a_verified_email(): void
    {
        config(['services.google.client_id' => 'test-client']);
        Http::fake([
            'oauth2.googleapis.com/*' => Http::response(['aud' => 'test-client']),
            'www.googleapis.com/*'    => Http::response(['sub' => 'g-1', 'email' => 'new@gmail.com', 'email_verified' => true, 'name' => 'New Person']),
        ]);

        $this->postJson('/api/auth/google', ['access_token' => 'abc'])->assertOk();

        $this->assertNotNull(User::where('email', 'new@gmail.com')->first()->email_verified_at);
    }

    public function test_finishing_a_password_reset_also_verifies_the_email(): void
    {
        $this->postJson('/api/register', $this->payload());
        $this->postJson('/api/forgot-password', ['email' => 'juan@gmail.com'])->assertOk();
        \App\Models\PasswordResetOtp::query()->delete();
        \App\Models\PasswordResetOtp::create(['email' => 'juan@gmail.com', 'otp_hash' => Hash::make('654321'), 'expires_at' => now()->addMinutes(10)]);

        $this->postJson('/api/reset-password', ['email' => 'juan@gmail.com', 'otp' => '654321',
            'password' => 'NewPass1!', 'password_confirmation' => 'NewPass1!'])->assertOk();

        $this->assertNotNull(User::first()->email_verified_at);
        $this->postJson('/api/login', ['email' => 'juan@gmail.com', 'password' => 'NewPass1!'])->assertOk();
    }
}
