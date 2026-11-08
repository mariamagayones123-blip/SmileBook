<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        // [name, category, description, price]. Order matters: on a fresh database the first one gets ID 1.
        $services = [
            ['Teeth Cleaning', 'General & Preventive', 'Removal of plaque, tartar, and surface stains to help maintain healthy teeth and gums.', 800],
            ['Tooth Extraction', 'Oral Surgery', 'Simple extraction', 1200],
            ['Braces Check-up', 'Orthodontics', 'Monthly adjustment', 1000],
            ['Dental Check-up', 'General & Preventive', 'Examination of the teeth and gums to assess oral health and identify potential dental problems.', 500],
            ['Tooth Filling', 'General & Preventive', 'Restoration of a decayed or damaged tooth using composite resin filling material.', 1000],
            ['Alveoloplasty', 'Oral Surgery', 'Smoothing and reshaping the jawbone, often before dentures.', 5000],
            ['Retained Root Removal', 'Oral Surgery', 'Removal of a remaining tooth-root fragment when indicated.', 2500],
            ['Metal Braces Installation', 'Orthodontics', 'Installation of traditional metal braces to help correct teeth alignment and bite problems.', 30000],
            ['Braces Adjustment', 'Orthodontics', 'Routine adjustment of braces to monitor and guide teeth movement during treatment.', 1000],
            ['Complete Dentures', 'General & Preventive', 'Replaces all missing teeth in the upper or lower jaw.', 15000],
            ['Fluoride Treatment', 'General & Preventive', 'Helps strengthen tooth enamel and prevent tooth decay.', 800],
            ['Jacket / Porcelain Crown', 'General & Preventive', 'Covers and protects damaged teeth while restoring their shape and appearance.', 15000],
            ['Retainers', 'Orthodontics', 'Keeps teeth in their proper position after braces.', 3000],
            ['Ceramic Braces Installation', 'Orthodontics', 'Installs tooth-colored braces to correct teeth alignment.', 40000],
            ['Clear Aligners', 'Orthodontics', 'Uses transparent trays to gradually straighten teeth.', 80000],
            ['Wisdom Tooth Removal', 'Oral Surgery', 'Removes wisdom teeth that cause pain or other dental problems.', 5000],
            ['Surgical Tooth Extraction', 'Oral Surgery', 'Removes teeth that cannot be extracted through simple extraction.', 3500],
            ['Impacted Tooth Removal', 'Oral Surgery', 'Surgically removes a tooth that is trapped beneath the gums.', 8000],
        ];

        foreach ($services as [$name, $category, $description, $price]) {
            Service::firstOrCreate(
                ['name' => $name],
                [
                    'category' => $category,
                    'description' => $description,
                    'price' => $price,
                ]
            );
        }
    }
}
