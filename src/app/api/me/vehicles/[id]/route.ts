import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import {
  Collections,
  type VehicleDoc,
  type VehicleType,
} from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import { ensureSomeActive, serializeVehicle } from "@/lib/vehicles";
import { deleteAssets } from "@/lib/cloudinary";

const VALID_TYPES: VehicleType[] = ["Berline", "SUV", "Utilitaire", "Autre"];

type UpdateBody = {
  make?: string;
  model?: string;
  year?: string;
  licensePlate?: string;
  type?: VehicleType;
  inspectionExpiresAt?: string | null;
};

async function loadOwned(
  driverId: string,
  id: string,
): Promise<VehicleDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const v = (await db
    .collection(Collections.vehicles)
    .findOne({ _id: new ObjectId(id) })) as VehicleDoc | null;
  if (!v) return null;
  if (v.driverId !== driverId) return null;
  return v;
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const driverId = auth.driver._id!.toString();

  const { id } = await ctx.params;
  const v = await loadOwned(driverId, id);
  if (!v) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as UpdateBody;

  const $set: Record<string, unknown> = { updatedAt: new Date() };
  const $unset: Record<string, "" | true> = {};

  if (body.make !== undefined) {
    if (!body.make.trim()) {
      return NextResponse.json({ error: "make required" }, { status: 400 });
    }
    $set.make = body.make.trim();
  }
  if (body.model !== undefined) {
    if (!body.model.trim()) {
      return NextResponse.json({ error: "model required" }, { status: 400 });
    }
    $set.model = body.model.trim();
  }
  if (body.year !== undefined) {
    if (!body.year.trim()) {
      return NextResponse.json({ error: "year required" }, { status: 400 });
    }
    $set.year = body.year.trim();
  }
  if (body.licensePlate !== undefined) {
    if (!body.licensePlate.trim()) {
      return NextResponse.json(
        { error: "licensePlate required" },
        { status: 400 },
      );
    }
    $set.licensePlate = body.licensePlate.trim().toUpperCase();
  }
  if (body.type !== undefined) {
    if (!VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }
    $set.type = body.type;
  }
  if (body.inspectionExpiresAt === null) {
    $unset.inspection = "";
  } else if (body.inspectionExpiresAt !== undefined) {
    $set.inspection = {
      ...v.inspection,
      expiresAt: new Date(body.inspectionExpiresAt),
    };
  }

  const update: Record<string, unknown> = { $set };
  if (Object.keys($unset).length > 0) update.$unset = $unset;

  await db
    .collection(Collections.vehicles)
    .updateOne({ _id: v._id }, update);

  const fresh = (await db
    .collection(Collections.vehicles)
    .findOne({ _id: v._id })) as VehicleDoc;
  return NextResponse.json({ vehicle: serializeVehicle(fresh) });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const driverId = auth.driver._id!.toString();

  const { id } = await ctx.params;
  const v = await loadOwned(driverId, id);
  if (!v) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Delete Cloudinary assets best-effort.
  if (v.photos.length > 0) {
    await deleteAssets(
      v.photos.map((p) => ({
        publicId: p.publicId,
        resourceType: p.resourceType,
      })),
    );
  }
  if (v.inspection?.filePublicId) {
    await deleteAssets([
      { publicId: v.inspection.filePublicId, resourceType: "image" },
    ]);
  }

  await db.collection(Collections.vehicles).deleteOne({ _id: v._id });

  // Promote oldest remaining if none active.
  await ensureSomeActive(driverId);

  return NextResponse.json({ ok: true });
}
