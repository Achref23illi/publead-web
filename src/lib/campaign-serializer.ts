import type { CampaignDoc } from "./schemas";

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
};

export function serializeCampaign(c: CampaignDoc): CampaignDTO {
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
  };
}
