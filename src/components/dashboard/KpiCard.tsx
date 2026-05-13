import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSignedPercent } from "@/lib/formatters";

export function KpiCard({
  label,
  value,
  delta,
  invertDelta = false,
  hint,
  footer,
}: {
  label: string;
  value: string;
  delta?: number;
  invertDelta?: boolean; // for expenses, an increase is "bad"
  hint?: string;
  footer?: React.ReactNode;
}) {
  const showDelta = typeof delta === "number" && Number.isFinite(delta);
  const isUp = showDelta && delta! > 0;
  const isDown = showDelta && delta! < 0;
  // Color logic: for revenue/profit, up = good. For expenses, up = bad.
  const goodDirection = invertDelta ? isDown : isUp;
  const badDirection = invertDelta ? isUp : isDown;

  return (
    <div className="group relative flex flex-col gap-5 rounded-lg border border-ink-200 bg-white p-6 transition-colors hover:border-ink-300">
      <div className="flex items-start justify-between">
        <span className="text-2xs uppercase tracking-[0.18em] text-ink-500">{label}</span>
        {showDelta && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium tabular-nums",
              goodDirection && "text-positive",
              badDirection && "text-negative",
              !goodDirection && !badDirection && "text-ink-500",
            )}
          >
            {isUp ? <ArrowUpRight size={12} strokeWidth={2} /> : isDown ? <ArrowDownRight size={12} strokeWidth={2} /> : null}
            {formatSignedPercent(delta!)}
          </div>
        )}
      </div>
      <div>
        <div className="display-serif text-[40px] leading-none text-ink num">{value}</div>
        {hint && <div className="text-xs text-ink-500 mt-2.5">{hint}</div>}
      </div>
      {footer && <div className="text-xs text-ink-500">{footer}</div>}
    </div>
  );
}
