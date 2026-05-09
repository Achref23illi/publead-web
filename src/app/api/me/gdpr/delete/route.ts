import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { GdprError, anonymizeUser } from "@/lib/gdpr-service";
import { actorFromSession, recordAudit } from "@/lib/audit-service";

export const dynamic = "force-dynamic";

const STATUS_BY_CODE: Record<string, number> = {
  user_not_found: 404,
  already_deleted: 409,
};

type Body = { confirm?: boolean };

export async function POST(req: NextRequest) {
  const s = await requireSession(req.headers);
  if (!s.ok) return s.response;

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty body allowed */
  }
  if (body.confirm !== true) {
    return NextResponse.json(
      {
        error: "confirm_required",
        message: "send { confirm: true } to acknowledge irreversible erasure",
      },
      { status: 400 },
    );
  }

  // Capture actor data BEFORE anonymization erases the email.
  const actor = actorFromSession(s.user);

  try {
    await anonymizeUser(s.user.id);
    await recordAudit({
      ...actor,
      action: "gdpr.delete",
      targetType: "user",
      targetId: s.user.id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GdprError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[me/gdpr/delete]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
