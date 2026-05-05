import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import {
  Collections,
  VEHICLE_PHOTOS_MAX,
  type FileMeta,
  type VehicleDoc,
} from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import { serializeVehicle } from "@/lib/vehicles";
import { deleteAsset } from "@/lib/cloudinary";

type AppendBody = {
  files?: {
    publicId: string;
    url: string;
    resourceType: "image" | "raw" | "video";
    format?: string;
    bytes: number;
    width?: number;
    height?: number;
  }[];
};

async function loadOwned(
  driverId: string,
  id: string,
): Promise<VehicleDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const v = (await db
    .collection(Collections.vehicles)
    .findOne({ _id: new ObjectId(id) })) as VehicleDoc | null;
  if (!v || v.driverId !== driverId) return null;
  return v;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const driverId = auth.driver._id!.toString();

  const { id } = await ctx.params;
  const v = await loadOwned(driverId, id);
  if (!v) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as AppendBody;
  if (!Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json({ error: "files required" }, { status: 400 });
  }

  const room = VEHICLE_PHOTOS_MAX - v.photos.length;
  if (body.files.length > room) {
    return NextResponse.json(
      { error: `max ${VEHICLE_PHOTOS_MAX} photos per vehicle` },
      { status: 409 },
    );
  }

  const now = new Date();
  const newPhotos: FileMeta[] = body.files.map((f) => ({
    publicId: f.publicId,
    url: f.url,
    resourceType: f.resourceType,
    format: f.format,
    bytes: f.bytes,
    width: f.width,
    height: f.height,
    uploadedAt: now,
  }));

  await db.collection(Collections.vehicles).updateOne(
    { _id: v._id },
    {
      $push: {
        photos: { $each: newPhotos },
      } as never,
      $set: { updatedAt: now },
    },
  );

  const fresh = (await db
    .collection(Collections.vehicles)
    .findOne({ _id: v._id })) as VehicleDoc;
  return NextResponse.json({ vehicle: serializeVehicle(fresh) });
}

type DeleteBody = { publicId?: string };

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

  const body = (await req.json().catch(() => ({}))) as DeleteBody;
  const publicId = body.publicId?.trim();
  if (!publicId) {
    return NextResponse.json({ error: "publicId required" }, { status: 400 });
  }

  const photo = v.photos.find((p) => p.publicId === publicId);
  if (!photo) {
    return NextResponse.json({ error: "photo not found" }, { status: 404 });
  }

  await deleteAsset(publicId, photo.resourceType);

  await db.collection(Collections.vehicles).updateOne(
    { _id: v._id },
    {
      $pull: { photos: { publicId } } as never,
      $set: { updatedAt: new Date() },
    },
  );

  const fresh = (await db
    .collection(Collections.vehicles)
    .findOne({ _id: v._id })) as VehicleDoc;
  return NextResponse.json({ vehicle: serializeVehicle(fresh) });
}
