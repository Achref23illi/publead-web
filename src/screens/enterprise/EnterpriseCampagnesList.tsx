"use client";

/**
 * EnterpriseCampagnesList — advertiser's view of their campaigns.
 * Status filter chips + search + table.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { CAMPAIGNS } from "@/lib/data";

type StatusFilter = "all" | "active" | "draft" | "completed";

// Advertiser-scoped campaigns (would come from the backend in prod).
const MY_CAMPAIGNS = CAMPAIGNS;

const STATUS_LABEL: Record<Exclude<StatusFilter, "all">, string> = {
  active: "En cours",
  draft: "Brouillon",
  completed: "Terminée",
};

export function EnterpriseCampagnesList() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return MY_CAMPAIGNS.filter((c) => {
      const matchStatus = status === "all" || c.status === status;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        c.brand.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [status, query]);

  const counts = {
    all: MY_CAMPAIGNS.length,
    active: MY_CAMPAIGNS.filter((c) => c.status === "active").length,
    draft: MY_CAMPAIGNS.filter((c) => c.status === "draft").length,
    completed: MY_CAMPAIGNS.filter((c) => c.status === "completed").length,
  };

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Mes campagnes
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            {counts.active} en cours · {counts.draft} brouillon · {counts.completed} terminées
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn ghost">
            <Icon name="download" size={14} /> Exporter
          </button>
          <Link href="/enterprise/campagnes/new" className="glass-btn">
            <Icon name="plus" size={14} /> Nouvelle campagne
          </Link>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{ display: "flex", flexDirection: "column", gap: 0 }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: 16,
            borderBottom: "1px solid rgba(35,52,102,0.08)",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="ent-seg">
            {(["all", "active", "draft", "completed"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                className={status === s ? "active" : ""}
                onClick={() => setStatus(s)}
              >
                {s === "all" ? "Toutes" : STATUS_LABEL[s]}
                <span style={{ marginLeft: 6, opacity: 0.7 }}>({counts[s]})</span>
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
              placeholder="Rechercher une campagne…"
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

        <table className="glass-table">
          <thead>
            <tr>
              <th>Campagne</th>
              <th>Type</th>
              <th>Ville</th>
              <th>Période</th>
              <th style={{ textAlign: "right" }}>Progression</th>
              <th style={{ textAlign: "right" }}>Budget</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      className="brand-logo"
                      style={{ background: c.color, width: 32, height: 32, fontSize: 12 }}
                    >
                      {c.initials}
                    </div>
                    <Link
                      href={`/enterprise/campagnes/${c.id}`}
                      style={{ fontWeight: 600, color: "#0A0E1F", textDecoration: "none" }}
                    >
                      {c.brand}
                    </Link>
                  </div>
                </td>
                <td>{c.type}</td>
                <td>{c.city}</td>
                <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{c.period}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 12, color: "var(--gray-500)" }}>{c.progress}%</span>
                    <div className="glass-progress" style={{ width: 60 }}>
                      <div style={{ width: c.progress + "%" }} />
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{c.rev}</td>
                <td>
                  <span className={`ent-chip ${c.status}`}>
                    {STATUS_LABEL[c.status as Exclude<StatusFilter, "all">] || c.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--gray-500)" }}>
                  Aucune campagne ne correspond à vos filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
