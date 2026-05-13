import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
  const sale = await prisma.sale.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { client: true },
  });
  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: sale });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const d = parsed.data;
    const sale = await prisma.sale.update({
      where: { id: params.id },
      data: {
        ...d,
        invoiceDate: d.invoiceDate ? new Date(d.invoiceDate) : undefined,
        dueDate: d.dueDate === undefined ? undefined : d.dueDate ? new Date(d.dueDate) : null,
        paidDate: d.paidDate === undefined ? undefined : d.paidDate ? new Date(d.paidDate) : null,
      },
    });
    await recordAudit({ action: "UPDATE", entityType: "Sale", entityId: sale.id, payload: sale });
    return NextResponse.json({ data: sale });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const sale = await prisma.sale.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    await recordAudit({ action: "DELETE", entityType: "Sale", entityId: sale.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
