import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Collections, type ScentDoc } from "@/lib/schemas";
import { requirePartner } from "@/lib/session";
import { StockServiceError, cancelOrder } from "@/lib/stock-service";
import { serializeOrder } from "@/lib/stock-serializer";

const STATUS_BY_CODE: Record<string, number> = {
  not_found: 404,
  forbidden: 403,
  order_finalized: 409,
};

type RouteCtx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const auth = await requirePartner(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.partner._id) {
    return NextResponse.json({ error: "partner_missing" }, { status: 409 });
  }
  const { id } = await ctx.params;

  try {
    const order = await cancelOrder(
      id,
      auth.user.id,
      true,
      auth.partner._id.toString(),
    );
    const scentDocs = (await db
      .collection(Collections.scents)
      .find({})
      .toArray()) as ScentDoc[];
    const scentNames = new Map(
      scentDocs.map((d) => [d._id!.toString(), d.name]),
    );
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
