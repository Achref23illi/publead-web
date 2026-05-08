import { ObjectId } from "mongodb";
import { db, mongoClient } from "../src/lib/db";
import {
  Collections,
  PARTNER_PAYOUT_SCHEDULE_DAY,
  PARTNER_REVENUE_DEFAULT_CPM_CENTS,
  PARTNER_REVENUE_DEFAULT_SPRAY_CENTS,
  type PartnerPayoutDoc,
  type PartnerRevenueConfigDoc,
  type RevenueDailyDoc,
  type RevenueMonthlyDoc,
  type RevenueMonthlyTerminalLine,
  type TerminalDoc,
} from "../src/lib/schemas";
import { isoDate } from "../src/lib/ad-schedule-service";

const PARTNER_EMAIL = "partner@publeader.local";
const MONTHLY_TARGET_CENTS = 210_000; // 2100 € — matches mock partnerTerminal.monthlyTarget

async function findPartnerId(): Promise<string> {
  const user = await db.collection("user").findOne({ email: PARTNER_EMAIL });
  if (!user?.partnerId) {
    throw new Error(
      `partner user ${PARTNER_EMAIL} or its partnerId missing — run seed:users first`,
    );
  }
  return user.partnerId as string;
}

async function ensureRevenueConfig() {
  const existing = (await db
    .collection(Collections.appConfig)
    .findOne({ key: "partner_revenue" })) as PartnerRevenueConfigDoc | null;
  const now = new Date();
  if (existing) {
    await db.collection(Collections.appConfig).updateOne(
      { key: "partner_revenue" },
      {
        $set: {
          sprayRateCents: PARTNER_REVENUE_DEFAULT_SPRAY_CENTS,
          cpmCents: PARTNER_REVENUE_DEFAULT_CPM_CENTS,
          updatedAt: now,
        },
      },
    );
  } else {
    const doc: PartnerRevenueConfigDoc = {
      key: "partner_revenue",
      sprayRateCents: PARTNER_REVENUE_DEFAULT_SPRAY_CENTS,
      cpmCents: PARTNER_REVENUE_DEFAULT_CPM_CENTS,
      updatedAt: now,
    };
    await db.collection(Collections.appConfig).insertOne(doc);
  }
  console.log(
    `[seed:revenue] config: ${PARTNER_REVENUE_DEFAULT_SPRAY_CENTS}¢/spray, ${PARTNER_REVENUE_DEFAULT_CPM_CENTS}¢ CPM`,
  );
}

async function setMonthlyTarget(partnerId: string) {
  await db
    .collection(Collections.partners)
    .updateOne(
      { _id: new ObjectId(partnerId) },
      { $set: { monthlyTargetCents: MONTHLY_TARGET_CENTS } },
    );
  console.log(`[seed:revenue] monthlyTargetCents=${MONTHLY_TARGET_CENTS}`);
}

async function wipe(partnerId: string) {
  const terminals = (await db
    .collection(Collections.terminals)
    .find({ partnerId })
    .toArray()) as TerminalDoc[];
  await db.collection(Collections.revenueDaily).deleteMany({ partnerId });
  await db.collection(Collections.revenueMonthly).deleteMany({ partnerId });
  await db.collection(Collections.partnerPayouts).deleteMany({ partnerId });
  console.log(
    `[seed:revenue] wiped daily + monthly + payouts (${terminals.length} terminals)`,
  );
}

async function backfillDaily(partnerId: string, days: number) {
  const terminals = (await db
    .collection(Collections.terminals)
    .find({ partnerId })
    .toArray()) as TerminalDoc[];
  if (!terminals.length) {
    console.warn("[seed:revenue] no terminals — run seed:terminals first");
    return;
  }
  const now = new Date();
  const docs: RevenueDailyDoc[] = [];
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const d = new Date(now.getTime() - dayOffset * 24 * 3600_000);
    const date = isoDate(d);
    for (const t of terminals) {
      // Offline terminals contribute zero. Others get realistic random sprays.
      const decommissioned = !!t.decommissionedAt;
      if (decommissioned) continue;
      const baseSprays =
        t.lastKnownStatus === "offline" ? Math.floor(Math.random() * 30) : 80 + Math.floor(Math.random() * 220);
      docs.push({
        partnerId,
        terminalId: t._id!.toString(),
        date,
        spraysCount: baseSprays,
        updatedAt: now,
      });
    }
  }
  if (docs.length) {
    await db.collection(Collections.revenueDaily).insertMany(docs);
  }
  console.log(`[seed:revenue] ${docs.length} daily rows seeded over ${days} days`);
}

async function sealAndPay(partnerId: string) {
  const now = new Date();
  // Seal months: previous and the one before that.
  const monthsToSeal: { year: number; month0: number }[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  cursor.setUTCMonth(cursor.getUTCMonth() - 1); // start at last month
  for (let i = 0; i < 2; i++) {
    monthsToSeal.push({
      year: cursor.getUTCFullYear(),
      month0: cursor.getUTCMonth(),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }

  const terminals = (await db
    .collection(Collections.terminals)
    .find({ partnerId })
    .toArray()) as TerminalDoc[];
  const terminalMap = new Map(terminals.map((t) => [t._id!.toString(), t]));

  for (const { year, month0 } of monthsToSeal) {
    const monthStr = `${year}-${(month0 + 1).toString().padStart(2, "0")}`;
    const start = isoDate(new Date(Date.UTC(year, month0, 1)));
    const end = isoDate(new Date(Date.UTC(year, month0 + 1, 0)));

    // Aggregate revenue from daily rows.
    const sprayRows = (await db
      .collection(Collections.revenueDaily)
      .find({ partnerId, date: { $gte: start, $lte: end } })
      .toArray()) as RevenueDailyDoc[];
    const impressionRows = await db
      .collection(Collections.adImpressionsDaily)
      .find({
        terminalId: { $in: Array.from(terminalMap.keys()) },
        date: { $gte: start, $lte: end },
      })
      .toArray();

    const byTerm = new Map<string, { sprays: number; impressions: number }>();
    for (const r of sprayRows) {
      const slot = byTerm.get(r.terminalId) ?? { sprays: 0, impressions: 0 };
      slot.sprays += r.spraysCount;
      byTerm.set(r.terminalId, slot);
    }
    for (const r of impressionRows) {
      const slot = byTerm.get(r.terminalId as string) ?? {
        sprays: 0,
        impressions: 0,
      };
      slot.impressions += r.impressions as number;
      byTerm.set(r.terminalId as string, slot);
    }

    const perTerminal: RevenueMonthlyTerminalLine[] = [];
    let totalSprays = 0;
    let totalImpressions = 0;
    for (const [terminalId, slot] of byTerm) {
      if (slot.sprays === 0 && slot.impressions === 0) continue;
      const t = terminalMap.get(terminalId);
      const sprayCents = slot.sprays * PARTNER_REVENUE_DEFAULT_SPRAY_CENTS;
      const adCents = Math.round(
        (slot.impressions * PARTNER_REVENUE_DEFAULT_CPM_CENTS) / 1000,
      );
      perTerminal.push({
        terminalId,
        terminalCode: t?.code,
        terminalName: t?.name,
        spraysCount: slot.sprays,
        impressions: slot.impressions,
        sprayCents,
        adCents,
        totalCents: sprayCents + adCents,
      });
      totalSprays += slot.sprays;
      totalImpressions += slot.impressions;
    }
    const sprayCents = totalSprays * PARTNER_REVENUE_DEFAULT_SPRAY_CENTS;
    const adCents = Math.round(
      (totalImpressions * PARTNER_REVENUE_DEFAULT_CPM_CENTS) / 1000,
    );
    const totalCents = sprayCents + adCents;

    const monthly: RevenueMonthlyDoc = {
      partnerId,
      month: monthStr,
      totalSprays,
      totalImpressions,
      sprayRateCents: PARTNER_REVENUE_DEFAULT_SPRAY_CENTS,
      cpmCents: PARTNER_REVENUE_DEFAULT_CPM_CENTS,
      sprayCents,
      adCents,
      totalCents,
      perTerminal,
      sealedAt: now,
    };
    await db.collection(Collections.revenueMonthly).insertOne(monthly);

    const scheduledFor = new Date(
      Date.UTC(year, month0 + 1, PARTNER_PAYOUT_SCHEDULE_DAY),
    );
    // Older sealed month is paid; most recent sealed month still scheduled.
    const isOlder = monthsToSeal.indexOf({ year, month0 }) > 0;
    const isFirstSealed = monthsToSeal[0].year === year && monthsToSeal[0].month0 === month0;
    const status = isFirstSealed ? "scheduled" : "paid";
    const payout: PartnerPayoutDoc = {
      partnerId,
      month: monthStr,
      totalCents,
      status,
      scheduledFor,
      paidAt: status === "paid" ? new Date(scheduledFor.getTime() + 24 * 3600_000) : undefined,
      paidBy: status === "paid" ? "seed" : undefined,
      payoutReference:
        status === "paid" ? `VIR-${monthStr.replace("-", "")}-001` : undefined,
      createdAt: now,
    };
    await db.collection(Collections.partnerPayouts).insertOne(payout);
    console.log(
      `[seed:revenue] sealed ${monthStr} (${(totalCents / 100).toFixed(0)}€) → payout ${status}`,
    );
  }
}

async function main() {
  console.log("\n=== seed:revenue ===");
  const partnerId = await findPartnerId();
  console.log(`partnerId: ${partnerId}`);

  await ensureRevenueConfig();
  await setMonthlyTarget(partnerId);
  await wipe(partnerId);
  await backfillDaily(partnerId, 75); // ~2.5 months so seal has data
  await sealAndPay(partnerId);

  // Verify
  const dailyCount = await db
    .collection(Collections.revenueDaily)
    .countDocuments({ partnerId });
  const monthlyCount = await db
    .collection(Collections.revenueMonthly)
    .countDocuments({ partnerId });
  const payoutCount = await db
    .collection(Collections.partnerPayouts)
    .countDocuments({ partnerId });
  console.log(
    `\n[verify] ✓ daily=${dailyCount} monthly=${monthlyCount} payouts=${payoutCount}`,
  );

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
