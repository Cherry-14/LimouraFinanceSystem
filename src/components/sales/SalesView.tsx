"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { PaymentStatusBadge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { SaleForm } from "@/components/sales/SaleForm";
import { formatMoney, formatDate } from "@/lib/formatters";
import { generateRevenueReport } from "@/lib/pdf-export";
import { SERVICE_TYPES, PAYMENT_STATUSES } from "@/constants";

interface Sale {
  id: string;
  invoiceNumber: string;
  projectName: string;
  serviceType: string;
  clientId: string;
  client: { id: string; name: string; company: string | null };
  revenueCents: number;
  projectCostCents: number;
  paymentStatus: string;
  paymentMethod: string | null;
  amountPaidCents: number;
  invoiceDate: string;
  notes: string | null;
}

interface Client {
  id: string;
  name: string;
  company: string | null;
}

export function SalesView({ initialSales, clients }: { initialSales: Sale[]; clients: Client[] }) {
  const [sales, setSales] = React.useState<Sale[]>(initialSales);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Sale | null>(null);
  const [search, setSearch] = React.useState("");
  const [serviceFilter, setServiceFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  async function reload() {
    const res = await fetch("/api/sales?take=500");
    const j = await res.json();
    setSales(j.data);
  }

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(sale: Sale) {
    setEditing(sale);
    setDrawerOpen(true);
  }

  async function remove(sale: Sale) {
    if (!confirm(`Delete invoice ${sale.invoiceNumber}? This is a soft delete.`)) return;
    await fetch(`/api/sales/${sale.id}`, { method: "DELETE" });
    reload();
  }

  const filtered = sales.filter((s) => {
    const matchesSearch =
      !search ||
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.projectName.toLowerCase().includes(search.toLowerCase()) ||
      (s.client.company ?? s.client.name).toLowerCase().includes(search.toLowerCase());
    const matchesService = !serviceFilter || s.serviceType === serviceFilter;
    const matchesStatus = !statusFilter || s.paymentStatus === statusFilter;
    return matchesSearch && matchesService && matchesStatus;
  });

  function exportPdf() {
    generateRevenueReport(filtered, `${filtered.length} invoices`);
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice, project, client…"
            className="pl-9"
          />
        </div>
        <Select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="sm:w-48">
          <option value="">All services</option>
          {SERVICE_TYPES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-40">
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPdf} disabled={filtered.length === 0}>
            <Download size={14} strokeWidth={1.5} />
            Export PDF
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={14} strokeWidth={2} />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description={sales.length === 0 ? "Add your first sale to start tracking revenue." : "Try clearing the filters."}
            action={sales.length === 0 ? <Button variant="primary" onClick={openCreate}><Plus size={14} />New Invoice</Button> : undefined}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Invoice</TH>
                <TH>Date</TH>
                <TH>Client</TH>
                <TH>Project</TH>
                <TH>Service</TH>
                <TH className="text-right">Revenue</TH>
                <TH className="text-right">Profit</TH>
                <TH>Status</TH>
                <TH className="text-right w-24">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((s) => {
                const profit = s.revenueCents - s.projectCostCents;
                return (
                  <TR key={s.id}>
                    <TD className="font-mono text-xs text-ink-700">{s.invoiceNumber}</TD>
                    <TD className="text-ink-500 whitespace-nowrap">{formatDate(s.invoiceDate)}</TD>
                    <TD className="font-medium">{s.client.company ?? s.client.name}</TD>
                    <TD className="max-w-[200px] truncate">{s.projectName}</TD>
                    <TD className="text-ink-700">{s.serviceType}</TD>
                    <TD className="text-right num font-medium">{formatMoney(s.revenueCents)}</TD>
                    <TD className="text-right num text-ink-700">{formatMoney(profit)}</TD>
                    <TD><PaymentStatusBadge status={s.paymentStatus} /></TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-md p-1.5 text-ink-500 hover:text-ink hover:bg-ink-100 transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil size={13} strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => remove(s)}
                          className="rounded-md p-1.5 text-ink-500 hover:text-negative hover:bg-red-50 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </div>

      {/* Summary line */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-2xs uppercase tracking-wider text-ink-500">
          <span>{filtered.length} {filtered.length === 1 ? "invoice" : "invoices"}</span>
          <span className="num">
            Total: <span className="text-ink font-medium normal-case tracking-normal">
              {formatMoney(filtered.reduce((s, r) => s + r.revenueCents, 0))}
            </span>
          </span>
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Invoice" : "New Invoice"}
        subtitle={editing ? "Update the details below" : "Add a new revenue entry"}
        size="lg"
      >
        <SaleForm
          initial={editing}
          clients={clients}
          onCancel={() => setDrawerOpen(false)}
          onSaved={() => {
            setDrawerOpen(false);
            reload();
          }}
        />
      </Drawer>
    </>
  );
}
