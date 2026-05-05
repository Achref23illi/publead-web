import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Collections,
  type DriverDoc,
  type VehicleDoc,
  type VehicleType,
} from "@/lib/schemas";

type Body = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  vehicleModel: string; // "make model" combined input from mobile form
  vehicleYear: string;
  licensePlate: string;
  vehicleType: string;
};

const VALID_VEHICLE_TYPES: VehicleType[] = [
  "Berline",
  "SUV",
  "Utilitaire",
  "Autre",
];

function validate(b: Partial<Body>): string | null {
  if (!b.firstName?.trim()) return "firstName required";
  if (!b.lastName?.trim()) return "lastName required";
  if (!b.email?.trim()) return "email required";
  if (!b.password || b.password.length < 6) return "password >= 6 chars";
  if (!b.phone?.trim()) return "phone required";
  if (!b.city?.trim()) return "city required";
  if (!b.vehicleModel?.trim()) return "vehicleModel required";
  if (!b.vehicleYear?.trim()) return "vehicleYear required";
  if (!b.licensePlate?.trim()) return "licensePlate required";
  if (!b.vehicleType?.trim()) return "vehicleType required";
  return null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Body>;
  const err = validate(body);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const result = await auth.api.signUpEmail({
    body: {
      email: body.email!.trim().toLowerCase(),
      password: body.password!,
      name: `${body.firstName} ${body.lastName}`.trim(),
    },
    asResponse: false,
  });

  const userId = result.user.id;

  await db
    .collection("user")
    .updateOne(
      { _id: userId } as never,
      {
        $set: {
          role: "driver",
          status: "pending",
          phone: body.phone!.trim(),
        },
      },
    );

  const driverDoc: DriverDoc = {
    userId,
    firstName: body.firstName!.trim(),
    lastName: body.lastName!.trim(),
    phone: body.phone!.trim(),
    city: body.city!.trim(),
    status: "pending",
    joinedAt: new Date(),
    campaignsDone: 0,
    rating: 0,
    totalKm: 0,
    totalEarningsCents: 0,
    availableBalanceCents: 0,
    pendingBalanceCents: 0,
    withdrawnTotalCents: 0,
    documentsApproved: false,
  };
  const ins = await db.collection(Collections.drivers).insertOne(driverDoc);
  const driverId = ins.insertedId.toString();

  await db
    .collection("user")
    .updateOne(
      { _id: userId } as never,
      { $set: { driverId } },
    );

  // Initial vehicle from registration form. Best-effort split of vehicleModel
  // ("Peugeot 308") into make/model on first whitespace; fallback uses the
  // entire string as model with "Inconnu" make so admin can fix later.
  const trimmedModel = body.vehicleModel!.trim();
  const firstSpace = trimmedModel.indexOf(" ");
  const make = firstSpace > 0 ? trimmedModel.slice(0, firstSpace) : "Inconnu";
  const model =
    firstSpace > 0 ? trimmedModel.slice(firstSpace + 1) : trimmedModel;
  const type: VehicleType = VALID_VEHICLE_TYPES.includes(
    body.vehicleType!.trim() as VehicleType,
  )
    ? (body.vehicleType!.trim() as VehicleType)
    : "Berline";

  const now = new Date();
  const vehicleDoc: VehicleDoc = {
    driverId,
    make,
    model,
    year: body.vehicleYear!.trim(),
    licensePlate: body.licensePlate!.trim().toUpperCase(),
    type,
    isActive: true,
    photos: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.collection(Collections.vehicles).insertOne(vehicleDoc);

  return NextResponse.json({
    ok: true,
    userId,
    driverId,
    needsEmailVerification: true,
  });
}
