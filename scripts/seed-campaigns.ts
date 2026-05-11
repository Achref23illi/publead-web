import { db, mongoClient } from "../src/lib/db";
import { Collections, type CampaignDoc } from "../src/lib/schemas";

type SeedCampaign = {
  mockCompanyId: string;
  brand: string;
  domain: string;
  title: string;
  description: string;
  city: string;
  zones: string[];
  startDate: string;
  endDate: string;
  rewardCents: number;
  driversNeeded: number;
  driversAssignedSeed: number;
  kmTotal: number;
  kmDoneRatio: number;
  trackingMode: "gps" | "manual";
};

const CAMPAIGNS: SeedCampaign[] = [
  {
    mockCompanyId: "c1",
    brand: "Nike",
    domain: "nike.com",
    title: "Nike Air Max 2026",
    description:
      "Campagne de lancement de la nouvelle collection Air Max dans les rues de Paris. Flocage intégral sur véhicules premium avec suivi GPS en temps réel.",
    city: "Paris",
    zones: ["Paris Centre", "La Défense", "Champs-Élysées", "Opéra"],
    startDate: "2026-04-01",
    endDate: "2026-05-15",
    rewardCents: 35000,
    driversNeeded: 4,
    driversAssignedSeed: 0,
    kmTotal: 4500,
    kmDoneRatio: 0,
    trackingMode: "gps",
  },
  {
    mockCompanyId: "c2",
    brand: "Adidas",
    domain: "adidas.com",
    title: "Adidas Originals Lyon",
    description:
      "Promotion de la ligne Originals dans la métropole lyonnaise. Ciblage des zones commerciales et universitaires.",
    city: "Lyon",
    zones: ["Part-Dieu", "Bellecour", "Confluence", "Villeurbanne"],
    startDate: "2026-04-15",
    endDate: "2026-05-30",
    rewardCents: 28000,
    driversNeeded: 3,
    driversAssignedSeed: 0,
    kmTotal: 3500,
    kmDoneRatio: 0,
    trackingMode: "gps",
  },
  {
    mockCompanyId: "c3",
    brand: "Coca-Cola",
    domain: "coca-cola.com",
    title: "Coca-Cola Summer 2026",
    description:
      "Grande campagne estivale Coca-Cola dans le sud de la France. Bonus pour les zones touristiques.",
    city: "Marseille",
    zones: ["Vieux-Port", "Prado", "Corniche", "Castellane"],
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    rewardCents: 46000,
    driversNeeded: 6,
    driversAssignedSeed: 0,
    kmTotal: 8000,
    kmDoneRatio: 0,
    trackingMode: "gps",
  },
  {
    mockCompanyId: "c4",
    brand: "Renault",
    domain: "renault.com",
    title: "Renault Électrique Lyon",
    description:
      "Campagne de promotion des véhicules électriques Renault. Ciblage des zones à faibles émissions.",
    city: "Lyon",
    zones: ["Centre-ville", "Gerland", "Vaise"],
    startDate: "2026-03-01",
    endDate: "2026-04-30",
    rewardCents: 32000,
    driversNeeded: 5,
    driversAssignedSeed: 0,
    kmTotal: 6000,
    kmDoneRatio: 0,
    trackingMode: "manual",
  },
  {
    mockCompanyId: "c1",
    brand: "Nike",
    domain: "nike.com",
    title: "Nike Running Caen",
    description:
      "Campagne avec excellente visibilité dans la zone urbaine de Caen.",
    city: "Caen",
    zones: ["Centre-ville", "CHU", "Université"],
    startDate: "2026-01-15",
    endDate: "2026-03-15",
    rewardCents: 25000,
    driversNeeded: 3,
    driversAssignedSeed: 0,
    kmTotal: 4000,
    kmDoneRatio: 1,
    trackingMode: "gps",
  },
  {
    mockCompanyId: "c6",
    brand: "OpenAI",
    domain: "openai.com",
    title: "ChatGPT Paris Launch",
    description:
      "Grande campagne de visibilité pour ChatGPT dans Paris. Ciblage des quartiers tech et étudiants.",
    city: "Paris",
    zones: ["Station F", "Sentier", "République", "Bastille"],
    startDate: "2026-05-01",
    endDate: "2026-06-30",
    rewardCents: 42000,
    driversNeeded: 5,
    driversAssignedSeed: 0,
    kmTotal: 5000,
    kmDoneRatio: 0,
    trackingMode: "gps",
  },
  {
    mockCompanyId: "c7",
    brand: "FedEx",
    domain: "fedex.com",
    title: "FedEx Express Lyon",
    description:
      "Campagne de notoriété pour les services de livraison rapide FedEx. Zones industrielles et commerciales.",
    city: "Lyon",
    zones: ["Part-Dieu", "Gerland", "Vénissieux", "Vaulx-en-Velin"],
    startDate: "2026-05-15",
    endDate: "2026-07-15",
    rewardCents: 30000,
    driversNeeded: 4,
    driversAssignedSeed: 0,
    kmTotal: 4500,
    kmDoneRatio: 0,
    trackingMode: "manual",
  },
  {
    mockCompanyId: "c8",
    brand: "LEGO",
    domain: "lego.com",
    title: "LEGO Summer Paris",
    description:
      "Campagne colorée et ludique pour promouvoir les nouvelles gammes LEGO.",
    city: "Paris",
    zones: ["Les Halles", "Bercy Village", "La Villette", "Disney Village"],
    startDate: "2026-06-15",
    endDate: "2026-08-15",
    rewardCents: 34000,
    driversNeeded: 4,
    driversAssignedSeed: 0,
    kmTotal: 4000,
    kmDoneRatio: 0,
    trackingMode: "gps",
  },
  {
    mockCompanyId: "c9",
    brand: "Louis Vuitton",
    domain: "louisvuitton.com",
    title: "LV Prestige Paris",
    description:
      "Campagne exclusive pour la maison Louis Vuitton. Véhicules premium dans les quartiers luxe parisiens.",
    city: "Paris",
    zones: ["Champs-Élysées", "Place Vendôme", "Saint-Germain", "Montaigne"],
    startDate: "2026-05-01",
    endDate: "2026-07-31",
    rewardCents: 55000,
    driversNeeded: 3,
    driversAssignedSeed: 0,
    kmTotal: 6000,
    kmDoneRatio: 0,
    trackingMode: "gps",
  },
  {
    mockCompanyId: "c10",
    brand: "Spotify",
    domain: "spotify.com",
    title: "Spotify Summer Marseille",
    description:
      "Promotion de Spotify Premium dans le sud. Zones de plage et festivals.",
    city: "Marseille",
    zones: ["Vieux-Port", "Plages du Prado", "Cours Julien", "Joliette"],
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    rewardCents: 38000,
    driversNeeded: 5,
    driversAssignedSeed: 0,
    kmTotal: 7000,
    kmDoneRatio: 0,
    trackingMode: "gps",
  },
  // Acme Corp (advertiser@publeader.local demo company)
  {
    mockCompanyId: "c_acme",
    brand: "Acme Corp",
    domain: "Restauration",
    title: "Acme Burger Paris Launch",
    description:
      "Lancement de la nouvelle enseigne Acme Burger dans Paris. Campagne de notoriété ciblant les zones piétonnes et les centres commerciaux.",
    city: "Paris",
    zones: ["Châtelet", "Opéra", "République", "Nation"],
    startDate: "2026-04-01",
    endDate: "2026-05-31",
    rewardCents: 28000,
    driversNeeded: 3,
    driversAssignedSeed: 0,
    kmTotal: 3500,
    kmDoneRatio: 0.4,
    trackingMode: "gps",
  },
  {
    mockCompanyId: "c_acme",
    brand: "Acme Corp",
    domain: "Restauration",
    title: "Acme Summer Drive Paris",
    description:
      "Campagne estivale pour booster la notoriété Acme autour des parcs et plages urbaines.",
    city: "Paris",
    zones: ["Bois de Boulogne", "Trocadéro", "Champ-de-Mars"],
    startDate: "2026-06-15",
    endDate: "2026-08-15",
    rewardCents: 32000,
    driversNeeded: 4,
    driversAssignedSeed: 0,
    kmTotal: 5000,
    kmDoneRatio: 0,
    trackingMode: "gps",
  },
  {
    mockCompanyId: "c_acme",
    brand: "Acme Corp",
    domain: "Restauration",
    title: "Acme Lyon Expansion",
    description:
      "Ouverture de 3 nouveaux restaurants Acme à Lyon. Campagne de visibilité dans les quartiers cibles.",
    city: "Lyon",
    zones: ["Part-Dieu", "Confluence", "Presqu'île"],
    startDate: "2026-01-15",
    endDate: "2026-03-15",
    rewardCents: 24000,
    driversNeeded: 3,
    driversAssignedSeed: 0,
    kmTotal: 3000,
    kmDoneRatio: 1,
    trackingMode: "manual",
  },
];

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function buildCompanyIdMap(): Promise<Record<string, string>> {
  // Map mock IDs (c1, c2…) to real seeded company IDs by domain match.
  const seeded = await db
    .collection(Collections.companies)
    .find({})
    .toArray();
  const byDomain = new Map<string, string>();
  for (const co of seeded) {
    if (co.domain) byDomain.set(co.domain, co._id.toString());
  }
  const map: Record<string, string> = {};
  for (const c of CAMPAIGNS) {
    const id = byDomain.get(c.domain);
    if (!id) {
      throw new Error(
        `[seed-campaigns] company missing for domain ${c.domain} (mockId ${c.mockCompanyId}). Run seed:companies first.`,
      );
    }
    map[c.mockCompanyId] = id;
  }
  return map;
}

async function main() {
  console.log("\n=== wiping existing campaigns + events ===");
  await db.collection(Collections.campaigns).deleteMany({});
  await db.collection(Collections.campaignEvents).deleteMany({});

  const companyMap = await buildCompanyIdMap();

  console.log("\n=== inserting campaigns ===");
  const docs: CampaignDoc[] = CAMPAIGNS.map((c) => {
    const startDate = new Date(c.startDate);
    const endDate = new Date(c.endDate);
    const durationDays = daysBetween(startDate, endDate);
    const kmDone = Math.floor(c.kmTotal * c.kmDoneRatio);
    return {
      companyId: companyMap[c.mockCompanyId],
      brand: c.brand,
      domain: c.domain,
      title: c.title,
      description: c.description,
      // Pre-A4 seed campaigns are all flocage; tier defaults to growth.
      campaignType: "flocage",
      budgetTier: "growth",
      budgetCents: c.rewardCents * c.driversNeeded,
      city: c.city,
      zones: c.zones,
      startDate,
      endDate,
      durationDays,
      rewardCents: c.rewardCents,
      // Stored status is upcoming; lifecycle helper transitions on read.
      status: "upcoming",
      progress: c.kmDoneRatio,
      kmDone,
      kmTotal: c.kmTotal,
      driversNeeded: c.driversNeeded,
      driversAssigned: c.driversAssignedSeed,
      assignedDriverIds: [],
      trackingMode: c.trackingMode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
  const ins = await db.collection(Collections.campaigns).insertMany(docs);
  console.log(`[seed] inserted ${ins.insertedCount} campaigns`);

  console.log("\n=== updating company campaign counts ===");
  const counts = new Map<string, number>();
  for (const d of docs) {
    counts.set(d.companyId, (counts.get(d.companyId) ?? 0) + 1);
  }
  for (const [companyId, n] of counts) {
    await db
      .collection(Collections.companies)
      .updateOne(
        { _id: new (await import("mongodb")).ObjectId(companyId) },
        { $set: { campaignsCount: n } },
      );
  }

  console.log("\n✅ Campaigns seeded.");
  await mongoClient.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoClient.close(); } catch {}
  process.exit(1);
});
