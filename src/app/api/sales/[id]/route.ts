import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

const updateSchema = z.object({
  invoiceNumber: z.string().min(1).optional(),
  projectName: z.string().min(1).optional(),
  serviceType: z.string().min(1).optional(),
  clientId: z.string().min(1).optional(),
  revenueCents: z.number().int().nonnegative().optional(),
  projectCostCents: z.number().int().nonnegative().optional(),
  paymentStatus: z.enum(["PAID", "PARTIAL", "PENDING", "OVERDUE"]).optional(),
  paymentMethod: z.string().nullable().optional(),
  amountPaidCents: z.number().int().nonnegative().optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  paidDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { data, error } = await db.from("Sale").select("*, client:Client(*)")
    .eq("id", params.id).is("deletedAt", null).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { data: sale, error } = await db.from("Sale")
      .update({ ...parsed.data, updatedAt: new Date().toISOString() })
      .eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordAudit({ action: "UPDATE", entityType: "Sale", entityId: sale.id, payload: sale });
    return NextResponse.json({ data: sale });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const now = new Date().toISOString();
    const { data: sale, error } = await db.from("Sale")
      .update({ deletedAt: now, updatedAt: now }).eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordAudit({ action: "DELETE", entityType: "Sale", entityId: sale.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
