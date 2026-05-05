import { db } from "./db";
import {
  Collections,
  type AppConfigDoc,
  type DriverDoc,
  type TransactionDoc,
  type WithdrawalDoc,
} from "./schemas";
import { ObjectId } from "mongodb";

// --- Config (cached for the lifetime of one server runtime call chain) ---

let configCache: AppConfigDoc | null = null;

const DEFAULT_CONFIG = {
  withdrawalMinCents: 5000,
  pendingHoldDays: 7,
};

export async function getPaymentsConfig(): Promise<{
  withdrawalMinCents: number;
  pendingHoldDays: number;
}> {
  if (configCache) {
    return {
      withdrawalMinCents: configCache.withdrawalMinCents,
      pendingHoldDays: configCache.pendingHoldDays,
    };
  }
  const doc = (await db
    .collection(Collections.appConfig)
    .findOne({ key: "payments" })) as AppConfigDoc | null;
  if (doc) {
    configCache = doc;
    return {
      withdrawalMinCents: doc.withdrawalMinCents,
      pendingHoldDays: doc.pendingHoldDays,
    };
  }
  return DEFAULT_CONFIG;
}

export function clearConfigCache() {
  configCache = null;
}

// --- Tier resolution: compute current tier from availableAt ---
// Pending campaign credits become available once availableAt has passed.
// Withdrawal debits are always 'available'-tier and never settle.

export function effectiveTier(
  tx: Pick<TransactionDoc, "tier" | "availableAt" | "type">,
  now: Date = new Date(),
): "pending" | "available" {
  if (tx.tier === "available") return "available";
  if (tx.type === "withdrawal_debit" || tx.type === "withdrawal_refund") {
    return "available";
  }
  return now >= tx.availableAt ? "available" : "pending";
}

// --- Settlement: persist settled transactions back to DB (tier flip) ---

export async function settlePendingTransactions(
  driverId: string,
  now: Date = new Date(),
): Promise<number> {
  const res = await db.collection(Collections.transactions).updateMany(
    {
      driverId,
      tier: "pending",
      availableAt: { $lte: now },
    },
    { $set: { tier: "available" } },
  );
  return res.modifiedCount;
}

// --- Snapshot recompute on DriverDoc ---

export async function recomputeWallet(driverId: string): Promise<{
  availableBalanceCents: number;
  pendingBalanceCents: number;
  withdrawnTotalCents: number;
}> {
  await settlePendingTransactions(driverId);

  const all = (await db
    .collection(Collections.transactions)
    .find({ driverId })
    .toArray()) as TransactionDoc[];

  let availableBalanceCents = 0;
  let pendingBalanceCents = 0;
  let withdrawnTotalCents = 0;

  for (const tx of all) {
    const tier = effectiveTier(tx);
    if (tier === "available") {
      availableBalanceCents += tx.amountCents;
    } else {
      pendingBalanceCents += tx.amountCents;
    }
    if (tx.type === "withdrawal_debit") {
      // Stored amount is negative for debits; track positive total withdrawn.
      withdrawnTotalCents += -tx.amountCents;
    }
  }

  await db.collection(Collections.drivers).updateOne(
    { _id: new ObjectId(driverId) },
    {
      $set: {
        availableBalanceCents,
        pendingBalanceCents,
        withdrawnTotalCents,
      },
    },
  );

  return { availableBalanceCents, pendingBalanceCents, withdrawnTotalCents };
}

// --- Insert credit on campaign completion ---

export async function creditCampaignCompletion(args: {
  driverId: string;
  campaignId: string;
  amountCents: number;
  brand: string;
  campaignTitle: string;
  completedAt: Date;
}): Promise<void> {
  const { pendingHoldDays } = await getPaymentsConfig();
  const availableAt = new Date(
    args.completedAt.getTime() + pendingHoldDays * 86400000,
  );

  const exists = await db.collection(Collections.transactions).findOne({
    driverId: args.driverId,
    campaignId: args.campaignId,
    type: "campaign_completion",
  });
  if (exists) return; // idempotent

  const tx: TransactionDoc = {
    driverId: args.driverId,
    type: "campaign_completion",
    amountCents: args.amountCents,
    tier: availableAt <= new Date() ? "available" : "pending",
    availableAt,
    createdAt: args.completedAt,
    campaignId: args.campaignId,
    description: `Paiement campagne ${args.brand} — ${args.campaignTitle}`,
    meta: { brand: args.brand, campaignTitle: args.campaignTitle },
  };

  await db.collection(Collections.transactions).insertOne(tx);
  await recomputeWallet(args.driverId);
}

// --- Withdrawal lifecycle helpers ---

export async function createWithdrawal(args: {
  driver: DriverDoc;
  amountCents: number;
}): Promise<{ withdrawal: WithdrawalDoc; debitTxId: string }> {
  const driverId = args.driver._id!.toString();
  if (!args.driver.bankAccount?.iban) {
    throw new Error("missing bank account");
  }
  const { withdrawalMinCents } = await getPaymentsConfig();
  if (args.amountCents < withdrawalMinCents) {
    throw new Error(
      `min withdrawal ${(withdrawalMinCents / 100).toFixed(2)} €`,
    );
  }
  await settlePendingTransactions(driverId);
  const fresh = (await db
    .collection(Collections.drivers)
    .findOne({ _id: args.driver._id })) as DriverDoc;
  if ((fresh.availableBalanceCents ?? 0) < args.amountCents) {
    throw new Error("insufficient balance");
  }

  const now = new Date();

  const debit: TransactionDoc = {
    driverId,
    type: "withdrawal_debit",
    amountCents: -args.amountCents,
    tier: "available",
    availableAt: now,
    createdAt: now,
    description: `Retrait bancaire — ${(args.amountCents / 100).toFixed(2)} €`,
    meta: { iban: args.driver.bankAccount.iban },
  };
  const debitInsert = await db
    .collection(Collections.transactions)
    .insertOne(debit);
  const debitTxId = debitInsert.insertedId.toString();

  const withdrawal: WithdrawalDoc = {
    driverId,
    amountCents: args.amountCents,
    status: "pending",
    iban: args.driver.bankAccount.iban,
    bankName: args.driver.bankAccount.bankName,
    accountHolder: args.driver.bankAccount.accountHolder,
    debitTransactionId: debitTxId,
    createdAt: now,
  };
  const wInsert = await db
    .collection(Collections.withdrawals)
    .insertOne(withdrawal);

  // Link withdrawalId back onto the debit tx for easy lookup.
  await db
    .collection(Collections.transactions)
    .updateOne(
      { _id: debitInsert.insertedId },
      { $set: { withdrawalId: wInsert.insertedId.toString() } },
    );

  await recomputeWallet(driverId);

  return {
    withdrawal: { ...withdrawal, _id: wInsert.insertedId },
    debitTxId,
  };
}

export async function processWithdrawal(args: {
  withdrawalId: string;
  adminUserId: string;
  decision: "paid" | "rejected";
  payoutReference?: string;
  rejectReason?: string;
}): Promise<WithdrawalDoc> {
  const w = (await db
    .collection(Collections.withdrawals)
    .findOne({ _id: new ObjectId(args.withdrawalId) })) as WithdrawalDoc | null;
  if (!w) throw new Error("withdrawal not found");
  if (w.status !== "pending") throw new Error(`already ${w.status}`);

  const now = new Date();

  if (args.decision === "paid") {
    await db.collection(Collections.withdrawals).updateOne(
      { _id: w._id },
      {
        $set: {
          status: "paid",
          processedAt: now,
          processedBy: args.adminUserId,
          payoutReference: args.payoutReference,
        },
      },
    );
    return { ...w, status: "paid", processedAt: now };
  }

  // Rejected → refund credit transaction, restore balance.
  const refund: TransactionDoc = {
    driverId: w.driverId,
    type: "withdrawal_refund",
    amountCents: w.amountCents,
    tier: "available",
    availableAt: now,
    createdAt: now,
    withdrawalId: w._id!.toString(),
    description: `Remboursement retrait #${w._id!.toString().slice(-6)}`,
    meta: { reason: args.rejectReason },
  };
  const refundInsert = await db
    .collection(Collections.transactions)
    .insertOne(refund);

  await db.collection(Collections.withdrawals).updateOne(
    { _id: w._id },
    {
      $set: {
        status: "rejected",
        processedAt: now,
        processedBy: args.adminUserId,
        rejectReason: args.rejectReason,
        refundTransactionId: refundInsert.insertedId.toString(),
      },
    },
  );

  await recomputeWallet(w.driverId);

  return { ...w, status: "rejected", processedAt: now };
}
