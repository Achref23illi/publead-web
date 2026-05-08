import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import {
  StockServiceError,
  createScent,
  listScents,
} from "@/lib/stock-service";
import { serializeScent } from "@/lib/stock-serializer";

const STATUS_BY_CODE: Record<string, number> = {
  not_found: 404,
  invalid_input: 400,
  sku_taken: 409,
  scent_in_use: 409,
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const scents = await listScents();
  return NextResponse.json({ scents: scents.map(serializeScent) });
}

type CreateBody = {
  sku?: string;
  name?: string;
  defaultCapacityMl?: number;
  color?: string;
};

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!body.sku || !body.name || typeof body.defaultCapacityMl !== "number") {
    return NextResponse.json(
      { error: "sku, name, defaultCapacityMl required" },
      { status: 400 },
    );
  }
  try {
    const doc = await createScent({
      sku: body.sku,
      name: body.name,
      defaultCapacityMl: body.defaultCapacityMl,
      color: body.color,
    });
    return NextResponse.json({ scent: serializeScent(doc) });
  } catch (e) {
    if (e instanceof StockServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[POST /api/admin/scents]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
