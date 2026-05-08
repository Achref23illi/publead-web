import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { listScents } from "@/lib/stock-service";
import { serializeScent } from "@/lib/stock-serializer";

// All authenticated users can read the scent catalog (used by partner stock UI
// to render scent names + colors). Catalog itself is curated by admin only.
export async function GET(req: NextRequest) {
  const auth = await requireSession(req.headers);
  if (!auth.ok) return auth.response;
  const scents = await listScents();
  return NextResponse.json({ scents: scents.map(serializeScent) });
}
