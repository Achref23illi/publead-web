import type {
  PartnerPayoutDoc,
  RevenueMonthlyDoc,
  RevenueMonthlyTerminalLine,
} from "./schemas";
import type { DailyRevenueRow, MonthlySummary } from "./partner-revenue-service";

export type DailyRevenueDTO = DailyRevenueRow;

export type MonthlySummaryDTO = {
  month: string;
  sealed: boolean;
  spraysCount: number;
  impressions: number;
  sprayRateCents: number;
  cpmCents: number;
  sprayCents: number;
  adCents: number;
  totalCents: number;
  perTerminal: RevenueMonthlyTerminalLine[];
};

export type PartnerPayoutDTO = {
  id: string;
  partnerId: string;
  month: string;
  totalCents: number;
  status: PartnerPayoutDoc["status"];
  scheduledFor: string;
  paidAt?: string;
  payoutReference?: string;
  failureReason?: string;
  createdAt: string;
};

export type RevenueMonthlyDTO = {
  id: string;
  partnerId: string;
  month: string;
  totalSprays: number;
  totalImpressions: number;
  sprayRateCents: number;
  cpmCents: number;
  sprayCents: number;
  adCents: number;
  totalCents: number;
  perTerminal: RevenueMonthlyTerminalLine[];
  sealedAt: string;
};

export function serializeMonthlySummary(
  s: MonthlySummary,
): MonthlySummaryDTO {
  return s;
}

export function serializePayout(p: PartnerPayoutDoc): PartnerPayoutDTO {
  return {
    id: p._id!.toString(),
    partnerId: p.partnerId,
    month: p.month,
    totalCents: p.totalCents,
    status: p.status,
    scheduledFor: p.scheduledFor.toISOString(),
    paidAt: p.paidAt?.toISOString(),
    payoutReference: p.payoutReference,
    failureReason: p.failureReason,
    createdAt: p.createdAt.toISOString(),
  };
}

export function serializeMonthly(m: RevenueMonthlyDoc): RevenueMonthlyDTO {
  return {
    id: m._id!.toString(),
    partnerId: m.partnerId,
    month: m.month,
    totalSprays: m.totalSprays,
    totalImpressions: m.totalImpressions,
    sprayRateCents: m.sprayRateCents,
    cpmCents: m.cpmCents,
    sprayCents: m.sprayCents,
    adCents: m.adCents,
    totalCents: m.totalCents,
    perTerminal: m.perTerminal,
    sealedAt: m.sealedAt.toISOString(),
  };
}
