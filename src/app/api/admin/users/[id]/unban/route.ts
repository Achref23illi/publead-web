import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { auth } from "@/lib/auth";
import { actorFromSession, recordAudit } from "@/lib/audit-service";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const a = await requireAdmin(req.headers);
  if (!a.ok) return a.response;
  const { id } = await ctx.params;

  try {
    await auth.api.unbanUser({
      headers: req.headers,
      body: { userId: id },
    });
    await recordAudit({
      ...actorFromSession(a.user),
      action: "user.unban",
      targetType: "user",
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/users/unban] failed", e);
    return NextResponse.json({ error: "unban_failed" }, { status: 500 });
  }
}
