import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import {
  CampaignServiceError,
  createDraftCampaign,
  listMyCampaigns,
} from "@/lib/campaign-service";
import { reconcileMany } from "@/lib/campaign-lifecycle";
import { loadBrandMap, serializeCampaign } from "@/lib/campaign-serializer";
import type { CampaignStatus } from "@/lib/schemas";

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
};

const VALID_STATUSES: CampaignStatus[] = [
  "draft",
  "upcoming",
  "active",
  "completed",
];

export async function GET(req: NextRequest) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.company._id) {
    return NextResponse.json({ error: "company missing" }, { status: 409 });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status") as CampaignStatus | null;
  try {
    const docs = await listMyCampaigns(
      auth.company._id.toString(),
      status && VALID_STATUSES.includes(status) ? status : undefined,
    );
    const reconciled = reconcileMany(docs);
    const brandMap = await loadBrandMap(reconciled);
    return NextResponse.json({
      campaigns: reconciled.map((c) =>
        serializeCampaign(c, brandMap.get(c.companyId)),
      ),
    });
  } catch (e) {
    console.error("[GET /api/me/campaigns]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.company._id) {
    return NextResponse.json({ error: "company missing" }, { status: 409 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const doc = await createDraftCampaign(
      auth.company._id.toString(),
      body as never,
    );
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
    console.error("[POST /api/me/campaigns]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
