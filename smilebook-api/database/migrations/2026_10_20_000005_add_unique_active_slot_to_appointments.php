<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Stops double-booking at the database level: only ONE non-cancelled appointment
 * can exist per dentist + date + start time. Cancelled appointments don't count,
 * so a cancelled slot can be booked again.
 *
 * Partial indexes are supported by SQLite and PostgreSQL (Supabase). MySQL/MariaDB
 * (XAMPP) can't do this, so there we skip the index; the app-level check in
 * AppointmentController still runs.
 */
return new class extends Migration {
    private const INDEX = 'appointments_active_slot_unique';

    public function up(): void
    {
        if (!in_array(DB::getDriverName(), ['sqlite', 'pgsql'], true)) {
            return;
        }

        // The index can't be created if the table already has double-booked slots.
        $dupes = DB::table('appointments')
            ->select('dentist_id', 'date', 'start_time')
            ->where('status', '!=', 'cancelled')
            ->groupBy('dentist_id', 'date', 'start_time')
            ->havingRaw('count(*) > 1')
            ->get();

        if ($dupes->isNotEmpty()) {
            $list = $dupes->map(fn ($d) => "dentist {$d->dentist_id} on {$d->date} at {$d->start_time}")->implode('; ');
            throw new RuntimeException(
                "Cannot add the no-double-booking rule: these slots are already booked more than once ($list). "
                . 'Cancel the extra appointments, then run php artisan migrate again.'
            );
        }

        DB::statement(
            'CREATE UNIQUE INDEX ' . self::INDEX
            . " ON appointments (dentist_id, date, start_time) WHERE status <> 'cancelled'"
        );
    }

    public function down(): void
    {
        if (in_array(DB::getDriverName(), ['sqlite', 'pgsql'], true)) {
            DB::statement('DROP INDEX IF EXISTS ' . self::INDEX);
        }
    }
};
