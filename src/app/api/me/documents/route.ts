import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  DOC_TYPE_META,
  REQUIRED_DOC_TYPES,
  type DocumentDoc,
  type DocumentType,
  type FileMeta,
} from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import { buildDocumentSummary, recomputeDocumentsApproved } from "@/lib/documents";
import { deleteAssets } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const driverId = auth.driver._id!.toString();

  const summary = await buildDocumentSummary(driverId);
  return NextResponse.json({ documents: summary });
}

type SubmitBody = {
  type?: DocumentType;
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

/**
 * Replaces all files for a given document type. Old assets are deleted from
 * Cloudinary. Status flips to 'pending' (admin must review again).
 */
export async function POST(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const driverId = auth.driver._id!.toString();

  const body = (await req.json().catch(() => ({}))) as SubmitBody;
  if (!body.type || !REQUIRED_DOC_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }
  if (!Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json({ error: "files required" }, { status: 400 });
  }
  const required = DOC_TYPE_META[body.type].requiredCount;
  if (body.files.length !== required) {
    return NextResponse.json(
      { error: `expected ${required} file(s), got ${body.files.length}` },
      { status: 400 },
    );
  }
  for (const f of body.files) {
    if (!f.publicId || !f.url || !f.bytes) {
      return NextResponse.json(
        { error: "files entries require publicId, url, bytes" },
        { status: 400 },
      );
    }
    if (f.bytes > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "file exceeds 10MB" },
        { status: 400 },
      );
    }
  }

  const now = new Date();
  const newFiles: FileMeta[] = body.files.map((f) => ({
    publicId: f.publicId,
    url: f.url,
    resourceType: f.resourceType,
    format: f.format,
    bytes: f.bytes,
    width: f.width,
    height: f.height,
    uploadedAt: now,
  }));

  const existing = (await db
    .collection(Collections.documents)
    .findOne({ driverId, type: body.type })) as DocumentDoc | null;

  if (existing) {
    // Replace: delete old assets, reset reject metadata, status → pending.
    if (existing.files.length > 0) {
      await deleteAssets(
        existing.files.map((f) => ({
          publicId: f.publicId,
          resourceType: f.resourceType,
        })),
      );
    }
    await db.collection(Collections.documents).updateOne(
      { _id: existing._id },
      {
        $set: {
          files: newFiles,
          status: "pending",
          updatedAt: now,
        },
        $unset: {
          rejectReason: "",
          reviewedBy: "",
          reviewedAt: "",
        },
      },
    );
  } else {
    await db.collection(Collections.documents).insertOne({
      driverId,
      type: body.type,
      status: "pending",
      files: newFiles,
      createdAt: now,
      updatedAt: now,
    });
  }

  await recomputeDocumentsApproved(driverId);

  const summary = await buildDocumentSummary(driverId);
  return NextResponse.json({ documents: summary });
}
