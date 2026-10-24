<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            ['Teeth Cleaning', 'General & Preventive', 'Oral prophylaxis / professional cleaning', 800],
            ['Tooth Extraction', 'Oral Surgery', 'Simple tooth extraction', 1200],
            ['Braces Check-up', 'Orthodontics', 'Monthly braces adjustment', 1500],
            ['Dental Check-up', 'General & Preventive', 'Dental consultation and examination', 500],
            ['Tooth Filling', 'General & Preventive', 'Pasta / composite tooth filling', 1500],
            ['Wisdom Tooth Removal', 'Oral Surgery', 'Wisdom tooth removal; final fee depends on case complexity', 5000],
            ['Root Canal Treatment', 'General & Preventive', 'Root canal treatment; price varies by tooth and case', 8000],
            ['Jacket / Porcelain Crown', 'General & Preventive', 'Porcelain jacket crown; price varies by material and case', 12000],
            ['Partial Dentures', 'General & Preventive', 'Removable partial dentures; price varies by design', 8000],
            ['Complete Dentures', 'General & Preventive', 'Complete removable dentures', 15000],
            ['Metal Braces', 'Orthodontics', 'Metal braces treatment; starting fee', 35000],
            ['Ceramic Braces', 'Orthodontics', 'Ceramic braces treatment; starting fee', 50000],
            ['Retainers', 'Orthodontics', 'Retainer set; type and replacement needs affect price', 3000],
            ['Teeth Whitening', 'General & Preventive', 'Professional teeth whitening', 8000],
            ['Porcelain Veneers', 'General & Preventive', 'Porcelain veneer; price is per tooth', 15000],
            ['Fluoride Treatment', 'General & Preventive', 'Topical fluoride application', 800],
            ['Panoramic X-ray', 'General & Preventive', 'Panoramic dental radiograph', 1200],
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
