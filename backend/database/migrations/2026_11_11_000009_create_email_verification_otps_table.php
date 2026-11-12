<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Codes that confirm a new patient owns the Gmail address they signed up with.
return new class extends Migration {
    public function up(): void
    {
        Schema::create('email_verification_otps', function (Blueprint $t) {
            $t->id();
            $t->string('email', 120)->index();
            $t->string('otp_hash');
            $t->unsignedTinyInteger('attempts')->default(0);   // wrong guesses for this code
            $t->timestamp('expires_at');
            $t->timestamp('used_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_verification_otps');
    }
};
