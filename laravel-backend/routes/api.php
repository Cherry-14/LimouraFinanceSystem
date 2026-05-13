<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\SaleController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);

// Protected
Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('sales', SaleController::class);
    Route::apiResource('expenses', ExpenseController::class);
    Route::get('analytics', AnalyticsController::class);
});
