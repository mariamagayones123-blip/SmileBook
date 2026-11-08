<?php
namespace Database\Seeders;

use App\Models\Dentist;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Real database (Supabase): set ADMIN_EMAIL and ADMIN_PASSWORD in .env, then seed. No demo accounts.
        // Local testing only: SEED_DEMO_ACCOUNTS=true creates admin@smilebook.test (admin123) and patient@smilebook.test (patient123).
        // Running the seeder twice would crash on the duplicate admin email, so stop politely instead.
        if (User::where('role', 'admin')->exists() || Dentist::exists()) {
            $this->command?->warn('The database already has data, so seeding was skipped. To start over: php artisan migrate:fresh --seed');
            return;
        }

        // Demo accounts (weak, well-known passwords) are never created in production.
        $demo = filter_var(env('SEED_DEMO_ACCOUNTS', false), FILTER_VALIDATE_BOOLEAN) && !app()->environment('production');
        $adminEmail = strtolower(trim((string) env('ADMIN_EMAIL', '')));
        $adminPassword = (string) env('ADMIN_PASSWORD', '');

        if (!$demo) {
            if ($adminEmail === '' || strlen($adminPassword) < 8) {
                throw new RuntimeException('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters) in backend/.env before seeding. '
                    . 'For throw-away local testing you can set SEED_DEMO_ACCOUNTS=true instead.');
            }
        } else {
            $adminEmail = $adminEmail ?: 'admin@smilebook.test';
            $adminPassword = $adminPassword ?: 'admin123';
        }

        User::create(['name' => 'Clinic Admin', 'email' => $adminEmail, 'phone' => env('ADMIN_PHONE', '09170000000'),
                      'password' => $adminPassword, 'role' => 'admin']);

        if ($demo) {
            User::create(['name' => 'Demo Patient', 'email' => 'patient@smilebook.test', 'phone' => '09171234567',
                          'password' => 'patient123', 'role' => 'patient']);
        }

        // Clinic hours: Mon-Fri 7:30 AM - 6:00 PM, Saturday 7:30 AM - 12 NN (Saturday cap is applied in Dentist::slotsFor)
        Dentist::create(['name' => 'Dr. Maria Santos', 'specialty' => 'General Dentistry',
            'start_time' => '07:30', 'end_time' => '18:00', 'slot_minutes' => 60, 'work_days' => [1, 2, 3, 4, 5, 6]]);
        Dentist::create(['name' => 'Dr. Jose Reyes', 'specialty' => 'Orthodontics (Braces)',
            'start_time' => '07:30', 'end_time' => '18:00', 'slot_minutes' => 60, 'work_days' => [1, 2, 3, 4, 5, 6]]);
        Dentist::create(['name' => 'Dr. Ana Cruz', 'specialty' => 'Oral Surgery',
            'start_time' => '07:30', 'end_time' => '18:00', 'slot_minutes' => 60, 'work_days' => [1, 2, 3, 4, 5, 6]]);

        $this->call(ServiceSeeder::class);
        $this->call(DentistServiceSeeder::class);   // links each dentist to the services they offer
    }
}
