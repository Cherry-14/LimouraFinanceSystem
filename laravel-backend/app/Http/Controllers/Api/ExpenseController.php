<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = Expense::query();

        if ($request->filled('from')) $query->where('expense_date', '>=', $request->date('from'));
        if ($request->filled('to'))   $query->where('expense_date', '<=', $request->date('to'));
        if ($request->filled('category')) $query->where('category', $request->string('category'));

        return response()->json([
            'data' => $query->orderByDesc('expense_date')->limit($request->integer('take', 100))->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category'      => 'required|string',
            'subcategory'   => 'sometimes|nullable|string',
            'vendor'        => 'sometimes|nullable|string',
            'description'   => 'sometimes|nullable|string',
            'amount_cents'  => 'required|integer|min:1',
            'expense_date'  => 'required|date',
            'receipt_url'   => 'sometimes|nullable|string',
        ]);

        $expense = Expense::create($data);
        $this->audit->log('CREATE', 'Expense', $expense->id, $expense->toArray());
        return response()->json(['data' => $expense], 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return response()->json(['data' => $expense]);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $data = $request->validate([
            'category'      => 'sometimes|string',
            'subcategory'   => 'sometimes|nullable|string',
            'vendor'        => 'sometimes|nullable|string',
            'description'   => 'sometimes|nullable|string',
            'amount_cents'  => 'sometimes|integer|min:1',
            'expense_date'  => 'sometimes|date',
            'receipt_url'   => 'sometimes|nullable|string',
        ]);

        $expense->update($data);
        $this->audit->log('UPDATE', 'Expense', $expense->id, $expense->toArray());
        return response()->json(['data' => $expense]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $expense->delete();
        $this->audit->log('DELETE', 'Expense', $expense->id);
        return response()->json(['ok' => true]);
    }
}
