"use client";

/**
 * RapportsGlass — rond/vitré reports library.
 * Port of glass-screens.jsx's <RapportsGlass>.
 */

import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";

interface Report {
  id: string;
  title: string;
  desc: string;
  period: string;
  size: string;
  icon: IconName;
  color: string;
}

const REPORTS: Report[] = [
  { id: "r1", title: "Bilan mensuel — mars 2026", desc: "Revenus, campagnes, KPIs consolidés.", period: "mars 2026", size: "1,8 Mo", icon: "bar-chart-3", color: "#233466" },
  { id: "r2", title: "Export comptable", desc: "Factures, commissions, dépenses.", period: "mars 2026", size: "420 Ko", icon: "banknote", color: "#3B82F6" },
  { id: "r3", title: "Performance Leader Borne", desc: "Sprays, revenus, alertes parfum.", period: "Q1 2026", size: "960 Ko", icon: "spray-can", color: "#8D6E63" },
  { id: "r4", title: "Activité chauffeurs", desc: "Top performers, km, notes.", period: "mars 2026", size: "520 Ko", icon: "car", color: "#43A047" },
  { id: "r5", title: "Rapport annonceurs", desc: "Engagement, remplissage, NPS.", period: "Q1 2026", size: "1,2 Mo", icon: "building-2", color: "#9C27B0" },
  { id: "r6", title: "Audit conformité RGPD", desc: "Données, conservation, droits.", period: "Q1 2026", size: "2,4 Mo", icon: "shield-check", color: "#E53935" },
];

export function RapportsGlass() {
  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>Rapports</h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Exports mensuels et analyses.
          </p>
        </div>
      </div>

      <div className="glass-cardgrid">
        {REPORTS.map((r) => (
          <div key={r.id} className="glass-tile">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: r.color,
                  color: "#fff",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={r.icon} size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>PDF · {r.size}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", margin: "14px 0" }}>
              {r.desc}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 12,
                borderTop: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                <Icon name="calendar" size={12} /> {r.period}
              </span>
              <button type="button" className="glass-btn glass-btn-primary">
                <Icon name="download" size={14} /> Télécharger
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
