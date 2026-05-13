"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";

interface ClientFormValues {
  id?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
}

const empty: ClientFormValues = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  notes: "",
};

export function ClientForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: any;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = React.useState<ClientFormValues>(() =>
    initial
      ? {
          id: initial.id,
          name: initial.name,
          company: initial.company ?? "",
          email: initial.email ?? "",
          phone: initial.phone ?? "",
          country: initial.country ?? "",
          notes: initial.notes ?? "",
        }
      : empty,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function update<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = values.id ? `/api/clients/${values.id}` : "/api/clients";
      const method = values.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          company: values.company || null,
          email: values.email || null,
          phone: values.phone || null,
          country: values.country || null,
          notes: values.notes || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Failed");
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
          <Label>Contact Name</Label>
          <Input value={values.name} onChange={(e) => update("name", e.target.value)} required />
        </div>
        <div>
          <Label>Company</Label>
          <Input value={values.company} onChange={(e) => update("company", e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={values.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Country</Label>
          <Input value={values.country} onChange={(e) => update("country", e.target.value)} />
        </div>
      </section>
      <div>
        <Label>Notes</Label>
        <Textarea value={values.notes} onChange={(e) => update("notes", e.target.value)} />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : values.id ? "Save changes" : "Add client"}
        </Button>
      </div>
    </form>
  );
}
