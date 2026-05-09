import type { FinanceKpiDTO } from "./finance-kpi-service";

export type RangeKey = "30" | "90" | "365";
export const RANGE_KEYS: RangeKey[] = ["30", "90", "365"];

export type DeltaPct = number | null; // null when no baseline

export type AdminKpiCounts = {
  // Drivers
  driversValidated: number;
  driversPending: number;
  driversValidatedDelta: DeltaPct;
  // Companies
  companiesValidated: number;
  companiesPending: number;
  companiesValidatedDelta: DeltaPct;
  // Partners
  partnersValidated: number;
  partnersPending: number;
  // Campaigns
  campaignsActive: number;
  campaignsCompletedThisMonth: number;
  campaignsActiveDelta: DeltaPct;
  // Pending validations summary
  validationQueueTotal: number;
  validationQueueByKind: { driver: number; company: number; partner: number };
};

export type FleetHealthDTO = {
  installed: number;
  online: number;
  offline: number;
  inMaintenance: number;
  spraysToday: number;
  monthlyRevenueCents: number;
  monthlyRevenueDelta: DeltaPct;
  topTerminals: {
    terminalId: string;
    code: string;
    name: string;
    revenueCents: number;
    pct: number; // 0..100, relative to top
  }[];
};

export type CityCountDTO = {
  city: string;
  count: number;
};

export type ValidationQueueItemDTO = {
  id: string; // entity id
  kind: "driver" | "company" | "partner";
  name: string;
  since: string; // ISO submission date
};

export type DashboardCampaignRowDTO = {
  id: string;
  brand: string;
  company: string;
  campaignType: "flocage" | "borne";
  city: string;
  status: "draft" | "upcoming" | "active" | "completed";
  progress: number;
  driversAssigned: number;
  driversNeeded: number;
  budgetCents: number;
  brandColor?: string;
  startDate: string;
  endDate: string;
};

export type AdminDashboardDTO = {
  finance: FinanceKpiDTO;
  // MRR delta vs previous month, computed alongside the other deltas.
  mrrDelta: DeltaPct;
  counts: AdminKpiCounts;
  fleet: FleetHealthDTO;
  cities: CityCountDTO[]; // top 8 by count desc
  validationQueue: ValidationQueueItemDTO[]; // most recent 5
  recentCampaigns: DashboardCampaignRowDTO[]; // most recent 6 (any status)
  generatedAt: string;
};

// --- Revenue chart ------------------------------------------------------

export type RevenueChartPoint = {
  // ISO date (YYYY-MM-DD UTC) for the bucket.
  date: string;
  flocageCents: number;
  borneCents: number;
};

export type RevenueChartDTO = {
  range: RangeKey;
  points: RevenueChartPoint[];
  totals: {
    flocageCents: number;
    borneCents: number;
  };
  // Boundary between "paid" history and "accrued" projection. Points with
  // date < cutoff are paid invoices; >= cutoff are accrued campaign budgets.
  paidCutoff: string;
};

// --- Advertiser dashboard ----------------------------------------------

export type AdvertiserActivityItemDTO = {
  id: string; // event id
  type: "accept" | "cancel" | "complete" | "status_change";
  campaignId: string;
  campaignTitle?: string;
  driverId?: string;
  at: string;
};

export type AdvertiserDashboardDTO = {
  // Impressions for the past `windowDays` (default 30).
  windowDays: number;
  totalImpressions: number;
  goalImpressions: number; // sum of borne.targetImpressions for active+upcoming
  goalPct: number; // 0..100, capped at 100 in UI but raw here
  impressionsDelta: DeltaPct;
  sparkline: number[]; // length = windowDays, ordered oldest -> newest
  campaignsActive: number;
  campaignsTotal: number;
  billing: {
    paidThisMonthCents: number;
    pendingCents: number;
    pendingCount: number;
    overdueCents: number;
    overdueCount: number;
  };
  recentActivity: AdvertiserActivityItemDTO[]; // last 10
  generatedAt: string;
};
