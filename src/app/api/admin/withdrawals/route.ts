import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  Collections,
  type DriverDoc,
  type WithdrawalDoc,
  type WithdrawalStatus,
} from "@/lib/schemas";
import { requireAdmin } from "@/lib/session";
import { ObjectId } from "mongodb";

const VALID: WithdrawalStatus[] = ["pending", "paid", "rejected"];

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") ?? "pending";
  const status = (
    VALID.includes(statusParam as WithdrawalStatus) ? statusParam : "pending"
  ) as WithdrawalStatus;

  const list = (await db
    .collection(Collections.withdrawals)
    .find({ status })
    .sort({ createdAt: -1 })
    .toArray()) as WithdrawalDoc[];

  // Hydrate driver names for the queue.
  const driverIds = Array.from(new Set(list.map((w) => w.driverId)));
  const driverDocs = (await db
    .collection(Collections.drivers)
    .find({ _id: { $in: driverIds.map((id) => new ObjectId(id)) } })
    .project({ firstName: 1, lastName: 1, city: 1 })
    .toArray()) as Pick<DriverDoc, "_id" | "firstName" | "lastName" | "city">[];
  const driverMap = new Map(driverDocs.map((d) => [d._id!.toString(), d]));

  return NextResponse.json({
    withdrawals: list.map((w) => {
      const d = driverMap.get(w.driverId);
      return {
        id: w._id!.toString(),
        driverId: w.driverId,
        driverName: d ? `${d.firstName} ${d.lastName}` : "Inconnu",
        driverCity: d?.city ?? "",
        amountCents: w.amountCents,
        status: w.status,
        iban: w.iban,
        bankName: w.bankName,
        accountHolder: w.accountHolder,
        createdAt: w.createdAt.toISOString(),
        processedAt: w.processedAt?.toISOString(),
        payoutReference: w.payoutReference,
        rejectReason: w.rejectReason,
      };
    }),
  });
}
