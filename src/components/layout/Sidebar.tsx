"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Users,
  BarChart3,
  FileText,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-ink-200 bg-white">
      {/* Brand */}
      <div className="px-6 py-7 border-b border-ink-200">
        <Link href="/" className="flex flex-col gap-1 group">
          <span className="display-serif text-2xl leading-none text-ink group-hover:text-accent transition-colors">
            Limoura
          </span>
          <span className="text-2xs uppercase tracking-[0.22em] text-ink-500">
            Creative Studio
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5">
        <ul className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-ink text-white"
                      : "text-ink-700 hover:bg-ink-100 hover:text-ink",
                  )}
                >
                  <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-ink-200 p-4 flex flex-col gap-3">
        <div className="px-2 text-2xs text-ink-500">
          <div className="font-medium text-ink-700">Admin</div>
          <div>{APP_NAME}</div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-ink-500 hover:bg-ink-100 hover:text-ink transition-colors"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
