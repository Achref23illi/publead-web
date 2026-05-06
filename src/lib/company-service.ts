import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  COMPANY_LEGAL_FORMS,
  Collections,
  type CompanyDoc,
} from "./schemas";

export type CompanyProfileUpdates = {
  companyName?: string;
  contactName?: string;
  phone?: string;
  domain?: string;
  sector?: string;
  city?: string;
  website?: string;
  description?: string;
  founded?: string;
  headquarters?: string;
  employees?: string;
  brandColor?: string;
  legalName?: string;
  siret?: string;
  vatNumber?: string;
  legalForm?: CompanyDoc["legalForm"];
};

export class CompanyUpdateError extends Error {
  constructor(
    public readonly code:
      | "invalid_name"
      | "invalid_phone"
      | "invalid_color"
      | "invalid_siret"
      | "invalid_vat"
      | "invalid_legal_form"
      | "invalid_url"
      | "invalid_field",
    message: string,
  ) {
    super(message);
    this.name = "CompanyUpdateError";
  }
}

const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
const SIRET_REGEX = /^\d{14}$/;
// EU VAT shape: 2-letter country code + alphanumeric block. Loose check.
const VAT_REGEX = /^[A-Z]{2}[A-Z0-9]{8,12}$/;

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function updateCompanyProfile(
  companyId: string,
  updates: CompanyProfileUpdates,
): Promise<CompanyDoc> {
  const company = (await db
    .collection(Collections.companies)
    .findOne({ _id: new ObjectId(companyId) })) as CompanyDoc | null;
  if (!company) throw new Error("company not found");

  const $set: Record<string, unknown> = {};

  if (updates.companyName !== undefined) {
    const v = updates.companyName.trim();
    if (!v)
      throw new CompanyUpdateError("invalid_name", "companyName cannot be empty");
    $set.companyName = v;
  }
  if (updates.contactName !== undefined) {
    const v = updates.contactName.trim();
    if (!v)
      throw new CompanyUpdateError("invalid_name", "contactName cannot be empty");
    $set.contactName = v;
  }
  if (updates.phone !== undefined) {
    const v = updates.phone.trim();
    if (!v) throw new CompanyUpdateError("invalid_phone", "phone cannot be empty");
    $set.phone = v;
  }
  for (const f of [
    "domain",
    "sector",
    "city",
    "description",
    "founded",
    "headquarters",
    "employees",
  ] as const) {
    if (updates[f] !== undefined) {
      $set[f] = (updates[f] as string).trim();
    }
  }
  if (updates.website !== undefined) {
    const v = normalizeUrl(updates.website);
    if (v) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _check = new URL(v);
      } catch {
        throw new CompanyUpdateError("invalid_url", "invalid website URL");
      }
    }
    $set.website = v;
  }
  if (updates.brandColor !== undefined) {
    const v = updates.brandColor.trim();
    if (v && !HEX_COLOR.test(v)) {
      throw new CompanyUpdateError(
        "invalid_color",
        "brandColor must be a valid hex (#RGB or #RRGGBB)",
      );
    }
    $set.brandColor = v || null;
  }
  if (updates.legalName !== undefined) {
    $set.legalName = updates.legalName.trim();
  }
  if (updates.siret !== undefined) {
    const v = updates.siret.replace(/\s+/g, "");
    if (v && !SIRET_REGEX.test(v)) {
      throw new CompanyUpdateError(
        "invalid_siret",
        "siret must be 14 digits",
      );
    }
    $set.siret = v;
  }
  if (updates.vatNumber !== undefined) {
    const v = updates.vatNumber.replace(/\s+/g, "").toUpperCase();
    if (v && !VAT_REGEX.test(v)) {
      throw new CompanyUpdateError(
        "invalid_vat",
        "vatNumber format invalid (e.g. FR12345678901)",
      );
    }
    $set.vatNumber = v;
  }
  if (updates.legalForm !== undefined) {
    if (
      updates.legalForm &&
      !COMPANY_LEGAL_FORMS.includes(updates.legalForm)
    ) {
      throw new CompanyUpdateError(
        "invalid_legal_form",
        "legalForm not allowed",
      );
    }
    $set.legalForm = updates.legalForm;
  }

  if (Object.keys($set).length === 0) {
    return company;
  }

  await db
    .collection(Collections.companies)
    .updateOne({ _id: company._id }, { $set });

  const fresh = (await db
    .collection(Collections.companies)
    .findOne({ _id: company._id })) as CompanyDoc;
  return fresh;
}

export async function setCompanyLogo(
  companyId: string,
  next: { publicId: string; url: string; bytes: number },
): Promise<CompanyDoc> {
  const company = (await db
    .collection(Collections.companies)
    .findOne({ _id: new ObjectId(companyId) })) as CompanyDoc | null;
  if (!company) throw new Error("company not found");

  const previousPublicId = company.logo?.publicId;

  await db.collection(Collections.companies).updateOne(
    { _id: company._id },
    {
      $set: {
        logo: next,
        // Mirror url onto legacy field so older mobile screens keep working.
        logoUrl: next.url,
      },
    },
  );

  // Best-effort cleanup of previous asset.
  if (previousPublicId && previousPublicId !== next.publicId) {
    const { deleteAsset } = await import("./cloudinary");
    await deleteAsset(previousPublicId, "image");
  }

  const fresh = (await db
    .collection(Collections.companies)
    .findOne({ _id: company._id })) as CompanyDoc;
  return fresh;
}

export async function clearCompanyLogo(companyId: string): Promise<CompanyDoc> {
  const company = (await db
    .collection(Collections.companies)
    .findOne({ _id: new ObjectId(companyId) })) as CompanyDoc | null;
  if (!company) throw new Error("company not found");

  await db
    .collection(Collections.companies)
    .updateOne(
      { _id: company._id },
      { $unset: { logo: "", logoUrl: "" } },
    );

  if (company.logo?.publicId) {
    const { deleteAsset } = await import("./cloudinary");
    await deleteAsset(company.logo.publicId, "image");
  }

  const fresh = (await db
    .collection(Collections.companies)
    .findOne({ _id: company._id })) as CompanyDoc;
  return fresh;
}
