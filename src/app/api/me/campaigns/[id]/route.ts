import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiserOrAdmin } from "@/lib/session";
import {
  CampaignServiceError,
  deleteDraftCampaign,
  getMyCampaign,
  updateCampaign,
} from "@/lib/campaign-service";
import { reconcileMany } from "@/lib/campaign-lifecycle";
import { loadBrandMap, serializeCampaign } from "@/lib/campaign-serializer";

const STATUS_BY_CODE: Record<string, number> = {
  invalid_title: 400,
  invalid_description: 400,
  invalid_city: 400,
  invalid_dates: 400,
  invalid_type: 400,
  invalid_tier: 400,
  invalid_budget: 400,
  invalid_capacity: 400,
  invalid_reward: 400,
  invalid_zones: 400,
  invalid_assets: 400,
  invalid_brand: 400,
  invalid_borne: 400,
  not_found: 404,
  forbidden: 403,
  frozen_field: 409,
  draft_only: 409,
};

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdvertiserOrAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  try {
    const doc = await getMyCampaign(auth.companyId, id);
    const reconciled = reconcileMany([doc])[0];
    const brandMap = await loadBrandMap([reconciled]);
    return NextResponse.json({
      campaign: serializeCampaign(reconciled, brandMap.get(reconciled.companyId)),
    });
  } catch (e) {
    if (e instanceof CampaignServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[GET /api/me/campaigns/:id]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdvertiserOrAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const doc = await updateCampaign(auth.companyId, id, body as never);
    const brandMap = await loadBrandMap([doc]);
    return NextResponse.json({
      campaign: serializeCampaign(doc, brandMap.get(doc.companyId)),
    });
  } catch (e) {
    if (e instanceof CampaignServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message, meta: e.meta },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[PATCH /api/me/campaigns/:id]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdvertiserOrAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  try {
    await deleteDraftCampaign(auth.companyId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof CampaignServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[DELETE /api/me/campaigns/:id]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
