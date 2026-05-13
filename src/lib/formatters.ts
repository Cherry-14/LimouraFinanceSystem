import { CURRENCY } from "@/constants";

const moneyFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: "currency",
  currency: CURRENCY.code,
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: "currency",
  currency: CURRENCY.code,
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat(CURRENCY.locale, {
  style: "percent",
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

export function dollarsToCents(dollars: number | string): number {
  const n = typeof dollars === "string" ? Number(dollars) : dollars;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function formatMoney(cents: number): string {
  return moneyFormatter.format(centsToDollars(cents));
}

export function formatCompactMoney(cents: number): string {
  return compactFormatter.format(centsToDollars(cents));
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return percentFormatter.format(value);
}

export function formatSignedPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${percentFormatter.format(value)}`;
}

const dateFmt = new Intl.DateTimeFormat(CURRENCY.locale, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateFmtShort = new Intl.DateTimeFormat(CURRENCY.locale, {
  month: "short",
  day: "numeric",
});

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return dateFmt.format(d);
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return dateFmtShort.format(d);
}

export function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat(CURRENCY.locale, { month: "short" }).format(date);
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
