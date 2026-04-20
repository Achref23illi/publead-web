"use client";

/**
 * NouvelleCampagnePro — 3-step campaign creation wizard.
 * 1:1 port of campaigns.jsx's <NouvelleCampagne>.
 */

import Link from "next/link";
import { Fragment, useState } from "react";
import { Icon } from "@/components/Icon";
import { BORNES } from "@/lib/data";

interface CampaignForm {
  title: string;
  desc: string;
  type: "Flocage" | "Borne";
  company: string;
  city: string[];
  start: string;
  end: string;
  km: number;
  drivers: number;
  pay: number;
  offer: "BOOST" | "GROWTH" | "LEADER";
}

export function NouvelleCampagnePro() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [f, setF] = useState<CampaignForm>({
    title: "Renault Électrique — Printemps 2026",
    desc: "Mise en avant des véhicules 100 % électriques sur trois villes.",
    type: "Flocage",
    company: "Renault France",
    city: ["Lyon"],
    start: "14 avr. 2026",
    end: "14 mai 2026",
    km: 12000,
    drivers: 5,
    pay: 250,
    offer: "GROWTH",
  });

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <div className="page-header">
        <div>
          <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 4 }}>
            <Link href="/campagnes" style={{ color: "var(--gray-500)" }}>
              Campagnes
            </Link>{" "}
            <Icon name="chevron-right" size={12} /> Nouvelle
          </div>
          <h1>Nouvelle campagne</h1>
          <p className="subtitle">Créez une campagne à partir d&apos;un contrat signé.</p>
        </div>
      </div>

      <div className="stepper">
        {([1, 2, 3] as const).map((n, i) => {
          const labels = ["Brief", "Ciblage", "Budget & chauffeurs"];
          const cls = step === n ? "active" : step > n ? "done" : "";
          return (
            <Fragment key={n}>
              {i > 0 && (
                <div
                  className="step-divider"
                  style={{ background: step >= n ? "var(--navy)" : "var(--gray-300)" }}
                />
              )}
              <div className={"step " + cls}>
                <span className="step-num">
                  {step > n ? <Icon name="check" size={14} /> : n}
                </span>
                <span>
                  {n}. {labels[i]}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>

      <div className="grid grid-12">
        <div className="col-8">
          <div className="card">
            {step === 1 && (
              <>
                <div className="input-group">
                  <label className="input-label">Entreprise</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      value={f.company}
                      onChange={(e) => setF({ ...f, company: e.target.value })}
                    />
                    <Icon
                      name="search"
                      size={16}
                      style={{
                        position: "absolute",
                        right: 14,
                        top: 14,
                        color: "var(--gray-500)",
                      }}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Titre de la campagne</label>
                  <input
                    className="input"
                    value={f.title}
                    onChange={(e) => setF({ ...f, title: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea
                    className="textarea"
                    value={f.desc}
                    onChange={(e) => setF({ ...f, desc: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Type de campagne</label>
                  <div className="segmented" style={{ padding: 4 }}>
                    {(["Flocage", "Borne"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={f.type === t ? "active" : ""}
                        onClick={() => setF({ ...f, type: t })}
                        style={{ padding: "8px 20px" }}
                      >
                        <Icon
                          name={t === "Flocage" ? "car" : "spray-can"}
                          size={14}
                          style={{ marginRight: 6, verticalAlign: "-2px" }}
                        />
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Brief ou visuel</label>
                  <div
                    style={{
                      border: "1.5px dashed var(--gray-300)",
                      borderRadius: 10,
                      padding: "32px",
                      textAlign: "center",
                      background: "var(--navy-tint)",
                    }}
                  >
                    <Icon name="upload-cloud" size={32} style={{ color: "var(--navy)" }} />
                    <div style={{ fontWeight: 600, marginTop: 8 }}>Glissez un fichier ici</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                      PDF, PNG, JPG — max 20 Mo
                    </div>
                  </div>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="input-group">
                  <label className="input-label">Villes</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {["Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse", "Nantes", "Lille"].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          className={
                            "chip " + (f.city.includes(c) ? "chip-filled-navy" : "chip-outline")
                          }
                          onClick={() =>
                            setF({
                              ...f,
                              city: f.city.includes(c)
                                ? f.city.filter((x) => x !== c)
                                : [...f.city, c],
                            })
                          }
                        >
                          {f.city.includes(c) && <Icon name="check" size={12} />} {c}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Zones spécifiques</label>
                  <div
                    className="input"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      flexWrap: "wrap",
                      height: "auto",
                      minHeight: 44,
                    }}
                  >
                    {["Presqu'île", "Part-Dieu", "Vaise"].map((t) => (
                      <span key={t} className="chip chip-soft-navy">
                        {t}{" "}
                        <Icon name="x" size={12} style={{ cursor: "pointer" }} />
                      </span>
                    ))}
                    <input
                      style={{ border: "none", outline: "none", flex: 1, minWidth: 120 }}
                      placeholder="Ajouter une zone…"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Période</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ position: "relative" }}>
                      <input
                        className="input"
                        value={f.start}
                        onChange={(e) => setF({ ...f, start: e.target.value })}
                      />
                      <Icon
                        name="calendar"
                        size={16}
                        style={{
                          position: "absolute",
                          right: 14,
                          top: 14,
                          color: "var(--gray-500)",
                        }}
                      />
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        className="input"
                        value={f.end}
                        onChange={(e) => setF({ ...f, end: e.target.value })}
                      />
                      <Icon
                        name="calendar"
                        size={16}
                        style={{
                          position: "absolute",
                          right: 14,
                          top: 14,
                          color: "var(--gray-500)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="hint">Durée estimée : 30 jours</div>
                </div>
                {f.type === "Flocage" ? (
                  <div className="input-group">
                    <label className="input-label">Objectif kilométrique</label>
                    <input
                      className="input"
                      type="number"
                      value={f.km}
                      onChange={(e) => setF({ ...f, km: Number(e.target.value) })}
                    />
                    <div className="hint">Environ 400 km / jour / véhicule.</div>
                  </div>
                ) : (
                  <div className="input-group">
                    <label className="input-label">Emplacements bornes</label>
                    <div
                      style={{
                        border: "1px solid var(--gray-200)",
                        borderRadius: 10,
                        padding: 8,
                        maxHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      {BORNES.slice(0, 5).map((b) => (
                        <label
                          key={b.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: 8,
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          <span className="checkbox checked">
                            <Icon name="check" size={12} />
                          </span>
                          <span style={{ flex: 1 }}>
                            {b.name}{" "}
                            <span style={{ color: "var(--gray-500)", fontSize: 12 }}>
                              · {b.type}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <div className="input-group">
                  <label className="input-label">Offre</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {(
                      [
                        { k: "BOOST", v: "5", p: "1 250 €" },
                        { k: "GROWTH", v: "8", p: "2 000 €" },
                        { k: "LEADER", v: "12+", p: "Sur devis" },
                      ] as const
                    ).map((o) => {
                      const sel = f.offer === o.k;
                      return (
                        <div
                          key={o.k}
                          onClick={() => setF({ ...f, offer: o.k })}
                          style={{
                            border: "1.5px solid " + (sel ? "var(--navy)" : "var(--gray-200)"),
                            borderRadius: 10,
                            padding: 14,
                            cursor: "pointer",
                            background: sel ? "var(--navy-soft)" : "#fff",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                              color: "var(--navy)",
                            }}
                          >
                            {o.k}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
                            {o.v} véhicules
                          </div>
                          <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                            {o.p} / mois HT
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Rémunération par chauffeur (€ / mois)</label>
                  <input
                    className="input"
                    type="number"
                    value={f.pay}
                    onChange={(e) => setF({ ...f, pay: Number(e.target.value) })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Nombre de chauffeurs souhaités</label>
                  <input
                    className="input"
                    type="number"
                    value={f.drivers}
                    onChange={(e) => setF({ ...f, drivers: Number(e.target.value) })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Mode de suivi</label>
                  <div className="segmented">
                    <button type="button" className="active">
                      GPS temps réel
                    </button>
                    <button type="button">Manuel</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-4">
          <div style={{ position: "sticky", top: 96 }}>
            <div className="section-label">APERÇU EN DIRECT</div>
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div className="brand-logo" style={{ background: "#FDD835" }}>
                  R
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{f.company}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                <span className="chip chip-navy-outline">
                  <Icon name={f.type === "Flocage" ? "car" : "spray-can"} size={12} /> {f.type}
                </span>
                {f.city.map((c) => (
                  <span key={c} className="chip chip-soft-navy">
                    {c}
                  </span>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--gray-200)", paddingTop: 12 }}>
                {[
                  ["Période", f.start + " → " + f.end],
                  [
                    "Chauffeurs",
                    f.drivers +
                      " / " +
                      (f.offer === "BOOST" ? 5 : f.offer === "GROWTH" ? 8 : 12),
                  ],
                  ["Rémunération", f.pay + " € / chauffeur / mois"],
                  ["Offre", f.offer],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "var(--gray-500)" }}>{l}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--gray-500)",
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="info" size={14} /> Le contrat sera envoyé pour signature électronique.
            </div>
          </div>
        </div>
      </div>

      <div className="sticky-actions">
        <Link href="/campagnes" className="btn btn-ghost">
          Annuler
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="button" className="btn btn-ghost">
            Enregistrer en brouillon
          </button>
          {step > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
            >
              Précédent
            </button>
          )}
          {step < 3 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((step + 1) as 1 | 2 | 3)}
            >
              Suivant
            </button>
          )}
          {step === 3 && (
            <Link href="/campagnes/k1" className="btn btn-primary">
              Créer la campagne
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
