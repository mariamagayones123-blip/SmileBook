<?php
namespace Tests\Feature;

use App\Services\EmailService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EmailServiceTest extends TestCase
{
    public function test_without_a_relay_url_it_uses_the_normal_laravel_mailer(): void
    {
        config(['services.mailrelay.url' => null]);
        Http::fake();

        $this->assertTrue(EmailService::send('a@gmail.com', 'Hi', 'Hello there'));

        Http::assertNothingSent();
        $this->assertCount(1, Mail::mailer('array')->getSymfonyTransport()->messages());
    }

    public function test_with_a_relay_url_it_sends_over_https_with_the_secret_and_plain_text(): void
    {
        config(['services.mailrelay.url' => 'https://relay.test/exec', 'services.mailrelay.secret' => 'test-secret']);
        Http::fake(['relay.test/*' => Http::response(['ok' => true], 200)]);

        $this->assertTrue(EmailService::send('a@gmail.com', 'Hi', 'Line 1', 'reply@gmail.com'));

        Http::assertSent(fn ($req) => $req->url() === 'https://relay.test/exec'
            && $req['secret'] === 'test-secret'
            && $req['to'] === 'a@gmail.com'
            && $req['subject'] === 'Hi'
            && $req['text'] === 'Line 1'
            && $req['reply_to'] === 'reply@gmail.com');
    }

    public function test_a_relay_error_returns_false_instead_of_throwing(): void
    {
        config(['services.mailrelay.url' => 'https://relay.test/exec']);
        Http::fake(['relay.test/*' => Http::response('Unauthorized', 401)]);

        $this->assertFalse(EmailService::send('a@gmail.com', 'Hi', 'Hello'));
    }

    public function test_a_relay_that_answers_ok_false_returns_false(): void
    {
        config(['services.mailrelay.url' => 'https://relay.test/exec']);
        Http::fake(['relay.test/*' => Http::response(['ok' => false], 200)]);

        $this->assertFalse(EmailService::send('a@gmail.com', 'Hi', 'Hello'));
    }
}
