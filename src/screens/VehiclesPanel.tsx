"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  type: string;
  isActive: boolean;
  inspection?: {
    expiresAt?: string;
    status: "valid" | "expiring" | "expired" | "missing";
    daysUntilExpiry?: number;
  };
  photos: { url: string; publicId: string }[];
  createdAt: string;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function inspectionLabel(insp: Vehicle["inspection"]) {
  if (!insp || insp.status === "missing") return "Non renseigné";
  if (insp.status === "expired")
    return `Expiré (${Math.abs(insp.daysUntilExpiry ?? 0)}j)`;
  if (insp.status === "expiring")
    return `Expire dans ${insp.daysUntilExpiry}j`;
  return `Valide (${insp.daysUntilExpiry}j)`;
}

function inspectionColor(insp: Vehicle["inspection"]) {
  if (!insp || insp.status === "missing") return "#6B7280";
  if (insp.status === "expired") return "#DC2626";
  if (insp.status === "expiring") return "#D97706";
  return "#16A34A";
}

export function VehiclesPanel({ driverId }: { driverId: string }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/drivers/${driverId}/vehicles`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ vehicles: Vehicle[] }>;
      })
      .then((d) => {
        if (!cancelled) setVehicles(d.vehicles);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [driverId]);

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ marginBottom: 16, fontSize: 14 }}>
        Véhicules ({vehicles.length})
      </h3>

      {loading ? (
        <div style={{ color: "var(--gray-500)", fontSize: 13 }}>Chargement…</div>
      ) : error ? (
        <div style={{ color: "#991B1B", fontSize: 13 }}>{error}</div>
      ) : vehicles.length === 0 ? (
        <div style={{ color: "var(--gray-500)", fontSize: 13 }}>
          Aucun véhicule enregistré.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {vehicles.map((v) => (
            <div
              key={v.id}
              style={{
                border: "1px solid var(--gray-200)",
                borderRadius: 10,
                overflow: "hidden",
                background: "var(--gray-50)",
              }}
            >
              <div
                style={{
                  height: 120,
                  background: v.photos[0]?.url
                    ? `center/cover url("${v.photos[0].url}")`
                    : "var(--navy-soft)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {!v.photos[0] && <Icon name="truck" size={32} />}
                {v.isActive && (
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      padding: "3px 10px",
                      borderRadius: 100,
                      background: "#DCFCE7",
                      color: "#166534",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                    }}
                  >
                    Active
                  </span>
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {v.make} {v.model}
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "var(--gray-600)",
                    marginTop: 2,
                  }}
                >
                  {v.licensePlate}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    fontSize: 11,
                    color: "var(--gray-500)",
                  }}
                >
                  <span>{v.type}</span>
                  <span>·</span>
                  <span>{v.year}</span>
                  <span>·</span>
                  <span>{v.photos.length} photo{v.photos.length !== 1 ? "s" : ""}</span>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: inspectionColor(v.inspection),
                    fontWeight: 600,
                  }}
                >
                  <Icon name="shield-check" size={12} />
                  {inspectionLabel(v.inspection)}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    color: "var(--gray-400)",
                  }}
                >
                  Ajouté {fmtDate(v.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
