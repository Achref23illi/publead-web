"use client";

/**
 * CampagneDetailGlass — rond/vitré campaign detail.
 * Tabs: Vue d'ensemble, Chauffeurs, Suivi, Fichiers, Historique.
 * All tabs filled with realistic mock content so no section feels empty.
 */

import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { StackedArea } from "@/components/charts";
import { CAMPAIGNS, DRIVERS_VALID } from "@/lib/data";

interface Props {
  id: string;
}

type Tab = "overview" | "drivers" | "tracking" | "files" | "log";

interface FileRow {
  id: string;
  name: string;
  size: string;
  date: string;
  by: string;
  kind: "pdf" | "image" | "doc";
}

interface LogEvent {
  t: string;
  u: string;
  e: string;
  kind?: "success" | "warning" | "info";
}

interface TrackingEvent {
  t: string;
  who: string;
  what: string;
  icon: IconName;
  tone: "success" | "warning" | "info" | "default";
}

export function CampagneDetailGlass({ id }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const c = CAMPAIGNS.find((x) => x.id === id) ?? CAMPAIGNS[0];

  // Slice of drivers assigned to this campaign — stable pick based on id hash.
  const assignedDrivers = DRIVERS_VALID.slice(0, 5);

  // Derived numbers for budget/targeting panels
  const [kmDone, kmGoal] = c.km[0] != null && c.km[1] != null ? [c.km[0], c.km[1]] : [1240, 2000];
  const budgetTotal = 4800;
  const budgetSpent = Math.round(budgetTotal * (c.progress / 100));
  const budgetLeft = budgetTotal - budgetSpent;

  const files: FileRow[] = [
    { id: "f1", name: "Brief-campagne.pdf", size: "2,4 Mo", date: "10 avr.", by: "Jo Wissam", kind: "pdf" },
    { id: "f2", name: "Visuel-cote-gauche.jpg", size: "3,8 Mo", date: "11 avr.", by: "Claire Dupont", kind: "image" },
    { id: "f3", name: "Visuel-cote-droit.jpg", size: "3,6 Mo", date: "11 avr.", by: "Claire Dupont", kind: "image" },
    { id: "f4", name: "Visuel-capot.jpg", size: "2,9 Mo", date: "11 avr.", by: "Claire Dupont", kind: "image" },
    { id: "f5", name: "BAT-valide.pdf", size: "1,2 Mo", date: "12 avr.", by: "Jo Wissam", kind: "pdf" },
    { id: "f6", name: "Contrat-signe.pdf", size: "740 Ko", date: "13 avr.", by: c.company, kind: "pdf" },
    { id: "f7", name: "Rapport-hebdo-S16.pdf", size: "980 Ko", date: "19 avr.", by: "Système", kind: "pdf" },
  ];

  const log: LogEvent[] = [
    { t: "10/04 09:42", u: "Jo Wissam", e: `Campagne « ${c.brand} » créée`, kind: "info" },
    { t: "10/04 11:08", u: "Claire Dupont", e: "Brief envoyé au client pour validation" },
    { t: "11/04 14:26", u: "Claire Dupont", e: "3 visuels créatifs ajoutés" },
    { t: "12/04 10:02", u: c.company, e: "BAT signé par le client", kind: "success" },
    { t: "13/04 16:15", u: "Jo Wissam", e: "Contrat retourné signé — activation prévue", kind: "success" },
    { t: "14/04 08:30", u: "Système", e: `Assignation automatique de ${assignedDrivers.length} chauffeurs` },
    { t: "14/04 09:12", u: "Lucas Fontaine", e: "Premier départ enregistré — Lyon 3e" },
    { t: "16/04 18:44", u: "Système", e: "Alerte : Paul Mercier a mis sa course en pause", kind: "warning" },
    { t: "19/04 07:00", u: "Système", e: "Rapport hebdomadaire S16 généré" },
    { t: "20/04 10:14", u: "Jo Wissam", e: "Facture F-2026-0418 émise", kind: "info" },
  ];

  const trackingFeed: TrackingEvent[] = [
    { t: "il y a 2 min", who: "Lucas Fontaine", what: "sortie du parking Lyon 3e", icon: "car", tone: "success" },
    { t: "il y a 14 min", who: "Nadia El-Amrani", what: "passage rue de la République", icon: "map-pin", tone: "default" },
    { t: "il y a 28 min", who: "Amélie Rousseau", what: "+12 km parcourus ce matin", icon: "trending-up", tone: "info" },
    { t: "il y a 42 min", who: "Thomas Girard", what: "zone couverte : Place Bellecour", icon: "map-pin", tone: "default" },
    { t: "il y a 1 h", who: "Inès Moreau", what: "pause déjeuner programmée", icon: "pause-circle", tone: "warning" },
  ];

  return (
    <div className="glass-page">
      <div className="glass-crumb">
        <Link href="/campagnes">Campagnes</Link>
        <Icon name="chevron-right" size={12} />
        <span>{c.brand}</span>
      </div>

      <div className="glass-pagehead">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            className="brand-logo"
            style={{ background: c.color, width: 56, height: 56, fontSize: 22 }}
          >
            {c.initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
                {c.brand}
              </h1>
              <span
                className={
                  "g-chip " +
                  (c.status === "active"
                    ? "success"
                    : c.status === "completed"
                      ? "info"
                      : "outline")
                }
              >
                <span className="dot" />
                {c.status === "active"
                  ? "Active"
                  : c.status === "completed"
                    ? "Terminée"
                    : "Brouillon"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
              {c.company} · {c.period} · {c.city}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="glass-btn ghost">
            <Icon name="copy" size={14} /> Dupliquer
          </button>
          <button type="button" className="glass-btn">
            <Icon name="user-plus" size={14} /> Assigner un chauffeur
          </button>
        </div>
      </div>

      <div className="glass-tabs" style={{ marginBottom: 20 }}>
        {(
          [
            ["overview", "Vue d'ensemble"],
            ["drivers", "Chauffeurs"],
            ["tracking", "Suivi"],
            ["files", "Fichiers"],
            ["log", "Historique"],
          ] as const
        ).map(([k, l]) => (
          <div
            key={k}
            className={"t" + (tab === k ? " active" : "")}
            onClick={() => setTab(k)}
          >
            {l}
            {k === "drivers" && <span className="count">{assignedDrivers.length}</span>}
            {k === "files" && <span className="count">{files.length}</span>}
            {k === "log" && <span className="count">{log.length}</span>}
          </div>
        ))}
      </div>

      {/* ----- VUE D'ENSEMBLE ----- */}
      {tab === "overview" && (
        <div>
          <div className="glass-kpigrid" style={{ marginBottom: 20 }}>
            {[
              { l: "Progression", v: c.progress + " %", s: `${kmDone.toLocaleString("fr-FR")} / ${kmGoal.toLocaleString("fr-FR")} km` },
              { l: "Revenus", v: c.rev, s: "+12 % vs précédente" },
              { l: "Chauffeurs actifs", v: `${c.drivers[0] ?? assignedDrivers.length}`, s: `sur ${c.drivers[1] ?? assignedDrivers.length} assignés` },
              { l: "Jours restants", v: "12", s: "Fin : 14 mai" },
            ].map((k) => (
              <div key={k.l} className="glass-kpi">
                <div className="label">{k.l}</div>
                <div className="value">{k.v}</div>
                <div className="sub">{k.s}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="glass-panel" style={{ padding: 20 }}>
                <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 14 }}>Brief & Objectif</h3>
                  <span style={{ fontSize: 12, color: "var(--gray-500)" }}>v2 · validé</span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "var(--gray-600)",
                  }}
                >
                  Campagne de flocage longue durée pour <strong>{c.company}</strong> sur la
                  ville de <strong>{c.city}</strong>. Véhicules équipés côté gauche, droit et
                  capot. Objectif : maximiser la visibilité aux heures de pointe (7 h – 10 h et
                  17 h – 20 h) dans les quartiers à fort trafic piéton.
                </p>
                <div className="glass-chip-row" style={{ marginTop: 14 }}>
                  <span className="g-chip info">
                    <span className="dot" /> Notoriété
                  </span>
                  <span className="g-chip navy">
                    <span className="dot" /> Local
                  </span>
                  <span className="g-chip outline">B2C</span>
                  <span className="g-chip outline">Automobile</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: 20 }}>
                <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 14 }}>Ciblage</h3>
                </div>
                <div className="glass-stat-grid">
                  <div className="glass-stat">
                    <div className="stat-label">Zones</div>
                    <div className="stat-val">4</div>
                    <div className="stat-sub">quartiers couverts</div>
                  </div>
                  <div className="glass-stat">
                    <div className="stat-label">Audience</div>
                    <div className="stat-val">25-45</div>
                    <div className="stat-sub">actifs urbains</div>
                  </div>
                  <div className="glass-stat">
                    <div className="stat-label">Créneaux</div>
                    <div className="stat-val">7-20 h</div>
                    <div className="stat-sub">du lundi au samedi</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Presqu'île", "Part-Dieu", "Confluence", "Gerland"].map((z) => (
                    <span key={z} className="g-chip outline">
                      <Icon name="map-pin" size={11} /> {z}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="glass-panel" style={{ padding: 20 }}>
                <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 14 }}>Budget</h3>
                  <span className="g-chip success">
                    <span className="dot" /> dans l&apos;enveloppe
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--gray-500)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontWeight: 600,
                        }}
                      >
                        Dépensé
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 26,
                          fontWeight: 700,
                        }}
                      >
                        {budgetSpent.toLocaleString("fr-FR")} €
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--gray-500)" }}>sur</div>
                      <div style={{ fontWeight: 700 }}>
                        {budgetTotal.toLocaleString("fr-FR")} €
                      </div>
                    </div>
                  </div>
                  <div className="glass-progress" style={{ height: 10 }}>
                    <span style={{ width: c.progress + "%" }} />
                  </div>
                </div>
                <div className="glass-stat-grid">
                  <div className="glass-stat">
                    <div className="stat-label">Restant</div>
                    <div className="stat-val">
                      {budgetLeft.toLocaleString("fr-FR")}
                      <span className="currency">€</span>
                    </div>
                  </div>
                  <div className="glass-stat">
                    <div className="stat-label">CPM moyen</div>
                    <div className="stat-val">2,40<span className="currency">€</span></div>
                    <div className="stat-sub">
                      <span className="up">-8 %</span> vs estimé
                    </div>
                  </div>
                  <div className="glass-stat">
                    <div className="stat-label">Prochaine facture</div>
                    <div className="stat-val">30 avr.</div>
                    <div className="stat-sub">F-2026-0430</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: 20 }}>
                <div className="glass-panelhead" style={{ padding: 0, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 14 }}>Revenus — période</h3>
                  <span style={{ fontSize: 12, color: "var(--gray-500)" }}>30 derniers jours</span>
                </div>
                <StackedArea />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----- CHAUFFEURS ----- */}
      {tab === "drivers" && (
        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14 }}>Chauffeurs assignés</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                {assignedDrivers.length} chauffeurs — {kmDone.toLocaleString("fr-FR")} km cumulés
              </p>
            </div>
            <button type="button" className="glass-btn compact">
              <Icon name="user-plus" size={14} /> Ajouter
            </button>
          </div>

          <div className="glass-cardgrid">
            {assignedDrivers.map((d) => {
              const initials = d.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("");
              return (
                <div key={d.id} className="glass-tile">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        className="brand-logo"
                        style={{
                          background: "var(--navy)",
                          color: "#fff",
                          width: 42,
                          height: 42,
                          fontSize: 14,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{d.city}</div>
                      </div>
                    </div>
                    <span
                      className={"g-chip " + (d.status === "Actif" ? "success" : "warning")}
                    >
                      <span className="dot" />
                      {d.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--gray-600)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 12,
                    }}
                  >
                    <Icon name="car" size={13} /> {d.vehicle} · {d.plate}
                  </div>
                  <div className="glass-stat-grid" style={{ marginTop: 0, paddingTop: 12 }}>
                    <div className="glass-stat">
                      <div className="stat-label">Km</div>
                      <div className="stat-val" style={{ fontSize: 18 }}>
                        {(d.km / 1000).toFixed(1)}k
                      </div>
                    </div>
                    <div className="glass-stat">
                      <div className="stat-label">Note</div>
                      <div
                        className="stat-val"
                        style={{
                          fontSize: 18,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon
                          name="star"
                          size={14}
                          style={{ color: "#F59E0B" }}
                        />
                        {d.rating.toFixed(1)}
                      </div>
                    </div>
                    <div className="glass-stat">
                      <div className="stat-label">Camp.</div>
                      <div className="stat-val" style={{ fontSize: 18 }}>
                        {d.camp}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----- SUIVI ----- */}
      {tab === "tracking" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
          <div className="glass-mapwrap">
            <div
              className="glass-panelhead"
              style={{ padding: "2px 4px 12px", border: "none" }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 14 }}>Position en temps réel</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                  {c.city} — mis à jour il y a 2 min
                </p>
              </div>
              <span className="g-chip success">
                <span className="dot" /> Live
              </span>
            </div>
            <div className="glass-map">
              {[
                { x: 28, y: 42 },
                { x: 54, y: 30 },
                { x: 62, y: 58 },
                { x: 38, y: 66 },
                { x: 72, y: 72 },
              ].map((p, i) => (
                <div
                  key={i}
                  className="glass-pin"
                  style={{ left: p.x + "%", top: p.y + "%" }}
                >
                  <Icon name="map-pin" size={28} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="glass-panel" style={{ padding: 20 }}>
              <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>Activité — aujourd&apos;hui</h3>
              </div>
              <div className="glass-stat-grid" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                <div className="glass-stat">
                  <div className="stat-label">Km parcourus</div>
                  <div className="stat-val">142</div>
                  <div className="stat-sub"><span className="up">+18 %</span> vs hier</div>
                </div>
                <div className="glass-stat">
                  <div className="stat-label">En route</div>
                  <div className="stat-val">
                    {assignedDrivers.filter((d) => d.status === "Actif").length}
                    <span className="currency">/{assignedDrivers.length}</span>
                  </div>
                  <div className="stat-sub">chauffeurs actifs</div>
                </div>
                <div className="glass-stat">
                  <div className="stat-label">Vitesse moy.</div>
                  <div className="stat-val">34<span className="currency">km/h</span></div>
                </div>
              </div>
              <div className="glass-chip-row" style={{ marginTop: 14 }}>
                <span className="g-chip outline">
                  <Icon name="map-pin" size={11} /> 4 zones couvertes
                </span>
                <span className="g-chip outline">
                  <Icon name="clock" size={11} /> MAJ il y a 2 min
                </span>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 20 }}>
              <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>Flux d&apos;activité</h3>
                <button type="button" className="glass-btn ghost compact">
                  <Icon name="refresh" size={13} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {trackingFeed.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "10px 12px",
                      background: "var(--navy-soft)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color:
                          ev.tone === "success"
                            ? "var(--success)"
                            : ev.tone === "warning"
                              ? "var(--warning)"
                              : ev.tone === "info"
                                ? "var(--info)"
                                : "var(--navy)",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={ev.icon} size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13 }}>
                        <strong>{ev.who}</strong>{" "}
                        <span style={{ color: "var(--gray-600)" }}>— {ev.what}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>
                        {ev.t}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----- FICHIERS ----- */}
      {tab === "files" && (
        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14 }}>Fichiers & documents</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                {files.length} fichiers · {files.filter((f) => f.kind === "image").length} visuels
                créatifs
              </p>
            </div>
            <button type="button" className="glass-btn compact">
              <Icon name="upload-cloud" size={14} /> Déposer un fichier
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map((f) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.9)",
                  borderRadius: 14,
                  transition: "transform .15s",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background:
                      f.kind === "image"
                        ? "rgba(236, 72, 153, 0.12)"
                        : f.kind === "pdf"
                          ? "rgba(239, 68, 68, 0.1)"
                          : "rgba(35,52,102,0.08)",
                    color:
                      f.kind === "image"
                        ? "#BE185D"
                        : f.kind === "pdf"
                          ? "#B91C1C"
                          : "var(--navy)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    name={f.kind === "image" ? "image" : "file-text"}
                    size={18}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>
                    {f.size} · ajouté le {f.date} par {f.by}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="glass-btn ghost compact"
                    title="Aperçu"
                  >
                    <Icon name="eye" size={13} />
                  </button>
                  <button
                    type="button"
                    className="glass-btn ghost compact"
                    title="Télécharger"
                  >
                    <Icon name="download" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----- HISTORIQUE ----- */}
      {tab === "log" && (
        <div className="glass-panel" style={{ padding: 28 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14 }}>Historique complet</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                {log.length} événements depuis le 10 avr.
              </p>
            </div>
            <button type="button" className="glass-btn ghost compact">
              <Icon name="download" size={13} /> Exporter
            </button>
          </div>
          <div className="glass-timeline">
            {log.map((x, i) => (
              <div key={i} className={"ev" + (x.kind ? " " + x.kind : "")}>
                <div className="time">{x.t}</div>
                <div className="what">
                  <strong>{x.u}</strong> — {x.e}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
