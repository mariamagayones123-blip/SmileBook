<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends SMS using the Semaphore API (PH). If SMS_API_KEY is empty,
 * the message is only written to storage/logs/laravel.log (good for demo/testing).
 */
class SmsService
{
    public static function send(?string $number, string $message): void
    {
        if (!$number) return;
        $key = env('SMS_API_KEY');
        if (!$key) {
            Log::info("[SMS to $number] $message");
            return;
        }
        try {
            Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
                'apikey'     => $key,
                'number'     => $number,
                'message'    => $message,
                'sendername' => env('SMS_SENDER', 'SEMAPHORE'),
            ]);
        } catch (\Throwable $e) {
            Log::warning('SMS failed: ' . $e->getMessage());
        }
    }
}
