import { ObjectId } from "mongodb";

export type ValidationStatus = "pending" | "validated" | "rejected";
export type UserRoleName =
  | "admin"
  | "advertiser"
  | "driver"
  | "partner"
  | "team_member";

export type BankAccount = {
  iban: string;
  bankName?: string;
  accountHolder?: string;
};

export type DriverDoc = {
  _id?: ObjectId;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  status: ValidationStatus;
  joinedAt: Date;
  campaignsDone: number;
  rating: number;
  totalKm: number;
  // All monetary values stored in cents to avoid float math.
  totalEarningsCents: number;
  availableBalanceCents: number;
  pendingBalanceCents: number;
  withdrawnTotalCents: number;
  bankAccount?: BankAccount;
  // True only when every required document type has been admin-approved.
  documentsApproved: boolean;
  // Last time the driver changed their city (used to enforce a cooldown).
  cityChangedAt?: Date;
};

export const CITY_CHANGE_COOLDOWN_HOURS = 48;

// --- Vehicles ---

export type VehicleType = "Berline" | "SUV" | "Utilitaire" | "Autre";

export type InspectionInfo = {
  // Date the technical inspection ("contrôle technique") expires.
  expiresAt?: Date;
  // Optional Cloudinary file ref for the inspection certificate.
  fileUrl?: string;
  filePublicId?: string;
};

export type VehicleDoc = {
  _id?: ObjectId;
  driverId: string;
  make: string; // e.g. "Audi"
  model: string; // e.g. "Q5"
  year: string; // stored as string for flexibility ("2022")
  licensePlate: string; // normalized uppercase
  type: VehicleType;
  isActive: boolean;
  inspection?: InspectionInfo;
  // Showcase gallery (separate from D4 KYC vehicle_photos).
  photos: FileMeta[];
  createdAt: Date;
  updatedAt: Date;
};

export const VEHICLE_MAX_PER_DRIVER = 3;
export const VEHICLE_PHOTOS_MAX = 10;

export type CompanyDoc = {
  _id?: ObjectId;
  userId: string;
  organizationId?: string;
  companyName: string;
  contactName: string;
  phone: string;
  domain: string;
  sector: string;
  city: string;
  website?: string;
  description?: string;
  status: ValidationStatus;
  founded?: string;
  headquarters?: string;
  budgetTotal: number;
  employees?: string;
  campaignsCount: number;
  brandColor?: string;
  logoUrl?: string;
  createdAt: Date;
};

export type PartnerDoc = {
  _id?: ObjectId;
  userId: string;
  businessName: string;
  managerName: string;
  phone: string;
  address: string;
  city: string;
  openingHours?: string;
  monthlySprayRevenue: number;
  monthlyAdsRevenue: number;
  status: ValidationStatus;
  createdAt: Date;
};

export type CampaignStatus =
  | "draft"
  | "upcoming"
  | "active"
  | "completed";

export type TrackingMode = "gps" | "manual";

export type CampaignDoc = {
  _id?: ObjectId;
  companyId: string;
  brand: string;
  domain: string;
  title: string;
  description: string;
  city: string;
  zones: string[];
  startDate: Date;
  endDate: Date;
  durationDays: number;
  // Reward per assigned driver, stored in cents.
  rewardCents: number;
  status: CampaignStatus;
  progress: number;
  kmDone: number;
  kmTotal: number;
  driversNeeded: number;
  driversAssigned: number;
  assignedDriverIds: string[];
  trackingMode: TrackingMode;
  heroImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CampaignEventType =
  | "accept"
  | "cancel"
  | "complete"
  | "status_change";

export type CampaignEventDoc = {
  _id?: ObjectId;
  campaignId: string;
  type: CampaignEventType;
  driverId?: string;
  at: Date;
  meta?: Record<string, unknown>;
};

export type TransactionType =
  | "campaign_completion"
  | "withdrawal_debit"
  | "withdrawal_refund"
  | "adjustment";

// Settlement applies only to campaign_completion: amounts are 'pending' until
// the holdDays window passes, then become 'available' on read.
// Withdrawal debits are always available-tier (already deducted at request).
export type TransactionTier = "pending" | "available";

export type TransactionDoc = {
  _id?: ObjectId;
  driverId: string;
  type: TransactionType;
  amountCents: number; // signed: credits positive, debits negative
  tier: TransactionTier;
  // Date amount becomes 'available'. For pending campaign credits this is
  // createdAt + holdDays; for instant entries it equals createdAt.
  availableAt: Date;
  createdAt: Date;
  // Linked context, depending on type
  campaignId?: string;
  withdrawalId?: string;
  description: string;
  meta?: Record<string, unknown>;
};

export type WithdrawalStatus =
  | "pending"
  | "paid"
  | "rejected";

export type WithdrawalDoc = {
  _id?: ObjectId;
  driverId: string;
  amountCents: number; // always positive
  status: WithdrawalStatus;
  iban: string;
  bankName?: string;
  accountHolder?: string;
  debitTransactionId: string;
  refundTransactionId?: string;
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string; // admin user id
  rejectReason?: string;
  payoutReference?: string; // admin's bank reference once paid
};

export type AppConfigDoc = {
  _id?: ObjectId;
  key: "payments";
  withdrawalMinCents: number;
  pendingHoldDays: number;
  updatedAt: Date;
};

// --- Documents (KYC) ---

export type DocumentType =
  | "license"
  | "registration"
  | "insurance"
  | "rib"
  | "vehicle_photos";

export type DocumentStatus = "missing" | "pending" | "approved" | "rejected";

export type FileMeta = {
  publicId: string; // Cloudinary public_id (used for delete)
  url: string; // secure_url
  resourceType: "image" | "raw" | "video";
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  uploadedAt: Date;
};

export type DocumentDoc = {
  _id?: ObjectId;
  driverId: string;
  type: DocumentType;
  status: DocumentStatus;
  files: FileMeta[];
  // Approval/reject metadata (last action only — re-upload clears reject).
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Required count per type — drives UI hints and admin completeness checks.
export const DOC_TYPE_META: Record<
  DocumentType,
  { label: string; requiredCount: number; description: string }
> = {
  license: {
    label: "Permis de conduire",
    requiredCount: 2, // recto + verso
    description: "Recto et verso de votre permis.",
  },
  registration: {
    label: "Carte grise",
    requiredCount: 2,
    description: "Recto et verso de la carte grise du véhicule.",
  },
  insurance: {
    label: "Attestation d'assurance",
    requiredCount: 1,
    description: "Attestation à jour, période en cours visible.",
  },
  rib: {
    label: "RIB bancaire",
    requiredCount: 1,
    description: "Relevé d'identité bancaire au nom du chauffeur.",
  },
  vehicle_photos: {
    label: "Photos du véhicule",
    requiredCount: 4,
    description: "Avant, arrière, côté gauche, côté droit.",
  },
};

export const REQUIRED_DOC_TYPES: DocumentType[] = [
  "license",
  "registration",
  "insurance",
  "rib",
  "vehicle_photos",
];

export const Collections = {
  drivers: "drivers",
  companies: "companies",
  partners: "partners",
  campaigns: "campaigns",
  campaignEvents: "campaign_events",
  transactions: "transactions",
  withdrawals: "withdrawals",
  appConfig: "app_config",
  documents: "documents",
  vehicles: "vehicles",
} as const;
