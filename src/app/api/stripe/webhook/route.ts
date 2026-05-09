import { NextRequest, NextResponse } from "next/server";
import {
  StripeServiceError,
  constructWebhookEvent,
  handleStripeEvent,
} from "@/lib/stripe-service";
import { StripeNotConfiguredError } from "@/lib/stripe";

// Stripe signature verification requires the raw request body. We disable
// Next's body parsing implicitly by reading req.text() on the App Router
// stream — that gives us the exact bytes Stripe signed.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let event;
  try {
    event = await constructWebhookEvent(rawBody, signature);
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) {
      return NextResponse.json(
        { error: "stripe_not_configured" },
        { status: 503 },
      );
    }
    if (e instanceof StripeServiceError) {
      return NextResponse.json({ error: e.code }, { status: 400 });
    }
    return NextResponse.json(
      { error: "signature_verification_failed" },
      { status: 400 },
    );
  }

  try {
    await handleStripeEvent(event);
  } catch (e) {
    // Surfacing 5xx tells Stripe to retry. Log so we know which event failed.
    console.error("[stripe webhook] handler failed", {
      eventId: event.id,
      type: event.type,
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
