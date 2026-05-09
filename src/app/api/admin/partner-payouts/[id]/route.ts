import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import {
  PartnerRevenueServiceError,
  markPayoutPaid,
} from "@/lib/partner-revenue-service";
import { serializePayout } from "@/lib/partner-revenue-serializer";
import { actorFromSession, recordAudit } from "@/lib/audit-service";

const STATUS_BY_CODE: Record<string, number> = {
  not_found: 404,
  payout_finalized: 409,
};

type RouteCtx = { params: Promise<{ id: string }> };

type PatchBody = {
  action?: "mark_paid";
  payoutReference?: string;
};

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (body.action !== "mark_paid") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
  try {
    const payout = await markPayoutPaid(id, auth.user.id, body.payoutReference);
    await recordAudit({
      ...actorFromSession(auth.user),
      action: "partner_payout.mark_paid",
      targetType: "partner_payout",
      targetId: id,
      meta: { payoutReference: body.payoutReference, totalCents: payout.totalCents },
    });
    return NextResponse.json({ payout: serializePayout(payout) });
  } catch (e) {
    if (e instanceof PartnerRevenueServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
