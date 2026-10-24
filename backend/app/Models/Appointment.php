<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = ['user_id', 'dentist_id', 'service_id', 'date', 'start_time', 'end_time',
                           'status', 'down_payment', 'payment_ref'];
    protected $casts = ['date' => 'date:Y-m-d'];

    public function user()    { return $this->belongsTo(User::class); }
    public function dentist() { return $this->belongsTo(Dentist::class); }
    public function service() { return $this->belongsTo(Service::class); }
}
