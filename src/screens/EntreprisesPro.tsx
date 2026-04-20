"use client";

/**
 * EntreprisesPro — pro UI companies directory.
 * 1:1 port of other-screens.jsx's <Entreprises> screen.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";

interface Company {
  id: string;
  name: string;
  sector: string;
  city: string;
  color: string;
  campaigns: number;
  mrr: string;
  status: "Actif" | "Pause" | "Nouveau";
  since: string;
}

const COMPANIES: Company[] = [
  { id: "e1", name: "Renault France", sector: "Automobile", city: "Boulogne-Billancourt", color: "#FDD835", campaigns: 4, mrr: "8 400 €", status: "Actif", since: "sept. 2024" },
  { id: "e2", name: "Le Clos des Vignes", sector: "Viticulture", city: "Saint-Émilion", color: "#8D6E63", campaigns: 2, mrr: "3 200 €", status: "Actif", since: "nov. 2024" },
  { id: "e3", name: "Maison Lavande", sector: "Beauté", city: "Grasse", color: "#9C27B0", campaigns: 1, mrr: "1 250 €", status: "Actif", since: "févr. 2026" },
  { id: "e4", name: "Kalis Gym", sector: "Sport", city: "Paris 11e", color: "#E53935", campaigns: 1, mrr: "940 €", status: "Actif", since: "mars 2026" },
  { id: "e5", name: "Fédération Artisans", sector: "Alimentaire", city: "Nantes", color: "#795548", campaigns: 3, mrr: "5 800 €", status: "Actif", since: "juin 2024" },
  { id: "e6", name: "SoBio Market SAS", sector: "Alimentaire", city: "Lyon 7e", color: "#43A047", campaigns: 0, mrr: "0 €", status: "Pause", since: "janv. 2024" },
  { id: "e7", name: "Nova Cosmétique", sector: "Beauté", city: "Paris 8e", color: "#EC407A", campaigns: 1, mrr: "0 €", status: "Nouveau", since: "il y a 3 h" },
  { id: "e8", name: "Château de Bellevue", sector: "Hôtellerie", city: "Bordeaux", color: "#0EA5E9", campaigns: 0, mrr: "0 €", status: "Nouveau", since: "il y a 6 h" },
];

export function EntreprisesPro() {
  const [detail, setDetail] = useState<Company | null>(null);
  const [sector, setSector] = useState<string>("tous");
  const sectors = Array.from(new Set(COMPANIES.map((c) => c.sector)));
  const rows =
    sector === "tous" ? COMPANIES : COMPANIES.filter((c) => c.sector === sector);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Entreprises</h1>
          <p className="subtitle">Annonceurs clients Publeader — en cours ou sous contrat.</p>
        </div>
        <button type="button" className="btn btn-primary">
          <Icon name="plus" size={18} /> Nouvelle entreprise
        </button>
      </div>

      <div className="grid grid-12 mb-6" style={{ gap: 16 }}>
        {[
          { l: "Total", v: "32", s: "+3 ce mois-ci" },
          { l: "Actives", v: "24", s: "avec campagne en cours" },
          { l: "MRR", v: "28 600 €", s: "+12 % vs mois précédent" },
          { l: "À valider", v: "4", s: "dossiers en attente" },
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
        <button
          type="button"
          className={"chip " + (sector === "tous" ? "chip-filled-navy" : "chip-outline")}
          onClick={() => setSector("tous")}
        >
          Tous secteurs
        </button>
        {sectors.map((s) => (
          <button
            key={s}
            type="button"
            className={"chip " + (sector === s ? "chip-filled-navy" : "chip-outline")}
            onClick={() => setSector(s)}
          >
            {s}
          </button>
        ))}
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

      <div className="grid grid-12" style={{ gap: 16 }}>
        {rows.map((c) => (
          <div
            key={c.id}
            className="col-3"
            style={{
              background: "#fff",
              border: "1px solid var(--gray-200)",
              borderRadius: 12,
              padding: 18,
              cursor: "pointer",
            }}
            onClick={() => setDetail(c)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                className="brand-logo"
                style={{ background: c.color, width: 40, height: 40, fontSize: 16 }}
              >
                {c.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{c.sector}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--gray-500)" }}>
              <Icon name="map-pin" size={12} /> {c.city}
            </div>
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid var(--gray-100)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{c.campaigns}</div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Campagnes</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.mrr}</div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>MRR</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <span
                className={
                  "chip " +
                  (c.status === "Actif"
                    ? "chip-success"
                    : c.status === "Nouveau"
                    ? "chip-info"
                    : "chip-warning")
                }
              >
                <span className="dot" /> {c.status}
              </span>
              <span style={{ marginLeft: 8, fontSize: 11, color: "var(--gray-500)" }}>
                Depuis {c.since}
              </span>
            </div>
          </div>
        ))}
      </div>

      {detail && (
        <>
          <div className="backdrop" onClick={() => setDetail(null)} />
          <div className="sheet">
            <div className="sheet-header">
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  className="brand-logo"
                  style={{ background: detail.color, width: 64, height: 64, fontSize: 26 }}
                >
                  {detail.name[0]}
                </div>
                <div>
                  <div
                    style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}
                  >
                    {detail.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>
                    {detail.sector} · {detail.city}
                  </div>
                </div>
              </div>
              <button type="button" className="icon-btn" onClick={() => setDetail(null)}>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="sheet-body">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {[
                  ["Campagnes", String(detail.campaigns)],
                  ["MRR", detail.mrr],
                  ["Statut", detail.status],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    style={{
                      background: "var(--navy-soft)",
                      borderRadius: 10,
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--navy)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {l}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 14, margin: "0 0 12px" }}>Contacts</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { name: "Claire Dupont", role: "Responsable marketing", email: "c.dupont@example.com" },
                  { name: "Marc Lemaire", role: "Directeur", email: "m.lemaire@example.com" },
                ].map((p) => (
                  <div
                    key={p.email}
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
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{p.role}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{p.email}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="sheet-footer">
              <button type="button" className="btn btn-ghost btn-danger-ghost">
                Suspendre le compte
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setDetail(null)}>
                  Fermer
                </button>
                <button type="button" className="btn btn-primary">
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
