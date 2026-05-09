import { ObjectId } from "mongodb";
import JSZip from "jszip";
import { randomBytes } from "crypto";
import { db } from "./db";
import {
  Collections,
  type AssetDoc,
  type CampaignDoc,
  type CompanyDoc,
  type DocumentDoc,
  type DriverDoc,
  type GdprDeletionDoc,
  type InvoiceDoc,
  type PartnerDoc,
  type PartnerPayoutDoc,
  type TerminalDoc,
  type TransactionDoc,
  type VehicleDoc,
  type WithdrawalDoc,
} from "./schemas";
import { deleteAsset, deleteAssets } from "./cloudinary";

export class GdprError extends Error {
  constructor(
    public readonly code: "user_not_found" | "already_deleted",
    message: string,
  ) {
    super(message);
    this.name = "GdprError";
  }
}

type RawUser = {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  role?: string;
  status?: string;
  phone?: string;
  driverId?: string;
  companyId?: string;
  partnerId?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
};

async function loadUser(userId: string): Promise<RawUser> {
  const user = (await db
    .collection("user")
    .findOne({ id: userId })) as RawUser | null;
  if (!user) {
    throw new GdprError("user_not_found", "user not found");
  }
  return user;
}

// --- Export ---------------------------------------------------------------

export async function buildUserExport(userId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const user = await loadUser(userId);
  const zip = new JSZip();

  zip.file("user.json", JSON.stringify(user, null, 2));

  // Driver branch -------------------------------------------------------
  if (user.driverId && ObjectId.isValid(user.driverId)) {
    const driver = (await db
      .collection(Collections.drivers)
      .findOne({ _id: new ObjectId(user.driverId) })) as DriverDoc | null;
    if (driver) zip.file("driver.json", JSON.stringify(driver, null, 2));

    const [transactions, withdrawals, vehicles, documents] = await Promise.all([
      db
        .collection(Collections.transactions)
        .find({ driverId: user.driverId })
        .toArray() as Promise<TransactionDoc[]>,
      db
        .collection(Collections.withdrawals)
        .find({ driverId: user.driverId })
        .toArray() as Promise<WithdrawalDoc[]>,
      db
        .collection(Collections.vehicles)
        .find({ driverId: user.driverId })
        .toArray() as Promise<VehicleDoc[]>,
      db
        .collection(Collections.documents)
        .find({ driverId: user.driverId })
        .toArray() as Promise<DocumentDoc[]>,
    ]);
    zip.file("transactions.json", JSON.stringify(transactions, null, 2));
    zip.file("withdrawals.json", JSON.stringify(withdrawals, null, 2));
    zip.file("vehicles.json", JSON.stringify(vehicles, null, 2));
    zip.file("documents.json", JSON.stringify(documents, null, 2));
  }

  // Advertiser branch ---------------------------------------------------
  if (user.companyId && ObjectId.isValid(user.companyId)) {
    const company = (await db
      .collection(Collections.companies)
      .findOne({ _id: new ObjectId(user.companyId) })) as CompanyDoc | null;
    if (company) zip.file("company.json", JSON.stringify(company, null, 2));

    const [campaigns, invoices, assets] = await Promise.all([
      db
        .collection(Collections.campaigns)
        .find({ companyId: user.companyId })
        .toArray() as Promise<CampaignDoc[]>,
      db
        .collection(Collections.invoices)
        .find({ companyId: user.companyId })
        .toArray() as Promise<InvoiceDoc[]>,
      db
        .collection(Collections.assets)
        .find({ companyId: user.companyId })
        .toArray() as Promise<AssetDoc[]>,
    ]);
    zip.file("campaigns.json", JSON.stringify(campaigns, null, 2));
    zip.file("invoices.json", JSON.stringify(invoices, null, 2));
    zip.file("assets.json", JSON.stringify(assets, null, 2));
  }

  // Partner branch ------------------------------------------------------
  if (user.partnerId && ObjectId.isValid(user.partnerId)) {
    const partner = (await db
      .collection(Collections.partners)
      .findOne({ _id: new ObjectId(user.partnerId) })) as PartnerDoc | null;
    if (partner) zip.file("partner.json", JSON.stringify(partner, null, 2));

    const [terminals, payouts] = await Promise.all([
      db
        .collection(Collections.terminals)
        .find({ partnerId: user.partnerId })
        .toArray() as Promise<TerminalDoc[]>,
      db
        .collection(Collections.partnerPayouts)
        .find({ partnerId: user.partnerId })
        .toArray() as Promise<PartnerPayoutDoc[]>,
    ]);
    zip.file("terminals.json", JSON.stringify(terminals, null, 2));
    zip.file("payouts.json", JSON.stringify(payouts, null, 2));
  }

  // Manifest with policy + generation metadata.
  const manifest = {
    userId,
    email: user.email,
    role: user.role,
    generatedAt: new Date().toISOString(),
    note:
      "Cette archive contient toutes les données personnelles que Publeader détient à votre sujet, " +
      "conformément à votre droit d'accès (RGPD Art. 15).",
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return {
    buffer,
    filename: `donnees-${user.email.replace(/[^a-z0-9]+/gi, "-")}-${Date.now()}.zip`,
  };
}

// --- Anonymize ------------------------------------------------------------

function placeholderEmail(userId: string): string {
  return `anonymized-${userId}@deleted.local`;
}

export async function anonymizeUser(userId: string): Promise<void> {
  const user = await loadUser(userId);

  const existing = (await db
    .collection(Collections.gdprDeletions)
    .findOne({ userId })) as GdprDeletionDoc | null;
  if (existing) {
    throw new GdprError("already_deleted", "user already anonymized");
  }

  const now = new Date();

  // 1. User row: replace PII + invalidate password.
  await db.collection("user").updateOne(
    { id: userId },
    {
      $set: {
        email: placeholderEmail(userId),
        name: "Anonymized User",
        phone: null,
        emailVerified: false,
        // banned blocks new logins via better-auth even if a session token leaks.
        banned: true,
        banReason: "GDPR right-to-erasure",
        banExpires: null,
        updatedAt: now,
      },
    },
  );
  // Rotate password to a random value so any future login attempt fails.
  // Better-auth stores password under the `account` collection.
  await db
    .collection("account")
    .updateMany(
      { userId },
      { $set: { password: randomBytes(32).toString("hex"), updatedAt: now } },
    );
  // Wipe sessions.
  await db.collection("session").deleteMany({ userId });

  // 2. Role-specific anonymization.
  if (user.driverId && ObjectId.isValid(user.driverId)) {
    await db.collection(Collections.drivers).updateOne(
      { _id: new ObjectId(user.driverId) },
      {
        $set: {
          firstName: "Anonymized",
          lastName: `(${userId.slice(0, 6)})`,
          phone: "",
          city: "",
          bankAccount: undefined,
        },
      },
    );

    // Delete uploaded documents from Cloudinary, then strip URLs. DocumentDoc
    // stores files as FileMeta[]; we flatten across the user's docs.
    const docs = (await db
      .collection(Collections.documents)
      .find({ driverId: user.driverId })
      .project({ files: 1 })
      .toArray()) as Array<{
      _id: ObjectId;
      files?: { publicId: string; resourceType?: "image" | "raw" | "video" }[];
    }>;
    const toDelete = docs.flatMap((d) =>
      (d.files ?? [])
        .filter((f) => f.publicId)
        .map((f) => ({
          publicId: f.publicId,
          resourceType: f.resourceType ?? "image",
        })),
    );
    await deleteAssets(toDelete);
    await db
      .collection(Collections.documents)
      .updateMany(
        { driverId: user.driverId },
        { $set: { files: [], rejectReason: "anonymized" } },
      );

    // Vehicle photos.
    const vehicles = (await db
      .collection(Collections.vehicles)
      .find({ driverId: user.driverId })
      .project({ photos: 1 })
      .toArray()) as Array<{ _id: ObjectId; photos?: { publicId?: string }[] }>;
    const allPhotos = vehicles.flatMap((v) =>
      (v.photos ?? [])
        .filter((p) => p.publicId)
        .map((p) => ({ publicId: p.publicId!, resourceType: "image" as const })),
    );
    await deleteAssets(allPhotos);
    await db
      .collection(Collections.vehicles)
      .updateMany(
        { driverId: user.driverId },
        { $set: { photos: [], licensePlate: "REDACTED" } },
      );
  }

  if (user.companyId && ObjectId.isValid(user.companyId)) {
    // Pull current logo for cloudinary cleanup.
    const company = (await db
      .collection(Collections.companies)
      .findOne(
        { _id: new ObjectId(user.companyId) },
        { projection: { logo: 1 } },
      )) as Pick<CompanyDoc, "_id" | "logo"> | null;
    if (company?.logo?.publicId) {
      await deleteAsset(company.logo.publicId, "image");
    }
    await db.collection(Collections.companies).updateOne(
      { _id: new ObjectId(user.companyId) },
      {
        $set: {
          companyName: "Anonymized Company",
          contactName: "-",
          phone: "",
          domain: "",
          city: "",
          website: undefined,
          description: undefined,
          headquarters: undefined,
          legalName: undefined,
          siret: undefined,
          vatNumber: undefined,
          logo: undefined,
          logoUrl: undefined,
        },
      },
    );
  }

  if (user.partnerId && ObjectId.isValid(user.partnerId)) {
    await db.collection(Collections.partners).updateOne(
      { _id: new ObjectId(user.partnerId) },
      {
        $set: {
          businessName: "Anonymized Partner",
          managerName: "-",
          phone: "",
          address: "",
          city: "",
          openingHours: undefined,
        },
      },
    );
  }

  // 3. Compliance trail.
  await db.collection(Collections.gdprDeletions).insertOne({
    userId,
    email: user.email,
    role: user.role ?? "unknown",
    anonymizedAt: now,
  });
}
