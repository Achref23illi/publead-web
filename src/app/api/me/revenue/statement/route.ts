import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  type RevenueMonthlyDoc,
} from "@/lib/schemas";
import { requirePartner } from "@/lib/session";
import { parseMonth, sealMonth } from "@/lib/partner-revenue-service";
import {
  buildPartnerStatementCSV,
  buildPartnerStatementPDF,
} from "@/lib/partner-statement";

export async function GET(req: NextRequest) {
  const auth = await requirePartner(req.headers);
  if (!auth.ok) return auth.response;
  if (!auth.partner._id) {
    return NextResponse.json({ error: "partner_missing" }, { status: 409 });
  }
  const partnerId = auth.partner._id.toString();

  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month");
  const format = (url.searchParams.get("format") ?? "pdf").toLowerCase();
  if (!monthParam) {
    return NextResponse.json({ error: "missing_month" }, { status: 400 });
  }
  if (format !== "pdf" && format !== "csv") {
    return NextResponse.json({ error: "invalid_format" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseMonth(monthParam);
  } catch {
    return NextResponse.json({ error: "invalid_month" }, { status: 400 });
  }
  const { year, month0 } = parsed;

  // Look up sealed snapshot. If not sealed yet AND month is past, seal now.
  let monthly = (await db
    .collection(Collections.revenueMonthly)
    .findOne({ partnerId, month: monthParam })) as RevenueMonthlyDoc | null;

  if (!monthly) {
    const monthEnd = new Date(Date.UTC(year, month0 + 1, 0, 23, 59, 59));
    if (monthEnd.getTime() > Date.now()) {
      return NextResponse.json(
        { error: "month_in_progress" },
        { status: 409 },
      );
    }
    const { monthly: sealed } = await sealMonth(partnerId, year, month0);
    monthly = sealed;
  }

  if (format === "csv") {
    const csv = buildPartnerStatementCSV({
      partner: auth.partner,
      monthly,
    });
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="releve-${monthParam}.csv"`,
      },
    });
  }

  const pdf = await buildPartnerStatementPDF({
    partner: auth.partner,
    monthly,
  });
  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="releve-${monthParam}.pdf"`,
    },
  });
}
