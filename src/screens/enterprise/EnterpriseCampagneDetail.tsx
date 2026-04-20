"use client";

/**
 * EnterpriseCampagneDetail — client-facing read-mostly detail page for a
 * single campaign. Tabs: Aperçu · Performance · Fichiers.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Sparkline } from "@/components/charts";
import { CAMPAIGNS } from "@/lib/data";

type Tab = "overview" | "performance" | "files";

interface Props {
  id: string;
}

const IMPRESSIONS_30D = [
  12, 15, 14, 18, 20, 19, 22, 26, 28, 27, 31, 34, 36, 39, 42,
  41, 44, 47, 50, 52, 55, 57, 60, 62, 64, 67, 70, 72, 75, 78,
];

const FILES = [
  { name: "brief-nova-printemps.pdf", size: "1,4 Mo", date: "08 avr.", who: "M. Dupont" },
  { name: "visuel-flocage-v3.ai", size: "42 Mo", date: "10 avr.", who: "Agence" },
  { name: "visuel-flocage-v3.png", size: "3,2 Mo", date: "10 avr.", who: "Agence" },
  { name: "contrat-signe.pdf", size: "842 Ko", date: "12 avr.", who: "Juridique" },
];

export function EnterpriseCampagneDetail({ id }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const campaign = useMemo(() => CAMPAIGNS.find((c) => c.id === id) || CAMPAIGNS[0], [id]);

  const statusLabel: Record<string, string> = {
    active: "En cours",
    draft: "Brouillon",
    completed: "Terminée",
  };

  return (
    <div className="glass-page">
      <div className="glass-pagehead" style={{ alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 6 }}>
            <Link href="/enterprise/campagnes" style={{ color: "var(--navy)", textDecoration: "none" }}>
              ← Mes campagnes
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              className="brand-logo"
              style={{ background: campaign.color, width: 44, height: 44, fontSize: 16 }}
            >
              {campaign.initials}
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: 0 }}>
                {campaign.brand}
              </h1>
              <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4, display: "flex", gap: 10, alignItems: "center" }}>
                <span>{campaign.type}</span>
                <span>·</span>
                <span>{campaign.city}</span>
                <span>·</span>
                <span>{campaign.period}</span>
                <span className={`ent-chip ${campaign.status}`}>
                  {statusLabel[campaign.status]}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn ghost">
            <Icon name="download" size={14} /> Rapport
          </button>
          <button type="button" className="glass-btn ghost">
            <Icon name="message-square" size={14} /> Contacter l&apos;équipe
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ent-seg" style={{ marginBottom: 18 }}>
        {(
          [
            { id: "overview", label: "Aperçu" },
            { id: "performance", label: "Performance" },
            { id: "files", label: "Fichiers" },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
          <div className="glass-panel">
            <div className="glass-panelhead">
              <h3 style={{ margin: 0, fontSize: 14 }}>Brief & ciblage</h3>
            </div>
            <div style={{ padding: 16, display: "grid", gap: 14 }}>
              <Info label="Objectif" value="Notoriété régionale — acquisition boutique Paris 8e" />
              <Info label="Message clé" value="« Skincare à la rose — 100 % bio, fabriqué en Provence »" />
              <Info label="Ciblage" value={`${campaign.city} et périphérie · 25-45 ans · zones bureaux`} />
              <Info label="Type de diffusion" value={`${campaign.type} longue durée`} />
              <Info label="Créatifs" value="2 visuels livrés · 1 version teaser sur borne" />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="glass-panel">
              <div className="glass-panelhead">
                <h3 style={{ margin: 0, fontSize: 14 }}>Budget</h3>
              </div>
              <div style={{ padding: 16, display: "grid", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Budget total</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700 }}>
                    {campaign.rev}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 6 }}>
                    Consommé · {campaign.progress} %
                  </div>
                  <div className="glass-progress">
                    <div style={{ width: campaign.progress + "%" }} />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  <MiniKpi label="Chauffeurs" value={`${campaign.drivers[0] ?? 0} / ${campaign.drivers[1] ?? "—"}`} />
                  <MiniKpi label="Km parcourus" value={`${campaign.km[0] ?? 0} / ${campaign.km[1] ?? "—"}`} />
                </div>
              </div>
            </div>

            <div className="glass-panel" style={{ position: "relative", overflow: "hidden" }}>
              <div className="glass-panelhead">
                <h3 style={{ margin: 0, fontSize: 14 }}>Impressions 30 derniers jours</h3>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700 }}>
                  78 420
                </div>
                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                  +22 % vs période précédente
                </div>
                <div style={{ marginTop: 18, position: "relative", height: 70 }}>
                  <Sparkline data={IMPRESSIONS_30D} color="#233466" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "performance" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {[
            { label: "Impressions totales", value: "248 560", sub: "+18 % vs attendu" },
            { label: "Coût par 1 000 impressions", value: "4,12 €", sub: "Moyenne marché · 5,30 €" },
            { label: "Villes couvertes", value: "4", sub: "Paris, Boulogne, Neuilly, Levallois" },
            { label: "Heures de diffusion", value: "1 920 h", sub: "Moyenne 64 h / jour" },
            { label: "Chauffeurs actifs", value: `${campaign.drivers[0] ?? 0}`, sub: "Sur 6 assignés" },
            { label: "Satisfaction chauffeurs", value: "4,8 / 5", sub: "12 retours" },
          ].map((k) => (
            <div key={k.label} className="glass-kpi">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--gray-500)",
                }}
              >
                {k.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  fontWeight: 700,
                  margin: "4px 0",
                }}
              >
                {k.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "files" && (
        <div className="glass-panel">
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>Fichiers partagés</h3>
            <button type="button" className="glass-btn ghost">
              <Icon name="upload-cloud" size={14} /> Téléverser
            </button>
          </div>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Taille</th>
                <th>Date</th>
                <th>Ajouté par</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {FILES.map((f) => (
                <tr key={f.name}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon name="file-text" size={16} />
                      <span style={{ fontWeight: 600 }}>{f.name}</span>
                    </div>
                  </td>
                  <td>{f.size}</td>
                  <td>{f.date}</td>
                  <td>{f.who}</td>
                  <td style={{ textAlign: "right" }}>
                    <button type="button" className="glass-btn ghost" style={{ padding: "4px 10px" }}>
                      <Icon name="download" size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--gray-500)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: "#0A0E1F", marginTop: 3 }}>{value}</div>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 10, background: "var(--navy-soft)", borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
