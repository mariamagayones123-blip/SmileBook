<?php

namespace Database\Seeders;

use App\Models\Dentist;
use App\Models\Service;
use Illuminate\Database\Seeder;

class DentistServiceSeeder extends Seeder
{
    public function run(): void
    {
        $dentistsBySpecialty = [
            'general' => [],
            'orthodontics' => [],
            'oral_surgery' => [],
        ];
        foreach (Dentist::all() as $dentist) {
            $specialty = strtolower($dentist->specialty);
            if (str_contains($specialty, 'general')) {
                $dentistsBySpecialty['general'][] = $dentist;
            } elseif (str_contains($specialty, 'orthodont')) {
                $dentistsBySpecialty['orthodontics'][] = $dentist;
            } elseif (str_contains($specialty, 'oral surgery')) {
                $dentistsBySpecialty['oral_surgery'][] = $dentist;
            }
        }

        foreach (Service::all() as $service) {
            $category = $service->category;
            if (!in_array($category, ['General & Preventive', 'Orthodontics', 'Oral Surgery'], true)) {
                $name = strtolower($service->name);
                $category = str_contains($name, 'braces') || str_contains($name, 'retainer')
                    ? 'Orthodontics'
                    : (str_contains($name, 'extraction') || str_contains($name, 'wisdom')
                        ? 'Oral Surgery'
                        : 'General & Preventive');
            }

            $matchingDentists = match ($category) {
                'Orthodontics' => $dentistsBySpecialty['orthodontics'],
                'Oral Surgery' => $dentistsBySpecialty['oral_surgery'],
                default => array_merge(
                    $dentistsBySpecialty['general'],
                    $dentistsBySpecialty['orthodontics'],
                    $dentistsBySpecialty['oral_surgery']
                ),
            };

            foreach ($matchingDentists as $dentist) {
                $dentist->services()->syncWithoutDetaching([$service->id]);
            }
        }
    }
}
