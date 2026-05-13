import * as React from "react";
import type { ClientProfitabilityRow } from "@/types";
import { formatMoney } from "@/lib/formatters";

export function TopClientsList({ data }: { data: ClientProfitabilityRow[] }) {
  const top = data.slice(0, 5);
  const max = Math.max(...top.map((c) => c.revenueCents), 1);

  if (top.length === 0) {
    return <p className="text-sm text-ink-500 py-8 text-center">No client data yet.</p>;
  }

  return (
    <ul className="flex flex-col">
      {top.map((c, i) => (
        <li key={c.clientId} className="py-3 first:pt-0 last:pb-0 border-b border-ink-100 last:border-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="text-2xs text-ink-400 num shrink-0 w-4">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink truncate">{c.company ?? c.clientName}</div>
                <div className="text-2xs text-ink-500 truncate">{c.projects} project{c.projects === 1 ? "" : "s"}</div>
              </div>
            </div>
            <div className="text-sm font-medium num text-ink shrink-0">{formatMoney(c.revenueCents)}</div>
          </div>
          <div className="h-1 w-full bg-ink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${(c.revenueCents / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
