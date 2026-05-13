"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { formatMoney, formatDate } from "@/lib/formatters";
import { generateExpenseReport } from "@/lib/pdf-export";
import { EXPENSE_CATEGORIES } from "@/constants";

interface Expense {
  id: string;
  category: string;
  subcategory: string | null;
  vendor: string | null;
  description: string | null;
  amountCents: number;
  expenseDate: string;
  receiptUrl: string | null;
}

export function ExpensesView({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [items, setItems] = React.useState<Expense[]>(initialExpenses);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");

  async function reload() {
    const res = await fetch("/api/expenses?take=500");
    const j = await res.json();
    setItems(j.data);
  }

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(e: Expense) {
    setEditing(e);
    setDrawerOpen(true);
  }
  async function remove(e: Expense) {
    if (!confirm(`Delete expense "${e.description ?? e.vendor ?? e.category}"?`)) return;
    await fetch(`/api/expenses/${e.id}`, { method: "DELETE" });
    reload();
  }

  const filtered = items.filter((e) => {
    const matchesSearch =
      !search ||
      (e.vendor ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.subcategory ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function exportPdf() {
    generateExpenseReport(filtered, `${filtered.length} entries`);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor, subcategory, description…"
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-56">
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPdf} disabled={filtered.length === 0}>
            <Download size={14} strokeWidth={1.5} />
            Export PDF
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={14} strokeWidth={2} />
            New Expense
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Track operational costs to see profitability."
            action={items.length === 0 ? <Button variant="primary" onClick={openCreate}><Plus size={14} />New Expense</Button> : undefined}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Category</TH>
                <TH>Subcategory</TH>
                <TH>Vendor</TH>
                <TH>Description</TH>
                <TH className="text-right">Amount</TH>
                <TH className="text-right w-24">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((e) => (
                <TR key={e.id}>
                  <TD className="text-ink-500 whitespace-nowrap">{formatDate(e.expenseDate)}</TD>
                  <TD className="font-medium">{e.category}</TD>
                  <TD className="text-ink-700">{e.subcategory ?? "—"}</TD>
                  <TD>{e.vendor ?? "—"}</TD>
                  <TD className="text-ink-500 max-w-[260px] truncate">{e.description ?? "—"}</TD>
                  <TD className="text-right num font-medium">{formatMoney(e.amountCents)}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(e)}
                        className="rounded-md p-1.5 text-ink-500 hover:text-ink hover:bg-ink-100 transition-colors"
                      >
                        <Pencil size={13} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => remove(e)}
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

      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-2xs uppercase tracking-wider text-ink-500">
          <span>{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</span>
          <span className="num">
            Total: <span className="text-ink font-medium normal-case tracking-normal">
              {formatMoney(filtered.reduce((s, e) => s + e.amountCents, 0))}
            </span>
          </span>
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Expense" : "New Expense"}
        subtitle={editing ? "Update the details below" : "Add an operational cost"}
      >
        <ExpenseForm
          initial={editing}
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
