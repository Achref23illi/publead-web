"use client";

/**
 * NouvelleCampagneGlass — rond/vitré new-campaign wizard.
 * Port of glass-screens.jsx's <NouvelleCampagneGlass>.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";

type Step = 1 | 2 | 3;

export function NouvelleCampagneGlass() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [type, setType] = useState<"Flocage" | "Borne">("Flocage");

  const submit = () => {
    pushToast({
      kind: "success",
      title: "Campagne créée",
      desc: "Elle apparaîtra dans la liste dans quelques secondes.",
    });
    router.push("/campagnes");
  };

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Nouvelle campagne
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Étape {step} sur 3
          </p>
        </div>
      </div>

      <div className="glass-stepper">
        {[
          { s: 1, l: "Brief" },
          { s: 2, l: "Ciblage" },
          { s: 3, l: "Budget & chauffeurs" },
        ].map((x, i) => (
          <div key={x.s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className={"glass-step" + (step >= x.s ? " active" : "")}>
              <span>{x.s}</span> {x.l}
            </div>
            {i < 2 && <div className="glass-step-sep" />}
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: 28 }}>
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="glass-field" style={{ gridColumn: "1/-1" }}>
              <label className="glass-label">Entreprise</label>
              <input className="glass-input" placeholder="Sélectionner…" />
            </div>
            <div className="glass-field" style={{ gridColumn: "1/-1" }}>
              <label className="glass-label">Titre de la campagne</label>
              <input className="glass-input" placeholder="Ex. Lancement printemps" />
            </div>
            <div className="glass-field" style={{ gridColumn: "1/-1" }}>
              <label className="glass-label">Description</label>
              <textarea className="glass-input" rows={3} placeholder="Brief créatif, ton…" />
            </div>
            <div className="glass-field" style={{ gridColumn: "1/-1" }}>
              <label className="glass-label">Type</label>
              <div className="glass-segmented">
                {(["Flocage", "Borne"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={type === t ? "active" : ""}
                    onClick={() => setType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="glass-field" style={{ gridColumn: "1/-1" }}>
              <label className="glass-label">Ville principale</label>
              <input className="glass-input" placeholder="Paris, Lyon, Marseille…" />
            </div>
            <div className="glass-field">
              <label className="glass-label">Début</label>
              <input className="glass-input" type="date" />
            </div>
            <div className="glass-field">
              <label className="glass-label">Fin</label>
              <input className="glass-input" type="date" />
            </div>
            <div className="glass-field" style={{ gridColumn: "1/-1" }}>
              <label className="glass-label">
                {type === "Flocage" ? "Objectif km" : "Nombre de bornes"}
              </label>
              <input
                className="glass-input"
                type="number"
                placeholder={type === "Flocage" ? "Ex. 2000" : "Ex. 3"}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { n: "BOOST", p: "1 200 €" },
              { n: "GROWTH", p: "2 800 €" },
              { n: "LEADER", p: "5 400 €" },
            ].map((o) => (
              <div
                key={o.n}
                style={{
                  padding: 20,
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: 14,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>{o.n}</div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 24,
                    fontWeight: 700,
                    margin: "8px 0",
                  }}
                >
                  {o.p}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className="glass-sticky"
          style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}
        >
          <button
            type="button"
            className="glass-btn"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
            disabled={step === 1}
          >
            <Icon name="chevron-left" size={14} /> Précédent
          </button>
          {step < 3 ? (
            <button
              type="button"
              className="glass-btn glass-btn-primary"
              onClick={() => setStep((s) => (s + 1) as Step)}
            >
              Suivant <Icon name="chevron-right" size={14} />
            </button>
          ) : (
            <button type="button" className="glass-btn glass-btn-primary" onClick={submit}>
              Créer la campagne
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
