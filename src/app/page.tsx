import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from "@/components/ui/Card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart } from "@/components/charts/TrendChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { TopClientsList } from "@/components/dashboard/TopClientsList";
import { ServiceProfitability } from "@/components/dashboard/ServiceProfitability";
import { QuickInsights } from "@/components/dashboard/QuickInsights";
import {
  getOverview,
  getMonthlyTrend,
  getClientProfitability,
  getServiceProfitability,
  getExpenseDistribution,
  getQuickInsights,
} from "@/lib/analytics";
import { formatMoney, formatPercent } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [overview, trend, clients, services, distribution, insights] = await Promise.all([
    getOverview(),
    getMonthlyTrend(8),
    getClientProfitability(),
    getServiceProfitability(),
    getExpenseDistribution(),
    getQuickInsights(),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A live view of revenue, expenses, and profitability across the studio."
      />

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Total Revenue"
          value={formatMoney(overview.totalRevenueCents)}
          delta={overview.revenueDelta}
        />
        <KpiCard
          label="Total Expenses"
          value={formatMoney(overview.totalExpensesCents)}
          delta={overview.expensesDelta}
          invertDelta
        />
        <KpiCard
          label="Net Profit"
          value={formatMoney(overview.netProfitCents)}
          delta={overview.profitDelta}
          hint={`${formatPercent(overview.profitMargin)} margin`}
        />
        <KpiCard
          label="Outstanding"
          value={formatMoney(overview.outstandingCents)}
          hint="Pending + partial + overdue"
        />
      </section>

      {/* Trend chart + insights */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-10">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardSubtitle>Revenue, expenses, and profit across the last 8 months.</CardSubtitle>
          </CardHeader>
          <CardBody>
            <TrendChart data={trend} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardSubtitle>Generated from current data.</CardSubtitle>
          </CardHeader>
          <CardBody>
            <QuickInsights items={insights} />
          </CardBody>
        </Card>
      </section>

      {/* Expense distribution + top clients */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-10">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <CardSubtitle>Share of total operational spend.</CardSubtitle>
          </CardHeader>
          <CardBody>
            <DonutChart data={distribution} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardSubtitle>By revenue, all-time.</CardSubtitle>
          </CardHeader>
          <CardBody>
            <TopClientsList data={clients} />
          </CardBody>
        </Card>
      </section>

      {/* Services */}
      <section className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Service Profitability</CardTitle>
            <CardSubtitle>Margin and profit by service line.</CardSubtitle>
          </CardHeader>
          <CardBody>
            <ServiceProfitability data={services} />
          </CardBody>
        </Card>
      </section>
    </AppShell>
  );
}
