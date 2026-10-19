<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class FeedbackController extends Controller
{
    public function reviews()
    {
        return Review::with('service:id,name')->latest()->take(50)->get();
    }

    public function storeReview(Request $r)
    {
        $user = Auth::guard('sanctum')->user();
        $data = $r->validate([
            'service_id' => 'required|exists:services,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:8|max:800',
            'name' => $user ? 'nullable|string|max:100' : 'required|string|max:100',
        ]);

        $review = Review::create([
            'service_id' => $data['service_id'],
            'user_id' => $user?->id,
            'name' => $user?->name ?? $data['name'],
            'rating' => $data['rating'],
            'comment' => $data['comment'],
        ]);

        return response()->json($review->load('service:id,name'), 201);
    }

    public function storeContact(Request $r)
    {
        $data = $r->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:120',
            'subject' => 'required|string|max:150',
            'message' => 'required|string|min:10|max:2000',
        ]);

        // Save a copy in the database first, so no message is ever lost
        $contact = ContactMessage::create($data);

        // Then forward it to the clinic's Gmail inbox
        try {
            $body = "You received a new message from the SmileBook Contact Us form.\n\n"
                . "Name: {$data['name']}\n"
                . "Email: {$data['email']}\n"
                . "Subject: {$data['subject']}\n"
                . "Sent: " . $contact->created_at->timezone('Asia/Manila')->format('M d, Y h:i A') . "\n\n"
                . "Message:\n{$data['message']}\n\n"
                . "--\nTip: just hit Reply to answer {$data['name']} directly.";

            Mail::raw($body, function ($m) use ($data) {
                $m->to(config('mail.contact_to'))
                  ->replyTo($data['email'], $data['name'])
                  ->subject('[SmileBook Contact] ' . $data['subject']);
            });
        } catch (\Throwable $e) {
            Log::warning('Contact mail failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Thanks for reaching out. We will get back to you soon.'], 201);
    }
}
