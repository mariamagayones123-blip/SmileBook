<?php
namespace Tests\Feature;

use App\Services\EmailService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailServiceTest extends TestCase
{
    public function test_without_an_api_key_it_uses_the_normal_laravel_mailer(): void
    {
        config(['services.sendliberty.key' => null]);
        Http::fake();

        $this->assertTrue(EmailService::send('a@gmail.com', 'Hi', 'Hello there'));

        Http::assertNothingSent();
        $this->assertCount(1, Mail::mailer('array')->getSymfonyTransport()->messages());
    }

    public function test_with_an_api_key_it_sends_over_https_and_escapes_the_text(): void
    {
        config(['services.sendliberty.key' => 'test-key', 'services.sendliberty.from' => 'clinic@gmail.com']);
        Http::fake(['sendliberty.com/*' => Http::response(['success' => true], 200)]);

        $this->assertTrue(EmailService::send('a@gmail.com', 'Hi', "Line 1\n<script>alert(1)</script>", 'reply@gmail.com'));

        Http::assertSent(fn ($req) => $req->url() === 'https://sendliberty.com/api/send'
            && $req->hasHeader('X-API-Key', 'test-key')
            && $req['to'] === 'a@gmail.com'
            && $req['from'] === 'clinic@gmail.com'
            && $req['reply_to'] === 'reply@gmail.com'
            && str_contains($req['html'], '&lt;script&gt;')
            && !str_contains($req['html'], '<script>'));
    }

    public function test_an_api_error_returns_false_instead_of_throwing(): void
    {
        config(['services.sendliberty.key' => 'test-key']);
        Http::fake(['sendliberty.com/*' => Http::response('Unauthorized', 401)]);

        $this->assertFalse(EmailService::send('a@gmail.com', 'Hi', 'Hello'));
    }
}
