import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Collections, type CampaignDoc } from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import { reconcileMany } from "@/lib/campaign-lifecycle";
import { loadBrandMap, serializeCampaign } from "@/lib/campaign-serializer";

export async function GET(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;

  const driverId = auth.user.driverId!;

  const docs = (await db
    .collection(Collections.campaigns)
    .find({ assignedDriverIds: driverId })
    .sort({ startDate: -1 })
    .toArray()) as CampaignDoc[];

  const reconciled = reconcileMany(docs);

  const active = reconciled.filter((c) => c.status === "active");
  const upcoming = reconciled.filter((c) => c.status === "upcoming");
  const completed = reconciled.filter((c) => c.status === "completed");

  const brandMap = await loadBrandMap(reconciled);
  return NextResponse.json({
    active: active.map((c) => serializeCampaign(c, brandMap.get(c.companyId))),
    upcoming: upcoming.map((c) =>
      serializeCampaign(c, brandMap.get(c.companyId)),
    ),
    completed: completed.map((c) =>
      serializeCampaign(c, brandMap.get(c.companyId)),
    ),
  });
}
