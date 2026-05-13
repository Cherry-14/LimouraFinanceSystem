<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analytics) {}

    public function __invoke(Request $request): JsonResponse
    {
        $from = $request->date('from');
        $to   = $request->date('to');

        return response()->json([
            'overview'     => $this->analytics->overview($from, $to),
            'trend'        => $this->analytics->monthlyTrend(8),
            'clients'      => $this->analytics->clientProfitability($from, $to),
            'services'     => $this->analytics->serviceProfitability($from, $to),
            'distribution' => $this->analytics->expenseDistribution($from, $to),
            'insights'     => $this->analytics->quickInsights(),
        ]);
    }
}
