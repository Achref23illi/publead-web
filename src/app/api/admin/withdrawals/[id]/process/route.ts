import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/session";
import { processWithdrawal } from "@/lib/wallet";
import { actorFromSession, recordAudit } from "@/lib/audit-service";

type Body = {
  decision?: "paid" | "rejected";
  payoutReference?: string;
  rejectReason?: string;
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(req.headers);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  if (body.decision !== "paid" && body.decision !== "rejected") {
    return NextResponse.json(
      { error: "decision must be 'paid' or 'rejected'" },
      { status: 400 },
    );
  }
  if (body.decision === "rejected" && !body.rejectReason?.trim()) {
    return NextResponse.json(
      { error: "rejectReason required" },
      { status: 400 },
    );
  }

  try {
    const updated = await processWithdrawal({
      withdrawalId: id,
      adminUserId: auth.user.id,
      decision: body.decision,
      payoutReference: body.payoutReference?.trim(),
      rejectReason: body.rejectReason?.trim(),
    });
    await recordAudit({
      ...actorFromSession(auth.user),
      action: body.decision === "paid" ? "withdrawal.process" : "withdrawal.reject",
      targetType: "withdrawal",
      targetId: id,
      meta: {
        decision: body.decision,
        payoutReference: body.payoutReference?.trim(),
        rejectReason: body.rejectReason?.trim(),
      },
    });
    return NextResponse.json({
      withdrawal: {
        id: updated._id!.toString(),
        status: updated.status,
        processedAt: updated.processedAt?.toISOString(),
      },
    });
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? "process failed";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
