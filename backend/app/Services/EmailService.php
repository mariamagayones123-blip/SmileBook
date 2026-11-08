<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * One place that sends every SmileBook email (booking updates, password-reset code, contact form).
 *
 * - SENDLIBERTY_API_KEY is set (deployed site): the email is sent over HTTPS through the Sendliberty API.
 *   Hosts like Render's free tier block SMTP ports (25, 465, 587), but HTTPS always works.
 * - No API key (local development and tests): it uses Laravel's normal mailer, so MAIL_MAILER=log
 *   (or Gmail SMTP on your own computer) keeps working as before.
 *
 * Returns true if the email was accepted, false if it was not sent (the reason is written to the log).
 */
class EmailService
{
    private const ENDPOINT = 'https://sendliberty.com/api/send';

    public static function send(string $to, string $subject, string $content, ?string $replyTo = null): bool
    {
        // Google Apps Script relay (sends from the SmileBook Gmail over HTTPS). Used first when MAILRELAY_URL is set.
        $relayUrl = config('services.mailrelay.url');
        if ($relayUrl) {
            return self::sendWithRelay($relayUrl, $to, $subject, $content, $replyTo);
        }

        $key = config('services.sendliberty.key');

        if (!$key) {
            return self::sendWithLaravelMailer($to, $subject, $content, $replyTo);
        }

        $payload = [
            'to'      => $to,
            'subject' => $subject,
            // The content is always plain text, so escape it. This also stops anything typed in the
            // contact form (like <script>) from being sent as real HTML.
            'html'    => nl2br(e($content)),
        ];

        $from = config('services.sendliberty.from');
        if ($from) {
            $payload['from'] = $from;
        }
        if ($replyTo) {
            $payload['reply_to'] = $replyTo;
        }

        try {
            // The key is sent both ways (X-API-Key and Bearer) so it works whichever one the API checks.
            $res = Http::withHeaders(['X-API-Key' => $key])
                ->withToken($key)
                ->acceptJson()
                ->timeout(15)
                ->post(self::ENDPOINT, $payload);
        } catch (Throwable $e) {
            Log::warning("Email to $to failed (could not reach Sendliberty): " . $e->getMessage());
            return false;
        }

        if (!$res->successful()) {
            Log::warning("Email to $to was NOT sent: HTTP {$res->status()} " . substr($res->body(), 0, 300));
            return false;
        }

        return true;
    }

    private static function sendWithRelay(string $url, string $to, string $subject, string $content, ?string $replyTo): bool
    {
        try {
            $res = Http::asJson()->timeout(20)->post($url, [
                'secret'   => config('services.mailrelay.secret'),
                'to'       => $to,
                'subject'  => $subject,
                'text'     => $content,
                'reply_to' => $replyTo,
            ]);
        } catch (Throwable $e) {
            Log::warning("Email to $to failed (could not reach mail relay): " . $e->getMessage());
            return false;
        }

        if (!$res->successful() || $res->json('ok') !== true) {
            Log::warning("Email to $to was NOT sent via relay: HTTP {$res->status()} " . substr($res->body(), 0, 300));
            return false;
        }

        return true;
    }

    private static function sendWithLaravelMailer(string $to, string $subject, string $content, ?string $replyTo): bool
    {
        try {
            Mail::raw($content, function ($m) use ($to, $subject, $replyTo) {
                $m->to($to)->subject($subject);
                if ($replyTo) {
                    $m->replyTo($replyTo);
                }
            });
            return true;
        } catch (Throwable $e) {
            Log::warning("Email to $to failed: " . $e->getMessage());
            return false;
        }
    }
}