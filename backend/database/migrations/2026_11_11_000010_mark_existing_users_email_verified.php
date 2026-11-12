<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * New sign-ups must now verify their email. Accounts that already exist were created before that rule,
 * so they are marked as verified; otherwise every current patient and the admin would be locked out.
 *
 * (Stricter option: delete this migration's update to make existing patients verify at their next login.)
 */
return new class extends Migration {
    public function up(): void
    {
        DB::table('users')->whereNull('email_verified_at')->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        // Nothing to undo: we cannot know which accounts were unverified before.
    }
};
