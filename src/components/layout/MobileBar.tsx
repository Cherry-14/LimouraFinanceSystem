"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Users,
  BarChart3,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function MobileBar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <div className="lg:hidden flex items-center justify-between border-b border-ink-200 px-5 py-4 bg-white sticky top-0 z-40">
        <Link href="/" className="display-serif text-xl text-ink">
          Limoura
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-1.5 hover:bg-ink-100"
        >
          <Menu size={18} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white animate-fade-in flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200">
            <span className="display-serif text-xl">Limoura</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1.5 hover:bg-ink-100">
              <X size={18} />
            </button>
          </div>
          <nav className="flex-1 px-3 py-5">
            <ul className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium",
                        active ? "bg-ink text-white" : "text-ink-700 hover:bg-ink-100",
                      )}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
