"use client";

/**
 * CampagneDetailGlass — rond/vitré campaign detail.
 * Fully wired to /api/me/campaigns/[id] + sub-endpoints (admin bypass via session role).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { StackedArea } from "@/components/charts";
import { useToast } from "@/contexts/ToastContext";
import { useSession } from "@/lib/auth-client";

interface Props {
  id: string;
}

type Tab = "overview" | "drivers" | "tracking" | "files" | "log";

// ── DTOs ────────────────────────────────────────────────────────────────────

type Status = "draft" | "upcoming" | "active" | "completed";
type CampaignType = "flocage" | "borne";

type CampaignDTO = {
  id: string;
  companyId: string;
  brand: string;
  domain: string;
  title: string;
  description: string;
  campaignType: CampaignType;
  budgetCents: number;
  city: string;
  zones: string[];
  startDate: string;
  endDate: string;
  durationDays: number;
  status: Status;
  progress: number;
  kmDone: number;
  kmTotal: number;
  driversNeeded: number;
  driversAssigned: number;
  assignedDriverIds: string[];
  borne?: { count: number; targetImpressions: number; terminalIds?: string[] };
  assetIds?: string[];
  brandColor?: string;
};

type AssignedDriver = {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  rating: number;
  campaignsDone: number;
  totalKm: number;
};

type EligibleDriver = AssignedDriver;

type PerfDTO = {
  kpis: { impressionsTotal: number; reachTerminals: number; kmTotal: number; campaignDays: number };
  impressionsTimeline: number[];
  fillRatePct: number;
  budgetCents: number;
  budgetConsumedPct: number;
};

type AssetLite = {
  id: string;
  name: string;
  type: string;
  file: { url: string; resourceType: "image" | "video" | "raw" };
};

type EventDTO = {
  id: string;
  type: "accept" | "cancel" | "complete" | "status_change";
  at: string;
  driverName?: string;
  meta?: Record<string, unknown>;
};

const STATUS_LABEL: Record<Status, string> = {
  draft: "Brouillon",
  upcoming: "À venir",
  active: "Active",
  completed: "Terminée",
};
const STATUS_TONE: Record<Status, string> = {
  draft: "outline",
  upcoming: "info",
  active: "success",
  completed: "info",
};

const EVENT_LABEL: Record<EventDTO["type"], string> = {
  accept: "Chauffeur accepté",
  cancel: "Annulation",
  complete: "Campagne terminée",
  status_change: "Changement de statut",
};

// ── Component ──────────────────────────────────────────────────────────────

export function CampagneDetailGlass({ id }: Props) {
  const router = useRouter();
  const { pushToast } = useToast();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [tab, setTab] = useState<Tab>("overview");
  const [campaign, setCampaign] = useState<CampaignDTO | null>(null);
  const [drivers, setDrivers] = useState<AssignedDriver[]>([]);
  const [eligible, setEligible] = useState<EligibleDriver[]>([]);
  const [perf, setPerf] = useState<PerfDTO | null>(null);
  const [assets, setAssets] = useState<AssetLite[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  // ── Data loaders ─────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cRes = await fetch(`/api/me/campaigns/${id}`, { credentials: "include" });
      const cBody = (await cRes.json()) as { campaign?: CampaignDTO; error?: string };
      if (!cRes.ok) throw new Error(cBody.error ?? "Erreur chargement");
      const camp = cBody.campaign!;
      setCampaign(camp);

      const [dRes, eRes, pRes, evRes, aRes] = await Promise.all([
        fetch(`/api/me/campaigns/${id}/drivers`, { credentials: "include" }),
        camp.campaignType === "flocage"
          ? fetch(`/api/me/campaigns/${id}/eligible-drivers`, { credentials: "include" })
          : Promise.resolve(null),
        fetch(`/api/me/campaigns/${id}/performance?period=30d`, { credentials: "include" }),
        fetch(`/api/me/campaigns/${id}/events`, { credentials: "include" }),
        camp.assetIds && camp.assetIds.length > 0
          ? fetch(
              isAdmin
                ? `/api/me/assets?companyId=${camp.companyId}`
                : `/api/me/assets`,
              { credentials: "include" },
            )
          : Promise.resolve(null),
      ]);

      const dBody = (await dRes.json()) as { drivers?: AssignedDriver[] };
      setDrivers(dBody.drivers ?? []);

      if (eRes) {
        const eBody = (await eRes.json()) as { drivers?: EligibleDriver[] };
        setEligible(eBody.drivers ?? []);
      } else {
        setEligible([]);
      }

      if (pRes.ok) {
        setPerf((await pRes.json()) as PerfDTO);
      } else {
        setPerf(null);
      }

      const evBody = (await evRes.json()) as { events?: EventDTO[] };
      setEvents(evBody.events ?? []);

      if (aRes) {
        const aBody = (await aRes.json()) as { assets?: AssetLite[] };
        const ids = new Set(camp.assetIds ?? []);
        setAssets((aBody.assets ?? []).filter((a) => ids.has(a.id)));
      } else {
        setAssets([]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleAssign = async (driverId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/me/campaigns/${id}/drivers`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      const b = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(b.message ?? b.error ?? "Échec");
      pushToast({ kind: "success", title: "Chauffeur assigné" });
      await loadAll();
    } catch (e) {
      pushToast({ kind: "danger", title: "Erreur", desc: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleUnassign = async (driverId: string) => {
    if (!confirm("Retirer ce chauffeur ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/me/campaigns/${id}/drivers/${driverId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const b = (await res.json()) as { error?: string };
        throw new Error(b.error ?? "Échec");
      }
      pushToast({ kind: "success", title: "Chauffeur retiré" });
      await loadAll();
    } catch (e) {
      pushToast({ kind: "danger", title: "Erreur", desc: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/me/campaigns/${id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      const b = (await res.json()) as { campaign?: { id: string }; error?: string };
      if (!res.ok || !b.campaign) throw new Error(b.error ?? "Échec");
      pushToast({ kind: "success", title: "Campagne dupliquée", desc: "Brouillon créé." });
      router.push(`/campagnes/${b.campaign.id}`);
    } catch (e) {
      pushToast({ kind: "danger", title: "Erreur", desc: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = () => loadAll();

  const handleExportLog = () => {
    if (events.length === 0) return;
    const rows = [
      ["date", "type", "chauffeur", "meta"],
      ...events.map((e) => [
        e.at,
        e.type,
        e.driverName ?? "",
        e.meta ? JSON.stringify(e.meta) : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campagne-${id}-historique.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render guards ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="glass-page" style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="glass-page">
        <div className="alert alert-danger">{error ?? "Campagne introuvable."}</div>
        <Link href="/campagnes" className="glass-btn ghost" style={{ marginTop: 12 }}>
          ← Retour
        </Link>
      </div>
    );
  }

  const initials = campaign.brand
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const isFlocage = campaign.campaignType === "flocage";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const period = `${fmt(campaign.startDate)} → ${fmt(campaign.endDate)}`;
  const budgetEur = (campaign.budgetCents / 100).toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  });
  const today = new Date();
  const end = new Date(campaign.endDate);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / 86_400_000));

  return (
    <div className="glass-page">
      <div className="glass-crumb">
        <Link href="/campagnes">Campagnes</Link>
        <Icon name="chevron-right" size={12} />
        <span>{campaign.brand}</span>
      </div>

      <div className="glass-pagehead">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            className="brand-logo"
            style={{
              background: campaign.brandColor ?? "#233466",
              width: 56,
              height: 56,
              fontSize: 22,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
                {campaign.brand}
              </h1>
              <span className={"g-chip " + STATUS_TONE[campaign.status]}>
                <span className="dot" />
                {STATUS_LABEL[campaign.status]}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
              {campaign.title} · {period} · {campaign.city}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="glass-btn ghost"
            disabled={busy}
            onClick={handleDuplicate}
          >
            <Icon name="copy" size={14} /> Dupliquer
          </button>
          {isFlocage && campaign.status !== "completed" && (
            <button
              type="button"
              className="glass-btn"
              disabled={busy}
              onClick={() => setShowAssign(true)}
            >
              <Icon name="user-plus" size={14} /> Assigner un chauffeur
            </button>
          )}
        </div>
      </div>

      <div className="glass-tabs" style={{ marginBottom: 20 }}>
        {(
          [
            ["overview", "Vue d'ensemble"],
            ["drivers", "Chauffeurs"],
            ["tracking", "Suivi"],
            ["files", "Fichiers"],
            ["log", "Historique"],
          ] as const
        ).map(([k, l]) => (
          <div
            key={k}
            className={"t" + (tab === k ? " active" : "")}
            onClick={() => setTab(k)}
          >
            {l}
            {k === "drivers" && <span className="count">{drivers.length}</span>}
            {k === "files" && <span className="count">{assets.length}</span>}
            {k === "log" && <span className="count">{events.length}</span>}
          </div>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div>
          <div className="glass-kpigrid" style={{ marginBottom: 20 }}>
            <div className="glass-kpi">
              <div className="label">Progression</div>
              <div className="value">{campaign.progress} %</div>
              <div className="sub">
                {campaign.kmDone.toLocaleString("fr-FR")} / {campaign.kmTotal.toLocaleString("fr-FR")} km
              </div>
            </div>
            <div className="glass-kpi">
              <div className="label">Budget</div>
              <div className="value">{budgetEur} €</div>
              <div className="sub">{perf?.budgetConsumedPct ?? 0}% consommé</div>
            </div>
            <div className="glass-kpi">
              <div className="label">Chauffeurs assignés</div>
              <div className="value">{campaign.driversAssigned}</div>
              <div className="sub">sur {campaign.driversNeeded} nécessaires</div>
            </div>
            <div className="glass-kpi">
              <div className="label">Jours restants</div>
              <div className="value">{daysLeft}</div>
              <div className="sub">Fin : {fmt(campaign.endDate)}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="glass-panel" style={{ padding: 20 }}>
                <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 14 }}>Brief & Objectif</h3>
                  <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    {campaign.campaignType === "flocage" ? "Flocage" : "Borne"} · {campaign.durationDays}j
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--gray-600)" }}>
                  {campaign.description}
                </p>
                {campaign.zones.length > 0 && (
                  <div className="glass-chip-row" style={{ marginTop: 14 }}>
                    {campaign.zones.map((z) => (
                      <span key={z} className="g-chip outline">
                        <Icon name="map-pin" size={11} /> {z}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: 20 }}>
                <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 14 }}>Performance</h3>
                </div>
                <div className="glass-stat-grid">
                  <div className="glass-stat">
                    <div className="stat-label">Impressions</div>
                    <div className="stat-val">
                      {(perf?.kpis.impressionsTotal ?? 0).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  <div className="glass-stat">
                    <div className="stat-label">Bornes</div>
                    <div className="stat-val">{perf?.kpis.reachTerminals ?? 0}</div>
                  </div>
                  <div className="glass-stat">
                    <div className="stat-label">Taux remplissage</div>
                    <div className="stat-val">{perf?.fillRatePct ?? 0}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="glass-panel" style={{ padding: 20 }}>
                <div className="glass-panelhead" style={{ padding: 0, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 14 }}>Évolution — 30 derniers jours</h3>
                </div>
                <StackedArea />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DRIVERS ── */}
      {tab === "drivers" && (
        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14 }}>Chauffeurs assignés</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                {drivers.length} chauffeur{drivers.length !== 1 ? "s" : ""} sur {campaign.driversNeeded} nécessaire{campaign.driversNeeded !== 1 ? "s" : ""}
              </p>
            </div>
            {isFlocage && campaign.status !== "completed" && (
              <button
                type="button"
                className="glass-btn compact"
                disabled={busy}
                onClick={() => setShowAssign(true)}
              >
                <Icon name="user-plus" size={14} /> Ajouter
              </button>
            )}
          </div>

          {drivers.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--gray-500)" }}>
              <Icon name="users" size={24} />
              <p style={{ marginTop: 8 }}>Aucun chauffeur assigné.</p>
            </div>
          ) : (
            <div className="glass-cardgrid">
              {drivers.map((d) => {
                const ini = `${d.firstName[0]}${d.lastName[0]}`.toUpperCase();
                return (
                  <div key={d.id} className="glass-tile">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          className="brand-logo"
                          style={{
                            background: "var(--navy)",
                            color: "#fff",
                            width: 42,
                            height: 42,
                            fontSize: 14,
                          }}
                        >
                          {ini}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {d.firstName} {d.lastName}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{d.city}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="glass-btn ghost compact"
                        title="Retirer"
                        disabled={busy}
                        onClick={() => handleUnassign(d.id)}
                      >
                        <Icon name="x" size={13} />
                      </button>
                    </div>
                    <div className="glass-stat-grid" style={{ marginTop: 0, paddingTop: 12 }}>
                      <div className="glass-stat">
                        <div className="stat-label">Km</div>
                        <div className="stat-val" style={{ fontSize: 18 }}>
                          {(d.totalKm / 1000).toFixed(1)}k
                        </div>
                      </div>
                      <div className="glass-stat">
                        <div className="stat-label">Note</div>
                        <div
                          className="stat-val"
                          style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <Icon name="star" size={14} style={{ color: "#F59E0B" }} />
                          {d.rating.toFixed(1)}
                        </div>
                      </div>
                      <div className="glass-stat">
                        <div className="stat-label">Camp.</div>
                        <div className="stat-val" style={{ fontSize: 18 }}>
                          {d.campaignsDone}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TRACKING ── */}
      {tab === "tracking" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
          <div className="glass-mapwrap">
            <div className="glass-panelhead" style={{ padding: "2px 4px 12px", border: "none" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14 }}>Position en temps réel</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                  {campaign.city} — suivi {campaign.campaignType === "flocage" ? "véhicules" : "bornes"}
                </p>
              </div>
              <span className="g-chip outline">
                <span className="dot" /> Bientôt disponible
              </span>
            </div>
            <div
              className="glass-map"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gray-400)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Icon name="map" size={32} />
                <div style={{ marginTop: 8, fontSize: 13 }}>Suivi GPS en temps réel à venir.</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="glass-panel" style={{ padding: 20 }}>
              <div className="glass-panelhead" style={{ padding: 0, marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>Statistiques</h3>
                <button
                  type="button"
                  className="glass-btn ghost compact"
                  title="Rafraîchir"
                  onClick={handleRefresh}
                  disabled={busy}
                >
                  <Icon name="refresh" size={13} />
                </button>
              </div>
              <div
                className="glass-stat-grid"
                style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}
              >
                <div className="glass-stat">
                  <div className="stat-label">Km parcourus</div>
                  <div className="stat-val">{(perf?.kpis.kmTotal ?? campaign.kmDone).toLocaleString("fr-FR")}</div>
                </div>
                <div className="glass-stat">
                  <div className="stat-label">Impressions</div>
                  <div className="stat-val">{(perf?.kpis.impressionsTotal ?? 0).toLocaleString("fr-FR")}</div>
                </div>
                <div className="glass-stat">
                  <div className="stat-label">Jours actifs</div>
                  <div className="stat-val">{perf?.kpis.campaignDays ?? 0}</div>
                </div>
              </div>
              <div className="glass-chip-row" style={{ marginTop: 14 }}>
                <span className="g-chip outline">
                  <Icon name="map-pin" size={11} /> {campaign.zones.length} zone{campaign.zones.length !== 1 ? "s" : ""}
                </span>
                <span className="g-chip outline">
                  <Icon name="clock" size={11} /> {campaign.durationDays}j
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FILES ── */}
      {tab === "files" && (
        <div className="glass-panel" style={{ padding: 20 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14 }}>Fichiers liés</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                {assets.length} asset{assets.length !== 1 ? "s" : ""} de la bibliothèque
              </p>
            </div>
            {!isAdmin && (
              <Link href="/enterprise/assets" className="glass-btn compact">
                <Icon name="upload-cloud" size={14} /> Bibliothèque
              </Link>
            )}
          </div>

          {assets.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--gray-500)" }}>
              <Icon name="image" size={24} />
              <p style={{ marginTop: 8 }}>Aucun asset lié à cette campagne.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {assets.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    borderRadius: 14,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background:
                        f.file.resourceType === "image"
                          ? "rgba(236, 72, 153, 0.12)"
                          : "rgba(35,52,102,0.08)",
                      color: f.file.resourceType === "image" ? "#BE185D" : "var(--navy)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {f.file.resourceType === "image" ? (
                      <img
                        src={f.file.url}
                        alt={f.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Icon name="file-text" size={18} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: "var(--gray-500)", marginTop: 2 }}>
                      {f.type} · {f.file.resourceType}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <a
                      href={f.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-btn ghost compact"
                      title="Aperçu"
                    >
                      <Icon name="eye" size={13} />
                    </a>
                    <a
                      href={f.file.url}
                      download
                      className="glass-btn ghost compact"
                      title="Télécharger"
                    >
                      <Icon name="download" size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LOG ── */}
      {tab === "log" && (
        <div className="glass-panel" style={{ padding: 28 }}>
          <div className="glass-panelhead" style={{ padding: 0, marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14 }}>Historique des événements</h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                {events.length} événement{events.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              type="button"
              className="glass-btn ghost compact"
              onClick={handleExportLog}
              disabled={events.length === 0}
            >
              <Icon name="download" size={13} /> Exporter CSV
            </button>
          </div>

          {events.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--gray-500)" }}>
              <Icon name="clock" size={24} />
              <p style={{ marginTop: 8 }}>Aucun événement enregistré pour cette campagne.</p>
            </div>
          ) : (
            <div className="glass-timeline">
              {events.map((e) => (
                <div key={e.id} className="ev">
                  <div className="time">{new Date(e.at).toLocaleString("fr-FR")}</div>
                  <div className="what">
                    <strong>{EVENT_LABEL[e.type]}</strong>
                    {e.driverName ? ` — ${e.driverName}` : ""}
                    {e.meta && typeof e.meta === "object" && Object.keys(e.meta).length > 0 ? (
                      <span style={{ color: "var(--gray-500)", marginLeft: 6 }}>
                        ({Object.entries(e.meta).map(([k, v]) => `${k}: ${String(v)}`).join(", ")})
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ASSIGN MODAL ── */}
      {showAssign && (
        <>
          <div className="backdrop" onClick={() => setShowAssign(false)} />
          <div className="modal modal-lg">
            <div
              className="modal-header"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <h3>Assigner un chauffeur</h3>
              <div style={{ fontSize: 13, color: "var(--gray-500)" }}>
                {eligible.length} disponible{eligible.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="modal-body">
              <div
                style={{
                  border: "1px solid var(--gray-200)",
                  borderRadius: 10,
                  maxHeight: 320,
                  overflowY: "auto",
                }}
              >
                {eligible.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--gray-500)", fontSize: 13 }}>
                    Aucun chauffeur disponible dans {campaign.city}.
                  </div>
                ) : (
                  eligible.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--gray-100)",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="avatar-initials" style={{ width: 36, height: 36 }}>
                          {d.firstName[0]}
                          {d.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {d.firstName} {d.lastName}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                            {d.city} · {d.campaignsDone} campagnes · ★{d.rating.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="glass-btn compact"
                        disabled={busy}
                        onClick={() => handleAssign(d.id)}
                      >
                        Assigner
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="glass-btn ghost" onClick={() => setShowAssign(false)}>
                Fermer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
