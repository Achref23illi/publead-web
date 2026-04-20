"use client";

/**
 * ChauffeursPro — pro UI drivers directory.
 * 1:1 port of other-screens.jsx's <Chauffeurs> screen + its active-driver sheet.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { DRIVERS_VALID, type DriverActive } from "@/lib/data";

type ViewMode = "liste" | "cartes";

interface ActiveDriverSheetProps {
  row: DriverActive;
  onClose: () => void;
}

function ActiveDriverSheet({ row, onClose }: ActiveDriverSheetProps) {
  const [tab, setTab] = useState<"profile" | "vehicle" | "docs" | "campaigns" | "payments">(
    "profile",
  );

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-header">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              className="avatar-initials"
              style={{ width: 64, height: 64, fontSize: 22 }}
            >
              {row.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>
                {row.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span className={"chip " + (row.status === "Actif" ? "chip-success" : "chip-warning")}>
                  <span className="dot" /> {row.status}
                </span>
                <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                  Inscrit 12 janv. 2025
                </span>
                <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                  · {row.rating.toFixed(1)} ★
                </span>
              </div>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ borderBottom: "1px solid var(--gray-200)", padding: "0 24px" }}>
          <div className="tabs" style={{ marginBottom: 0, border: "none" }}>
            {(
              [
                ["profile", "Profil"],
                ["vehicle", "Véhicule"],
                ["docs", "Documents"],
                ["campaigns", "Campagnes"],
                ["payments", "Paiements"],
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
        </div>
        <div className="sheet-body">
          {tab === "profile" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                ["Téléphone", "+33 6 12 34 56 78"],
                ["Email", row.name.toLowerCase().replace(" ", ".") + "@gmail.com"],
                ["Adresse", "42 rue de la République, " + row.city],
                ["Campagnes réalisées", String(row.camp)],
                ["Kilomètres cumulés", row.km.toLocaleString("fr-FR") + " km"],
                ["Note moyenne", row.rating.toFixed(1) + " ★"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--gray-500)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {l}
                  </div>
                  <div style={{ fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {tab === "vehicle" && (
            <div>
              <div className="placeholder-img" style={{ height: 180, marginBottom: 16 }}>
                photo véhicule
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div className="input-label">Modèle</div>
                  <div style={{ fontWeight: 600 }}>{row.vehicle}</div>
                </div>
                <div>
                  <div className="input-label">Plaque</div>
                  <div style={{ fontWeight: 600 }}>{row.plate}</div>
                </div>
                <div>
                  <div className="input-label">Année</div>
                  <div>2022</div>
                </div>
                <div>
                  <div className="input-label">Couleur</div>
                  <div>Blanc nacré</div>
                </div>
              </div>
            </div>
          )}
          {tab === "docs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "Permis de conduire", date: "12 janv. 2025", ok: true },
                { name: "Carte grise", date: "12 janv. 2025", ok: true },
                { name: "Attestation assurance", date: "02 avr. 2026", ok: true },
                { name: "Photos du véhicule", date: "12 janv. 2025", ok: true },
              ].map((d) => (
                <div key={d.name} className="file-tile" style={{ justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <div className="file-thumb">
                      <Icon name="file-text" size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                        Déposé le {d.date}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="btn btn-ghost compact">
                      Télécharger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "campaigns" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "Renault Électrique", period: "14 avr. → 14 mai", km: 1240, status: "En cours" },
                { name: "SoBio Market", period: "10 mar. → 10 avr.", km: 960, status: "Terminée" },
                { name: "Maison Lavande", period: "20 avr. → 20 mai", km: 140, status: "En cours" },
              ].map((c) => (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    border: "1px solid var(--gray-200)",
                    borderRadius: 10,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{c.period}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {c.km.toLocaleString("fr-FR")} km
                    </span>
                    <span
                      className={"chip " + (c.status === "En cours" ? "chip-info" : "chip-neutral")}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "payments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { ref: "PAY-2026-0412", date: "12 avr. 2026", amount: "420 €", status: "Payé" },
                { ref: "PAY-2026-0328", date: "28 mar. 2026", amount: "380 €", status: "Payé" },
                { ref: "PAY-2026-0314", date: "14 mar. 2026", amount: "460 €", status: "Payé" },
              ].map((p) => (
                <div
                  key={p.ref}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    border: "1px solid var(--gray-200)",
                    borderRadius: 10,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.ref}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{p.date}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{p.amount}</span>
                    <span className="chip chip-success">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="sheet-footer">
          <button type="button" className="btn btn-ghost btn-danger-ghost">
            Suspendre le compte
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fermer
            </button>
            <button type="button" className="btn btn-primary">
              Modifier
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function ChauffeursPro() {
  const [view, setView] = useState<ViewMode>("liste");
  const [detail, setDetail] = useState<DriverActive | null>(null);
  const rows = DRIVERS_VALID;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Chauffeurs</h1>
          <p className="subtitle">Répertoire des chauffeurs actifs et en pause.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={"chip " + (view === "liste" ? "chip-filled-navy" : "chip-outline")}
            onClick={() => setView("liste")}
          >
            <Icon name="list" size={12} /> Liste
          </button>
          <button
            type="button"
            className={"chip " + (view === "cartes" ? "chip-filled-navy" : "chip-outline")}
            onClick={() => setView("cartes")}
          >
            <Icon name="grid" size={12} /> Cartes
          </button>
        </div>
      </div>

      <div className="grid grid-12 mb-6" style={{ gap: 16 }}>
        {[
          { l: "Total", v: "128", s: "+8 ce mois-ci" },
          { l: "Validés", v: "112", s: "87 % du total" },
          { l: "En attente", v: "12", s: "à examiner" },
          { l: "Km ce mois", v: "92 340", s: "objectif 100 000" },
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

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button type="button" className="chip chip-outline">
          <Icon name="map-pin" size={12} /> Villes
        </button>
        <button type="button" className="chip chip-outline">
          <Icon name="car" size={12} /> Véhicule
        </button>
        <button type="button" className="chip chip-outline">
          <Icon name="star" size={12} /> Note ≥ 4,5
        </button>
        <span style={{ flex: 1 }} />
        <div style={{ position: "relative" }}>
          <Icon
            name="search"
            size={14}
            style={{ position: "absolute", left: 12, top: 10, color: "var(--gray-500)" }}
          />
          <input
            className="input compact"
            placeholder="Rechercher…"
            style={{ paddingLeft: 34, width: 260, height: 36 }}
          />
        </div>
      </div>

      {view === "liste" ? (
        <div className="card card-flush">
          <table className="table">
            <thead>
              <tr>
                <th>Chauffeur</th>
                <th>Ville</th>
                <th>Véhicule</th>
                <th style={{ textAlign: "right" }}>Campagnes</th>
                <th style={{ textAlign: "right" }}>Km</th>
                <th style={{ textAlign: "right" }}>Note</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => setDetail(r)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="avatar-initials" style={{ width: 36, height: 36 }}>
                        {r.name
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{r.plate}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.city}</td>
                  <td>{r.vehicle}</td>
                  <td style={{ textAlign: "right" }}>{r.camp}</td>
                  <td style={{ textAlign: "right" }}>{r.km.toLocaleString("fr-FR")}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{r.rating.toFixed(1)} ★</td>
                  <td>
                    <span
                      className={"chip " + (r.status === "Actif" ? "chip-success" : "chip-warning")}
                    >
                      <span className="dot" /> {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-12" style={{ gap: 16 }}>
          {rows.map((r) => (
            <div
              key={r.id}
              className="col-4"
              style={{
                background: "#fff",
                border: "1px solid var(--gray-200)",
                borderRadius: 12,
                padding: 18,
                cursor: "pointer",
              }}
              onClick={() => setDetail(r)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="avatar-initials" style={{ width: 48, height: 48, fontSize: 16 }}>
                  {r.name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{r.city}</div>
                </div>
                <span
                  className={"chip " + (r.status === "Actif" ? "chip-success" : "chip-warning")}
                >
                  <span className="dot" /> {r.status}
                </span>
              </div>
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid var(--gray-100)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  textAlign: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{r.camp}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Campagnes</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {(r.km / 1000).toFixed(1)}k
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Km</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{r.rating.toFixed(1)}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Note</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && <ActiveDriverSheet row={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
