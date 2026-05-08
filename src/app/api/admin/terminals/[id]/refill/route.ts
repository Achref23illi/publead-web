import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import {
  Collections,
  type RefillLogDoc,
  type ScentDoc,
} from "@/lib/schemas";
import { requireAdmin } from "@/lib/session";
import { StockServiceError, recordRefill } from "@/lib/stock-service";
import { serializeRefill } from "@/lib/stock-serializer";

const STATUS_BY_CODE: Record<string, number> = {
  not_found: 404,
  invalid_input: 400,
  invalid_slot: 400,
  terminal_decommissioned: 409,
};

type RouteCtx = { params: Promise<{ id: string }> };

type RefillBody = {
  slot?: number;
  scentId?: string;
  capacityMl?: number;
  levelAfter?: number;
  orderId?: string;
  notes?: string;
};

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const { id: terminalId } = await ctx.params;
  let body: RefillBody;
  try {
    body = (await req.json()) as RefillBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (typeof body.slot !== "number" || !body.scentId) {
    return NextResponse.json(
      { error: "slot, scentId required" },
      { status: 400 },
    );
  }
  try {
    const { refill } = await recordRefill({
      terminalId,
      slot: body.slot,
      scentId: body.scentId,
      capacityMl: body.capacityMl,
      levelAfter: body.levelAfter,
      orderId: body.orderId,
      notes: body.notes,
      refilledBy: auth.user.id,
    });
    const scent = (await db
      .collection(Collections.scents)
      .findOne({ _id: new ObjectId(refill.scentId) })) as ScentDoc | null;
    return NextResponse.json({
      refill: serializeRefill(refill, scent?.name),
    });
  } catch (e) {
    if (e instanceof StockServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[POST refill]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const { id: terminalId } = await ctx.params;

  const refills = (await db
    .collection(Collections.refillLogs)
    .find({ terminalId })
    .sort({ refilledAt: -1 })
    .limit(100)
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
