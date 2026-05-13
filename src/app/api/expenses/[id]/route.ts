import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

const updateSchema = z.object({
  category: z.string().min(1).optional(),
  subcategory: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amountCents: z.number().int().positive().optional(),
  expenseDate: z.string().optional(),
  receiptUrl: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { data: expense, error } = await db.from("Expense")
      .update({ ...parsed.data, updatedAt: new Date().toISOString() })
      .eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordAudit({ action: "UPDATE", entityType: "Expense", entityId: expense.id, payload: expense });
    return NextResponse.json({ data: expense });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const now = new Date().toISOString();
    const { data: expense, error } = await db.from("Expense")
      .update({ deletedAt: now, updatedAt: now }).eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordAudit({ action: "DELETE", entityType: "Expense", entityId: expense.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
