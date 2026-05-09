import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import {
  BillingError,
  getBillingDashboard,
  updateBillingProfile,
  type BillingProfilePatch,
} from "@/lib/billing-service";

export const dynamic = "force-dynamic";

const STATUS_BY_CODE: Record<string, number> = {
  company_not_found: 404,
  invalid_input: 400,
  stripe_not_configured: 503,
  stripe_error: 502,
};

export async function GET(req: NextRequest) {
  const a = await requireAdvertiser(req.headers);
  if (!a.ok) return a.response;
  try {
    const data = await getBillingDashboard(a.user.companyId!);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof BillingError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const a = await requireAdvertiser(req.headers);
  if (!a.ok) return a.response;
  let body: BillingProfilePatch;
  try {
    body = (await req.json()) as BillingProfilePatch;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const profile = await updateBillingProfile(a.user.companyId!, body);
    return NextResponse.json({ profile });
  } catch (e) {
    if (e instanceof BillingError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[me/billing] PUT", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
