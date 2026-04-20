"use client";

/**
 * ChauffeursGlass — rond/vitré drivers directory.
 * Port of glass-screens.jsx's <ChauffeursGlass>.
 */

import { DRIVERS_VALID } from "@/lib/data";
import { Icon } from "@/components/Icon";

export function ChauffeursGlass() {
  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>Chauffeurs</h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Répertoire actif — {DRIVERS_VALID.length} chauffeurs.
          </p>
        </div>
      </div>

      <div className="glass-filterrow">
        <button type="button" className="glass-fpill">
          <Icon name="map-pin" size={12} /> Villes
        </button>
        <button type="button" className="glass-fpill">
          <Icon name="car" size={12} /> Véhicule
        </button>
        <button type="button" className="glass-fpill">
          <Icon name="star" size={12} /> Note ≥ 4,5
        </button>
        <span style={{ flex: 1 }} />
        <div className="glass-searchfield">
          <Icon name="search" size={14} />
          <input placeholder="Rechercher…" />
        </div>
      </div>

      <div className="glass-cardgrid">
        {DRIVERS_VALID.map((r) => (
          <div key={r.id} className="glass-tile">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="avatar-initials" style={{ width: 44, height: 44, fontSize: 15 }}>
                {r.name
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{r.city}</div>
              </div>
            </div>
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid rgba(0,0,0,0.08)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{r.camp}</div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Camp.</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{(r.km / 1000).toFixed(1)}k</div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Km</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{r.rating.toFixed(1)}</div>
                <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Note</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
