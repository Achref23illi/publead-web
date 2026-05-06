import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import {
  CampaignServiceError,
  publishCampaign,
} from "@/lib/campaign-service";
import { loadBrandMap, serializeCampaign } from "@/lib/campaign-serializer";

const STATUS_BY_CODE: Record<string, number> = {
  not_found: 404,
  forbidden: 403,
  already_published: 409,
  invalid_capacity: 400,
  invalid_borne: 400,
};

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.company._id) {
    return NextResponse.json({ error: "company missing" }, { status: 409 });
  }
  const { id } = await ctx.params;
  try {
    const doc = await publishCampaign(auth.company._id.toString(), id);
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
    console.error("[POST /api/me/campaigns/:id/publish]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
