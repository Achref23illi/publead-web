"use client";

/**
 * EnterpriseAssets — creative asset library for an advertiser.
 * Grid of assets, type filter, upload tile, used-in counts.
 */

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";

type AssetType = "all" | "visual" | "video" | "logo" | "brief";

interface Asset {
  id: string;
  name: string;
  type: Exclude<AssetType, "all">;
  size: string;
  usedIn: number;
  updated: string;
  initials: string;
  color: string;
}

const ASSETS: Asset[] = [
  { id: "a1", name: "Flocage Nova — Printemps v3", type: "visual", size: "3,2 Mo", usedIn: 2, updated: "18 avr.", initials: "NP", color: "linear-gradient(135deg,#EC407A,#F472B6)" },
  { id: "a2", name: "Flocage Nova — Été teaser", type: "visual", size: "2,8 Mo", usedIn: 1, updated: "15 avr.", initials: "NE", color: "linear-gradient(135deg,#A855F7,#EC407A)" },
  { id: "a3", name: "Spot TV — 15 s", type: "video", size: "42 Mo", usedIn: 1, updated: "12 avr.", initials: "TV", color: "linear-gradient(135deg,#3B82F6,#6366F1)" },
  { id: "a4", name: "Logo Nova — navy", type: "logo", size: "214 Ko", usedIn: 4, updated: "02 avr.", initials: "NC", color: "linear-gradient(135deg,#233466,#3A4B8A)" },
  { id: "a5", name: "Logo Nova — rose", type: "logo", size: "186 Ko", usedIn: 2, updated: "02 avr.", initials: "NC", color: "linear-gradient(135deg,#EC407A,#F9A8D4)" },
  { id: "a6", name: "Brief Nova Été 2026", type: "brief", size: "1,1 Mo", usedIn: 1, updated: "08 avr.", initials: "NE", color: "linear-gradient(135deg,#14B8A6,#3B82F6)" },
  { id: "a7", name: "Visuel Borne — skincare", type: "visual", size: "4,1 Mo", usedIn: 1, updated: "20 mar.", initials: "SK", color: "linear-gradient(135deg,#F59E0B,#EC407A)" },
  { id: "a8", name: "Pack typos Nova", type: "logo", size: "890 Ko", usedIn: 3, updated: "14 mar.", initials: "TY", color: "linear-gradient(135deg,#0F172A,#475569)" },
];

const TYPE_LABEL: Record<Exclude<AssetType, "all">, string> = {
  visual: "Visuel",
  video: "Vidéo",
  logo: "Logo",
  brief: "Brief",
};

const TYPE_CHIP: Record<Exclude<AssetType, "all">, string> = {
  visual: "info",
  video: "paid",
  logo: "draft",
  brief: "warn",
};

export function EnterpriseAssets() {
  const [type, setType] = useState<AssetType>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return ASSETS.filter((a) => {
      const matchType = type === "all" || a.type === type;
      const q = query.trim().toLowerCase();
      return matchType && (!q || a.name.toLowerCase().includes(q));
    });
  }, [type, query]);

  const counts = {
    all: ASSETS.length,
    visual: ASSETS.filter((a) => a.type === "visual").length,
    video: ASSETS.filter((a) => a.type === "video").length,
    logo: ASSETS.filter((a) => a.type === "logo").length,
    brief: ASSETS.filter((a) => a.type === "brief").length,
  };

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Bibliothèque d&apos;assets
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            {ASSETS.length} fichiers · visuels, vidéos, logos et briefs de vos campagnes
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn ghost">
            <Icon name="filter" size={14} /> Filtres
          </button>
          <button type="button" className="glass-btn">
            <Icon name="upload-cloud" size={14} /> Téléverser
          </button>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{
          display: "flex",
          gap: 14,
          padding: 16,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div className="ent-seg">
          {(["all", "visual", "video", "logo", "brief"] as AssetType[]).map((t) => (
            <button
              key={t}
              className={type === t ? "active" : ""}
              onClick={() => setType(t)}
            >
              {t === "all" ? "Tous" : TYPE_LABEL[t]}
              <span style={{ marginLeft: 6, opacity: 0.7 }}>({counts[t]})</span>
            </button>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "7px 12px",
            background: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(35,52,102,0.1)",
            borderRadius: 999,
            minWidth: 260,
          }}
        >
          <Icon name="search" size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un asset…"
            style={{
              flex: 1,
              border: 0,
              outline: "none",
              background: "transparent",
              fontSize: 13,
              color: "#0A0E1F",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      <div className="ent-asset-grid">
        <button type="button" className="ent-upload-tile">
          <Icon name="upload-cloud" size={24} />
          <span>Téléverser un asset</span>
          <span style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 400 }}>
            PNG, JPG, MP4, AI, PDF · 50 Mo max
          </span>
        </button>

        {filtered.map((a) => (
          <div key={a.id} className="ent-asset-card">
            <div className="ent-asset-preview" style={{ background: a.color }}>
              <span className={`ent-chip ${TYPE_CHIP[a.type]}`}>{TYPE_LABEL[a.type]}</span>
              <span>{a.initials}</span>
            </div>
            <div className="ent-asset-body">
              <div className="ent-asset-name">{a.name}</div>
              <div className="ent-asset-meta">
                <span>
                  {a.size} · {a.updated}
                </span>
                <span>· {a.usedIn} campagne{a.usedIn > 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: 40,
              textAlign: "center",
              color: "var(--gray-500)",
            }}
          >
            Aucun asset ne correspond.
          </div>
        )}
      </div>
    </div>
  );
}
