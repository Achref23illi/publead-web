import type { Campaign } from "./data";

type CampaignDTO = {
  id: string;
  companyId: string;
  brand: string;
  domain: string;
  title: string;
  description: string;
  city: string;
  zones: string[];
  startDate: string;
  endDate: string;
  durationDays: number;
  reward: number;
  status: "draft" | "upcoming" | "active" | "completed";
  progress: number;
  kmDone: number;
  kmTotal: number;
  driversNeeded: number;
  driversAssigned: number;
  assignedDriverIds: string[];
  trackingMode: "gps" | "manual";
};

const PALETTE = [
  "#1f3a8a",
  "#0f5c47",
  "#7a3a17",
  "#7a1f3a",
  "#3a1f7a",
  "#7a7a17",
];

function colorFor(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function initialsOf(brand: string): string {
  return brand
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

const MONTHS_FR = [
  "jan",
  "fév",
  "mars",
  "avr",
  "mai",
  "juin",
  "juil",
  "août",
  "sept",
  "oct",
  "nov",
  "déc",
];

function fmt(d: Date): string {
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

function periodOf(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${fmt(s)} → ${fmt(e)}`;
}

export function dtoToWebCampaign(dto: CampaignDTO): Campaign {
  // Web Campaign.status only knows active|completed|draft, not upcoming.
  // Map upcoming → draft so existing UI doesn't crash.
  const status: Campaign["status"] =
    dto.status === "upcoming"
      ? "draft"
      : (dto.status as Campaign["status"]);
  return {
    id: dto.id,
    brand: dto.brand,
    color: colorFor(dto.brand),
    initials: initialsOf(dto.brand),
    company: dto.brand,
    type: dto.trackingMode === "gps" ? "Flocage" : "Borne",
    city: dto.city,
    period: periodOf(dto.startDate, dto.endDate),
    drivers: [dto.driversAssigned, dto.driversNeeded],
    km: [dto.kmDone, dto.kmTotal],
    rev: `${dto.reward * dto.driversAssigned} €`,
    status,
    progress: Math.round(dto.progress * 100),
  };
}

export async function fetchAdminCampaigns(params: {
  driverId?: string | null;
  status?: string;
  city?: string;
}): Promise<Campaign[]> {
  const qs = new URLSearchParams();
  if (params.driverId) qs.set("driverId", params.driverId);
  if (params.status) qs.set("status", params.status);
  if (params.city) qs.set("city", params.city);
  const res = await fetch(
    `/api/admin/campaigns${qs.toString() ? `?${qs.toString()}` : ""}`,
    { credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const body = (await res.json()) as { campaigns: CampaignDTO[] };
  return body.campaigns.map(dtoToWebCampaign);
}
