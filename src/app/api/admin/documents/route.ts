import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  DOC_TYPE_META,
  type DocumentDoc,
  type DocumentStatus,
  type DriverDoc,
} from "@/lib/schemas";
import { requireAdmin } from "@/lib/session";
import { ObjectId } from "mongodb";

const VALID_STATUS: DocumentStatus[] = ["pending", "approved", "rejected"];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") ?? "pending";
  const status = (VALID_STATUS.includes(statusParam as DocumentStatus)
    ? statusParam
    : "pending") as DocumentStatus;

  const docs = (await db
    .collection(Collections.documents)
    .find({ status })
    .sort({ updatedAt: -1 })
    .toArray()) as DocumentDoc[];

  const driverIds = Array.from(new Set(docs.map((d) => d.driverId)));
  const drivers = (await db
    .collection(Collections.drivers)
    .find({
      _id: { $in: driverIds.map((id) => new ObjectId(id)) },
    })
    .project({ firstName: 1, lastName: 1, city: 1 })
    .toArray()) as Pick<
    DriverDoc,
    "_id" | "firstName" | "lastName" | "city"
  >[];
  const driverMap = new Map(drivers.map((d) => [d._id!.toString(), d]));

  return NextResponse.json({
    documents: docs.map((d) => {
      const driver = driverMap.get(d.driverId);
      return {
        id: d._id!.toString(),
        driverId: d.driverId,
        driverName: driver
          ? `${driver.firstName} ${driver.lastName}`
          : "Inconnu",
        driverCity: driver?.city ?? "",
        type: d.type,
        typeLabel: DOC_TYPE_META[d.type].label,
        status: d.status,
        files: d.files.map((f) => ({
          publicId: f.publicId,
          url: f.url,
          resourceType: f.resourceType,
          format: f.format,
          bytes: f.bytes,
          uploadedAt: f.uploadedAt.toISOString(),
        })),
        rejectReason: d.rejectReason,
        reviewedAt: d.reviewedAt?.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        createdAt: d.createdAt.toISOString(),
      };
    }),
  });
}
