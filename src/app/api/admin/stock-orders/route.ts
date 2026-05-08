import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  type ScentDoc,
  type StockOrderDoc,
  type StockOrderStatus,
} from "@/lib/schemas";
import { requireAdmin } from "@/lib/session";
import { serializeOrder } from "@/lib/stock-serializer";

const VALID_STATUSES: StockOrderStatus[] = [
  "pending",
  "fulfilled",
  "cancelled",
];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as StockOrderStatus | null;
  const partnerId = url.searchParams.get("partnerId");
  const terminalId = url.searchParams.get("terminalId");

  const filter: Record<string, unknown> = {};
  if (status && VALID_STATUSES.includes(status)) filter.status = status;
  if (partnerId) filter.partnerId = partnerId;
  if (terminalId) filter.terminalId = terminalId;

  const orders = (await db
    .collection(Collections.stockOrders)
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()) as StockOrderDoc[];

  const scentNames = await loadScentNames(orders);
  return NextResponse.json({
    orders: orders.map((o) => serializeOrder(o, scentNames)),
  });
}

async function loadScentNames(
  orders: StockOrderDoc[],
): Promise<Map<string, string>> {
  const scentIds = new Set<string>();
  for (const o of orders) for (const l of o.lines) scentIds.add(l.scentId);
  if (!scentIds.size) return new Map();
  const docs = (await db
    .collection(Collections.scents)
    .find({})
    .toArray()) as ScentDoc[];
  return new Map(docs.map((d) => [d._id!.toString(), d.name]));
}
