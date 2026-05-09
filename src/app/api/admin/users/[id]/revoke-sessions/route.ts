import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { auth } from "@/lib/auth";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const a = await requireAdmin(req.headers);
  if (!a.ok) return a.response;
  const { id } = await ctx.params;

  try {
    await auth.api.revokeUserSessions({
      headers: req.headers,
      body: { userId: id },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/users/revoke-sessions] failed", e);
    return NextResponse.json({ error: "revoke_failed" }, { status: 500 });
  }
}
