<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('category')->nullable()->after('name');
        });

        foreach (DB::table('services')->select('id', 'name')->get() as $service) {
            $name = strtolower($service->name);
            $category = str_contains($name, 'braces') || str_contains($name, 'retainer')
                ? 'Orthodontics'
                : (str_contains($name, 'extraction') || str_contains($name, 'wisdom')
                    ? 'Oral Surgery'
                    : 'General & Preventive');

            DB::table('services')->where('id', $service->id)->update(['category' => $category]);
        }
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
