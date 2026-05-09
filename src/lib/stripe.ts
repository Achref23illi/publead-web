import Stripe from "stripe";

// Lazy singleton. Importing this file is safe even when STRIPE_SECRET_KEY is
// unset (e.g. local dev without billing) — only the first call to getStripe()
// validates the env. Routes that need Stripe surface a 503 if the key is
// missing instead of crashing at import time.

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new StripeNotConfiguredError();
  }
  cached = new Stripe(key, {
    typescript: true,
  });
  return cached;
}

export function stripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new StripeNotConfiguredError();
  return secret;
}

export function stripeCurrency(): string {
  return (process.env.STRIPE_CURRENCY || "eur").toLowerCase();
}

export function stripeReturnUrls(invoiceRef: string): {
  successUrl: string;
  cancelUrl: string;
} {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const success =
    process.env.STRIPE_SUCCESS_URL ||
    `${site}/enterprise/facturation?paid=${encodeURIComponent(invoiceRef)}`;
  const cancel =
    process.env.STRIPE_CANCEL_URL ||
    `${site}/enterprise/facturation?canceled=${encodeURIComponent(invoiceRef)}`;
  return { successUrl: success, cancelUrl: cancel };
}

export class StripeNotConfiguredError extends Error {
  constructor() {
    super(
      "Stripe is not configured: set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET",
    );
    this.name = "StripeNotConfiguredError";
  }
}

export { Stripe };
