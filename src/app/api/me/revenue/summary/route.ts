import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  type PartnerPayoutDoc,
} from "@/lib/schemas";
import { requirePartner } from "@/lib/session";
import {
  getMonthlySummary,
  getPartnerRevenueConfig,
} from "@/lib/partner-revenue-service";
import {
  serializeMonthlySummary,
  serializePayout,
} from "@/lib/partner-revenue-serializer";

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.partner._id) {
    return NextResponse.json({ error: "partner_missing" }, { status: 409 });
  }
  const partnerId = auth.partner._id.toString();

  const now = new Date();
  const summary = await getMonthlySummary(
    partnerId,
    now.getUTCFullYear(),
    now.getUTCMonth(),
  );

  const recentPayouts = (await db
    .collection(Collections.partnerPayouts)
    .find({ partnerId })
    .sort({ scheduledFor: -1 })
    .limit(6)
    .toArray()) as PartnerPayoutDoc[];

  const nextScheduled = recentPayouts.find((p) => p.status === "scheduled");
  const lastPaid = recentPayouts.find((p) => p.status === "paid");

  const config = await getPartnerRevenueConfig();

  return NextResponse.json({
    currentMonth: serializeMonthlySummary(summary),
    monthlyTargetCents: auth.partner.monthlyTargetCents ?? null,
    rates: config,
    nextScheduled: nextScheduled ? serializePayout(nextScheduled) : null,
    lastPaid: lastPaid ? serializePayout(lastPaid) : null,
  });
}
