import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientsView } from "@/components/clients/ClientsView";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { sales: true } } },
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Directory"
        title="Clients"
        description="Brand owners and businesses we serve."
      />
      <ClientsView initialClients={clients as any} />
    </AppShell>
  );
}
