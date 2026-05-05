import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { Collections, type VehicleDoc } from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import { activateVehicle, listVehiclesForDriver, serializeVehicle } from "@/lib/vehicles";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const driverId = auth.driver._id!.toString();

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const v = (await db
    .collection(Collections.vehicles)
    .findOne({ _id: new ObjectId(id) })) as VehicleDoc | null;
  if (!v || v.driverId !== driverId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await activateVehicle(driverId, id);

  const list = await listVehiclesForDriver(driverId);
  return NextResponse.json({ vehicles: list.map(serializeVehicle) });
}
