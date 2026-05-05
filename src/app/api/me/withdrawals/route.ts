import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Collections, type WithdrawalDoc } from "@/lib/schemas";
import { requireDriver } from "@/lib/session";
import { createWithdrawal } from "@/lib/wallet";

export async function GET(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const { driver } = auth;

  const list = (await db
    .collection(Collections.withdrawals)
    .find({ driverId: driver._id!.toString() })
    .sort({ createdAt: -1 })
    .toArray()) as WithdrawalDoc[];

  return NextResponse.json({
    withdrawals: list.map((w) => ({
      id: w._id!.toString(),
      amountCents: w.amountCents,
      status: w.status,
      iban: w.iban,
      createdAt: w.createdAt.toISOString(),
      processedAt: w.processedAt?.toISOString(),
      payoutReference: w.payoutReference,
      rejectReason: w.rejectReason,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const { driver } = auth;

  type Body = { amountCents?: number };
  const body = (await req.json().catch(() => ({}))) as Body;
  const amountCents = Number(body.amountCents);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json(
      { error: "invalid amountCents" },
      { status: 400 },
    );
  }
  if (!driver.bankAccount?.iban) {
    return NextResponse.json(
      { error: "missing bank account" },
      { status: 409 },
    );
  }

  try {
    const { withdrawal } = await createWithdrawal({
      driver,
      amountCents: Math.round(amountCents),
    });
    return NextResponse.json({
      withdrawal: {
        id: withdrawal._id!.toString(),
        amountCents: withdrawal.amountCents,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt.toISOString(),
      },
    });
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? "withdrawal failed";
    const status =
      msg === "insufficient balance" || msg === "missing bank account"
        ? 409
        : msg.startsWith("min withdrawal")
          ? 400
          : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
