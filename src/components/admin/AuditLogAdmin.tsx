"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";

type AuditItem = {
  id: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  ip?: string;
  at: string;
};

const ACTIONS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "user.ban", label: "Ban utilisateur" },
  { value: "user.unban", label: "Débannissement" },
  { value: "user.revoke_sessions", label: "Sessions révoquées" },
  { value: "invoice.send", label: "Facture envoyée" },
  { value: "invoice.mark_paid", label: "Facture payée" },
  { value: "invoice.delete", label: "Facture supprimée" },
  { value: "validation.approve", label: "Validation approuvée" },
  { value: "validation.reject", label: "Validation rejetée" },
  { value: "validation.request_info", label: "Validation: info demandée" },
  { value: "withdrawal.process", label: "Retrait traité" },
  { value: "withdrawal.reject", label: "Retrait rejeté" },
  { value: "partner_payout.mark_paid", label: "Payout partenaire" },
  { value: "settings.update", label: "Paramètres modifiés" },
  { value: "report.generate", label: "Rapport généré" },
  { value: "report.delete", label: "Rapport supprimé" },
  { value: "stripe.webhook.processed", label: "Webhook Stripe" },
  { value: "gdpr.export", label: "Export RGPD" },
  { value: "gdpr.delete", label: "Anonymisation RGPD" },
];

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 50;

export function AuditLogAdmin() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const reload = async (resetOffset = false) => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/audit", window.location.origin);
      const off = resetOffset ? 0 : offset;
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("offset", String(off));
      if (action) url.searchParams.set("action", action);
      if (actor.trim()) url.searchParams.set("actorUserId", actor.trim());
      if (from) url.searchParams.set("from", new Date(from).toISOString());
      if (to) url.searchParams.set("to", new Date(to).toISOString());
      const r = await fetch(url.toString(), { credentials: "include" });
      const data = (await r.json()) as { items: AuditItem[]; total: number };
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      if (resetOffset) setOffset(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const totalPages = useMemo(() => Math.ceil(total / PAGE_SIZE), [total]);
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit log</h1>
          <p className="subtitle">{total} entrées · journal des actions admin.</p>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid var(--gray-200)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          style={{ border: "1px solid var(--gray-300)", borderRadius: 8, padding: "8px 10px" }}
        >
          {ACTIONS.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Acteur (userId)"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          style={{ border: "1px solid var(--gray-300)", borderRadius: 8, padding: "8px 10px" }}
        />
        <label style={{ display: "flex", flexDirection: "column", fontSize: 11, color: "var(--gray-600)" }}>
          De
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{ border: "1px solid var(--gray-300)", borderRadius: 8, padding: "6px 8px" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 11, color: "var(--gray-600)" }}>
          À
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ border: "1px solid var(--gray-300)", borderRadius: 8, padding: "6px 8px" }}
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={() => reload(true)}>
          <Icon name="refresh" size={14} /> Filtrer
        </button>
      </div>

      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Acteur</th>
              <th>Action</th>
              <th>Cible</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--gray-500)" }}>
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--gray-500)" }}>
                  Aucune entrée.
                </td>
              </tr>
            )}
            {items.map((it) => {
              const isOpen = expanded === it.id;
              return (
                <>
                  <tr key={it.id}>
                    <td style={{ fontSize: 12, color: "var(--gray-600)" }}>
                      {fmtDateTime(it.at)}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{it.actorEmail ?? "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
                        {it.actorRole ?? ""}
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: 11 }}>{it.action}</code>
                    </td>
                    <td>
                      {it.targetType ? (
                        <div>
                          <div style={{ fontSize: 12 }}>{it.targetType}</div>
                          <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
                            {it.targetId ?? "—"}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setExpanded(isOpen ? null : it.id)}
                        title={isOpen ? "Masquer" : "Détails"}
                      >
                        <Icon name={isOpen ? "chevron-down" : "chevron-right"} size={16} />
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${it.id}-meta`}>
                      <td colSpan={5} style={{ background: "var(--navy-soft)", padding: 16 }}>
                        <pre
                          style={{
                            margin: 0,
                            fontSize: 11,
                            fontFamily: "var(--font-mono)",
                            whiteSpace: "pre-wrap",
                            color: "var(--black)",
                          }}
                        >
{JSON.stringify({ before: it.before, after: it.after, meta: it.meta, ip: it.ip }, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost compact"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            <Icon name="chevron-left" size={14} /> Préc.
          </button>
          <button
            type="button"
            className="btn btn-ghost compact"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Suiv. <Icon name="chevron-right" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
