"use client";

import * as React from "react";
import { Download, FileText, Receipt, CreditCard, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input, Label } from "@/components/ui/Input";
import {
  generateFinancialReport,
  generateRevenueReport,
  generateExpenseReport,
} from "@/lib/pdf-export";
import { formatDate } from "@/lib/formatters";

type ReportKind = "financial" | "revenue" | "expense";

const REPORTS: { kind: ReportKind; title: string; description: string; icon: any }[] = [
  {
    kind: "financial",
    title: "Financial Summary",
    description: "Full P&L with revenue, expenses, profitability, and breakdowns by service & client.",
    icon: BarChart3,
  },
  {
    kind: "revenue",
    title: "Revenue Report",
    description: "Every invoice with status, profit per project, and outstanding balance.",
    icon: Receipt,
  },
  {
    kind: "expense",
    title: "Expense Report",
    description: "All operational costs with categories, vendors, and totals.",
    icon: CreditCard,
  },
];

export function ReportsView() {
  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  })();

  const [from, setFrom] = React.useState(sixMonthsAgo);
  const [to, setTo] = React.useState(today);
  const [busy, setBusy] = React.useState<ReportKind | null>(null);

  async function generate(kind: ReportKind) {
    setBusy(kind);
    try {
      const rangeLabel = `${formatDate(from)} — ${formatDate(to)}`;
      if (kind === "financial") {
        const res = await fetch(`/api/analytics?from=${from}&to=${to}`);
        const j = await res.json();
        generateFinancialReport({
          overview: j.overview,
          trend: j.trend,
          clients: j.clients,
          services: j.services,
          distribution: j.distribution,
          rangeLabel,
        });
      } else if (kind === "revenue") {
        const res = await fetch(`/api/sales?from=${from}&to=${to}&take=1000`);
        const j = await res.json();
        generateRevenueReport(j.data, rangeLabel);
      } else if (kind === "expense") {
        const res = await fetch(`/api/expenses?from=${from}&to=${to}&take=1000`);
        const j = await res.json();
        generateExpenseReport(j.data, rangeLabel);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {/* Range picker */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
          <CardSubtitle>Set the date range for all generated reports.</CardSubtitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <Label>From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label>To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <Label>Quick</Label>
              <Select
                onChange={(e) => {
                  const months = Number(e.target.value);
                  if (!months) return;
                  const d = new Date();
                  d.setMonth(d.getMonth() - months);
                  setFrom(d.toISOString().slice(0, 10));
                  setTo(new Date().toISOString().slice(0, 10));
                }}
                defaultValue=""
              >
                <option value="">Choose range…</option>
                <option value="1">Last month</option>
                <option value="3">Last 3 months</option>
                <option value="6">Last 6 months</option>
                <option value="12">Last year</option>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Report cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.kind} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <span className="rounded-md border border-ink-200 p-2 text-ink-700">
                    <Icon size={16} strokeWidth={1.5} />
                  </span>
                  <span className="text-2xs uppercase tracking-wider text-ink-500">PDF</span>
                </div>
                <CardTitle>{r.title}</CardTitle>
                <CardSubtitle>{r.description}</CardSubtitle>
              </CardHeader>
              <CardBody className="flex-1 flex items-end">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => generate(r.kind)}
                  disabled={busy !== null}
                >
                  <Download size={14} strokeWidth={1.5} />
                  {busy === r.kind ? "Generating…" : "Generate report"}
                </Button>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-2xs text-ink-500 leading-relaxed max-w-2xl">
        Reports are generated client-side using your current data. They include summary KPIs,
        detailed tables, and a clean print-ready layout. The selected date range applies to all reports.
      </div>
    </>
  );
}
