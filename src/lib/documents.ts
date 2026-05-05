import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  Collections,
  DOC_TYPE_META,
  REQUIRED_DOC_TYPES,
  type DocumentDoc,
  type DocumentStatus,
  type DocumentType,
} from "./schemas";

/**
 * Recomputes Driver.documentsApproved based on document records.
 * True only when every required type has status === 'approved' and
 * the file count meets DOC_TYPE_META[type].requiredCount.
 */
export async function recomputeDocumentsApproved(
  driverId: string,
): Promise<boolean> {
  const docs = (await db
    .collection(Collections.documents)
    .find({ driverId })
    .toArray()) as DocumentDoc[];

  const byType = new Map(docs.map((d) => [d.type, d]));

  let allApproved = true;
  for (const t of REQUIRED_DOC_TYPES) {
    const d = byType.get(t);
    if (!d) {
      allApproved = false;
      break;
    }
    if (d.status !== "approved") {
      allApproved = false;
      break;
    }
    if (d.files.length < DOC_TYPE_META[t].requiredCount) {
      allApproved = false;
      break;
    }
  }

  await db
    .collection(Collections.drivers)
    .updateOne(
      { _id: new ObjectId(driverId) },
      { $set: { documentsApproved: allApproved } },
    );

  return allApproved;
}

export type DocumentSummary = {
  type: DocumentType;
  label: string;
  requiredCount: number;
  description: string;
  status: DocumentStatus;
  filesCount: number;
  rejectReason?: string;
  reviewedAt?: string;
  updatedAt?: string;
  documentId?: string;
};

/**
 * Returns one entry per required type with current status, filling 'missing'
 * for types the driver has not yet started.
 */
export async function buildDocumentSummary(
  driverId: string,
): Promise<DocumentSummary[]> {
  const docs = (await db
    .collection(Collections.documents)
    .find({ driverId })
    .toArray()) as DocumentDoc[];
  const byType = new Map(docs.map((d) => [d.type, d]));

  return REQUIRED_DOC_TYPES.map((type) => {
    const meta = DOC_TYPE_META[type];
    const d = byType.get(type);
    if (!d) {
      return {
        type,
        label: meta.label,
        requiredCount: meta.requiredCount,
        description: meta.description,
        status: "missing" as const,
        filesCount: 0,
      };
    }
    return {
      type,
      label: meta.label,
      requiredCount: meta.requiredCount,
      description: meta.description,
      status: d.status,
      filesCount: d.files.length,
      rejectReason: d.rejectReason,
      reviewedAt: d.reviewedAt?.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      documentId: d._id?.toString(),
    };
  });
}
