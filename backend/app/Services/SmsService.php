<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Sends SMS using the Semaphore API (PH). If SMS_API_KEY is empty,
 * the message is only written to storage/logs/laravel.log (good for demo/testing).
 *
 * Returns true if the SMS was accepted by Semaphore (or logged in demo mode),
 * false if it was not sent. Failures are always written to the log with the reason.
 */
class SmsService
{
    private const ENDPOINT = 'https://api.semaphore.co/api/v4/messages';

    public static function send(?string $number, string $message): bool
    {
        if (!$number) {
            return false;
        }

        $to = self::normalize($number);
        if (!$to) {
            Log::warning('SMS not sent: invalid mobile number.');
            return false;
        }

        $key = config('services.semaphore.key');
        if (!$key) {
            Log::info("[SMS to $to] $message");
            return true;
        }

        $payload = [
            'apikey'  => $key,
            'number'  => $to,
            'message' => $message,
        ];

        // Only send a sender name if one is set. An unapproved/invalid name makes
        // Semaphore reject the message ("The senderName supplied is not valid").
        $sender = trim((string) config('services.semaphore.sender'));
        if ($sender !== '') {
            $payload['sendername'] = $sender;
        }

        try {
            $res = Http::asForm()->timeout(10)->post(self::ENDPOINT, $payload);
        } catch (Throwable $e) {
            Log::warning("SMS to $to failed (could not reach Semaphore): " . $e->getMessage());
            return false;
        }

        // Success = HTTP 2xx and a list of message objects. Errors (bad API key, no credits,
        // bad sender name...) come back as HTTP errors or as an object with an error message.
        $body = $res->json();
        $accepted = $res->successful() && is_array($body) && array_is_list($body) && $body !== [];

        if (!$accepted) {
            Log::warning("SMS to $to was NOT sent: HTTP {$res->status()} " . Str::limit($res->body(), 300));
            return false;
        }

        $first = $body[0];
        Log::info("SMS to $to accepted by Semaphore (message_id " . ($first['message_id'] ?? '?')
            . ', status ' . ($first['status'] ?? '?') . ').');
        return true;
    }

    /** +639171234567 / 639171234567 / 0917-123-4567 -> 09171234567. Returns null if it isn't a PH mobile number. */
    public static function normalize(string $number): ?string
    {
        $digits = preg_replace('/\D+/', '', $number);
        if (str_starts_with($digits, '63')) {
            $digits = '0' . substr($digits, 2);
        }
        return preg_match('/^09\d{9}$/', $digits) ? $digits : null;
    }
}