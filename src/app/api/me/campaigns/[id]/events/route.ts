import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdvertiserOrAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import {
  Collections,
  type CampaignEventDoc,
  type DriverDoc,
} from "@/lib/schemas";
import {
  CampaignServiceError,
  getMyCampaign,
} from "@/lib/campaign-service";

type RouteCtx = { params: Promise<{ id: string }> };

type EventDTO = {
  id: string;
  type: CampaignEventDoc["type"];
  at: string;
  driverName?: string;
  meta?: Record<string, unknown>;
};

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdvertiserOrAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  // Verify campaign access (admin bypass or ownership).
  try {
    await getMyCampaign(auth.companyId, id);
  } catch (e) {
    if (e instanceof CampaignServiceError) {
      return NextResponse.json(
        { error: e.code },
        { status: e.code === "not_found" ? 404 : 403 },
      );
    }
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  const events = (await db
    .collection(Collections.campaignEvents)
    .find({ campaignId: id })
    .sort({ at: -1 })
    .limit(50)
    .toArray()) as CampaignEventDoc[];

  const driverIds = Array.from(
    new Set(events.map((e) => e.driverId).filter((d): d is string => !!d)),
  );
  const driverMap = new Map<string, string>();
  if (driverIds.length > 0) {
    const oids = driverIds
      .filter((d) => ObjectId.isValid(d))
      .map((d) => new ObjectId(d));
    const drivers = (await db
      .collection(Collections.drivers)
      .find({ _id: { $in: oids } })
      .toArray()) as DriverDoc[];
    for (const d of drivers) {
      driverMap.set(d._id!.toString(), `${d.firstName} ${d.lastName}`);
    }
  }

  const dtos: EventDTO[] = events.map((e) => ({
    id: e._id!.toString(),
    type: e.type,
    at: e.at.toISOString(),
    driverName: e.driverId ? driverMap.get(e.driverId) : undefined,
    meta: e.meta,
  }));

  return NextResponse.json({ events: dtos });
}
