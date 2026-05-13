"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SERVICE_TYPES, PAYMENT_STATUSES, PAYMENT_METHODS } from "@/constants";
import { dollarsToCents, centsToDollars } from "@/lib/formatters";

interface Client {
  id: string;
  name: string;
  company: string | null;
}

interface SaleFormValues {
  id?: string;
  invoiceNumber: string;
  projectName: string;
  serviceType: string;
  clientId: string;
  revenue: string;
  projectCost: string;
  paymentStatus: string;
  paymentMethod: string;
  amountPaid: string;
  invoiceDate: string;
  dueDate: string;
  paidDate: string;
  notes: string;
}

const empty: SaleFormValues = {
  invoiceNumber: "",
  projectName: "",
  serviceType: SERVICE_TYPES[0],
  clientId: "",
  revenue: "",
  projectCost: "",
  paymentStatus: "PENDING",
  paymentMethod: "Bank Transfer",
  amountPaid: "0",
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  paidDate: "",
  notes: "",
};

function suggestInvoiceNumber() {
  const y = new Date().getFullYear();
  const r = Math.floor(1000 + Math.random() * 9000);
  return `LIM-${y}-${r}`;
}

export function SaleForm({
  initial,
  clients,
  onCancel,
  onSaved,
}: {
  initial?: any;
  clients: Client[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = React.useState<SaleFormValues>(() => {
    if (initial) {
      return {
        id: initial.id,
        invoiceNumber: initial.invoiceNumber,
        projectName: initial.projectName,
        serviceType: initial.serviceType,
        clientId: initial.clientId,
        revenue: String(centsToDollars(initial.revenueCents)),
        projectCost: String(centsToDollars(initial.projectCostCents)),
        paymentStatus: initial.paymentStatus,
        paymentMethod: initial.paymentMethod ?? "Bank Transfer",
        amountPaid: String(centsToDollars(initial.amountPaidCents)),
        invoiceDate: new Date(initial.invoiceDate).toISOString().slice(0, 10),
        dueDate: initial.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : "",
        paidDate: initial.paidDate ? new Date(initial.paidDate).toISOString().slice(0, 10) : "",
        notes: initial.notes ?? "",
      };
    }
    return { ...empty, invoiceNumber: suggestInvoiceNumber(), clientId: clients[0]?.id ?? "" };
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function update<K extends keyof SaleFormValues>(key: K, value: SaleFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  // Live computed profit
  const revenueCents = dollarsToCents(values.revenue || "0");
  const costCents = dollarsToCents(values.projectCost || "0");
  const profitCents = revenueCents - costCents;
  const margin = revenueCents > 0 ? profitCents / revenueCents : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        invoiceNumber: values.invoiceNumber,
        projectName: values.projectName,
        serviceType: values.serviceType,
        clientId: values.clientId,
        revenueCents,
        projectCostCents: costCents,
        paymentStatus: values.paymentStatus as any,
        paymentMethod: values.paymentMethod,
        amountPaidCents: dollarsToCents(values.amountPaid || "0"),
        invoiceDate: values.invoiceDate,
        dueDate: values.dueDate || null,
        paidDate: values.paidDate || null,
        notes: values.notes || null,
      };

      const url = values.id ? `/api/sales/${values.id}` : "/api/sales";
      const method = values.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to save");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 text-negative px-3 py-2 text-xs">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Invoice Number</Label>
          <Input
            value={values.invoiceNumber}
            onChange={(e) => update("invoiceNumber", e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Invoice Date</Label>
          <Input
            type="date"
            value={values.invoiceDate}
            onChange={(e) => update("invoiceDate", e.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Project Name</Label>
          <Input
            value={values.projectName}
            onChange={(e) => update("projectName", e.target.value)}
            placeholder="e.g. A+ Content — Verdant Wellness"
            required
          />
        </div>
        <div>
          <Label>Client</Label>
          <Select value={values.clientId} onChange={(e) => update("clientId", e.target.value)} required>
            {clients.length === 0 && <option value="">No clients yet</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company ?? c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Service Type</Label>
          <Select value={values.serviceType} onChange={(e) => update("serviceType", e.target.value)}>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      </section>

      <section>
        <h3 className="text-2xs uppercase tracking-[0.18em] text-ink-500 mb-3">Financials</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Revenue (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={values.revenue}
              onChange={(e) => update("revenue", e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label>Project Cost (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={values.projectCost}
              onChange={(e) => update("projectCost", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label>Net Profit</Label>
            <div className="field bg-ink-50 cursor-not-allowed flex items-center justify-between gap-2">
              <span className="num text-ink">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(centsToDollars(profitCents))}
              </span>
              <span className="text-2xs text-ink-500 num">
                {revenueCents > 0 ? `${Math.round(margin * 100)}%` : "—"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xs uppercase tracking-[0.18em] text-ink-500 mb-3">Payment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Select value={values.paymentStatus} onChange={(e) => update("paymentStatus", e.target.value)}>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Method</Label>
            <Select value={values.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Amount Paid (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={values.amountPaid}
              onChange={(e) => update("amountPaid", e.target.value)}
            />
          </div>
          <div>
            <Label>Paid Date</Label>
            <Input
              type="date"
              value={values.paidDate}
              onChange={(e) => update("paidDate", e.target.value)}
            />
          </div>
          <div>
            <Label>Due Date</Label>
            <Input
              type="date"
              value={values.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section>
        <Label>Notes</Label>
        <Textarea
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Optional context for this project…"
        />
      </section>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : values.id ? "Save changes" : "Create invoice"}
        </Button>
      </div>
    </form>
  );
}
