import { prisma } from "./prisma";
import { monthKey, formatMonthLabel } from "./formatters";
import type {
  DashboardOverview,
  MonthlyPoint,
  ClientProfitabilityRow,
  ServiceProfitabilityRow,
  ExpenseDistributionRow,
  QuickInsight,
} from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────────────────────

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
    out.push({
      start: startOfMonth(d),
      end: endOfMonth(d),
      key: monthKey(d),
      label: formatMonthLabel(d),
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview KPIs
// ─────────────────────────────────────────────────────────────────────────────

export async function getOverview(range?: { from: Date; to: Date }): Promise<DashboardOverview> {
  const to = range?.to ?? endOfMonth(new Date());
  const from = range?.from ?? (() => {
    const x = startOfMonth(new Date());
    x.setMonth(x.getMonth() - 5);
    return x;
  })();

  // Period
  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { deletedAt: null, invoiceDate: { gte: from, lte: to } },
      select: { revenueCents: true, projectCostCents: true, amountPaidCents: true },
    }),
    prisma.expense.findMany({
      where: { deletedAt: null, expenseDate: { gte: from, lte: to } },
      select: { amountCents: true },
    }),
  ]);

  const totalRevenueCents = sales.reduce((s, r) => s + r.revenueCents, 0);
  const totalCostCents = sales.reduce((s, r) => s + r.projectCostCents, 0);
  const totalOperationalCents = expenses.reduce((s, r) => s + r.amountCents, 0);
  // Net profit = revenue - all costs (project costs are already a form of expense for that project,
  // and operational expenses are overhead). Adjust to your preferred accounting model.
  const totalExpensesCents = totalCostCents + totalOperationalCents;
  const netProfitCents = totalRevenueCents - totalExpensesCents;
  const profitMargin = totalRevenueCents > 0 ? netProfitCents / totalRevenueCents : 0;
  const outstandingCents = sales.reduce(
    (s, r) => s + Math.max(0, r.revenueCents - r.amountPaidCents),
    0,
  );

  // Previous equivalent period
  const periodMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - periodMs);

  const [prevSales, prevExpenses] = await Promise.all([
    prisma.sale.findMany({
      where: { deletedAt: null, invoiceDate: { gte: prevFrom, lte: prevTo } },
      select: { revenueCents: true, projectCostCents: true },
    }),
    prisma.expense.findMany({
      where: { deletedAt: null, expenseDate: { gte: prevFrom, lte: prevTo } },
      select: { amountCents: true },
    }),
  ]);

  const prevRevenue = prevSales.reduce((s, r) => s + r.revenueCents, 0);
  const prevExpenseTotal =
    prevSales.reduce((s, r) => s + r.projectCostCents, 0) +
    prevExpenses.reduce((s, r) => s + r.amountCents, 0);
  const prevProfit = prevRevenue - prevExpenseTotal;

  const delta = (curr: number, prev: number) => {
    if (prev === 0) return curr === 0 ? 0 : 1;
    return (curr - prev) / Math.abs(prev);
  };

  return {
    totalRevenueCents,
    totalExpensesCents,
    netProfitCents,
    profitMargin,
    outstandingCents,
    revenueDelta: delta(totalRevenueCents, prevRevenue),
    expensesDelta: delta(totalExpensesCents, prevExpenseTotal),
    profitDelta: delta(netProfitCents, prevProfit),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly trend
// ─────────────────────────────────────────────────────────────────────────────

export async function getMonthlyTrend(months: number = 8): Promise<MonthlyPoint[]> {
  const buckets = lastNMonths(months);
  const overallStart = buckets[0].start;
  const overallEnd = buckets[buckets.length - 1].end;

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { deletedAt: null, invoiceDate: { gte: overallStart, lte: overallEnd } },
      select: { revenueCents: true, projectCostCents: true, invoiceDate: true },
    }),
    prisma.expense.findMany({
      where: { deletedAt: null, expenseDate: { gte: overallStart, lte: overallEnd } },
      select: { amountCents: true, expenseDate: true },
    }),
  ]);

  return buckets.map((b) => {
    let revenueCents = 0;
    let projectCostCents = 0;
    let opexCents = 0;
    for (const s of sales) {
      if (s.invoiceDate >= b.start && s.invoiceDate <= b.end) {
        revenueCents += s.revenueCents;
        projectCostCents += s.projectCostCents;
      }
    }
    for (const e of expenses) {
      if (e.expenseDate >= b.start && e.expenseDate <= b.end) {
        opexCents += e.amountCents;
      }
    }
    const expensesCents = projectCostCents + opexCents;
    return {
      month: b.key,
      label: b.label,
      revenueCents,
      expensesCents,
      profitCents: revenueCents - expensesCents,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Client profitability
// ─────────────────────────────────────────────────────────────────────────────

export async function getClientProfitability(range?: { from: Date; to: Date }): Promise<ClientProfitabilityRow[]> {
  const sales = await prisma.sale.findMany({
    where: {
      deletedAt: null,
      ...(range ? { invoiceDate: { gte: range.from, lte: range.to } } : {}),
    },
    include: { client: true },
  });

  const map = new Map<string, ClientProfitabilityRow>();
  for (const s of sales) {
    const existing = map.get(s.clientId) ?? {
      clientId: s.clientId,
      clientName: s.client.name,
      company: s.client.company,
      revenueCents: 0,
      costCents: 0,
      profitCents: 0,
      projects: 0,
    };
    existing.revenueCents += s.revenueCents;
    existing.costCents += s.projectCostCents;
    existing.profitCents = existing.revenueCents - existing.costCents;
    existing.projects += 1;
    map.set(s.clientId, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.profitCents - a.profitCents);
}

// ─────────────────────────────────────────────────────────────────────────────
// Service profitability
// ─────────────────────────────────────────────────────────────────────────────

export async function getServiceProfitability(range?: { from: Date; to: Date }): Promise<ServiceProfitabilityRow[]> {
  const sales = await prisma.sale.findMany({
    where: {
      deletedAt: null,
      ...(range ? { invoiceDate: { gte: range.from, lte: range.to } } : {}),
    },
    select: { serviceType: true, revenueCents: true, projectCostCents: true },
  });

  const map = new Map<string, ServiceProfitabilityRow>();
  for (const s of sales) {
    const existing = map.get(s.serviceType) ?? {
      service: s.serviceType,
      revenueCents: 0,
      costCents: 0,
      profitCents: 0,
      projects: 0,
      marginPct: 0,
    };
    existing.revenueCents += s.revenueCents;
    existing.costCents += s.projectCostCents;
    existing.profitCents = existing.revenueCents - existing.costCents;
    existing.projects += 1;
    existing.marginPct =
      existing.revenueCents > 0 ? existing.profitCents / existing.revenueCents : 0;
    map.set(s.serviceType, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.profitCents - a.profitCents);
}

// ─────────────────────────────────────────────────────────────────────────────
// Expense distribution
// ─────────────────────────────────────────────────────────────────────────────

export async function getExpenseDistribution(range?: { from: Date; to: Date }): Promise<ExpenseDistributionRow[]> {
  const expenses = await prisma.expense.findMany({
    where: {
      deletedAt: null,
      ...(range ? { expenseDate: { gte: range.from, lte: range.to } } : {}),
    },
    select: { category: true, amountCents: true },
  });

  const totals = new Map<string, number>();
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amountCents);
  }
  const grand = Array.from(totals.values()).reduce((a, b) => a + b, 0);

  return Array.from(totals.entries())
    .map(([category, amountCents]) => ({
      category,
      amountCents,
      share: grand > 0 ? amountCents / grand : 0,
    }))
    .sort((a, b) => b.amountCents - a.amountCents);
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Insights — rule-based observations
// ─────────────────────────────────────────────────────────────────────────────

export async function getQuickInsights(): Promise<QuickInsight[]> {
  const insights: QuickInsight[] = [];

  const trend = await getMonthlyTrend(3);
  const services = await getServiceProfitability();
  const clients = await getClientProfitability();
  const expenses = await getExpenseDistribution();

  // 1. Highest-margin service this period
  const best = [...services].sort((a, b) => b.marginPct - a.marginPct)[0];
  if (best && best.revenueCents > 0) {
    insights.push({
      id: "best-margin",
      tone: "positive",
      text: `${best.service} has the highest profit margin at ${Math.round(best.marginPct * 100)}%`,
    });
  }

  // 2. Top client share
  const totalRevenue = clients.reduce((s, c) => s + c.revenueCents, 0);
  const topClient = clients[0];
  if (topClient && totalRevenue > 0) {
    const share = topClient.revenueCents / totalRevenue;
    insights.push({
      id: "top-client",
      tone: share > 0.4 ? "warning" : "neutral",
      text: `${topClient.company ?? topClient.clientName} generated ${Math.round(share * 100)}% of revenue${share > 0.4 ? " — consider diversifying" : ""}`,
    });
  }

  // 3. Expense growth — compare last month to previous
  if (trend.length >= 2) {
    const last = trend[trend.length - 1];
    const prev = trend[trend.length - 2];
    if (prev.expensesCents > 0) {
      const change = (last.expensesCents - prev.expensesCents) / prev.expensesCents;
      if (Math.abs(change) > 0.1) {
        insights.push({
          id: "expense-change",
          tone: change > 0 ? "warning" : "positive",
          text: `Expenses ${change > 0 ? "rose" : "fell"} ${Math.round(Math.abs(change) * 100)}% versus last month`,
        });
      }
    }
  }

  // 4. Biggest expense category
  const topExpense = expenses[0];
  if (topExpense) {
    insights.push({
      id: "top-expense",
      tone: "neutral",
      text: `${topExpense.category} is the largest expense at ${Math.round(topExpense.share * 100)}% of total spend`,
    });
  }

  // 5. Profit trend
  if (trend.length >= 2) {
    const last = trend[trend.length - 1];
    const prev = trend[trend.length - 2];
    if (prev.profitCents !== 0) {
      const change = (last.profitCents - prev.profitCents) / Math.abs(prev.profitCents);
      if (Math.abs(change) > 0.05) {
        insights.push({
          id: "profit-trend",
          tone: change > 0 ? "positive" : "warning",
          text: `Net profit is ${change > 0 ? "up" : "down"} ${Math.round(Math.abs(change) * 100)}% versus last month`,
        });
      }
    }
  }

  return insights.slice(0, 5);
}
