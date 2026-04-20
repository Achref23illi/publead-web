"use client";

/**
 * FinancesPro — pro UI finances screen with tabs, KPIs, and stacked area.
 * 1:1 port of other-screens.jsx's <Finances>.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { StackedArea } from "@/components/charts";

type Tab = "factures" | "commissions" | "depenses";

interface Invoice {
  id: string;
  ref: string;
  company: string;
  date: string;
  amount: string;
  status: "Payée" | "Envoyée" | "En retard" | "Brouillon";
}

const INVOICES: Invoice[] = [
  { id: "f1", ref: "F-2026-0412", company: "SoBio Market SAS", date: "12 avr. 2026", amount: "2 000 €", status: "Payée" },
  { id: "f2", ref: "F-2026-0410", company: "Renault France", date: "10 avr. 2026", amount: "3 200 €", status: "Envoyée" },
  { id: "f3", ref: "F-2026-0408", company: "Le Clos des Vignes", date: "08 avr. 2026", amount: "1 820 €", status: "Payée" },
  { id: "f4", ref: "F-2026-0401", company: "Maison Lavande", date: "01 avr. 2026", amount: "1 250 €", status: "En retard" },
  { id: "f5", ref: "F-2026-0328", company: "Fédération Artisans", date: "28 mar. 2026", amount: "5 800 €", status: "Payée" },
  { id: "f6", ref: "F-2026-0322", company: "Kalis Gym", date: "22 mar. 2026", amount: "940 €", status: "Brouillon" },
];

interface Commission {
  id: string;
  driver: string;
  campaign: string;
  km: number;
  amount: string;
  paid: boolean;
}

const COMMISSIONS: Commission[] = [
  { id: "c1", driver: "Lucas Fontaine", campaign: "Renault Électrique", km: 1240, amount: "420 €", paid: true },
  { id: "c2", driver: "Amélie Rousseau", campaign: "SoBio Market", km: 960, amount: "380 €", paid: true },
  { id: "c3", driver: "Nadia El-Amrani", campaign: "Artisan Boulanger", km: 1820, amount: "620 €", paid: false },
  { id: "c4", driver: "Inès Moreau", campaign: "Renault Électrique", km: 1040, amount: "360 €", paid: false },
];

interface Expense {
  id: string;
  label: string;
  category: string;
  date: string;
  amount: string;
}

const EXPENSES: Expense[] = [
  { id: "x1", label: "Parfum Rose #12 · 20 L", category: "Fourniture bornes", date: "08 avr. 2026", amount: "420 €" },
  { id: "x2", label: "Prestataire flocage — Lyon", category: "Sous-traitance", date: "04 avr. 2026", amount: "1 280 €" },
  { id: "x3", label: "Hébergement serveurs OVH", category: "Infrastructure", date: "01 avr. 2026", amount: "180 €" },
  { id: "x4", label: "Carburant tournée Paris", category: "Logistique", date: "28 mar. 2026", amount: "140 €" },
];

export function FinancesPro() {
  const [tab, setTab] = useState<Tab>("factures");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Finances</h1>
          <p className="subtitle">Factures, commissions chauffeurs, dépenses opérationnelles.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn btn-secondary">
            <Icon name="download" size={16} /> Exporter
          </button>
          <button type="button" className="btn btn-primary">
            <Icon name="plus" size={18} /> Nouvelle facture
          </button>
        </div>
      </div>

      <div className="grid grid-12 mb-6" style={{ gap: 16 }}>
        {[
          { l: "MRR", v: "28 600 €", s: "+12 % vs m-1" },
          { l: "Encaissé (mois)", v: "19 820 €", s: "14 factures" },
          { l: "En attente", v: "6 140 €", s: "3 factures" },
          { l: "Commissions dues", v: "1 880 €", s: "chauffeurs" },
        ].map((t) => (
          <div
            key={t.l}
            className="col-3"
            style={{ background: "var(--navy-soft)", borderRadius: 10, padding: "16px 18px" }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "var(--navy)",
                textTransform: "uppercase",
              }}
            >
              {t.l}
            </div>
            <div
              className="num"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 700,
                margin: "4px 0 2px",
              }}
            >
              {t.v}
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{t.s}</div>
          </div>
        ))}
      </div>

      <div className="card mb-6" style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 style={{ fontSize: 14, margin: 0 }}>Revenus par produit — 30 derniers jours</h3>
          <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  background: "#233466",
                  borderRadius: 2,
                  marginRight: 6,
                }}
              />
              Flocage
            </span>
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  background: "#3B82F6",
                  borderRadius: 2,
                  marginRight: 6,
                }}
              />
              Leader Borne
            </span>
          </div>
        </div>
        <StackedArea />
      </div>

      <div className="tabs">
        {(
          [
            ["factures", "Factures"],
            ["commissions", "Commissions chauffeurs"],
            ["depenses", "Dépenses"],
          ] as const
        ).map(([k, l]) => (
          <div
            key={k}
            className={"tab" + (tab === k ? " active" : "")}
            onClick={() => setTab(k)}
          >
            {l}
          </div>
        ))}
      </div>

      {tab === "factures" && (
        <div className="card card-flush">
          <table className="table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Entreprise</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Montant</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.ref}</td>
                  <td>{r.company}</td>
                  <td style={{ color: "var(--gray-500)" }}>{r.date}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{r.amount}</td>
                  <td>
                    <span
                      className={
                        "chip " +
                        (r.status === "Payée"
                          ? "chip-success"
                          : r.status === "En retard"
                          ? "chip-danger"
                          : r.status === "Brouillon"
                          ? "chip-neutral"
                          : "chip-info")
                      }
                    >
                      <span className="dot" /> {r.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button type="button" className="btn btn-ghost compact">
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "commissions" && (
        <div className="card card-flush">
          <table className="table">
            <thead>
              <tr>
                <th>Chauffeur</th>
                <th>Campagne</th>
                <th style={{ textAlign: "right" }}>Km</th>
                <th style={{ textAlign: "right" }}>Montant</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {COMMISSIONS.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.driver}</td>
                  <td>{r.campaign}</td>
                  <td style={{ textAlign: "right" }}>{r.km.toLocaleString("fr-FR")}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{r.amount}</td>
                  <td>
                    <span className={"chip " + (r.paid ? "chip-success" : "chip-warning")}>
                      <span className="dot" /> {r.paid ? "Payé" : "À payer"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button type="button" className="btn btn-ghost compact">
                      {r.paid ? "Reçu" : "Régler"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "depenses" && (
        <div className="card card-flush">
          <table className="table">
            <thead>
              <tr>
                <th>Libellé</th>
                <th>Catégorie</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Montant</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {EXPENSES.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.label}</td>
                  <td>{r.category}</td>
                  <td style={{ color: "var(--gray-500)" }}>{r.date}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{r.amount}</td>
                  <td style={{ textAlign: "right" }}>
                    <button type="button" className="btn btn-ghost compact">
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
