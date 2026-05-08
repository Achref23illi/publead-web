import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import {
  StockServiceError,
  deleteScent,
  updateScent,
} from "@/lib/stock-service";
import { serializeScent } from "@/lib/stock-serializer";

const STATUS_BY_CODE: Record<string, number> = {
  not_found: 404,
  invalid_input: 400,
  scent_in_use: 409,
  sku_taken: 409,
};

type RouteCtx = { params: Promise<{ id: string }> };

type PatchBody = {
  name?: string;
  defaultCapacityMl?: number;
  color?: string;
};

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
  try {
    const doc = await updateScent(id, body);
    return NextResponse.json({ scent: serializeScent(doc) });
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

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  try {
    await deleteScent(id);
    return NextResponse.json({ ok: true });
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
