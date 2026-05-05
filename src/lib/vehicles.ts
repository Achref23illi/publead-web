import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  Collections,
  VEHICLE_MAX_PER_DRIVER,
  type InspectionInfo,
  type VehicleDoc,
} from "./schemas";

export type VehicleDTO = {
  id: string;
  driverId: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  type: VehicleDoc["type"];
  isActive: boolean;
  inspection?: {
    expiresAt?: string;
    status: "valid" | "expiring" | "expired" | "missing";
    fileUrl?: string;
    daysUntilExpiry?: number;
  };
  photos: {
    publicId: string;
    url: string;
    resourceType: "image" | "raw" | "video";
    bytes: number;
    uploadedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

function inspectionStatus(
  inspection?: InspectionInfo,
  now: Date = new Date(),
): VehicleDTO["inspection"] {
  if (!inspection?.expiresAt) {
    return { status: "missing" };
  }
  const expiresAt = inspection.expiresAt;
  const daysUntilExpiry = Math.round(
    (expiresAt.getTime() - now.getTime()) / 86400000,
  );
  let status: "valid" | "expiring" | "expired" = "valid";
  if (daysUntilExpiry < 0) status = "expired";
  else if (daysUntilExpiry <= 30) status = "expiring";
  return {
    expiresAt: expiresAt.toISOString(),
    status,
    fileUrl: inspection.fileUrl,
    daysUntilExpiry,
  };
}

export function serializeVehicle(v: VehicleDoc): VehicleDTO {
  return {
    id: v._id!.toString(),
    driverId: v.driverId,
    make: v.make,
    model: v.model,
    year: v.year,
    licensePlate: v.licensePlate,
    type: v.type,
    isActive: v.isActive,
    inspection: inspectionStatus(v.inspection),
    photos: v.photos.map((p) => ({
      publicId: p.publicId,
      url: p.url,
      resourceType: p.resourceType,
      bytes: p.bytes,
      uploadedAt: p.uploadedAt.toISOString(),
    })),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

export async function listVehiclesForDriver(
  driverId: string,
): Promise<VehicleDoc[]> {
  return (await db
    .collection(Collections.vehicles)
    .find({ driverId })
    .sort({ isActive: -1, createdAt: 1 })
    .toArray()) as VehicleDoc[];
}

export async function countVehiclesForDriver(
  driverId: string,
): Promise<number> {
  return db.collection(Collections.vehicles).countDocuments({ driverId });
}

/**
 * Sets `isActive=true` on the target vehicle and false on all others for the
 * same driver. Single Mongo update per side; the second guarantees only one
 * doc has isActive=true even if multiple writes interleave.
 */
export async function activateVehicle(
  driverId: string,
  vehicleId: string,
): Promise<void> {
  await db
    .collection(Collections.vehicles)
    .updateMany(
      { driverId, _id: { $ne: new ObjectId(vehicleId) } },
      { $set: { isActive: false, updatedAt: new Date() } },
    );
  await db
    .collection(Collections.vehicles)
    .updateOne(
      { _id: new ObjectId(vehicleId), driverId },
      { $set: { isActive: true, updatedAt: new Date() } },
    );
}

/**
 * After a delete: if no vehicle is active, promote the oldest remaining one.
 * No-op when zero vehicles remain.
 */
export async function ensureSomeActive(driverId: string): Promise<void> {
  const remaining = (await db
    .collection(Collections.vehicles)
    .find({ driverId })
    .sort({ createdAt: 1 })
    .toArray()) as VehicleDoc[];
  if (remaining.length === 0) return;
  const hasActive = remaining.some((v) => v.isActive);
  if (hasActive) return;
  await db
    .collection(Collections.vehicles)
    .updateOne(
      { _id: remaining[0]._id },
      { $set: { isActive: true, updatedAt: new Date() } },
    );
}

export function assertCapacity(currentCount: number) {
  if (currentCount >= VEHICLE_MAX_PER_DRIVER) {
    throw new Error(`max ${VEHICLE_MAX_PER_DRIVER} vehicles per driver`);
  }
}
