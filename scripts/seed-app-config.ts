import { db, mongoClient } from "../src/lib/db";
import { Collections } from "../src/lib/schemas";

async function main() {
  await db.collection(Collections.appConfig).updateOne(
    { key: "payments" },
    {
      $set: {
        key: "payments",
        withdrawalMinCents: 5000,
        pendingHoldDays: 7,
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  console.log("[seed] app_config.payments → min 50.00 €, hold 7 days");
  await mongoClient.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoClient.close(); } catch {}
  process.exit(1);
});
