import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Collections, type TransactionDoc } from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import { recomputeWallet, getPaymentsConfig } from "@/lib/wallet";
import { serializeTransaction } from "@/lib/transaction-serializer";

export async function GET(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const { driver } = auth;

  const driverId = driver._id!.toString();

  // Settle + recompute → ensures returned balances are fresh.
  const balances = await recomputeWallet(driverId);
  const config = await getPaymentsConfig();

  const url = new URL(req.url);
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "50", 10) || 50,
    200,
  );

  const txs = (await db
    .collection(Collections.transactions)
    .find({ driverId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()) as TransactionDoc[];

  return NextResponse.json({
    balances,
    config,
    transactions: txs.map(serializeTransaction),
  });
}
