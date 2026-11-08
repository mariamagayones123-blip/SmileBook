<?php
namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Dentist extends Model
{
    protected $fillable = ['name', 'specialty', 'start_time', 'end_time', 'slot_minutes', 'work_days'];
    protected $casts = ['work_days' => 'array'];
    protected $appends = ['service_ids', 'saturday_end_time'];

    /** Clinic rule: on Saturdays every dentist stops at 12:00 noon. */
    public const SATURDAY_END = '12:00';

    public function services()
    {
        return $this->belongsToMany(Service::class);
    }

    public function getServiceIdsAttribute(): array
    {
        return $this->relationLoaded('services')
            ? $this->services->modelKeys()
            : $this->services()->pluck('services.id')->all();
    }

    /** Last working time on Saturdays: 12:00 noon, or earlier if the dentist's own end time is earlier. */
    public function getSaturdayEndTimeAttribute(): ?string
    {
        // Some queries load a dentist with only a few columns (e.g. dentists:id), so end_time can be missing.
        $end = $this->attributes['end_time'] ?? null;
        return $end === null ? null : min($end, self::SATURDAY_END);
    }

    /** All time slots this dentist offers on a date (taken or not). */
    public function slotsFor(string $date): array
    {
        $day = Carbon::parse($date);
        if (!in_array($day->dayOfWeek, $this->work_days)) return [];

        $slots = [];
        $t = Carbon::parse("$date {$this->start_time}");
        $endTime = $day->dayOfWeek === Carbon::SATURDAY ? $this->saturday_end_time : $this->end_time;
        $end = Carbon::parse("$date {$endTime}");
        while ($t->copy()->addMinutes($this->slot_minutes)->lte($end)) {
            $next = $t->copy()->addMinutes($this->slot_minutes);
            $slots[] = ['start' => $t->format('H:i'), 'end' => $next->format('H:i')];
            $t = $next;
        }
        return $slots;
    }
}
