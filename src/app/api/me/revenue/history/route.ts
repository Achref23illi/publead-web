import { NextRequest, NextResponse } from "next/server";
import { requirePartner } from "@/lib/session";
import { getRevenueRange } from "@/lib/partner-revenue-service";

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.partner._id) {
    return NextResponse.json({ error: "partner_missing" }, { status: 409 });
  }
  const partnerId = auth.partner._id.toString();

  const url = new URL(req.url);
  const days = Math.min(
    Math.max(Number(url.searchParams.get("days") ?? "30"), 1),
    365,
  );

  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);

  const rows = await getRevenueRange(partnerId, start, end);
  return NextResponse.json({ rows });
}
