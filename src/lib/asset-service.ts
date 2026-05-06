import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  Collections,
  ASSET_RESOURCE_TYPES,
  ASSET_MAX_BYTES,
  ASSET_TYPES,
  type AssetDoc,
  type AssetType,
  type FileMeta,
} from "./schemas";
import { deleteAsset } from "./cloudinary";

export type AssetErrorCode =
  | "invalid_type"
  | "invalid_name"
  | "invalid_file"
  | "file_too_large"
  | "resource_type_mismatch"
  | "not_found"
  | "in_use"
  | "forbidden"
  | "unknown";

export class AssetServiceError extends Error {
  code: AssetErrorCode;
  meta?: Record<string, unknown>;
  constructor(code: AssetErrorCode, message?: string, meta?: Record<string, unknown>) {
    super(message ?? code);
    this.code = code;
    this.meta = meta;
  }
}

export type AssetDTO = {
  id: string;
  type: AssetType;
  name: string;
  file: {
    publicId: string;
    url: string;
    resourceType: "image" | "video" | "raw";
    format?: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
  };
  usageCount: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
};

export function isValidType(value: unknown): value is AssetType {
  return typeof value === "string" && (ASSET_TYPES as string[]).includes(value);
}

function serializeAsset(doc: AssetDoc, usageCount: number): AssetDTO {
  return {
    id: doc._id!.toString(),
    type: doc.type,
    name: doc.name,
    file: {
      publicId: doc.file.publicId,
      url: doc.file.url,
      resourceType: doc.file.resourceType,
      format: doc.file.format,
      bytes: doc.file.bytes,
      width: doc.file.width,
      height: doc.file.height,
      duration: doc.file.duration,
    },
    usageCount,
    uploadedBy: doc.uploadedBy,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function loadUsageMap(assetIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (assetIds.length === 0) return map;
  const rows = (await db
    .collection(Collections.campaigns)
    .aggregate([
      { $match: { assetIds: { $in: assetIds } } },
      { $unwind: "$assetIds" },
      { $match: { assetIds: { $in: assetIds } } },
      { $group: { _id: "$assetIds", count: { $sum: 1 } } },
    ])
    .toArray()) as { _id: string; count: number }[];
  for (const r of rows) map.set(r._id, r.count);
  for (const id of assetIds) if (!map.has(id)) map.set(id, 0);
  return map;
}

export async function listAssets(companyId: string): Promise<AssetDTO[]> {
  const docs = (await db
    .collection(Collections.assets)
    .find({ companyId })
    .sort({ updatedAt: -1 })
    .toArray()) as AssetDoc[];
  const ids = docs.map((d) => d._id!.toString());
  const usage = await loadUsageMap(ids);
  return docs.map((d) => serializeAsset(d, usage.get(d._id!.toString()) ?? 0));
}

export async function getAsset(
  companyId: string,
  assetId: string,
): Promise<AssetDTO> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(assetId);
  } catch {
    throw new AssetServiceError("not_found");
  }
  const doc = (await db
    .collection(Collections.assets)
    .findOne({ _id: oid, companyId })) as AssetDoc | null;
  if (!doc) throw new AssetServiceError("not_found");
  const usage = await loadUsageMap([assetId]);
  return serializeAsset(doc, usage.get(assetId) ?? 0);
}

type CreateInput = {
  companyId: string;
  uploadedBy: string;
  type: string;
  name: string;
  file: {
    publicId: string;
    url: string;
    resourceType: string;
    format?: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
  };
};

export async function createAsset(input: CreateInput): Promise<AssetDTO> {
  if (!isValidType(input.type)) throw new AssetServiceError("invalid_type");
  const trimmed = input.name.trim();
  if (!trimmed || trimmed.length > 120) {
    throw new AssetServiceError("invalid_name");
  }
  if (
    !input.file ||
    !input.file.publicId ||
    !input.file.url ||
    typeof input.file.bytes !== "number" ||
    input.file.bytes <= 0
  ) {
    throw new AssetServiceError("invalid_file");
  }
  const allowedResourceTypes = ASSET_RESOURCE_TYPES[input.type];
  if (!allowedResourceTypes.includes(input.file.resourceType as never)) {
    throw new AssetServiceError("resource_type_mismatch", undefined, {
      expected: allowedResourceTypes,
      got: input.file.resourceType,
    });
  }
  const max = ASSET_MAX_BYTES[input.type];
  if (input.file.bytes > max) {
    throw new AssetServiceError("file_too_large", undefined, { max });
  }

  const now = new Date();
  const fileMeta: AssetDoc["file"] = {
    publicId: input.file.publicId,
    url: input.file.url,
    resourceType: input.file.resourceType as "image" | "video" | "raw",
    format: input.file.format,
    bytes: input.file.bytes,
    width: input.file.width,
    height: input.file.height,
    duration: input.file.duration,
    uploadedAt: now,
  } as FileMeta & { duration?: number };

  const doc: AssetDoc = {
    companyId: input.companyId,
    uploadedBy: input.uploadedBy,
    type: input.type,
    name: trimmed,
    file: fileMeta,
    createdAt: now,
    updatedAt: now,
  };
  const ins = await db.collection(Collections.assets).insertOne(doc);
  return serializeAsset({ ...doc, _id: ins.insertedId }, 0);
}

type UpdateInput = {
  name?: string;
  type?: string;
};

export async function updateAsset(
  companyId: string,
  assetId: string,
  input: UpdateInput,
): Promise<AssetDTO> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(assetId);
  } catch {
    throw new AssetServiceError("not_found");
  }
  const updates: Partial<AssetDoc> = { updatedAt: new Date() };
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed || trimmed.length > 120) {
      throw new AssetServiceError("invalid_name");
    }
    updates.name = trimmed;
  }
  if (input.type !== undefined) {
    if (!isValidType(input.type)) throw new AssetServiceError("invalid_type");
    // Loading the doc first to verify resource_type still matches the new
    // category; e.g. a 'video' file can't become a 'logo'.
    const existing = (await db
      .collection(Collections.assets)
      .findOne({ _id: oid, companyId })) as AssetDoc | null;
    if (!existing) throw new AssetServiceError("not_found");
    const allowed = ASSET_RESOURCE_TYPES[input.type];
    if (!allowed.includes(existing.file.resourceType)) {
      throw new AssetServiceError("resource_type_mismatch");
    }
    updates.type = input.type;
  }
  const res = await db
    .collection(Collections.assets)
    .findOneAndUpdate(
      { _id: oid, companyId },
      { $set: updates },
      { returnDocument: "after" },
    );
  const updated = res as unknown as AssetDoc | null;
  if (!updated) throw new AssetServiceError("not_found");
  const usage = await loadUsageMap([assetId]);
  return serializeAsset(updated, usage.get(assetId) ?? 0);
}

export async function deleteAssetById(
  companyId: string,
  assetId: string,
): Promise<void> {
  let oid: ObjectId;
  try {
    oid = new ObjectId(assetId);
  } catch {
    throw new AssetServiceError("not_found");
  }
  const doc = (await db
    .collection(Collections.assets)
    .findOne({ _id: oid, companyId })) as AssetDoc | null;
  if (!doc) throw new AssetServiceError("not_found");

  // Block deletion when at least one campaign references this asset.
  const usage = await loadUsageMap([assetId]);
  if ((usage.get(assetId) ?? 0) > 0) {
    throw new AssetServiceError("in_use", undefined, {
      usageCount: usage.get(assetId),
    });
  }

  await db.collection(Collections.assets).deleteOne({ _id: oid });
  await deleteAsset(doc.file.publicId, doc.file.resourceType);
}
