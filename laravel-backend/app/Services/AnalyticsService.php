<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Sale;
use Carbon\Carbon;
use Carbon\CarbonImmutable;

class AnalyticsService
{
    public function overview(?Carbon $from = null, ?Carbon $to = null): array
    {
        $to   = $to   ?? CarbonImmutable::now()->endOfMonth();
        $from = $from ?? CarbonImmutable::now()->startOfMonth()->subMonths(5);

        $sales    = Sale::whereBetween('invoice_date', [$from, $to])->get();
        $expenses = Expense::whereBetween('expense_date', [$from, $to])->get();

        $revenue  = $sales->sum('revenue_cents');
        $cost     = $sales->sum('project_cost_cents');
        $opex     = $expenses->sum('amount_cents');
        $totalEx  = $cost + $opex;
        $profit   = $revenue - $totalEx;
        $margin   = $revenue > 0 ? $profit / $revenue : 0;
        $outstanding = $sales->sum(fn ($s) => max(0, $s->revenue_cents - $s->amount_paid_cents));

        // Previous period for deltas
        $periodSec = $to->diffInSeconds($from);
        $prevTo    = $from->copy()->subSecond();
        $prevFrom  = $prevTo->copy()->subSeconds($periodSec);

        $prevSales    = Sale::whereBetween('invoice_date', [$prevFrom, $prevTo])->get();
        $prevExpenses = Expense::whereBetween('expense_date', [$prevFrom, $prevTo])->get();

        $prevRevenue = $prevSales->sum('revenue_cents');
        $prevTotalEx = $prevSales->sum('project_cost_cents') + $prevExpenses->sum('amount_cents');
        $prevProfit  = $prevRevenue - $prevTotalEx;

        $delta = fn ($c, $p) => $p == 0 ? ($c == 0 ? 0 : 1) : ($c - $p) / abs($p);

        return [
            'totalRevenueCents'  => $revenue,
            'totalExpensesCents' => $totalEx,
            'netProfitCents'     => $profit,
            'profitMargin'       => $margin,
            'outstandingCents'   => $outstanding,
            'revenueDelta'       => $delta($revenue, $prevRevenue),
            'expensesDelta'      => $delta($totalEx, $prevTotalEx),
            'profitDelta'        => $delta($profit, $prevProfit),
        ];
    }

    public function monthlyTrend(int $months = 8): array
    {
        $buckets = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $d = CarbonImmutable::now()->subMonths($i);
            $buckets[] = [
                'start' => $d->startOfMonth(),
                'end'   => $d->endOfMonth(),
                'month' => $d->format('Y-m'),
                'label' => $d->format('M'),
            ];
        }

        $start = $buckets[0]['start'];
        $end   = $buckets[count($buckets) - 1]['end'];

        $sales    = Sale::whereBetween('invoice_date', [$start, $end])->get();
        $expenses = Expense::whereBetween('expense_date', [$start, $end])->get();

        return collect($buckets)->map(function ($b) use ($sales, $expenses) {
            $revenue = $sales->filter(fn ($s) => $s->invoice_date->between($b['start'], $b['end']))->sum('revenue_cents');
            $cost    = $sales->filter(fn ($s) => $s->invoice_date->between($b['start'], $b['end']))->sum('project_cost_cents');
            $opex    = $expenses->filter(fn ($e) => $e->expense_date->between($b['start'], $b['end']))->sum('amount_cents');
            $totalEx = $cost + $opex;

            return [
                'month'         => $b['month'],
                'label'         => $b['label'],
                'revenueCents'  => $revenue,
                'expensesCents' => $totalEx,
                'profitCents'   => $revenue - $totalEx,
            ];
        })->all();
    }

    public function clientProfitability(?Carbon $from = null, ?Carbon $to = null): array
    {
        $q = Sale::with('client');
        if ($from) $q->where('invoice_date', '>=', $from);
        if ($to)   $q->where('invoice_date', '<=', $to);

        return $q->get()
            ->groupBy('client_id')
            ->map(function ($group) {
                $first = $group->first();
                $revenue = $group->sum('revenue_cents');
                $cost    = $group->sum('project_cost_cents');
                return [
                    'clientId'     => $first->client_id,
                    'clientName'   => $first->client?->name,
                    'company'      => $first->client?->company,
                    'revenueCents' => $revenue,
                    'costCents'    => $cost,
                    'profitCents'  => $revenue - $cost,
                    'projects'     => $group->count(),
                ];
            })
            ->sortByDesc('profitCents')
            ->values()
            ->all();
    }

    public function serviceProfitability(?Carbon $from = null, ?Carbon $to = null): array
    {
        $q = Sale::query();
        if ($from) $q->where('invoice_date', '>=', $from);
        if ($to)   $q->where('invoice_date', '<=', $to);

        return $q->get()
            ->groupBy('service_type')
            ->map(function ($group, $service) {
                $revenue = $group->sum('revenue_cents');
                $cost    = $group->sum('project_cost_cents');
                $profit  = $revenue - $cost;
                return [
                    'service'      => $service,
                    'revenueCents' => $revenue,
                    'costCents'    => $cost,
                    'profitCents'  => $profit,
                    'projects'     => $group->count(),
                    'marginPct'    => $revenue > 0 ? $profit / $revenue : 0,
                ];
            })
            ->sortByDesc('profitCents')
            ->values()
            ->all();
    }

    public function expenseDistribution(?Carbon $from = null, ?Carbon $to = null): array
    {
        $q = Expense::query();
        if ($from) $q->where('expense_date', '>=', $from);
        if ($to)   $q->where('expense_date', '<=', $to);

        $grouped = $q->get()->groupBy('category')->map(fn ($g) => $g->sum('amount_cents'));
        $total   = $grouped->sum();

        return $grouped->map(fn ($amount, $category) => [
            'category'    => $category,
            'amountCents' => $amount,
            'share'       => $total > 0 ? $amount / $total : 0,
        ])->sortByDesc('amountCents')->values()->all();
    }

    public function quickInsights(): array
    {
        // Same rule-based engine as the TS version — see ARCHITECTURE.md §10
        return [];
    }
}
