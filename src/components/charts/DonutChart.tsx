"use client";

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import type { ExpenseDistributionRow } from "@/types";
import { CHART_COLORS } from "@/constants";
import { formatMoney, centsToDollars } from "@/lib/formatters";

export function DonutChart({
  data,
  height = 240,
}: {
  data: ExpenseDistributionRow[];
  height?: number;
}) {
  const chartData = data.map((d) => ({
    name: d.category,
    value: centsToDollars(d.amountCents),
    share: d.share,
  }));

  const total = chartData.reduce((s, x) => s + x.value, 0);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6 w-full">
      <div style={{ width: 200, height }} className="relative shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={92}
              strokeWidth={0}
              paddingAngle={1}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                return (
                  <div className="rounded-md border border-ink-200 bg-white px-3 py-2 shadow-soft text-xs">
                    <div className="font-medium text-ink">{p.name}</div>
                    <div className="text-ink-500 num">{formatMoney(p.value * 100)}</div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xs uppercase tracking-wider text-ink-500">Total</span>
          <span className="display-serif text-2xl num">{formatMoney(total * 100)}</span>
        </div>
      </div>
      <ul className="flex-1 w-full flex flex-col gap-2">
        {chartData.slice(0, 7).map((d, i) => (
          <li key={d.name} className="flex items-center justify-between text-sm gap-4">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="h-2 w-2 rounded-sm shrink-0"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="truncate text-ink-700">{d.name}</span>
            </span>
            <span className="flex items-center gap-3 shrink-0">
              <span className="text-2xs text-ink-500 num">{Math.round(d.share * 100)}%</span>
              <span className="text-ink font-medium num">{formatMoney(d.value * 100)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
