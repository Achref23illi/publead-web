import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { signUpload } from "@/lib/cloudinary";
import { REQUIRED_DOC_TYPES, type DocumentType } from "@/lib/schemas";

type Body = {
  scope?: "document" | "asset" | "visual" | "company_logo";
  documentType?: DocumentType;
};

export async function POST(req: NextRequest) {
  const auth = await requireSession(req.headers);
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as Body;
  const scope = body.scope ?? "document";

  let folder = `publeader/${scope}`;
  if (scope === "document") {
    if (auth.user.role !== "driver") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (
      !body.documentType ||
      !REQUIRED_DOC_TYPES.includes(body.documentType)
    ) {
      return NextResponse.json(
        { error: "invalid documentType" },
        { status: 400 },
      );
    }
    if (!auth.user.driverId) {
      return NextResponse.json(
        { error: "driver profile missing" },
        { status: 409 },
      );
    }
    folder = `publeader/documents/${auth.user.driverId}/${body.documentType}`;
  } else if (scope === "company_logo") {
    if (auth.user.role !== "advertiser") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (!auth.user.companyId) {
      return NextResponse.json(
        { error: "company profile missing" },
        { status: 409 },
      );
    }
    folder = `publeader/companies/${auth.user.companyId}/logo`;
  }

  try {
    const signed = signUpload({ folder });
    return NextResponse.json(signed);
  } catch (e) {
    console.error("[uploads/sign]", e);
    return NextResponse.json(
      { error: "signing failed — check Cloudinary env" },
      { status: 500 },
    );
  }
}
