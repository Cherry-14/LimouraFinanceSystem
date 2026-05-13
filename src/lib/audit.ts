import { prisma } from "./prisma";

type Action = "CREATE" | "UPDATE" | "DELETE" | "RESTORE";

export async function recordAudit(opts: {
  actor?: string;
  action: Action;
  entityType: "Sale" | "Expense" | "Client";
  entityId: string;
  payload?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actor: opts.actor ?? "admin",
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId,
        payload: opts.payload ? JSON.stringify(opts.payload) : null,
      },
    });
  } catch (err) {
    // Audit failures must never block the primary operation.
    console.error("Audit log failed", err);
  }
}
