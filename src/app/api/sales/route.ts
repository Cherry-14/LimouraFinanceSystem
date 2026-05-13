import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

const createSchema = z.object({
  invoiceNumber: z.string().min(1),
  projectName: z.string().min(1),
  serviceType: z.string().min(1),
  clientId: z.string().min(1),
  revenueCents: z.number().int().nonnegative(),
  projectCostCents: z.number().int().nonnegative().default(0),
  paymentStatus: z.enum(["PAID", "PARTIAL", "PENDING", "OVERDUE"]),
  paymentMethod: z.string().optional().nullable(),
  amountPaidCents: z.number().int().nonnegative().default(0),
  invoiceDate: z.string(),
  dueDate: z.string().optional().nullable(),
  paidDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const clientId = searchParams.get("clientId");
  const serviceType = searchParams.get("serviceType");
  const status = searchParams.get("status");
  const take = Number(searchParams.get("take") ?? 100);

  let query = db.from("Sale").select("*, client:Client(*)")
    .is("deletedAt", null).order("invoiceDate", { ascending: false }).limit(take);

  if (from) query = query.gte("invoiceDate", from);
  if (to) query = query.lte("invoiceDate", to);
  if (clientId) query = query.eq("clientId", clientId);
  if (serviceType) query = query.eq("serviceType", serviceType);
  if (status) query = query.eq("paymentStatus", status);

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
    const { data: sale, error } = await db.from("Sale").insert({
      id: crypto.randomUUID(),
      invoiceNumber: d.invoiceNumber,
      projectName: d.projectName,
      serviceType: d.serviceType,
      clientId: d.clientId,
      revenueCents: d.revenueCents,
      projectCostCents: d.projectCostCents,
      paymentStatus: d.paymentStatus,
      paymentMethod: d.paymentMethod ?? null,
      amountPaidCents: d.amountPaidCents,
      invoiceDate: d.invoiceDate,
      dueDate: d.dueDate ?? null,
      paidDate: d.paidDate ?? null,
      notes: d.notes ?? null,
      updatedAt: new Date().toISOString(),
    }).select().single();

    if (error) {
      if (error.code === "23505")
        return NextResponse.json({ error: "Invoice number already exists" }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await recordAudit({ action: "CREATE", entityType: "Sale", entityId: sale.id, payload: sale });
    return NextResponse.json({ data: sale }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
