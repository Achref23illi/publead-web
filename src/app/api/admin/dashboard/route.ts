import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAdminDashboard } from "@/lib/dashboard-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const data = await getAdminDashboard();
  return NextResponse.json(data);
}
