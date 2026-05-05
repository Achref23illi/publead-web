import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  CITY_CHANGE_COOLDOWN_HOURS,
  Collections,
  type DriverDoc,
  type ValidationStatus,
} from "./schemas";

export type ProfileUpdates = {
  phone?: string;
  city?: string;
  // Admin-only fields.
  firstName?: string;
  lastName?: string;
  status?: ValidationStatus;
};

export type ProfileUpdateOptions = {
  // When false (driver self-edit), city change is rejected if the previous
  // change happened less than CITY_CHANGE_COOLDOWN_HOURS ago.
  bypassCityCooldown?: boolean;
  // When false, name + status changes are silently dropped.
  allowNameChange?: boolean;
  allowStatusChange?: boolean;
};

const VALID_STATUSES: ValidationStatus[] = [
  "pending",
  "validated",
  "rejected",
];

export class ProfileUpdateError extends Error {
  constructor(
    public readonly code:
      | "invalid_phone"
      | "invalid_city"
      | "invalid_status"
      | "invalid_name"
      | "city_cooldown",
    message: string,
    public readonly meta?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ProfileUpdateError";
  }
}

function normalizePhone(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export async function updateDriverProfile(
  driverId: string,
  updates: ProfileUpdates,
  options: ProfileUpdateOptions = {},
): Promise<DriverDoc> {
  const driver = (await db
    .collection(Collections.drivers)
    .findOne({ _id: new ObjectId(driverId) })) as DriverDoc | null;
  if (!driver) {
    throw new Error("driver not found");
  }

  const now = new Date();
  const $set: Record<string, unknown> = {};
  const userSet: Record<string, unknown> = {};

  if (updates.phone !== undefined) {
    const phone = normalizePhone(updates.phone);
    if (!phone) {
      throw new ProfileUpdateError("invalid_phone", "phone cannot be empty");
    }
    $set.phone = phone;
    userSet.phone = phone;
  }

  if (updates.city !== undefined) {
    const city = updates.city.trim();
    if (!city) {
      throw new ProfileUpdateError("invalid_city", "city cannot be empty");
    }
    if (city !== driver.city) {
      if (
        !options.bypassCityCooldown &&
        driver.cityChangedAt &&
        now.getTime() - driver.cityChangedAt.getTime() <
          CITY_CHANGE_COOLDOWN_HOURS * 3600 * 1000
      ) {
        const nextAllowed = new Date(
          driver.cityChangedAt.getTime() +
            CITY_CHANGE_COOLDOWN_HOURS * 3600 * 1000,
        );
        throw new ProfileUpdateError(
          "city_cooldown",
          `city changed too recently — try again after ${nextAllowed.toISOString()}`,
          {
            cooldownHours: CITY_CHANGE_COOLDOWN_HOURS,
            nextAllowedAt: nextAllowed.toISOString(),
          },
        );
      }
      $set.city = city;
      $set.cityChangedAt = now;
    }
  }

  if (options.allowNameChange) {
    if (updates.firstName !== undefined) {
      const firstName = updates.firstName.trim();
      if (!firstName) {
        throw new ProfileUpdateError("invalid_name", "firstName cannot be empty");
      }
      $set.firstName = firstName;
    }
    if (updates.lastName !== undefined) {
      const lastName = updates.lastName.trim();
      if (!lastName) {
        throw new ProfileUpdateError("invalid_name", "lastName cannot be empty");
      }
      $set.lastName = lastName;
    }
    // Sync user.name = firstName + lastName when either changes.
    if (
      updates.firstName !== undefined ||
      updates.lastName !== undefined
    ) {
      const nextFirst = ($set.firstName as string) ?? driver.firstName;
      const nextLast = ($set.lastName as string) ?? driver.lastName;
      userSet.name = `${nextFirst} ${nextLast}`.trim();
    }
  }

  if (options.allowStatusChange && updates.status !== undefined) {
    if (!VALID_STATUSES.includes(updates.status)) {
      throw new ProfileUpdateError("invalid_status", "invalid status");
    }
    $set.status = updates.status;
  }

  if (Object.keys($set).length === 0 && Object.keys(userSet).length === 0) {
    return driver;
  }

  if (Object.keys($set).length > 0) {
    await db
      .collection(Collections.drivers)
      .updateOne({ _id: driver._id }, { $set });
  }
  if (Object.keys(userSet).length > 0) {
    await db
      .collection("user")
      .updateOne({ _id: driver.userId } as never, { $set: userSet });
  }

  const fresh = (await db
    .collection(Collections.drivers)
    .findOne({ _id: driver._id })) as DriverDoc;
  return fresh;
}
