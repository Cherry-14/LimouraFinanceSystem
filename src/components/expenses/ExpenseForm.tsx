"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EXPENSE_CATEGORIES } from "@/constants";
import { dollarsToCents, centsToDollars } from "@/lib/formatters";

interface ExpenseFormValues {
  id?: string;
  category: string;
  subcategory: string;
  vendor: string;
  description: string;
  amount: string;
  expenseDate: string;
  receiptUrl: string;
}

const empty: ExpenseFormValues = {
  category: EXPENSE_CATEGORIES[0],
  subcategory: "",
  vendor: "",
  description: "",
  amount: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  receiptUrl: "",
};

export function ExpenseForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: any;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = React.useState<ExpenseFormValues>(() => {
    if (initial) {
      return {
        id: initial.id,
        category: initial.category,
        subcategory: initial.subcategory ?? "",
        vendor: initial.vendor ?? "",
        description: initial.description ?? "",
        amount: String(centsToDollars(initial.amountCents)),
        expenseDate: new Date(initial.expenseDate).toISOString().slice(0, 10),
        receiptUrl: initial.receiptUrl ?? "",
      };
    }
    return empty;
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function update<K extends keyof ExpenseFormValues>(key: K, value: ExpenseFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        category: values.category,
        subcategory: values.subcategory || null,
        vendor: values.vendor || null,
        description: values.description || null,
        amountCents: dollarsToCents(values.amount || "0"),
        expenseDate: values.expenseDate,
        receiptUrl: values.receiptUrl || null,
      };
      const url = values.id ? `/api/expenses/${values.id}` : "/api/expenses";
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
          <Label>Category</Label>
          <Select value={values.category} onChange={(e) => update("category", e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Subcategory</Label>
          <Input
            value={values.subcategory}
            onChange={(e) => update("subcategory", e.target.value)}
            placeholder="e.g. Adobe Creative Cloud"
          />
        </div>
        <div>
          <Label>Vendor</Label>
          <Input
            value={values.vendor}
            onChange={(e) => update("vendor", e.target.value)}
            placeholder="Who did you pay?"
          />
        </div>
        <div>
          <Label>Amount (USD)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={values.amount}
            onChange={(e) => update("amount", e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={values.expenseDate}
            onChange={(e) => update("expenseDate", e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Receipt URL (optional)</Label>
          <Input
            type="url"
            value={values.receiptUrl}
            onChange={(e) => update("receiptUrl", e.target.value)}
            placeholder="Link to receipt or drive file"
          />
        </div>
      </section>

      <div>
        <Label>Description</Label>
        <Textarea
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : values.id ? "Save changes" : "Add expense"}
        </Button>
      </div>
    </form>
  );
}
