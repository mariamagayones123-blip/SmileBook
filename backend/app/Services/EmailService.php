<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * One place that sends every SmileBook email (booking updates, password-reset code, contact form).
 *
 * - MAILRELAY_URL is set (deployed site): the email is sent over HTTPS through a Google Apps Script relay,
 *   which sends from the SmileBook Gmail. Hosts like Render's free tier block SMTP ports (25, 465, 587),
 *   but HTTPS always works.
 * - No relay URL (local development and tests): it uses Laravel's normal mailer, so MAIL_MAILER=log
 *   (or Gmail SMTP on your own computer) keeps working as before.
 *
 * Returns true if the email was accepted, false if it was not sent (the reason is written to the log).
 */
class EmailService
{
    public static function send(string $to, string $subject, string $content, ?string $replyTo = null): bool
    {
        $relayUrl = config('services.mailrelay.url');

        if (!$relayUrl) {
            return self::sendWithLaravelMailer($to, $subject, $content, $replyTo);
        }

        return self::sendWithRelay($relayUrl, $to, $subject, $content, $replyTo);
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