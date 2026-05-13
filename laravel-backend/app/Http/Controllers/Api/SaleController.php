<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SaleController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = Sale::with('client');

        if ($request->filled('from')) {
            $query->where('invoice_date', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->where('invoice_date', '<=', $request->date('to'));
        }
        if ($request->filled('clientId')) {
            $query->where('client_id', $request->string('clientId'));
        }
        if ($request->filled('serviceType')) {
            $query->where('service_type', $request->string('serviceType'));
        }
        if ($request->filled('status')) {
            $query->where('payment_status', $request->string('status'));
        }

        return response()->json([
            'data' => $query->orderByDesc('invoice_date')->limit($request->integer('take', 100))->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'invoice_number'      => 'required|string|unique:sales,invoice_number',
            'project_name'        => 'required|string',
            'service_type'        => 'required|string',
            'client_id'           => 'required|uuid|exists:clients,id',
            'revenue_cents'       => 'required|integer|min:0',
            'project_cost_cents'  => 'sometimes|integer|min:0',
            'amount_paid_cents'   => 'sometimes|integer|min:0',
            'payment_status'      => ['required', Rule::in(['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])],
            'payment_method'      => 'sometimes|nullable|string',
            'invoice_date'        => 'required|date',
            'due_date'            => 'sometimes|nullable|date',
            'paid_date'           => 'sometimes|nullable|date',
            'notes'               => 'sometimes|nullable|string',
        ]);

        $sale = Sale::create($data);
        $this->audit->log('CREATE', 'Sale', $sale->id, $sale->toArray());

        return response()->json(['data' => $sale], 201);
    }

    public function show(Sale $sale): JsonResponse
    {
        $sale->load('client');
        return response()->json(['data' => $sale]);
    }

    public function update(Request $request, Sale $sale): JsonResponse
    {
        $data = $request->validate([
            'invoice_number'      => "sometimes|string|unique:sales,invoice_number,{$sale->id}",
            'project_name'        => 'sometimes|string',
            'service_type'        => 'sometimes|string',
            'client_id'           => 'sometimes|uuid|exists:clients,id',
            'revenue_cents'       => 'sometimes|integer|min:0',
            'project_cost_cents'  => 'sometimes|integer|min:0',
            'amount_paid_cents'   => 'sometimes|integer|min:0',
            'payment_status'      => ['sometimes', Rule::in(['PAID', 'PARTIAL', 'PENDING', 'OVERDUE'])],
            'payment_method'      => 'sometimes|nullable|string',
            'invoice_date'        => 'sometimes|date',
            'due_date'            => 'sometimes|nullable|date',
            'paid_date'           => 'sometimes|nullable|date',
            'notes'               => 'sometimes|nullable|string',
        ]);

        $sale->update($data);
        $this->audit->log('UPDATE', 'Sale', $sale->id, $sale->toArray());

        return response()->json(['data' => $sale]);
    }

    public function destroy(Sale $sale): JsonResponse
    {
        $sale->delete(); // soft delete via SoftDeletes trait
        $this->audit->log('DELETE', 'Sale', $sale->id);
        return response()->json(['ok' => true]);
    }
}
