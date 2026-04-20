"use client";

/**
 * RapportsPro — pro UI reports library.
 * 1:1 port of other-screens.jsx's <Rapports>.
 */

import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";
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
  {
    id: "r1",
    title: "Bilan mensuel — mars 2026",
    desc: "Revenus, campagnes actives, km parcourus, KPIs consolidés.",
    period: "1–31 mars 2026",
    size: "1,8 Mo",
    icon: "bar-chart-3",
    color: "#233466",
  },
  {
    id: "r2",
    title: "Export comptable",
    desc: "Factures émises, commissions versées, dépenses opérationnelles.",
    period: "mars 2026",
    size: "420 Ko",
    icon: "banknote",
    color: "#3B82F6",
  },
  {
    id: "r3",
    title: "Performance Leader Borne",
    desc: "Sprays, revenus par borne, alertes parfum, uptime.",
    period: "Q1 2026",
    size: "960 Ko",
    icon: "spray-can",
    color: "#8D6E63",
  },
  {
    id: "r4",
    title: "Activité chauffeurs",
    desc: "Top performers, km, notes moyennes, taux de complétion.",
    period: "mars 2026",
    size: "520 Ko",
    icon: "car",
    color: "#43A047",
  },
  {
    id: "r5",
    title: "Rapport annonceurs",
    desc: "Score d'engagement, taux de remplissage, NPS.",
    period: "Q1 2026",
    size: "1,2 Mo",
    icon: "building-2",
    color: "#9C27B0",
  },
  {
    id: "r6",
    title: "Audit conformité RGPD",
    desc: "Données traitées, durées de conservation, droits exercés.",
    period: "Q1 2026",
    size: "2,4 Mo",
    icon: "shield-check",
    color: "#E53935",
  },
];

export function RapportsPro() {
  const { pushToast } = useToast();

  const downloadReport = (r: Report) => {
    pushToast({
      kind: "success",
      title: "Téléchargement lancé",
      desc: r.title + " (" + r.size + ")",
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Rapports</h1>
          <p className="subtitle">Exports mensuels et analyses à partager avec votre équipe.</p>
        </div>
        <button type="button" className="btn btn-primary">
          <Icon name="plus" size={18} /> Générer un rapport
        </button>
      </div>

      <div className="grid grid-12" style={{ gap: 16 }}>
        {REPORTS.map((r) => (
          <div
            key={r.id}
            className="col-4"
            style={{
              background: "#fff",
              border: "1px solid var(--gray-200)",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
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
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>PDF · {r.size}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--gray-600)", flex: 1 }}>{r.desc}</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 12,
                borderTop: "1px solid var(--gray-100)",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                <Icon name="calendar" size={12} /> {r.period}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="btn btn-ghost compact">
                  Aperçu
                </button>
                <button
                  type="button"
                  className="btn btn-secondary compact"
                  onClick={() => downloadReport(r)}
                >
                  <Icon name="download" size={14} /> Télécharger
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
