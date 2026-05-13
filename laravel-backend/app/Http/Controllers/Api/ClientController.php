<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Client::withCount('sales')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'    => 'required|string',
            'company' => 'sometimes|nullable|string',
            'email'   => 'sometimes|nullable|email',
            'phone'   => 'sometimes|nullable|string',
            'country' => 'sometimes|nullable|string',
            'notes'   => 'sometimes|nullable|string',
        ]);

        $client = Client::create($data);
        $this->audit->log('CREATE', 'Client', $client->id, $client->toArray());
        return response()->json(['data' => $client], 201);
    }

    public function show(Client $client): JsonResponse
    {
        return response()->json(['data' => $client]);
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $data = $request->validate([
            'name'    => 'sometimes|string',
            'company' => 'sometimes|nullable|string',
            'email'   => 'sometimes|nullable|email',
            'phone'   => 'sometimes|nullable|string',
            'country' => 'sometimes|nullable|string',
            'notes'   => 'sometimes|nullable|string',
        ]);

        $client->update($data);
        $this->audit->log('UPDATE', 'Client', $client->id, $client->toArray());
        return response()->json(['data' => $client]);
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();
        $this->audit->log('DELETE', 'Client', $client->id);
        return response()->json(['ok' => true]);
    }
}
