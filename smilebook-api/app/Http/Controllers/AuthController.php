<?php
namespace App\Http\Controllers;

use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $r)
    {
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
            'email'    => 'required|email|unique:users',
            'phone'    => ['required', 'regex:/^(09|\+639)\d{9}$/'],
            'password' => [
                'required', 'string', 'min:6', 'confirmed',
                'regex:/[A-Z]/',          // uppercase letter
                'regex:/[a-z]/',          // lowercase letter
                'regex:/[0-9]/',          // number
                'regex:/[^A-Za-z0-9\s]/', // special character
            ],
        ], [
            'phone.required' => 'Please enter a valid mobile number.',
            'phone.regex'    => 'Please enter a valid mobile number.',
            'password.min'   => 'Password must be at least 6 characters long.',
            'password.regex' => 'Password must include an uppercase letter, a lowercase letter, a number, and a special character.',
            'password.confirmed' => 'Passwords do not match.',
        ]);

        $user = User::create($data + ['role' => 'patient']);
        return ['token' => $user->createToken('smilebook')->plainTextToken, 'user' => $user];
    }

    public function login(Request $r)
    {
        $r->validate(['email' => 'required|email', 'password' => 'required']);
        $user = User::where('email', $r->email)->first();
        if (!$user || !Hash::check($r->password, $user->password)) {
            throw ValidationException::withMessages(['email' => 'Wrong email or password.']);
        }
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
        $data = $r->validate(['email' => 'required|email']);
        $user = User::where('email', $data['email'])->first();
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
        $data = $r->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $reset = PasswordResetOtp::where('email', $data['email'])
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (!$reset || $reset->expires_at->isPast() || !Hash::check($data['otp'], $reset->otp_hash)) {
            throw ValidationException::withMessages(['otp' => 'That code is invalid or has expired.']);
        }

        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            throw ValidationException::withMessages(['email' => 'No account was found for that email.']);
        }

        $user->update(['password' => $data['password']]);
        $reset->update(['used_at' => now()]);
        $user->tokens()->delete();

        return ['message' => 'Your password was updated. You can log in with the new password.'];
    }
}
