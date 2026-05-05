import { db } from "./db";
import { Collections, type CampaignDoc } from "./schemas";
import { ObjectId } from "mongodb";

export type StatsPeriod = "week" | "month" | "3mo" | "year";

const PERIOD_DAYS: Record<StatsPeriod, number> = {
  week: 7,
  month: 30,
  "3mo": 90,
  year: 365,
};

export type LifetimeStats = {
  campaignsDone: number;
  totalKm: number;
  totalEarningsCents: number;
};

export type PeriodStats = {
  period: StatsPeriod;
  windowStart: string;
  windowEnd: string;
  campaignsDone: number;
  earningsCents: number;
  km: number;
  activeCampaigns: number;
  growthPercent: number; // vs same-length immediately-prior period
  monthlyEarningsCents: number; // 30-day rolling, regardless of selected period
  monthlyBreakdown: {
    month: string;
    amountCents: number;
    campaigns: number;
  }[];
};

// Per-driver km split: campaign km credited evenly across assigned drivers.
// Reward also flat per-completion. Rough but consistent until per-driver
// tracking lands (D5).
function shareForDriver(c: CampaignDoc): {
  km: number;
  earningsCents: number;
} {
  const split = Math.max(1, c.driversAssigned);
  return {
    km: Math.round((c.kmDone || c.kmTotal) / split),
    earningsCents: c.rewardCents,
  };
}

async function findCampaignsForDriver(
  driverId: string,
  filter: Record<string, unknown> = {},
): Promise<CampaignDoc[]> {
  return (await db
    .collection(Collections.campaigns)
    .find({ assignedDriverIds: driverId, ...filter })
    .toArray()) as CampaignDoc[];
}

export async function recomputeLifetimeStats(
  driverId: string,
): Promise<LifetimeStats> {
  const completed = await findCampaignsForDriver(driverId, {
    status: "completed",
  });

  let campaignsDone = 0;
  let totalKm = 0;
  let totalEarningsCents = 0;

  for (const c of completed) {
    const share = shareForDriver(c);
    campaignsDone += 1;
    totalKm += share.km;
    totalEarningsCents += share.earningsCents;
  }

  const lifetime: LifetimeStats = {
    campaignsDone,
    totalKm,
    totalEarningsCents,
  };

  await db.collection(Collections.drivers).updateOne(
    { _id: new ObjectId(driverId) },
    {
      $set: {
        campaignsDone: lifetime.campaignsDone,
        totalKm: lifetime.totalKm,
        totalEarningsCents: lifetime.totalEarningsCents,
      },
    },
  );

  return lifetime;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthKey(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export async function computePeriodStats(
  driverId: string,
  period: StatsPeriod,
  now: Date = new Date(),
): Promise<PeriodStats> {
  const days = PERIOD_DAYS[period];
  const windowEnd = now;
  const windowStart = new Date(windowEnd.getTime() - days * 86400000);
  const priorStart = new Date(windowStart.getTime() - days * 86400000);

  const all = await findCampaignsForDriver(driverId);

  let activeCampaigns = 0;
  let currentEarningsCents = 0;
  let currentKm = 0;
  let currentDone = 0;
  let priorEarningsCents = 0;
  let monthlyEarningsCents = 0;

  // Monthly breakdown for last 6 months.
  const monthlyMap = new Map<
    string,
    { amountCents: number; campaigns: number }
  >();
  const sixMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 5,
    1,
  );

  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  for (const c of all) {
    if (c.status === "active") activeCampaigns += 1;

    if (c.status === "completed") {
      const share = shareForDriver(c);
      const completedAt = c.endDate;

      if (completedAt >= windowStart && completedAt <= windowEnd) {
        currentDone += 1;
        currentEarningsCents += share.earningsCents;
        currentKm += share.km;
      }
      if (completedAt >= priorStart && completedAt < windowStart) {
        priorEarningsCents += share.earningsCents;
      }
      if (completedAt >= monthAgo && completedAt <= now) {
        monthlyEarningsCents += share.earningsCents;
      }
      if (completedAt >= sixMonthsAgo && completedAt <= now) {
        const key = monthKey(startOfMonth(completedAt));
        const prev = monthlyMap.get(key) ?? {
          amountCents: 0,
          campaigns: 0,
        };
        monthlyMap.set(key, {
          amountCents: prev.amountCents + share.earningsCents,
          campaigns: prev.campaigns + 1,
        });
      }
    }
  }

  const growthPercent =
    priorEarningsCents > 0
      ? Math.round(
          ((currentEarningsCents - priorEarningsCents) /
            priorEarningsCents) *
            100,
        )
      : currentEarningsCents > 0
        ? 100
        : 0;

  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .map(([month, v]) => ({
      month,
      amountCents: v.amountCents,
      campaigns: v.campaigns,
    }))
    .reverse(); // most recent first

  return {
    period,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    campaignsDone: currentDone,
    earningsCents: currentEarningsCents,
    km: currentKm,
    activeCampaigns,
    growthPercent,
    monthlyEarningsCents,
    monthlyBreakdown,
  };
}
