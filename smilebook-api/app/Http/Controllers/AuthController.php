<?php
namespace App\Http\Controllers;

use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5;   // wrong passwords per email+IP before a 1-minute lockout
    private const MAX_OTP_ATTEMPTS = 5;     // wrong codes allowed per reset code

    /** Same password rules for sign-up and password reset. */
    private function passwordRules(): array
    {
        return [
            'required', 'string', 'min:6', 'confirmed',
            'regex:/[A-Z]/',          // uppercase letter
            'regex:/[a-z]/',          // lowercase letter
            'regex:/[0-9]/',          // number
            'regex:/[^A-Za-z0-9\s]/', // special character
        ];
    }

    private function passwordMessages(): array
    {
        return [
            'password.min'   => 'Password must be at least 6 characters long.',
            'password.regex' => 'Password must include an uppercase letter, a lowercase letter, a number, and a special character.',
            'password.confirmed' => 'Passwords do not match.',
        ];
    }

    /** Forgot password only accepts a complete Gmail address (name@gmail.com). */
    private function gmailRule(): string
    {
        return 'regex:/^[A-Za-z0-9._%+\-]+@gmail\.com$/i';
    }

    private function gmailMessages(): array
    {
        return [
            'email.email' => 'Please enter a complete Gmail address, like yourname@gmail.com.',
            'email.regex' => 'Please enter a complete Gmail address, like yourname@gmail.com.',
        ];
    }

    /** Emails are stored and compared in lowercase, so Juan@Gmail.com and juan@gmail.com are the same account. */
    private function cleanEmail(Request $r): void
    {
        if (is_string($r->input('email'))) {
            $r->merge(['email' => strtolower(trim($r->input('email')))]);
        }
    }

    /** Case-insensitive lookup, so older accounts saved with capital letters are still found. */
    private function findUserByEmail(string $email): ?User
    {
        return User::whereRaw('LOWER(email) = ?', [strtolower($email)])->first();
    }

    public function register(Request $r)
    {
        $this->cleanEmail($r);
        $data = $r->validate([
            'name'     => [
                'required', 'string', 'max:100',
                // Numbers get their own message; anything else outside letters, spaces, hyphens and apostrophes is rejected too.
                function ($attribute, $value, $fail) {
                    if (preg_match('/\d/', $value)) {
                        $fail('Name must not contain numbers.');
                    } elseif (!preg_match("/^[\pL\s'’-]+$/u", $value) || !preg_match('/\pL/u', $value)) {
                        $fail('Name can only contain letters, spaces, hyphens, and apostrophes.');
                    }
                },
            ],
            'email'    => ['required', 'email', $this->gmailRule(), 'unique:users'],
            'phone'    => ['required', 'regex:/^(09|\+639)\d{9}$/'],
            'password' => $this->passwordRules(),
        ], [
            'phone.required' => 'Please enter a valid mobile number.',
            'phone.regex'    => 'Please enter a valid mobile number.',
        ] + $this->passwordMessages() + $this->gmailMessages());

        $user = User::create($data + ['role' => 'patient']);
        return ['token' => $user->createToken('smilebook')->plainTextToken, 'user' => $user];
    }

    public function login(Request $r)
    {
        $this->cleanEmail($r);
        $r->validate(['email' => 'required|email', 'password' => 'required']);

        // Slow down password guessing: max 5 wrong tries per email+IP, then wait a minute.
        $key = 'login:' . strtolower($r->email) . '|' . $r->ip();
        if (RateLimiter::tooManyAttempts($key, self::MAX_LOGIN_ATTEMPTS)) {
            $secs = RateLimiter::availableIn($key);
            throw ValidationException::withMessages(['email' => "Too many login attempts. Please try again in $secs seconds."]);
        }

        $user = $this->findUserByEmail($r->email);
        if (!$user || !Hash::check($r->password, $user->password)) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['email' => 'Wrong email or password.']);
        }
        RateLimiter::clear($key);
        return ['token' => $user->createToken('smilebook')->plainTextToken, 'user' => $user];
    }

    public function me(Request $r)     { return $r->user(); }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();
        return ['message' => 'Logged out'];
    }

    public function forgotPassword(Request $r)
    {
        $this->cleanEmail($r);
        $data = $r->validate(
            ['email' => ['required', 'email', $this->gmailRule()]],
            $this->gmailMessages()
        );
        $user = $this->findUserByEmail($data['email']);
        $message = 'If that email is registered, we sent a 6-digit code to it. Check your Gmail inbox.';

        if (!$user) {
            return ['message' => $message];
        }

        $otp = (string) random_int(100000, 999999);
        PasswordResetOtp::where('email', $user->email)->whereNull('used_at')->update(['used_at' => now()]);
        PasswordResetOtp::create([
            'email' => $user->email,
            'otp_hash' => Hash::make($otp),
            'expires_at' => now()->addMinutes(10),
        ]);

        try {
            Mail::raw(
                "Hi {$user->name},\n\nYour SmileBook password reset code is {$otp}.\nIt expires in 10 minutes.\n\nIf you did not request this, you can ignore this email.",
                fn ($m) => $m->to($user->email)->subject('SmileBook password reset code')
            );
        } catch (\Throwable $e) {
            Log::warning('Password reset mail failed: ' . $e->getMessage());
            return response()->json(['message' => 'We could not send the email right now. Please try again.'], 500);
        }

        return ['message' => $message];
    }

    public function resetPassword(Request $r)
    {
        $this->cleanEmail($r);
        $data = $r->validate([
            'email' => ['required', 'email', $this->gmailRule()],
            'otp' => 'required|digits:6',
            'password' => $this->passwordRules(),
        ], $this->passwordMessages() + $this->gmailMessages());

        $user = $this->findUserByEmail($data['email']);
        $reset = $user
            ? PasswordResetOtp::where('email', $user->email)->whereNull('used_at')->latest()->first()
            : null;

        if (!$reset || $reset->expires_at->isPast()) {
            throw ValidationException::withMessages(['otp' => 'That code is invalid or has expired.']);
        }

        // Each code allows only a few wrong guesses; after that the user must request a new one.
        if ($reset->attempts >= self::MAX_OTP_ATTEMPTS) {
            throw ValidationException::withMessages(['otp' => 'Too many wrong attempts. Please request a new code.']);
        }

        if (!Hash::check($data['otp'], $reset->otp_hash)) {
            $reset->increment('attempts');
            $left = self::MAX_OTP_ATTEMPTS - $reset->attempts;
            throw ValidationException::withMessages(['otp' => $left > 0
                ? "That code is invalid or has expired. $left attempt(s) left."
                : 'Too many wrong attempts. Please request a new code.']);
        }

        $user->update(['password' => $data['password']]);
        $reset->update(['used_at' => now()]);
        $user->tokens()->delete();

        return ['message' => 'Your password was updated. You can log in with the new password.'];
    }
}
