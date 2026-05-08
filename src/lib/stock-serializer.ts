import type {
  CartridgeSlot,
  RefillLogDoc,
  ScentDoc,
  StockOrderDoc,
  StockStatus,
} from "./schemas";
import {
  cartridgeStatus,
  effectiveLevelPercent,
} from "./stock-service";

export type ScentDTO = {
  id: string;
  sku: string;
  name: string;
  defaultCapacityMl: number;
  color?: string;
};

export type CartridgeDTO = {
  slot: number;
  scentId?: string;
  scentName?: string;
  scentSku?: string;
  scentColor?: string;
  capacityMl: number;
  levelPercent: number;
  spraysSinceRefill: number;
  lastRefillAt?: string;
  status: StockStatus;
};

export type StockOrderDTO = {
  id: string;
  partnerId: string;
  terminalId: string;
  lines: { scentId: string; scentName?: string; qty: number }[];
  status: StockOrderDoc["status"];
  notes?: string;
  createdAt: string;
  fulfilledAt?: string;
  cancelledAt?: string;
};

export type RefillLogDTO = {
  id: string;
  terminalId: string;
  slot: number;
  scentId: string;
  scentName?: string;
  levelBefore: number;
  levelAfter: number;
  capacityMl: number;
  refilledAt: string;
  refilledBy: string;
  orderId?: string;
  notes?: string;
};

export function serializeScent(s: ScentDoc): ScentDTO {
  return {
    id: s._id!.toString(),
    sku: s.sku,
    name: s.name,
    defaultCapacityMl: s.defaultCapacityMl,
    color: s.color,
  };
}

export function serializeCartridge(
  c: CartridgeSlot,
  scent?: ScentDoc,
): CartridgeDTO {
  return {
    slot: c.slot,
    scentId: c.scentId,
    scentName: scent?.name,
    scentSku: scent?.sku,
    scentColor: scent?.color,
    capacityMl: c.capacityMl,
    levelPercent: Math.round(effectiveLevelPercent(c)),
    spraysSinceRefill: c.spraysSinceRefill,
    lastRefillAt: c.lastRefillAt?.toISOString(),
    status: cartridgeStatus(c),
  };
}

export function serializeOrder(
  o: StockOrderDoc,
  scentNames: Map<string, string> = new Map(),
): StockOrderDTO {
  return {
    id: o._id!.toString(),
    partnerId: o.partnerId,
    terminalId: o.terminalId,
    lines: o.lines.map((l) => ({
      scentId: l.scentId,
      scentName: scentNames.get(l.scentId),
      qty: l.qty,
    })),
    status: o.status,
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
    fulfilledAt: o.fulfilledAt?.toISOString(),
    cancelledAt: o.cancelledAt?.toISOString(),
  };
}

export function serializeRefill(
  r: RefillLogDoc,
  scentName?: string,
): RefillLogDTO {
  return {
    id: r._id!.toString(),
    terminalId: r.terminalId,
    slot: r.slot,
    scentId: r.scentId,
    scentName,
    levelBefore: Math.round(r.levelBefore),
    levelAfter: Math.round(r.levelAfter),
    capacityMl: r.capacityMl,
    refilledAt: r.refilledAt.toISOString(),
    refilledBy: r.refilledBy,
    orderId: r.orderId,
    notes: r.notes,
  };
}
