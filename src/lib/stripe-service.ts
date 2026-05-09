import { ObjectId } from "mongodb";
import type Stripe from "stripe";
import { db } from "./db";
import {
  Collections,
  type CompanyDoc,
  type StripeEventDoc,
} from "./schemas";
import {
  InvoiceError,
  attachStripeCheckoutSession,
  clearInvoiceDispute,
  findInvoiceByStripeChargeId,
  findInvoiceByStripePaymentIntentId,
  findInvoiceByStripeSessionId,
  getInvoice,
  markInvoiceDisputed,
  markInvoicePaid,
  markInvoiceRefunded,
  type InvoiceView,
} from "./invoice-service";
import {
  getStripe,
  stripeCurrency,
  stripeReturnUrls,
  stripeWebhookSecret,
} from "./stripe";

export class StripeServiceError extends Error {
  constructor(
    public readonly code:
      | "invoice_not_found"
      | "invoice_already_paid"
      | "invoice_not_sendable"
      | "missing_email"
      | "stripe_error",
    message: string,
  ) {
    super(message);
    this.name = "StripeServiceError";
  }
}

// Resolves the email Stripe should pre-fill on the Checkout page. Falls back
// to the company contact email if the caller did not pass an explicit one.
async function resolveCustomerEmail(
  invoice: InvoiceView,
  override?: string,
): Promise<string | undefined> {
  if (override) return override;
  if (invoice.sentTo) return invoice.sentTo;
  if (!ObjectId.isValid(invoice.companyId)) return undefined;
  const company = (await db
    .collection(Collections.companies)
    .findOne({ _id: new ObjectId(invoice.companyId) })) as CompanyDoc | null;
  if (!company?.userId || !ObjectId.isValid(company.userId)) return undefined;
  const user = (await db
    .collection("user")
    .findOne(
      { _id: new ObjectId(company.userId) },
      { projection: { email: 1 } },
    )) as { email?: string } | null;
  return user?.email;
}

// Creates a fresh Checkout Session for the invoice. Reuses the existing
// session id only if it has not expired and has not yet been paid; otherwise
// the Stripe Dashboard ends up with stale sessions and the URL we emailed
// could already be unusable. Simpler to always create a new one.
export async function createCheckoutSessionForInvoice(input: {
  invoiceId: string;
  customerEmail?: string;
}): Promise<{ url: string; sessionId: string }> {
  let invoice: InvoiceView;
  try {
    invoice = await getInvoice(input.invoiceId);
  } catch (e) {
    if (e instanceof InvoiceError && e.code === "not_found") {
      throw new StripeServiceError("invoice_not_found", "invoice not found");
    }
    throw e;
  }

  if (invoice.storedStatus === "payee") {
    throw new StripeServiceError(
      "invoice_already_paid",
      "invoice already paid",
    );
  }
  if (invoice.storedStatus === "brouillon") {
    throw new StripeServiceError(
      "invoice_not_sendable",
      "draft invoices cannot be paid — send the invoice first",
    );
  }

  const customerEmail = await resolveCustomerEmail(
    invoice,
    input.customerEmail,
  );
  // Reuse the company's Stripe Customer so saved payment methods auto-list
  // at Checkout and post-payment events tie back to the same customer in
  // the Stripe Dashboard.
  let customerId: string | undefined;
  try {
    const { ensureStripeCustomer } = await import("./billing-service");
    customerId = await ensureStripeCustomer(invoice.companyId);
  } catch {
    // Best-effort: fall back to email-only Checkout if customer creation fails.
  }
  const stripe = getStripe();
  const { successUrl, cancelUrl } = stripeReturnUrls(invoice.ref);
  const currency = stripeCurrency();

  // Build Stripe line items. Each invoice line maps 1:1; VAT, if any, is
  // appended as its own line so the Checkout total matches our invoice exactly
  // without relying on Stripe Tax.
  type LineItem = NonNullable<
    Stripe.Checkout.SessionCreateParams["line_items"]
  >[number];
  const lineItems: LineItem[] = invoice.lines.map((line) => ({
    quantity: line.qty,
    price_data: {
      currency,
      unit_amount: line.unitCents,
      product_data: { name: line.label },
    },
  }));
  if (invoice.taxCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: invoice.taxCents,
        product_data: { name: "TVA" },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    // customer wins over customer_email when both are passed; we pass email
    // only as fallback when customer creation didn't succeed.
    ...(customerId
      ? { customer: customerId }
      : { customer_email: customerEmail }),
    client_reference_id: invoice._id!.toString(),
    payment_intent_data: {
      description: `Facture ${invoice.ref}`,
      // Save the card on the customer for future invoice payments.
      setup_future_usage: customerId ? "off_session" : undefined,
      metadata: {
        invoiceId: invoice._id!.toString(),
        invoiceRef: invoice.ref,
        companyId: invoice.companyId,
      },
    },
    metadata: {
      invoiceId: invoice._id!.toString(),
      invoiceRef: invoice.ref,
      companyId: invoice.companyId,
    },
    line_items: lineItems,
  });

  await attachStripeCheckoutSession(input.invoiceId, session.id);

  if (!session.url) {
    throw new StripeServiceError(
      "stripe_error",
      "Stripe did not return a session URL",
    );
  }
  return { url: session.url, sessionId: session.id };
}

// --- Webhook event processing ---

export async function constructWebhookEvent(
  rawBody: string | Buffer,
  signatureHeader: string | null,
): Promise<Stripe.Event> {
  if (!signatureHeader) {
    throw new StripeServiceError(
      "stripe_error",
      "missing Stripe-Signature header",
    );
  }
  const stripe = getStripe();
  const secret = stripeWebhookSecret();
  return stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
}

// Returns true if this event was just recorded (caller should process it),
// false if it was a duplicate and should be skipped.
async function recordEvent(
  event: Stripe.Event,
  invoiceId?: string,
): Promise<boolean> {
  const doc: StripeEventDoc = {
    _id: event.id,
    type: event.type,
    receivedAt: new Date(),
    invoiceId,
  };
  try {
    // Cast: collection<StripeEventDoc> infers _id as ObjectId by default; we
    // use the Stripe event id (string) as the primary key for idempotency.
    await db
      .collection<StripeEventDoc>(Collections.stripeEvents)
      .insertOne(doc as unknown as StripeEventDoc & { _id: string });
    return true;
  } catch (e) {
    // E11000 duplicate key -> already processed
    const err = e as { code?: number };
    if (err.code === 11000) return false;
    throw e;
  }
}

function invoiceIdFromMetadata(meta?: Stripe.Metadata | null): string | undefined {
  const id = meta?.invoiceId;
  return id && ObjectId.isValid(id) ? id : undefined;
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Only act on actually-paid sessions (status === "paid"). Async
      // payments arrive via checkout.session.async_payment_succeeded.
      if (session.payment_status !== "paid") return;

      let invoiceId: string | undefined =
        invoiceIdFromMetadata(session.metadata) ??
        session.client_reference_id ??
        undefined;
      if (!invoiceId || !ObjectId.isValid(invoiceId)) {
        const inv = await findInvoiceByStripeSessionId(session.id);
        invoiceId = inv?._id?.toString();
      }
      if (!invoiceId) return;

      if (!(await recordEvent(event, invoiceId))) return;

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      let chargeId: string | undefined;
      if (paymentIntentId) {
        try {
          const stripe = getStripe();
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ["latest_charge"],
          });
          const latest = pi.latest_charge;
          chargeId =
            typeof latest === "string"
              ? latest
              : (latest as Stripe.Charge | null)?.id;
        } catch {
          // Best-effort; charge id is not required for marking paid.
        }
      }

      await markInvoicePaid(invoiceId, "stripe", session.id, {
        checkoutSessionId: session.id,
        paymentIntentId,
        chargeId,
      });
      return;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId: string | undefined =
        invoiceIdFromMetadata(session.metadata) ??
        session.client_reference_id ??
        undefined;
      if (!invoiceId || !ObjectId.isValid(invoiceId)) return;
      if (!(await recordEvent(event, invoiceId))) return;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      await markInvoicePaid(invoiceId, "stripe", session.id, {
        checkoutSessionId: session.id,
        paymentIntentId,
      });
      return;
    }

    case "payment_intent.payment_failed": {
      // No invoice mutation needed — invoice stays "envoyee". We just record
      // the event so future retries of the same id are deduped.
      const pi = event.data.object as Stripe.PaymentIntent;
      const invoiceId = invoiceIdFromMetadata(pi.metadata);
      await recordEvent(event, invoiceId);
      return;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      let invoiceId = invoiceIdFromMetadata(charge.metadata);
      if (!invoiceId) {
        const inv = await findInvoiceByStripeChargeId(charge.id);
        invoiceId = inv?._id?.toString();
      }
      if (!invoiceId) {
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (piId) {
          const inv = await findInvoiceByStripePaymentIntentId(piId);
          invoiceId = inv?._id?.toString();
        }
      }
      if (!invoiceId) return;
      if (!(await recordEvent(event, invoiceId))) return;
      const reason =
        charge.refunds?.data?.[0]?.reason || "refunded via Stripe";
      await markInvoiceRefunded(invoiceId, reason);
      return;
    }

    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId =
        typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;
      const inv = await findInvoiceByStripeChargeId(chargeId);
      const invoiceId = inv?._id?.toString();
      if (!invoiceId) return;
      if (!(await recordEvent(event, invoiceId))) return;
      await markInvoiceDisputed(invoiceId, dispute.reason);
      return;
    }

    case "charge.dispute.closed": {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId =
        typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;
      const inv = await findInvoiceByStripeChargeId(chargeId);
      const invoiceId = inv?._id?.toString();
      if (!invoiceId) return;
      if (!(await recordEvent(event, invoiceId))) return;
      // status: "won" | "lost" | "warning_closed"
      if (dispute.status === "won" || dispute.status === "warning_closed") {
        await clearInvoiceDispute(invoiceId);
      } else if (dispute.status === "lost") {
        // Dispute lost = funds reversed; treat like a refund.
        await markInvoiceRefunded(invoiceId, "dispute lost");
      }
      return;
    }

    default:
      // Unhandled event types are recorded so they don't blow up Stripe's
      // retry loop, but we take no further action.
      await recordEvent(event);
      return;
  }
}
