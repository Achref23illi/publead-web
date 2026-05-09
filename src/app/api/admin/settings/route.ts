import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import {
  PlatformSettingsError,
  getSettings,
  updateSettings,
  type PlatformSettingsPatch,
} from "@/lib/platform-settings-service";
import { actorFromSession, recordAudit } from "@/lib/audit-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const a = await requireAdmin(req.headers);
  if (!a.ok) return a.response;
  const data = await getSettings();
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const a = await requireAdmin(req.headers);
  if (!a.ok) return a.response;
  let body: PlatformSettingsPatch;
  try {
    body = (await req.json()) as PlatformSettingsPatch;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const before = await getSettings();
    const updated = await updateSettings(body);
    await recordAudit({
      ...actorFromSession(a.user),
      action: "settings.update",
      targetType: "platform_settings",
      before: before as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof PlatformSettingsError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: 400 },
      );
    }
    console.error("[admin/settings] failed", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
