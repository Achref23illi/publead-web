import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { RANGE_KEYS, type RangeKey } from "@/lib/dashboard-serializer";
import { getRevenueChart } from "@/lib/revenue-chart-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const url = new URL(req.url);
  const rangeParam = url.searchParams.get("range") ?? "30";
  const range = (RANGE_KEYS as string[]).includes(rangeParam)
    ? (rangeParam as RangeKey)
    : "30";
  const data = await getRevenueChart(range);
  return NextResponse.json(data);
}
