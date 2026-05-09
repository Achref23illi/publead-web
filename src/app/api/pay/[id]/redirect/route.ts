import { NextRequest, NextResponse } from "next/server";
import { InvoiceError, getInvoice } from "@/lib/invoice-service";
import {
  StripeServiceError,
  createCheckoutSessionForInvoice,
} from "@/lib/stripe-service";
import { StripeNotConfiguredError } from "@/lib/stripe";

// Public pay link sent to the customer by email. Treats the invoice ObjectId
// as a bearer token — anyone holding the link can initiate payment, which is
// fine since they can only pay (not view sensitive data, not steal funds).
// Generates a fresh Checkout Session on each click so old links never go
// stale; Stripe returns the customer to NEXT_PUBLIC_SITE_URL after payment.

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  try {
    await getInvoice(id);
  } catch (e) {
    if (e instanceof InvoiceError && e.code === "not_found") {
      return NextResponse.redirect(`${site}/pay/error?code=not_found`);
    }
    throw e;
  }

  try {
    const { url } = await createCheckoutSessionForInvoice({ invoiceId: id });
    return NextResponse.redirect(url, 303);
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) {
      return NextResponse.redirect(`${site}/pay/error?code=unavailable`);
    }
    if (e instanceof StripeServiceError) {
      return NextResponse.redirect(`${site}/pay/error?code=${e.code}`);
    }
    console.error("[pay redirect] failed", e);
    return NextResponse.redirect(`${site}/pay/error?code=internal`);
  }
}
