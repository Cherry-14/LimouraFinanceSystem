import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
    const d = parsed.data;
    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        ...d,
        expenseDate: d.expenseDate ? new Date(d.expenseDate) : undefined,
      },
    });
    await recordAudit({ action: "UPDATE", entityType: "Expense", entityId: expense.id, payload: expense });
    return NextResponse.json({ data: expense });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    await recordAudit({ action: "DELETE", entityType: "Expense", entityId: expense.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
