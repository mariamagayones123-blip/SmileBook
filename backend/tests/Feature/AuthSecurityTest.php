<?php
namespace Tests\Feature;

use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::create(['name' => 'Pat Ient', 'email' => 'p@gmail.com', 'phone' => '09171234567',
                             'password' => 'Secret1!', 'role' => 'patient']);
    }

    private function otp(string $code = '123456'): PasswordResetOtp
    {
        return PasswordResetOtp::create(['email' => 'p@gmail.com', 'otp_hash' => Hash::make($code),
                                         'expires_at' => now()->addMinutes(10)]);
    }

    private function reset(string $otp, string $password = 'NewPass1!')
    {
        return $this->postJson('/api/reset-password', [
            'email' => 'p@gmail.com', 'otp' => $otp, 'password' => $password, 'password_confirmation' => $password,
        ]);
    }

    // ---------- login throttle ----------

    public function test_login_is_locked_after_five_wrong_passwords(): void
    {
        $this->user();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'p@gmail.com', 'password' => 'wrong'])
                ->assertStatus(422)->assertJsonValidationErrors('email');
        }
        // 6th try is blocked, even with the CORRECT password
        $res = $this->postJson('/api/login', ['email' => 'p@gmail.com', 'password' => 'Secret1!']);
        $res->assertStatus(422);
        $this->assertStringContainsString('Too many login attempts', $res->json('errors.email.0'));
    }

    public function test_successful_login_resets_the_counter(): void
    {
        $this->user();
        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/api/login', ['email' => 'p@gmail.com', 'password' => 'wrong']);
        }
        $this->postJson('/api/login', ['email' => 'p@gmail.com', 'password' => 'Secret1!'])->assertOk()->assertJsonStructure(['token']);
        // counter was cleared, so we get 5 fresh wrong tries again
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'p@gmail.com', 'password' => 'wrong'])
                ->assertJsonPath('errors.email.0', 'Wrong email or password.');
        }
    }

    public function test_another_email_is_not_locked_out(): void
    {
        $this->user();
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/login', ['email' => 'p@gmail.com', 'password' => 'wrong']);
        }
        $this->postJson('/api/login', ['email' => 'other@test.com', 'password' => 'wrong'])
            ->assertJsonPath('errors.email.0', 'Wrong email or password.');
    }

    // ---------- password reset ----------

    public function test_reset_password_rejects_a_weak_password(): void
    {
        $this->user(); $this->otp();
        $this->reset('123456', 'abcdef')->assertStatus(422)->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check('Secret1!', User::first()->password));
    }

    public function test_reset_password_works_with_correct_code_and_strong_password(): void
    {
        $this->user(); $this->otp();
        $this->reset('123456')->assertOk();
        $this->assertTrue(Hash::check('NewPass1!', User::first()->password));
    }

    // ---------- OTP attempt limit ----------

    public function test_code_is_locked_after_five_wrong_guesses_even_if_the_right_code_comes_later(): void
    {
        $this->user(); $otp = $this->otp('123456');
        for ($i = 0; $i < 5; $i++) {
            $this->reset('000000')->assertStatus(422)->assertJsonValidationErrors('otp');
        }
        $this->assertSame(5, $otp->fresh()->attempts);

        $res = $this->reset('123456');   // correct code, but too late
        $res->assertStatus(422);
        $this->assertStringContainsString('Too many wrong attempts', $res->json('errors.otp.0'));
        $this->assertTrue(Hash::check('Secret1!', User::first()->password));
    }

    public function test_requesting_a_new_code_gives_a_fresh_set_of_attempts(): void
    {
        $this->user(); $old = $this->otp('123456');
        $old->update(['attempts' => 5]);
        $old->update(['used_at' => now()]);   // what forgotPassword() does to the previous code
        $this->otp('654321');
        $this->reset('654321')->assertOk();
    }

    // ---------- Gmail-only + lowercase email ----------

    private function registerPayload(string $email): array
    {
        return ['name' => 'Juan Dela Cruz', 'email' => $email, 'phone' => '09171234567',
                'password' => 'Secret1!', 'password_confirmation' => 'Secret1!'];
    }

    public function test_register_rejects_non_gmail_and_incomplete_gmail(): void
    {
        foreach (['juan@yahoo.com', 'juan@gmail', 'juan@gmail.co', 'juan@'] as $email) {
            $this->postJson('/api/register', $this->registerPayload($email))
                ->assertStatus(422)->assertJsonValidationErrors('email');
        }
        $this->assertSame(0, User::count());
    }

    public function test_register_saves_email_in_lowercase_and_blocks_the_same_email_in_other_case(): void
    {
        $this->postJson('/api/register', $this->registerPayload('Juan@Gmail.com'))->assertOk();
        $this->assertSame('juan@gmail.com', User::first()->email);

        $this->postJson('/api/register', $this->registerPayload('JUAN@gmail.com'))
            ->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_forgot_password_only_accepts_a_complete_gmail(): void
    {
        $this->user();
        foreach (['p@test.com', 'p@gmail', 'p@gmail.co'] as $email) {
            $this->postJson('/api/forgot-password', ['email' => $email])
                ->assertStatus(422)->assertJsonValidationErrors('email');
        }
    }

    public function test_forgot_and_reset_password_work_whatever_the_email_case(): void
    {
        $this->user();
        $this->postJson('/api/forgot-password', ['email' => 'P@Gmail.com'])->assertOk();
        $this->assertSame(1, PasswordResetOtp::where('email', 'p@gmail.com')->count());

        // Remove the random code that was just created, so the known test code is the only one.
        PasswordResetOtp::query()->delete();
        $this->otp();
        $this->postJson('/api/reset-password', [
            'email' => 'P@GMAIL.COM', 'otp' => '123456', 'password' => 'NewPass1!', 'password_confirmation' => 'NewPass1!',
        ])->assertOk();
        $this->assertTrue(Hash::check('NewPass1!', User::first()->password));
    }

    // ---------- CORS ----------

    public function test_cors_allows_the_configured_frontend_only(): void
    {
        config(['cors.allowed_origins' => ['https://smilebook.example.com', 'https://www.smilebook.example.com'], 'cors.allowed_origins_patterns' => []]);

        $ok = $this->call('OPTIONS', '/api/login', [], [], [], [
            'HTTP_ORIGIN' => 'https://smilebook.example.com',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);
        $this->assertSame('https://smilebook.example.com', $ok->headers->get('Access-Control-Allow-Origin'));

        $bad = $this->call('OPTIONS', '/api/login', [], [], [], [
            'HTTP_ORIGIN' => 'https://evil.example.com',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);
        $this->assertNull($bad->headers->get('Access-Control-Allow-Origin'));
    }
}