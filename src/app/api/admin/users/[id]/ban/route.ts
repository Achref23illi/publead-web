import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { auth } from "@/lib/auth";
import { actorFromSession, recordAudit } from "@/lib/audit-service";

type RouteCtx = { params: Promise<{ id: string }> };

type Body = {
  reason?: string;
  // Seconds until the ban auto-expires. Omit for permanent ban.
  expiresInSeconds?: number;
};

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const a = await requireAdmin(req.headers);
  if (!a.ok) return a.response;
  const { id } = await ctx.params;

  if (id === a.user.id) {
    return NextResponse.json(
      { error: "self_ban_forbidden", message: "you cannot ban yourself" },
      { status: 400 },
    );
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty body allowed */
  }

  try {
    await auth.api.banUser({
      headers: req.headers,
      body: {
        userId: id,
        banReason: body.reason,
        banExpiresIn: body.expiresInSeconds,
      },
    });
    await recordAudit({
      ...actorFromSession(a.user),
      action: "user.ban",
      targetType: "user",
      targetId: id,
      meta: {
        reason: body.reason,
        expiresInSeconds: body.expiresInSeconds,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/users/ban] failed", e);
    return NextResponse.json({ error: "ban_failed" }, { status: 500 });
  }
}
