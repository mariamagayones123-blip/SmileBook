<?php
namespace Database\Seeders;

use App\Models\Dentist;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create(['name' => 'Clinic Admin', 'email' => 'admin@smilebook.test', 'phone' => '09170000000',
                      'password' => 'admin123', 'role' => 'admin']);
        User::create(['name' => 'Demo Patient', 'email' => 'patient@smilebook.test', 'phone' => '09171234567',
                      'password' => 'patient123', 'role' => 'patient']);

        // 3 dentists with different schedules (teacher's requirement)
        Dentist::create(['name' => 'Dr. Maria Santos', 'specialty' => 'General Dentistry',
            'start_time' => '09:00', 'end_time' => '17:00', 'slot_minutes' => 60, 'work_days' => [1, 2, 3, 4, 5]]);
        Dentist::create(['name' => 'Dr. Jose Reyes', 'specialty' => 'Orthodontics (Braces)',
            'start_time' => '12:30', 'end_time' => '18:30', 'slot_minutes' => 60, 'work_days' => [1, 2, 3, 4, 5, 6]]);
        Dentist::create(['name' => 'Dr. Ana Cruz', 'specialty' => 'Oral Surgery',
            'start_time' => '10:00', 'end_time' => '16:00', 'slot_minutes' => 60, 'work_days' => [2, 3, 4, 5, 6]]);

        $this->call(ServiceSeeder::class);
        $this->call(DentistServiceSeeder::class);   // links each dentist to the services they offer
    }
}
