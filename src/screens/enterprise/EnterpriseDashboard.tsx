"use client";

/**
 * EnterpriseDashboard — advertiser home screen.
 * Scoped to a single brand account; shows KPI snapshot, impressions trend,
 * active campaigns, upcoming invoice, and quick actions.
 */

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Sparkline } from "@/components/charts";
import { CAMPAIGNS } from "@/lib/data";

// Advertiser-scoped subset of the agency's campaigns.
const MY_CAMPAIGNS = CAMPAIGNS.slice(0, 4);

const IMPRESSIONS_TREND = [
  120, 145, 128, 160, 182, 172, 195, 210, 230, 218, 244, 260, 255, 280, 296,
  310, 292, 320, 336, 354, 348, 372, 388, 402, 418, 410, 438, 460, 478, 495,
];

const RECENT_ACTIVITY = [
  { id: "a1", icon: "check-circle" as const, text: "Campagne « Nova Printemps » validée par l'équipe", when: "il y a 2 h", tone: "good" },
  { id: "a2", icon: "car" as const, text: "5 chauffeurs assignés à « Nova Été »", when: "hier", tone: "info" },
  { id: "a3", icon: "image" as const, text: "Nouveau visuel téléversé — Flocage.png", when: "hier", tone: "info" },
  { id: "a4", icon: "banknote" as const, text: "Facture F-2026-0418 prête à être réglée", when: "il y a 2 j", tone: "warn" },
  { id: "a5", icon: "bar-chart-3" as const, text: "Rapport hebdomadaire disponible", when: "il y a 3 j", tone: "info" },
];

const TONE_COLOR: Record<string, string> = {
  good: "#15803D",
  info: "#1D4ED8",
  warn: "#B45309",
};

export function EnterpriseDashboard() {
  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Bonjour, Nova Cosmétique
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Résumé de vos campagnes — 20 avr. 2026
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn ghost">
            <Icon name="calendar" size={14} /> 30 jours
          </button>
          <Link href="/enterprise/campagnes/new" className="glass-btn">
            <Icon name="plus" size={14} /> Nouvelle campagne
          </Link>
        </div>
      </div>

      {/* Brand hero */}
      <div className="ent-hero">
        <div className="ent-hero-row">
          <div>
            <div className="ent-hero-stat-label">Impressions ce mois-ci</div>
            <div className="ent-hero-stat-value">486 320</div>
            <div className="ent-hero-stat-sub">+18 % vs le mois dernier · objectif 520 000</div>
            <div style={{ marginTop: 18, maxWidth: 620 }}>
              <Sparkline data={IMPRESSIONS_TREND} />
            </div>
          </div>
          <div className="ent-hero-actions">
            <Link href="/enterprise/performance" className="ent-hero-btn">
              <Icon name="bar-chart-3" size={14} /> Voir le rapport
            </Link>
            <Link href="/enterprise/campagnes" className="ent-hero-btn solid">
              <Icon name="megaphone" size={14} /> Mes campagnes
            </Link>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="glass-kpigrid">
        {[
          { l: "Campagnes actives", v: "3", s: "1 en préparation" },
          { l: "Budget consommé", v: "7 820 €", s: "sur 12 000 € · 65 %" },
          { l: "Kilomètres parcourus", v: "9 340 km", s: "+12 % vs semaine passée" },
          { l: "Prochaine facture", v: "2 400 €", s: "échéance 30 avr." },
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
                fontSize: 30,
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

      {/* Active campaigns + recent activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginTop: 24 }}>
        <div className="glass-panel">
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>Mes campagnes en cours</h3>
            <Link
              href="/enterprise/campagnes"
              style={{ fontSize: 12, color: "var(--navy)", textDecoration: "none", fontWeight: 600 }}
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
                <th style={{ textAlign: "right" }}>Budget</th>
              </tr>
            </thead>
            <tbody>
              {MY_CAMPAIGNS.map((c) => (
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
                        <Link
                          href={`/enterprise/campagnes/${c.id}`}
                          style={{ fontWeight: 600, color: "#0A0E1F", textDecoration: "none" }}
                        >
                          {c.brand}
                        </Link>
                        <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{c.period}</div>
                      </div>
                    </div>
                  </td>
                  <td>{c.city}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
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
            <h3 style={{ margin: 0, fontSize: 14 }}>Activité récente</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16 }}>
            {RECENT_ACTIVITY.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  background: "var(--navy-soft)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    flex: "none",
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: TONE_COLOR[a.tone],
                  }}
                >
                  <Icon name={a.icon} size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "#0A0E1F", lineHeight: 1.4 }}>
                    {a.text}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>
                    {a.when}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="glass-panel" style={{ marginTop: 24 }}>
        <div className="glass-panelhead">
          <h3 style={{ margin: 0, fontSize: 14 }}>Actions rapides</h3>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            padding: 16,
          }}
        >
          {[
            { href: "/enterprise/campagnes/new", icon: "plus" as const, title: "Lancer une campagne", sub: "Brief, ciblage, budget" },
            { href: "/enterprise/assets", icon: "image" as const, title: "Téléverser des assets", sub: "Visuels prêts au flocage" },
            { href: "/enterprise/performance", icon: "bar-chart-3" as const, title: "Exporter un rapport", sub: "CSV, PDF, par campagne" },
            { href: "/enterprise/equipe", icon: "user-plus" as const, title: "Inviter un collègue", sub: "Gérez les accès équipe" },
          ].map((a) => (
            <Link
              key={a.href + a.title}
              href={a.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                background: "var(--navy-soft)",
                borderRadius: 12,
                textDecoration: "none",
                color: "#0A0E1F",
                border: "1px solid rgba(35,52,102,0.08)",
                transition: "background 0.14s, transform 0.14s",
              }}
            >
              <div
                style={{
                  flex: "none",
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
                <Icon name={a.icon} size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--gray-500)" }}>{a.sub}</div>
              </div>
              <Icon name="chevron-right" size={14} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
