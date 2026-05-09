import { db } from "./db";
import {
  Collections,
  type AdImpressionDailyDoc,
  type CampaignDoc,
  type CampaignEventDoc,
  type InvoiceDoc,
} from "./schemas";
import type {
  AdvertiserActivityItemDTO,
  AdvertiserDashboardDTO,
  DeltaPct,
} from "./dashboard-serializer";

const WINDOW_DAYS = 30;
const ACTIVITY_LIMIT = 10;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - 1);
}

function pctDelta(current: number, baseline: number): DeltaPct {
  if (baseline === 0) {
    if (current === 0) return 0;
    return null;
  }
  return Math.round(((current - baseline) / baseline) * 100);
}

export async function getAdvertiserDashboard(
  companyId: string,
  now: Date = new Date(),
): Promise<AdvertiserDashboardDTO> {
  const today = startOfUtcDay(now);
  const windowStart = new Date(today.getTime() - (WINDOW_DAYS - 1) * 86_400_000);
  const prevWindowStart = new Date(
    windowStart.getTime() - WINDOW_DAYS * 86_400_000,
  );
  const prevWindowEnd = new Date(windowStart.getTime() - 1);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [campaigns, invoices] = await Promise.all([
    db
      .collection(Collections.campaigns)
      .find({ companyId })
      .toArray() as Promise<CampaignDoc[]>,
    db
      .collection(Collections.invoices)
      .find({ companyId })
      .toArray() as Promise<InvoiceDoc[]>,
  ]);

  const campaignIds = campaigns.map((c) => c._id!.toString());
  const campaignTitleById = new Map(
    campaigns.map((c) => [c._id!.toString(), c.title]),
  );

  const [impressions, prevImpressions, events] = await Promise.all([
    campaignIds.length
      ? (db
          .collection(Collections.adImpressionsDaily)
          .find({
            campaignId: { $in: campaignIds },
            date: {
              $gte: isoDate(windowStart),
              $lte: isoDate(today),
            },
          })
          .toArray() as Promise<AdImpressionDailyDoc[]>)
      : Promise.resolve([] as AdImpressionDailyDoc[]),
    campaignIds.length
      ? (db
          .collection(Collections.adImpressionsDaily)
          .find({
            campaignId: { $in: campaignIds },
            date: {
              $gte: isoDate(prevWindowStart),
              $lte: isoDate(prevWindowEnd),
            },
          })
          .toArray() as Promise<AdImpressionDailyDoc[]>)
      : Promise.resolve([] as AdImpressionDailyDoc[]),
    campaignIds.length
      ? (db
          .collection(Collections.campaignEvents)
          .find({ campaignId: { $in: campaignIds } })
          .sort({ at: -1 })
          .limit(ACTIVITY_LIMIT)
          .toArray() as Promise<CampaignEventDoc[]>)
      : Promise.resolve([] as CampaignEventDoc[]),
  ]);

  // Build sparkline keyed by day index 0..WINDOW_DAYS-1.
  const sparkline = new Array<number>(WINDOW_DAYS).fill(0);
  let totalImpressions = 0;
  for (const i of impressions) {
    const day = new Date(`${i.date}T00:00:00.000Z`);
    const idx = Math.floor(
      (day.getTime() - windowStart.getTime()) / 86_400_000,
    );
    if (idx >= 0 && idx < WINDOW_DAYS) {
      sparkline[idx] += i.impressions;
      totalImpressions += i.impressions;
    }
  }
  const prevTotal = prevImpressions.reduce((a, i) => a + i.impressions, 0);

  // Goal = sum of borne.targetImpressions across active+upcoming campaigns
  // whose date window touches the dashboard period.
  const goalImpressions = campaigns
    .filter(
      (c) =>
        (c.status === "active" || c.status === "upcoming") &&
        c.campaignType === "borne" &&
        c.borne?.targetImpressions,
    )
    .reduce((a, c) => a + (c.borne?.targetImpressions ?? 0), 0);
  const goalPct =
    goalImpressions > 0
      ? Math.round((totalImpressions / goalImpressions) * 100)
      : 0;

  const campaignsActive = campaigns.filter(
    (c) => c.status === "active" || c.status === "upcoming",
  ).length;

  // Billing: this month paid + open (envoyee, includes overdue subset).
  let paidThisMonthCents = 0;
  let pendingCents = 0;
  let pendingCount = 0;
  let overdueCents = 0;
  let overdueCount = 0;
  for (const inv of invoices) {
    if (
      inv.status === "payee" &&
      inv.paidAt &&
      inv.paidAt >= monthStart &&
      inv.paidAt <= monthEnd
    ) {
      paidThisMonthCents += inv.totalCents;
    }
    if (inv.status === "envoyee") {
      pendingCents += inv.totalCents;
      pendingCount++;
      if (inv.dueDate && inv.dueDate < now) {
        overdueCents += inv.totalCents;
        overdueCount++;
      }
    }
  }

  const recentActivity: AdvertiserActivityItemDTO[] = events.map((e) => ({
    id: e._id!.toString(),
    type: e.type,
    campaignId: e.campaignId,
    campaignTitle: campaignTitleById.get(e.campaignId),
    driverId: e.driverId,
    at: e.at.toISOString(),
  }));

  return {
    windowDays: WINDOW_DAYS,
    totalImpressions,
    goalImpressions,
    goalPct,
    impressionsDelta: pctDelta(totalImpressions, prevTotal),
    sparkline,
    campaignsActive,
    campaignsTotal: campaigns.length,
    billing: {
      paidThisMonthCents,
      pendingCents,
      pendingCount,
      overdueCents,
      overdueCount,
    },
    recentActivity,
    generatedAt: now.toISOString(),
  };
}

export type { AdvertiserDashboardDTO };
