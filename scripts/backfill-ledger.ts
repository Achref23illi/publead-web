import { db, mongoClient } from "../src/lib/db";
import { Collections, type CampaignDoc } from "../src/lib/schemas";
import { creditCampaignCompletion, recomputeWallet } from "../src/lib/wallet";

// Backfills the transactions ledger from already-completed campaigns.
// Idempotent: creditCampaignCompletion checks for existing tx per (driver, campaign).
async function main() {
  const completed = (await db
    .collection(Collections.campaigns)
    .find({ status: "completed" })
    .toArray()) as CampaignDoc[];

  console.log(`\n=== backfilling ledger from ${completed.length} completed campaigns ===`);

  const driversTouched = new Set<string>();

  for (const c of completed) {
    for (const driverId of c.assignedDriverIds) {
      try {
        await creditCampaignCompletion({
          driverId,
          campaignId: c._id!.toString(),
          amountCents: c.rewardCents,
          brand: c.brand,
          campaignTitle: c.title,
          completedAt: c.endDate,
        });
        driversTouched.add(driverId);
        console.log(`[backfill] credit ${c.brand} → driver ${driverId}`);
      } catch (e) {
        console.warn(`[backfill] credit failed for ${driverId}`, e);
      }
    }
  }

  for (const driverId of driversTouched) {
    await recomputeWallet(driverId);
  }

  console.log(`\n✅ Ledger backfill done. ${driversTouched.size} drivers touched.`);
  await mongoClient.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoClient.close(); } catch {}
  process.exit(1);
});
