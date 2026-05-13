import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
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
  const category = searchParams.get("category");
  const take = Number(searchParams.get("take") ?? 100);

  let query = db.from("Expense").select("*")
    .is("deletedAt", null).order("expenseDate", { ascending: false }).limit(take);

  if (from) query = query.gte("expenseDate", from);
  if (to) query = query.lte("expenseDate", to);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    const { data: expense, error } = await db.from("Expense").insert({
      id: crypto.randomUUID(),
      category: d.category,
      subcategory: d.subcategory ?? null,
      vendor: d.vendor ?? null,
      description: d.description ?? null,
      amountCents: d.amountCents,
      expenseDate: d.expenseDate,
      receiptUrl: d.receiptUrl ?? null,
      updatedAt: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordAudit({ action: "CREATE", entityType: "Expense", entityId: expense.id, payload: expense });
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
