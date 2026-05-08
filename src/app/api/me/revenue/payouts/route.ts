import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  type PartnerPayoutDoc,
  type PartnerPayoutStatus,
} from "@/lib/schemas";
import { requirePartner } from "@/lib/session";
import { serializePayout } from "@/lib/partner-revenue-serializer";

const VALID_STATUSES: PartnerPayoutStatus[] = ["scheduled", "paid", "failed"];

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.partner._id) {
    return NextResponse.json({ error: "partner_missing" }, { status: 409 });
  }
  const partnerId = auth.partner._id.toString();

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as PartnerPayoutStatus | null;
  const filter: Record<string, unknown> = { partnerId };
  if (status && VALID_STATUSES.includes(status)) filter.status = status;

  const payouts = (await db
    .collection(Collections.partnerPayouts)
    .find(filter)
    .sort({ scheduledFor: -1 })
    .toArray()) as PartnerPayoutDoc[];

  return NextResponse.json({ payouts: payouts.map(serializePayout) });
}
