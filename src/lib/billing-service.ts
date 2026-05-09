import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  Collections,
  type CompanyDoc,
  type InvoiceDoc,
} from "./schemas";
import { getStripe, StripeNotConfiguredError } from "./stripe";

export class BillingError extends Error {
  constructor(
    public readonly code:
      | "company_not_found"
      | "invalid_input"
      | "stripe_not_configured"
      | "stripe_error",
    message: string,
  ) {
    super(message);
    this.name = "BillingError";
  }
}

export type SavedPaymentMethodDTO = {
  id: string;
  brand: string; // visa | mastercard | ...
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

export type BillingProfileDTO = {
  companyName: string;
  legalName?: string;
  siret?: string;
  vatNumber?: string;
  // Editable billing-specific fields.
  billingEmail?: string;
  billingAddress?: string;
  billingNote?: string;
};

export type BillingMetricsDTO = {
  // Sum of unpaid invoices (envoyée + en_retard).
  accountBalanceCents: number;
  pendingCount: number;
  // Paid this calendar month.
  mrrCents: number;
  // Lifetime paid total.
  totalSpendCents: number;
  // Overdue subset.
  overdueCents: number;
  overdueCount: number;
  // ISO date of next due invoice (oldest unpaid dueDate). Null if none open.
  nextDueDate: string | null;
};

export type BillingDashboardDTO = {
  profile: BillingProfileDTO;
  metrics: BillingMetricsDTO;
  paymentMethods: SavedPaymentMethodDTO[];
  hasStripeCustomer: boolean;
};

async function loadCompany(companyId: string): Promise<CompanyDoc> {
  if (!ObjectId.isValid(companyId)) {
    throw new BillingError("company_not_found", "company not found");
  }
  const c = (await db
    .collection(Collections.companies)
    .findOne({ _id: new ObjectId(companyId) })) as CompanyDoc | null;
  if (!c) throw new BillingError("company_not_found", "company not found");
  return c;
}

// Idempotent. If the company already has stripeCustomerId, returns it.
// Otherwise creates a Stripe Customer with company name + billing email and
// stores the id back on the doc.
export async function ensureStripeCustomer(
  companyId: string,
): Promise<string> {
  const company = await loadCompany(companyId);
  if (company.stripeCustomerId) return company.stripeCustomerId;

  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) {
      throw new BillingError("stripe_not_configured", e.message);
    }
    throw e;
  }

  const customer = await stripe.customers.create({
    name: company.companyName,
    email: company.billing?.email,
    address: company.billing?.address
      ? {
          line1: company.billing.address.slice(0, 200),
        }
      : undefined,
    metadata: {
      companyId,
      siret: company.siret ?? "",
      vatNumber: company.vatNumber ?? "",
    },
    tax_id_data: company.vatNumber
      ? [{ type: "eu_vat", value: company.vatNumber }]
      : undefined,
  });

  await db.collection(Collections.companies).updateOne(
    { _id: company._id! },
    { $set: { stripeCustomerId: customer.id } },
  );

  return customer.id;
}

export async function createPortalSession(
  companyId: string,
  returnUrl: string,
): Promise<{ url: string }> {
  const customer = await ensureStripeCustomer(companyId);
  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) {
      throw new BillingError("stripe_not_configured", e.message);
    }
    throw e;
  }
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: returnUrl,
    });
    if (!session.url) {
      throw new BillingError(
        "stripe_error",
        "Stripe did not return a portal URL",
      );
    }
    return { url: session.url };
  } catch (e) {
    if (e instanceof BillingError) throw e;
    throw new BillingError(
      "stripe_error",
      e instanceof Error ? e.message : String(e),
    );
  }
}

export async function listSavedPaymentMethods(
  companyId: string,
): Promise<SavedPaymentMethodDTO[]> {
  const company = await loadCompany(companyId);
  if (!company.stripeCustomerId) return [];
  let stripe;
  try {
    stripe = getStripe();
  } catch {
    // Stripe not configured -> return empty list; don't crash the dashboard.
    return [];
  }
  try {
    const [pmList, customer] = await Promise.all([
      stripe.paymentMethods.list({
        customer: company.stripeCustomerId,
        type: "card",
      }),
      stripe.customers.retrieve(company.stripeCustomerId),
    ]);
    const defaultId =
      typeof customer === "object" && !customer.deleted
        ? customer.invoice_settings?.default_payment_method
        : undefined;
    const defaultPmId =
      typeof defaultId === "string" ? defaultId : defaultId?.id;
    return pmList.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand ?? "card",
      last4: pm.card?.last4 ?? "----",
      expMonth: pm.card?.exp_month ?? 0,
      expYear: pm.card?.exp_year ?? 0,
      isDefault: pm.id === defaultPmId,
    }));
  } catch (e) {
    console.error("[billing] listSavedPaymentMethods", e);
    return [];
  }
}

export function serializeProfile(c: CompanyDoc): BillingProfileDTO {
  return {
    companyName: c.companyName,
    legalName: c.legalName,
    siret: c.siret,
    vatNumber: c.vatNumber,
    billingEmail: c.billing?.email,
    billingAddress: c.billing?.address,
    billingNote: c.billing?.note,
  };
}

export type BillingProfilePatch = {
  billingEmail?: string;
  billingAddress?: string;
  billingNote?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateBillingProfile(
  companyId: string,
  patch: BillingProfilePatch,
): Promise<BillingProfileDTO> {
  const company = await loadCompany(companyId);

  const billing = { ...(company.billing ?? {}) };
  if (patch.billingEmail !== undefined) {
    const v = patch.billingEmail.trim();
    if (v && !EMAIL_RE.test(v)) {
      throw new BillingError("invalid_input", "billingEmail invalid");
    }
    billing.email = v || undefined;
  }
  if (patch.billingAddress !== undefined) {
    billing.address = patch.billingAddress.trim() || undefined;
  }
  if (patch.billingNote !== undefined) {
    billing.note = patch.billingNote.trim() || undefined;
  }

  await db
    .collection(Collections.companies)
    .updateOne({ _id: company._id! }, { $set: { billing } });

  // Mirror the email + address change to the existing Stripe Customer (if
  // any) so the next Checkout pre-fills correctly.
  if (company.stripeCustomerId) {
    try {
      const stripe = getStripe();
      await stripe.customers.update(company.stripeCustomerId, {
        email: billing.email,
        address: billing.address ? { line1: billing.address.slice(0, 200) } : undefined,
      });
    } catch {
      /* best-effort */
    }
  }

  const updated = { ...company, billing };
  return serializeProfile(updated);
}

export async function getBillingMetrics(
  companyId: string,
  now: Date = new Date(),
): Promise<BillingMetricsDTO> {
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - 1,
  );

  const invoices = (await db
    .collection(Collections.invoices)
    .find({ companyId })
    .toArray()) as InvoiceDoc[];

  let accountBalanceCents = 0;
  let pendingCount = 0;
  let overdueCents = 0;
  let overdueCount = 0;
  let mrrCents = 0;
  let totalSpendCents = 0;
  let nextDueDate: Date | null = null;

  for (const inv of invoices) {
    if (inv.status === "envoyee") {
      accountBalanceCents += inv.totalCents;
      pendingCount++;
      if (inv.dueDate) {
        if (!nextDueDate || inv.dueDate < nextDueDate) nextDueDate = inv.dueDate;
        if (inv.dueDate < now) {
          overdueCents += inv.totalCents;
          overdueCount++;
        }
      }
    }
    if (inv.status === "payee") {
      totalSpendCents += inv.totalCents;
      if (
        inv.paidAt &&
        inv.paidAt >= monthStart &&
        inv.paidAt <= monthEnd
      ) {
        mrrCents += inv.totalCents;
      }
    }
  }

  return {
    accountBalanceCents,
    pendingCount,
    mrrCents,
    totalSpendCents,
    overdueCents,
    overdueCount,
    nextDueDate: nextDueDate ? nextDueDate.toISOString() : null,
  };
}

export async function getBillingDashboard(
  companyId: string,
): Promise<BillingDashboardDTO> {
  const company = await loadCompany(companyId);
  const [methods, metrics] = await Promise.all([
    listSavedPaymentMethods(companyId),
    getBillingMetrics(companyId),
  ]);
  return {
    profile: serializeProfile(company),
    metrics,
    paymentMethods: methods,
    hasStripeCustomer: !!company.stripeCustomerId,
  };
}
