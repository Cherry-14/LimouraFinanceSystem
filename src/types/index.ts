import type { PaymentStatus } from "@prisma/client";

export type { PaymentStatus };

export interface DashboardOverview {
  totalRevenueCents: number;
  totalExpensesCents: number;
  netProfitCents: number;
  profitMargin: number; // 0..1
  outstandingCents: number;
  // deltas vs previous equivalent period
  revenueDelta: number;
  expensesDelta: number;
  profitDelta: number;
}

export interface MonthlyPoint {
  month: string; // "2025-03"
  label: string; // "Mar"
  revenueCents: number;
  expensesCents: number;
  profitCents: number;
}

export interface ClientProfitabilityRow {
  clientId: string;
  clientName: string;
  company: string | null;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  projects: number;
}

export interface ServiceProfitabilityRow {
  service: string;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  projects: number;
  marginPct: number;
}

export interface ExpenseDistributionRow {
  category: string;
  amountCents: number;
  share: number; // 0..1
}

export interface QuickInsight {
  id: string;
  tone: "positive" | "neutral" | "warning";
  text: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}
