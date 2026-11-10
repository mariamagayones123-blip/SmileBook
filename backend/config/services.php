<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Gmail sent through a Google Apps Script web app (HTTPS, works on Render's free tier).
    // Leave MAILRELAY_URL empty to use Laravel's normal mailer (MAIL_MAILER) instead.
    'mailrelay' => [
        'url' => env('MAILRELAY_URL'),
        'secret' => env('MAILRELAY_SECRET'),
    ],

    'semaphore' => [
        // Set SMS_ENABLED=false in .env to turn SMS off completely (emails still go out).
        'enabled' => env('SMS_ENABLED', true),
        'key' => env('SMS_API_KEY'),
        // Leave empty to use your Semaphore account's default sender name.
        // Only set SMS_SENDER in .env to a name that is approved in your Semaphore dashboard.
        'sender' => env('SMS_SENDER', ''),
    ],

    // Sign in with Google / Facebook (see README, "Google and Facebook sign-in")
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
    ],

    'facebook' => [
        'app_id' => env('FACEBOOK_APP_ID'),
        'app_secret' => env('FACEBOOK_APP_SECRET'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];