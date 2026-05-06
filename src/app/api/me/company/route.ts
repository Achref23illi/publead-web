import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import {
  CompanyUpdateError,
  updateCompanyProfile,
  type CompanyProfileUpdates,
} from "@/lib/company-service";

function serializeCompany(c: import("@/lib/schemas").CompanyDoc) {
  return {
    id: c._id!.toString(),
    companyName: c.companyName,
    contactName: c.contactName,
    phone: c.phone,
    domain: c.domain,
    sector: c.sector,
    city: c.city,
    website: c.website,
    description: c.description,
    founded: c.founded,
    headquarters: c.headquarters,
    employees: c.employees,
    brandColor: c.brandColor,
    logo: c.logo,
    logoUrl: c.logoUrl,
    legalName: c.legalName,
    siret: c.siret,
    vatNumber: c.vatNumber,
    legalForm: c.legalForm,
    status: c.status,
    budgetTotal: c.budgetTotal,
    campaignsCount: c.campaignsCount,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ company: serializeCompany(auth.company) });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as CompanyProfileUpdates;

  try {
    const updated = await updateCompanyProfile(
      auth.company._id!.toString(),
      body,
    );
    return NextResponse.json({ company: serializeCompany(updated) });
  } catch (e) {
    if (e instanceof CompanyUpdateError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
