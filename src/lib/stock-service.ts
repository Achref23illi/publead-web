import { ObjectId } from "mongodb";
import { db } from "./db";
import {
  CARTRIDGE_SLOT_COUNT,
  Collections,
  ML_PER_SPRAY,
  STOCK_CRITICAL_THRESHOLD_PCT,
  STOCK_LOW_THRESHOLD_PCT,
  type CartridgeSlot,
  type RefillLogDoc,
  type ScentDoc,
  type StockOrderDoc,
  type StockOrderLine,
  type StockStatus,
  type TerminalDoc,
} from "./schemas";

export class StockServiceError extends Error {
  constructor(
    public code:
      | "not_found"
      | "forbidden"
      | "invalid_slot"
      | "invalid_input"
      | "scent_in_use"
      | "sku_taken"
      | "order_finalized"
      | "terminal_decommissioned",
    message?: string,
  ) {
    super(message ?? code);
  }
}

/**
 * Resolve a cartridge's effective level percent. If the hardware reported
 * `levelPercent` directly, that wins. Otherwise compute from sprays since
 * last refill assuming a fixed mL-per-spray.
 */
export function effectiveLevelPercent(
  c: CartridgeSlot,
): number {
  if (typeof c.levelPercent === "number") {
    return clampPct(c.levelPercent);
  }
  if (!c.scentId) return 0;
  const usedMl = c.spraysSinceRefill * ML_PER_SPRAY;
  const remainingMl = Math.max(0, c.capacityMl - usedMl);
  return clampPct((remainingMl / c.capacityMl) * 100);
}

export function cartridgeStatus(c: CartridgeSlot): StockStatus {
  if (!c.scentId) return "critical"; // empty bay treated as critical
  const lvl = effectiveLevelPercent(c);
  if (lvl <= STOCK_CRITICAL_THRESHOLD_PCT) return "critical";
  if (lvl <= STOCK_LOW_THRESHOLD_PCT) return "low";
  return "ok";
}

function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/**
 * Build a fresh, empty cartridges array of length CARTRIDGE_SLOT_COUNT.
 * Used when creating a new terminal so the embedded array is always present.
 */
export function emptyCartridges(): CartridgeSlot[] {
  return Array.from({ length: CARTRIDGE_SLOT_COUNT }, (_, i) => ({
    slot: i + 1,
    capacityMl: 500,
    spraysSinceRefill: 0,
  }));
}

// --- Scent catalog --------------------------------------------------------

export async function listScents(): Promise<ScentDoc[]> {
  return (await db
    .collection(Collections.scents)
    .find({})
    .sort({ name: 1 })
    .toArray()) as ScentDoc[];
}

export async function createScent(
  input: Pick<ScentDoc, "sku" | "name" | "defaultCapacityMl"> & {
    color?: string;
  },
): Promise<ScentDoc> {
  const sku = input.sku.trim().toUpperCase();
  const name = input.name.trim();
  if (!sku) throw new StockServiceError("invalid_input", "sku required");
  if (!name) throw new StockServiceError("invalid_input", "name required");
  if (input.defaultCapacityMl <= 0) {
    throw new StockServiceError("invalid_input", "defaultCapacityMl > 0");
  }

  const exists = await db.collection(Collections.scents).findOne({ sku });
  if (exists) throw new StockServiceError("sku_taken");

  const now = new Date();
  const doc: ScentDoc = {
    sku,
    name,
    defaultCapacityMl: Math.floor(input.defaultCapacityMl),
    color: input.color?.trim(),
    createdAt: now,
    updatedAt: now,
  };
  const ins = await db.collection(Collections.scents).insertOne(doc);
  doc._id = ins.insertedId;
  return doc;
}

export async function updateScent(
  id: string,
  patch: Partial<Pick<ScentDoc, "name" | "defaultCapacityMl" | "color">>,
): Promise<ScentDoc> {
  const oid = new ObjectId(id);
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) {
    if (!patch.name.trim()) {
      throw new StockServiceError("invalid_input", "name required");
    }
    set.name = patch.name.trim();
  }
  if (patch.defaultCapacityMl !== undefined) {
    if (patch.defaultCapacityMl <= 0) {
      throw new StockServiceError("invalid_input", "capacity > 0");
    }
    set.defaultCapacityMl = Math.floor(patch.defaultCapacityMl);
  }
  if (patch.color !== undefined) set.color = patch.color.trim() || undefined;

  await db
    .collection(Collections.scents)
    .updateOne({ _id: oid }, { $set: set });
  const fresh = await db
    .collection(Collections.scents)
    .findOne({ _id: oid });
  if (!fresh) throw new StockServiceError("not_found");
  return fresh as ScentDoc;
}

export async function deleteScent(id: string): Promise<void> {
  // Refuse if any terminal uses this scent in a cartridge.
  const inUse = await db
    .collection(Collections.terminals)
    .findOne({ "cartridges.scentId": id });
  if (inUse) throw new StockServiceError("scent_in_use");
  const oid = new ObjectId(id);
  const res = await db.collection(Collections.scents).deleteOne({ _id: oid });
  if (res.deletedCount === 0) throw new StockServiceError("not_found");
}

// --- Stock orders ---------------------------------------------------------

export async function createOrder(
  partnerId: string,
  terminalId: string,
  lines: StockOrderLine[],
  createdBy: string,
  notes?: string,
): Promise<StockOrderDoc> {
  if (!lines.length) {
    throw new StockServiceError("invalid_input", "no lines");
  }
  for (const l of lines) {
    if (!l.scentId) {
      throw new StockServiceError("invalid_input", "scentId required");
    }
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 20) {
      throw new StockServiceError("invalid_input", "qty 1..20");
    }
  }

  // Validate terminal belongs to partner.
  let terminalOid: ObjectId;
  try {
    terminalOid = new ObjectId(terminalId);
  } catch {
    throw new StockServiceError("invalid_input", "bad terminalId");
  }
  const terminal = (await db
    .collection(Collections.terminals)
    .findOne({ _id: terminalOid })) as TerminalDoc | null;
  if (!terminal) throw new StockServiceError("not_found");
  if (terminal.partnerId !== partnerId) {
    throw new StockServiceError("forbidden");
  }
  if (terminal.decommissionedAt) {
    throw new StockServiceError("terminal_decommissioned");
  }

  // Validate scents exist.
  const scentIds = lines.map((l) => l.scentId);
  let scentOids: ObjectId[];
  try {
    scentOids = scentIds.map((s) => new ObjectId(s));
  } catch {
    throw new StockServiceError("invalid_input", "bad scentId");
  }
  const found = await db
    .collection(Collections.scents)
    .find({ _id: { $in: scentOids } })
    .toArray();
  if (found.length !== new Set(scentIds).size) {
    throw new StockServiceError("invalid_input", "unknown scent");
  }

  const now = new Date();
  const doc: StockOrderDoc = {
    partnerId,
    terminalId,
    lines,
    status: "pending",
    notes: notes?.trim(),
    createdAt: now,
    createdBy,
  };
  const ins = await db.collection(Collections.stockOrders).insertOne(doc);
  doc._id = ins.insertedId;
  return doc;
}

export async function cancelOrder(
  orderId: string,
  cancelledBy: string,
  asPartner: boolean,
  partnerId?: string,
): Promise<StockOrderDoc> {
  const oid = new ObjectId(orderId);
  const order = (await db
    .collection(Collections.stockOrders)
    .findOne({ _id: oid })) as StockOrderDoc | null;
  if (!order) throw new StockServiceError("not_found");
  if (asPartner && order.partnerId !== partnerId) {
    throw new StockServiceError("forbidden");
  }
  if (order.status !== "pending") {
    throw new StockServiceError("order_finalized");
  }
  const now = new Date();
  await db.collection(Collections.stockOrders).updateOne(
    { _id: oid },
    {
      $set: {
        status: "cancelled",
        cancelledAt: now,
        cancelledBy,
      },
    },
  );
  return { ...order, status: "cancelled", cancelledAt: now, cancelledBy };
}

export async function markOrderFulfilled(
  orderId: string,
): Promise<StockOrderDoc> {
  const oid = new ObjectId(orderId);
  const order = (await db
    .collection(Collections.stockOrders)
    .findOne({ _id: oid })) as StockOrderDoc | null;
  if (!order) throw new StockServiceError("not_found");
  if (order.status !== "pending") {
    throw new StockServiceError("order_finalized");
  }
  const now = new Date();
  await db
    .collection(Collections.stockOrders)
    .updateOne(
      { _id: oid },
      { $set: { status: "fulfilled", fulfilledAt: now } },
    );
  return { ...order, status: "fulfilled", fulfilledAt: now };
}

// --- Refills --------------------------------------------------------------

export type RecordRefillInput = {
  terminalId: string;
  slot: number;
  scentId: string;
  capacityMl?: number; // optional override; defaults to scent.defaultCapacityMl
  levelAfter?: number; // 0..100; defaults to 100 (full refill)
  refilledBy: string; // admin userId
  orderId?: string;
  notes?: string;
};

/**
 * Record a refill action: write a RefillLog + update the cartridge slot on
 * the terminal (level → 100, sprays → 0, lastRefillAt = now). Auto-mark
 * the linked order as fulfilled when all its lines have been refilled.
 */
export async function recordRefill(
  input: RecordRefillInput,
): Promise<{ refill: RefillLogDoc; terminal: TerminalDoc }> {
  if (
    !Number.isInteger(input.slot) ||
    input.slot < 1 ||
    input.slot > CARTRIDGE_SLOT_COUNT
  ) {
    throw new StockServiceError("invalid_slot");
  }
  let terminalOid: ObjectId;
  let scentOid: ObjectId;
  try {
    terminalOid = new ObjectId(input.terminalId);
    scentOid = new ObjectId(input.scentId);
  } catch {
    throw new StockServiceError("invalid_input", "bad id");
  }
  const terminal = (await db
    .collection(Collections.terminals)
    .findOne({ _id: terminalOid })) as TerminalDoc | null;
  if (!terminal) throw new StockServiceError("not_found");
  if (terminal.decommissionedAt) {
    throw new StockServiceError("terminal_decommissioned");
  }

  const scent = (await db
    .collection(Collections.scents)
    .findOne({ _id: scentOid })) as ScentDoc | null;
  if (!scent) throw new StockServiceError("invalid_input", "unknown scent");

  const capacityMl =
    input.capacityMl && input.capacityMl > 0
      ? Math.floor(input.capacityMl)
      : scent.defaultCapacityMl;
  const levelAfter = clampPct(input.levelAfter ?? 100);
  const existingSlot = terminal.cartridges.find((c) => c.slot === input.slot);
  const levelBefore = existingSlot
    ? effectiveLevelPercent(existingSlot)
    : 0;

  const now = new Date();
  const refill: RefillLogDoc = {
    terminalId: input.terminalId,
    slot: input.slot,
    scentId: input.scentId,
    levelBefore,
    levelAfter,
    capacityMl,
    refilledBy: input.refilledBy,
    refilledAt: now,
    orderId: input.orderId,
    notes: input.notes?.trim(),
  };
  const ins = await db.collection(Collections.refillLogs).insertOne(refill);
  refill._id = ins.insertedId;

  // Update slot on terminal in place.
  const newCartridges: CartridgeSlot[] = terminal.cartridges.map((c) =>
    c.slot === input.slot
      ? {
          slot: input.slot,
          scentId: input.scentId,
          capacityMl,
          levelPercent: levelAfter,
          spraysSinceRefill: 0,
          lastRefillAt: now,
        }
      : c,
  );
  await db
    .collection(Collections.terminals)
    .updateOne(
      { _id: terminalOid },
      { $set: { cartridges: newCartridges, updatedAt: now } },
    );
  terminal.cartridges = newCartridges;
  terminal.updatedAt = now;

  // If linked to an order, check if every line of that order has now been
  // refilled (cumulative across all its refill logs). If so, mark fulfilled.
  if (input.orderId) {
    await maybeAutoFulfillOrder(input.orderId);
  }

  return { refill, terminal };
}

async function maybeAutoFulfillOrder(orderId: string): Promise<void> {
  const oid = new ObjectId(orderId);
  const order = (await db
    .collection(Collections.stockOrders)
    .findOne({ _id: oid })) as StockOrderDoc | null;
  if (!order || order.status !== "pending") return;

  const refills = (await db
    .collection(Collections.refillLogs)
    .find({ orderId })
    .toArray()) as RefillLogDoc[];

  // Sum refilled qty per scent.
  const refilledByScent = new Map<string, number>();
  for (const r of refills) {
    refilledByScent.set(
      r.scentId,
      (refilledByScent.get(r.scentId) ?? 0) + 1,
    );
  }
  const allMet = order.lines.every(
    (l) => (refilledByScent.get(l.scentId) ?? 0) >= l.qty,
  );
  if (allMet) {
    await db
      .collection(Collections.stockOrders)
      .updateOne(
        { _id: oid },
        { $set: { status: "fulfilled", fulfilledAt: new Date() } },
      );
  }
}
