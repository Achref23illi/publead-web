"use client";

/**
 * CampagnesListPro — pro UI list of all campaigns.
 * 1:1 port of campaigns.jsx's <CampagnesList>.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { CAMPAIGNS } from "@/lib/data";
import { CampaignsTable } from "@/screens/DashboardPro";

type TypeFilter = "tous" | "flocage" | "borne";

export function CampagnesListPro() {
  const router = useRouter();
  const [type, setType] = useState<TypeFilter>("tous");
  const rows =
    type === "tous"
      ? CAMPAIGNS
      : CAMPAIGNS.filter((c) => c.type.toLowerCase() === type);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Campagnes</h1>
          <p className="subtitle">Toutes les campagnes Flocage et Leader Borne.</p>
        </div>
        <Link href="/campagnes/new" className="btn btn-primary">
          <Icon name="plus" size={18} /> Nouvelle campagne
        </Link>
      </div>

      <div className="grid grid-12 mb-6" style={{ gap: 16 }}>
        {[
          { l: "Actives", v: "9", s: "+2 depuis la semaine passée" },
          { l: "Démarrent cette semaine", v: "3", s: "dont 1 Borne" },
          { l: "Terminées ce mois", v: "5", s: "85 % objectifs atteints" },
          { l: "Taux de remplissage", v: "87 %", s: "chauffeurs / objectif" },
        ].map((t) => (
          <div
            key={t.l}
            className="col-3"
            style={{ background: "var(--navy-soft)", borderRadius: 10, padding: "16px 18px" }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "var(--navy)",
                textTransform: "uppercase",
              }}
            >
              {t.l}
            </div>
            <div
              className="num"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 700,
                margin: "4px 0 2px",
              }}
            >
              {t.v}
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{t.s}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
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
            className={"chip " + (type === k ? "chip-filled-navy" : "chip-outline")}
            onClick={() => setType(k)}
          >
            {l !== "Tous" && <Icon name={l === "Flocage" ? "car" : "spray-can"} size={12} />} {l}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button type="button" className="chip chip-outline">
          <Icon name="filter" size={12} /> Statut
        </button>
        <button type="button" className="chip chip-outline">
          <Icon name="map-pin" size={12} /> Ville
        </button>
      </div>

      <div className="card card-flush">
        <CampaignsTable rows={rows} onOpen={(r) => router.push("/campagnes/" + r.id)} />
      </div>
    </div>
  );
}
