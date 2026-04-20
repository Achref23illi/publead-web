"use client";

/**
 * EntreprisesGlass — rond/vitré companies grid.
 * Port of glass-screens.jsx's <EntreprisesGlass>.
 */

import { Icon } from "@/components/Icon";

interface Company {
  id: string;
  name: string;
  sector: string;
  city: string;
  color: string;
  campaigns: number;
  mrr: string;
}

const COMPANIES: Company[] = [
  { id: "e1", name: "Renault France", sector: "Automobile", city: "Boulogne", color: "#FDD835", campaigns: 4, mrr: "8 400 €" },
  { id: "e2", name: "Le Clos des Vignes", sector: "Viticulture", city: "Saint-Émilion", color: "#8D6E63", campaigns: 2, mrr: "3 200 €" },
  { id: "e3", name: "Maison Lavande", sector: "Beauté", city: "Grasse", color: "#9C27B0", campaigns: 1, mrr: "1 250 €" },
  { id: "e4", name: "Kalis Gym", sector: "Sport", city: "Paris 11e", color: "#E53935", campaigns: 1, mrr: "940 €" },
  { id: "e5", name: "Fédération Artisans", sector: "Alimentaire", city: "Nantes", color: "#795548", campaigns: 3, mrr: "5 800 €" },
  { id: "e6", name: "SoBio Market SAS", sector: "Alimentaire", city: "Lyon 7e", color: "#43A047", campaigns: 0, mrr: "0 €" },
  { id: "e7", name: "Nova Cosmétique", sector: "Beauté", city: "Paris 8e", color: "#EC407A", campaigns: 1, mrr: "0 €" },
  { id: "e8", name: "Château de Bellevue", sector: "Hôtellerie", city: "Bordeaux", color: "#0EA5E9", campaigns: 0, mrr: "0 €" },
];

export function EntreprisesGlass() {
  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>Entreprises</h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Annonceurs clients — {COMPANIES.length} au total.
          </p>
        </div>
        <button type="button" className="glass-btn glass-btn-primary">
          <Icon name="plus" size={14} /> Nouvelle entreprise
        </button>
      </div>

      <div className="glass-cardgrid">
        {COMPANIES.map((c) => (
          <div key={c.id} className="glass-tile">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                className="brand-logo"
                style={{ background: c.color, width: 40, height: 40, fontSize: 15 }}
              >
                {c.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
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
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--gray-500)" }}>
              <Icon name="map-pin" size={12} /> {c.city}
            </div>
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{c.campaigns}</div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Camp.</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.mrr}</div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>MRR</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
