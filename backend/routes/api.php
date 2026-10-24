<?php
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\FeedbackController;
use App\Http\Middleware\AdminOnly;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:30,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:8,1');

// Public: anyone can view the dentists/schedule and services
Route::get('/dentists', [CatalogController::class, 'dentists']);
Route::get('/services', [CatalogController::class, 'services']);
Route::get('/reviews', [FeedbackController::class, 'reviews']);
Route::post('/reviews', [FeedbackController::class, 'storeReview'])->middleware('throttle:8,1');
Route::post('/contact', [FeedbackController::class, 'storeContact'])->middleware('throttle:8,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/slots', [AppointmentController::class, 'slots']);
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);

    Route::middleware(AdminOnly::class)->prefix('admin')->group(function () {
        Route::get('/dashboard', [AppointmentController::class, 'dashboard']);
        Route::post('/appointments/{appointment}/status', [AppointmentController::class, 'setStatus']);
        Route::post('/services', [CatalogController::class, 'storeService']);
        Route::put('/services/{service}', [CatalogController::class, 'updateService']);
        Route::delete('/services/{service}', [CatalogController::class, 'destroyService']);
        Route::put('/dentists/{dentist}', [CatalogController::class, 'updateDentist']);
        Route::put('/dentists/{dentist}/services', [CatalogController::class, 'updateDentistServices']);
    });
});
