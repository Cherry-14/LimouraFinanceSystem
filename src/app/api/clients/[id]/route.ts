import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { data: client, error } = await db.from("Client")
      .update({ ...parsed.data, updatedAt: new Date().toISOString() })
      .eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordAudit({ action: "UPDATE", entityType: "Client", entityId: client.id, payload: client });
    return NextResponse.json({ data: client });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const now = new Date().toISOString();
    const { data: client, error } = await db.from("Client")
      .update({ deletedAt: now, updatedAt: now }).eq("id", params.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordAudit({ action: "DELETE", entityType: "Client", entityId: client.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
