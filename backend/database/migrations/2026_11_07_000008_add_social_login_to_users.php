<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Google / Facebook sign-in: remember each provider's user id, and allow accounts without a password.
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $t) {
            $t->string('google_id')->nullable()->unique();
            $t->string('facebook_id')->nullable()->unique();
            $t->string('password')->nullable()->change();
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $t) {
            $t->dropUnique(['google_id']);
            $t->dropUnique(['facebook_id']);
            $t->dropColumn(['google_id', 'facebook_id']);
        });
    }
};
