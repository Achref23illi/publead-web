"use client";

/**
 * DashboardGlass — rond/vitré dashboard.
 * Port of dashboard-glass.jsx's <DashboardGlass>.
 */

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Sparkline } from "@/components/charts";
import { CAMPAIGNS, CITY_DIST, VALIDATION_QUEUE } from "@/lib/data";

export function DashboardGlass() {
  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Vue d&apos;ensemble
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Activité consolidée — Publeader 20 avr. 2026
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn ghost">
            <Icon name="calendar" size={14} /> 30 jours
          </button>
          <Link href="/campagnes/new" className="glass-btn">
            <Icon name="plus" size={14} /> Nouvelle campagne
          </Link>
        </div>
      </div>

      <div
        className="glass-hero"
        style={{
          padding: "28px 32px",
          marginBottom: 20,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="glass-hero-content">
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            Revenus cumulés
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 40,
              fontWeight: 700,
              margin: "4px 0",
            }}
          >
            24 820 €
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>+12 % vs mois précédent</div>
          <div style={{ marginTop: 18 }}>
            <Sparkline
              data={[12, 14, 13, 17, 16, 19, 18, 22, 21, 24, 23, 27, 26, 29, 28]}
            />
          </div>
        </div>
      </div>

      <div className="glass-kpigrid">
        {[
          { l: "Campagnes actives", v: "9", s: "+2 cette semaine" },
          { l: "Chauffeurs validés", v: "112", s: "sur 128 comptes" },
          { l: "Bornes en service", v: "6 / 8", s: "2 en alerte" },
          { l: "Dossiers à valider", v: "16", s: "dont 12 chauffeurs" },
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
              className="num"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
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
            <h3 style={{ margin: 0, fontSize: 14 }}>Campagnes en cours</h3>
            <Link
              href="/campagnes"
              style={{
                fontSize: 12,
                color: "var(--navy)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Voir tout →
            </Link>
          </div>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Campagne</th>
                <th>Ville</th>
                <th style={{ textAlign: "right" }}>Progression</th>
                <th style={{ textAlign: "right" }}>Revenu</th>
              </tr>
            </thead>
            <tbody>
              {CAMPAIGNS.filter((c) => c.status === "active")
                .slice(0, 5)
                .map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          className="brand-logo"
                          style={{ background: c.color, width: 32, height: 32, fontSize: 12 }}
                        >
                          {c.initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.brand}</div>
                          <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{c.period}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.city}</td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}
                      >
                        <span style={{ fontSize: 12, color: "var(--gray-500)" }}>{c.progress}%</span>
                        <div className="glass-progress" style={{ width: 60 }}>
                          <div style={{ width: c.progress + "%" }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{c.rev}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="glass-panel">
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>À valider</h3>
            <Link
              href="/validations"
              style={{
                fontSize: 12,
                color: "var(--navy)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Voir tout →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16 }}>
            {VALIDATION_QUEUE.map((v) => (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "var(--navy-soft)",
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{v.kind}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{v.since}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: 24 }}>
        <div className="glass-panelhead">
          <h3 style={{ margin: 0, fontSize: 14 }}>Distribution par ville</h3>
        </div>
        <div style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 12 }}>
          {CITY_DIST.map((c) => (
            <div key={c.city} className="glass-city-count">
              <div style={{ fontSize: 12, fontWeight: 600 }}>{c.city}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>{c.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
