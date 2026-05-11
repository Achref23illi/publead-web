import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiserOrAdmin } from "@/lib/session";
import {
  CampaignServiceError,
  duplicateCampaign,
} from "@/lib/campaign-service";
import { loadBrandMap, serializeCampaign } from "@/lib/campaign-serializer";

const STATUS_BY_CODE: Record<string, number> = {
  not_found: 404,
  forbidden: 403,
};

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdvertiserOrAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  try {
    const doc = await duplicateCampaign(auth.companyId, id);
    const brandMap = await loadBrandMap([doc]);
    return NextResponse.json({
      campaign: serializeCampaign(doc, brandMap.get(doc.companyId)),
    });
  } catch (e) {
    if (e instanceof CampaignServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[POST /api/me/campaigns/:id/duplicate]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
