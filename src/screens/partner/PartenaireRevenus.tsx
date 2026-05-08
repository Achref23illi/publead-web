"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import type {
  DailyRevenueDTO,
  MonthlySummaryDTO,
  PartnerPayoutDTO,
  RevenueMonthlyDTO,
} from "@/lib/partner-revenue-serializer";

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

type SummaryResp = {
  currentMonth: MonthlySummaryDTO;
  monthlyTargetCents: number | null;
  rates: { sprayRateCents: number; cpmCents: number };
  nextScheduled: PartnerPayoutDTO | null;
  lastPaid: PartnerPayoutDTO | null;
};

export function PartenaireRevenus() {
  const [summary, setSummary] = useState<SummaryResp | null>(null);
  const [history, setHistory] = useState<DailyRevenueDTO[]>([]);
  const [months, setMonths] = useState<RevenueMonthlyDTO[]>([]);
  const [payouts, setPayouts] = useState<PartnerPayoutDTO[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, h, m, p] = await Promise.all([
        fetch("/api/me/revenue/summary", { credentials: "include" }).then((r) =>
          r.json(),
        ),
        fetch(`/api/me/revenue/history?days=${days}`, {
          credentials: "include",
        }).then((r) => r.json()),
        fetch("/api/me/revenue/months?limit=12", {
          credentials: "include",
        }).then((r) => r.json()),
        fetch("/api/me/revenue/payouts", { credentials: "include" }).then((r) =>
          r.json(),
        ),
      ]);
      setSummary(s);
      setHistory(h.rows ?? []);
      setMonths(m.months ?? []);
      setPayouts(p.payouts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const max = useMemo(
    () => Math.max(...history.map((r) => r.totalCents), 1),
    [history],
  );

  const total = summary?.currentMonth.totalCents ?? 0;
  const target = summary?.monthlyTargetCents ?? 0;
  const progress = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

  const downloadStatement = (month: string, format: "pdf" | "csv") => {
    const url = `/api/me/revenue/statement?month=${month}&format=${format}`;
    window.open(url, "_blank");
  };

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Revenus
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Sprays + diffusion écran. {summary && monthLabel(summary.currentMonth.month)}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="glass-card"
          style={{ padding: 16, color: "var(--danger)", marginBottom: 16 }}
        >
          Erreur : {error}
        </div>
      )}

      {loading || !summary ? (
        <div
          className="glass-card"
          style={{ padding: 32, color: "var(--gray-500)" }}
        >
          Chargement…
        </div>
      ) : (
        <>
          <div className="glass-kpigrid" style={{ marginBottom: 20 }}>
            <KpiBlock label="Total mois" value={`${eur(total)} €`} highlight />
            <KpiBlock label="Sprays" value={`${eur(summary.currentMonth.sprayCents)} €`} sub={`${summary.currentMonth.spraysCount.toLocaleString("fr-FR")} sprays`} />
            <KpiBlock label="Pubs" value={`${eur(summary.currentMonth.adCents)} €`} sub={`${summary.currentMonth.impressions.toLocaleString("fr-FR")} vues`} />
            <KpiBlock
              label="Objectif"
              value={target > 0 ? `${progress}%` : "—"}
              sub={target > 0 ? `${eur(target)} €` : "non défini"}
            />
          </div>

          {summary.nextScheduled && (
            <div
              className="glass-card"
              style={{
                padding: 18,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <Icon name="banknote" size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  Paiement {monthLabel(summary.nextScheduled.month)} prévu
                </div>
                <div style={{ fontSize: 13, color: "var(--gray-500)" }}>
                  Le{" "}
                  {new Date(summary.nextScheduled.scheduledFor).toLocaleDateString(
                    "fr-FR",
                  )}{" "}
                  · {eur(summary.nextScheduled.totalCents)} €
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel" style={{ marginBottom: 20 }}>
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 14 }}>Historique quotidien</h3>
              <div style={{ display: "flex", gap: 6 }}>
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={
                      "btn compact " + (days === d ? "btn-primary" : "btn-ghost")
                    }
                    onClick={() => setDays(d)}
                  >
                    {d}j
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                padding: "0 20px 20px",
                height: 200,
                display: "flex",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              {history.map((row) => (
                <div
                  key={row.date}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: 4,
                  }}
                  title={`${row.date} · ${eur(row.totalCents)} €`}
                >
                  <div
                    style={{
                      width: "100%",
                      height: Math.max(2, (row.totalCents / max) * 160),
                      borderRadius: 3,
                      background:
                        row.totalCents > 0
                          ? "var(--navy)"
                          : "var(--gray-200)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ marginBottom: 20 }}>
            <h3 style={{ padding: "16px 20px 0", margin: 0, fontSize: 14 }}>
              Détail par borne · {monthLabel(summary.currentMonth.month)}
            </h3>
            {summary.currentMonth.perTerminal.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  color: "var(--gray-500)",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Aucune activité ce mois.
              </div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Borne</th>
                    <th style={{ textAlign: "right" }}>Sprays</th>
                    <th style={{ textAlign: "right" }}>Vues</th>
                    <th style={{ textAlign: "right" }}>Sprays €</th>
                    <th style={{ textAlign: "right" }}>Pubs €</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.currentMonth.perTerminal.map((line) => (
                    <tr key={line.terminalId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{line.terminalName}</div>
                        <div
                          className="mono"
                          style={{ fontSize: 11, color: "var(--gray-500)" }}
                        >
                          {line.terminalCode}
                        </div>
                      </td>
                      <td className="num" style={{ textAlign: "right" }}>
                        {line.spraysCount.toLocaleString("fr-FR")}
                      </td>
                      <td className="num" style={{ textAlign: "right" }}>
                        {line.impressions.toLocaleString("fr-FR")}
                      </td>
                      <td className="num" style={{ textAlign: "right" }}>
                        {eur(line.sprayCents)} €
                      </td>
                      <td className="num" style={{ textAlign: "right" }}>
                        {eur(line.adCents)} €
                      </td>
                      <td
                        className="num"
                        style={{ textAlign: "right", fontWeight: 700 }}
                      >
                        {eur(line.totalCents)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass-panel" style={{ marginBottom: 20 }}>
            <h3 style={{ padding: "16px 20px 0", margin: 0, fontSize: 14 }}>
              Paiements
            </h3>
            {payouts.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  color: "var(--gray-500)",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Aucun paiement encore programmé.
              </div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Référence</th>
                    <th style={{ textAlign: "right" }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <td>{monthLabel(p.month)}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass-panel">
            <h3 style={{ padding: "16px 20px 0", margin: 0, fontSize: 14 }}>
              Relevés mensuels
            </h3>
            {months.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  color: "var(--gray-500)",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Aucun relevé scellé. Les mois clos apparaîtront ici.
              </div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th style={{ textAlign: "right" }}>Sprays</th>
                    <th style={{ textAlign: "right" }}>Vues</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => (
                    <tr key={m.id}>
                      <td>{monthLabel(m.month)}</td>
                      <td className="num" style={{ textAlign: "right" }}>
                        {m.totalSprays.toLocaleString("fr-FR")}
                      </td>
                      <td className="num" style={{ textAlign: "right" }}>
                        {m.totalImpressions.toLocaleString("fr-FR")}
                      </td>
                      <td
                        className="num"
                        style={{ textAlign: "right", fontWeight: 700 }}
                      >
                        {eur(m.totalCents)} €
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}
                        >
                          <button
                            type="button"
                            className="btn btn-ghost compact"
                            onClick={() => downloadStatement(m.month, "csv")}
                          >
                            CSV
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary compact"
                            onClick={() => downloadStatement(m.month, "pdf")}
                          >
                            <Icon name="download" size={13} /> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function KpiBlock({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="glass-kpi"
      style={highlight ? { background: "var(--navy-soft)" } : undefined}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--gray-500)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 700,
          margin: "4px 0",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{sub}</div>
      )}
    </div>
  );
}
