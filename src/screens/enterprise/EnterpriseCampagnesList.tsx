"use client";

/**
 * EnterpriseCampagnesList — advertiser's view of their campaigns.
 * Live data from /api/me/campaigns. Status filter chips + search + table.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";

type CampaignDTO = {
  id: string;
  brand: string;
  domain: string;
  title: string;
  campaignType: "flocage" | "borne";
  budgetTier: "boost" | "growth" | "leader";
  budgetCents: number;
  city: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: "draft" | "upcoming" | "active" | "completed";
  progress: number;
  driversNeeded: number;
  driversAssigned: number;
  borne?: { count: number };
  brandColor?: string;
  brandLogoUrl?: string;
};

type StatusFilter = "all" | "draft" | "upcoming" | "active" | "completed";

const STATUS_LABEL: Record<Exclude<StatusFilter, "all">, string> = {
  draft: "Brouillon",
  upcoming: "À venir",
  active: "En cours",
  completed: "Terminée",
};

const STATUS_TONE: Record<Exclude<StatusFilter, "all">, string> = {
  draft: "warn",
  upcoming: "info",
  active: "paid",
  completed: "draft",
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function formatEur(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}

export function EnterpriseCampagnesList() {
  const [items, setItems] = useState<CampaignDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/me/campaigns", { cache: "no-store" });
      const body = (await res.json()) as {
        campaigns?: CampaignDTO[];
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(body.message ?? body.error ?? "Erreur de chargement");
        return;
      }
      setItems(body.campaigns ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((c) => {
      const matchStatus = status === "all" || c.status === status;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        c.brand.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [items, status, query]);

  const counts = useMemo(() => {
    const list = items ?? [];
    return {
      all: list.length,
      draft: list.filter((c) => c.status === "draft").length,
      upcoming: list.filter((c) => c.status === "upcoming").length,
      active: list.filter((c) => c.status === "active").length,
      completed: list.filter((c) => c.status === "completed").length,
    };
  }, [items]);

  if (loading && !items) {
    return (
      <div className="glass-page">
        <div className="glass-pagehead">
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
              Mes campagnes
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
              Chargement…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Mes campagnes
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            {counts.active} en cours · {counts.upcoming} à venir · {counts.draft} brouillon · {counts.completed} terminées
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/enterprise/campagnes/new" className="glass-btn">
            <Icon name="plus" size={14} /> Nouvelle campagne
          </Link>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "rgba(239,68,68,0.08)",
            color: "#b91c1c",
            borderRadius: 10,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

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
            {(["all", "draft", "upcoming", "active", "completed"] as StatusFilter[]).map((s) => (
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const progressPct = Math.round((c.progress ?? 0) * 100);
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        className="brand-logo"
                        style={{
                          background:
                            c.brandLogoUrl
                              ? `url(${c.brandLogoUrl}) center/cover`
                              : c.brandColor ?? "linear-gradient(135deg,#3B82F6,#6366F1)",
                          width: 32,
                          height: 32,
                          fontSize: 12,
                          color: "#fff",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                        }}
                      >
                        {!c.brandLogoUrl && initialsFor(c.brand)}
                      </div>
                      <Link
                        href={
                          c.status === "draft"
                            ? `/enterprise/campagnes/${c.id}/edit`
                            : `/enterprise/campagnes/${c.id}`
                        }
                        style={{
                          fontWeight: 600,
                          color: "#0A0E1F",
                          textDecoration: "none",
                        }}
                      >
                        {c.title || c.brand}
                      </Link>
                    </div>
                  </td>
                  <td>{c.campaignType === "flocage" ? "Flocage" : "Borne"}</td>
                  <td>{c.city}</td>
                  <td style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    {formatDateShort(c.startDate)} → {formatDateShort(c.endDate)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                        {progressPct}%
                      </span>
                      <div className="glass-progress" style={{ width: 60 }}>
                        <div style={{ width: progressPct + "%" }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {formatEur(c.budgetCents)}
                  </td>
                  <td>
                    <span className={`ent-chip ${STATUS_TONE[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link
                      href={`/enterprise/campagnes/${c.id}/edit`}
                      className="glass-btn ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: "var(--gray-500)",
                  }}
                >
                  {query || status !== "all"
                    ? "Aucune campagne ne correspond."
                    : "Aucune campagne. Créez votre première campagne."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
