"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMoney, formatDate, formatPercent } from "./formatters";
import type {
  DashboardOverview,
  MonthlyPoint,
  ClientProfitabilityRow,
  ServiceProfitabilityRow,
  ExpenseDistributionRow,
} from "@/types";

const COLORS = {
  ink: "#0A0A0A",
  muted: "#737373",
  border: "#E5E5E5",
  accent: "#1F3D2B",
};

function header(doc: jsPDF, title: string, subtitle: string) {
  doc.setTextColor(COLORS.ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("LIMOURA CREATIVE STUDIO", 40, 50);

  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(40, 60, 555, 60);

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title, 40, 95);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.muted);
  doc.text(subtitle, 40, 113);
  doc.setTextColor(COLORS.ink);
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(COLORS.border);
    doc.line(40, pageHeight - 40, 555, pageHeight - 40);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted);
    doc.text(
      `Generated ${formatDate(new Date())} — Limoura Creative Studio`,
      40,
      pageHeight - 25,
    );
    doc.text(`Page ${i} of ${pageCount}`, 555, pageHeight - 25, { align: "right" });
    doc.setTextColor(COLORS.ink);
  }
}

function kpiRow(
  doc: jsPDF,
  y: number,
  items: { label: string; value: string }[],
): number {
  const colWidth = (555 - 40) / items.length;
  items.forEach((item, i) => {
    const x = 40 + i * colWidth;
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted);
    doc.text(item.label.toUpperCase(), x, y);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.ink);
    doc.text(item.value, x, y + 20);
    doc.setFont("helvetica", "normal");
  });
  return y + 40;
}

function sectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.ink);
  doc.text(text, 40, y);
  doc.setDrawColor(COLORS.border);
  doc.line(40, y + 5, 555, y + 5);
  return y + 20;
}

interface ReportData {
  overview: DashboardOverview;
  trend: MonthlyPoint[];
  clients: ClientProfitabilityRow[];
  services: ServiceProfitabilityRow[];
  distribution: ExpenseDistributionRow[];
  rangeLabel: string;
}

export function generateFinancialReport(data: ReportData): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  header(doc, "Financial Summary", data.rangeLabel);

  let y = 145;

  // KPIs
  y = kpiRow(doc, y, [
    { label: "Revenue", value: formatMoney(data.overview.totalRevenueCents) },
    { label: "Expenses", value: formatMoney(data.overview.totalExpensesCents) },
    { label: "Net Profit", value: formatMoney(data.overview.netProfitCents) },
    { label: "Margin", value: formatPercent(data.overview.profitMargin) },
  ]);

  y += 10;

  // Monthly trend table
  y = sectionTitle(doc, y, "Monthly Performance");
  autoTable(doc, {
    startY: y,
    head: [["Month", "Revenue", "Expenses", "Profit"]],
    body: data.trend.map((m) => [
      m.label,
      formatMoney(m.revenueCents),
      formatMoney(m.expensesCents),
      formatMoney(m.profitCents),
    ]),
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 6, textColor: COLORS.ink },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: COLORS.muted,
      fontStyle: "normal",
      fontSize: 8,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: 40, right: 40 },
  });

  y = (doc as any).lastAutoTable.finalY + 25;

  if (y > 700) {
    doc.addPage();
    y = 60;
  }

  // Service profitability
  y = sectionTitle(doc, y, "Service Profitability");
  autoTable(doc, {
    startY: y,
    head: [["Service", "Projects", "Revenue", "Cost", "Profit", "Margin"]],
    body: data.services.map((s) => [
      s.service,
      String(s.projects),
      formatMoney(s.revenueCents),
      formatMoney(s.costCents),
      formatMoney(s.profitCents),
      formatPercent(s.marginPct),
    ]),
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 6, textColor: COLORS.ink },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: COLORS.muted,
      fontStyle: "normal",
      fontSize: 8,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    margin: { left: 40, right: 40 },
  });

  y = (doc as any).lastAutoTable.finalY + 25;

  if (y > 680) {
    doc.addPage();
    y = 60;
  }

  // Top clients
  y = sectionTitle(doc, y, "Client Profitability");
  autoTable(doc, {
    startY: y,
    head: [["Client", "Projects", "Revenue", "Profit"]],
    body: data.clients.slice(0, 12).map((c) => [
      c.company ?? c.clientName,
      String(c.projects),
      formatMoney(c.revenueCents),
      formatMoney(c.profitCents),
    ]),
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 6, textColor: COLORS.ink },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: COLORS.muted,
      fontStyle: "normal",
      fontSize: 8,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: 40, right: 40 },
  });

  y = (doc as any).lastAutoTable.finalY + 25;

  if (y > 680) {
    doc.addPage();
    y = 60;
  }

  // Expense distribution
  y = sectionTitle(doc, y, "Expense Distribution");
  autoTable(doc, {
    startY: y,
    head: [["Category", "Amount", "Share"]],
    body: data.distribution.map((d) => [d.category, formatMoney(d.amountCents), formatPercent(d.share)]),
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 6, textColor: COLORS.ink },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: COLORS.muted,
      fontStyle: "normal",
      fontSize: 8,
    },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
    },
    margin: { left: 40, right: 40 },
  });

  footer(doc);

  const fname = `limoura-financial-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}

export function generateRevenueReport(sales: any[], rangeLabel: string): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  header(doc, "Revenue Report", rangeLabel);

  const total = sales.reduce((s, r) => s + r.revenueCents, 0);
  const profit = sales.reduce((s, r) => s + (r.revenueCents - r.projectCostCents), 0);
  const outstanding = sales.reduce((s, r) => s + Math.max(0, r.revenueCents - r.amountPaidCents), 0);

  let y = 145;
  y = kpiRow(doc, y, [
    { label: "Total Revenue", value: formatMoney(total) },
    { label: "Project Profit", value: formatMoney(profit) },
    { label: "Outstanding", value: formatMoney(outstanding) },
    { label: "Invoices", value: String(sales.length) },
  ]);

  y += 10;
  y = sectionTitle(doc, y, "Invoices");
  autoTable(doc, {
    startY: y,
    head: [["Invoice", "Date", "Client", "Service", "Revenue", "Profit", "Status"]],
    body: sales.map((s) => [
      s.invoiceNumber,
      formatDate(s.invoiceDate),
      s.client?.company ?? s.client?.name ?? "—",
      s.serviceType,
      formatMoney(s.revenueCents),
      formatMoney(s.revenueCents - s.projectCostCents),
      s.paymentStatus,
    ]),
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 5, textColor: COLORS.ink },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: COLORS.muted,
      fontStyle: "normal",
      fontSize: 7,
    },
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
    },
    margin: { left: 40, right: 40 },
  });

  footer(doc);
  doc.save(`limoura-revenue-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function generateExpenseReport(expenses: any[], rangeLabel: string): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  header(doc, "Expense Report", rangeLabel);

  const total = expenses.reduce((s, e) => s + e.amountCents, 0);

  let y = 145;
  y = kpiRow(doc, y, [
    { label: "Total Expenses", value: formatMoney(total) },
    { label: "Entries", value: String(expenses.length) },
    {
      label: "Avg per Entry",
      value: formatMoney(expenses.length ? Math.round(total / expenses.length) : 0),
    },
  ]);

  y += 10;
  y = sectionTitle(doc, y, "Expense Detail");
  autoTable(doc, {
    startY: y,
    head: [["Date", "Category", "Subcategory", "Vendor", "Description", "Amount"]],
    body: expenses.map((e) => [
      formatDate(e.expenseDate),
      e.category,
      e.subcategory ?? "—",
      e.vendor ?? "—",
      e.description ?? "—",
      formatMoney(e.amountCents),
    ]),
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 5, textColor: COLORS.ink },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: COLORS.muted,
      fontStyle: "normal",
      fontSize: 7,
    },
    columnStyles: { 5: { halign: "right" } },
    margin: { left: 40, right: 40 },
  });

  footer(doc);
  doc.save(`limoura-expenses-${new Date().toISOString().slice(0, 10)}.pdf`);
}
