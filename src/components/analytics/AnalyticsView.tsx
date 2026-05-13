"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from "@/components/ui/Card";
import { TrendChart } from "@/components/charts/TrendChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { Select } from "@/components/ui/Select";
import { formatMoney, formatPercent } from "@/lib/formatters";
import type {
  DashboardOverview,
  MonthlyPoint,
  ClientProfitabilityRow,
  ServiceProfitabilityRow,
  ExpenseDistributionRow,
} from "@/types";

interface AnalyticsData {
  overview: DashboardOverview;
  trend: MonthlyPoint[];
  clients: ClientProfitabilityRow[];
  services: ServiceProfitabilityRow[];
  distribution: ExpenseDistributionRow[];
}

const RANGES = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last year" },
  { value: "all", label: "All time" },
] as const;

export function AnalyticsView({ initialData }: { initialData: AnalyticsData }) {
  const [data, setData] = React.useState<AnalyticsData>(initialData);
  const [range, setRange] = React.useState<string>("180");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (range !== "all") {
          const days = Number(range);
          const to = new Date();
          const from = new Date();
          from.setDate(from.getDate() - days);
          params.set("from", from.toISOString());
          params.set("to", to.toISOString());
        }
        const res = await fetch(`/api/analytics?${params.toString()}`);
        const j = await res.json();
        if (!cancelled) setData(j);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [range]);

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="text-2xs uppercase tracking-[0.18em] text-ink-500">
          {loading ? "Refreshing…" : "Period"}
        </div>
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-48">
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
      </div>

      {/* Summary KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-200 rounded-lg overflow-hidden border border-ink-200 mb-8">
        {[
          { label: "Revenue", value: formatMoney(data.overview.totalRevenueCents) },
          { label: "Expenses", value: formatMoney(data.overview.totalExpensesCents) },
          { label: "Net Profit", value: formatMoney(data.overview.netProfitCents) },
          { label: "Margin", value: formatPercent(data.overview.profitMargin) },
        ].map((k) => (
          <div key={k.label} className="bg-white p-5">
            <div className="text-2xs uppercase tracking-[0.18em] text-ink-500 mb-2">{k.label}</div>
            <div className="display-serif text-3xl text-ink num">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Trend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue, Expense & Profit Trend</CardTitle>
          <CardSubtitle>Monthly breakdown for the selected period.</CardSubtitle>
        </CardHeader>
        <CardBody>
          <TrendChart data={data.trend} height={320} />
        </CardBody>
      </Card>

      {/* Service profitability — chart + table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Profitability</CardTitle>
            <CardSubtitle>Revenue vs profit by service line.</CardSubtitle>
          </CardHeader>
          <CardBody>
            <HorizontalBarChart
              data={data.services.map((s) => ({
                name: s.service,
                revenueCents: s.revenueCents,
                profitCents: s.profitCents,
              }))}
              height={300}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <CardSubtitle>Operational spend by category.</CardSubtitle>
          </CardHeader>
          <CardBody>
            <DonutChart data={data.distribution} height={280} />
          </CardBody>
        </Card>
      </div>

      {/* Client profitability table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Client Profitability</CardTitle>
          <CardSubtitle>Profit and project count per client.</CardSubtitle>
        </CardHeader>
        <CardBody className="p-0">
          {data.clients.length === 0 ? (
            <div className="p-6 text-sm text-ink-500 text-center">No client data in this period.</div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Client</TH>
                  <TH className="text-right">Projects</TH>
                  <TH className="text-right">Revenue</TH>
                  <TH className="text-right">Cost</TH>
                  <TH className="text-right">Profit</TH>
                </TR>
              </THead>
              <TBody>
                {data.clients.map((c) => (
                  <TR key={c.clientId}>
                    <TD className="font-medium">{c.company ?? c.clientName}</TD>
                    <TD className="text-right num text-ink-500">{c.projects}</TD>
                    <TD className="text-right num">{formatMoney(c.revenueCents)}</TD>
                    <TD className="text-right num text-ink-500">{formatMoney(c.costCents)}</TD>
                    <TD className="text-right num font-medium">{formatMoney(c.profitCents)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Service profitability table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Detail</CardTitle>
          <CardSubtitle>Margin per service line.</CardSubtitle>
        </CardHeader>
        <CardBody className="p-0">
          {data.services.length === 0 ? (
            <div className="p-6 text-sm text-ink-500 text-center">No service data in this period.</div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Service</TH>
                  <TH className="text-right">Projects</TH>
                  <TH className="text-right">Revenue</TH>
                  <TH className="text-right">Cost</TH>
                  <TH className="text-right">Profit</TH>
                  <TH className="text-right">Margin</TH>
                </TR>
              </THead>
              <TBody>
                {data.services.map((s) => (
                  <TR key={s.service}>
                    <TD className="font-medium">{s.service}</TD>
                    <TD className="text-right num text-ink-500">{s.projects}</TD>
                    <TD className="text-right num">{formatMoney(s.revenueCents)}</TD>
                    <TD className="text-right num text-ink-500">{formatMoney(s.costCents)}</TD>
                    <TD className="text-right num font-medium">{formatMoney(s.profitCents)}</TD>
                    <TD className="text-right num">{formatPercent(s.marginPct)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
