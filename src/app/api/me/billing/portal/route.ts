import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import { BillingError, createPortalSession } from "@/lib/billing-service";

export const dynamic = "force-dynamic";

const STATUS_BY_CODE: Record<string, number> = {
  company_not_found: 404,
  stripe_not_configured: 503,
  stripe_error: 502,
};

type Body = { returnUrl?: string };

export async function POST(req: NextRequest) {
  const a = await requireAdvertiser(req.headers);
  if (!a.ok) return a.response;

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty body allowed */
  }

  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const returnUrl =
    body.returnUrl?.startsWith(site) || body.returnUrl?.startsWith("/")
      ? body.returnUrl.startsWith("/")
        ? `${site}${body.returnUrl}`
        : body.returnUrl
      : `${site}/enterprise/facturation`;

  try {
    const { url } = await createPortalSession(a.user.companyId!, returnUrl);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof BillingError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[me/billing/portal]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
