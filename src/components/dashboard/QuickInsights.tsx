import * as React from "react";
import { TrendingUp, AlertCircle, Info } from "lucide-react";
import type { QuickInsight } from "@/types";
import { cn } from "@/lib/utils";

const ICONS = {
  positive: TrendingUp,
  warning: AlertCircle,
  neutral: Info,
} as const;

const TONES = {
  positive: "text-positive",
  warning: "text-warning",
  neutral: "text-ink-500",
} as const;

export function QuickInsights({ items }: { items: QuickInsight[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-500 py-8 text-center">No insights yet — keep adding data.</p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((insight) => {
        const Icon = ICONS[insight.tone];
        return (
          <li key={insight.id} className="flex items-start gap-3 group">
            <span className={cn("mt-0.5 shrink-0", TONES[insight.tone])}>
              <Icon size={14} strokeWidth={1.75} />
            </span>
            <p className="text-sm text-ink-700 leading-relaxed">{insight.text}</p>
          </li>
        );
      })}
    </ul>
  );
}
