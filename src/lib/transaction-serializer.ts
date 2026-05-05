import type { TransactionDoc } from "./schemas";
import { effectiveTier } from "./wallet";

export type TransactionDTO = {
  id: string;
  type: TransactionDoc["type"];
  amountCents: number;
  tier: "pending" | "available";
  availableAt: string;
  createdAt: string;
  campaignId?: string;
  withdrawalId?: string;
  description: string;
  meta?: Record<string, unknown>;
};

export function serializeTransaction(t: TransactionDoc): TransactionDTO {
  return {
    id: t._id!.toString(),
    type: t.type,
    amountCents: t.amountCents,
    tier: effectiveTier(t),
    availableAt: t.availableAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
    campaignId: t.campaignId,
    withdrawalId: t.withdrawalId,
    description: t.description,
    meta: t.meta,
  };
}
