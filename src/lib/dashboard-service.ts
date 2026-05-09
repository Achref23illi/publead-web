import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  Collections,
  PARTNER_REVENUE_DEFAULT_CPM_CENTS,
  PARTNER_REVENUE_DEFAULT_SPRAY_CENTS,
  type AdImpressionDailyDoc,
  type CampaignDoc,
  type CompanyDoc,
  type DriverDoc,
  type InvoiceDoc,
  type PartnerDoc,
  type PartnerRevenueConfigDoc,
  type RevenueDailyDoc,
  type TerminalDoc,
} from "./schemas";
import { getFinanceKpis } from "./finance-kpi-service";
import type {
  AdminDashboardDTO,
  AdminKpiCounts,
  CityCountDTO,
  DashboardCampaignRowDTO,
  DeltaPct,
  FleetHealthDTO,
  ValidationQueueItemDTO,
} from "./dashboard-serializer";

const CITY_TOP_N = 8;
const QUEUE_LIMIT = 5;
const RECENT_CAMPAIGNS_LIMIT = 6;
const FLEET_TOP_TERMINALS = 3;
const TERMINAL_ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // mirrors heartbeat threshold

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - 1);
}

function previousMonth(d: Date): { start: Date; end: Date } {
  const ps = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
  const pe = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - 1);
  return { start: ps, end: pe };
}

function pctDelta(current: number, baseline: number): DeltaPct {
  if (baseline === 0) {
    if (current === 0) return 0;
    return null; // undefined growth from zero
  }
  return Math.round(((current - baseline) / baseline) * 100);
}

function isoDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getPartnerRates(): Promise<{
  sprayCents: number;
  cpmCents: number;
}> {
  const cfg = (await db
    .collection(Collections.appConfig)
    .findOne({ key: "partner_revenue" })) as PartnerRevenueConfigDoc | null;
  return {
    sprayCents: cfg?.sprayRateCents ?? PARTNER_REVENUE_DEFAULT_SPRAY_CENTS,
    cpmCents: cfg?.cpmCents ?? PARTNER_REVENUE_DEFAULT_CPM_CENTS,
  };
}

export async function getAdminDashboard(
  now: Date = new Date(),
): Promise<AdminDashboardDTO> {
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prev = previousMonth(now);
  const monthStartStr = isoDateStr(monthStart);
  const monthEndStr = isoDateStr(monthEnd);

  const [
    finance,
    drivers,
    companies,
    partners,
    campaigns,
    terminals,
    pendingDriversThisMonth,
    pendingCompaniesThisMonth,
    activeCampaignsPrev,
    paidPrevMonth,
    revenueDailyMonth,
    impressionsDailyMonth,
    rates,
  ] = await Promise.all([
    getFinanceKpis(now),
    db
      .collection(Collections.drivers)
      .find({})
      .project({ status: 1, city: 1, joinedAt: 1, firstName: 1, lastName: 1 })
      .toArray() as Promise<
      Pick<DriverDoc, "_id" | "status" | "city" | "joinedAt" | "firstName" | "lastName">[]
    >,
    db
      .collection(Collections.companies)
      .find({})
      .project({ status: 1, companyName: 1, createdAt: 1 })
      .toArray() as Promise<
      Pick<CompanyDoc, "_id" | "status" | "companyName" | "createdAt">[]
    >,
    db
      .collection(Collections.partners)
      .find({})
      .project({ status: 1, businessName: 1, createdAt: 1 })
      .toArray() as Promise<
      Pick<PartnerDoc, "_id" | "status" | "businessName" | "createdAt">[]
    >,
    db
      .collection(Collections.campaigns)
      .find({})
      .toArray() as Promise<CampaignDoc[]>,
    db
      .collection(Collections.terminals)
      .find({})
      .toArray() as Promise<TerminalDoc[]>,
    // Driver baselines: pending == registered but not yet validated *as of*
    // last day of previous month (used for delta on validated count).
    db
      .collection(Collections.drivers)
      .countDocuments({
        status: "validated",
        joinedAt: { $lte: prev.end },
      }),
    db
      .collection(Collections.companies)
      .countDocuments({
        status: "validated",
        createdAt: { $lte: prev.end },
      }),
    db
      .collection(Collections.campaigns)
      .countDocuments({
        startDate: { $lte: prev.end },
        endDate: { $gte: prev.start },
      }),
    db
      .collection(Collections.invoices)
      .find({
        status: "payee",
        paidAt: { $gte: prev.start, $lte: prev.end },
      })
      .toArray() as Promise<InvoiceDoc[]>,
    db
      .collection(Collections.revenueDaily)
      .find({ date: { $gte: monthStartStr, $lte: monthEndStr } })
      .toArray() as Promise<RevenueDailyDoc[]>,
    db
      .collection(Collections.adImpressionsDaily)
      .find({ date: { $gte: monthStartStr, $lte: monthEndStr } })
      .toArray() as Promise<AdImpressionDailyDoc[]>,
    getPartnerRates(),
  ]);

  // Counts ----------------------------------------------------------------

  const driversValidated = drivers.filter((d) => d.status === "validated").length;
  const driversPending = drivers.filter((d) => d.status === "pending").length;
  const companiesValidated = companies.filter((c) => c.status === "validated").length;
  const companiesPending = companies.filter((c) => c.status === "pending").length;
  const partnersValidated = partners.filter((p) => p.status === "validated").length;
  const partnersPending = partners.filter((p) => p.status === "pending").length;

  const campaignsActive = campaigns.filter(
    (c) => c.status === "active" || c.status === "upcoming",
  ).length;
  const campaignsCompletedThisMonth = campaigns.filter(
    (c) =>
      c.status === "completed" &&
      c.endDate >= monthStart &&
      c.endDate <= monthEnd,
  ).length;

  const counts: AdminKpiCounts = {
    driversValidated,
    driversPending,
    driversValidatedDelta: pctDelta(driversValidated, pendingDriversThisMonth),
    companiesValidated,
    companiesPending,
    companiesValidatedDelta: pctDelta(
      companiesValidated,
      pendingCompaniesThisMonth,
    ),
    partnersValidated,
    partnersPending,
    campaignsActive,
    campaignsCompletedThisMonth,
    campaignsActiveDelta: pctDelta(campaignsActive, activeCampaignsPrev),
    validationQueueTotal: driversPending + companiesPending + partnersPending,
    validationQueueByKind: {
      driver: driversPending,
      company: companiesPending,
      partner: partnersPending,
    },
  };

  // Fleet -----------------------------------------------------------------

  let online = 0;
  let offline = 0;
  let inMaintenance = 0;
  let spraysToday = 0;
  for (const t of terminals) {
    spraysToday += t.spraysToday ?? 0;
    if (t.lastKnownStatus === "maintenance") {
      inMaintenance++;
    } else if (
      !t.decommissionedAt &&
      t.lastHeartbeatAt &&
      now.getTime() - t.lastHeartbeatAt.getTime() < TERMINAL_ONLINE_THRESHOLD_MS
    ) {
      online++;
    } else {
      offline++;
    }
  }

  const sprayByTerminal = new Map<string, number>();
  for (const r of revenueDailyMonth) {
    sprayByTerminal.set(
      r.terminalId,
      (sprayByTerminal.get(r.terminalId) ?? 0) + r.spraysCount,
    );
  }
  const impressionsByTerminal = new Map<string, number>();
  for (const i of impressionsDailyMonth) {
    impressionsByTerminal.set(
      i.terminalId,
      (impressionsByTerminal.get(i.terminalId) ?? 0) + i.impressions,
    );
  }
  const fleetRevenue = terminals.map((t) => {
    const tid = t._id!.toString();
    const sprays = sprayByTerminal.get(tid) ?? 0;
    const impressions = impressionsByTerminal.get(tid) ?? 0;
    const cents =
      sprays * rates.sprayCents +
      Math.round((impressions / 1000) * rates.cpmCents);
    return { tid, code: t.code, name: t.name, cents };
  });
  const monthlyRevenueCents = fleetRevenue.reduce((a, r) => a + r.cents, 0);

  // Previous month fleet revenue (for delta) — small extra query block.
  const prevMonthStartStr = isoDateStr(prev.start);
  const prevMonthEndStr = isoDateStr(prev.end);
  const [revPrev, impPrev] = await Promise.all([
    db
      .collection(Collections.revenueDaily)
      .find({ date: { $gte: prevMonthStartStr, $lte: prevMonthEndStr } })
      .project({ terminalId: 1, spraysCount: 1 })
      .toArray() as Promise<Pick<RevenueDailyDoc, "terminalId" | "spraysCount">[]>,
    db
      .collection(Collections.adImpressionsDaily)
      .find({ date: { $gte: prevMonthStartStr, $lte: prevMonthEndStr } })
      .project({ terminalId: 1, impressions: 1 })
      .toArray() as Promise<
      Pick<AdImpressionDailyDoc, "terminalId" | "impressions">[]
    >,
  ]);
  const prevFleetCents =
    revPrev.reduce((a, r) => a + r.spraysCount * rates.sprayCents, 0) +
    Math.round(
      (impPrev.reduce((a, i) => a + i.impressions, 0) / 1000) * rates.cpmCents,
    );
  const monthlyRevenueDelta = pctDelta(monthlyRevenueCents, prevFleetCents);

  const sortedFleet = fleetRevenue
    .slice()
    .sort((a, b) => b.cents - a.cents)
    .slice(0, FLEET_TOP_TERMINALS);
  const topMax = sortedFleet[0]?.cents ?? 0;
  const fleet: FleetHealthDTO = {
    installed: terminals.length,
    online,
    offline,
    inMaintenance,
    spraysToday,
    monthlyRevenueCents,
    monthlyRevenueDelta,
    topTerminals: sortedFleet.map((t) => ({
      terminalId: t.tid,
      code: t.code,
      name: t.name,
      revenueCents: t.cents,
      pct: topMax > 0 ? Math.round((t.cents / topMax) * 100) : 0,
    })),
  };

  // Cities ---------------------------------------------------------------

  const cityCounts = new Map<string, number>();
  for (const c of campaigns) {
    if (c.status === "draft") continue;
    cityCounts.set(c.city, (cityCounts.get(c.city) ?? 0) + 1);
  }
  const cities: CityCountDTO[] = [...cityCounts.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, CITY_TOP_N);

  // Validation queue ----------------------------------------------------

  const queue: ValidationQueueItemDTO[] = [];
  drivers
    .filter((d) => d.status === "pending")
    .slice(0, QUEUE_LIMIT)
    .forEach((d) => {
      queue.push({
        id: d._id!.toString(),
        kind: "driver",
        name: `${d.firstName} ${d.lastName}`,
        since: d.joinedAt.toISOString(),
      });
    });
  companies
    .filter((c) => c.status === "pending")
    .slice(0, QUEUE_LIMIT)
    .forEach((c) => {
      queue.push({
        id: c._id!.toString(),
        kind: "company",
        name: c.companyName,
        since: c.createdAt.toISOString(),
      });
    });
  partners
    .filter((p) => p.status === "pending")
    .slice(0, QUEUE_LIMIT)
    .forEach((p) => {
      queue.push({
        id: p._id!.toString(),
        kind: "partner",
        name: p.businessName,
        since: p.createdAt.toISOString(),
      });
    });
  queue.sort((a, b) => (a.since < b.since ? 1 : -1));
  const validationQueue = queue.slice(0, QUEUE_LIMIT);

  // Recent campaigns ----------------------------------------------------

  const recent = campaigns
    .filter((c) => c.status !== "draft")
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, RECENT_CAMPAIGNS_LIMIT);
  const recentCompanyIds = Array.from(
    new Set(
      recent
        .map((c) => c.companyId)
        .filter((id) => ObjectId.isValid(id)),
    ),
  );
  const recentCompanies = recentCompanyIds.length
    ? ((await db
        .collection(Collections.companies)
        .find({ _id: { $in: recentCompanyIds.map((id) => new ObjectId(id)) } })
        .project({ companyName: 1, brandColor: 1 })
        .toArray()) as Pick<
        CompanyDoc,
        "_id" | "companyName" | "brandColor"
      >[])
    : [];
  const companyById = new Map(
    recentCompanies.map((c) => [c._id!.toString(), c]),
  );
  const recentCampaigns: DashboardCampaignRowDTO[] = recent.map((c) => {
    const cmp = companyById.get(c.companyId);
    return {
      id: c._id!.toString(),
      brand: c.brand,
      company: cmp?.companyName ?? "—",
      campaignType: c.campaignType ?? "flocage",
      city: c.city,
      status: c.status,
      progress: c.progress,
      driversAssigned: c.driversAssigned,
      driversNeeded: c.driversNeeded,
      budgetCents: c.budgetCents ?? 0,
      brandColor: cmp?.brandColor,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
    };
  });

  // MRR delta
  const prevCollectedCents = paidPrevMonth.reduce((a, b) => a + b.totalCents, 0);
  const mrrDelta = pctDelta(finance.mrrCents, prevCollectedCents);

  return {
    finance,
    mrrDelta,
    counts,
    fleet,
    cities,
    validationQueue,
    recentCampaigns,
    generatedAt: now.toISOString(),
  };
}
