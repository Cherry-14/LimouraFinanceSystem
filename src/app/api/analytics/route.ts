import { NextResponse } from "next/server";
import {
  getOverview,
  getMonthlyTrend,
  getClientProfitability,
  getServiceProfitability,
  getExpenseDistribution,
  getQuickInsights,
} from "@/lib/analytics";

function parseRange(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from && to) return { from: new Date(from), to: new Date(to) };
  return undefined;
}

export async function GET(req: Request) {
  const range = parseRange(req);
  const [overview, trend, clients, services, distribution, insights] = await Promise.all([
    getOverview(range),
    getMonthlyTrend(8),
    getClientProfitability(range),
    getServiceProfitability(range),
    getExpenseDistribution(range),
    getQuickInsights(),
  ]);
  return NextResponse.json({
    overview,
    trend,
    clients,
    services,
    distribution,
    insights,
  });
}
