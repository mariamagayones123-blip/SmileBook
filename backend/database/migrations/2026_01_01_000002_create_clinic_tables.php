<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('dentists', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('specialty');
            $t->string('start_time', 5);          // "09:00"
            $t->string('end_time', 5);            // "17:00"
            $t->unsignedSmallInteger('slot_minutes')->default(60);
            $t->json('work_days');                // [1,2,3,4,5] (0 = Sunday)
            $t->timestamps();
        });

        Schema::create('services', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->text('description')->nullable();
            $t->decimal('price', 10, 2)->default(0);
            $t->timestamps();
        });

        Schema::create('appointments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('dentist_id')->constrained();
            $t->foreignId('service_id')->constrained();
            $t->date('date');
            $t->string('start_time', 5);
            $t->string('end_time', 5);
            $t->string('status', 12)->default('pending'); // pending | approved | cancelled
            $t->decimal('down_payment', 10, 2)->default(0);
            $t->string('payment_ref', 50)->nullable();
            $t->timestamps();
            $t->index(['dentist_id', 'date', 'start_time']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('services');
        Schema::dropIfExists('dentists');
    }
};
