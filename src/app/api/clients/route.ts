import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const [clientsRes, salesRes] = await Promise.all([
    db.from("Client").select("*").is("deletedAt", null).order("name", { ascending: true }),
    db.from("Sale").select("clientId").is("deletedAt", null),
  ]);

  const countMap = new Map<string, number>();
  for (const s of salesRes.data ?? []) {
    countMap.set(s.clientId, (countMap.get(s.clientId) ?? 0) + 1);
  }

  const data = (clientsRes.data ?? []).map((c) => ({
    ...c,
    _count: { sales: countMap.get(c.id) ?? 0 },
  }));

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    const { data: client, error } = await db.from("Client").insert({
      id: crypto.randomUUID(),
      name: d.name,
      company: d.company || null,
      email: d.email || null,
      phone: d.phone || null,
      country: d.country || null,
      notes: d.notes || null,
      updatedAt: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordAudit({ action: "CREATE", entityType: "Client", entityId: client.id, payload: client });
    return NextResponse.json({ data: client }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
