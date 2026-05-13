import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import {
  getOverview,
  getMonthlyTrend,
  getClientProfitability,
  getServiceProfitability,
  getExpenseDistribution,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // Default range: last 180 days
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 180);

  const [overview, trend, clients, services, distribution] = await Promise.all([
    getOverview({ from, to }),
    getMonthlyTrend(8),
    getClientProfitability({ from, to }),
    getServiceProfitability({ from, to }),
    getExpenseDistribution({ from, to }),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Deep-dive into profitability, trends, and category-level performance."
      />
      <AnalyticsView
        initialData={{ overview, trend, clients, services, distribution }}
      />
    </AppShell>
  );
}
