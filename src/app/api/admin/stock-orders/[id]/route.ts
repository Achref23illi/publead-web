import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Collections, type ScentDoc, type StockOrderDoc } from "@/lib/schemas";
import { requireAdmin } from "@/lib/session";
import {
  StockServiceError,
  cancelOrder,
  markOrderFulfilled,
} from "@/lib/stock-service";
import { serializeOrder } from "@/lib/stock-serializer";

const STATUS_BY_CODE: Record<string, number> = {
  not_found: 404,
  order_finalized: 409,
};

type RouteCtx = { params: Promise<{ id: string }> };

type PatchBody = { action?: "fulfill" | "cancel" };

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (body.action !== "fulfill" && body.action !== "cancel") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
  try {
    const order =
      body.action === "fulfill"
        ? await markOrderFulfilled(id)
        : await cancelOrder(id, auth.user.id, false);
    const scentNames = await loadScentNames(order);
    return NextResponse.json({ order: serializeOrder(order, scentNames) });
  } catch (e) {
    if (e instanceof StockServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

async function loadScentNames(
  order: StockOrderDoc,
): Promise<Map<string, string>> {
  const ids = order.lines.map((l) => l.scentId);
  if (!ids.length) return new Map();
  const docs = (await db
    .collection(Collections.scents)
    .find({})
    .toArray()) as ScentDoc[];
  return new Map(docs.map((d) => [d._id!.toString(), d.name]));
}
