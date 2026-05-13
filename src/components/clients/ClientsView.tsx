"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClientForm } from "@/components/clients/ClientForm";

interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  notes: string | null;
  _count?: { sales: number };
}

export function ClientsView({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = React.useState<Client[]>(initialClients);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [search, setSearch] = React.useState("");

  async function reload() {
    const res = await fetch("/api/clients");
    const j = await res.json();
    setClients(j.data);
  }

  async function remove(c: Client) {
    if (!confirm(`Delete ${c.company ?? c.name}?`)) return;
    await fetch(`/api/clients/${c.id}`, { method: "DELETE" });
    reload();
  }

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="pl-9"
          />
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setDrawerOpen(true); }}>
          <Plus size={14} />
          New Client
        </Button>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title={clients.length === 0 ? "No clients yet" : "No matches"}
            description="Add a client to start tracking their projects and profitability."
            action={clients.length === 0 ? <Button variant="primary" onClick={() => setDrawerOpen(true)}><Plus size={14} />New Client</Button> : undefined}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Company</TH>
                <TH>Contact</TH>
                <TH>Email</TH>
                <TH>Country</TH>
                <TH className="text-right">Projects</TH>
                <TH className="text-right w-24">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium">{c.company ?? "—"}</TD>
                  <TD>{c.name}</TD>
                  <TD className="text-ink-500">{c.email ?? "—"}</TD>
                  <TD className="text-ink-500">{c.country ?? "—"}</TD>
                  <TD className="text-right num">{c._count?.sales ?? 0}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditing(c); setDrawerOpen(true); }}
                        className="rounded-md p-1.5 text-ink-500 hover:text-ink hover:bg-ink-100 transition-colors"
                      >
                        <Pencil size={13} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        className="rounded-md p-1.5 text-ink-500 hover:text-negative hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Client" : "New Client"}
      >
        <ClientForm
          initial={editing}
          onCancel={() => setDrawerOpen(false)}
          onSaved={() => { setDrawerOpen(false); reload(); }}
        />
      </Drawer>
    </>
  );
}
