import * as React from "react";
import type { ServiceProfitabilityRow } from "@/types";
import { formatMoney } from "@/lib/formatters";

export function ServiceProfitability({ data }: { data: ServiceProfitabilityRow[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-500 py-8 text-center">No service data yet.</p>;
  }
  return (
    <ul className="flex flex-col">
      {data.slice(0, 6).map((s) => (
        <li key={s.service} className="py-3 first:pt-0 last:pb-0 border-b border-ink-100 last:border-0">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-ink-700 truncate">{s.service}</span>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-2xs text-ink-500 num">{Math.round(s.marginPct * 100)}% margin</span>
              <span className="text-sm font-medium text-ink num">{formatMoney(s.profitCents)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
