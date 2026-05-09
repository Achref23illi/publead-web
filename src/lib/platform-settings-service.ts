import { db } from "./db";
import {
  Collections,
  PARTNER_REVENUE_DEFAULT_CPM_CENTS,
  PARTNER_REVENUE_DEFAULT_SPRAY_CENTS,
  type AppConfigDoc,
  type PartnerRevenueConfigDoc,
} from "./schemas";
import { clearConfigCache as clearWalletCache } from "./wallet";
import { clearPartnerRevenueConfigCache } from "./partner-revenue-service";

export class PlatformSettingsError extends Error {
  constructor(
    public readonly code: "invalid_input",
    message: string,
  ) {
    super(message);
    this.name = "PlatformSettingsError";
  }
}

export type PlatformSettingsDTO = {
  payments: {
    withdrawalMinCents: number;
    pendingHoldDays: number;
  };
  partnerRevenue: {
    sprayRateCents: number;
    cpmCents: number;
  };
};

const PAYMENTS_DEFAULTS = { withdrawalMinCents: 5000, pendingHoldDays: 7 };

export async function getSettings(): Promise<PlatformSettingsDTO> {
  const [payments, revenue] = await Promise.all([
    db
      .collection(Collections.appConfig)
      .findOne({ key: "payments" }) as Promise<AppConfigDoc | null>,
    db
      .collection(Collections.appConfig)
      .findOne({ key: "partner_revenue" }) as Promise<PartnerRevenueConfigDoc | null>,
  ]);

  return {
    payments: {
      withdrawalMinCents: payments?.withdrawalMinCents ?? PAYMENTS_DEFAULTS.withdrawalMinCents,
      pendingHoldDays: payments?.pendingHoldDays ?? PAYMENTS_DEFAULTS.pendingHoldDays,
    },
    partnerRevenue: {
      sprayRateCents: revenue?.sprayRateCents ?? PARTNER_REVENUE_DEFAULT_SPRAY_CENTS,
      cpmCents: revenue?.cpmCents ?? PARTNER_REVENUE_DEFAULT_CPM_CENTS,
    },
  };
}

export type PlatformSettingsPatch = {
  payments?: Partial<PlatformSettingsDTO["payments"]>;
  partnerRevenue?: Partial<PlatformSettingsDTO["partnerRevenue"]>;
};

function nonNegativeInt(label: string, v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new PlatformSettingsError(
      "invalid_input",
      `${label} must be a non-negative integer`,
    );
  }
  return n;
}

export async function updateSettings(
  patch: PlatformSettingsPatch,
): Promise<PlatformSettingsDTO> {
  const now = new Date();

  if (patch.payments) {
    const $set: Partial<AppConfigDoc> & { updatedAt: Date } = { updatedAt: now };
    if (patch.payments.withdrawalMinCents !== undefined) {
      $set.withdrawalMinCents = nonNegativeInt(
        "withdrawalMinCents",
        patch.payments.withdrawalMinCents,
      );
    }
    if (patch.payments.pendingHoldDays !== undefined) {
      $set.pendingHoldDays = nonNegativeInt(
        "pendingHoldDays",
        patch.payments.pendingHoldDays,
      );
    }
    await db.collection(Collections.appConfig).updateOne(
      { key: "payments" },
      { $set, $setOnInsert: { key: "payments" } },
      { upsert: true },
    );
    clearWalletCache();
  }

  if (patch.partnerRevenue) {
    const $set: Partial<PartnerRevenueConfigDoc> & { updatedAt: Date } = {
      updatedAt: now,
    };
    if (patch.partnerRevenue.sprayRateCents !== undefined) {
      $set.sprayRateCents = nonNegativeInt(
        "sprayRateCents",
        patch.partnerRevenue.sprayRateCents,
      );
    }
    if (patch.partnerRevenue.cpmCents !== undefined) {
      $set.cpmCents = nonNegativeInt(
        "cpmCents",
        patch.partnerRevenue.cpmCents,
      );
    }
    await db.collection(Collections.appConfig).updateOne(
      { key: "partner_revenue" },
      { $set, $setOnInsert: { key: "partner_revenue" } },
      { upsert: true },
    );
    clearPartnerRevenueConfigCache();
  }

  return getSettings();
}
