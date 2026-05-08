import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Collections, type RevenueMonthlyDoc } from "@/lib/schemas";
import { requirePartner } from "@/lib/session";
import { serializeMonthly } from "@/lib/partner-revenue-serializer";

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.partner._id) {
    return NextResponse.json({ error: "partner_missing" }, { status: 409 });
  }
  const partnerId = auth.partner._id.toString();

  const url = new URL(req.url);
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? "12"), 1),
    36,
  );

  const months = (await db
    .collection(Collections.revenueMonthly)
    .find({ partnerId })
    .sort({ month: -1 })
    .limit(limit)
    .toArray()) as RevenueMonthlyDoc[];

  return NextResponse.json({ months: months.map(serializeMonthly) });
}
