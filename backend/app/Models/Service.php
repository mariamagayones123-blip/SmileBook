<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['name', 'category', 'description', 'price'];
    protected $appends = ['dentist_ids'];

    public function dentists()
    {
        return $this->belongsToMany(Dentist::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function getDentistIdsAttribute(): array
    {
        return $this->relationLoaded('dentists')
            ? $this->dentists->modelKeys()
            : $this->dentists()->pluck('dentists.id')->all();
    }
}
