import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import {
  Collections,
  type RefillLogDoc,
  type ScentDoc,
  type TerminalDoc,
} from "@/lib/schemas";
import { requirePartner } from "@/lib/session";
import { serializeRefill } from "@/lib/stock-serializer";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const auth = await requirePartner(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.partner._id) {
    return NextResponse.json({ error: "partner_missing" }, { status: 409 });
  }
  const { id } = await ctx.params;

  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const terminal = (await db
    .collection(Collections.terminals)
    .findOne({ _id: oid })) as TerminalDoc | null;
  if (!terminal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (terminal.partnerId !== auth.partner._id.toString()) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const refills = (await db
    .collection(Collections.refillLogs)
    .find({ terminalId: id })
    .sort({ refilledAt: -1 })
    .limit(50)
    .toArray()) as RefillLogDoc[];

  const scentDocs = (await db
    .collection(Collections.scents)
    .find({})
    .toArray()) as ScentDoc[];
  const scentMap = new Map(scentDocs.map((s) => [s._id!.toString(), s.name]));

  return NextResponse.json({
    refills: refills.map((r) => serializeRefill(r, scentMap.get(r.scentId))),
  });
}
