import { ObjectId } from "mongodb";
import { db, mongoClient } from "../src/lib/db";
import {
  CARTRIDGE_SLOT_COUNT,
  Collections,
  type CartridgeSlot,
  type ScentDoc,
  type StockOrderDoc,
  type TerminalDoc,
} from "../src/lib/schemas";

type SeedScent = {
  sku: string;
  name: string;
  defaultCapacityMl: number;
  color: string;
};

const SEED_SCENTS: SeedScent[] = [
  { sku: "BDC", name: "Bois de Cèdre", defaultCapacityMl: 500, color: "#8D6E63" },
  { sku: "FDO", name: "Fleur d'Oranger", defaultCapacityMl: 500, color: "#FFB300" },
  { sku: "AMB", name: "Ambre Noir", defaultCapacityMl: 500, color: "#3E2723" },
  { sku: "ROS", name: "Rose Musquée", defaultCapacityMl: 500, color: "#E91E63" },
  { sku: "VET", name: "Vétiver", defaultCapacityMl: 500, color: "#558B2F" },
];

const PARTNER_EMAIL = "partner@publeader.local";

async function findPartnerId(): Promise<string> {
  const user = await db.collection("user").findOne({ email: PARTNER_EMAIL });
  if (!user?.partnerId) {
    throw new Error(
      `partner user ${PARTNER_EMAIL} or its partnerId missing — run seed:users first`,
    );
  }
  return user.partnerId as string;
}

async function wipeStockForPartner(partnerId: string) {
  // Delete partner's orders + refills referencing partner's terminals.
  const partnerTerminals = (await db
    .collection(Collections.terminals)
    .find({ partnerId })
    .toArray()) as TerminalDoc[];
  const terminalIds = partnerTerminals.map((t) => t._id!.toString());

  await db
    .collection(Collections.stockOrders)
    .deleteMany({ partnerId });
  if (terminalIds.length) {
    await db
      .collection(Collections.refillLogs)
      .deleteMany({ terminalId: { $in: terminalIds } });
  }
  console.log(
    `[seed:stock] wiped existing stock orders + refill logs for partner ${partnerId}`,
  );
}

async function ensureScents(): Promise<Map<string, ScentDoc>> {
  // Wipe + reseed: stock orders may reference these, but we already wiped them
  // above. Refills also wiped. Safe to wipe scents.
  await db.collection(Collections.scents).deleteMany({});
  const now = new Date();
  const docs: ScentDoc[] = SEED_SCENTS.map((s) => ({
    sku: s.sku,
    name: s.name,
    defaultCapacityMl: s.defaultCapacityMl,
    color: s.color,
    createdAt: now,
    updatedAt: now,
  }));
  const ins = await db.collection(Collections.scents).insertMany(docs);
  for (let i = 0; i < docs.length; i++) {
    docs[i]._id = ins.insertedIds[i] as ObjectId;
  }
  console.log(`[seed:stock] catalog seeded: ${docs.length} scents`);
  return new Map(docs.map((d) => [d.sku, d]));
}

async function fillCartridges(
  partnerId: string,
  scents: Map<string, ScentDoc>,
) {
  const terminals = (await db
    .collection(Collections.terminals)
    .find({ partnerId })
    .toArray()) as TerminalDoc[];

  if (!terminals.length) {
    console.warn(
      "[seed:stock] no terminals for partner — run seed:terminals first",
    );
    return;
  }

  const skuList = ["BDC", "FDO", "AMB", "ROS", "VET"];
  // Mixed level patterns per terminal so the demo shows varied statuses.
  const levelPatterns: number[][] = [
    [82, 64, 45, 18, 71], // matches mock partnerStock
    [70, 55, 35, 90, 60],
    [50, 40, 25, 80, 70],
    [10, 65, 90, 30, 55], // one critical
    [100, 100, 100, 100, 100], // freshly refilled
    [60, 60, 60, 60, 60],
    [0, 0, 0, 0, 0], // offline terminal — empty bays read as critical
    [85, 75, 65, 55, 45],
  ];

  let i = 0;
  for (const t of terminals) {
    const pattern = levelPatterns[i % levelPatterns.length];
    const cartridges: CartridgeSlot[] = Array.from(
      { length: CARTRIDGE_SLOT_COUNT },
      (_, slotIdx) => {
        const sku = skuList[slotIdx];
        const scent = scents.get(sku);
        const lvl = pattern[slotIdx];
        return {
          slot: slotIdx + 1,
          scentId: scent?._id!.toString(),
          capacityMl: scent?.defaultCapacityMl ?? 500,
          levelPercent: lvl,
          spraysSinceRefill: Math.floor((100 - lvl) * 22), // approx
          lastRefillAt: new Date(
            Date.now() - (10 - slotIdx) * 24 * 3600_000,
          ),
        };
      },
    );
    await db
      .collection(Collections.terminals)
      .updateOne(
        { _id: t._id },
        { $set: { cartridges, updatedAt: new Date() } },
      );
    i++;
  }
  console.log(
    `[seed:stock] cartridges loaded into ${terminals.length} terminals`,
  );
}

async function seedDemoOrders(partnerId: string, scents: Map<string, ScentDoc>) {
  const terminals = (await db
    .collection(Collections.terminals)
    .find({ partnerId })
    .toArray()) as TerminalDoc[];
  if (!terminals.length) return;

  // 1 pending order on first terminal: refill the low ones.
  const t0 = terminals[0];
  const partnerUser = await db
    .collection("user")
    .findOne({ email: PARTNER_EMAIL });
  if (!partnerUser) return;

  const order: StockOrderDoc = {
    partnerId,
    terminalId: t0._id!.toString(),
    lines: [
      { scentId: scents.get("AMB")!._id!.toString(), qty: 2 },
      { scentId: scents.get("ROS")!._id!.toString(), qty: 3 },
    ],
    status: "pending",
    notes: "Refill prioritaire, week-end chargé.",
    createdAt: new Date(Date.now() - 2 * 3600_000),
    createdBy: partnerUser._id.toString(),
  };
  await db.collection(Collections.stockOrders).insertOne(order);

  // 1 fulfilled order on second terminal (if any).
  if (terminals[1]) {
    const t1 = terminals[1];
    const fulfilled: StockOrderDoc = {
      partnerId,
      terminalId: t1._id!.toString(),
      lines: [{ scentId: scents.get("BDC")!._id!.toString(), qty: 1 }],
      status: "fulfilled",
      createdAt: new Date(Date.now() - 5 * 24 * 3600_000),
      createdBy: partnerUser._id.toString(),
      fulfilledAt: new Date(Date.now() - 4 * 24 * 3600_000),
    };
    await db.collection(Collections.stockOrders).insertOne(fulfilled);
  }
  console.log(`[seed:stock] demo orders created`);
}

async function main() {
  console.log("\n=== seed:stock ===");
  const partnerId = await findPartnerId();
  console.log(`partnerId: ${partnerId}`);

  await wipeStockForPartner(partnerId);
  const scents = await ensureScents();
  await fillCartridges(partnerId, scents);
  await seedDemoOrders(partnerId, scents);

  // Verify
  const scentCount = await db
    .collection(Collections.scents)
    .countDocuments({});
  if (scentCount !== SEED_SCENTS.length) {
    throw new Error(`expected ${SEED_SCENTS.length} scents, got ${scentCount}`);
  }
  console.log(`\n[verify] ✓ ${scentCount} scents seeded`);

  await mongoClient.close();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  try {
    await mongoClient.close();
  } catch {}
  process.exit(1);
});
