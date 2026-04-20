"use client";

/**
 * FinancesGlass — rond/vitré finances dashboard.
 * Interactive: period selector, invoice status filter, product breakdown toggle.
 */

import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { StackedArea } from "@/components/charts";

type Period = "7j" | "30j" | "90j" | "annee";
type InvoiceStatus = "all" | "paid" | "pending" | "late";
type Breakdown = "product" | "city";

interface Invoice {
  id: string;
  num: string;
  client: string;
  clientInitials: string;
  clientColor: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "late";
}

interface TopClient {
  name: string;
  initials: string;
  color: string;
  rev: number;
  share: number;
  trend: number; // percent change vs previous period
}

interface UpcomingPayment {
  when: string;
  who: string;
  amount: number;
  icon: IconName;
  tone: "info" | "success" | "warning";
}

interface Commission {
  name: string;
  initials: string;
  rides: number;
  amount: number;
}

const PERIODS: { k: Period; l: string }[] = [
  { k: "7j", l: "7 jours" },
  { k: "30j", l: "30 jours" },
  { k: "90j", l: "90 jours" },
  { k: "annee", l: "Année" },
];

const INVOICES: Invoice[] = [
  { id: "i1", num: "F-2026-0420", client: "Renault France", clientInitials: "R", clientColor: "#FDD835", date: "20 avr.", amount: 3200, status: "pending" },
  { id: "i2", num: "F-2026-0418", client: "Le Clos des Vignes", clientInitials: "CV", clientColor: "#8D6E63", date: "18 avr.", amount: 1820, status: "paid" },
  { id: "i3", num: "F-2026-0415", client: "Maison Lavande", clientInitials: "ML", clientColor: "#9C27B0", date: "15 avr.", amount: 1250, status: "paid" },
  { id: "i4", num: "F-2026-0412", client: "SoBio Market SAS", clientInitials: "SB", clientColor: "#43A047", date: "12 avr.", amount: 2000, status: "paid" },
  { id: "i5", num: "F-2026-0410", client: "Kalis Gym", clientInitials: "KG", clientColor: "#E53935", date: "10 avr.", amount: 940, status: "pending" },
  { id: "i6", num: "F-2026-0405", client: "Fédération Artisans", clientInitials: "AB", clientColor: "#795548", date: "05 avr.", amount: 5800, status: "paid" },
  { id: "i7", num: "F-2026-0328", client: "Nova Cosmétique", clientInitials: "N", clientColor: "#EC407A", date: "28 mars", amount: 1420, status: "late" },
  { id: "i8", num: "F-2026-0322", client: "Atelier Véloce", clientInitials: "AV", clientColor: "#0EA5E9", date: "22 mars", amount: 680, status: "late" },
];

const TOP_CLIENTS: TopClient[] = [
  { name: "Fédération Artisans", initials: "AB", color: "#795548", rev: 5800, share: 25, trend: 18 },
  { name: "Renault France", initials: "R", color: "#FDD835", rev: 3200, share: 14, trend: 12 },
  { name: "SoBio Market SAS", initials: "SB", color: "#43A047", rev: 2000, share: 9, trend: -4 },
  { name: "Le Clos des Vignes", initials: "CV", color: "#8D6E63", rev: 1820, share: 8, trend: 22 },
  { name: "Nova Cosmétique", initials: "N", color: "#EC407A", rev: 1420, share: 6, trend: 6 },
];

const UPCOMING: UpcomingPayment[] = [
  { when: "22 avr.", who: "Renault France", amount: 3200, icon: "banknote", tone: "info" },
  { when: "24 avr.", who: "Kalis Gym", amount: 940, icon: "clock", tone: "warning" },
  { when: "28 avr.", who: "Maison Lavande (prorata)", amount: 310, icon: "credit-card", tone: "info" },
  { when: "30 avr.", who: "Clôture mensuelle", amount: 28600, icon: "check-circle", tone: "success" },
];

const COMMISSIONS: Commission[] = [
  { name: "Lucas Fontaine", initials: "LF", rides: 42, amount: 510 },
  { name: "Amélie Rousseau", initials: "AR", rides: 36, amount: 420 },
  { name: "Nadia El-Amrani", initials: "NE", rides: 48, amount: 540 },
  { name: "Thomas Girard", initials: "TG", rides: 28, amount: 310 },
  { name: "Inès Moreau", initials: "IM", rides: 22, amount: 240 },
];

const PRODUCT_SPLIT = [
  { label: "Flocage véhicule", value: 18420, color: "#233466", share: 72 },
  { label: "Leader Borne", value: 7240, color: "#3B82F6", share: 28 },
];

const CITY_SPLIT = [
  { label: "Lyon", value: 9200, color: "#233466", share: 36 },
  { label: "Paris", value: 7100, color: "#3B82F6", share: 28 },
  { label: "Bordeaux", value: 3800, color: "#9C27B0", share: 15 },
  { label: "Marseille", value: 2800, color: "#F59E0B", share: 11 },
  { label: "Autres", value: 2700, color: "#10B981", share: 10 },
];

export function FinancesGlass() {
  const [period, setPeriod] = useState<Period>("30j");
  const [status, setStatus] = useState<InvoiceStatus>("all");
  const [breakdown, setBreakdown] = useState<Breakdown>("product");

  const filteredInvoices = useMemo(
    () => (status === "all" ? INVOICES : INVOICES.filter((i) => i.status === status)),
    [status],
  );

  const totals = useMemo(() => {
    const paid = INVOICES.filter((i) => i.status === "paid").reduce((a, b) => a + b.amount, 0);
    const pending = INVOICES.filter((i) => i.status === "pending").reduce((a, b) => a + b.amount, 0);
    const late = INVOICES.filter((i) => i.status === "late").reduce((a, b) => a + b.amount, 0);
    return { paid, pending, late, all: paid + pending + late };
  }, []);

  // Period-based KPI adjustments for a sense of interactivity
  const periodFactor: Record<Period, number> = { "7j": 0.24, "30j": 1, "90j": 2.8, annee: 11.2 };
  const f = periodFactor[period];

  const fmtEur = (n: number) =>
    n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";

  const segments = breakdown === "product" ? PRODUCT_SPLIT : CITY_SPLIT;

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>Finances</h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Revenus, encaissements, commissions — vue consolidée.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="glass-segmented">
            {PERIODS.map((p) => (
              <button
                key={p.k}
                type="button"
                className={period === p.k ? "active" : ""}
                onClick={() => setPeriod(p.k)}
              >
                {p.l}
              </button>
            ))}
          </div>
          <button type="button" className="glass-btn">
            <Icon name="download" size={14} /> Exporter
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="glass-kpigrid" style={{ marginBottom: 20 }}>
        {[
          { l: "MRR", v: fmtEur(Math.round(28600 * f)), s: "+12 % vs période préc.", up: true },
          { l: "Encaissé", v: fmtEur(Math.round(19820 * f)), s: `${INVOICES.filter((i) => i.status === "paid").length} factures payées`, up: true },
          { l: "En attente", v: fmtEur(Math.round(6140 * f)), s: `${INVOICES.filter((i) => i.status === "pending").length} factures en cours`, up: false },
          { l: "Commissions", v: fmtEur(Math.round(1880 * f)), s: "8 % des revenus", up: true },
        ].map((k) => (
          <div key={k.l} className="glass-kpi">
            <div className="label">{k.l}</div>
            <div className="value">{k.v}</div>
            <div className="sub">
              <span className={k.up ? "trend-up" : "trend-down"}>
                <Icon name={k.up ? "trending-up" : "trending-down"} size={12} />{" "}
              </span>
              {k.s}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Top clients */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }}>
        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 8 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14 }}>Revenus — {PERIODS.find((p) => p.k === period)?.l.toLowerCase()}</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                Flocage + Borne cumulés
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: "var(--navy)",
                  }}
                />
                Flocage
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: "#3B82F6",
                  }}
                />
                Borne
              </div>
            </div>
          </div>
          <StackedArea />
          <div className="glass-stat-grid">
            <div className="glass-stat">
              <div className="stat-label">Revenu net</div>
              <div className="stat-val">
                {fmtEur(Math.round(25660 * f))}
              </div>
              <div className="stat-sub"><span className="up">+14 %</span></div>
            </div>
            <div className="glass-stat">
              <div className="stat-label">Panier moyen</div>
              <div className="stat-val">
                {fmtEur(Math.round(1820))}
              </div>
              <div className="stat-sub"><span className="up">+3 %</span></div>
            </div>
            <div className="glass-stat">
              <div className="stat-label">Marge brute</div>
              <div className="stat-val">62 <span className="currency">%</span></div>
              <div className="stat-sub"><span className="up">+1,4 pt</span></div>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Top clients</h3>
            <span style={{ fontSize: 12, color: "var(--gray-500)" }}>Part du CA</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TOP_CLIENTS.map((t) => (
              <div key={t.name}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <div
                    className="brand-logo"
                    style={{ background: t.color, width: 30, height: 30, fontSize: 11 }}
                  >
                    {t.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.name}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{fmtEur(t.rev)}</div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    paddingLeft: 40,
                  }}
                >
                  <div className="glass-progress" style={{ flex: 1, height: 6 }}>
                    <span style={{ width: t.share + "%" }} />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: t.trend >= 0 ? "var(--success)" : "var(--danger)",
                      fontWeight: 600,
                      minWidth: 36,
                      textAlign: "right",
                    }}
                  >
                    {t.trend >= 0 ? "+" : ""}{t.trend} %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices + Upcoming */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 20 }}>
        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14 }}>Factures récentes</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                {filteredInvoices.length} factures ·{" "}
                {fmtEur(filteredInvoices.reduce((a, b) => a + b.amount, 0))}
              </p>
            </div>
            <div className="glass-segmented">
              {(
                [
                  ["all", `Toutes · ${INVOICES.length}`],
                  ["paid", `Payées · ${INVOICES.filter((i) => i.status === "paid").length}`],
                  ["pending", `En cours · ${INVOICES.filter((i) => i.status === "pending").length}`],
                  ["late", `En retard · ${INVOICES.filter((i) => i.status === "late").length}`],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  className={status === k ? "active" : ""}
                  onClick={() => setStatus(k)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <table className="glass-table">
            <thead>
              <tr>
                <th>Facture</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Montant</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} style={{ cursor: "pointer" }}>
                  <td>
                    <span style={{ fontWeight: 600, fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>
                      {inv.num}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        className="brand-logo"
                        style={{ background: inv.clientColor, width: 26, height: 26, fontSize: 10 }}
                      >
                        {inv.clientInitials}
                      </div>
                      <span>{inv.client}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--gray-500)" }}>{inv.date}</td>
                  <td>
                    <span
                      className={
                        "g-chip " +
                        (inv.status === "paid"
                          ? "success"
                          : inv.status === "pending"
                            ? "info"
                            : "danger")
                      }
                    >
                      <span className="dot" />
                      {inv.status === "paid"
                        ? "Payée"
                        : inv.status === "pending"
                          ? "En cours"
                          : "En retard"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{fmtEur(inv.amount)}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 4 }}>
                      <button
                        type="button"
                        className="glass-btn ghost compact"
                        title="Voir"
                      >
                        <Icon name="eye" size={13} />
                      </button>
                      <button
                        type="button"
                        className="glass-btn ghost compact"
                        title="Télécharger"
                      >
                        <Icon name="download" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid rgba(0,0,0,0.06)",
              fontSize: 12,
              color: "var(--gray-500)",
            }}
          >
            <span>Total {status === "all" ? "toutes factures" : status === "paid" ? "payées" : status === "pending" ? "en cours" : "en retard"}</span>
            <strong style={{ color: "var(--black)" }}>
              {fmtEur(filteredInvoices.reduce((a, b) => a + b.amount, 0))}
            </strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Échéances à venir</h3>
            <span className="g-chip outline">
              <Icon name="calendar" size={11} /> 10 prochains jours
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {UPCOMING.map((u, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: "var(--navy-soft)",
                  borderRadius: 14,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.85)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color:
                      u.tone === "success"
                        ? "var(--success)"
                        : u.tone === "warning"
                          ? "var(--warning)"
                          : "var(--navy)",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={u.icon} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{u.who}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>
                    {u.when}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtEur(u.amount)}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <span style={{ color: "var(--gray-500)" }}>Encaissements prévus</span>
            <strong>{fmtEur(UPCOMING.reduce((a, b) => a + b.amount, 0))}</strong>
          </div>
        </div>
      </div>

      {/* Breakdown + Commissions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>Répartition des revenus</h3>
            <div className="glass-segmented">
              <button
                type="button"
                className={breakdown === "product" ? "active" : ""}
                onClick={() => setBreakdown("product")}
              >
                Produit
              </button>
              <button
                type="button"
                className={breakdown === "city" ? "active" : ""}
                onClick={() => setBreakdown("city")}
              >
                Ville
              </button>
            </div>
          </div>

          {/* Stacked bar */}
          <div
            style={{
              display: "flex",
              height: 14,
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: 16,
              background: "rgba(0,0,0,0.04)",
            }}
          >
            {segments.map((s) => (
              <div
                key={s.label}
                style={{
                  width: s.share + "%",
                  background: s.color,
                }}
                title={`${s.label} · ${s.share} %`}
              />
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {segments.map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background: s.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontSize: 13 }}>{s.label}</span>
                <span style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 600 }}>
                  {s.share} %
                </span>
                <span style={{ minWidth: 80, textAlign: "right", fontWeight: 700, fontSize: 13 }}>
                  {fmtEur(s.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14 }}>Commissions chauffeurs</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                Top 5 · {fmtEur(COMMISSIONS.reduce((a, b) => a + b.amount, 0))} ce mois
              </p>
            </div>
            <button type="button" className="glass-btn ghost compact">
              <Icon name="arrow-right" size={13} /> Détail
            </button>
          </div>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Chauffeur</th>
                <th style={{ textAlign: "right" }}>Courses</th>
                <th style={{ textAlign: "right" }}>Taux</th>
                <th style={{ textAlign: "right" }}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {COMMISSIONS.map((c) => (
                <tr key={c.name}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        className="brand-logo"
                        style={{
                          background: "var(--navy)",
                          color: "#fff",
                          width: 28,
                          height: 28,
                          fontSize: 10,
                        }}
                      >
                        {c.initials}
                      </div>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", color: "var(--gray-600)" }}>{c.rides}</td>
                  <td style={{ textAlign: "right", color: "var(--gray-500)" }}>8 %</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{fmtEur(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            style={{
              marginTop: 10,
              paddingTop: 12,
              borderTop: "1px solid rgba(0,0,0,0.06)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <span style={{ color: "var(--gray-500)" }}>Prochain versement</span>
            <strong>30 avr.</strong>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div
        className="glass-panel"
        style={{
          padding: "18px 24px",
          marginTop: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Total facturé
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>
              {fmtEur(totals.all)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Payé
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--success)" }}>
              {fmtEur(totals.paid)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              En cours
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--info)" }}>
              {fmtEur(totals.pending)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              En retard
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--danger)" }}>
              {fmtEur(totals.late)}
            </div>
          </div>
        </div>
        <button type="button" className="glass-btn">
          <Icon name="plus" size={14} /> Nouvelle facture
        </button>
      </div>
    </div>
  );
}
