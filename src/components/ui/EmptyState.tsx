import * as React from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-10 w-10 rounded-full border border-ink-200 mb-4" />
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      {description && <p className="text-xs text-ink-500 mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
