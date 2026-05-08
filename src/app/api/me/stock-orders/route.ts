import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  type ScentDoc,
  type StockOrderDoc,
  type StockOrderStatus,
} from "@/lib/schemas";
import { requirePartner } from "@/lib/session";
import { StockServiceError, createOrder } from "@/lib/stock-service";
import { serializeOrder } from "@/lib/stock-serializer";

const VALID_STATUSES: StockOrderStatus[] = [
  "pending",
  "fulfilled",
  "cancelled",
];

const STATUS_BY_CODE: Record<string, number> = {
  not_found: 404,
  forbidden: 403,
  invalid_input: 400,
  terminal_decommissioned: 409,
};

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.partner._id) {
    return NextResponse.json({ error: "partner_missing" }, { status: 409 });
  }
  const partnerId = auth.partner._id.toString();

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as StockOrderStatus | null;
  const terminalId = url.searchParams.get("terminalId");

  const filter: Record<string, unknown> = { partnerId };
  if (status && VALID_STATUSES.includes(status)) filter.status = status;
  if (terminalId) filter.terminalId = terminalId;

  const orders = (await db
    .collection(Collections.stockOrders)
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()) as StockOrderDoc[];

  const scentNames = await loadScentNames();
  return NextResponse.json({
    orders: orders.map((o) => serializeOrder(o, scentNames)),
  });
}

type CreateBody = {
  terminalId?: string;
  lines?: { scentId: string; qty: number }[];
  notes?: string;
};

export async function POST(req: NextRequest) {
  const auth = await requirePartner(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.partner._id) {
    return NextResponse.json({ error: "partner_missing" }, { status: 409 });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!body.terminalId || !Array.isArray(body.lines) || !body.lines.length) {
    return NextResponse.json(
      { error: "terminalId + lines required" },
      { status: 400 },
    );
  }

  try {
    const order = await createOrder(
      auth.partner._id.toString(),
      body.terminalId,
      body.lines,
      auth.user.id,
      body.notes,
    );
    const scentNames = await loadScentNames();
    return NextResponse.json({ order: serializeOrder(order, scentNames) });
  } catch (e) {
    if (e instanceof StockServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[POST /api/me/stock-orders]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

async function loadScentNames(): Promise<Map<string, string>> {
  const docs = (await db
    .collection(Collections.scents)
    .find({})
    .toArray()) as ScentDoc[];
  return new Map(docs.map((d) => [d._id!.toString(), d.name]));
}
