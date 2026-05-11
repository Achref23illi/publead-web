"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { type CampaignDTO } from "@/lib/campaign-serializer";
import { useSession } from "@/lib/auth-client";

type TypeFilter = "tous" | "flocage" | "borne";

export function CampagnesListGlass() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [type, setType] = useState<TypeFilter>("tous");
  const [dtos, setDtos] = useState<CampaignDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const endpoint = isAdmin ? "/api/admin/campaigns" : "/api/me/campaigns";
    fetch(endpoint, { credentials: "include" })
      .then((r) => r.json())
      .then((b: { campaigns?: CampaignDTO[] }) => setDtos(b.campaigns ?? []))
      .catch(() => setDtos([]))
      .finally(() => setLoading(false));
  }, [session, isAdmin]);

  const rows = dtos.filter((d) =>
    type === "tous" ? true : d.campaignType === type,
  );

  const fmtPeriod = (a: string, b: string) => {
    const fa = new Date(a).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const fb = new Date(b).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return `${fa} → ${fb}`;
  };

  const initialsOf = (s: string) =>
    s
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>Campagnes</h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            {loading ? "Chargement…" : `${dtos.length} campagne${dtos.length !== 1 ? "s" : ""} au total.`}
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
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div className="spinner" />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--gray-500)" }}>
            <Icon name="megaphone" size={24} />
            <p style={{ marginTop: 12 }}>Aucune campagne.</p>
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Campagne</th>
                <th>Entreprise</th>
                <th>Type</th>
                <th>Ville</th>
                <th>Période</th>
                <th style={{ textAlign: "right" }}>Progression</th>
                <th style={{ textAlign: "right" }}>Budget</th>
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
                        style={{
                          background: c.brandColor ?? "#233466",
                          width: 32,
                          height: 32,
                          fontSize: 12,
                        }}
                      >
                        {initialsOf(c.brand)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{c.brand}</span>
                    </div>
                  </td>
                  <td>{c.domain || c.brand}</td>
                  <td>{c.campaignType === "borne" ? "Borne" : "Flocage"}</td>
                  <td>{c.city}</td>
                  <td style={{ color: "var(--gray-500)" }}>{fmtPeriod(c.startDate, c.endDate)}</td>
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
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {(c.budgetCents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
