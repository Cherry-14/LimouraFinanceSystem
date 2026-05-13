import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-8 mb-8 border-b border-ink-200", className)}>
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <span className="text-2xs font-medium uppercase tracking-[0.18em] text-ink-500">
            {eyebrow}
          </span>
        )}
        <h1 className="display-serif text-[42px] leading-[1.05] text-ink">{title}</h1>
        {description && <p className="text-sm text-ink-500 max-w-xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
