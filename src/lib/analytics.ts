import { db } from "./db";
import { monthKey, formatMonthLabel } from "./formatters";
import type {
  DashboardOverview,
  MonthlyPoint,
  ClientProfitabilityRow,
  ServiceProfitabilityRow,
  ExpenseDistributionRow,
  QuickInsight,
} from "@/types";

export function startOfMonth(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(1);
  return x;
}

export function endOfMonth(d: Date): Date {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  x.setMilliseconds(-1);
  return x;
}

export function lastNMonths(n: number, anchor: Date = new Date()): { start: Date; end: Date; key: string; label: string }[] {
  const out: { start: Date; end: Date; key: string; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    out.push({ start: startOfMonth(d), end: endOfMonth(d), key: monthKey(d), label: formatMonthLabel(d) });
  }
  return out;
}

export async function getOverview(range?: { from: Date; to: Date }): Promise<DashboardOverview> {
  const to = range?.to ?? endOfMonth(new Date());
  const from = range?.from ?? (() => {
    const x = startOfMonth(new Date());
    x.setMonth(x.getMonth() - 5);
    return x;
  })();

  const [salesRes, expensesRes] = await Promise.all([
    db.from("Sale").select("revenueCents, projectCostCents, amountPaidCents")
      .is("deletedAt", null).gte("invoiceDate", from.toISOString()).lte("invoiceDate", to.toISOString()),
    db.from("Expense").select("amountCents")
      .is("deletedAt", null).gte("expenseDate", from.toISOString()).lte("expenseDate", to.toISOString()),
  ]);

  const sales = salesRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const totalRevenueCents = sales.reduce((s, r) => s + r.revenueCents, 0);
  const totalCostCents = sales.reduce((s, r) => s + r.projectCostCents, 0);
  const totalOperationalCents = expenses.reduce((s, r) => s + r.amountCents, 0);
  const totalExpensesCents = totalCostCents + totalOperationalCents;
  const netProfitCents = totalRevenueCents - totalExpensesCents;
  const profitMargin = totalRevenueCents > 0 ? netProfitCents / totalRevenueCents : 0;
  const outstandingCents = sales.reduce((s, r) => s + Math.max(0, r.revenueCents - r.amountPaidCents), 0);

  const periodMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - periodMs);

  const [prevSalesRes, prevExpensesRes] = await Promise.all([
    db.from("Sale").select("revenueCents, projectCostCents")
      .is("deletedAt", null).gte("invoiceDate", prevFrom.toISOString()).lte("invoiceDate", prevTo.toISOString()),
    db.from("Expense").select("amountCents")
      .is("deletedAt", null).gte("expenseDate", prevFrom.toISOString()).lte("expenseDate", prevTo.toISOString()),
  ]);

  const prevSales = prevSalesRes.data ?? [];
  const prevExpenses = prevExpensesRes.data ?? [];
  const prevRevenue = prevSales.reduce((s, r) => s + r.revenueCents, 0);
  const prevExpenseTotal = prevSales.reduce((s, r) => s + r.projectCostCents, 0) + prevExpenses.reduce((s, r) => s + r.amountCents, 0);
  const prevProfit = prevRevenue - prevExpenseTotal;

  const delta = (curr: number, prev: number) => prev === 0 ? (curr === 0 ? 0 : 1) : (curr - prev) / Math.abs(prev);

  return { totalRevenueCents, totalExpensesCents, netProfitCents, profitMargin, outstandingCents,
    revenueDelta: delta(totalRevenueCents, prevRevenue),
    expensesDelta: delta(totalExpensesCents, prevExpenseTotal),
    profitDelta: delta(netProfitCents, prevProfit) };
}

export async function getMonthlyTrend(months: number = 8): Promise<MonthlyPoint[]> {
  const buckets = lastNMonths(months);
  const overallStart = buckets[0].start;
  const overallEnd = buckets[buckets.length - 1].end;

  const [salesRes, expensesRes] = await Promise.all([
    db.from("Sale").select("revenueCents, projectCostCents, invoiceDate")
      .is("deletedAt", null).gte("invoiceDate", overallStart.toISOString()).lte("invoiceDate", overallEnd.toISOString()),
    db.from("Expense").select("amountCents, expenseDate")
      .is("deletedAt", null).gte("expenseDate", overallStart.toISOString()).lte("expenseDate", overallEnd.toISOString()),
  ]);

  const sales = salesRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  return buckets.map((b) => {
    let revenueCents = 0, projectCostCents = 0, opexCents = 0;
    for (const s of sales) {
      const d = new Date(s.invoiceDate as string);
      if (d >= b.start && d <= b.end) { revenueCents += s.revenueCents; projectCostCents += s.projectCostCents; }
    }
    for (const e of expenses) {
      const d = new Date(e.expenseDate as string);
      if (d >= b.start && d <= b.end) opexCents += e.amountCents;
    }
    const expensesCents = projectCostCents + opexCents;
    return { month: b.key, label: b.label, revenueCents, expensesCents, profitCents: revenueCents - expensesCents };
  });
}

export async function getClientProfitability(range?: { from: Date; to: Date }): Promise<ClientProfitabilityRow[]> {
  let query = db.from("Sale").select("clientId, revenueCents, projectCostCents, client:Client(name, company)").is("deletedAt", null);
  if (range) query = query.gte("invoiceDate", range.from.toISOString()).lte("invoiceDate", range.to.toISOString());
  const { data: sales } = await query;

  const map = new Map<string, ClientProfitabilityRow>();
  for (const s of sales ?? []) {
    const clientRaw = s.client as unknown;
    const client = (Array.isArray(clientRaw) ? clientRaw[0] : clientRaw) as { name: string; company: string | null } | null;
    const row = map.get(s.clientId) ?? { clientId: s.clientId, clientName: client?.name ?? "Unknown",
      company: client?.company ?? null, revenueCents: 0, costCents: 0, profitCents: 0, projects: 0 };
    row.revenueCents += s.revenueCents;
    row.costCents += s.projectCostCents;
    row.profitCents = row.revenueCents - row.costCents;
    row.projects += 1;
    map.set(s.clientId, row);
  }
  return Array.from(map.values()).sort((a, b) => b.profitCents - a.profitCents);
}

export async function getServiceProfitability(range?: { from: Date; to: Date }): Promise<ServiceProfitabilityRow[]> {
  let query = db.from("Sale").select("serviceType, revenueCents, projectCostCents").is("deletedAt", null);
  if (range) query = query.gte("invoiceDate", range.from.toISOString()).lte("invoiceDate", range.to.toISOString());
  const { data: sales } = await query;

  const map = new Map<string, ServiceProfitabilityRow>();
  for (const s of sales ?? []) {
    const row = map.get(s.serviceType) ?? { service: s.serviceType, revenueCents: 0, costCents: 0, profitCents: 0, projects: 0, marginPct: 0 };
    row.revenueCents += s.revenueCents;
    row.costCents += s.projectCostCents;
    row.profitCents = row.revenueCents - row.costCents;
    row.projects += 1;
    row.marginPct = row.revenueCents > 0 ? row.profitCents / row.revenueCents : 0;
    map.set(s.serviceType, row);
  }
  return Array.from(map.values()).sort((a, b) => b.profitCents - a.profitCents);
}

export async function getExpenseDistribution(range?: { from: Date; to: Date }): Promise<ExpenseDistributionRow[]> {
  let query = db.from("Expense").select("category, amountCents").is("deletedAt", null);
  if (range) query = query.gte("expenseDate", range.from.toISOString()).lte("expenseDate", range.to.toISOString());
  const { data: expenses } = await query;

  const totals = new Map<string, number>();
  for (const e of expenses ?? []) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amountCents);
  const grand = Array.from(totals.values()).reduce((a, b) => a + b, 0);

  return Array.from(totals.entries())
    .map(([category, amountCents]) => ({ category, amountCents, share: grand > 0 ? amountCents / grand : 0 }))
    .sort((a, b) => b.amountCents - a.amountCents);
}

export async function getQuickInsights(): Promise<QuickInsight[]> {
  const insights: QuickInsight[] = [];
  const [trend, services, clients, expenses] = await Promise.all([
    getMonthlyTrend(3), getServiceProfitability(), getClientProfitability(), getExpenseDistribution(),
  ]);

  const best = [...services].sort((a, b) => b.marginPct - a.marginPct)[0];
  if (best?.revenueCents > 0)
    insights.push({ id: "best-margin", tone: "positive", text: `${best.service} has the highest profit margin at ${Math.round(best.marginPct * 100)}%` });

  const totalRevenue = clients.reduce((s, c) => s + c.revenueCents, 0);
  const topClient = clients[0];
  if (topClient && totalRevenue > 0) {
    const share = topClient.revenueCents / totalRevenue;
    insights.push({ id: "top-client", tone: share > 0.4 ? "warning" : "neutral",
      text: `${topClient.company ?? topClient.clientName} generated ${Math.round(share * 100)}% of revenue${share > 0.4 ? " — consider diversifying" : ""}` });
  }

  if (trend.length >= 2) {
    const last = trend[trend.length - 1], prev = trend[trend.length - 2];
    if (prev.expensesCents > 0) {
      const change = (last.expensesCents - prev.expensesCents) / prev.expensesCents;
      if (Math.abs(change) > 0.1)
        insights.push({ id: "expense-change", tone: change > 0 ? "warning" : "positive",
          text: `Expenses ${change > 0 ? "rose" : "fell"} ${Math.round(Math.abs(change) * 100)}% versus last month` });
    }
  }

  const topExpense = expenses[0];
  if (topExpense)
    insights.push({ id: "top-expense", tone: "neutral", text: `${topExpense.category} is the largest expense at ${Math.round(topExpense.share * 100)}% of total spend` });

  if (trend.length >= 2) {
    const last = trend[trend.length - 1], prev = trend[trend.length - 2];
    if (prev.profitCents !== 0) {
      const change = (last.profitCents - prev.profitCents) / Math.abs(prev.profitCents);
      if (Math.abs(change) > 0.05)
        insights.push({ id: "profit-trend", tone: change > 0 ? "positive" : "warning",
          text: `Net profit is ${change > 0 ? "up" : "down"} ${Math.round(Math.abs(change) * 100)}% versus last month` });
    }
  }

  return insights.slice(0, 5);
}
