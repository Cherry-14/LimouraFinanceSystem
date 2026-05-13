import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { SalesView } from "@/components/sales/SalesView";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [sales, clients] = await Promise.all([
    prisma.sale.findMany({
      where: { deletedAt: null },
      include: { client: true },
      orderBy: { invoiceDate: "desc" },
      take: 500,
    }),
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
  ]);

  // Serialize Dates
  const serialized = sales.map((s) => ({
    ...s,
    invoiceDate: s.invoiceDate.toISOString(),
    dueDate: s.dueDate?.toISOString() ?? null,
    paidDate: s.paidDate?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    deletedAt: s.deletedAt?.toISOString() ?? null,
  }));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Revenue"
        title="Sales"
        description="Every invoice, project, and payment status — manually tracked."
      />
      <SalesView initialSales={serialized as any} clients={clients} />
    </AppShell>
  );
}
