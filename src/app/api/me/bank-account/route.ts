import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Collections } from "@/lib/schemas";
import { requireDriver } from "@/lib/session";

type Body = {
  iban?: string;
  bankName?: string;
  accountHolder?: string;
};

function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

function isValidIban(iban: string): boolean {
  // Basic structural check: 15-34 alphanumeric, starts with 2 letters + 2 digits.
  return /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban);
}

export async function PUT(req: NextRequest) {
  const auth = await requireDriver(req.headers);
  if (!auth.ok) return auth.response;
  const { driver } = auth;

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.iban?.trim()) {
    return NextResponse.json({ error: "iban required" }, { status: 400 });
  }
  const iban = normalizeIban(body.iban);
  if (!isValidIban(iban)) {
    return NextResponse.json({ error: "invalid IBAN" }, { status: 400 });
  }

  await db.collection(Collections.drivers).updateOne(
    { _id: driver._id },
    {
      $set: {
        bankAccount: {
          iban,
          bankName: body.bankName?.trim() || undefined,
          accountHolder: body.accountHolder?.trim() || undefined,
        },
      },
    },
  );

  return NextResponse.json({
    bankAccount: {
      iban,
      bankName: body.bankName?.trim() || undefined,
      accountHolder: body.accountHolder?.trim() || undefined,
    },
  });
}
