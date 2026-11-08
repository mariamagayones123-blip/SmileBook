<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * No-double-booking rule for MySQL / MariaDB (XAMPP).
 *
 * MySQL has no partial index, so we add a small generated column instead:
 * it holds "dentist|date|time" for every appointment that is NOT cancelled,
 * and NULL for cancelled ones. A UNIQUE index on it means only one active
 * appointment can exist per dentist + date + time, and a cancelled slot can
 * be booked again (many NULLs are allowed in a unique index).
 *
 * SQLite and PostgreSQL (Supabase) already get their rule from
 * 2026_10_20_000005, so this migration does nothing there.
 */
return new class extends Migration {
    private const INDEX = 'appointments_active_slot_unique';

    public function up(): void
    {
        if (!in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

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
            "ALTER TABLE appointments ADD COLUMN active_slot_key VARCHAR(40) "
            . "GENERATED ALWAYS AS (IF(status = 'cancelled', NULL, CONCAT(dentist_id, '|', `date`, '|', start_time))) STORED"
        );
        DB::statement('CREATE UNIQUE INDEX ' . self::INDEX . ' ON appointments (active_slot_key)');
    }

    public function down(): void
    {
        if (!in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }
        DB::statement('DROP INDEX ' . self::INDEX . ' ON appointments');
        DB::statement('ALTER TABLE appointments DROP COLUMN active_slot_key');
    }
};
