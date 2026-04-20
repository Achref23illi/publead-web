"use client";

/**
 * ValidationsGlass — rond/vitré validations queue.
 * Port of glass-screens.jsx's <ValidationsGlass>.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";
import { DRIVERS_PENDING, COMPANIES_PENDING, type DriverPending, type CompanyPending } from "@/lib/data";

type Row = DriverPending | CompanyPending;
const isDriver = (r: Row): r is DriverPending => (r as DriverPending).vehicle !== undefined;

export function ValidationsGlass() {
  const { pushToast } = useToast();
  const [tab, setTab] = useState<"chauffeurs" | "entreprises">("chauffeurs");
  const rows: Row[] = tab === "chauffeurs" ? DRIVERS_PENDING : COMPANIES_PENDING;

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>Validations</h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Dossiers en attente — approuver, refuser, ou demander des compléments.
          </p>
        </div>
      </div>

      <div className="glass-kpigrid" style={{ marginBottom: 20 }}>
        {[
          { l: "Chauffeurs en attente", v: "12" },
          { l: "Entreprises en attente", v: "4" },
          { l: "Validés ce mois", v: "28" },
          { l: "Refusés ce mois", v: "3" },
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
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                fontWeight: 700,
                margin: "4px 0",
              }}
            >
              {k.v}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-tabs">
        {(
          [
            ["chauffeurs", "Chauffeurs"],
            ["entreprises", "Entreprises"],
          ] as const
        ).map(([k, l]) => (
          <div
            key={k}
            className={"glass-tabpill" + (tab === k ? " active" : "")}
            onClick={() => setTab(k)}
          >
            {l}
          </div>
        ))}
      </div>

      <div className="glass-panel">
        <table className="glass-table">
          <thead>
            <tr>
              <th>{tab === "chauffeurs" ? "Chauffeur" : "Entreprise"}</th>
              <th>Ville</th>
              <th>Inscription</th>
              {tab === "chauffeurs" && <th>Documents</th>}
              {tab === "entreprises" && <th>Secteur</th>}
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isDriver(r) ? (
                      <div className="avatar-initials" style={{ width: 32, height: 32 }}>
                        {r.name
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                    ) : (
                      <div
                        className="brand-logo"
                        style={{ background: (r as CompanyPending).color, width: 32, height: 32 }}
                      >
                        {r.name[0]}
                      </div>
                    )}
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                  </div>
                </td>
                <td>{r.city}</td>
                <td style={{ color: "var(--gray-500)" }}>{r.since}</td>
                {isDriver(r) && (
                  <td>
                    <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                      {r.docs.filter(Boolean).length}/4
                    </span>
                  </td>
                )}
                {!isDriver(r) && <td>{r.sector}</td>}
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    <button
                      type="button"
                      className="glass-btn"
                      onClick={() =>
                        pushToast({
                          kind: "success",
                          title: "Dossier validé",
                          desc: r.name + " activé.",
                        })
                      }
                    >
                      <Icon name="check" size={14} /> Valider
                    </button>
                    <button
                      type="button"
                      className="glass-btn"
                      onClick={() =>
                        pushToast({
                          kind: "danger",
                          title: "Dossier refusé",
                          desc: r.name + " notifié.",
                        })
                      }
                    >
                      <Icon name="x" size={14} /> Refuser
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
