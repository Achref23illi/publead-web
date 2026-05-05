import { db } from "./db";
import { Collections, type CampaignDoc, type CampaignStatus } from "./schemas";
import { ObjectId } from "mongodb";
import { recomputeLifetimeStats } from "./driver-stats";
import { creditCampaignCompletion } from "./wallet";

export function expectedStatus(
  campaign: Pick<CampaignDoc, "status" | "startDate" | "endDate">,
  now: Date = new Date(),
): CampaignStatus {
  // Manual gate: draft never auto-transitions until admin flips to upcoming.
  if (campaign.status === "draft") return "draft";
  if (now >= campaign.endDate) return "completed";
  if (now >= campaign.startDate) return "active";
  return "upcoming";
}

export function applyExpectedStatus<T extends CampaignDoc>(
  campaign: T,
  now: Date = new Date(),
): T {
  const next = expectedStatus(campaign, now);
  if (next === campaign.status) return campaign;
  return { ...campaign, status: next };
}

// Fire-and-forget DB sync. Caller should not await.
// When transitioning to 'completed', credits each assigned driver in the
// ledger (idempotent) and recomputes their snapshots.
export function syncStatusToDb(
  campaign: Pick<
    CampaignDoc,
    "_id" | "status" | "assignedDriverIds" | "brand" | "title" | "rewardCents" | "endDate"
  >,
  toStatus: CampaignStatus,
): void {
  const fromStatus = campaign.status;
  if (fromStatus === toStatus) return;
  const _id =
    typeof campaign._id === "string"
      ? new ObjectId(campaign._id)
      : campaign._id!;
  const campaignIdStr = _id.toString();

  Promise.all([
    db
      .collection(Collections.campaigns)
      .updateOne(
        { _id, status: fromStatus },
        { $set: { status: toStatus, updatedAt: new Date() } },
      ),
    db.collection(Collections.campaignEvents).insertOne({
      campaignId: campaignIdStr,
      type: "status_change",
      at: new Date(),
      meta: { from: fromStatus, to: toStatus, source: "auto" },
    }),
  ])
    .then(async () => {
      if (toStatus === "completed" && campaign.assignedDriverIds.length > 0) {
        // Credit ledger first (idempotent), then recompute lifetime + wallet.
        for (const driverId of campaign.assignedDriverIds) {
          try {
            await creditCampaignCompletion({
              driverId,
              campaignId: campaignIdStr,
              amountCents: campaign.rewardCents,
              brand: campaign.brand,
              campaignTitle: campaign.title,
              completedAt: campaign.endDate,
            });
          } catch (e) {
            console.warn(
              `[campaign-lifecycle] credit failed for driver ${driverId}`,
              e,
            );
          }
          try {
            await recomputeLifetimeStats(driverId);
          } catch (e) {
            console.warn(
              `[campaign-lifecycle] recompute lifetime failed for driver ${driverId}`,
              e,
            );
          }
        }
      }
    })
    .catch((err) => {
      console.warn("[campaign-lifecycle] sync failed", err);
    });
}

export function reconcileMany<T extends CampaignDoc>(
  campaigns: T[],
  now: Date = new Date(),
): T[] {
  return campaigns.map((c) => {
    const next = expectedStatus(c, now);
    if (next !== c.status && c._id) {
      syncStatusToDb(c, next);
      return { ...c, status: next };
    }
    return c;
  });
}
