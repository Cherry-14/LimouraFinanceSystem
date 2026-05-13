"use client";

import * as React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatMoney, formatCompactMoney, centsToDollars } from "@/lib/formatters";

export function HorizontalBarChart({
  data,
  height = 260,
}: {
  data: { name: string; revenueCents: number; profitCents: number }[];
  height?: number;
}) {
  const chartData = data.map((d) => ({
    name: d.name,
    Revenue: centsToDollars(d.revenueCents),
    Profit: centsToDollars(d.profitCents),
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompactMoney(v * 100)}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={140}
            tick={{ fontSize: 11, fill: "#404040" }}
          />
          <Tooltip
            cursor={{ fill: "#FAFAFA" }}
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-md border border-ink-200 bg-white px-3 py-2 shadow-soft text-xs">
                  <div className="font-medium text-ink mb-1">{label}</div>
                  {payload.map((p: any) => (
                    <div key={p.name} className="flex items-center justify-between gap-6 num">
                      <span className="text-ink-500">{p.name}</span>
                      <span className="text-ink">{formatMoney(p.value * 100)}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Bar dataKey="Revenue" fill="#D4D4D4" radius={[0, 2, 2, 0]} barSize={10} />
          <Bar dataKey="Profit" fill="#1F3D2B" radius={[0, 2, 2, 0]} barSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
