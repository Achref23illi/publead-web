"use client";

/**
 * EnterprisePerformance — advertiser analytics dashboard.
 * Period toggle, impressions trend, city split, campaign split, export actions.
 */

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { StackedArea, HorizontalBars } from "@/components/charts";
import { CAMPAIGNS } from "@/lib/data";

type Period = "7j" | "30j" | "90j" | "annee";

const PERIOD_LABEL: Record<Period, string> = {
  "7j": "7 j",
  "30j": "30 j",
  "90j": "90 j",
  annee: "Année",
};

const BASE_KPIS = {
  impressions: 486320,
  reach: 124800,
  km: 31240,
  hours: 2136,
};

const PERIOD_FACTOR: Record<Period, number> = {
  "7j": 0.23,
  "30j": 1,
  "90j": 2.8,
  annee: 11.6,
};

const CITY_SPLIT = [
  { city: "Paris", count: 182400 },
  { city: "Lyon", count: 96320 },
  { city: "Marseille", count: 68200 },
  { city: "Bordeaux", count: 54120 },
  { city: "Toulouse", count: 41200 },
  { city: "Nantes", count: 28300 },
];

const CAMPAIGN_SHARE = [
  { id: "c1", name: "Nova Printemps", pct: 38, color: "#EC407A" },
  { id: "c2", name: "Nova Été — teaser", pct: 27, color: "#A855F7" },
  { id: "c3", name: "Nova Bornes Paris", pct: 22, color: "#3B82F6" },
  { id: "c4", name: "Nova Flocage Lyon", pct: 13, color: "#14B8A6" },
];

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

export function EnterprisePerformance() {
  const [period, setPeriod] = useState<Period>("30j");

  const kpis = useMemo(() => {
    const f = PERIOD_FACTOR[period];
    return {
      impressions: Math.round(BASE_KPIS.impressions * f),
      reach: Math.round(BASE_KPIS.reach * f),
      km: Math.round(BASE_KPIS.km * f),
      hours: Math.round(BASE_KPIS.hours * f),
    };
  }, [period]);

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Performance
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Mesurez l&apos;impact de vos campagnes — {PERIOD_LABEL[period]}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="ent-seg">
            {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
              <button
                key={p}
                className={period === p ? "active" : ""}
                onClick={() => setPeriod(p)}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
          <button type="button" className="glass-btn ghost">
            <Icon name="download" size={14} /> CSV
          </button>
          <button type="button" className="glass-btn">
            <Icon name="file-text" size={14} /> PDF
          </button>
        </div>
      </div>

      <div className="glass-kpigrid">
        {[
          { l: "Impressions", v: fmt(kpis.impressions), s: "+18 % vs période précédente" },
          { l: "Reach estimé", v: fmt(kpis.reach), s: "audience unique" },
          { l: "Kilomètres", v: `${fmt(kpis.km)} km`, s: "parcourus par les chauffeurs" },
          { l: "Heures de diffusion", v: `${fmt(kpis.hours)} h`, s: "toutes campagnes confondues" },
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
                fontSize: 28,
                fontWeight: 700,
                margin: "4px 0",
              }}
            >
              {k.v}
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{k.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginTop: 24 }}>
        <div className="glass-panel">
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>Impressions par jour</h3>
            <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
              Flocage vs Borne
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <StackedArea height={260} />
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 10,
                fontSize: 11.5,
                color: "var(--gray-500)",
              }}
            >
              <Legend color="#233466" label="Flocage véhicule" />
              <Legend color="#3B82F6" label="Leader Borne" />
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>Répartition par campagne</h3>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {CAMPAIGN_SHARE.map((c) => (
              <div key={c.id} style={{ display: "grid", gap: 4 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  <span>{c.name}</span>
                  <span style={{ color: "var(--gray-500)" }}>{c.pct} %</span>
                </div>
                <div
                  style={{
                    height: 10,
                    background: "rgba(35,52,102,0.08)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: c.pct + "%",
                      height: "100%",
                      background: c.color,
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: 24 }}>
        <div className="glass-panelhead">
          <h3 style={{ margin: 0, fontSize: 14 }}>Couverture par ville</h3>
          <button type="button" className="glass-btn ghost" style={{ padding: "4px 10px", fontSize: 11 }}>
            Détails <Icon name="chevron-right" size={12} />
          </button>
        </div>
        <div style={{ padding: 16 }}>
          <HorizontalBars data={CITY_SPLIT} />
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: 24 }}>
        <div className="glass-panelhead">
          <h3 style={{ margin: 0, fontSize: 14 }}>Rapports téléchargeables</h3>
        </div>
        <div style={{ padding: 16, display: "grid", gap: 10 }}>
          {[
            { name: "Rapport mensuel — mars 2026", size: "PDF · 2,1 Mo", when: "01 avr." },
            { name: "Rapport mensuel — février 2026", size: "PDF · 1,9 Mo", when: "01 mar." },
            { name: "Export impressions — Q1 2026", size: "CSV · 420 Ko", when: "02 avr." },
            { name: "Rapport Nova Printemps — final", size: "PDF · 3,4 Mo", when: "15 mar." },
          ].map((r) => (
            <div
              key={r.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(35,52,102,0.08)",
                borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #233466, #3A4B8A)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="file-text" size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
                    {r.size} · {r.when}
                  </div>
                </div>
              </div>
              <button type="button" className="glass-btn ghost">
                <Icon name="download" size={14} /> Télécharger
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: color,
          display: "inline-block",
        }}
      />
      <span>{label}</span>
    </div>
  );
}

// Silence unused-import warning for CAMPAIGNS (kept for future deep-link).
void CAMPAIGNS;
