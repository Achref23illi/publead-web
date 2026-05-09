import { NextRequest, NextResponse } from "next/server";
import { requireAdvertiser } from "@/lib/session";
import { InvoiceError, getInvoice } from "@/lib/invoice-service";
import {
  StripeServiceError,
  createCheckoutSessionForInvoice,
} from "@/lib/stripe-service";
import { StripeNotConfiguredError } from "@/lib/stripe";

const STATUS_BY_CODE: Record<string, number> = {
  invoice_not_found: 404,
  invoice_already_paid: 409,
  invoice_not_sendable: 409,
  missing_email: 400,
  stripe_error: 502,
};

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAdvertiser(req.headers);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  // Authorize: invoice must belong to the caller's company.
  let invoice;
  try {
    invoice = await getInvoice(id);
  } catch (e) {
    if (e instanceof InvoiceError && e.code === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw e;
  }
  if (invoice.companyId !== auth.user.companyId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const { url, sessionId } = await createCheckoutSessionForInvoice({
      invoiceId: id,
    });
    return NextResponse.json({ url, sessionId });
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) {
      return NextResponse.json(
        { error: "stripe_not_configured" },
        { status: 503 },
      );
    }
    if (e instanceof StripeServiceError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: STATUS_BY_CODE[e.code] ?? 400 },
      );
    }
    console.error("[stripe] checkout creation failed", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
