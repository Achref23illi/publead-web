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
  vehicleModel: string;
  vehicleYear: string;
  licensePlate: string;
  vehicleType: string;
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
  documentsUploaded: boolean;
};

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

export const Collections = {
  drivers: "drivers",
  companies: "companies",
  partners: "partners",
  campaigns: "campaigns",
  campaignEvents: "campaign_events",
  transactions: "transactions",
  withdrawals: "withdrawals",
  appConfig: "app_config",
} as const;
