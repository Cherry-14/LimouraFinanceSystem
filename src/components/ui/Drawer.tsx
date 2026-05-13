"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
  } as const;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-ink/20 backdrop-blur-[2px]"
      />
      <aside
        className={cn(
          "h-full w-full bg-white shadow-2xl flex flex-col animate-slide-up border-l border-ink-200",
          widths[size],
        )}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between px-6 py-5 border-b border-ink-200">
          <div>
            <h2 className="display-serif text-2xl text-ink leading-none">{title}</h2>
            {subtitle && <p className="text-xs text-ink-500 mt-1.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <footer className="px-6 py-4 border-t border-ink-200 bg-ink-50/50 flex items-center justify-end gap-2">{footer}</footer>}
      </aside>
    </div>
  );
}
