import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { listAudit } from "@/lib/audit-service";
import type { AuditAction } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const a = await requireAdmin(req.headers);
  if (!a.ok) return a.response;
  const url = new URL(req.url);

  const action = url.searchParams.get("action") as AuditAction | null;
  const actorUserId = url.searchParams.get("actorUserId") ?? undefined;
  const targetType = url.searchParams.get("targetType") ?? undefined;
  const targetId = url.searchParams.get("targetId") ?? undefined;
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const limit = Number(url.searchParams.get("limit") ?? 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const { items, total } = await listAudit({
    action: action ?? undefined,
    actorUserId,
    targetType,
    targetId,
    from: fromStr ? new Date(fromStr) : undefined,
    to: toStr ? new Date(toStr) : undefined,
    limit,
    offset,
  });

  return NextResponse.json({
    items: items.map((it) => ({
      id: it._id?.toString(),
      actorUserId: it.actorUserId,
      actorEmail: it.actorEmail,
      actorRole: it.actorRole,
      action: it.action,
      targetType: it.targetType,
      targetId: it.targetId,
      before: it.before,
      after: it.after,
      meta: it.meta,
      ip: it.ip,
      at: it.at.toISOString(),
    })),
    total,
    limit,
    offset,
  });
}
