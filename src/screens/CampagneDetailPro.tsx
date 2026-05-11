"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { StackedArea } from "@/components/charts";
import { useToast } from "@/contexts/ToastContext";
import { useSession } from "@/lib/auth-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "draft" | "upcoming" | "active" | "completed";
type CampaignType = "flocage" | "borne";

type CampaignDTO = {
  id: string;
  brand: string;
  domain: string;
  title: string;
  campaignType: CampaignType;
  budgetCents: number;
  city: string;
  startDate: string;
  endDate: string;
  status: Status;
  progress: number;
  kmDone: number;
  kmTotal: number;
  driversNeeded: number;
  driversAssigned: number;
  assignedDriverIds: string[];
  borne?: { count: number; targetImpressions: number; terminalIds?: string[] };
  assetIds?: string[];
  companyId: string;
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

const EVENT_LABEL: Record<EventDTO["type"], string> = {
  accept: "Chauffeur accepté",
  cancel: "Annulation",
  complete: "Campagne terminée",
  status_change: "Changement de statut",
};

type DetailTab = "overview" | "drivers" | "tracking" | "files" | "log";
type PerfPeriod = "7d" | "30d";

const STATUS_LABEL: Record<Status, string> = {
  draft: "Brouillon",
  upcoming: "À venir",
  active: "En cours",
  completed: "Terminée",
};
const STATUS_CHIP: Record<Status, string> = {
  draft: "chip-warn",
  upcoming: "chip-info",
  active: "chip-success",
  completed: "chip-outline",
};

// ─── Assign Modal ─────────────────────────────────────────────────────────────

interface AssignModalProps {
  campaignId: string;
  eligible: EligibleDriver[];
  busy: boolean;
  onClose: () => void;
  onAssign: (driverId: string) => Promise<void>;
}

function AssignModal({ eligible, busy, onClose, onAssign }: AssignModalProps) {
  const [q, setQ] = useState("");
  const filtered = eligible.filter((d) =>
    `${d.firstName} ${d.lastName} ${d.city}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <div className="backdrop" onClick={onClose} />
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
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Icon
              name="search"
              size={16}
              style={{ position: "absolute", left: 14, top: 14, color: "var(--gray-500)" }}
            />
            <input
              className="input"
              placeholder="Rechercher un chauffeur…"
              style={{ paddingLeft: 40 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div
            style={{
              border: "1px solid var(--gray-200)",
              borderRadius: 10,
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--gray-500)", fontSize: 13 }}>
                Aucun chauffeur disponible
              </div>
            )}
            {filtered.map((d) => (
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
                    {d.firstName[0]}{d.lastName[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.firstName} {d.lastName}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                      {d.city} · {d.campaignsDone} campagnes · ★{d.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary compact"
                  disabled={busy}
                  onClick={() => onAssign(d.id)}
                >
                  Assigner
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </>
  );
}

// ─── More Options Dropdown ────────────────────────────────────────────────────

interface MoreMenuProps {
  campaignId: string;
  status: Status;
  onDelete: () => void;
  onDuplicate: () => void;
}

function MoreMenu({ campaignId, status, onDelete, onDuplicate }: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="icon-btn"
        style={{ border: "1px solid var(--gray-200)" }}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="more-horizontal" size={18} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            background: "#fff",
            border: "1px solid var(--gray-200)",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            minWidth: 180,
            zIndex: 50,
          }}
        >
          <Link
            href={`/campagnes/${campaignId}/edit`}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 14, color: "inherit", textDecoration: "none" }}
            onClick={() => setOpen(false)}
          >
            <Icon name="edit" size={15} /> Modifier
          </Link>
          <button
            type="button"
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
              fontSize: 14, width: "100%", background: "none", border: "none",
              cursor: "pointer", color: "inherit", textAlign: "left",
            }}
            onClick={() => { setOpen(false); onDuplicate(); }}
          >
            <Icon name="copy" size={15} /> Dupliquer
          </button>
          {status === "draft" && (
            <button
              type="button"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                fontSize: 14, width: "100%", background: "none", border: "none",
                cursor: "pointer", color: "var(--danger)",
              }}
              onClick={() => { setOpen(false); onDelete(); }}
            >
              <Icon name="trash" size={15} /> Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CampagneDetailProProps {
  id: string;
}

export function CampagneDetailPro({ id }: CampagneDetailProProps) {
  const { pushToast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [campaign, setCampaign] = useState<CampaignDTO | null>(null);
  const [drivers, setDrivers] = useState<AssignedDriver[]>([]);
  const [eligible, setEligible] = useState<EligibleDriver[]>([]);
  const [perf, setPerf] = useState<PerfDTO | null>(null);
  const [assets, setAssets] = useState<AssetLite[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [assignOpen, setAssignOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [perfPeriod, setPerfPeriod] = useState<PerfPeriod>("30d");

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadCampaign = useCallback(async () => {
    const res = await fetch(`/api/me/campaigns/${id}`, { credentials: "include" });
    const body = (await res.json()) as { campaign?: CampaignDTO; error?: string };
    if (!res.ok) throw new Error(body.error ?? "Erreur chargement campagne");
    return body.campaign!;
  }, [id]);

  const loadDrivers = useCallback(async () => {
    const res = await fetch(`/api/me/campaigns/${id}/drivers`, { credentials: "include" });
    const body = (await res.json()) as { drivers?: AssignedDriver[]; error?: string };
    return body.drivers ?? [];
  }, [id]);

  const loadEligible = useCallback(async () => {
    const res = await fetch(`/api/me/campaigns/${id}/eligible-drivers`, { credentials: "include" });
    const body = (await res.json()) as { drivers?: EligibleDriver[]; error?: string };
    return body.drivers ?? [];
  }, [id]);

  const loadPerf = useCallback(async (period: PerfPeriod) => {
    const res = await fetch(`/api/me/campaigns/${id}/performance?period=${period}`, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as PerfDTO;
  }, [id]);

  const loadEvents = useCallback(async () => {
    const res = await fetch(`/api/me/campaigns/${id}/events`, { credentials: "include" });
    if (!res.ok) return [];
    const body = (await res.json()) as { events?: EventDTO[] };
    return body.events ?? [];
  }, [id]);

  const loadAssets = useCallback(async (camp: CampaignDTO) => {
    if (!camp.assetIds?.length) return [];
    const url = isAdmin
      ? `/api/me/assets?companyId=${camp.companyId}`
      : `/api/me/assets`;
    const res = await fetch(url, { credentials: "include" });
    const body = (await res.json()) as { assets?: AssetLite[] };
    const all = body.assets ?? [];
    const ids = new Set(camp.assetIds);
    return all.filter((a) => ids.has(a.id));
  }, [isAdmin]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const camp = await loadCampaign();
      setCampaign(camp);
      const [drvs, elig, prf, ass, evts] = await Promise.all([
        loadDrivers(),
        camp.campaignType === "flocage" ? loadEligible() : Promise.resolve([]),
        loadPerf(perfPeriod),
        loadAssets(camp),
        loadEvents(),
      ]);
      setDrivers(drvs);
      setEligible(elig);
      setPerf(prf);
      setAssets(ass);
      setEvents(evts);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadCampaign, loadDrivers, loadEligible, loadPerf, loadAssets, loadEvents, perfPeriod]);

  useEffect(() => { reload(); }, [id]);

  useEffect(() => {
    if (!campaign) return;
    loadPerf(perfPeriod).then(setPerf);
  }, [perfPeriod]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleAssign = async (driverId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/me/campaigns/${id}/drivers`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      const body = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(body.message ?? body.error ?? "Erreur assignation");
      pushToast({ kind: "success", title: "Chauffeur assigné", desc: "Le chauffeur a été ajouté à la campagne." });
      await reload();
    } catch (e) {
      pushToast({ kind: "danger", title: "Erreur", desc: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleUnassign = async (driverId: string) => {
    if (!confirm("Retirer ce chauffeur de la campagne ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/me/campaigns/${id}/drivers/${driverId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Erreur suppression");
      }
      pushToast({ kind: "success", title: "Chauffeur retiré", desc: "Le chauffeur a été retiré de la campagne." });
      await reload();
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
      const body = (await res.json()) as { campaign?: { id: string }; error?: string };
      if (!res.ok || !body.campaign) throw new Error(body.error ?? "Échec");
      pushToast({ kind: "success", title: "Campagne dupliquée", desc: "Brouillon créé." });
      router.push(`/campagnes/${body.campaign.id}`);
    } catch (e) {
      pushToast({ kind: "danger", title: "Erreur", desc: (e as Error).message });
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette campagne ? Cette action est irréversible.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/me/campaigns/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Erreur suppression");
      }
      pushToast({ kind: "success", title: "Campagne supprimée" });
      router.push("/campagnes");
    } catch (e) {
      pushToast({ kind: "danger", title: "Erreur", desc: (e as Error).message });
      setBusy(false);
    }
  };

  // ── Render guards ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="page">
        <div className="alert alert-danger">{error ?? "Campagne introuvable."}</div>
        <Link href="/campagnes" className="btn btn-secondary" style={{ marginTop: 12 }}>
          ← Retour aux campagnes
        </Link>
      </div>
    );
  }

  const isFlocage = campaign.campaignType === "flocage";
  const initials = campaign.brand.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const kmPct = campaign.kmTotal > 0 ? Math.round((campaign.kmDone / campaign.kmTotal) * 100) : 0;
  const budgetEur = (campaign.budgetCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const campaignAssets = assets;

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "var(--gray-500)", marginBottom: 12 }}>
        <Link href="/campagnes" style={{ color: "var(--gray-500)" }}>Campagnes</Link>{" "}
        <Icon name="chevron-right" size={12} />{" "}
        <span>{campaign.brand}</span>
      </div>

      {/* Header card */}
      <div className="card mb-6">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            className="brand-logo xl"
            style={{ background: campaign.brandColor ?? "#233466" }}
          >
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>{campaign.brand}</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span className="chip chip-navy-outline">
                <Icon name={isFlocage ? "car" : "spray-can"} size={12} />{" "}
                {isFlocage ? "Flocage" : "Borne"}
              </span>
              <span className="chip chip-outline">
                <Icon name="map-pin" size={12} /> {campaign.city}
              </span>
              <span className="chip chip-outline">
                <Icon name="calendar" size={12} />{" "}
                {new Date(campaign.startDate).toLocaleDateString("fr-FR")} –{" "}
                {new Date(campaign.endDate).toLocaleDateString("fr-FR")}
              </span>
              <span className={"chip " + STATUS_CHIP[campaign.status]}>
                {campaign.status === "active" && <span className="dot" />}
                {STATUS_LABEL[campaign.status]}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isFlocage && campaign.status !== "completed" && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => setAssignOpen(true)}
              >
                <Icon name="user-plus" size={16} /> Assigner un chauffeur
              </button>
            )}
            <MoreMenu
              campaignId={id}
              status={campaign.status}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(
          [
            ["overview", "Vue d'ensemble"],
            ["drivers", `Chauffeurs (${drivers.length})`],
            ["tracking", "Suivi"],
            ["files", `Fichiers (${campaignAssets.length})`],
            ["log", `Historique (${events.length})`],
          ] as const
        ).map(([k, l]) => (
          <div
            key={k}
            className={"tab" + (tab === k ? " active" : "")}
            onClick={() => setTab(k)}
          >
            {l}
          </div>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="grid grid-12">
          <div className="col-4">
            <div className="card" style={{ textAlign: "center" }}>
              <h3 className="card-title" style={{ textAlign: "left", marginBottom: 24 }}>
                Progression globale
              </h3>
              <div className="radial-wrap">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="76" stroke="#EEF1F8" strokeWidth="16" fill="none" />
                  <circle
                    cx="90" cy="90" r="76"
                    stroke="#233466" strokeWidth="16" fill="none"
                    strokeDasharray={Math.PI * 2 * 76}
                    strokeDashoffset={(1 - campaign.progress / 100) * Math.PI * 2 * 76}
                    strokeLinecap="round"
                    transform="rotate(-90 90 90)"
                  />
                </svg>
                <div className="center">
                  <div className="big num">{campaign.progress}%</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>complétude</div>
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: "var(--gray-500)" }}>
                Taux de remplissage : {perf?.fillRatePct ?? 0}%
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="card">
              <h3 className="card-title">{isFlocage ? "Kilométrage" : "Impressions"}</h3>
              {isFlocage ? (
                <>
                  <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", margin: "12px 0 4px" }}>
                    {campaign.kmDone.toLocaleString("fr-FR")} km
                  </div>
                  <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 16 }}>
                    sur {campaign.kmTotal.toLocaleString("fr-FR")} km objectif
                  </div>
                  <div className="progress" style={{ marginBottom: 12 }}>
                    <div className="progress-fill" style={{ width: kmPct + "%" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--gray-500)" }}>
                    <span>{campaign.driversAssigned} chauffeur{campaign.driversAssigned !== 1 ? "s" : ""} assigné{campaign.driversAssigned !== 1 ? "s" : ""}</span>
                    <span>{campaign.driversNeeded} nécessaire{campaign.driversNeeded !== 1 ? "s" : ""}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", margin: "12px 0 4px" }}>
                    {(perf?.kpis.impressionsTotal ?? 0).toLocaleString("fr-FR")}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 16 }}>
                    impressions · {perf?.kpis.reachTerminals ?? 0} bornes actives
                  </div>
                  <div className="progress" style={{ marginBottom: 12 }}>
                    <div className="progress-fill" style={{ width: (perf?.budgetConsumedPct ?? 0) + "%" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    {perf?.budgetConsumedPct ?? 0}% de l&apos;objectif atteint
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-4">
            <div className="card">
              <h3 className="card-title">Budget & ROI</h3>
              <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em", margin: "12px 0 4px" }}>
                {budgetEur}
              </div>
              <div style={{ fontSize: 13, color: "var(--gray-500)", marginBottom: 16 }}>budget total</div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  ["Impressions est.", (perf?.kpis.impressionsTotal ?? 0).toLocaleString("fr-FR")],
                  ["Bornes / Chauffeurs", isFlocage ? `${campaign.driversAssigned} chauffeurs` : `${perf?.kpis.reachTerminals ?? 0} bornes`],
                  ["Consommé", `${perf?.budgetConsumedPct ?? 0}%`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ color: "var(--gray-500)" }}>{l}</span>
                    <span className="num fw-600">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Évolution quotidienne</h3>
                <div className="segmented">
                  {(["7d", "30d"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={perfPeriod === p ? "active" : ""}
                      onClick={() => setPerfPeriod(p)}
                    >
                      {p === "7d" ? "7 j" : "30 j"}
                    </button>
                  ))}
                </div>
              </div>
              <StackedArea />
            </div>
          </div>
        </div>
      )}

      {/* ── Drivers ── */}
      {tab === "drivers" && (
        <div className="card card-flush">
          {drivers.length === 0 ? (
            <div className="empty" style={{ padding: 48 }}>
              <div className="empty-icon"><Icon name="users" size={24} /></div>
              <h3>Aucun chauffeur assigné</h3>
              <p>Utilisez le bouton &ldquo;Assigner un chauffeur&rdquo; pour ajouter des chauffeurs.</p>
              {isFlocage && campaign.status !== "completed" && (
                <button type="button" className="btn btn-primary" onClick={() => setAssignOpen(true)}>
                  <Icon name="user-plus" size={16} /> Assigner un chauffeur
                </button>
              )}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Chauffeur</th>
                  <th>Ville</th>
                  <th>Campagnes</th>
                  <th>Note</th>
                  <th>Km totaux</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="avatar-initials" style={{ width: 32, height: 32, fontSize: 11 }}>
                          {d.firstName[0]}{d.lastName[0]}
                        </div>
                        <div style={{ fontWeight: 600 }}>{d.firstName} {d.lastName}</div>
                      </div>
                    </td>
                    <td style={{ color: "var(--gray-500)" }}>{d.city}</td>
                    <td>{d.campaignsDone}</td>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon name="star" size={13} style={{ color: "#F59E0B" }} />
                        {d.rating.toFixed(1)}
                      </span>
                    </td>
                    <td>{d.totalKm.toLocaleString("fr-FR")} km</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="icon-btn btn-danger-ghost"
                        disabled={busy}
                        onClick={() => handleUnassign(d.id)}
                      >
                        <Icon name="x" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Tracking ── */}
      {tab === "tracking" && (
        <div className="grid grid-12">
          <div className="col-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Statistiques</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: 8 }}>
                {(
                  [
                    ["Impressions totales", (perf?.kpis.impressionsTotal ?? 0).toLocaleString("fr-FR"), "eye"],
                    ["Bornes actives", perf?.kpis.reachTerminals ?? 0, "monitor"],
                    ["Km parcourus", `${(perf?.kpis.kmTotal ?? 0).toLocaleString("fr-FR")} km`, "map"],
                    ["Jours actifs", perf?.kpis.campaignDays ?? 0, "calendar"],
                  ] as const
                ).map(([label, value, icon]) => (
                  <div key={label} style={{ padding: 16, background: "var(--gray-50)", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--gray-500)", fontSize: 13 }}>
                      <Icon name={icon} size={14} /> {label}
                    </div>
                    <div className="num" style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-4">
            <div className="card card-flush" style={{ overflow: "hidden" }}>
              <div className="map-placeholder" style={{ height: 280, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "var(--gray-400)" }}>
                  <Icon name="map" size={32} />
                  <span style={{ fontSize: 13 }}>Carte GPS non disponible</span>
                </div>
              </div>
              <div style={{ padding: 16, borderTop: "1px solid var(--gray-200)" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{campaign.driversAssigned} véhicule{campaign.driversAssigned !== 1 ? "s" : ""} assigné{campaign.driversAssigned !== 1 ? "s" : ""}</div>
                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>Suivi GPS en temps réel à venir</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Files ── */}
      {tab === "files" && (
        <div>
          {campaignAssets.length === 0 ? (
            <div className="card">
              <div className="empty" style={{ padding: 48 }}>
                <div className="empty-icon"><Icon name="image" size={24} /></div>
                <h3>Aucun asset lié</h3>
                <p>Les assets sont gérés depuis la bibliothèque de l&apos;annonceur.</p>
                {!isAdmin && (
                  <Link href="/enterprise/assets" className="btn btn-secondary">
                    Aller à la bibliothèque
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-12" style={{ gap: 16 }}>
              {campaignAssets.map((a) => (
                <div key={a.id} className="col-3 card" style={{ padding: 16 }}>
                  <div
                    className="placeholder-img"
                    style={{ height: 120, marginBottom: 12, overflow: "hidden", borderRadius: 8, background: "var(--gray-100)" }}
                  >
                    {a.file.resourceType === "image" ? (
                      <img src={a.file.url} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--gray-400)" }}>
                        <Icon name="file-text" size={32} />
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13 }} className="truncate">{a.name}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>{a.type}</div>
                  <a
                    href={a.file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost compact"
                    style={{ marginTop: 10, width: "100%", textAlign: "center" }}
                  >
                    <Icon name="external-link" size={13} /> Voir
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Log ── */}
      {tab === "log" && (
        <div className="card card-flush">
          {events.length === 0 ? (
            <div className="empty" style={{ padding: 48 }}>
              <div className="empty-icon"><Icon name="clock" size={24} /></div>
              <h3>Aucun événement</h3>
              <p>Aucun événement enregistré pour cette campagne.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Horodatage</th>
                  <th>Type</th>
                  <th>Chauffeur</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td style={{ color: "var(--gray-500)" }}>{new Date(e.at).toLocaleString("fr-FR")}</td>
                    <td>{EVENT_LABEL[e.type]}</td>
                    <td>{e.driverName ?? "—"}</td>
                    <td style={{ color: "var(--gray-500)", fontSize: 12 }}>
                      {e.meta && Object.keys(e.meta).length > 0
                        ? Object.entries(e.meta).map(([k, v]) => `${k}: ${String(v)}`).join(", ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {assignOpen && (
        <AssignModal
          campaignId={id}
          eligible={eligible}
          busy={busy}
          onClose={() => setAssignOpen(false)}
          onAssign={async (driverId) => {
            await handleAssign(driverId);
            if (eligible.length <= 1) setAssignOpen(false);
          }}
        />
      )}
    </div>
  );
}
