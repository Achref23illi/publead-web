import { auth } from "../src/lib/auth";
import { db, mongoClient } from "../src/lib/db";
import { Collections } from "../src/lib/schemas";

type DemoCompany = {
  mockId: string; // links mock campaigns to seeded companyId
  email: string;
  password: string;
  name: string; // contact name (Better Auth user name)
  phone: string;
  company: {
    companyName: string;
    contactName: string;
    domain: string;
    sector: string;
    city: string;
    website: string;
    description: string;
    headquarters: string;
    founded: string;
    employees: string;
    budgetTotal: number;
  };
};

const COMPANIES: DemoCompany[] = [
  {
    mockId: "c1",
    email: "nike@publeader.local",
    password: "nike123!",
    name: "Jean-Pierre Lefèvre",
    phone: "+33 1 42 68 00 00",
    company: {
      companyName: "Nike France",
      contactName: "Jean-Pierre Lefèvre",
      domain: "nike.com",
      sector: "Mode & Sport",
      city: "Paris",
      website: "https://www.nike.com/fr",
      description:
        "Leader mondial des équipements sportifs. Nous cherchons à accroître notre visibilité dans les grandes villes françaises via le flocage de véhicules.",
      headquarters: "Paris, France",
      founded: "1964",
      employees: "100-500",
      budgetTotal: 25000,
    },
  },
  {
    mockId: "c2",
    email: "adidas@publeader.local",
    password: "adidas123!",
    name: "Claire Dubois",
    phone: "+33 1 45 90 00 00",
    company: {
      companyName: "Adidas France",
      contactName: "Claire Dubois",
      domain: "adidas.com",
      sector: "Mode & Sport",
      city: "Lyon",
      website: "https://www.adidas.fr",
      description:
        "Marque de sport internationale souhaitant renforcer sa présence dans l'est et le sud-est de la France.",
      headquarters: "Lyon, France",
      founded: "1949",
      employees: "50-100",
      budgetTotal: 18000,
    },
  },
  {
    mockId: "c3",
    email: "cocacola@publeader.local",
    password: "coca123!",
    name: "Marc Renaud",
    phone: "+33 1 50 12 00 00",
    company: {
      companyName: "Coca-Cola France",
      contactName: "Marc Renaud",
      domain: "coca-cola.com",
      sector: "Alimentation & Boissons",
      city: "Marseille",
      website: "https://www.coca-cola.fr",
      description:
        "Campagne estivale pour promouvoir nos nouvelles boissons sans sucre dans le sud de la France.",
      headquarters: "Marseille, France",
      founded: "1886",
      employees: "500+",
      budgetTotal: 30000,
    },
  },
  {
    mockId: "c4",
    email: "renault@publeader.local",
    password: "renault123!",
    name: "Isabelle Garnier",
    phone: "+33 1 76 84 00 00",
    company: {
      companyName: "Renault Électrique",
      contactName: "Isabelle Garnier",
      domain: "renault.com",
      sector: "Automobile",
      city: "Lyon",
      website: "https://www.renault.fr",
      description:
        "Promotion de notre nouvelle gamme de véhicules électriques dans les métropoles françaises.",
      headquarters: "Boulogne-Billancourt, France",
      founded: "1899",
      employees: "500+",
      budgetTotal: 22000,
    },
  },
  {
    mockId: "c6",
    email: "openai@publeader.local",
    password: "openai123!",
    name: "Sophie Laurent",
    phone: "+33 1 55 00 00 00",
    company: {
      companyName: "OpenAI",
      contactName: "Sophie Laurent",
      domain: "openai.com",
      sector: "Technologie",
      city: "Paris",
      website: "https://openai.com",
      description:
        "Promotion de ChatGPT et des solutions d'intelligence artificielle auprès du grand public français.",
      headquarters: "Paris, France",
      founded: "2015",
      employees: "100-500",
      budgetTotal: 40000,
    },
  },
  {
    mockId: "c7",
    email: "fedex@publeader.local",
    password: "fedex123!",
    name: "Antoine Bernard",
    phone: "+33 1 60 00 00 00",
    company: {
      companyName: "FedEx France",
      contactName: "Antoine Bernard",
      domain: "fedex.com",
      sector: "Autre",
      city: "Lyon",
      website: "https://www.fedex.com/fr",
      description:
        "Campagne de visibilité pour les services de livraison express FedEx dans les grandes métropoles.",
      headquarters: "Lyon, France",
      founded: "1971",
      employees: "500+",
      budgetTotal: 28000,
    },
  },
  {
    mockId: "c8",
    email: "lego@publeader.local",
    password: "lego123!",
    name: "Marie Fontaine",
    phone: "+33 1 42 00 00 00",
    company: {
      companyName: "LEGO France",
      contactName: "Marie Fontaine",
      domain: "lego.com",
      sector: "Divertissement",
      city: "Paris",
      website: "https://www.lego.com/fr-fr",
      description:
        "Campagne de Noël pour promouvoir les nouvelles gammes LEGO auprès des familles dans les zones commerciales.",
      headquarters: "Paris, France",
      founded: "1932",
      employees: "50-100",
      budgetTotal: 22000,
    },
  },
  {
    mockId: "c9",
    email: "louisvuitton@publeader.local",
    password: "lv123!",
    name: "Élise Morel",
    phone: "+33 1 70 00 00 00",
    company: {
      companyName: "Louis Vuitton",
      contactName: "Élise Morel",
      domain: "louisvuitton.com",
      sector: "Mode & Sport",
      city: "Paris",
      website: "https://www.louisvuitton.com",
      description:
        "Campagne prestige pour la nouvelle collection printemps-été. Véhicules premium uniquement dans les quartiers luxe.",
      headquarters: "Paris, France",
      founded: "1854",
      employees: "500+",
      budgetTotal: 60000,
    },
  },
  {
    mockId: "c10",
    email: "spotify@publeader.local",
    password: "spotify123!",
    name: "Lucas Perrin",
    phone: "+33 1 80 00 00 00",
    company: {
      companyName: "Spotify",
      contactName: "Lucas Perrin",
      domain: "spotify.com",
      sector: "Divertissement",
      city: "Marseille",
      website: "https://www.spotify.com",
      description:
        "Promotion de Spotify Premium et des podcasts exclusifs dans le sud de la France.",
      headquarters: "Marseille, France",
      founded: "2006",
      employees: "100-500",
      budgetTotal: 25000,
    },
  },
];

async function wipeCompany(email: string) {
  const existing = await db.collection("user").findOne({ email });
  if (!existing) return;
  const userIdStr = existing._id.toString();
  await db.collection("session").deleteMany({ userId: userIdStr });
  await db.collection("account").deleteMany({ userId: userIdStr });
  await db.collection(Collections.companies).deleteMany({ userId: userIdStr });
  await db.collection("user").deleteOne({ _id: existing._id });
  console.log(`[seed] wiped existing ${email}`);
}

async function createCompany(c: DemoCompany): Promise<{
  mockId: string;
  companyId: string;
}> {
  await auth.api.signUpEmail({
    body: { email: c.email, password: c.password, name: c.name },
    asResponse: false,
  });

  const created = await db.collection("user").findOne({ email: c.email });
  if (!created) {
    throw new Error(`signUpEmail succeeded but ${c.email} missing`);
  }
  const userIdStr = created._id.toString();

  const updateRes = await db.collection("user").updateOne(
    { email: c.email },
    {
      $set: {
        role: "advertiser",
        status: "validated",
        emailVerified: true,
        phone: c.phone,
      },
    },
  );
  if (updateRes.matchedCount === 0) {
    throw new Error(`failed to update user ${c.email}`);
  }

  const ins = await db.collection(Collections.companies).insertOne({
    userId: userIdStr,
    companyName: c.company.companyName,
    contactName: c.company.contactName,
    phone: c.phone,
    domain: c.company.domain,
    sector: c.company.sector,
    city: c.company.city,
    website: c.company.website,
    description: c.company.description,
    headquarters: c.company.headquarters,
    founded: c.company.founded,
    employees: c.company.employees,
    status: "validated",
    budgetTotal: c.company.budgetTotal,
    campaignsCount: 0,
    createdAt: new Date(),
  });
  const companyId = ins.insertedId.toString();

  await db
    .collection("user")
    .updateOne({ email: c.email }, { $set: { companyId } });

  console.log(`[seed] company linked: ${c.email} → ${companyId}`);
  return { mockId: c.mockId, companyId };
}

async function main() {
  console.log("\n=== wiping existing demo companies ===");
  for (const c of COMPANIES) await wipeCompany(c.email);

  console.log("\n=== creating demo companies ===");
  const mapping: Record<string, string> = {};
  for (const c of COMPANIES) {
    const { mockId, companyId } = await createCompany(c);
    mapping[mockId] = companyId;
  }

  console.log("\n✅ Companies seeded. Mock → real ID mapping:");
  console.log(JSON.stringify(mapping, null, 2));

  await mongoClient.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoClient.close(); } catch {}
  process.exit(1);
});
