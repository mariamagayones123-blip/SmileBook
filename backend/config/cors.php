<?php

/*
| Which websites may call this API from a browser.
|
| - Production: set CORS_ALLOWED_ORIGINS in .env to your frontend URL(s), comma-separated,
|   e.g. CORS_ALLOWED_ORIGINS=https://smilebook.vercel.app
| - Local development (APP_ENV=local): any http://localhost or http://127.0.0.1 port is allowed,
|   so `npm run dev` works without extra setup.
*/
return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))))),

    'allowed_origins_patterns' => env('APP_ENV') === 'local'
        ? ['#^http://(localhost|127\.0\.0\.1)(:\d+)?$#']
        : [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // The frontend authenticates with a Bearer token, not cookies.
    'supports_credentials' => false,
];
