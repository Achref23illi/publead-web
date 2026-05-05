import { db, mongoClient } from "../src/lib/db";
import { Collections } from "../src/lib/schemas";

// One-time migration: rename Driver.documentsUploaded → documentsApproved.
// Default value carried over (true → approved, false → false).
async function main() {
  const res = await db.collection(Collections.drivers).updateMany(
    { documentsUploaded: { $exists: true } },
    { $rename: { documentsUploaded: "documentsApproved" } },
  );
  console.log(`[migrate] renamed on ${res.modifiedCount} drivers`);

  // Ensure all drivers have the new field set (default false).
  const fix = await db
    .collection(Collections.drivers)
    .updateMany(
      { documentsApproved: { $exists: false } },
      { $set: { documentsApproved: false } },
    );
  console.log(`[migrate] defaulted on ${fix.modifiedCount} drivers`);

  await mongoClient.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoClient.close(); } catch {}
  process.exit(1);
});
