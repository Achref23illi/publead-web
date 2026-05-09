import { db } from "./db";
import {
  Collections,
  type AuditAction,
  type AuditLogDoc,
} from "./schemas";

export type AuditInput = {
  // Caller-supplied actor metadata. Pulled from session in the route layer
  // and passed in here. Absent for system events (e.g. Stripe webhook).
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  ip?: string;
};

// Fire-and-forget audit insert. Failures are logged but never thrown so the
// caller's primary mutation never aborts on audit storage hiccups.
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const doc: AuditLogDoc = {
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      before: input.before,
      after: input.after,
      meta: input.meta,
      ip: input.ip,
      at: new Date(),
    };
    await db.collection(Collections.auditLog).insertOne(doc);
  } catch (e) {
    console.error("[audit] insert failed", input.action, e);
  }
}

// Convenience wrapper for routes that already have a SessionUser-shaped
// object. Spreads the actor fields without leaking entire session.
export function actorFromSession(user?: {
  id: string;
  email?: string;
  role?: string;
}): Pick<AuditInput, "actorUserId" | "actorEmail" | "actorRole"> {
  if (!user) return {};
  return {
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
  };
}

export type AuditFilter = {
  action?: AuditAction;
  actorUserId?: string;
  targetType?: string;
  targetId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
};

export async function listAudit(
  filter: AuditFilter = {},
): Promise<{ items: AuditLogDoc[]; total: number }> {
  const q: Record<string, unknown> = {};
  if (filter.action) q.action = filter.action;
  if (filter.actorUserId) q.actorUserId = filter.actorUserId;
  if (filter.targetType) q.targetType = filter.targetType;
  if (filter.targetId) q.targetId = filter.targetId;
  if (filter.from || filter.to) {
    const range: Record<string, Date> = {};
    if (filter.from) range.$gte = filter.from;
    if (filter.to) range.$lte = filter.to;
    q.at = range;
  }
  const limit = Math.min(500, Math.max(1, filter.limit ?? 100));
  const offset = Math.max(0, filter.offset ?? 0);

  const [items, total] = await Promise.all([
    db
      .collection(Collections.auditLog)
      .find(q)
      .sort({ at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray() as Promise<AuditLogDoc[]>,
    db.collection(Collections.auditLog).countDocuments(q),
  ]);

  return { items, total };
}
