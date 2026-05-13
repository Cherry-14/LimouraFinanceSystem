import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { SalesView } from "@/components/sales/SalesView";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [salesRes, clientsRes] = await Promise.all([
    db.from("Sale").select("*, client:Client(id, name, company)").is("deletedAt", null).order("invoiceDate", { ascending: false }).limit(500),
    db.from("Client").select("id, name, company").is("deletedAt", null).order("name", { ascending: true }),
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Revenue"
        title="Sales"
        description="Every invoice, project, and payment status — manually tracked."
      />
      <SalesView initialSales={(salesRes.data ?? []) as any} clients={(clientsRes.data ?? []) as any} />
    </AppShell>
  );
}
