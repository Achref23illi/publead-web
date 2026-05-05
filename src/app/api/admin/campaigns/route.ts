import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  type CampaignDoc,
  type CampaignStatus,
} from "@/lib/schemas";
import { requireAdmin } from "@/lib/session";
import { reconcileMany } from "@/lib/campaign-lifecycle";
import { serializeCampaign } from "@/lib/campaign-serializer";

const VALID_STATUSES: CampaignStatus[] = [
  "draft",
  "upcoming",
  "active",
  "completed",
];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const driverId = url.searchParams.get("driverId");
  const status = url.searchParams.get("status") as CampaignStatus | null;
  const city = url.searchParams.get("city");

  const filter: Record<string, unknown> = {};
  if (driverId) filter.assignedDriverIds = driverId;
  if (status && VALID_STATUSES.includes(status)) filter.status = status;
  if (city) filter.city = city;

  const docs = (await db
    .collection(Collections.campaigns)
    .find(filter)
    .sort({ startDate: -1 })
    .toArray()) as CampaignDoc[];

  const reconciled = reconcileMany(docs);

  return NextResponse.json({
    campaigns: reconciled.map(serializeCampaign),
  });
}
