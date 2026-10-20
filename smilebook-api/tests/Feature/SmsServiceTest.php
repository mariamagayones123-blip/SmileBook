<?php
namespace Tests\Feature;

use App\Services\SmsService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SmsServiceTest extends TestCase
{
    public function test_without_an_api_key_nothing_is_sent_to_semaphore(): void
    {
        config(['services.semaphore.key' => null]);
        Http::fake();

        $this->assertTrue(SmsService::send('09171234567', 'hi'));
        Http::assertNothingSent();
    }

    public function test_accepted_message_returns_true(): void
    {
        config(['services.semaphore.key' => 'k']);
        Http::fake(['*' => Http::response([['message_id' => 99, 'status' => 'Queued']], 200)]);

        $this->assertTrue(SmsService::send('+639171234567', 'hi'));
        Http::assertSent(fn ($r) => $r['number'] === '09171234567' && $r['apikey'] === 'k');
    }

    public function test_http_error_returns_false(): void
    {
        config(['services.semaphore.key' => 'k']);
        Http::fake(['*' => Http::response(['apikey' => ['The selected apikey is invalid.']], 401)]);

        $this->assertFalse(SmsService::send('09171234567', 'hi'));
    }

    public function test_error_object_with_http_200_returns_false(): void
    {
        config(['services.semaphore.key' => 'k']);
        Http::fake(['*' => Http::response(['message' => 'Insufficient credits'], 200)]);

        $this->assertFalse(SmsService::send('09171234567', 'hi'));
    }

    public function test_timeout_returns_false_instead_of_throwing(): void
    {
        config(['services.semaphore.key' => 'k']);
        Http::fake(fn () => throw new ConnectionException('timed out'));

        $this->assertFalse(SmsService::send('09171234567', 'hi'));
    }

    public function test_invalid_or_missing_numbers_are_not_sent(): void
    {
        Http::fake();
        $this->assertFalse(SmsService::send(null, 'hi'));
        $this->assertFalse(SmsService::send('12345', 'hi'));
        Http::assertNothingSent();
    }

    public function test_phone_numbers_are_normalized(): void
    {
        $this->assertSame('09171234567', SmsService::normalize('+63 917 123 4567'));
        $this->assertSame('09171234567', SmsService::normalize('639171234567'));
        $this->assertSame('09171234567', SmsService::normalize('0917-123-4567'));
        $this->assertNull(SmsService::normalize('0817123456'));
    }
}
