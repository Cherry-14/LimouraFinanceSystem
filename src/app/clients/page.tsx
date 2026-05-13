import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientsView } from "@/components/clients/ClientsView";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clientsRes, salesRes] = await Promise.all([
    db.from("Client").select("*").is("deletedAt", null).order("name", { ascending: true }),
    db.from("Sale").select("clientId").is("deletedAt", null),
  ]);

  const countMap = new Map<string, number>();
  for (const s of salesRes.data ?? []) {
    countMap.set(s.clientId, (countMap.get(s.clientId) ?? 0) + 1);
  }

  const clients = (clientsRes.data ?? []).map((c) => ({
    ...c,
    _count: { sales: countMap.get(c.id) ?? 0 },
  }));

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
