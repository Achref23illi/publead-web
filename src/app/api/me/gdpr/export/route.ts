import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { GdprError, buildUserExport } from "@/lib/gdpr-service";
import { actorFromSession, recordAudit } from "@/lib/audit-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const s = await requireSession(req.headers);
  if (!s.ok) return s.response;
  try {
    const { buffer, filename } = await buildUserExport(s.user.id);
    await recordAudit({
      ...actorFromSession(s.user),
      action: "gdpr.export",
      targetType: "user",
      targetId: s.user.id,
    });
    // Return as octet-stream so browsers download instead of opening.
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    if (e instanceof GdprError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: 404 },
      );
    }
    console.error("[me/gdpr/export]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
