import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { signUpload } from "@/lib/cloudinary";
import { REQUIRED_DOC_TYPES, type DocumentType } from "@/lib/schemas";

type Body = {
  scope?: "document" | "asset" | "visual";
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
