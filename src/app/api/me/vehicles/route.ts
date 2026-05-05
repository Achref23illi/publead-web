import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  VEHICLE_MAX_PER_DRIVER,
  type VehicleDoc,
  type VehicleType,
} from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import {
  countVehiclesForDriver,
  listVehiclesForDriver,
  serializeVehicle,
} from "@/lib/vehicles";

const VALID_TYPES: VehicleType[] = ["Berline", "SUV", "Utilitaire", "Autre"];

export async function GET(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const driverId = auth.driver._id!.toString();

  const list = await listVehiclesForDriver(driverId);
  return NextResponse.json({
    vehicles: list.map(serializeVehicle),
    max: VEHICLE_MAX_PER_DRIVER,
  });
}

type CreateBody = {
  make?: string;
  model?: string;
  year?: string;
  licensePlate?: string;
  type?: VehicleType;
  inspectionExpiresAt?: string;
};

export async function POST(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const driverId = auth.driver._id!.toString();

  const body = (await req.json().catch(() => ({}))) as CreateBody;
  if (!body.make?.trim()) {
    return NextResponse.json({ error: "make required" }, { status: 400 });
  }
  if (!body.model?.trim()) {
    return NextResponse.json({ error: "model required" }, { status: 400 });
  }
  if (!body.year?.trim()) {
    return NextResponse.json({ error: "year required" }, { status: 400 });
  }
  if (!body.licensePlate?.trim()) {
    return NextResponse.json(
      { error: "licensePlate required" },
      { status: 400 },
    );
  }
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const count = await countVehiclesForDriver(driverId);
  if (count >= VEHICLE_MAX_PER_DRIVER) {
    return NextResponse.json(
      { error: `max ${VEHICLE_MAX_PER_DRIVER} vehicles per driver` },
      { status: 409 },
    );
  }

  const now = new Date();
  const doc: VehicleDoc = {
    driverId,
    make: body.make.trim(),
    model: body.model.trim(),
    year: body.year.trim(),
    licensePlate: body.licensePlate.trim().toUpperCase(),
    type: body.type,
    // First vehicle becomes active automatically.
    isActive: count === 0,
    inspection: body.inspectionExpiresAt
      ? { expiresAt: new Date(body.inspectionExpiresAt) }
      : undefined,
    photos: [],
    createdAt: now,
    updatedAt: now,
  };
  const ins = await db.collection(Collections.vehicles).insertOne(doc);

  return NextResponse.json({
    vehicle: serializeVehicle({ ...doc, _id: ins.insertedId }),
  });
}
