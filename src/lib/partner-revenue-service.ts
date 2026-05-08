import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  Collections,
  PARTNER_PAYOUT_SCHEDULE_DAY,
  PARTNER_REVENUE_DEFAULT_CPM_CENTS,
  PARTNER_REVENUE_DEFAULT_SPRAY_CENTS,
  type AdImpressionDailyDoc,
  type PartnerPayoutDoc,
  type PartnerRevenueConfigDoc,
  type RevenueDailyDoc,
  type RevenueMonthlyDoc,
  type RevenueMonthlyTerminalLine,
  type TerminalDoc,
} from "./schemas";
import { isoDate } from "./ad-schedule-service";

export class PartnerRevenueServiceError extends Error {
  constructor(
    public code:
      | "not_found"
      | "forbidden"
      | "invalid_input"
      | "already_sealed"
      | "month_in_progress"
      | "payout_finalized",
    message?: string,
  ) {
    super(message ?? code);
  }
}

// --- Config -------------------------------------------------------------

let configCache: { sprayRateCents: number; cpmCents: number } | null = null;

export async function getPartnerRevenueConfig(): Promise<{
  sprayRateCents: number;
  cpmCents: number;
}> {
  if (configCache) return configCache;
  const doc = (await db
    .collection(Collections.appConfig)
    .findOne({ key: "partner_revenue" })) as PartnerRevenueConfigDoc | null;
  configCache = doc
    ? { sprayRateCents: doc.sprayRateCents, cpmCents: doc.cpmCents }
    : {
        sprayRateCents: PARTNER_REVENUE_DEFAULT_SPRAY_CENTS,
        cpmCents: PARTNER_REVENUE_DEFAULT_CPM_CENTS,
      };
  return configCache;
}

export function clearPartnerRevenueConfigCache() {
  configCache = null;
}

// --- Daily counter ------------------------------------------------------

/**
 * Increment today's spray counter for the given terminal. Called from the
 * heartbeat handler after computing a non-zero delta.
 */
export async function incrementDailySprays(
  partnerId: string,
  terminalId: string,
  deltaSprays: number,
  now: Date = new Date(),
): Promise<void> {
  if (deltaSprays <= 0) return;
  const date = isoDate(now);
  await db.collection(Collections.revenueDaily).updateOne(
    { partnerId, terminalId, date },
    {
      $inc: { spraysCount: deltaSprays },
      $set: { updatedAt: now },
      $setOnInsert: { partnerId, terminalId, date },
    },
    { upsert: true },
  );
}

// --- Read helpers -------------------------------------------------------

export type DailyRevenueRow = {
  date: string; // YYYY-MM-DD
  spraysCount: number;
  impressions: number;
  sprayCents: number;
  adCents: number;
  totalCents: number;
};

export async function getRevenueRange(
  partnerId: string,
  startDate: Date,
  endDate: Date,
): Promise<DailyRevenueRow[]> {
  const startStr = isoDate(startDate);
  const endStr = isoDate(endDate);
  const { sprayRateCents, cpmCents } = await getPartnerRevenueConfig();

  // Get partner's terminals so we can scope ad impressions.
  const terminals = (await db
    .collection(Collections.terminals)
    .find({ partnerId })
    .toArray()) as TerminalDoc[];
  const terminalIds = terminals.map((t) => t._id!.toString());

  const [sprayRows, impressionRows] = await Promise.all([
    db
      .collection(Collections.revenueDaily)
      .find({ partnerId, date: { $gte: startStr, $lte: endStr } })
      .toArray() as Promise<RevenueDailyDoc[]>,
    terminalIds.length
      ? (db
          .collection(Collections.adImpressionsDaily)
          .find({
            terminalId: { $in: terminalIds },
            date: { $gte: startStr, $lte: endStr },
          })
          .toArray() as Promise<AdImpressionDailyDoc[]>)
      : Promise.resolve([]),
  ]);

  // Build day-keyed accumulator.
  const byDate = new Map<
    string,
    { spraysCount: number; impressions: number }
  >();
  for (const r of sprayRows) {
    const slot = byDate.get(r.date) ?? { spraysCount: 0, impressions: 0 };
    slot.spraysCount += r.spraysCount;
    byDate.set(r.date, slot);
  }
  for (const r of impressionRows) {
    const slot = byDate.get(r.date) ?? { spraysCount: 0, impressions: 0 };
    slot.impressions += r.impressions;
    byDate.set(r.date, slot);
  }

  // Generate full date range with zeros for missing days.
  const out: DailyRevenueRow[] = [];
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);
  const last = new Date(endDate);
  last.setUTCHours(0, 0, 0, 0);
  while (cursor.getTime() <= last.getTime()) {
    const d = isoDate(cursor);
    const slot = byDate.get(d) ?? { spraysCount: 0, impressions: 0 };
    const sprayCents = slot.spraysCount * sprayRateCents;
    const adCents = Math.round((slot.impressions * cpmCents) / 1000);
    out.push({
      date: d,
      spraysCount: slot.spraysCount,
      impressions: slot.impressions,
      sprayCents,
      adCents,
      totalCents: sprayCents + adCents,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export type MonthlySummary = {
  month: string; // "YYYY-MM"
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

/**
 * Returns a sealed monthly snapshot if the month has been closed, otherwise
 * computes the current numbers live using stored counters and current rates.
 */
export async function getMonthlySummary(
  partnerId: string,
  year: number,
  monthZeroIndexed: number,
): Promise<MonthlySummary> {
  const monthStr = formatMonth(year, monthZeroIndexed);

  // Sealed?
  const sealed = (await db
    .collection(Collections.revenueMonthly)
    .findOne({ partnerId, month: monthStr })) as RevenueMonthlyDoc | null;
  if (sealed) {
    return {
      month: sealed.month,
      sealed: true,
      spraysCount: sealed.totalSprays,
      impressions: sealed.totalImpressions,
      sprayRateCents: sealed.sprayRateCents,
      cpmCents: sealed.cpmCents,
      sprayCents: sealed.sprayCents,
      adCents: sealed.adCents,
      totalCents: sealed.totalCents,
      perTerminal: sealed.perTerminal,
    };
  }

  // Live compute.
  const start = new Date(Date.UTC(year, monthZeroIndexed, 1));
  const end = new Date(Date.UTC(year, monthZeroIndexed + 1, 0)); // last day
  const perTerminal = await computePerTerminalForMonth(partnerId, start, end);
  const { sprayRateCents, cpmCents } = await getPartnerRevenueConfig();

  const totalSprays = perTerminal.reduce((s, p) => s + p.spraysCount, 0);
  const totalImpressions = perTerminal.reduce((s, p) => s + p.impressions, 0);
  const sprayCents = perTerminal.reduce((s, p) => s + p.sprayCents, 0);
  const adCents = perTerminal.reduce((s, p) => s + p.adCents, 0);

  return {
    month: monthStr,
    sealed: false,
    spraysCount: totalSprays,
    impressions: totalImpressions,
    sprayRateCents,
    cpmCents,
    sprayCents,
    adCents,
    totalCents: sprayCents + adCents,
    perTerminal,
  };
}

async function computePerTerminalForMonth(
  partnerId: string,
  start: Date,
  end: Date,
): Promise<RevenueMonthlyTerminalLine[]> {
  const startStr = isoDate(start);
  const endStr = isoDate(end);
  const { sprayRateCents, cpmCents } = await getPartnerRevenueConfig();

  const terminals = (await db
    .collection(Collections.terminals)
    .find({ partnerId })
    .toArray()) as TerminalDoc[];

  if (!terminals.length) return [];
  const terminalMap = new Map(
    terminals.map((t) => [t._id!.toString(), t] as const),
  );

  const [sprayRows, impressionRows] = await Promise.all([
    db
      .collection(Collections.revenueDaily)
      .find({ partnerId, date: { $gte: startStr, $lte: endStr } })
      .toArray() as Promise<RevenueDailyDoc[]>,
    db
      .collection(Collections.adImpressionsDaily)
      .find({
        terminalId: { $in: Array.from(terminalMap.keys()) },
        date: { $gte: startStr, $lte: endStr },
      })
      .toArray() as Promise<AdImpressionDailyDoc[]>,
  ]);

  const byTerm = new Map<
    string,
    { spraysCount: number; impressions: number }
  >();
  for (const r of sprayRows) {
    const slot = byTerm.get(r.terminalId) ?? { spraysCount: 0, impressions: 0 };
    slot.spraysCount += r.spraysCount;
    byTerm.set(r.terminalId, slot);
  }
  for (const r of impressionRows) {
    const slot = byTerm.get(r.terminalId) ?? { spraysCount: 0, impressions: 0 };
    slot.impressions += r.impressions;
    byTerm.set(r.terminalId, slot);
  }

  const lines: RevenueMonthlyTerminalLine[] = [];
  for (const [terminalId, t] of terminalMap) {
    const slot = byTerm.get(terminalId) ?? {
      spraysCount: 0,
      impressions: 0,
    };
    const sprayCents = slot.spraysCount * sprayRateCents;
    const adCents = Math.round((slot.impressions * cpmCents) / 1000);
    if (slot.spraysCount === 0 && slot.impressions === 0) continue;
    lines.push({
      terminalId,
      terminalCode: t.code,
      terminalName: t.name,
      spraysCount: slot.spraysCount,
      impressions: slot.impressions,
      sprayCents,
      adCents,
      totalCents: sprayCents + adCents,
    });
  }
  return lines;
}

// --- Sealing + payouts --------------------------------------------------

export async function sealMonth(
  partnerId: string,
  year: number,
  monthZeroIndexed: number,
  now: Date = new Date(),
): Promise<{ monthly: RevenueMonthlyDoc; payout: PartnerPayoutDoc }> {
  const monthStr = formatMonth(year, monthZeroIndexed);

  const existingMonthly = (await db
    .collection(Collections.revenueMonthly)
    .findOne({ partnerId, month: monthStr })) as RevenueMonthlyDoc | null;
  const existingPayout = (await db
    .collection(Collections.partnerPayouts)
    .findOne({ partnerId, month: monthStr })) as PartnerPayoutDoc | null;
  if (existingMonthly && existingPayout) {
    return { monthly: existingMonthly, payout: existingPayout };
  }

  // Refuse to seal a month that hasn't ended (unless it's the very current
  // month — admin should not normally seal it).
  const monthEnd = new Date(Date.UTC(year, monthZeroIndexed + 1, 0, 23, 59, 59));
  if (monthEnd.getTime() > now.getTime()) {
    throw new PartnerRevenueServiceError("month_in_progress");
  }

  const summary = await getMonthlySummary(partnerId, year, monthZeroIndexed);
  const monthly: RevenueMonthlyDoc =
    existingMonthly ?? {
      partnerId,
      month: monthStr,
      totalSprays: summary.spraysCount,
      totalImpressions: summary.impressions,
      sprayRateCents: summary.sprayRateCents,
      cpmCents: summary.cpmCents,
      sprayCents: summary.sprayCents,
      adCents: summary.adCents,
      totalCents: summary.totalCents,
      perTerminal: summary.perTerminal,
      sealedAt: now,
    };
  if (!existingMonthly) {
    const ins = await db
      .collection(Collections.revenueMonthly)
      .insertOne(monthly);
    monthly._id = ins.insertedId;
  }

  // Auto-create payout row if missing.
  let payout = existingPayout;
  if (!payout) {
    const scheduledFor = new Date(
      Date.UTC(year, monthZeroIndexed + 1, PARTNER_PAYOUT_SCHEDULE_DAY),
    );
    const newDoc: PartnerPayoutDoc = {
      partnerId,
      month: monthStr,
      totalCents: monthly.totalCents,
      status: "scheduled",
      scheduledFor,
      createdAt: now,
    };
    const ins = await db
      .collection(Collections.partnerPayouts)
      .insertOne(newDoc);
    newDoc._id = ins.insertedId;
    payout = newDoc;
  }

  return { monthly, payout };
}

export async function markPayoutPaid(
  payoutId: string,
  paidBy: string,
  payoutReference?: string,
  now: Date = new Date(),
): Promise<PartnerPayoutDoc> {
  const oid = new ObjectId(payoutId);
  const existing = (await db
    .collection(Collections.partnerPayouts)
    .findOne({ _id: oid })) as PartnerPayoutDoc | null;
  if (!existing) throw new PartnerRevenueServiceError("not_found");
  if (existing.status === "paid") {
    throw new PartnerRevenueServiceError("payout_finalized");
  }

  await db.collection(Collections.partnerPayouts).updateOne(
    { _id: oid },
    {
      $set: {
        status: "paid",
        paidAt: now,
        paidBy,
        payoutReference: payoutReference?.trim(),
      },
    },
  );
  return {
    ...existing,
    status: "paid",
    paidAt: now,
    paidBy,
    payoutReference: payoutReference?.trim(),
  };
}

// --- Helpers ------------------------------------------------------------

export function formatMonth(year: number, monthZeroIndexed: number): string {
  const m = monthZeroIndexed + 1;
  return `${year}-${m < 10 ? `0${m}` : m}`;
}

export function parseMonth(month: string): { year: number; month0: number } {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) {
    throw new PartnerRevenueServiceError("invalid_input", "bad month");
  }
  return { year: y, month0: m - 1 };
}
