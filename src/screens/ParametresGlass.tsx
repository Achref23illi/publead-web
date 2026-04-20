"use client";

/**
 * ParametresGlass — rond/vitré settings, 2-column layout.
 * All tabs fully populated with realistic content.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";

type Tab =
  | "profil"
  | "equipe"
  | "roles"
  | "tarifs"
  | "integrations"
  | "webhooks"
  | "audit";

const TABS: { id: Tab; label: string; icon: IconName; hint?: string }[] = [
  { id: "profil", label: "Profil", icon: "user", hint: "Société & préférences" },
  { id: "equipe", label: "Équipe", icon: "users", hint: "Membres & invitations" },
  { id: "roles", label: "Rôles", icon: "shield-check", hint: "Permissions" },
  { id: "tarifs", label: "Tarifs", icon: "banknote", hint: "Abonnement & usage" },
  { id: "integrations", label: "Intégrations", icon: "plug", hint: "Stripe, Gmail…" },
  { id: "webhooks", label: "Webhooks", icon: "code", hint: "API & événements" },
  { id: "audit", label: "Audit", icon: "file-text", hint: "Journal des actions" },
];

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Comptable" | "Lecteur";
  last: string;
  status: "Actif" | "Invité" | "Inactif";
  initials: string;
  color: string;
}

interface Integration {
  key: string;
  name: string;
  desc: string;
  letter: string;
  color: string;
  connected: boolean;
  category: string;
}

interface AuditLog {
  t: string;
  who: string;
  action: string;
  target: string;
  ip: string;
  kind: "update" | "create" | "delete" | "login" | "security";
}

const TEAM: TeamMember[] = [
  { id: "u1", name: "Jo Wissam", email: "jo@publeader.fr", role: "Admin", last: "il y a 2 min", status: "Actif", initials: "JW", color: "#233466" },
  { id: "u2", name: "Claire Dupont", email: "c.dupont@publeader.fr", role: "Manager", last: "il y a 1 h", status: "Actif", initials: "CD", color: "#9C27B0" },
  { id: "u3", name: "Marc Lemaire", email: "m.lemaire@publeader.fr", role: "Comptable", last: "hier", status: "Actif", initials: "ML", color: "#43A047" },
  { id: "u4", name: "Sophie Vidal", email: "s.vidal@publeader.fr", role: "Manager", last: "il y a 3 j", status: "Actif", initials: "SV", color: "#F59E0B" },
  { id: "u5", name: "Karim Haddad", email: "k.haddad@publeader.fr", role: "Lecteur", last: "—", status: "Invité", initials: "KH", color: "#EC407A" },
];

const ROLES = [
  {
    key: "admin",
    name: "Admin",
    desc: "Accès total, facturation comprise",
    members: 1,
    perms: ["Campagnes", "Validations", "Bornes", "Finances", "Équipe", "Facturation"],
    color: "navy" as const,
  },
  {
    key: "manager",
    name: "Manager",
    desc: "Gère campagnes et chauffeurs",
    members: 2,
    perms: ["Campagnes", "Validations", "Bornes", "Finances (lecture)"],
    color: "info" as const,
  },
  {
    key: "comptable",
    name: "Comptable",
    desc: "Accès lecture + finances",
    members: 1,
    perms: ["Finances", "Factures", "Commissions"],
    color: "success" as const,
  },
  {
    key: "lecteur",
    name: "Lecteur",
    desc: "Consultation seulement",
    members: 1,
    perms: ["Campagnes (lecture)", "Bornes (lecture)"],
    color: "outline" as const,
  },
];

const INTEGRATIONS: Integration[] = [
  { key: "stripe", name: "Stripe", desc: "Paiements & facturation", letter: "S", color: "#635BFF", connected: true, category: "Paiement" },
  { key: "gmail", name: "Gmail", desc: "Notifications email", letter: "G", color: "#EA4335", connected: true, category: "Communication" },
  { key: "slack", name: "Slack", desc: "Alertes équipe temps réel", letter: "#", color: "#4A154B", connected: false, category: "Communication" },
  { key: "sendgrid", name: "SendGrid", desc: "Campagnes emails transactionnels", letter: "✉", color: "#1A82E2", connected: true, category: "Communication" },
  { key: "twilio", name: "Twilio", desc: "SMS & notifications push", letter: "T", color: "#F22F46", connected: false, category: "Communication" },
  { key: "pennylane", name: "Pennylane", desc: "Comptabilité automatisée", letter: "P", color: "#1E293B", connected: true, category: "Comptabilité" },
  { key: "hubspot", name: "HubSpot", desc: "CRM & prospects", letter: "H", color: "#FF7A59", connected: false, category: "CRM" },
  { key: "zapier", name: "Zapier", desc: "Automatisations no-code", letter: "Z", color: "#FF4F00", connected: false, category: "Automatisation" },
];

const WEBHOOKS = [
  { url: "https://api.publeader.fr/hooks/stripe", events: ["invoice.paid", "charge.failed"], status: "Actif" },
  { url: "https://internal.publeader.fr/hooks/validation", events: ["driver.approved", "driver.rejected"], status: "Actif" },
  { url: "https://legacy.publeader.fr/bridge", events: ["campaign.created"], status: "En pause" },
];

const AUDIT: AuditLog[] = [
  { t: "20/04 10:14", who: "Jo Wissam", action: "a modifié", target: "Campagne « Renault Électrique »", ip: "82.64.12.4", kind: "update" },
  { t: "20/04 09:42", who: "Claire Dupont", action: "a validé", target: "Chauffeur Karim Benali", ip: "82.64.12.4", kind: "security" },
  { t: "19/04 18:26", who: "Système", action: "a généré", target: "Rapport hebdo S16", ip: "—", kind: "create" },
  { t: "19/04 14:02", who: "Marc Lemaire", action: "s'est connecté", target: "—", ip: "86.212.88.5", kind: "login" },
  { t: "19/04 11:08", who: "Jo Wissam", action: "a invité", target: "k.haddad@publeader.fr", ip: "82.64.12.4", kind: "create" },
  { t: "18/04 16:44", who: "Claire Dupont", action: "a supprimé", target: "Brouillon Campagne-x7", ip: "82.64.12.4", kind: "delete" },
  { t: "18/04 10:12", who: "Jo Wissam", action: "a régénéré", target: "Clé API publique", ip: "82.64.12.4", kind: "security" },
];

export function ParametresGlass() {
  const [tab, setTab] = useState<Tab>("profil");
  const { uiStyle, setUiStyle } = useTheme();
  const { pushToast } = useToast();
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notif2fa, setNotif2fa] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Paramètres
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Administration du compte Publeader.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn ghost">
            <Icon name="help-circle" size={14} /> Documentation
          </button>
        </div>
      </div>

      <div className="glass-split">
        <nav className="glass-sidenav">
          <div className="glass-sidenav-head">
            <div className="avatar">JW</div>
            <div className="who">
              <div className="n">Jo Wissam</div>
              <div className="r">Admin · Publeader SAS</div>
            </div>
          </div>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={tab === t.id ? "active" : ""}
            >
              <Icon name={t.icon} size={16} />
              {t.label}
            </button>
          ))}
          <div className="glass-sidenav-foot">
            <button type="button" style={{ color: "var(--danger)" }}>
              <Icon name="log-out" size={16} />
              Se déconnecter
            </button>
          </div>
        </nav>

        <div className="glass-panel" style={{ padding: 32 }}>
          {/* Tab header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 className="glass-section-title">{current.label}</h2>
              <p className="glass-section-sub" style={{ margin: 0 }}>
                {current.hint}
              </p>
            </div>
            {(tab === "profil" || tab === "equipe" || tab === "webhooks") && (
              <span className="g-chip outline">
                <Icon name="check-circle" size={11} /> Sauvegarde auto
              </span>
            )}
          </div>

          {/* ============ PROFIL ============ */}
          {tab === "profil" && (
            <>
              {/* Identity section */}
              <div className="glass-section">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    marginBottom: 24,
                    padding: 18,
                    background: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    borderRadius: 20,
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 22,
                      background: "linear-gradient(135deg, var(--navy), #3A4B8A)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 800,
                      boxShadow: "0 10px 24px -8px rgba(35,52,102,0.4)",
                      flexShrink: 0,
                    }}
                  >
                    P
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Publeader SAS</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>
                      PNG ou SVG recommandé · 512×512 px max.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="glass-btn ghost compact">
                      <Icon name="upload-cloud" size={13} /> Remplacer
                    </button>
                    <button type="button" className="glass-btn ghost compact">
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>

                <div className="glass-formgrid">
                  <div className="glass-field">
                    <label className="glass-label">Raison sociale</label>
                    <input className="glass-input" defaultValue="Publeader SAS" />
                  </div>
                  <div className="glass-field">
                    <label className="glass-label">SIRET</label>
                    <input className="glass-input" defaultValue="920 481 712 00018" />
                  </div>
                  <div className="glass-field">
                    <label className="glass-label">Email</label>
                    <input className="glass-input" defaultValue="contact@publeader.fr" />
                  </div>
                  <div className="glass-field">
                    <label className="glass-label">Téléphone</label>
                    <input className="glass-input" defaultValue="+33 1 84 60 11 22" />
                  </div>
                  <div className="glass-field" style={{ gridColumn: "span 2" }}>
                    <label className="glass-label">Adresse</label>
                    <input className="glass-input" defaultValue="12 rue de la Boétie" />
                  </div>
                  <div className="glass-field">
                    <label className="glass-label">Ville</label>
                    <input className="glass-input" defaultValue="Paris" />
                  </div>
                  <div className="glass-field">
                    <label className="glass-label">Code postal · Pays</label>
                    <input className="glass-input" defaultValue="75008 · France" />
                  </div>
                  <div className="glass-field">
                    <label className="glass-label">TVA intracom.</label>
                    <input className="glass-input" defaultValue="FR12 920481712" />
                  </div>
                  <div className="glass-field">
                    <label className="glass-label">Fuseau horaire</label>
                    <input className="glass-input" defaultValue="Europe/Paris (UTC+2)" />
                  </div>
                </div>
              </div>

              {/* Appearance & language */}
              <div className="glass-section">
                <h3 className="glass-section-title" style={{ fontSize: 15 }}>
                  Apparence & langue
                </h3>
                <p className="glass-section-sub" style={{ marginBottom: 18 }}>
                  Préférences visuelles de l&apos;interface pour votre organisation.
                </p>
                <div className="glass-formgrid">
                  <div>
                    <label className="glass-label">Thème</label>
                    <div className="glass-segmented">
                      {(["pro", "glass"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={uiStyle === s ? "active" : ""}
                          onClick={() => setUiStyle(s)}
                        >
                          {s === "pro" ? "Pro (navy)" : "Glass (vitré)"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="glass-label">Langue</label>
                    <div className="glass-segmented">
                      {(["fr", "en"] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          className={lang === l ? "active" : ""}
                          onClick={() => setLang(l)}
                        >
                          {l === "fr" ? "Français" : "English"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="glass-section">
                <h3 className="glass-section-title" style={{ fontSize: 15 }}>
                  Notifications
                </h3>
                <p className="glass-section-sub" style={{ marginBottom: 18 }}>
                  Choisissez comment recevoir les alertes importantes.
                </p>
                {[
                  { k: "email", l: "Notifications email", d: "Validations, factures, alertes bornes", v: notifEmail, s: setNotifEmail },
                  { k: "push", l: "Notifications push", d: "Alertes temps réel sur l'application", v: notifPush, s: setNotifPush },
                  { k: "2fa", l: "Double authentification", d: "Renforce la sécurité de votre compte", v: notif2fa, s: setNotif2fa },
                ].map((n) => (
                  <div
                    key={n.k}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 0",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{n.l}</div>
                      <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>
                        {n.d}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={"glass-switch" + (n.v ? " on" : "")}
                      onClick={() => n.s(!n.v)}
                      aria-label={n.l}
                    />
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 28,
                }}
              >
                <button type="button" className="glass-btn ghost">
                  Annuler
                </button>
                <button
                  type="button"
                  className="glass-btn"
                  onClick={() => pushToast({ kind: "success", title: "Paramètres enregistrés" })}
                >
                  <Icon name="check" size={14} /> Enregistrer
                </button>
              </div>
            </>
          )}

          {/* ============ ÉQUIPE ============ */}
          {tab === "equipe" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { l: "Membres actifs", v: TEAM.filter((m) => m.status === "Actif").length },
                  { l: "Invitations", v: TEAM.filter((m) => m.status === "Invité").length },
                  { l: "Sièges disponibles", v: 10 - TEAM.length },
                ].map((k) => (
                  <div
                    key={k.l}
                    style={{
                      padding: "14px 18px",
                      background: "var(--navy-soft)",
                      borderRadius: 14,
                    }}
                  >
                    <div style={{ fontSize: 11, color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {k.l}
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                      {k.v}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Membres ({TEAM.length})
                </div>
                <button type="button" className="glass-btn compact">
                  <Icon name="user-plus" size={13} /> Inviter un membre
                </button>
              </div>

              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Membre</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Dernière activité</th>
                    <th>Statut</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {TEAM.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            className="brand-logo"
                            style={{ background: m.color, color: "#fff", width: 30, height: 30, fontSize: 11 }}
                          >
                            {m.initials}
                          </div>
                          <span style={{ fontWeight: 600 }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--gray-600)" }}>{m.email}</td>
                      <td>
                        <span className="g-chip outline">{m.role}</span>
                      </td>
                      <td style={{ color: "var(--gray-500)", fontSize: 12 }}>{m.last}</td>
                      <td>
                        <span
                          className={
                            "g-chip " +
                            (m.status === "Actif"
                              ? "success"
                              : m.status === "Invité"
                                ? "warning"
                                : "outline")
                          }
                        >
                          <span className="dot" />
                          {m.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 4 }}>
                          <button type="button" className="glass-btn ghost compact">
                            <Icon name="sliders" size={13} />
                          </button>
                          <button type="button" className="glass-btn ghost compact">
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ============ RÔLES ============ */}
          {tab === "roles" && (
            <>
              <div
                style={{
                  padding: "14px 18px",
                  background: "var(--navy-soft)",
                  borderRadius: 14,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.85)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--navy)",
                  }}
                >
                  <Icon name="info" size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    Les rôles contrôlent l&apos;accès aux différentes sections de Publeader.
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>
                    Personnalisez les permissions ou créez un rôle sur mesure.
                  </div>
                </div>
                <button type="button" className="glass-btn compact">
                  <Icon name="plus" size={13} /> Nouveau rôle
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                {ROLES.map((r) => (
                  <div
                    key={r.key}
                    style={{
                      padding: 20,
                      background: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(255,255,255,0.9)",
                      borderRadius: 18,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h4 style={{ margin: 0, fontSize: 15, fontFamily: "var(--font-display)", fontWeight: 700 }}>
                            {r.name}
                          </h4>
                          <span className={"g-chip " + r.color}>
                            <span className="dot" />
                            {r.members} membre{r.members > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 4 }}>
                          {r.desc}
                        </div>
                      </div>
                      <button type="button" className="glass-btn ghost compact">
                        <Icon name="sliders" size={13} />
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                      {r.perms.map((p) => (
                        <span key={p} className="g-chip outline">
                          <Icon name="check" size={10} /> {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ============ TARIFS ============ */}
          {tab === "tarifs" && (
            <>
              <div
                style={{
                  padding: 24,
                  background: "linear-gradient(135deg, var(--navy), #3A4B8A)",
                  borderRadius: 22,
                  marginBottom: 24,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85, fontWeight: 600 }}>
                    Plan actuel
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 800,
                      margin: "4px 0",
                    }}
                  >
                    Publeader Business
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>
                    249 €/mois · renouvellement le 30 avr. 2026
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="glass-btn ghost"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    <Icon name="download" size={14} /> Factures
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: "10px 18px",
                      borderRadius: 999,
                      background: "#fff",
                      color: "var(--navy)",
                      fontWeight: 600,
                      fontSize: 13,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Gérer l&apos;abonnement
                  </button>
                </div>
              </div>

              <h3 className="glass-section-title" style={{ fontSize: 15 }}>Usage ce mois</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { l: "Campagnes actives", cur: 9, max: 25, unit: "" },
                  { l: "Chauffeurs", cur: 112, max: 200, unit: "" },
                  { l: "Bornes", cur: 6, max: 20, unit: "" },
                ].map((u) => (
                  <div
                    key={u.l}
                    style={{
                      padding: 16,
                      background: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(255,255,255,0.9)",
                      borderRadius: 16,
                    }}
                  >
                    <div style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 500, marginBottom: 4 }}>
                      {u.l}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 4,
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)" }}>
                        {u.cur}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--gray-500)" }}>
                        / {u.max}
                      </span>
                    </div>
                    <div className="glass-progress" style={{ height: 6 }}>
                      <span style={{ width: (u.cur / u.max) * 100 + "%" }} />
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="glass-section-title" style={{ fontSize: 15 }}>Autres plans</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 14 }}>
                {[
                  { name: "Starter", price: 79, features: ["5 campagnes", "25 chauffeurs", "Support email"] },
                  { name: "Business", price: 249, featured: true, features: ["25 campagnes", "200 chauffeurs", "20 bornes", "Support prioritaire"] },
                  { name: "Enterprise", price: 699, features: ["Illimité", "SLA 99,9 %", "Success manager", "SSO"] },
                ].map((t) => (
                  <div key={t.name} className={"glass-tier" + (t.featured ? " featured" : "")}>
                    <div className="tier-name">{t.name}</div>
                    <div className="tier-price">
                      {t.price} € <span className="per">/ mois</span>
                    </div>
                    <div className="tier-sub">Tout inclus</div>
                    <div
                      style={{
                        height: 1,
                        background: t.featured ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.06)",
                        margin: "6px 0",
                      }}
                    />
                    {t.features.map((f) => (
                      <div key={f} className="tier-feat">
                        <Icon name="check-circle" size={14} />
                        {f}
                      </div>
                    ))}
                    <button
                      type="button"
                      className={"glass-btn" + (t.featured ? "" : " ghost")}
                      style={{ marginTop: 10, justifyContent: "center" }}
                    >
                      {t.featured ? "Plan actuel" : "Changer"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ============ INTÉGRATIONS ============ */}
          {tab === "integrations" && (
            <>
              <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { l: "Connectées", v: INTEGRATIONS.filter((i) => i.connected).length, tone: "success" },
                  { l: "Disponibles", v: INTEGRATIONS.length, tone: "info" },
                ].map((s) => (
                  <div
                    key={s.l}
                    style={{
                      padding: "12px 18px",
                      background: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(255,255,255,0.9)",
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)" }}>{s.v}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {INTEGRATIONS.map((i) => (
                  <div key={i.key} className="glass-integration">
                    <div className="logo" style={{ background: i.color }}>
                      {i.letter}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{i.name}</span>
                        {i.connected && (
                          <span className="g-chip success">
                            <span className="dot" /> Connecté
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--gray-500)", marginTop: 2 }}>
                        {i.desc} · {i.category}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={"glass-btn " + (i.connected ? "ghost" : "") + " compact"}
                    >
                      {i.connected ? "Configurer" : "Connecter"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ============ WEBHOOKS ============ */}
          {tab === "webhooks" && (
            <>
              <div className="glass-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                <h3 className="glass-section-title" style={{ fontSize: 15 }}>
                  Clés API
                </h3>
                <p className="glass-section-sub" style={{ marginBottom: 18 }}>
                  Utilisées pour authentifier les appels côté serveur.
                </p>
                <div className="glass-formgrid">
                  <div style={{ gridColumn: "span 2" }}>
                    <label className="glass-label">Clé publique</label>
                    <div className="glass-apikey">
                      <Icon name="code" size={14} />
                      <span className="code">pk_live_51Hb…8KX_publeader_prod</span>
                      <button type="button" className="glass-btn ghost compact">
                        <Icon name="copy" size={13} />
                      </button>
                    </div>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label className="glass-label">Clé secrète</label>
                    <div className="glass-apikey">
                      <Icon name="shield-check" size={14} />
                      <span className="code">
                        {apiKeyVisible ? "sk_live_e4fQ8w…Zt9Xn2RmA_publeader_prod" : "sk_live_•••••••••••••••••••••••"}
                      </span>
                      <button
                        type="button"
                        className="glass-btn ghost compact"
                        onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      >
                        <Icon name={apiKeyVisible ? "eye-off" : "eye"} size={13} />
                      </button>
                      <button type="button" className="glass-btn ghost compact">
                        <Icon name="refresh" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-section">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <h3 className="glass-section-title" style={{ fontSize: 15 }}>
                      Endpoints webhook
                    </h3>
                    <p className="glass-section-sub" style={{ margin: 0 }}>
                      {WEBHOOKS.length} endpoints enregistrés
                    </p>
                  </div>
                  <button type="button" className="glass-btn compact">
                    <Icon name="plus" size={13} /> Ajouter un endpoint
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {WEBHOOKS.map((w) => (
                    <div
                      key={w.url}
                      style={{
                        padding: 16,
                        background: "rgba(255,255,255,0.55)",
                        border: "1px solid rgba(255,255,255,0.9)",
                        borderRadius: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 10,
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-mono, ui-monospace, monospace)",
                            fontSize: 13,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {w.url}
                        </div>
                        <span
                          className={"g-chip " + (w.status === "Actif" ? "success" : "warning")}
                        >
                          <span className="dot" />
                          {w.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {w.events.map((ev) => (
                          <span key={ev} className="g-chip outline">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ============ AUDIT ============ */}
          {tab === "audit" && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <input
                  className="glass-input"
                  placeholder="Rechercher par utilisateur ou action…"
                  style={{ flex: 1, minWidth: 240 }}
                />
                <div className="glass-segmented">
                  {[
                    ["Tout", "all"],
                    ["7 j", "7j"],
                    ["30 j", "30j"],
                    ["90 j", "90j"],
                  ].map(([l, k]) => (
                    <button
                      key={k}
                      type="button"
                      className={k === "30j" ? "active" : ""}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <button type="button" className="glass-btn ghost compact">
                  <Icon name="download" size={13} /> Exporter CSV
                </button>
              </div>

              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Horodatage</th>
                    <th>Utilisateur</th>
                    <th>Action</th>
                    <th>Cible</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {AUDIT.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "var(--gray-500)" }}>
                        {a.t}
                      </td>
                      <td style={{ fontWeight: 600 }}>{a.who}</td>
                      <td>
                        <span
                          className={
                            "g-chip " +
                            (a.kind === "delete"
                              ? "danger"
                              : a.kind === "create"
                                ? "success"
                                : a.kind === "security"
                                  ? "warning"
                                  : a.kind === "login"
                                    ? "info"
                                    : "outline")
                          }
                        >
                          {a.action}
                        </span>
                      </td>
                      <td>{a.target}</td>
                      <td style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "var(--gray-500)" }}>
                        {a.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
