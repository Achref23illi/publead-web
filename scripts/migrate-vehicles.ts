import { db, mongoClient } from "../src/lib/db";
import { Collections, type VehicleType } from "../src/lib/schemas";

const VALID_TYPES: VehicleType[] = ["Berline", "SUV", "Utilitaire", "Autre"];

// One-time migration: extract inline vehicle fields from DriverDoc into the
// dedicated vehicles collection, then $unset those fields. Idempotent — skips
// drivers that already have a vehicle record.
async function main() {
  const drivers = await db
    .collection(Collections.drivers)
    .find({})
    .toArray();

  let inserted = 0;
  let skipped = 0;
  for (const d of drivers) {
    const driverId = d._id.toString();

    const existing = await db
      .collection(Collections.vehicles)
      .findOne({ driverId });
    if (existing) {
      skipped++;
      // Strip stale inline fields anyway so the schema stays clean.
      await db.collection(Collections.drivers).updateOne(
        { _id: d._id },
        {
          $unset: {
            vehicleModel: "",
            vehicleYear: "",
            licensePlate: "",
            vehicleType: "",
          },
        },
      );
      continue;
    }

    const rawModel = (d.vehicleModel as string | undefined)?.trim();
    if (!rawModel) {
      console.log(`[migrate] driver ${driverId} has no vehicle data, skip`);
      skipped++;
      continue;
    }

    const firstSpace = rawModel.indexOf(" ");
    const make = firstSpace > 0 ? rawModel.slice(0, firstSpace) : "Inconnu";
    const model = firstSpace > 0 ? rawModel.slice(firstSpace + 1) : rawModel;
    const rawType = (d.vehicleType as string | undefined)?.trim() ?? "Berline";
    const type: VehicleType = VALID_TYPES.includes(rawType as VehicleType)
      ? (rawType as VehicleType)
      : "Berline";

    const now = new Date();
    await db.collection(Collections.vehicles).insertOne({
      driverId,
      make,
      model,
      year: ((d.vehicleYear as string | undefined) ?? "").trim() || "Inconnu",
      licensePlate: ((d.licensePlate as string | undefined) ?? "")
        .trim()
        .toUpperCase() || "INCONNU",
      type,
      isActive: true,
      photos: [],
      createdAt: now,
      updatedAt: now,
    });

    await db.collection(Collections.drivers).updateOne(
      { _id: d._id },
      {
        $unset: {
          vehicleModel: "",
          vehicleYear: "",
          licensePlate: "",
          vehicleType: "",
        },
      },
    );
    inserted++;
    console.log(`[migrate] vehicle inserted for driver ${driverId}`);
  }

  console.log(
    `\n✅ Vehicles migration done: ${inserted} inserted, ${skipped} skipped.`,
  );
  await mongoClient.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoClient.close();
  } catch {}
  process.exit(1);
});
