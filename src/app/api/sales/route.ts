import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
  const clientId = searchParams.get("clientId") ?? undefined;
  const serviceType = searchParams.get("serviceType") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const take = Number(searchParams.get("take") ?? 100);

  const sales = await prisma.sale.findMany({
    where: {
      deletedAt: null,
      ...(from || to ? {
        invoiceDate: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        },
      } : {}),
      ...(clientId ? { clientId } : {}),
      ...(serviceType ? { serviceType } : {}),
      ...(status ? { paymentStatus: status as any } : {}),
    },
    include: { client: true },
    orderBy: { invoiceDate: "desc" },
    take,
  });

  return NextResponse.json({ data: sales });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const sale = await prisma.sale.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        projectName: data.projectName,
        serviceType: data.serviceType,
        clientId: data.clientId,
        revenueCents: data.revenueCents,
        projectCostCents: data.projectCostCents,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod ?? null,
        amountPaidCents: data.amountPaidCents,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        notes: data.notes ?? null,
      },
    });
    await recordAudit({ action: "CREATE", entityType: "Sale", entityId: sale.id, payload: sale });
    return NextResponse.json({ data: sale }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Invoice number already exists" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
