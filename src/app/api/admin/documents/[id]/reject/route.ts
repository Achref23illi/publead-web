import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { Collections, type DocumentDoc } from "@/lib/schemas";
import { requireAdmin } from "@/lib/session";
import { recomputeDocumentsApproved } from "@/lib/documents";

type Body = { reason?: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const reason = body.reason?.trim();
  if (!reason) {
    return NextResponse.json(
      { error: "rejection reason required" },
      { status: 400 },
    );
  }

  const doc = (await db
    .collection(Collections.documents)
    .findOne({ _id: new ObjectId(id) })) as DocumentDoc | null;
  if (!doc) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const now = new Date();
  await db.collection(Collections.documents).updateOne(
    { _id: doc._id },
    {
      $set: {
        status: "rejected",
        reviewedBy: auth.user.id,
        reviewedAt: now,
        rejectReason: reason,
        updatedAt: now,
      },
    },
  );

  await recomputeDocumentsApproved(doc.driverId);

  return NextResponse.json({ ok: true });
}
