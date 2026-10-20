<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Counts wrong guesses for each password-reset code (see AuthController::resetPassword).
return new class extends Migration {
    public function up(): void
    {
        Schema::table('password_reset_otps', function (Blueprint $t) {
            $t->unsignedTinyInteger('attempts')->default(0)->after('otp_hash');
        });
    }

    public function down(): void
    {
        Schema::table('password_reset_otps', function (Blueprint $t) {
            $t->dropColumn('attempts');
        });
    }
};
