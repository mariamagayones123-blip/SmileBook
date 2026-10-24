<?php
namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Dentist extends Model
{
    protected $fillable = ['name', 'specialty', 'start_time', 'end_time', 'slot_minutes', 'work_days'];
    protected $casts = ['work_days' => 'array'];
    protected $appends = ['service_ids'];

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

    /** All time slots this dentist offers on a date (taken or not). */
    public function slotsFor(string $date): array
    {
        $day = Carbon::parse($date);
        if (!in_array($day->dayOfWeek, $this->work_days)) return [];

        $slots = [];
        $t = Carbon::parse("$date {$this->start_time}");
        $end = Carbon::parse("$date {$this->end_time}");
        while ($t->copy()->addMinutes($this->slot_minutes)->lte($end)) {
            $next = $t->copy()->addMinutes($this->slot_minutes);
            $slots[] = ['start' => $t->format('H:i'), 'end' => $next->format('H:i')];
            $t = $next;
        }
        return $slots;
    }
}
