import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "positive" | "warning" | "negative" | "muted";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  positive: "bg-accent-50 text-accent border-accent-100",
  warning: "bg-amber-50 text-warning border-amber-200",
  negative: "bg-red-50 text-negative border-red-200",
  muted: "bg-transparent text-ink-500 border-ink-200",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium uppercase tracking-wider",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Convenience helper for payment status
export function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    PAID: { tone: "positive", label: "Paid" },
    PARTIAL: { tone: "warning", label: "Partial" },
    PENDING: { tone: "muted", label: "Pending" },
    OVERDUE: { tone: "negative", label: "Overdue" },
  };
  const cfg = map[status] ?? { tone: "neutral" as Tone, label: status };
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
