"use client";

/**
 * CampagnesListGlass — rond/vitré campaigns list.
 * Port of glass-screens.jsx's <CampagnesListGlass>.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { CAMPAIGNS } from "@/lib/data";

type TypeFilter = "tous" | "flocage" | "borne";

export function CampagnesListGlass() {
  const router = useRouter();
  const [type, setType] = useState<TypeFilter>("tous");
  const rows =
    type === "tous" ? CAMPAIGNS : CAMPAIGNS.filter((c) => c.type.toLowerCase() === type);

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>Campagnes</h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Toutes les campagnes Flocage et Leader Borne.
          </p>
        </div>
        <Link href="/campagnes/new" className="glass-btn">
          <Icon name="plus" size={14} /> Nouvelle campagne
        </Link>
      </div>

      <div className="glass-filterrow">
        {(
          [
            ["tous", "Tous"],
            ["flocage", "Flocage"],
            ["borne", "Borne"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            className={"glass-fpill" + (type === k ? " active" : "")}
            onClick={() => setType(k)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="glass-panel">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Campagne</th>
              <th>Entreprise</th>
              <th>Type</th>
              <th>Ville</th>
              <th>Période</th>
              <th style={{ textAlign: "right" }}>Progression</th>
              <th style={{ textAlign: "right" }}>Revenus</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                style={{ cursor: "pointer" }}
                onClick={() => router.push("/campagnes/" + c.id)}
              >
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      className="brand-logo"
                      style={{ background: c.color, width: 32, height: 32, fontSize: 12 }}
                    >
                      {c.initials}
                    </div>
                    <span style={{ fontWeight: 600 }}>{c.brand}</span>
                  </div>
                </td>
                <td>{c.company}</td>
                <td>{c.type}</td>
                <td>{c.city}</td>
                <td style={{ color: "var(--gray-500)" }}>{c.period}</td>
                <td style={{ textAlign: "right" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "var(--gray-500)" }}>{c.progress}%</span>
                    <div className="glass-progress" style={{ width: 60 }}>
                      <div style={{ width: c.progress + "%" }} />
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{c.rev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
