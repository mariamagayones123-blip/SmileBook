<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** 6-digit code emailed at sign-up to prove the person owns the Gmail address (see AuthController::verifyEmail). */
class EmailVerificationOtp extends Model
{
    protected $fillable = ['email', 'otp_hash', 'expires_at', 'used_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }
}
