import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Collections, type TransactionDoc } from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import { buildStatementPDF } from "@/lib/statement-pdf";

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ period: string }> },
) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const { driver } = auth;

  const { period } = await ctx.params;
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) {
    return NextResponse.json(
      { error: "expected YYYY-MM" },
      { status: 400 },
    );
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) {
    return NextResponse.json({ error: "invalid month" }, { status: 400 });
  }

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const monthLabel = `${MONTHS_FR[month - 1]} ${year}`;

  const txs = (await db
    .collection(Collections.transactions)
    .find({
      driverId: driver._id!.toString(),
      createdAt: { $gte: monthStart, $lt: monthEnd },
    })
    .sort({ createdAt: 1 })
    .toArray()) as TransactionDoc[];

  const pdf = await buildStatementPDF({
    driver,
    monthStart,
    monthEnd,
    monthLabel,
    transactions: txs,
  });

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="releve-${period}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
