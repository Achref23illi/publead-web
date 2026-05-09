"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { Sparkline } from "@/components/charts";
import type { AdvertiserDashboardDTO } from "@/lib/dashboard-serializer";
import type { CampaignDTO } from "@/lib/campaign-serializer";

const ACTIVITY_ICON: Record<
  AdvertiserDashboardDTO["recentActivity"][number]["type"],
  IconName
> = {
  accept: "car",
  cancel: "x-circle",
  complete: "check-circle",
  status_change: "refresh",
};

const ACTIVITY_TONE: Record<
  AdvertiserDashboardDTO["recentActivity"][number]["type"],
  string
> = {
  accept: "#1D4ED8",
  cancel: "#B45309",
  complete: "#15803D",
  status_change: "#1D4ED8",
};

const ACTIVITY_LABEL: Record<
  AdvertiserDashboardDTO["recentActivity"][number]["type"],
  string
> = {
  accept: "Chauffeur assigné",
  cancel: "Désistement chauffeur",
  complete: "Campagne terminée",
  status_change: "Changement de statut",
};

function eur(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} €`;
}

function fmtNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function fmtSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (ms < hr) return `il y a ${Math.max(1, Math.floor(ms / min))} min`;
  if (ms < day) return `il y a ${Math.floor(ms / hr)} h`;
  return `il y a ${Math.floor(ms / day)} j`;
}

function fmtDelta(d: number | null): string {
  if (d === null) return "—";
  const sign = d > 0 ? "+" : "";
  return `${sign}${d} %`;
}

export function EnterpriseDashboard() {
  const [data, setData] = useState<AdvertiserDashboardDTO | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dashRes, campRes] = await Promise.all([
          fetch("/api/me/dashboard", { credentials: "include" }),
          fetch("/api/me/campaigns?status=active", {
            credentials: "include",
          }),
        ]);
        const dash = (await dashRes.json()) as AdvertiserDashboardDTO;
        const camp = (await campRes.json()) as { campaigns?: CampaignDTO[] };
        if (cancelled) return;
        setData(dash);
        setCampaigns(camp.campaigns ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Tableau de bord
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Résumé de vos campagnes — {today}
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

      {/* Brand hero — impressions */}
      <div className="ent-hero">
        <div className="ent-hero-row">
          <div>
            <div className="ent-hero-stat-label">Impressions ces 30 jours</div>
            <div className="ent-hero-stat-value">
              {loading ? "…" : fmtNumber(data?.totalImpressions ?? 0)}
            </div>
            <div className="ent-hero-stat-sub">
              {data
                ? `${fmtDelta(data.impressionsDelta)} vs 30 jours précédents · objectif ${fmtNumber(data.goalImpressions)}`
                : "—"}
            </div>
            <div style={{ marginTop: 18, maxWidth: 620 }}>
              <Sparkline
                data={
                  data && data.sparkline.some((v) => v > 0)
                    ? data.sparkline
                    : [1, 2]
                }
              />
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
          {
            l: "Campagnes actives",
            v: data ? fmtNumber(data.campaignsActive) : "—",
            s: data
              ? `${data.campaignsTotal} au total`
              : "—",
          },
          {
            l: "% objectif impressions",
            v: data ? `${Math.min(999, data.goalPct)} %` : "—",
            s: data
              ? `${fmtNumber(data.totalImpressions)} / ${fmtNumber(data.goalImpressions)}`
              : "—",
          },
          {
            l: "Encaissé ce mois",
            v: data ? eur(data.billing.paidThisMonthCents) : "—",
            s: data
              ? `${data.billing.pendingCount} factures ouvertes`
              : "—",
          },
          {
            l: "Factures en attente",
            v: data ? eur(data.billing.pendingCents) : "—",
            s: data
              ? `${data.billing.overdueCount} en retard (${eur(data.billing.overdueCents)})`
              : "—",
          },
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
              {campaigns.slice(0, 5).map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        className="brand-logo"
                        style={{
                          background: c.brandColor ?? "#233466",
                          width: 32,
                          height: 32,
                          fontSize: 12,
                        }}
                      >
                        {c.brand
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/enterprise/campagnes/${c.id}`}
                          style={{ fontWeight: 600, color: "#0A0E1F", textDecoration: "none" }}
                        >
                          {c.brand}
                        </Link>
                        <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
                          {c.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{c.city}</td>
                  <td style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                        {c.progress}%
                      </span>
                      <div className="glass-progress" style={{ width: 60 }}>
                        <div style={{ width: c.progress + "%" }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {eur(c.budgetCents)}
                  </td>
                </tr>
              ))}
              {!loading && campaigns.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--gray-500)",
                    }}
                  >
                    Aucune campagne active.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="glass-panel">
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>Activité récente</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16 }}>
            {(data?.recentActivity ?? []).map((a) => (
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
                    color: ACTIVITY_TONE[a.type],
                  }}
                >
                  <Icon name={ACTIVITY_ICON[a.type]} size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "#0A0E1F", lineHeight: 1.4 }}>
                    {ACTIVITY_LABEL[a.type]}
                    {a.campaignTitle ? ` — ${a.campaignTitle}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>
                    {fmtSince(a.at)}
                  </div>
                </div>
              </div>
            ))}
            {!loading && (data?.recentActivity ?? []).length === 0 && (
              <div style={{ color: "var(--gray-500)", fontSize: 13 }}>
                Aucune activité récente.
              </div>
            )}
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
            {
              href: "/enterprise/campagnes/new",
              icon: "plus" as IconName,
              title: "Lancer une campagne",
              sub: "Brief, ciblage, budget",
            },
            {
              href: "/enterprise/assets",
              icon: "image" as IconName,
              title: "Téléverser des assets",
              sub: "Visuels prêts au flocage",
            },
            {
              href: "/enterprise/performance",
              icon: "bar-chart-3" as IconName,
              title: "Exporter un rapport",
              sub: "CSV, PDF, par campagne",
            },
            {
              href: "/enterprise/equipe",
              icon: "user-plus" as IconName,
              title: "Inviter un collègue",
              sub: "Gérez les accès équipe",
            },
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
