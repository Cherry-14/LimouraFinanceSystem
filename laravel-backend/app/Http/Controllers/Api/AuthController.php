<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /**
     * Simple admin login. For production, swap to Sanctum + hashed passwords.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $expectedEmail    = config('app.admin_email', env('ADMIN_EMAIL'));
        $expectedPassword = config('app.admin_password', env('ADMIN_PASSWORD'));

        if (
            $credentials['email'] !== $expectedEmail ||
            $credentials['password'] !== $expectedPassword
        ) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        // Issue a Sanctum personal access token (or use cookie-based for SPA).
        $token = bin2hex(random_bytes(40));
        cache()->put("admin_token:{$token}", $credentials['email'], now()->addDays(14));

        return response()
            ->json(['ok' => true])
            ->cookie('limoura_admin', $token, 60 * 24 * 14, '/', null, true, true);
    }

    public function logout(): JsonResponse
    {
        return response()
            ->json(['ok' => true])
            ->cookie('limoura_admin', '', -1, '/', null, true, true);
    }
}
