"use client";

/**
 * CampagneDetailPro — campaign detail with 5 tabs and assign modal.
 * 1:1 port of campaigns.jsx's <CampagneDetail> + <AssignModal>.
 */

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { StackedArea } from "@/components/charts";
import { useToast } from "@/contexts/ToastContext";
import { CAMPAIGNS, DRIVERS_VALID } from "@/lib/data";

interface AssignModalProps {
  onClose: () => void;
  onConfirm: (n: number) => void;
}

function AssignModal({ onClose, onConfirm }: AssignModalProps) {
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal modal-lg">
        <div
          className="modal-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <h3>Assigner des chauffeurs</h3>
          <div style={{ fontSize: 13, color: "var(--gray-500)" }}>
            <span className="fw-600" style={{ color: "var(--navy)" }}>
              {sel.length}
            </span>{" "}
            / 5 sélectionnés
          </div>
        </div>
        <div className="modal-body">
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Icon
              name="search"
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: 14,
                color: "var(--gray-500)",
              }}
            />
            <input
              className="input"
              placeholder="Rechercher un chauffeur…"
              style={{ paddingLeft: 40 }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <span className="chip chip-outline">
              Ville <Icon name="chevron-down" size={12} />
            </span>
            <span className="chip chip-outline">Note ≥ 4,5</span>
            <span className="chip chip-outline">Véhicule</span>
          </div>
          <div
            style={{
              border: "1px solid var(--gray-200)",
              borderRadius: 10,
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {DRIVERS_VALID.map((d) => {
              const s = sel.includes(d.id);
              return (
                <div
                  key={d.id}
                  onClick={() => toggle(d.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--gray-100)",
                    cursor: "pointer",
                    background: s ? "var(--navy-soft)" : "#fff",
                  }}
                >
                  <span className={"checkbox " + (s ? "checked" : "")}>
                    {s && <Icon name="check" size={12} />}
                  </span>
                  <div className="avatar-initials" style={{ width: 36, height: 36 }}>
                    {d.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                      {d.city} · {d.vehicle}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}
                  >
                    <Icon name="star" size={14} style={{ color: "#F59E0B" }} />
                    {d.rating}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    {d.camp} campagnes
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={sel.length === 0}
            onClick={() => onConfirm(sel.length)}
          >
            Confirmer l&apos;assignation
          </button>
        </div>
      </div>
    </>
  );
}

interface CampagneDetailProProps {
  id: string;
}

type DetailTab = "overview" | "drivers" | "tracking" | "files" | "log";

export function CampagneDetailPro({ id }: CampagneDetailProProps) {
  const { pushToast } = useToast();
  const camp = CAMPAIGNS.find((c) => c.id === id) || CAMPAIGNS[0];
  const [tab, setTab] = useState<DetailTab>("overview");
  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <div className="page">
      <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 12 }}>
        <Link href="/campagnes" style={{ color: "var(--gray-500)" }}>
          Campagnes
        </Link>{" "}
        <Icon name="chevron-right" size={12} /> <span>{camp.brand}</span>
      </div>
      <div className="card mb-6">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="brand-logo xl" style={{ background: camp.color }}>
            {camp.initials}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>{camp.brand}</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span className="chip chip-navy-outline">
                <Icon name={camp.type === "Flocage" ? "car" : "spray-can"} size={12} /> {camp.type}
              </span>
              <span className="chip chip-outline">
                <Icon name="map-pin" size={12} /> {camp.city}
              </span>
              <span className="chip chip-outline">
                <Icon name="calendar" size={12} /> {camp.period}
              </span>
              <span className="chip chip-success">
                <span className="dot" /> Active
              </span>
              <span className="chip chip-outline" style={{ color: "var(--gray-500)" }}>
                Contrat #CT-2026-047
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-primary" onClick={() => setAssignOpen(true)}>
              <Icon name="user-plus" size={16} /> Assigner des chauffeurs
            </button>
            <button
              type="button"
              className="icon-btn"
              style={{ border: "1px solid var(--gray-200)" }}
            >
              <Icon name="more-horizontal" size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="tabs">
        {(
          [
            ["overview", "Vue d'ensemble"],
            ["drivers", "Chauffeurs assignés"],
            ["tracking", "Suivi"],
            ["files", "Fichiers"],
            ["log", "Historique"],
          ] as const
        ).map(([k, l]) => (
          <div
            key={k}
            className={"tab" + (tab === k ? " active" : "")}
            onClick={() => setTab(k)}
          >
            {l}
          </div>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-12">
          <div className="col-4">
            <div className="card" style={{ textAlign: "center" }}>
              <h3 className="card-title" style={{ textAlign: "left", marginBottom: 24 }}>
                Progression globale
              </h3>
              <div className="radial-wrap">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="76" stroke="#EEF1F8" strokeWidth="16" fill="none" />
                  <circle
                    cx="90"
                    cy="90"
                    r="76"
                    stroke="#233466"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={Math.PI * 2 * 76}
                    strokeDashoffset={(1 - camp.progress / 100) * Math.PI * 2 * 76}
                    strokeLinecap="round"
                    transform="rotate(-90 90 90)"
                  />
                </svg>
                <div className="center">
                  <div className="big num">{camp.progress}%</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>complétude</div>
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: "var(--gray-500)" }}>
                18 jours restants sur 30
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card">
              <h3 className="card-title">Kilométrage</h3>
              <div
                className="num"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 40,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  margin: "12px 0 4px",
                }}
              >
                1 240 km
              </div>
              <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 16 }}>
                sur 2 000 km objectif
              </div>
              <div className="progress" style={{ marginBottom: 12 }}>
                <div className="progress-fill" style={{ width: "62%" }} />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--gray-500)",
                }}
              >
                <span>4 chauffeurs actifs</span>
                <span>~310 km / chauffeur</span>
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card">
              <h3 className="card-title">Revenus & ROI</h3>
              <div
                className="num"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 40,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  margin: "12px 0 4px",
                }}
              >
                {camp.rev}
              </div>
              <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 16 }}>
                revenus générés
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  ["Impressions est.", "1 860 000"],
                  ["CPM moyen", "1,72 €"],
                  ["Bénéficiaires", "4 chauffeurs"],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      whiteSpace: "nowrap",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "var(--gray-500)" }}>{l}</span>
                    <span className="num fw-600" style={{ whiteSpace: "nowrap" }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Évolution quotidienne</h3>
                <div className="segmented">
                  <button type="button" className="active">
                    30 j
                  </button>
                  <button type="button">7 j</button>
                </div>
              </div>
              <StackedArea />
            </div>
          </div>
        </div>
      )}

      {tab === "drivers" && (
        <div className="card card-flush">
          <table className="table">
            <thead>
              <tr>
                <th>Chauffeur</th>
                <th>Véhicule</th>
                <th>Km parcourus</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {DRIVERS_VALID.slice(0, 4).map((d) => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        className="avatar-initials"
                        style={{ width: 32, height: 32, fontSize: 11 }}
                      >
                        {d.name
                          .split(" ")
                          .map((s) => s[0])
                          .join("")}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{d.name}</div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{d.city}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {d.vehicle} <span style={{ color: "var(--gray-500)" }}>· {d.plate}</span>
                  </td>
                  <td style={{ minWidth: 160 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="progress" style={{ flex: 1 }}>
                        <div
                          className="progress-fill"
                          style={{ width: 20 + d.camp * 4 + "%" }}
                        />
                      </div>
                      <span className="num fw-600" style={{ fontSize: 12 }}>
                        {(d.camp * 120).toLocaleString("fr-FR")} km
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="chip chip-success">
                      <span className="dot" /> Actif
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button type="button" className="icon-btn btn-danger-ghost">
                      <Icon name="x" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "tracking" && (
        <div className="grid grid-12">
          <div className="col-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Timeline</h3>
                <div className="segmented">
                  <button type="button" className="active">
                    GPS
                  </button>
                  <button type="button">Manuel</button>
                </div>
              </div>
              <div style={{ position: "relative", paddingLeft: 24 }}>
                <div
                  style={{
                    position: "absolute",
                    left: 7,
                    top: 6,
                    bottom: 6,
                    width: 2,
                    background: "var(--gray-200)",
                  }}
                />
                {[
                  {
                    t: "Aujourd'hui · 09:14",
                    dot: "var(--success)",
                    text: "Lucas Fontaine a démarré son shift (Lyon)",
                    who: "GPS",
                  },
                  {
                    t: "Aujourd'hui · 08:02",
                    dot: "var(--navy)",
                    text: "Relevé kilométrique automatique — 62 km ajoutés",
                  },
                  {
                    t: "Hier · 18:40",
                    dot: "var(--info)",
                    text: "Amélie Rousseau a terminé — 134 km",
                  },
                  {
                    t: "Hier · 14:21",
                    dot: "var(--warning)",
                    text: "Alerte : véhicule DJ-019-QR immobile depuis 3 h",
                    who: "GPS",
                  },
                  {
                    t: "Hier · 09:00",
                    dot: "var(--navy)",
                    text: "Campagne activée et diffusion démarrée",
                  },
                ].map((e, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 12, padding: "10px 0", position: "relative" }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: -22,
                        top: 14,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: e.dot,
                        border: "3px solid #fff",
                        boxShadow: "0 0 0 1px " + e.dot,
                      }}
                    />
                    <div
                      style={{
                        width: 140,
                        fontSize: 12,
                        color: "var(--gray-500)",
                        paddingTop: 2,
                      }}
                    >
                      {e.t}
                    </div>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      {e.text}
                      {e.who && (
                        <span style={{ color: "var(--gray-500)", fontSize: 12 }}>
                          {" "}· par {e.who}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card card-flush" style={{ overflow: "hidden" }}>
              <div className="map-placeholder" style={{ height: 380, position: "relative" }}>
                {[
                  { x: 40, y: 45 },
                  { x: 60, y: 38 },
                  { x: 30, y: 62 },
                  { x: 72, y: 58 },
                ].map((p, i) => (
                  <div
                    key={i}
                    className="map-pin"
                    style={{ left: p.x + "%", top: p.y + "%" }}
                  >
                    <Icon name="map-pin" size={28} />
                  </div>
                ))}
              </div>
              <div style={{ padding: 16, borderTop: "1px solid var(--gray-200)" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>4 véhicules en circulation</div>
                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                  Dernière synchronisation il y a 2 min
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "files" && (
        <div className="grid grid-12" style={{ gap: 16 }}>
          {[
            "Brief marketing.pdf",
            "Visuel véhicule — recto.png",
            "Visuel véhicule — verso.png",
            "Contrat signé.pdf",
          ].map((n) => (
            <div key={n} className="col-3 card" style={{ padding: 16 }}>
              <div className="placeholder-img" style={{ height: 120, marginBottom: 12 }}>
                aperçu
              </div>
              <div style={{ fontWeight: 600, fontSize: 13 }} className="truncate">
                {n}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                14 avr. 2026 · 2,4 Mo
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "log" && (
        <div className="card card-flush">
          <table className="table">
            <thead>
              <tr>
                <th>Horodatage</th>
                <th>Acteur</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["20 avr. 2026 · 09:14", "Lucas Fontaine", "Shift démarré"],
                ["14 avr. 2026 · 11:02", "Claire Lemoine", "Campagne activée"],
                ["13 avr. 2026 · 16:21", "Claire Lemoine", "4 chauffeurs assignés"],
                ["12 avr. 2026 · 14:00", "Système", "Brief déposé"],
                ["10 avr. 2026 · 10:30", "Renault France", "Contrat signé"],
              ].map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} style={{ color: j === 0 ? "var(--gray-500)" : "" }}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {assignOpen && (
        <AssignModal
          onClose={() => setAssignOpen(false)}
          onConfirm={(n) => {
            pushToast({
              kind: "success",
              title: "Chauffeurs assignés",
              desc: n + " chauffeurs ajoutés à la campagne.",
            });
            setAssignOpen(false);
          }}
        />
      )}
    </div>
  );
}
