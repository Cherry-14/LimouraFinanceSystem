"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MonthlyPoint } from "@/types";
import { formatMoney, formatCompactMoney, centsToDollars } from "@/lib/formatters";

type Series = "revenue" | "expenses" | "profit";

const SERIES_CONFIG: Record<Series, { label: string; color: string; dataKey: string }> = {
  revenue: { label: "Revenue", color: "#1F3D2B", dataKey: "revenue" },
  expenses: { label: "Expenses", color: "#9B3A2E", dataKey: "expenses" },
  profit: { label: "Profit", color: "#0A0A0A", dataKey: "profit" },
};

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-ink-200 bg-white px-3 py-2 shadow-soft text-xs">
      <div className="text-2xs uppercase tracking-wider text-ink-500 mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-6 num">
          <span className="flex items-center gap-2 text-ink-700">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium text-ink">{formatMoney(p.value * 100)}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({
  data,
  series = ["revenue", "expenses", "profit"],
  height = 260,
}: {
  data: MonthlyPoint[];
  series?: Series[];
  height?: number;
}) {
  // Recharts works in dollars (numbers), not cents
  const chartData = data.map((d) => ({
    label: d.label,
    revenue: centsToDollars(d.revenueCents),
    expenses: centsToDollars(d.expensesCents),
    profit: centsToDollars(d.profitCents),
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s} id={`grad-${s}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_CONFIG[s].color} stopOpacity={0.12} />
                <stop offset="100%" stopColor={SERIES_CONFIG[s].color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} dy={6} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompactMoney(v * 100)}
            width={56}
          />
          <Tooltip content={<TooltipContent />} cursor={{ stroke: "#D4D4D4", strokeDasharray: "2 4" }} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ fontSize: 11, color: "#737373", paddingBottom: 8 }}
          />
          {series.map((s) => (
            <Area
              key={s}
              type="monotone"
              dataKey={SERIES_CONFIG[s].dataKey}
              name={SERIES_CONFIG[s].label}
              stroke={SERIES_CONFIG[s].color}
              strokeWidth={1.5}
              fill={`url(#grad-${s})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: SERIES_CONFIG[s].color }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
