import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import { clearCompanyLogo, setCompanyLogo } from "@/lib/company-service";

type Body = {
  publicId?: string;
  url?: string;
  bytes?: number;
};

export async function PUT(req: NextRequest) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.publicId || !body.url || !body.bytes) {
    return NextResponse.json(
      { error: "publicId, url, bytes required" },
      { status: 400 },
    );
  }
  if (body.bytes > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "logo exceeds 5MB" },
      { status: 400 },
    );
  }

  const updated = await setCompanyLogo(auth.company._id!.toString(), {
    publicId: body.publicId,
    url: body.url,
    bytes: body.bytes,
  });

  return NextResponse.json({
    logo: updated.logo,
    logoUrl: updated.logoUrl,
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;

  await clearCompanyLogo(auth.company._id!.toString());
  return NextResponse.json({ ok: true });
}
