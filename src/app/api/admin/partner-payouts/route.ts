import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  type PartnerPayoutDoc,
  type PartnerPayoutStatus,
} from "@/lib/schemas";
import { requireAdmin } from "@/lib/session";
import { serializePayout } from "@/lib/partner-revenue-serializer";

const VALID_STATUSES: PartnerPayoutStatus[] = ["scheduled", "paid", "failed"];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as PartnerPayoutStatus | null;
  const partnerId = url.searchParams.get("partnerId");

  const filter: Record<string, unknown> = {};
  if (status && VALID_STATUSES.includes(status)) filter.status = status;
  if (partnerId) filter.partnerId = partnerId;

  const payouts = (await db
    .collection(Collections.partnerPayouts)
    .find(filter)
    .sort({ scheduledFor: -1 })
    .toArray()) as PartnerPayoutDoc[];

  return NextResponse.json({ payouts: payouts.map(serializePayout) });
}
