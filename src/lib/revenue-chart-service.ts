import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  Collections,
  type CampaignDoc,
  type InvoiceDoc,
} from "./schemas";
import type {
  RangeKey,
  RevenueChartDTO,
  RevenueChartPoint,
} from "./dashboard-serializer";

const RANGE_DAYS: Record<RangeKey, number> = {
  "30": 30,
  "90": 90,
  "365": 365,
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

function endOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
  );
}

// Splits an invoice's totalCents across line items by inferring per-line
// campaign linkage. We don't have per-line campaignId, so when a single
// invoice line maps to a campaign we attribute the whole invoice. Otherwise
// the invoice contributes to the same bucket as its (single) campaignId.
async function buildPaidPoints(
  start: Date,
  end: Date,
  campaignTypeMap: Map<string, "flocage" | "borne">,
): Promise<Map<string, { flocage: number; borne: number }>> {
  const invoices = (await db
    .collection(Collections.invoices)
    .find({
      status: "payee",
      paidAt: { $gte: start, $lte: end },
    })
    .toArray()) as InvoiceDoc[];

  const out = new Map<string, { flocage: number; borne: number }>();
  for (const inv of invoices) {
    if (!inv.paidAt) continue;
    const day = toIsoDate(inv.paidAt);
    if (!out.has(day)) out.set(day, { flocage: 0, borne: 0 });
    const bucket = out.get(day)!;
    const type = inv.campaignId
      ? campaignTypeMap.get(inv.campaignId)
      : undefined;
    if (type === "borne") bucket.borne += inv.totalCents;
    else bucket.flocage += inv.totalCents; // default to flocage when unknown
  }
  return out;
}

// For each campaign overlapping the projection window [from, to), distribute
// its budgetCents linearly across the campaign's [startDate, endDate] day
// span, then accumulate the per-day amounts that fall inside [from, to).
async function buildAccruedPoints(
  from: Date,
  to: Date,
): Promise<Map<string, { flocage: number; borne: number }>> {
  const out = new Map<string, { flocage: number; borne: number }>();
  if (from >= to) return out;

  const campaigns = (await db
    .collection(Collections.campaigns)
    .find({
      startDate: { $lt: to },
      endDate: { $gte: from },
    })
    .toArray()) as CampaignDoc[];

  for (const c of campaigns) {
    const cStart = startOfUtcDay(c.startDate);
    const cEnd = startOfUtcDay(c.endDate);
    const totalDays =
      Math.max(
        1,
        Math.round((cEnd.getTime() - cStart.getTime()) / 86_400_000) + 1,
      );
    const perDayCents = Math.round((c.budgetCents ?? 0) / totalDays);
    if (perDayCents <= 0) continue;
    const type: "flocage" | "borne" = c.campaignType ?? "flocage";

    // Iterate the intersection of [cStart, cEnd] with [from, to).
    const iterStart = cStart > from ? cStart : from;
    const iterEnd = cEnd < to ? cEnd : new Date(to.getTime() - 86_400_000);
    for (
      let t = iterStart.getTime();
      t <= iterEnd.getTime();
      t += 86_400_000
    ) {
      const day = toIsoDate(new Date(t));
      if (!out.has(day)) out.set(day, { flocage: 0, borne: 0 });
      const bucket = out.get(day)!;
      if (type === "borne") bucket.borne += perDayCents;
      else bucket.flocage += perDayCents;
    }
  }
  return out;
}

export async function getRevenueChart(
  range: RangeKey,
  now: Date = new Date(),
): Promise<RevenueChartDTO> {
  const days = RANGE_DAYS[range];
  const today = startOfUtcDay(now);
  const windowStart = new Date(today.getTime() - (days - 1) * 86_400_000);
  const windowEnd = endOfUtcDay(now);
  const projectionEnd = new Date(today.getTime() + 86_400_000); // exclusive

  // Build campaign-type map for invoice attribution. We grab the campaigns
  // that any invoice in window might reference.
  const invoiceCampaignIds = (await db
    .collection(Collections.invoices)
    .distinct("campaignId", {
      status: "payee",
      paidAt: { $gte: windowStart, $lte: windowEnd },
      campaignId: { $exists: true, $ne: null },
    })) as string[];
  const validIds = invoiceCampaignIds.filter((id) =>
    typeof id === "string" && ObjectId.isValid(id),
  );
  const campaignsForType = validIds.length
    ? ((await db
        .collection(Collections.campaigns)
        .find({ _id: { $in: validIds.map((id) => new ObjectId(id)) } })
        .project({ campaignType: 1 })
        .toArray()) as Pick<CampaignDoc, "_id" | "campaignType">[])
    : [];
  const typeMap = new Map<string, "flocage" | "borne">(
    campaignsForType.map((c) => [c._id!.toString(), c.campaignType ?? "flocage"]),
  );

  const [paidMap, accruedMap] = await Promise.all([
    // Paid history: from windowStart up to start of today (exclusive).
    buildPaidPoints(windowStart, new Date(today.getTime() - 1), typeMap),
    // Accrued projection: today only, not extending past today (keeps the
    // chart anchored to "now" without forecasting).
    buildAccruedPoints(today, projectionEnd),
  ]);

  const points: RevenueChartPoint[] = [];
  let totalFloc = 0;
  let totalBorne = 0;
  for (let i = 0; i < days; i++) {
    const day = toIsoDate(new Date(windowStart.getTime() + i * 86_400_000));
    const paid = paidMap.get(day);
    const accrued = accruedMap.get(day);
    const fc = (paid?.flocage ?? 0) + (accrued?.flocage ?? 0);
    const bc = (paid?.borne ?? 0) + (accrued?.borne ?? 0);
    totalFloc += fc;
    totalBorne += bc;
    points.push({ date: day, flocageCents: fc, borneCents: bc });
  }

  return {
    range,
    points,
    totals: { flocageCents: totalFloc, borneCents: totalBorne },
    paidCutoff: toIsoDate(today),
  };
}
