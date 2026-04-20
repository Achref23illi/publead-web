"use client";

/**
 * EnterpriseFacturation — advertiser billing screen.
 * Balance banner, invoices table with status filter, payment methods,
 * upcoming charges.
 */

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";

type InvoiceStatus = "all" | "paid" | "pending" | "late";

interface Invoice {
  id: string;
  ref: string;
  campaign: string;
  date: string;
  amount: number;
  status: Exclude<InvoiceStatus, "all">;
  due: string;
}

const INVOICES: Invoice[] = [
  { id: "i1", ref: "F-2026-0418", campaign: "Nova Printemps", date: "18 avr.", amount: 2400, status: "pending", due: "30 avr." },
  { id: "i2", ref: "F-2026-0410", campaign: "Nova Bornes Paris", date: "10 avr.", amount: 1820, status: "pending", due: "22 avr." },
  { id: "i3", ref: "F-2026-0328", campaign: "Nova Flocage Lyon", date: "28 mar.", amount: 1250, status: "paid", due: "10 avr." },
  { id: "i4", ref: "F-2026-0315", campaign: "Nova Teaser", date: "15 mar.", amount: 940, status: "paid", due: "28 mar." },
  { id: "i5", ref: "F-2026-0228", campaign: "Nova Printemps — teaser", date: "28 fév.", amount: 1600, status: "paid", due: "12 mar." },
  { id: "i6", ref: "F-2026-0130", campaign: "Campagne test", date: "30 jan.", amount: 480, status: "late", due: "14 fév." },
];

const PAYMENT_METHODS = [
  { id: "p1", brand: "Visa", last4: "4242", exp: "08/28", default: true },
  { id: "p2", brand: "Mastercard", last4: "8812", exp: "02/27", default: false },
];

const UPCOMING = [
  { ref: "Mensualité mai", amount: 2400, date: "01 mai" },
  { ref: "Flocage Lyon — phase 2", amount: 1150, date: "06 mai" },
  { ref: "Renouvellement Nova Été", amount: 3200, date: "12 mai" },
];

const fmtEur = (n: number) => n.toLocaleString("fr-FR") + " €";

const STATUS_LABEL: Record<Exclude<InvoiceStatus, "all">, string> = {
  paid: "Payée",
  pending: "À payer",
  late: "En retard",
};

export function EnterpriseFacturation() {
  const [status, setStatus] = useState<InvoiceStatus>("all");

  const totals = useMemo(() => {
    return {
      paid: INVOICES.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0),
      pending: INVOICES.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0),
      late: INVOICES.filter((i) => i.status === "late").reduce((s, i) => s + i.amount, 0),
    };
  }, []);

  const filtered = useMemo(
    () => INVOICES.filter((i) => status === "all" || i.status === status),
    [status],
  );

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Facturation
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Factures, paiements et moyens de paiement
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn ghost">
            <Icon name="download" size={14} /> Exporter tout
          </button>
          <button type="button" className="glass-btn">
            <Icon name="credit-card" size={14} /> Régler les impayées
          </button>
        </div>
      </div>

      {/* Balance banner */}
      <div
        className="ent-hero"
        style={{
          background:
            "radial-gradient(120% 140% at 0% 0%, rgba(255,255,255,0.2), transparent 60%), linear-gradient(135deg, #233466 0%, #3A4B8A 55%, #1E293B 100%)",
          boxShadow:
            "0 1px 2px rgba(35,52,102,0.08), 0 28px 60px -24px rgba(35,52,102,0.4), inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      >
        <div className="ent-hero-row">
          <div>
            <div className="ent-hero-stat-label">Solde à régler</div>
            <div className="ent-hero-stat-value">{fmtEur(totals.pending + totals.late)}</div>
            <div className="ent-hero-stat-sub">
              {INVOICES.filter((i) => i.status !== "paid").length} factures en attente · prochaine échéance 22 avr.
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, auto)",
              gap: 18,
              fontSize: 12,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            <MiniStat label="Payées" value={fmtEur(totals.paid)} />
            <MiniStat label="À payer" value={fmtEur(totals.pending)} />
            <MiniStat label="En retard" value={fmtEur(totals.late)} warn />
          </div>
        </div>
      </div>

      {/* Invoices panel */}
      <div className="glass-panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
            borderBottom: "1px solid rgba(35,52,102,0.08)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14 }}>Historique des factures</h3>
          <div className="ent-seg">
            {(["all", "pending", "late", "paid"] as InvoiceStatus[]).map((s) => (
              <button
                key={s}
                className={status === s ? "active" : ""}
                onClick={() => setStatus(s)}
              >
                {s === "all" ? "Toutes" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Campagne</th>
              <th>Émise</th>
              <th>Échéance</th>
              <th style={{ textAlign: "right" }}>Montant</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id}>
                <td style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 }}>
                  {i.ref}
                </td>
                <td>{i.campaign}</td>
                <td>{i.date}</td>
                <td>{i.due}</td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{fmtEur(i.amount)}</td>
                <td>
                  <span className={`ent-chip ${i.status}`}>{STATUS_LABEL[i.status]}</span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    className="glass-btn ghost"
                    style={{ padding: "4px 10px" }}
                    title="Télécharger PDF"
                  >
                    <Icon name="download" size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--gray-500)" }}>
                  Aucune facture ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment methods + Upcoming */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
        <div className="glass-panel">
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>Moyens de paiement</h3>
            <button type="button" className="glass-btn ghost">
              <Icon name="plus" size={12} /> Ajouter
            </button>
          </div>
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            {PAYMENT_METHODS.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(35,52,102,0.08)",
                  borderRadius: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 30,
                      borderRadius: 6,
                      background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {p.brand.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      •••• {p.last4}
                      {p.default && (
                        <span className="ent-chip info" style={{ marginLeft: 8 }}>
                          Par défaut
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--gray-500)" }}>
                      Expire {p.exp}
                    </div>
                  </div>
                </div>
                <button type="button" className="glass-btn ghost" style={{ padding: "4px 10px" }}>
                  <Icon name="more-horizontal" size={14} />
                </button>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "10px 12px",
                fontSize: 12,
                color: "var(--gray-500)",
              }}
            >
              <Icon name="info" size={14} /> Les paiements sont sécurisés via Stripe.
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>Prochaines échéances</h3>
          </div>
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            {UPCOMING.map((u) => (
              <div
                key={u.ref}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "11px 14px",
                  background: "var(--navy-soft)",
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{u.ref}</div>
                  <div style={{ fontSize: 11.5, color: "var(--gray-500)" }}>
                    Prévue le {u.date}
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{fmtEur(u.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{ fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: warn ? "#FCA5A5" : "#fff",
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
