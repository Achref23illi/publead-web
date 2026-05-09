"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";
import type { PlatformSettingsDTO } from "@/lib/platform-settings-service";

function eurFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function centsFromEur(s: string): number {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function PlatformSettingsAdmin() {
  const { pushToast } = useToast();
  const [data, setData] = useState<PlatformSettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state mirrored as strings for input compatibility.
  const [withdrawalMinEur, setWithdrawalMinEur] = useState("");
  const [pendingHoldDays, setPendingHoldDays] = useState("");
  const [sprayRateEur, setSprayRateEur] = useState("");
  const [cpmEur, setCpmEur] = useState("");

  const [savingPayments, setSavingPayments] = useState(false);
  const [savingRevenue, setSavingRevenue] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/settings", { credentials: "include" });
      const json = (await r.json()) as PlatformSettingsDTO;
      setData(json);
      setWithdrawalMinEur(eurFromCents(json.payments.withdrawalMinCents));
      setPendingHoldDays(String(json.payments.pendingHoldDays));
      setSprayRateEur(eurFromCents(json.partnerRevenue.sprayRateCents));
      setCpmEur(eurFromCents(json.partnerRevenue.cpmCents));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const savePayments = async () => {
    setSavingPayments(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payments: {
            withdrawalMinCents: centsFromEur(withdrawalMinEur),
            pendingHoldDays: Math.max(0, Math.floor(Number(pendingHoldDays) || 0)),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        pushToast({
          kind: "danger",
          title: "Sauvegarde échouée",
          desc: json.message ?? json.error ?? "—",
        });
      } else {
        pushToast({ kind: "success", title: "Paramètres paiements enregistrés" });
        setData(json as PlatformSettingsDTO);
      }
    } finally {
      setSavingPayments(false);
    }
  };

  const saveRevenue = async () => {
    setSavingRevenue(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          partnerRevenue: {
            sprayRateCents: centsFromEur(sprayRateEur),
            cpmCents: centsFromEur(cpmEur),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        pushToast({
          kind: "danger",
          title: "Sauvegarde échouée",
          desc: json.message ?? json.error ?? "—",
        });
      } else {
        pushToast({
          kind: "success",
          title: "Tarifs partenaires enregistrés",
        });
        setData(json as PlatformSettingsDTO);
      }
    } finally {
      setSavingRevenue(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Paramètres plateforme</h1>
          <p className="subtitle">
            Valeurs lues à chaud par les services. Caches invalidés à la sauvegarde.
          </p>
        </div>
      </div>

      <div className="grid grid-12" style={{ gap: 20 }}>
        <div className="col-6">
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--gray-200)",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 15 }}>
                <Icon name="banknote" size={16} /> Paiements
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                Retraits chauffeurs et délai de blocage des commissions.
              </p>
            </div>

            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "var(--gray-600)" }}>
                Retrait minimum (€)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={withdrawalMinEur}
                onChange={(e) => setWithdrawalMinEur(e.target.value)}
                disabled={loading}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  border: "1px solid var(--gray-300)",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              />
              {data && (
                <span style={{ fontSize: 11, color: "var(--gray-500)" }}>
                  Actuel : {(data.payments.withdrawalMinCents / 100).toFixed(2)} €
                </span>
              )}
            </label>

            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "var(--gray-600)" }}>
                Délai de blocage (jours)
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={pendingHoldDays}
                onChange={(e) => setPendingHoldDays(e.target.value)}
                disabled={loading}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  border: "1px solid var(--gray-300)",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              />
              {data && (
                <span style={{ fontSize: 11, color: "var(--gray-500)" }}>
                  Actuel : {data.payments.pendingHoldDays} j
                </span>
              )}
            </label>

            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={savePayments}
                disabled={loading || savingPayments}
              >
                {savingPayments ? "Sauvegarde…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-6">
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--gray-200)",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 15 }}>
                <Icon name="spray-can" size={16} /> Tarifs partenaires
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--gray-500)" }}>
                Reversement par spray et CPM (impressions ÷ 1000).
              </p>
            </div>

            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "var(--gray-600)" }}>
                Reversement par spray (€)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sprayRateEur}
                onChange={(e) => setSprayRateEur(e.target.value)}
                disabled={loading}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  border: "1px solid var(--gray-300)",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              />
              {data && (
                <span style={{ fontSize: 11, color: "var(--gray-500)" }}>
                  Actuel : {(data.partnerRevenue.sprayRateCents / 100).toFixed(2)} €
                </span>
              )}
            </label>

            <label style={{ display: "block" }}>
              <span style={{ fontSize: 12, color: "var(--gray-600)" }}>
                CPM impressions (€ pour 1 000 impressions)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cpmEur}
                onChange={(e) => setCpmEur(e.target.value)}
                disabled={loading}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 4,
                  border: "1px solid var(--gray-300)",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              />
              {data && (
                <span style={{ fontSize: 11, color: "var(--gray-500)" }}>
                  Actuel : {(data.partnerRevenue.cpmCents / 100).toFixed(2)} €
                </span>
              )}
            </label>

            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveRevenue}
                disabled={loading || savingRevenue}
              >
                {savingRevenue ? "Sauvegarde…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
