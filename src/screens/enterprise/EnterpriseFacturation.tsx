"use client";

/**
 * EnterpriseFacturation — advertiser billing screen.
 * Real data from /api/me/billing + /api/me/invoices. Hosted Stripe Customer
 * Portal for payment-method management; existing /api/me/invoices/[id]/checkout
 * for paying open invoices.
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";
import type {
  BillingDashboardDTO,
  BillingProfileDTO,
} from "@/lib/billing-service";
import type { InvoiceDTO } from "@/lib/finance-serializer";

type StatusFilter = "all" | "envoyee" | "payee" | "en_retard";

const STATUS_LABEL: Record<InvoiceDTO["status"], string> = {
  brouillon: "Brouillon",
  envoyee: "À payer",
  payee: "Payée",
  en_retard: "En retard",
};

const STATUS_CHIP: Record<InvoiceDTO["status"], string> = {
  brouillon: "chip-outline",
  envoyee: "chip-filled-warning",
  payee: "chip-success",
  en_retard: "chip-filled-warning",
};

const FILTER_LABEL: Record<StatusFilter, string> = {
  all: "Toutes",
  envoyee: "À payer",
  payee: "Payées",
  en_retard: "En retard",
};

const eur = (cents: number) =>
  `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function EnterpriseFacturation() {
  const { pushToast } = useToast();
  const [dashboard, setDashboard] = useState<BillingDashboardDTO | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);

  // Editable profile form fields (mirror dashboard.profile after fetch).
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingNote, setBillingNote] = useState("");

  const reload = async () => {
    setLoading(true);
    try {
      const [dashRes, invRes] = await Promise.all([
        fetch("/api/me/billing", { credentials: "include" }),
        fetch("/api/me/invoices", { credentials: "include" }),
      ]);
      const dash = (await dashRes.json()) as BillingDashboardDTO;
      const invJson = (await invRes.json()) as { invoices?: InvoiceDTO[] };
      setDashboard(dash);
      setInvoices(invJson.invoices ?? []);
      setBillingEmail(dash.profile.billingEmail ?? "");
      setBillingAddress(dash.profile.billingAddress ?? "");
      setBillingNote(dash.profile.billingNote ?? "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(
    () => invoices.filter((i) => filter === "all" || i.status === filter),
    [invoices, filter],
  );

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/me/billing", {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          billingEmail,
          billingAddress,
          billingNote,
        }),
      });
      const data = (await res.json()) as {
        profile?: BillingProfileDTO;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        pushToast({
          kind: "danger",
          title: "Sauvegarde échouée",
          desc: data.message ?? data.error ?? "—",
        });
      } else {
        pushToast({ kind: "success", title: "Profil de facturation enregistré" });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const openPortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/me/billing/portal", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ returnUrl: "/enterprise/facturation" }),
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        pushToast({
          kind: "danger",
          title: "Portail indisponible",
          desc: data.message ?? "Stripe n'est pas configuré",
        });
        return;
      }
      window.location.href = data.url;
    } finally {
      setOpeningPortal(false);
    }
  };

  const payInvoice = async (inv: InvoiceDTO) => {
    setPaying(inv.id);
    try {
      const res = await fetch(`/api/me/invoices/${inv.id}/checkout`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) {
        pushToast({
          kind: "danger",
          title: "Paiement impossible",
          desc: data.message ?? "—",
        });
        return;
      }
      window.location.href = data.url;
    } finally {
      setPaying(null);
    }
  };

  const metrics = dashboard?.metrics;
  const profile = dashboard?.profile;
  const methods = dashboard?.paymentMethods ?? [];

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Facturation
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Factures, paiements et moyens de paiement
          </p>
        </div>
      </div>

      {/* Balance banner */}
      <div
        className="ent-hero"
        style={{
          background:
            "radial-gradient(120% 140% at 0% 0%, rgba(255,255,255,0.2), transparent 60%), linear-gradient(135deg, #233466 0%, #3A4B8A 55%, #1E293B 100%)",
          boxShadow:
            "0 1px 2px rgba(35,52,102,0.08), 0 28px 60px -24px rgba(35,52,102,0.4), inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      >
        <div
          className="ent-hero-row"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}
        >
          <BannerStat
            label="Solde dû"
            value={metrics ? eur(metrics.accountBalanceCents) : "—"}
            sub={
              metrics
                ? `${metrics.pendingCount} facture(s) ouvertes${metrics.overdueCount ? ` · ${metrics.overdueCount} en retard` : ""}`
                : "—"
            }
          />
          <BannerStat
            label="Encaissé ce mois"
            value={metrics ? eur(metrics.mrrCents) : "—"}
            sub="MRR"
          />
          <BannerStat
            label="Total dépensé"
            value={metrics ? eur(metrics.totalSpendCents) : "—"}
            sub="depuis le début"
          />
          <BannerStat
            label="Prochaine échéance"
            value={
              metrics?.nextDueDate ? fmtDate(metrics.nextDueDate) : "—"
            }
            sub={metrics?.nextDueDate ? "facture la plus ancienne" : "rien d'ouvert"}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 20,
          marginTop: 24,
        }}
      >
        <div className="glass-panel">
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>Factures</h3>
            <div className="ent-seg">
              {(Object.keys(FILTER_LABEL) as StatusFilter[]).map((k) => (
                <button
                  key={k}
                  className={filter === k ? "active" : ""}
                  onClick={() => setFilter(k)}
                >
                  {FILTER_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Émise</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th style={{ textAlign: "right" }}>Montant</th>
                <th style={{ width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "var(--gray-500)" }}>
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 20, color: "var(--gray-500)" }}>
                    Aucune facture.
                  </td>
                </tr>
              )}
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600 }}>{inv.ref}</td>
                  <td style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    {fmtDate(inv.issueDate)}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--gray-500)" }}>
                    {fmtDate(inv.dueDate)}
                  </td>
                  <td>
                    <span className={`chip ${STATUS_CHIP[inv.status]}`}>
                      {STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {eur(inv.totalCents)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {(inv.status === "envoyee" || inv.status === "en_retard") && (
                      <button
                        type="button"
                        className="glass-btn"
                        disabled={paying === inv.id}
                        onClick={() => payInvoice(inv)}
                      >
                        <Icon name="credit-card" size={14} />
                        {paying === inv.id ? "Redirection…" : "Payer"}
                      </button>
                    )}
                    {inv.status === "payee" && (
                      <span style={{ fontSize: 11, color: "var(--gray-500)" }}>
                        {inv.paidAt ? fmtDate(inv.paidAt) : ""}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="glass-panel">
            <div className="glass-panelhead">
              <h3 style={{ margin: 0, fontSize: 14 }}>Moyens de paiement</h3>
              <button
                type="button"
                className="glass-btn ghost"
                onClick={openPortal}
                disabled={openingPortal}
              >
                <Icon name="settings" size={12} />
                {openingPortal ? "Ouverture…" : "Gérer"}
              </button>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {!loading && methods.length === 0 && (
                <div style={{ color: "var(--gray-500)", fontSize: 13 }}>
                  Aucune carte enregistrée. Cliquez sur « Gérer » pour en
                  ajouter une via Stripe.
                </div>
              )}
              {methods.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: "var(--navy-soft)",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 24,
                      borderRadius: 4,
                      background: "linear-gradient(135deg, #233466, #3A4B8A)",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textTransform: "uppercase",
                    }}
                  >
                    {m.brand}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      •••• {m.last4}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
                      Expire {String(m.expMonth).padStart(2, "0")}/{m.expYear}
                    </div>
                  </div>
                  {m.isDefault && (
                    <span className="chip chip-success" style={{ fontSize: 10 }}>
                      Par défaut
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={saveProfile} className="glass-panel">
            <div className="glass-panelhead">
              <h3 style={{ margin: 0, fontSize: 14 }}>Profil de facturation</h3>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <ReadonlyInfo label="Raison sociale" value={profile?.legalName ?? profile?.companyName ?? "—"} />
              <ReadonlyInfo label="SIRET" value={profile?.siret ?? "—"} />
              <ReadonlyInfo label="N° TVA" value={profile?.vatNumber ?? "—"} />
              <Field
                label="Email de facturation"
                value={billingEmail}
                onChange={setBillingEmail}
                placeholder="ap@entreprise.com"
                type="email"
              />
              <Field
                label="Adresse de facturation"
                value={billingAddress}
                onChange={setBillingAddress}
                placeholder="123 rue de la Paix, 75002 Paris"
              />
              <Field
                label="Note (mention sur les factures)"
                value={billingNote}
                onChange={setBillingNote}
                placeholder="N° de bon de commande, contact AP…"
              />
              <div style={{ textAlign: "right" }}>
                <button
                  type="submit"
                  className="glass-btn"
                  disabled={savingProfile || loading}
                >
                  {savingProfile ? "Sauvegarde…" : "Enregistrer"}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--gray-500)" }}>
                Pour modifier la raison sociale, le SIRET ou la TVA, passez par
                vos paramètres entreprise (identité légale).
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function BannerStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div>
      <div className="ent-hero-stat-label">{label}</div>
      <div className="ent-hero-stat-value" style={{ fontSize: 26 }}>
        {value}
      </div>
      <div className="ent-hero-stat-sub">{sub}</div>
    </div>
  );
}

function ReadonlyInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--black)", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          display: "block",
          width: "100%",
          marginTop: 4,
          border: "1px solid var(--gray-300)",
          borderRadius: 8,
          padding: "8px 10px",
        }}
      />
    </label>
  );
}
