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
            ['Teeth Cleaning', 'General & Preventive', 'Professional cleaning removes stains and tartar for a brighter, healthier smile.', 800],
            ['Tooth Extraction', 'Oral Surgery', 'A damaged tooth is gently removed and the area heals cleanly.', 1200],
            ['Braces Check-up', 'Orthodontics', 'Check-ups track your progress and make sure your braces are working as planned.', 1000],
            ['Dental Check-up', 'General & Preventive', 'A thorough exam spots plaque, cavities and gum problems early, so treatment can start before they get worse.', 500],
            ['Tooth Filling', 'General & Preventive', 'A cavity is cleaned and restored so the tooth looks and feels natural again.', 1000],
            ['Alveoloplasty', 'Oral Surgery', 'The jawbone ridge is smoothed and reshaped so the area heals well and fits dentures comfortably.', 5000],
            ['Retained Root Removal', 'Oral Surgery', 'Leftover tooth roots are removed to prevent infection and let the gum heal cleanly.', 2500],
            ['Metal Braces Installation', 'Orthodontics', 'Braces gradually guide crooked or crowded teeth into a straighter, aligned smile.', 30000],
            ['Braces Adjustment', 'Orthodontics', 'Regular adjustments keep the right tension on your braces so teeth keep moving toward their final position.', 1000],
            ['Complete Dentures', 'General & Preventive', 'Full dentures replace missing teeth so you can chew, speak and smile with confidence.', 15000],
            ['Fluoride Treatment', 'General & Preventive', 'A fluoride coating strengthens enamel and helps protect teeth from cavities.', 800],
            ['Jacket / Porcelain Crown', 'General & Preventive', 'A porcelain crown covers a damaged tooth and restores its shape, strength and natural look.', 15000],
            ['Retainers', 'Orthodontics', 'Retainers hold your teeth in their new position after treatment so they stay straight.', 3000],
            ['Ceramic Braces Installation', 'Orthodontics', 'Tooth-colored ceramic braces straighten your teeth while blending in with your smile.', 40000],
            ['Clear Aligners', 'Orthodontics', 'Removable clear aligners gradually move your teeth into place without metal brackets or wires.', 80000],
            ['Wisdom Tooth Removal', 'Oral Surgery', 'A painful or crowded wisdom tooth is taken out so the gum can heal and nearby teeth stay healthy.', 5000],
            ['Surgical Tooth Extraction', 'Oral Surgery', 'A broken or hard-to-reach tooth is removed through a small surgical opening so the area can heal well.', 3500],
            ['Impacted Tooth Removal', 'Oral Surgery', 'A tooth stuck under the gum or bone is carefully removed to relieve pain and prevent infection.', 8000],
        ];

        foreach ($services as [$name, $category, $description, $price]) {
            $service = Service::firstOrCreate(
                ['name' => $name],
                [
                    'category' => $category,
                    'description' => $description,
                    'price' => $price,
                ]
            );

            // Keep the description the same as the Before & After section.
            // Only the description is updated here, so prices and categories you changed stay as they are.
            if ($service->description !== $description) {
                $service->update(['description' => $description]);
            }
        }
    }
}