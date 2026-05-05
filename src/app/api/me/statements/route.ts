import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Collections, type TransactionDoc } from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import { serializeTransaction } from "@/lib/transaction-serializer";

const MONTHS_FR = [
  "janv.",
  "fév.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export async function GET(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const { driver } = auth;

  const url = new URL(req.url);
  const periodParam = url.searchParams.get("period");

  const now = new Date();
  let year: number;
  let month: number;
  if (periodParam) {
    const m = /^(\d{4})-(\d{2})$/.exec(periodParam);
    if (!m) {
      return NextResponse.json({ error: "expected YYYY-MM" }, { status: 400 });
    }
    year = parseInt(m[1], 10);
    month = parseInt(m[2], 10);
  } else {
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }
  if (month < 1 || month > 12) {
    return NextResponse.json({ error: "invalid month" }, { status: 400 });
  }

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const txs = (await db
    .collection(Collections.transactions)
    .find({
      driverId: driver._id!.toString(),
      createdAt: { $gte: monthStart, $lt: monthEnd },
    })
    .sort({ createdAt: -1 })
    .toArray()) as TransactionDoc[];

  let incomeCents = 0;
  let withdrawnCents = 0;
  for (const t of txs) {
    if (t.amountCents > 0) incomeCents += t.amountCents;
    else withdrawnCents += -t.amountCents;
  }

  // Build last 12 months selector for UI.
  const periods: { period: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    periods.push({
      period: `${yyyy}-${mm}`,
      label: `${MONTHS_FR[d.getMonth()]} ${yyyy}`,
    });
  }

  return NextResponse.json({
    period: `${year}-${String(month).padStart(2, "0")}`,
    monthLabel: `${MONTHS_FR[month - 1]} ${year}`,
    incomeCents,
    withdrawnCents,
    netCents: incomeCents - withdrawnCents,
    periods,
    transactions: txs.map(serializeTransaction),
  });
}
