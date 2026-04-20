"use client";

/**
 * DashboardPro — pro UI "Vue d'ensemble" landing page.
 * 1:1 port of dashboard.jsx's <Dashboard> + inner SVG helpers.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";
import { VALIDATION_QUEUE, CITY_DIST, CAMPAIGNS, type Campaign, type CityCount } from "@/lib/data";

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

function StackedArea({ width = 720, height = 260 }: { width?: number; height?: number }) {
  const n = 30;
  const flocage = Array.from(
    { length: n },
    (_, i) => 180 + Math.sin(i / 3) * 40 + i * 3 + (i % 5 === 0 ? 30 : 0),
  );
  const borne = Array.from({ length: n }, (_, i) => 90 + Math.cos(i / 2.5) * 25 + i * 1.6);
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const maxY = Math.max(...flocage.map((v, i) => v + borne[i])) * 1.1;
  const dx = w / (n - 1);
  const y = (v: number) => pad.t + h - (v / maxY) * h;
  const pathFloc = flocage
    .map((v, i) => (i === 0 ? "M" : "L") + (pad.l + i * dx) + "," + y(v))
    .join(" ");
  const pathTotal = flocage
    .map((v, i) => (i === 0 ? "M" : "L") + (pad.l + i * dx) + "," + y(v + borne[i]))
    .join(" ");
  const areaFloc = pathFloc + ` L${pad.l + w},${pad.t + h} L${pad.l},${pad.t + h} Z`;
  const bornePath = flocage.map((v, i) => ({
    x: pad.l + i * dx,
    y1: y(v),
    y2: y(v + borne[i]),
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
        const val = Math.round(maxY - (maxY / gridTicks) * i);
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
              {val}€
            </text>
          </g>
        );
      })}
      <path d={borneArea} fill="#3B82F6" opacity="0.2" />
      <path d={pathTotal} fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      <path d={areaFloc} fill="#233466" opacity="0.2" />
      <path d={pathFloc} fill="none" stroke="#233466" strokeWidth="1.8" />
      {[0, 7, 14, 21, 29].map((i) => (
        <text
          key={i}
          x={pad.l + i * dx}
          y={height - 8}
          fill="#737373"
          fontSize="10"
          textAnchor="middle"
        >
          {i + 1} avr.
        </text>
      ))}
    </svg>
  );
}

function HorizontalBars({ data, width = 520 }: { data: CityCount[]; width?: number }) {
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

// -------------------------------------------------------------------------
// DashboardPro main component
// -------------------------------------------------------------------------

export function DashboardPro() {
  const { pushToast } = useToast();
  const [chartRange, setChartRange] = useState<"30j" | "90j" | "12m">("30j");
  const sparkData = useMemo(
    () => Array.from({ length: 30 }, (_, i) => 200 + Math.sin(i / 3) * 80 + i * 5 + (i === 28 ? 60 : 0)),
    [],
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Bonjour Claire 👋</h1>
          <p className="subtitle">Lundi 20 avril 2026 · voici l&apos;état des opérations.</p>
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
              <div className="value num">12 400 €</div>
              <span className="trend">
                <Icon name="trending-up" size={14} /> +18 % vs mois dernier
              </span>
            </div>
            <div style={{ position: "relative", height: 70, marginTop: 16 }}>
              <Sparkline data={sparkData} />
            </div>
          </div>
        </div>
        <div className="col-2">
          <div className="stat-card">
            <div className="stat-head">
              <div className="stat-icon">
                <Icon name="car" size={20} />
              </div>
              <span className="trend-pill up">
                <Icon name="trending-up" size={12} />
                +6 %
              </span>
            </div>
            <div className="label">Chauffeurs actifs</div>
            <div className="value num">128</div>
            <div className="sub">dont 4 en attente</div>
          </div>
        </div>
        <div className="col-2">
          <div className="stat-card">
            <div className="stat-head">
              <div className="stat-icon">
                <Icon name="building-2" size={20} />
              </div>
              <span className="trend-pill up">
                <Icon name="trending-up" size={12} />
                +2
              </span>
            </div>
            <div className="label">Entreprises clientes</div>
            <div className="value num">34</div>
            <div className="sub">2 nouveaux contrats</div>
          </div>
        </div>
        <div className="col-2">
          <div className="stat-card">
            <div className="stat-head">
              <div className="stat-icon">
                <Icon name="megaphone" size={20} />
              </div>
              <span className="trend-pill down">
                <Icon name="trending-down" size={12} />
                −3 %
              </span>
            </div>
            <div className="label">Campagnes en cours</div>
            <div className="value num">9</div>
            <div className="sub">3 terminées ce mois</div>
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
                {(["30j", "90j", "12m"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={chartRange === k ? "active" : ""}
                    onClick={() => setChartRange(k)}
                  >
                    {k === "30j" ? "30 j" : k === "90j" ? "90 j" : "12 m"}
                  </button>
                ))}
              </div>
            </div>
            <StackedArea />
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
                Flocage
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, background: "var(--info)", borderRadius: 2 }} />
                Borne
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
                  16
                </span>
              </h3>
              <Link href="/validations" className="card-link">
                Voir tout →
              </Link>
            </div>
            <div>
              {VALIDATION_QUEUE.map((q) => (
                <div
                  key={q.id}
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
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}
                    >
                      <span
                        className="chip chip-soft-navy"
                        style={{ height: 18, fontSize: 10, padding: "0 8px" }}
                      >
                        {q.kind}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--gray-500)" }}>{q.since}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 28, height: 28, color: "var(--success)" }}
                    onClick={() =>
                      pushToast({
                        kind: "success",
                        title: "Dossier validé",
                        desc: q.name + " est désormais actif.",
                      })
                    }
                  >
                    <Icon name="check" size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 28, height: 28, color: "var(--danger)" }}
                    onClick={() =>
                      pushToast({
                        kind: "danger",
                        title: "Dossier refusé",
                        desc: q.name + " a été notifié.",
                      })
                    }
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              ))}
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
                126 véhicules actifs
              </span>
            </div>
            <HorizontalBars data={CITY_DIST} />
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
                { label: "Installées", value: "8", sub: "7 en service" },
                { label: "En maintenance", value: "1", sub: "FitZone Lyon" },
                { label: "Revenus ce mois", value: "2 130 €", sub: "+12 % vs mars" },
                { label: "Sprays / jour", value: "46", sub: "moyenne par borne" },
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
                <div style={{ fontSize: 13, fontWeight: 600 }}>Top 3 bornes par revenus</div>
              </div>
              {[
                { n: "Club Neon — Paris 19e", v: 540, p: 100 },
                { n: "Le Sélect — Paris 6e", v: 480, p: 88 },
                { n: "Brasserie Lina — Bordeaux", v: 390, p: 72 },
              ].map((b) => (
                <div
                  key={b.n}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "200px 1fr 60px",
                    alignItems: "center",
                    gap: 12,
                    padding: "6px 0",
                    fontSize: 12,
                  }}
                >
                  <span className="truncate">{b.n}</span>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: b.p + "%" }} />
                  </div>
                  <span className="num" style={{ fontWeight: 600, textAlign: "right" }}>
                    {b.v} €
                  </span>
                </div>
              ))}
            </div>
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
            <div className="card-subtitle">Mis à jour il y a 3 min</div>
          </div>
          <Link href="/campagnes" className="card-link">
            Toutes les campagnes →
          </Link>
        </div>
        <CampaignsTable rows={CAMPAIGNS.slice(0, 6)} />
      </div>
    </div>
  );
}
