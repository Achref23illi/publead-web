import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Collections, type CampaignDoc } from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import { reconcileMany } from "@/lib/campaign-lifecycle";
import { serializeCampaign } from "@/lib/campaign-serializer";

export async function GET(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const { driver } = auth;

  if (driver.status !== "validated") {
    return NextResponse.json({ campaigns: [] });
  }

  const url = new URL(req.url);
  const onlyAvailable = url.searchParams.get("available") === "true";

  const docs = (await db
    .collection(Collections.campaigns)
    .find({
      city: driver.city,
      status: { $in: ["upcoming", "active"] },
    })
    .sort({ startDate: 1 })
    .toArray()) as CampaignDoc[];

  const reconciled = reconcileMany(docs);
  const filtered = reconciled.filter((c) => {
    if (c.status === "completed" || c.status === "draft") return false;
    if (onlyAvailable) {
      const hasCapacity = c.driversAssigned < c.driversNeeded;
      const notMine = !c.assignedDriverIds.includes(auth.user.driverId!);
      return hasCapacity && notMine;
    }
    return true;
  });

  return NextResponse.json({
    campaigns: filtered.map(serializeCampaign),
  });
}
