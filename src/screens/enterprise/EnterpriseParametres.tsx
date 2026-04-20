"use client";

/**
 * EnterpriseParametres — advertiser account settings.
 * Tabs: Profil · Identité de marque · Notifications · API.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";

type Tab = "profile" | "brand" | "notifications" | "api";

const TABS: { id: Tab; label: string; icon: "user" | "image" | "bell" | "code" }[] = [
  { id: "profile", label: "Profil entreprise", icon: "user" },
  { id: "brand", label: "Identité de marque", icon: "image" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "api", label: "API & webhooks", icon: "code" },
];

export function EnterpriseParametres() {
  const [tab, setTab] = useState<Tab>("profile");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifBilling, setNotifBilling] = useState(true);
  const [notifReports, setNotifReports] = useState(false);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Paramètres
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Votre compte Nova Cosmétique
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn ghost">Annuler</button>
          <button type="button" className="glass-btn">
            <Icon name="check" size={14} /> Enregistrer
          </button>
        </div>
      </div>

      <div className="glass-split">
        <aside className="glass-sidenav">
          <div className="glass-sidenav-head">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "linear-gradient(135deg, #EC407A, #A855F7)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              NC
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Nova Cosmétique
              </div>
              <div style={{ fontSize: 11, color: "var(--gray-500)" }}>Plan Croissance</div>
            </div>
          </div>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={"item" + (tab === t.id ? " active" : "")}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} size={14} />
              <span>{t.label}</span>
            </button>
          ))}
        </aside>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {tab === "profile" && (
            <>
              <div className="glass-panel">
                <div className="glass-panelhead">
                  <h3 style={{ margin: 0, fontSize: 14 }}>Informations de l&apos;entreprise</h3>
                </div>
                <div className="glass-formgrid" style={{ padding: 16 }}>
                  <LabelledInput label="Raison sociale" defaultValue="Nova Cosmétique SAS" />
                  <LabelledInput label="SIRET" defaultValue="892 014 523 00018" />
                  <LabelledInput label="TVA intracom" defaultValue="FR31892014523" />
                  <LabelledInput label="Secteur" defaultValue="Cosmétiques & beauté" />
                  <LabelledInput label="Adresse" defaultValue="24 rue de Rivoli, 75004 Paris" />
                  <LabelledInput label="Téléphone" defaultValue="+33 1 42 74 10 18" />
                  <LabelledInput label="Email principal" defaultValue="contact@nova-cosmetique.fr" />
                  <LabelledInput label="Site web" defaultValue="https://nova-cosmetique.fr" />
                </div>
              </div>

              <div className="glass-panel">
                <div className="glass-panelhead">
                  <h3 style={{ margin: 0, fontSize: 14 }}>Facturation</h3>
                </div>
                <div className="glass-formgrid" style={{ padding: 16 }}>
                  <LabelledInput label="Email de facturation" defaultValue="facturation@nova-cosmetique.fr" />
                  <LabelledInput label="IBAN" defaultValue="FR76 3000 6000 0112 3456 7890 189" />
                  <LabelledInput label="Référence interne" defaultValue="NOVA-2026" />
                  <LabelledInput label="Conditions de paiement" defaultValue="30 jours fin de mois" />
                </div>
              </div>
            </>
          )}

          {tab === "brand" && (
            <>
              <div className="glass-panel">
                <div className="glass-panelhead">
                  <h3 style={{ margin: 0, fontSize: 14 }}>Logo de marque</h3>
                </div>
                <div
                  style={{
                    padding: 16,
                    display: "flex",
                    gap: 18,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 18,
                      background: "linear-gradient(135deg, #EC407A, #A855F7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontFamily: "var(--font-display)",
                      fontSize: 36,
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                    }}
                  >
                    NC
                  </div>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      Logo principal
                    </div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)", lineHeight: 1.5 }}>
                      Utilisé dans les e-mails, sur les factures et sur les visuels de borne.
                      PNG ou SVG recommandé, fond transparent, 1024 × 1024 min.
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button type="button" className="glass-btn">
                        <Icon name="upload-cloud" size={14} /> Remplacer
                      </button>
                      <button type="button" className="glass-btn ghost">
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel">
                <div className="glass-panelhead">
                  <h3 style={{ margin: 0, fontSize: 14 }}>Palette de marque</h3>
                </div>
                <div
                  style={{
                    padding: 16,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 12,
                  }}
                >
                  {[
                    { name: "Primaire", hex: "#EC407A" },
                    { name: "Secondaire", hex: "#A855F7" },
                    { name: "Accent", hex: "#F9A8D4" },
                    { name: "Texte", hex: "#0A0E1F" },
                  ].map((c) => (
                    <div
                      key={c.name}
                      style={{
                        background: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(35,52,102,0.08)",
                        borderRadius: 12,
                        padding: 12,
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: c.hex,
                          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--gray-500)", fontFamily: "ui-monospace, Menlo, monospace" }}>
                          {c.hex}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel">
                <div className="glass-panelhead">
                  <h3 style={{ margin: 0, fontSize: 14 }}>Typographie</h3>
                </div>
                <div style={{ padding: 16, display: "grid", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
                      Titres
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700 }}>
                      Playfair Display
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
                      Texte courant
                    </div>
                    <div style={{ fontSize: 15 }}>Inter — Regular / Medium / Semibold</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "notifications" && (
            <div className="glass-panel">
              <div className="glass-panelhead">
                <h3 style={{ margin: 0, fontSize: 14 }}>Préférences de notification</h3>
              </div>
              <div style={{ padding: 16, display: "grid", gap: 4 }}>
                <ToggleRow
                  title="Emails d'activité"
                  sub="Récapitulatifs hebdomadaires des performances campagnes"
                  value={notifEmail}
                  onChange={setNotifEmail}
                />
                <ToggleRow
                  title="Notifications de facturation"
                  sub="Alertes factures émises, rappels d'échéance, paiements reçus"
                  value={notifBilling}
                  onChange={setNotifBilling}
                />
                <ToggleRow
                  title="Rapports mensuels"
                  sub="PDF récapitulatif envoyé le 1er de chaque mois"
                  value={notifReports}
                  onChange={setNotifReports}
                />
                <ToggleRow
                  title="Nouvelles fonctionnalités & offres"
                  sub="Nouveautés Publeader et offres partenaires"
                  value={notifMarketing}
                  onChange={setNotifMarketing}
                />
              </div>
            </div>
          )}

          {tab === "api" && (
            <>
              <div className="glass-panel">
                <div className="glass-panelhead">
                  <h3 style={{ margin: 0, fontSize: 14 }}>Clés d&apos;API</h3>
                  <button type="button" className="glass-btn ghost">
                    <Icon name="refresh" size={12} /> Régénérer
                  </button>
                </div>
                <div style={{ padding: 16, display: "grid", gap: 12 }}>
                  <div className="glass-apikey">
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
                      Clé publique
                    </div>
                    <div
                      style={{
                        fontFamily: "ui-monospace, Menlo, monospace",
                        fontSize: 12,
                        padding: "8px 12px",
                        background: "rgba(35,52,102,0.06)",
                        borderRadius: 8,
                        marginTop: 6,
                      }}
                    >
                      pk_live_nova_a3d92fc4b17e9a58
                    </div>
                  </div>
                  <div className="glass-apikey">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
                        Clé secrète
                      </div>
                      <button
                        type="button"
                        className="glass-btn ghost"
                        style={{ padding: "2px 8px" }}
                        onClick={() => setApiKeyVisible((v) => !v)}
                      >
                        <Icon name={apiKeyVisible ? "eye-off" : "eye"} size={12} />
                        {apiKeyVisible ? " Masquer" : " Révéler"}
                      </button>
                    </div>
                    <div
                      style={{
                        fontFamily: "ui-monospace, Menlo, monospace",
                        fontSize: 12,
                        padding: "8px 12px",
                        background: "rgba(35,52,102,0.06)",
                        borderRadius: 8,
                        marginTop: 6,
                      }}
                    >
                      {apiKeyVisible
                        ? "sk_live_nova_8e2b7fa1c30d9e64b521"
                        : "sk_live_••••••••••••••••••••"}
                    </div>
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--gray-500)", margin: 0 }}>
                    Gardez la clé secrète confidentielle. Elle peut lire vos campagnes
                    et déclencher des exports via notre API REST.
                  </p>
                </div>
              </div>

              <div className="glass-panel">
                <div className="glass-panelhead">
                  <h3 style={{ margin: 0, fontSize: 14 }}>Webhooks</h3>
                  <button type="button" className="glass-btn ghost">
                    <Icon name="plus" size={12} /> Ajouter
                  </button>
                </div>
                <div style={{ padding: 16, display: "grid", gap: 10 }}>
                  {[
                    { url: "https://nova-cosmetique.fr/hooks/publeader", events: "campaign.* · invoice.paid", status: "Actif" },
                    { url: "https://zap.hooks/nova/reports", events: "report.ready", status: "Actif" },
                  ].map((w) => (
                    <div
                      key={w.url}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "11px 14px",
                        background: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(35,52,102,0.08)",
                        borderRadius: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {w.url}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--gray-500)" }}>
                          {w.events}
                        </div>
                      </div>
                      <span className="ent-chip paid">{w.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LabelledInput({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
        {label}
      </span>
      <input className="glass-input" defaultValue={defaultValue} />
    </label>
  );
}

function ToggleRow({
  title,
  sub,
  value,
  onChange,
}: {
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid rgba(35,52,102,0.06)",
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>{sub}</div>
      </div>
      <button
        type="button"
        className={"glass-switch" + (value ? " on" : "")}
        aria-pressed={value}
        onClick={() => onChange(!value)}
      >
        <span />
      </button>
    </div>
  );
}
