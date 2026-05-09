"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";
import type { Campaign } from "@/lib/data";
import type {
  AdminDashboardDTO,
  CityCountDTO,
  DashboardCampaignRowDTO,
  RangeKey,
  RevenueChartDTO,
} from "@/lib/dashboard-serializer";

// -------------------------------------------------------------------------
// SVG helpers
// -------------------------------------------------------------------------

interface SparklineProps {
  data: number[];
  color?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}

function Sparkline({ data, color = "#ffffff", fill = true, width = 620, height = 60 }: SparklineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const dx = width / (data.length - 1);
  const points = data.map(
    (v, i): [number, number] => [i * dx, height - ((v - min) / (max - min || 1)) * (height - 8) - 4],
  );
  const line = points.map((p, i) => (i === 0 ? "M" : "L") + p[0] + "," + p[1]).join(" ");
  const area = line + ` L${width},${height} L0,${height} Z`;
  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        opacity: 0.5,
      }}
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      {fill && <path d={area} fill={color} opacity="0.18" />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function StackedArea({
  flocage,
  borne,
  width = 720,
  height = 260,
}: {
  flocage: number[];
  borne: number[];
  width?: number;
  height?: number;
}) {
  const n = Math.min(flocage.length, borne.length);
  if (n < 2) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--gray-500)",
          fontSize: 13,
        }}
      >
        Données insuffisantes pour tracer la courbe.
      </div>
    );
  }
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const totals = flocage.map((v, i) => v + borne[i]);
  const maxY = Math.max(1, ...totals) * 1.1;
  const dx = w / (n - 1);
  // Convert cents to euros for axis label clarity.
  const yEur = (cents: number) => pad.t + h - (cents / maxY) * h;
  const pathFloc = flocage
    .map((v, i) => (i === 0 ? "M" : "L") + (pad.l + i * dx) + "," + yEur(v))
    .join(" ");
  const pathTotal = flocage
    .map((v, i) => (i === 0 ? "M" : "L") + (pad.l + i * dx) + "," + yEur(v + borne[i]))
    .join(" ");
  const areaFloc = pathFloc + ` L${pad.l + w},${pad.t + h} L${pad.l},${pad.t + h} Z`;
  const bornePath = flocage.map((v, i) => ({
    x: pad.l + i * dx,
    y1: yEur(v),
    y2: yEur(v + borne[i]),
  }));
  const borneArea =
    "M" +
    bornePath.map((p) => `${p.x},${p.y1}`).join(" L") +
    " L" +
    bornePath
      .slice()
      .reverse()
      .map((p) => `${p.x},${p.y2}`)
      .join(" L") +
    " Z";
  const gridTicks = 4;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: "100%" }}
    >
      {Array.from({ length: gridTicks + 1 }).map((_, i) => {
        const yy = pad.t + (h / gridTicks) * i;
        const valEur = Math.round((maxY - (maxY / gridTicks) * i) / 100);
        return (
          <g key={i}>
            <line
              x1={pad.l}
              x2={pad.l + w}
              y1={yy}
              y2={yy}
              stroke="#E5E5E5"
              strokeWidth="1"
              opacity="0.7"
            />
            <text x={pad.l - 8} y={yy + 3} fill="#737373" fontSize="10" textAnchor="end">
              {valEur}€
            </text>
          </g>
        );
      })}
      <path d={borneArea} fill="#3B82F6" opacity="0.2" />
      <path d={pathTotal} fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      <path d={areaFloc} fill="#233466" opacity="0.2" />
      <path d={pathFloc} fill="none" stroke="#233466" strokeWidth="1.8" />
    </svg>
  );
}

function HorizontalBars({ data, width = 520 }: { data: CityCountDTO[]; width?: number }) {
  if (data.length === 0) {
    return (
      <div style={{ padding: 16, color: "var(--gray-500)", fontSize: 13 }}>
        Aucune campagne géolocalisée.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.count));
  const rowH = 30;
  const pad = { l: 90, r: 40, t: 8, b: 8 };
  const h = data.length * rowH + pad.t + pad.b;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`}>
      {data.map((d, i) => {
        const y = pad.t + i * rowH + 6;
        const w = (d.count / max) * (width - pad.l - pad.r);
        return (
          <g key={d.city}>
            <text
              x={pad.l - 10}
              y={y + 13}
              fill="#0A0E1F"
              fontSize="12"
              textAnchor="end"
              fontWeight="500"
            >
              {d.city}
            </text>
            <rect x={pad.l} y={y + 2} width={w} height="16" rx="8" fill="#233466" />
            <text x={pad.l + w + 8} y={y + 14} fill="#0A0E1F" fontSize="12" fontWeight="700">
              {d.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// -------------------------------------------------------------------------
// CampaignsTable — shared between dashboard and /campagnes
// -------------------------------------------------------------------------

interface CampaignsTableProps {
  rows: Campaign[];
  onOpen?: (row: Campaign) => void;
}

export function CampaignsTable({ rows, onOpen }: CampaignsTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Campagne</th>
          <th>Entreprise</th>
          <th>Type</th>
          <th>Ville</th>
          <th>Statut</th>
          <th>Progression</th>
          <th>Chauffeurs</th>
          <th style={{ textAlign: "right" }}>Revenus</th>
          <th style={{ width: 40 }}></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} onClick={() => onOpen?.(r)}>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="brand-logo sm" style={{ background: r.color }}>
                  {r.initials}
                </div>
                <span style={{ fontWeight: 600 }}>{r.brand}</span>
              </div>
            </td>
            <td>{r.company}</td>
            <td>
              <span className="chip chip-navy-outline">
                <Icon name={r.type === "Flocage" ? "car" : "spray-can"} size={12} /> {r.type}
              </span>
            </td>
            <td>{r.city}</td>
            <td>
              {r.status === "active" && (
                <span className="chip chip-success">
                  <span className="dot" /> Active
                </span>
              )}
              {r.status === "completed" && <span className="chip chip-soft-navy">Terminée</span>}
              {r.status === "draft" && (
                <span className="chip chip-outline" style={{ color: "var(--gray-500)" }}>
                  Brouillon
                </span>
              )}
            </td>
            <td style={{ minWidth: 140 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="progress" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: r.progress + "%" }} />
                </div>
                <span
                  className="num"
                  style={{ fontSize: 12, fontWeight: 600, minWidth: 32, textAlign: "right" }}
                >
                  {r.progress}%
                </span>
              </div>
            </td>
            <td>{r.drivers[0] != null ? `${r.drivers[0]}/${r.drivers[1]}` : "—"}</td>
            <td style={{ textAlign: "right", fontWeight: 600 }} className="num">
              {r.rev}
            </td>
            <td>
              <button type="button" className="icon-btn" onClick={(e) => e.stopPropagation()}>
                <Icon name="more-horizontal" size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Maps the dashboard payload into the legacy `Campaign` row shape consumed
// by the shared CampaignsTable. Defaults fill in fields the dashboard
// payload doesn't carry (period label, km tuple).
function dashboardRowToCampaign(r: DashboardCampaignRowDTO): Campaign {
  const initials = r.brand
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 3)
    .join("")
    .toUpperCase();
  const periodFmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };
  return {
    id: r.id,
    brand: r.brand,
    color: r.brandColor ?? "#233466",
    initials,
    company: r.company,
    type: r.campaignType === "borne" ? "Borne" : "Flocage",
    city: r.city,
    period: `${periodFmt(r.startDate)} → ${periodFmt(r.endDate)}`,
    drivers: [r.driversAssigned, r.driversNeeded],
    km: [null, null],
    rev: `${(r.budgetCents / 100).toLocaleString("fr-FR", {
      maximumFractionDigits: 0,
    })} €`,
    status: r.status === "completed" ? "completed" : r.status === "active" ? "active" : "draft",
    progress: r.progress,
  };
}

function eur(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} €`;
}

function fmtDelta(d: number | null): string {
  if (d === null) return "—";
  const sign = d > 0 ? "+" : "";
  return `${sign}${d} %`;
}

function fmtSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (ms < day) return "aujourd'hui";
  if (ms < 2 * day) return "hier";
  return `il y a ${Math.floor(ms / day)} j`;
}

const VALIDATION_KIND_LABEL: Record<"driver" | "company" | "partner", string> = {
  driver: "Chauffeur",
  company: "Entreprise",
  partner: "Partenaire",
};

// -------------------------------------------------------------------------
// DashboardPro main component
// -------------------------------------------------------------------------

export function DashboardPro() {
  const { pushToast } = useToast();
  const [chartRange, setChartRange] = useState<RangeKey>("30");
  const [data, setData] = useState<AdminDashboardDTO | null>(null);
  const [chart, setChart] = useState<RevenueChartDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/dashboard", { credentials: "include" });
        const json = (await r.json()) as AdminDashboardDTO;
        if (!cancelled) setData(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch(
        `/api/admin/dashboard/revenue?range=${chartRange}`,
        { credentials: "include" },
      );
      const json = (await r.json()) as RevenueChartDTO;
      if (!cancelled) setChart(json);
    })();
    return () => {
      cancelled = true;
    };
  }, [chartRange]);

  const sparkData = useMemo(() => {
    if (!chart) return [];
    return chart.points.map((p) => p.flocageCents + p.borneCents);
  }, [chart]);

  const flocageSeries = useMemo(
    () => (chart ? chart.points.map((p) => p.flocageCents) : []),
    [chart],
  );
  const borneSeries = useMemo(
    () => (chart ? chart.points.map((p) => p.borneCents) : []),
    [chart],
  );

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Bonjour 👋</h1>
          <p className="subtitle">{today} · état des opérations.</p>
        </div>
        <Link href="/campagnes/new" className="btn btn-primary">
          <Icon name="plus" size={18} /> Nouvelle campagne
        </Link>
      </div>

      {/* Row 1 — KPIs */}
      <div className="grid grid-12 mb-6">
        <div className="col-6">
          <div className="kpi-hero">
            <div>
              <div className="label">Revenus ce mois-ci</div>
              <div className="value num">
                {loading ? "…" : eur(data?.finance.collectedCents ?? 0)}
              </div>
              <span className="trend">
                <Icon name="trending-up" size={14} />{" "}
                {data ? fmtDelta(data.mrrDelta) : "—"} vs mois précédent
              </span>
            </div>
            <div style={{ position: "relative", height: 70, marginTop: 16 }}>
              <Sparkline data={sparkData.length >= 2 ? sparkData : [1, 2]} />
            </div>
          </div>
        </div>
        <div className="col-2">
          <div className="stat-card">
            <div className="stat-head">
              <div className="stat-icon">
                <Icon name="car" size={20} />
              </div>
              {data?.counts.driversValidatedDelta != null && (
                <span
                  className={`trend-pill ${
                    data.counts.driversValidatedDelta >= 0 ? "up" : "down"
                  }`}
                >
                  <Icon
                    name={
                      data.counts.driversValidatedDelta >= 0
                        ? "trending-up"
                        : "trending-down"
                    }
                    size={12}
                  />
                  {fmtDelta(data.counts.driversValidatedDelta)}
                </span>
              )}
            </div>
            <div className="label">Chauffeurs validés</div>
            <div className="value num">{data?.counts.driversValidated ?? "—"}</div>
            <div className="sub">
              dont {data?.counts.driversPending ?? 0} en attente
            </div>
          </div>
        </div>
        <div className="col-2">
          <div className="stat-card">
            <div className="stat-head">
              <div className="stat-icon">
                <Icon name="building-2" size={20} />
              </div>
              {data?.counts.companiesValidatedDelta != null && (
                <span
                  className={`trend-pill ${
                    data.counts.companiesValidatedDelta >= 0 ? "up" : "down"
                  }`}
                >
                  <Icon
                    name={
                      data.counts.companiesValidatedDelta >= 0
                        ? "trending-up"
                        : "trending-down"
                    }
                    size={12}
                  />
                  {fmtDelta(data.counts.companiesValidatedDelta)}
                </span>
              )}
            </div>
            <div className="label">Entreprises clientes</div>
            <div className="value num">{data?.counts.companiesValidated ?? "—"}</div>
            <div className="sub">
              {data?.counts.companiesPending ?? 0} en attente
            </div>
          </div>
        </div>
        <div className="col-2">
          <div className="stat-card">
            <div className="stat-head">
              <div className="stat-icon">
                <Icon name="megaphone" size={20} />
              </div>
              {data?.counts.campaignsActiveDelta != null && (
                <span
                  className={`trend-pill ${
                    data.counts.campaignsActiveDelta >= 0 ? "up" : "down"
                  }`}
                >
                  <Icon
                    name={
                      data.counts.campaignsActiveDelta >= 0
                        ? "trending-up"
                        : "trending-down"
                    }
                    size={12}
                  />
                  {fmtDelta(data.counts.campaignsActiveDelta)}
                </span>
              )}
            </div>
            <div className="label">Campagnes en cours</div>
            <div className="value num">{data?.counts.campaignsActive ?? "—"}</div>
            <div className="sub">
              {data?.counts.campaignsCompletedThisMonth ?? 0} terminées ce mois
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — Activity + validation queue */}
      <div className="grid grid-12 mb-6">
        <div className="col-8">
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Évolution des revenus</h3>
                <div className="card-subtitle">Flocage et Leader Borne</div>
              </div>
              <div className="segmented">
                {(["30", "90", "365"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={chartRange === k ? "active" : ""}
                    onClick={() => setChartRange(k)}
                  >
                    {k === "30" ? "30 j" : k === "90" ? "90 j" : "12 m"}
                  </button>
                ))}
              </div>
            </div>
            <StackedArea flocage={flocageSeries} borne={borneSeries} />
            <div
              style={{
                display: "flex",
                gap: 18,
                marginTop: 8,
                paddingLeft: 40,
                fontSize: 12,
                color: "var(--gray-500)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, background: "var(--navy)", borderRadius: 2 }} />
                Flocage · {chart ? eur(chart.totals.flocageCents) : "—"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, background: "var(--info)", borderRadius: 2 }} />
                Borne · {chart ? eur(chart.totals.borneCents) : "—"}
              </span>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                À valider{" "}
                <span className="chip chip-filled-warning" style={{ marginLeft: 8 }}>
                  {data?.counts.validationQueueTotal ?? 0}
                </span>
              </h3>
              <Link href="/validations" className="card-link">
                Voir tout →
              </Link>
            </div>
            <div>
              {(data?.validationQueue ?? []).map((q) => (
                <div
                  key={`${q.kind}-${q.id}`}
                  className="row-hover"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                  }}
                >
                  <div
                    className="avatar-initials"
                    style={{ width: 32, height: 32, fontSize: 11 }}
                  >
                    {q.name
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">
                      {q.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span
                        className="chip chip-soft-navy"
                        style={{ height: 18, fontSize: 10, padding: "0 8px" }}
                      >
                        {VALIDATION_KIND_LABEL[q.kind]}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--gray-500)" }}>
                        {fmtSince(q.since)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 28, height: 28, color: "var(--success)" }}
                    onClick={() =>
                      pushToast({
                        kind: "info",
                        title: "Ouvrir le dossier",
                        desc: "Validation à effectuer dans la file dédiée.",
                      })
                    }
                  >
                    <Icon name="check" size={16} />
                  </button>
                </div>
              ))}
              {!loading && (data?.validationQueue ?? []).length === 0 && (
                <div style={{ padding: 16, color: "var(--gray-500)", fontSize: 13 }}>
                  Rien en attente.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — City + Bornes */}
      <div className="grid grid-12 mb-6">
        <div className="col-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Répartition par ville</h3>
              <span className="chip chip-outline" style={{ color: "var(--gray-500)" }}>
                {data?.counts.driversValidated ?? 0} chauffeurs validés
              </span>
            </div>
            <HorizontalBars data={data?.cities ?? []} />
          </div>
        </div>
        <div className="col-6">
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Leader Bornes</h3>
                <div className="card-subtitle">Parfum + écran LED</div>
              </div>
              <Link href="/bornes" className="card-link">
                Voir toutes →
              </Link>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                {
                  label: "Installées",
                  value: data?.fleet.installed ?? 0,
                  sub: `${data?.fleet.online ?? 0} en service`,
                },
                {
                  label: "En maintenance",
                  value: data?.fleet.inMaintenance ?? 0,
                  sub: `${data?.fleet.offline ?? 0} hors-ligne`,
                },
                {
                  label: "Revenus ce mois",
                  value: eur(data?.fleet.monthlyRevenueCents ?? 0),
                  sub:
                    data && data.fleet.monthlyRevenueDelta !== null
                      ? `${fmtDelta(data.fleet.monthlyRevenueDelta)} vs mois dernier`
                      : "—",
                },
                {
                  label: "Sprays aujourd'hui",
                  value: data?.fleet.spraysToday ?? 0,
                  sub: "tous terminaux",
                },
              ].map((t) => (
                <div
                  key={t.label}
                  style={{
                    background: "var(--navy-tint)",
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--gray-500)",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {t.label}
                  </div>
                  <div
                    className="num"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 24,
                      fontWeight: 700,
                      marginTop: 4,
                      color: "var(--black)",
                    }}
                  >
                    {t.value}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>
                    {t.sub}
                  </div>
                </div>
              ))}
            </div>
            {(data?.fleet.topTerminals ?? []).length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid var(--gray-200)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    Top {data?.fleet.topTerminals.length} bornes par revenus
                  </div>
                </div>
                {(data?.fleet.topTerminals ?? []).map((b) => (
                  <div
                    key={b.terminalId}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "200px 1fr 80px",
                      alignItems: "center",
                      gap: 12,
                      padding: "6px 0",
                      fontSize: 12,
                    }}
                  >
                    <span className="truncate">{b.name}</span>
                    <div className="progress">
                      <div className="progress-fill" style={{ width: b.pct + "%" }} />
                    </div>
                    <span className="num" style={{ fontWeight: 600, textAlign: "right" }}>
                      {eur(b.revenueCents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4 — campaigns table */}
      <div className="card card-flush">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
          }}
        >
          <div>
            <h3 className="card-title">Campagnes récentes</h3>
            <div className="card-subtitle">Mis à jour {data ? "à l'instant" : "—"}</div>
          </div>
          <Link href="/campagnes" className="card-link">
            Toutes les campagnes →
          </Link>
        </div>
        <CampaignsTable
          rows={(data?.recentCampaigns ?? []).map(dashboardRowToCampaign)}
        />
      </div>
    </div>
  );
}
