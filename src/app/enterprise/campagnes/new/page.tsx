"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";

type DiffusionType = "flocage" | "borne";

const CITY_OPTIONS = ["Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse", "Nantes", "Lille"];

export default function EnterpriseNouvelleCampagnePage() {
  const [diffusion, setDiffusion] = useState<DiffusionType>("flocage");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Paris");
  const [budget, setBudget] = useState("3000");
  const [start, setStart] = useState("2026-05-01");
  const [end, setEnd] = useState("2026-05-31");
  const [goal, setGoal] = useState("");

  const days =
    Math.max(
      1,
      Math.round(
        (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24),
      ),
    ) || 1;
  const dailyBudget = Math.round(Number(budget || 0) / days);

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 6 }}>
            <Link href="/enterprise/campagnes" style={{ color: "var(--navy)", textDecoration: "none" }}>
              ← Mes campagnes
            </Link>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Nouvelle campagne
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Brief votre diffusion — votre chargé de compte vous rappelle sous 24 h.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <div className="glass-panel">
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>Brief</h3>
          </div>
          <div style={{ padding: 16, display: "grid", gap: 14 }}>
            <Field label="Nom de la campagne">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Nova Printemps 2026"
                className="glass-input"
              />
            </Field>
            <Field label="Type de diffusion">
              <div className="ent-seg">
                <button
                  className={diffusion === "flocage" ? "active" : ""}
                  onClick={() => setDiffusion("flocage")}
                >
                  Flocage
                </button>
                <button
                  className={diffusion === "borne" ? "active" : ""}
                  onClick={() => setDiffusion("borne")}
                >
                  Borne
                </button>
              </div>
            </Field>
            <Field label="Ville principale">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="glass-input"
              >
                {CITY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Début">
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="glass-input"
                />
              </Field>
              <Field label="Fin">
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="glass-input"
                />
              </Field>
            </div>
            <Field label="Objectif">
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Décrivez votre objectif : notoriété, trafic en boutique, lancement produit…"
                rows={3}
                className="glass-input"
                style={{ resize: "vertical" }}
              />
            </Field>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="glass-panel">
            <div className="glass-panelhead">
              <h3 style={{ margin: 0, fontSize: 14 }}>Budget</h3>
            </div>
            <div style={{ padding: 16, display: "grid", gap: 12 }}>
              <Field label="Budget total (€)">
                <input
                  type="number"
                  min="500"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="glass-input"
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <MiniKpi label="Durée" value={`${days} j`} />
                <MiniKpi label="~ par jour" value={`${dailyBudget} €`} />
              </div>
              <p style={{ fontSize: 11.5, color: "var(--gray-500)", margin: 0 }}>
                Budget minimum recommandé : 1 500 € sur 14 jours pour une bonne couverture.
              </p>
            </div>
          </div>

          <div className="glass-panel">
            <div className="glass-panelhead">
              <h3 style={{ margin: 0, fontSize: 14 }}>Récapitulatif</h3>
            </div>
            <div style={{ padding: 16, display: "grid", gap: 10, fontSize: 13 }}>
              <Row k="Nom" v={name || "—"} />
              <Row k="Diffusion" v={diffusion === "flocage" ? "Flocage véhicule" : "Leader Borne"} />
              <Row k="Ville" v={city} />
              <Row k="Période" v={`${start} → ${end}`} />
              <Row k="Budget" v={`${budget} €`} />
              <button
                type="button"
                className="glass-btn"
                style={{ marginTop: 8, justifyContent: "center" }}
              >
                <Icon name="check" size={14} /> Envoyer pour validation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
        {label}
      </span>
      {children}
    </label>
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "var(--gray-500)" }}>{k}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{v}</span>
    </div>
  );
}
