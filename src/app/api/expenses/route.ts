import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

const createSchema = z.object({
  category: z.string().min(1),
  subcategory: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amountCents: z.number().int().positive(),
  expenseDate: z.string(),
  receiptUrl: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category") ?? undefined;
  const take = Number(searchParams.get("take") ?? 100);

  const expenses = await prisma.expense.findMany({
    where: {
      deletedAt: null,
      ...(from || to ? {
        expenseDate: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { expenseDate: "desc" },
    take,
  });

  return NextResponse.json({ data: expenses });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        subcategory: data.subcategory ?? null,
        vendor: data.vendor ?? null,
        description: data.description ?? null,
        amountCents: data.amountCents,
        expenseDate: new Date(data.expenseDate),
        receiptUrl: data.receiptUrl ?? null,
      },
    });
    await recordAudit({ action: "CREATE", entityType: "Expense", entityId: expense.id, payload: expense });
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
