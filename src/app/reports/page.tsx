import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReportsView } from "@/components/reports/ReportsView";

export default function ReportsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Documents"
        title="Reports"
        description="Generate downloadable PDF reports for any date range."
      />
      <ReportsView />
    </AppShell>
  );
}
