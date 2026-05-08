"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { ScentDTO, CartridgeDTO, StockOrderDTO, RefillLogDTO } from "@/lib/stock-serializer";
import type { TerminalDTO } from "@/lib/terminal-serializer";

type StockStatus = "ok" | "low" | "critical";

const STATUS_LABEL: Record<StockStatus, string> = {
  ok: "OK",
  low: "Faible",
  critical: "Rupture",
};

const STATUS_CHIP: Record<StockStatus, string> = {
  ok: "chip-success",
  low: "chip-warning",
  critical: "chip-danger",
};

function fmtRel(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "à l'instant";
  if (diff < 3600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86400_000) return `il y a ${Math.floor(diff / 3600_000)} h`;
  return `il y a ${Math.floor(diff / 86400_000)} j`;
}

export function PartenaireStock() {
  const [terminals, setTerminals] = useState<TerminalDTO[]>([]);
  const [scents, setScents] = useState<ScentDTO[]>([]);
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(
    null,
  );
  const [cartridges, setCartridges] = useState<CartridgeDTO[]>([]);
  const [orders, setOrders] = useState<StockOrderDTO[]>([]);
  const [refills, setRefills] = useState<RefillLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderModal, setOrderModal] = useState(false);

  // Initial: terminals + scents
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/me/terminals", { credentials: "include" }).then((r) =>
        r.json(),
      ),
      fetch("/api/me/scents", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([t, s]) => {
        if (cancelled) return;
        setTerminals(t.terminals ?? []);
        setScents(s.scents ?? []);
        if (t.terminals?.length) setSelectedTerminalId(t.terminals[0].id);
        else setLoading(false);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // When terminal changes, load stock + orders + refills for it
  useEffect(() => {
    if (!selectedTerminalId) return;
    setLoading(true);
    let cancelled = false;
    const tid = selectedTerminalId;
    Promise.all([
      fetch(`/api/me/terminals/${tid}/stock`, { credentials: "include" }).then(
        (r) => r.json(),
      ),
      fetch(`/api/me/stock-orders?terminalId=${tid}`, {
        credentials: "include",
      }).then((r) => r.json()),
      fetch(`/api/me/terminals/${tid}/refills`, {
        credentials: "include",
      }).then((r) => r.json()),
    ])
      .then(([s, o, r]) => {
        if (cancelled) return;
        setCartridges(s.cartridges ?? []);
        setOrders(o.orders ?? []);
        setRefills(r.refills ?? []);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTerminalId]);

  const selected = terminals.find((t) => t.id === selectedTerminalId);
  const alertCount = cartridges.filter((c) => c.status !== "ok").length;
  const pendingOrders = orders.filter((o) => o.status === "pending");

  const reload = async () => {
    if (!selectedTerminalId) return;
    const tid = selectedTerminalId;
    const [s, o, r] = await Promise.all([
      fetch(`/api/me/terminals/${tid}/stock`, { credentials: "include" }).then(
        (x) => x.json(),
      ),
      fetch(`/api/me/stock-orders?terminalId=${tid}`, {
        credentials: "include",
      }).then((x) => x.json()),
      fetch(`/api/me/terminals/${tid}/refills`, {
        credentials: "include",
      }).then((x) => x.json()),
    ]);
    setCartridges(s.cartridges ?? []);
    setOrders(o.orders ?? []);
    setRefills(r.refills ?? []);
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Annuler cette commande ?")) return;
    const res = await fetch(`/api/me/stock-orders/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      alert("Échec de l'annulation");
      return;
    }
    await reload();
  };

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Stock parfums
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            {selected
              ? `${selected.name} · ${selected.code}`
              : "Sélectionnez une borne"}
          </p>
        </div>
        <button
          type="button"
          className="glass-btn glass-btn-primary"
          disabled={!selected || scents.length === 0}
          onClick={() => setOrderModal(true)}
        >
          <Icon name="package" size={14} /> Commander un refill
        </button>
      </div>

      {error && (
        <div
          className="glass-card"
          style={{ padding: 16, color: "var(--danger)", marginBottom: 16 }}
        >
          Erreur : {error}
        </div>
      )}

      {terminals.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {terminals.map((t) => (
            <button
              key={t.id}
              type="button"
              className={
                "chip " +
                (t.id === selectedTerminalId ? "chip-navy" : "chip-soft-navy")
              }
              onClick={() => setSelectedTerminalId(t.id)}
              style={{ cursor: "pointer" }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="glass-kpigrid" style={{ marginBottom: 20 }}>
        {[
          { l: "Cartouches", v: cartridges.length.toString() },
          { l: "Alertes", v: alertCount.toString() },
          {
            l: "Commandes en cours",
            v: pendingOrders.length.toString(),
          },
        ].map((k) => (
          <div key={k.l} className="glass-kpi">
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--gray-500)",
              }}
            >
              {k.l}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                fontWeight: 700,
                margin: "4px 0",
              }}
            >
              {k.v}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div
          className="glass-card"
          style={{ padding: 32, color: "var(--gray-500)" }}
        >
          Chargement…
        </div>
      ) : !selected ? (
        <div
          className="glass-card"
          style={{ padding: 48, textAlign: "center", color: "var(--gray-500)" }}
        >
          <Icon name="package" size={32} />
          <p style={{ margin: "12px 0 0", fontSize: 14 }}>
            Aucune borne installée.
          </p>
        </div>
      ) : (
        <>
          <div className="glass-panel" style={{ marginBottom: 20 }}>
            <h3 style={{ padding: "16px 20px 0", margin: 0, fontSize: 14 }}>
              Cartouches
            </h3>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Parfum</th>
                  <th>Niveau</th>
                  <th style={{ textAlign: "right" }}>Sprays</th>
                  <th>Dernier refill</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {cartridges.map((c) => (
                  <tr key={c.slot}>
                    <td className="mono">#{c.slot}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {c.scentName ?? <em style={{ color: "var(--gray-400)" }}>vide</em>}
                      </div>
                      {c.scentSku && (
                        <div
                          className="mono"
                          style={{ fontSize: 11, color: "var(--gray-500)" }}
                        >
                          {c.scentSku}
                        </div>
                      )}
                    </td>
                    <td style={{ minWidth: 180 }}>
                      <div className="progress">
                        <div
                          className="progress-fill"
                          style={{
                            width: c.levelPercent + "%",
                            background:
                              c.status === "ok"
                                ? "var(--success)"
                                : c.status === "low"
                                ? "var(--warning)"
                                : "var(--danger)",
                          }}
                        />
                      </div>
                      <div
                        className="num"
                        style={{ fontSize: 12, marginTop: 4, fontWeight: 600 }}
                      >
                        {c.levelPercent}%
                      </div>
                    </td>
                    <td
                      className="num"
                      style={{ textAlign: "right", fontWeight: 600 }}
                    >
                      {c.spraysSinceRefill.toLocaleString("fr-FR")}
                    </td>
                    <td style={{ color: "var(--gray-500)", fontSize: 12 }}>
                      {fmtRel(c.lastRefillAt)}
                    </td>
                    <td>
                      <span className={"chip " + STATUS_CHIP[c.status]}>
                        <span className="dot" /> {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-panel" style={{ marginBottom: 20 }}>
            <h3 style={{ padding: "16px 20px 0", margin: 0, fontSize: 14 }}>
              Commandes
            </h3>
            {orders.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  color: "var(--gray-500)",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Aucune commande pour cette borne.
              </div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Lignes</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ color: "var(--gray-500)" }}>
                        {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td>
                        {o.lines
                          .map((l) => `${l.qty}× ${l.scentName ?? l.scentId}`)
                          .join(", ")}
                      </td>
                      <td>
                        <span
                          className={
                            "chip " +
                            (o.status === "fulfilled"
                              ? "chip-success"
                              : o.status === "cancelled"
                              ? "chip-soft-navy"
                              : "chip-warning")
                          }
                        >
                          {o.status === "pending"
                            ? "En attente"
                            : o.status === "fulfilled"
                            ? "Livrée"
                            : "Annulée"}
                        </span>
                      </td>
                      <td>
                        {o.status === "pending" && (
                          <button
                            type="button"
                            className="btn btn-ghost compact"
                            onClick={() => cancelOrder(o.id)}
                          >
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass-panel">
            <h3 style={{ padding: "16px 20px 0", margin: 0, fontSize: 14 }}>
              Historique des refills
            </h3>
            {refills.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  color: "var(--gray-500)",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Aucun refill enregistré.
              </div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Slot</th>
                    <th>Parfum</th>
                    <th>Niveau</th>
                  </tr>
                </thead>
                <tbody>
                  {refills.map((r) => (
                    <tr key={r.id}>
                      <td style={{ color: "var(--gray-500)" }}>
                        {fmtRel(r.refilledAt)}
                      </td>
                      <td className="mono">#{r.slot}</td>
                      <td>{r.scentName ?? r.scentId}</td>
                      <td>
                        {r.levelBefore}% → {r.levelAfter}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {orderModal && selected && (
        <OrderModal
          terminal={selected}
          scents={scents}
          cartridges={cartridges}
          onClose={() => setOrderModal(false)}
          onSubmit={async () => {
            setOrderModal(false);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function OrderModal({
  terminal,
  scents,
  cartridges,
  onClose,
  onSubmit,
}: {
  terminal: TerminalDTO;
  scents: ScentDTO[];
  cartridges: CartridgeDTO[];
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  const [qtyByScent, setQtyByScent] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Pre-fill from alert cartridges (one per low/critical scent).
  useMemo(() => {
    const next: Record<string, number> = {};
    for (const c of cartridges) {
      if (c.status !== "ok" && c.scentId) {
        next[c.scentId] = (next[c.scentId] ?? 0) + 1;
      }
    }
    setQtyByScent(next);
  }, [cartridges]);

  const lines = Object.entries(qtyByScent)
    .filter(([, q]) => q > 0)
    .map(([scentId, qty]) => ({ scentId, qty }));

  const submit = async () => {
    if (!lines.length) {
      setErr("Sélectionnez au moins un parfum");
      return;
    }
    setSubmitting(true);
    setErr(null);
    const res = await fetch("/api/me/stock-orders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        terminalId: terminal.id,
        lines,
        notes: notes.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;
      setErr(body?.message ?? body?.error ?? `HTTP ${res.status}`);
      return;
    }
    await onSubmit();
  };

  return (
    <>
      <div className="glass-backdrop" onClick={onClose} />
      <div className="glass-sheet" style={{ width: 520 }}>
        <div className="glass-sheet-head">
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700 }}>
              Commander un refill
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
              {terminal.name} · {terminal.code}
            </div>
          </div>
          <button type="button" className="glass-iconbtn" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="glass-sheet-body">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {scents.map((s) => {
              const qty = qtyByScent[s.id] ?? 0;
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 10,
                    border: "1px solid var(--gray-200)",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                    <div
                      className="mono"
                      style={{ fontSize: 11, color: "var(--gray-500)" }}
                    >
                      {s.sku} · {s.defaultCapacityMl}ml
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      type="button"
                      className="glass-iconbtn"
                      onClick={() =>
                        setQtyByScent((p) => ({
                          ...p,
                          [s.id]: Math.max(0, (p[s.id] ?? 0) - 1),
                        }))
                      }
                    >
                      <span style={{ fontSize: 14, fontWeight: 700 }}>−</span>
                    </button>
                    <span
                      className="num"
                      style={{ minWidth: 24, textAlign: "center", fontWeight: 600 }}
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      className="glass-iconbtn"
                      onClick={() =>
                        setQtyByScent((p) => ({
                          ...p,
                          [s.id]: Math.min(20, (p[s.id] ?? 0) + 1),
                        }))
                      }
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optionnel)"
            rows={3}
            style={{
              marginTop: 16,
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid var(--gray-200)",
              fontFamily: "inherit",
              fontSize: 13,
              resize: "vertical",
            }}
          />
          {err && (
            <div style={{ marginTop: 10, color: "var(--danger)", fontSize: 13 }}>
              {err}
            </div>
          )}
        </div>
        <div className="glass-sheet-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="glass-btn glass-btn-primary"
            disabled={submitting || lines.length === 0}
            onClick={submit}
          >
            {submitting ? "Envoi…" : `Commander (${lines.length})`}
          </button>
        </div>
      </div>
    </>
  );
}
