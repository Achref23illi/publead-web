"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type { PartnerPayoutDTO } from "@/lib/partner-revenue-serializer";

const FR_MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return `${FR_MONTHS[m - 1]} ${y}`;
}

const eur = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

type Filter = "scheduled" | "paid" | "all";

export function PartnerPayoutsAdminPro() {
  const [payouts, setPayouts] = useState<PartnerPayoutDTO[]>([]);
  const [filter, setFilter] = useState<Filter>("scheduled");
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<PartnerPayoutDTO | null>(null);

  const reload = async () => {
    setLoading(true);
    const url =
      filter === "all"
        ? "/api/admin/partner-payouts"
        : `/api/admin/partner-payouts?status=${filter}`;
    const res = await fetch(url, { credentials: "include" });
    const data = (await res.json()) as { payouts: PartnerPayoutDTO[] };
    setPayouts(data.payouts ?? []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const totals = useMemo(
    () => ({
      scheduled: payouts
        .filter((p) => p.status === "scheduled")
        .reduce((sum, p) => sum + p.totalCents, 0),
      paid: payouts
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.totalCents, 0),
    }),
    [payouts],
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Paiements partenaires</h1>
          <p className="subtitle">
            File des paiements scellés. Marquer payé une fois le virement
            confirmé.
          </p>
        </div>
      </div>

      <div className="grid grid-12 mb-6" style={{ gap: 16 }}>
        {[
          { l: "Programmés", v: payouts.filter((p) => p.status === "scheduled").length.toString() },
          { l: "Total à payer", v: `${eur(totals.scheduled)} €` },
          { l: "Total payé", v: `${eur(totals.paid)} €` },
          { l: "Échoués", v: payouts.filter((p) => p.status === "failed").length.toString() },
        ].map((t) => (
          <div
            key={t.l}
            className="col-3"
            style={{
              background: "var(--navy-soft)",
              borderRadius: 10,
              padding: "16px 18px",
            }}
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
              {t.v}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(
          [
            { v: "scheduled", l: "Programmés" },
            { v: "paid", l: "Payés" },
            { v: "all", l: "Tous" },
          ] as const
        ).map((f) => (
          <button
            key={f.v}
            type="button"
            className={
              "btn compact " + (filter === f.v ? "btn-primary" : "btn-ghost")
            }
            onClick={() => setFilter(f.v)}
          >
            {f.l}
          </button>
        ))}
      </div>

      <div className="card card-flush">
        {loading ? (
          <div style={{ padding: 32, color: "var(--gray-500)" }}>
            Chargement…
          </div>
        ) : payouts.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--gray-500)",
            }}
          >
            <Icon name="banknote" size={32} />
            <p style={{ margin: "12px 0 0", fontSize: 14 }}>
              Aucun paiement dans cette catégorie.
            </p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Mois</th>
                <th>Partner</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Référence</th>
                <th style={{ textAlign: "right" }}>Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td>{monthLabel(p.month)}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {p.partnerId}
                  </td>
                  <td>
                    <span
                      className={
                        "chip " +
                        (p.status === "paid"
                          ? "chip-success"
                          : p.status === "failed"
                          ? "chip-danger"
                          : "chip-warning")
                      }
                    >
                      {p.status === "paid"
                        ? "Payé"
                        : p.status === "failed"
                        ? "Échoué"
                        : "Programmé"}
                    </span>
                  </td>
                  <td style={{ color: "var(--gray-500)", fontSize: 12 }}>
                    {p.status === "paid" && p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString("fr-FR")
                      : new Date(p.scheduledFor).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {p.payoutReference ?? "—"}
                  </td>
                  <td
                    className="num"
                    style={{ textAlign: "right", fontWeight: 700 }}
                  >
                    {eur(p.totalCents)} €
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {p.status === "scheduled" && (
                      <button
                        type="button"
                        className="btn btn-primary compact"
                        onClick={() => setMarking(p)}
                      >
                        Marquer payé
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {marking && (
        <MarkPaidModal
          payout={marking}
          onClose={() => setMarking(null)}
          onDone={async () => {
            setMarking(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function MarkPaidModal({
  payout,
  onClose,
  onDone,
}: {
  payout: PartnerPayoutDTO;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    const res = await fetch(`/api/admin/partner-payouts/${payout.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_paid",
        payoutReference: reference.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;
      setErr(body?.message ?? body?.error ?? `HTTP ${res.status}`);
      return;
    }
    await onDone();
  };

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet" style={{ width: 480 }}>
        <div className="sheet-head">
          <h2>Marquer le paiement</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="sheet-body">
          <p style={{ fontSize: 13, color: "var(--gray-500)" }}>
            {monthLabel(payout.month)} · {(payout.totalCents / 100).toLocaleString("fr-FR")} €
          </p>
          <label style={{ display: "block", marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Référence virement (optionnel)
            </div>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="VIR-2026-04-001"
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid var(--gray-200)",
              }}
            />
          </label>
          {err && (
            <div style={{ marginTop: 12, color: "var(--danger)", fontSize: 13 }}>
              {err}
            </div>
          )}
        </div>
        <div className="sheet-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? "Envoi…" : "Confirmer paiement"}
          </button>
        </div>
      </div>
    </>
  );
}
