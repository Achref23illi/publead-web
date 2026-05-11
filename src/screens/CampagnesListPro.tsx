"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { type Campaign } from "@/lib/data";
import { type CampaignDTO } from "@/lib/campaign-serializer";
import { CampaignsTable } from "@/screens/DashboardPro";
import { useSession } from "@/lib/auth-client";

type TypeFilter = "tous" | "flocage" | "borne";
type StatusFilter = "tous" | "draft" | "upcoming" | "active" | "completed";

function dtoToCampaign(dto: CampaignDTO): Campaign {
  const initials = dto.brand
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 3)
    .join("")
    .toUpperCase();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return {
    id: dto.id,
    brand: dto.brand,
    color: dto.brandColor ?? "#233466",
    initials,
    company: dto.domain || dto.brand,
    type: dto.campaignType === "borne" ? "Borne" : "Flocage",
    city: dto.city,
    period: `${fmt(dto.startDate)} → ${fmt(dto.endDate)}`,
    drivers: [dto.driversAssigned, dto.driversNeeded],
    km: [dto.kmDone ?? null, dto.kmTotal ?? null],
    rev: `${(dto.budgetCents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`,
    status: dto.status === "completed" ? "completed" : dto.status === "active" ? "active" : "draft",
    progress: dto.progress,
  };
}

export function CampagnesListPro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverId = searchParams.get("driverId");
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [dtos, setDtos] = useState<CampaignDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("tous");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("tous");

  useEffect(() => {
    if (!session) return; // wait for session before deciding which API to call
    setLoading(true);
    let endpoint: string;
    if (isAdmin) {
      const url = new URL("/api/admin/campaigns", window.location.origin);
      if (driverId) url.searchParams.set("driverId", driverId);
      endpoint = url.toString();
    } else {
      endpoint = "/api/me/campaigns";
    }
    fetch(endpoint, { credentials: "include" })
      .then((r) => r.json())
      .then((body: { campaigns?: CampaignDTO[] }) => setDtos(body.campaigns ?? []))
      .catch(() => setDtos([]))
      .finally(() => setLoading(false));
  }, [driverId, session, isAdmin]);

  const rows = dtos
    .filter((d) => typeFilter === "tous" || d.campaignType === typeFilter)
    .filter((d) => statusFilter === "tous" || d.status === statusFilter)
    .map(dtoToCampaign);

  // ── KPI cards ──────────────────────────────────────────────────────────────
  const active = dtos.filter((d) => d.status === "active").length;
  const upcoming = dtos.filter((d) => d.status === "upcoming").length;
  const completed = dtos.filter((d) => d.status === "completed").length;
  const totalDriversAssigned = dtos
    .filter((d) => d.status === "active" || d.status === "upcoming")
    .reduce((s, d) => s + d.driversAssigned, 0);
  const totalDriversNeeded = dtos
    .filter((d) => d.status === "active" || d.status === "upcoming")
    .reduce((s, d) => s + d.driversNeeded, 0);
  const fillRate =
    totalDriversNeeded > 0
      ? Math.round((totalDriversAssigned / totalDriversNeeded) * 100)
      : 0;

  const kpis = [
    { l: "Actives", v: String(active), s: `${upcoming} à venir` },
    { l: "Terminées", v: String(completed), s: "ce mois et avant" },
    { l: "Total", v: String(dtos.length), s: "toutes périodes" },
    { l: "Taux de remplissage", v: `${fillRate} %`, s: "chauffeurs / objectif" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Campagnes</h1>
          <p className="subtitle">
            {driverId
              ? `Campagnes du chauffeur ${driverId}${loading ? " · chargement…" : ""}`
              : loading
              ? "Chargement…"
              : `${dtos.length} campagne${dtos.length !== 1 ? "s" : ""} au total`}
          </p>
        </div>
        {driverId ? (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => router.push("/campagnes")}
          >
            <Icon name="x" size={16} /> Retirer le filtre
          </button>
        ) : (
          <Link href="/campagnes/new" className="btn btn-primary">
            <Icon name="plus" size={18} /> Nouvelle campagne
          </Link>
        )}
      </div>

      <div className="grid grid-12 mb-6" style={{ gap: 16 }}>
        {kpis.map((t) => (
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
              {loading ? "—" : t.v}
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
            className={"chip " + (typeFilter === k ? "chip-filled-navy" : "chip-outline")}
            onClick={() => setTypeFilter(k)}
          >
            {l !== "Tous" && <Icon name={l === "Flocage" ? "car" : "spray-can"} size={12} />} {l}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        {(
          [
            ["tous", "Tous statuts"],
            ["draft", "Brouillon"],
            ["upcoming", "À venir"],
            ["active", "Actif"],
            ["completed", "Terminé"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            className={"chip " + (statusFilter === k ? "chip-filled-navy" : "chip-outline")}
            onClick={() => setStatusFilter(k)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="card card-flush">
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div className="spinner" />
          </div>
        ) : rows.length === 0 ? (
          <div className="empty" style={{ padding: 48 }}>
            <div className="empty-icon"><Icon name="megaphone" size={24} /></div>
            <h3>Aucune campagne</h3>
            <p>Aucun résultat pour ces filtres.</p>
          </div>
        ) : (
          <CampaignsTable rows={rows} onOpen={(r) => router.push("/campagnes/" + r.id)} />
        )}
      </div>
    </div>
  );
}
