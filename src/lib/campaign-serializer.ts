import { ObjectId } from "mongodb";
import { db } from "./db";
import { Collections, type CampaignDoc, type CompanyDoc } from "./schemas";

export type CampaignDTO = {
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
  rewardCents: number;
  status: CampaignDoc["status"];
  progress: number;
  kmDone: number;
  kmTotal: number;
  driversNeeded: number;
  driversAssigned: number;
  assignedDriverIds: string[];
  trackingMode: CampaignDoc["trackingMode"];
  heroImageUrl?: string;
  // Brand metadata joined from CompanyDoc (best-effort).
  brandColor?: string;
  brandLogoUrl?: string;
};

export function serializeCampaign(
  c: CampaignDoc,
  brand?: { brandColor?: string; brandLogoUrl?: string },
): CampaignDTO {
  return {
    id: c._id!.toString(),
    companyId: c.companyId,
    brand: c.brand,
    domain: c.domain,
    title: c.title,
    description: c.description,
    city: c.city,
    zones: c.zones,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    durationDays: c.durationDays,
    rewardCents: c.rewardCents,
    status: c.status,
    progress: c.progress,
    kmDone: c.kmDone,
    kmTotal: c.kmTotal,
    driversNeeded: c.driversNeeded,
    driversAssigned: c.driversAssigned,
    assignedDriverIds: c.assignedDriverIds,
    trackingMode: c.trackingMode,
    heroImageUrl: c.heroImageUrl,
    brandColor: brand?.brandColor,
    brandLogoUrl: brand?.brandLogoUrl,
  };
}

export type CampaignBrandMap = Map<
  string,
  { brandColor?: string; brandLogoUrl?: string }
>;

/**
 * Loads brand metadata (color, logoUrl) for a list of campaigns in one query.
 * Returns a Map keyed by companyId for use with serializeCampaign.
 */
export async function loadBrandMap(
  campaigns: CampaignDoc[],
): Promise<CampaignBrandMap> {
  const ids = Array.from(new Set(campaigns.map((c) => c.companyId)));
  const map: CampaignBrandMap = new Map();
  if (ids.length === 0) return map;

  const docs = (await db
    .collection(Collections.companies)
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
    .project({ brandColor: 1, logo: 1, logoUrl: 1 })
    .toArray()) as Pick<CompanyDoc, "_id" | "brandColor" | "logo" | "logoUrl">[];

  for (const d of docs) {
    map.set(d._id!.toString(), {
      brandColor: d.brandColor,
      brandLogoUrl: d.logo?.url ?? d.logoUrl,
    });
  }
  return map;
}

export async function serializeCampaignWithBrand(
  c: CampaignDoc,
): Promise<CampaignDTO> {
  const map = await loadBrandMap([c]);
  return serializeCampaign(c, map.get(c.companyId));
}
