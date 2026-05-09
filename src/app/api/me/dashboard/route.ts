import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import { getAdvertiserDashboard } from "@/lib/advertiser-dashboard-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  const data = await getAdvertiserDashboard(auth.user.companyId!);
  return NextResponse.json(data);
}
