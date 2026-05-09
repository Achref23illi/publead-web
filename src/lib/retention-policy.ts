import { Collections } from "./schemas";

// Retention policy mapping mongo collection -> retention duration in days.
// Sourced from FR Code de commerce + RGPD guidance. Reviewed annually with
// legal. Document only — purges are NOT automated; admins enforce manually.

export type RetentionEntry = {
  collection: string;
  category: "user" | "operational" | "financial" | "telemetry";
  piiFields: string;
  legalBasis: string;
  retentionDays: number;
  retentionLabel: string;
};

const D = (years: number) => years * 365;

export const RETENTION_POLICY: RetentionEntry[] = [
  {
    collection: "user (better-auth)",
    category: "user",
    piiFields: "email, name, password hash, role",
    legalBasis: "Contrat (CGU)",
    retentionDays: D(3),
    retentionLabel: "Compte actif + 3 ans après dernière connexion",
  },
  {
    collection: Collections.drivers,
    category: "user",
    piiFields:
      "firstName, lastName, phone, city, bankAccount.iban, totalKm, rating",
    legalBasis: "Contrat (mission chauffeur)",
    retentionDays: D(5),
    retentionLabel: "Durée du contrat + 5 ans (obligation comptable)",
  },
  {
    collection: Collections.companies,
    category: "user",
    piiFields:
      "companyName, contactName, phone, siret, vatNumber, legalName, headquarters",
    legalBasis: "Contrat / Obligation légale",
    retentionDays: D(10),
    retentionLabel: "Durée du contrat + 10 ans (factures)",
  },
  {
    collection: Collections.partners,
    category: "user",
    piiFields: "businessName, managerName, phone, address",
    legalBasis: "Contrat (mission partenaire)",
    retentionDays: D(5),
    retentionLabel: "Durée du contrat + 5 ans",
  },
  {
    collection: Collections.documents,
    category: "user",
    piiFields: "Pièces d'identité, justificatifs (Cloudinary URL)",
    legalBasis: "Obligation légale (KYC)",
    retentionDays: D(10),
    retentionLabel: "10 ans après fin de relation",
  },
  {
    collection: Collections.vehicles,
    category: "operational",
    piiFields: "licensePlate, contrôle technique",
    legalBasis: "Contrat",
    retentionDays: D(1),
    retentionLabel: "Durée du contrat + 1 an",
  },
  {
    collection: Collections.transactions,
    category: "financial",
    piiFields: "driverId, montants (cents)",
    legalBasis: "Obligation légale (comptabilité)",
    retentionDays: D(10),
    retentionLabel: "10 ans (Code de commerce)",
  },
  {
    collection: Collections.withdrawals,
    category: "financial",
    piiFields: "iban, bankName, accountHolder, payoutReference",
    legalBasis: "Obligation légale",
    retentionDays: D(10),
    retentionLabel: "10 ans",
  },
  {
    collection: Collections.invoices,
    category: "financial",
    piiFields: "companyId, sentTo (email), paidReference",
    legalBasis: "Obligation légale",
    retentionDays: D(10),
    retentionLabel: "10 ans",
  },
  {
    collection: Collections.expenses,
    category: "financial",
    piiFields: "vendor, label, notes",
    legalBasis: "Obligation légale",
    retentionDays: D(10),
    retentionLabel: "10 ans",
  },
  {
    collection: Collections.terminals,
    category: "telemetry",
    piiFields: "Aucune (matériel) — coords GPS approximatives",
    legalBasis: "Intérêt légitime",
    retentionDays: 0,
    retentionLabel: "Durée d'exploitation",
  },
  {
    collection: Collections.refillLogs,
    category: "operational",
    piiFields: "refilledBy (admin), notes",
    legalBasis: "Intérêt légitime (audit)",
    retentionDays: D(3),
    retentionLabel: "3 ans",
  },
  {
    collection: Collections.adImpressionsDaily,
    category: "telemetry",
    piiFields: "Aucune (compteurs anonymes par borne)",
    legalBasis: "Intérêt légitime",
    retentionDays: D(5),
    retentionLabel: "5 ans (rétention statistique)",
  },
  {
    collection: Collections.stripeEvents,
    category: "financial",
    piiFields: "Métadonnées Stripe (IDs paiement, montants)",
    legalBasis: "Obligation légale",
    retentionDays: D(10),
    retentionLabel: "10 ans",
  },
  {
    collection: Collections.auditLog,
    category: "operational",
    piiFields: "actorEmail, before/after snapshots possibles",
    legalBasis: "Intérêt légitime (audit interne)",
    retentionDays: D(2),
    retentionLabel: "2 ans",
  },
  {
    collection: Collections.gdprDeletions,
    category: "operational",
    piiFields: "email pré-anonymisation (preuve de demande)",
    legalBasis: "Obligation légale (preuve RGPD)",
    retentionDays: D(3),
    retentionLabel: "3 ans après anonymisation",
  },
];
