import { db } from "./db";

type Action = "CREATE" | "UPDATE" | "DELETE" | "RESTORE";

export async function recordAudit(opts: {
  actor?: string;
  action: Action;
  entityType: "Sale" | "Expense" | "Client";
  entityId: string;
  payload?: unknown;
}) {
  try {
    await db.from("AuditLog").insert({
      id: crypto.randomUUID(),
      actor: opts.actor ?? "admin",
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      payload: opts.payload ? JSON.stringify(opts.payload) : null,
    });
  } catch (err) {
    // Audit failures must never block the primary operation.
    console.error("Audit log failed", err);
  }
}
