"use client";

/**
 * ParametresPro — pro UI settings with 8 tabs in a 2-column layout.
 * 1:1 port of other-screens.jsx's <Parametres>.
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
  | "fournisseurs"
  | "integrations"
  | "webhooks"
  | "audit";

interface TabDef {
  id: Tab;
  label: string;
  icon: IconName;
}

const TABS: TabDef[] = [
  { id: "profil", label: "Profil & entreprise", icon: "user" },
  { id: "equipe", label: "Équipe", icon: "users" },
  { id: "roles", label: "Rôles & permissions", icon: "shield-check" },
  { id: "tarifs", label: "Tarifs & offres", icon: "banknote" },
  { id: "fournisseurs", label: "Fournisseurs", icon: "truck" },
  { id: "integrations", label: "Intégrations", icon: "plug" },
  { id: "webhooks", label: "Webhooks & API", icon: "code" },
  { id: "audit", label: "Journal d'audit", icon: "file-text" },
];

export function ParametresPro() {
  const [tab, setTab] = useState<Tab>("profil");
  const { uiStyle, setUiStyle } = useTheme();
  const { pushToast } = useToast();

  const save = () =>
    pushToast({ kind: "success", title: "Modifications enregistrées" });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Paramètres</h1>
          <p className="subtitle">Administration du compte et des intégrations Publeader.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
        <nav
          className="card"
          style={{ padding: 10, alignSelf: "flex-start", position: "sticky", top: 88 }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 12px",
                border: "none",
                borderRadius: 8,
                background: tab === t.id ? "var(--navy-soft)" : "transparent",
                color: tab === t.id ? "var(--navy)" : "var(--gray-700)",
                fontWeight: tab === t.id ? 600 : 500,
                fontSize: 13,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <Icon name={t.icon} size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="card" style={{ padding: 28 }}>
          {tab === "profil" && (
            <div>
              <h2 style={{ fontSize: 18, margin: "0 0 20px" }}>Profil & entreprise</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Raison sociale</label>
                  <input className="input" defaultValue="Publeader SAS" />
                </div>
                <div className="input-group">
                  <label className="input-label">SIRET</label>
                  <input className="input" defaultValue="920 481 712 00018" />
                </div>
                <div className="input-group">
                  <label className="input-label">Email de contact</label>
                  <input className="input" defaultValue="contact@publeader.fr" />
                </div>
                <div className="input-group">
                  <label className="input-label">Téléphone</label>
                  <input className="input" defaultValue="+33 1 84 60 11 22" />
                </div>
                <div className="input-group" style={{ gridColumn: "1/-1" }}>
                  <label className="input-label">Adresse</label>
                  <input className="input" defaultValue="12 rue du Faubourg Saint-Honoré, 75008 Paris" />
                </div>
              </div>
              <h3 style={{ fontSize: 14, margin: "24px 0 12px" }}>Apparence</h3>
              <div style={{ display: "flex", gap: 10 }}>
                {(["pro", "glass"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={"chip " + (uiStyle === s ? "chip-filled-navy" : "chip-outline")}
                    onClick={() => setUiStyle(s)}
                  >
                    {s === "pro" ? "Pro (navy classique)" : "Glass (vitré)"}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-secondary">
                  Annuler
                </button>
                <button type="button" className="btn btn-primary" onClick={save}>
                  Enregistrer
                </button>
              </div>
            </div>
          )}

          {tab === "equipe" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2 style={{ fontSize: 18, margin: 0 }}>Équipe</h2>
                <button type="button" className="btn btn-primary">
                  <Icon name="plus" size={16} /> Inviter
                </button>
              </div>
              <div className="card card-flush" style={{ boxShadow: "none", border: "1px solid var(--gray-200)" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Membre</th>
                      <th>Email</th>
                      <th>Rôle</th>
                      <th>Dernière connexion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Jo Wissam", email: "jo@publeader.fr", role: "Admin", last: "il y a 5 min" },
                      { name: "Claire Dupont", email: "c.dupont@publeader.fr", role: "Manager", last: "il y a 2 h" },
                      { name: "Marc Lemaire", email: "m.lemaire@publeader.fr", role: "Comptable", last: "hier" },
                      { name: "Sofia Neri", email: "s.neri@publeader.fr", role: "Opérations", last: "il y a 3 j" },
                    ].map((p) => (
                      <tr key={p.email}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="avatar-initials" style={{ width: 32, height: 32 }}>
                              {p.name
                                .split(" ")
                                .map((s) => s[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <span style={{ fontWeight: 600 }}>{p.name}</span>
                          </div>
                        </td>
                        <td>{p.email}</td>
                        <td>
                          <span className="chip chip-neutral">{p.role}</span>
                        </td>
                        <td style={{ color: "var(--gray-500)" }}>{p.last}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "roles" && (
            <div>
              <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Rôles & permissions</h2>
              <div className="card card-flush" style={{ boxShadow: "none", border: "1px solid var(--gray-200)" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Permission</th>
                      <th style={{ textAlign: "center" }}>Admin</th>
                      <th style={{ textAlign: "center" }}>Manager</th>
                      <th style={{ textAlign: "center" }}>Comptable</th>
                      <th style={{ textAlign: "center" }}>Opérations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Valider un dossier chauffeur", [1, 1, 0, 1]],
                      ["Créer une campagne", [1, 1, 0, 0]],
                      ["Émettre une facture", [1, 0, 1, 0]],
                      ["Gérer les bornes", [1, 1, 0, 1]],
                      ["Accéder au journal d'audit", [1, 0, 1, 0]],
                      ["Modifier les rôles", [1, 0, 0, 0]],
                    ].map(([l, row]) => {
                      const cells = row as number[];
                      return (
                        <tr key={l as string}>
                          <td style={{ fontWeight: 600 }}>{l}</td>
                          {cells.map((v, i) => (
                            <td key={i} style={{ textAlign: "center" }}>
                              {v ? (
                                <Icon name="check" size={16} style={{ color: "var(--success)" }} />
                              ) : (
                                <span style={{ color: "var(--gray-400)" }}>—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "tarifs" && (
            <div>
              <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Tarifs & offres</h2>
              <div className="grid grid-12" style={{ gap: 16 }}>
                {[
                  { name: "BOOST", price: "1 200 €", desc: "3 chauffeurs · 1 ville · 30 j" },
                  { name: "GROWTH", price: "2 800 €", desc: "6 chauffeurs · 2 villes · 45 j" },
                  { name: "LEADER", price: "5 400 €", desc: "illimité · multi-villes · 60 j" },
                ].map((o) => (
                  <div
                    key={o.name}
                    className="col-4"
                    style={{
                      padding: 20,
                      border: "1px solid var(--gray-200)",
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
                      {o.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 28,
                        fontWeight: 700,
                        margin: "8px 0",
                      }}
                    >
                      {o.price}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--gray-500)" }}>{o.desc}</div>
                    <button
                      type="button"
                      className="btn btn-secondary compact"
                      style={{ marginTop: 14 }}
                    >
                      Modifier
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "fournisseurs" && (
            <div>
              <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Fournisseurs</h2>
              <div className="card card-flush" style={{ boxShadow: "none", border: "1px solid var(--gray-200)" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fournisseur</th>
                      <th>Catégorie</th>
                      <th>Contact</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "ParfumLab", cat: "Parfums bornes", contact: "Élise Vidal", status: "Actif" },
                      { name: "PrintFlash", cat: "Flocage véhicules", contact: "Hugo Belin", status: "Actif" },
                      { name: "OVH", cat: "Hébergement", contact: "Support OVH", status: "Actif" },
                      { name: "DPD", cat: "Logistique", contact: "—", status: "Pause" },
                    ].map((f) => (
                      <tr key={f.name}>
                        <td style={{ fontWeight: 600 }}>{f.name}</td>
                        <td>{f.cat}</td>
                        <td>{f.contact}</td>
                        <td>
                          <span
                            className={
                              "chip " + (f.status === "Actif" ? "chip-success" : "chip-warning")
                            }
                          >
                            <span className="dot" /> {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "integrations" && (
            <div>
              <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Intégrations</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { name: "Stripe", desc: "Paiements et facturation", on: true },
                  { name: "Gmail", desc: "Notifications par email", on: true },
                  { name: "Google Maps", desc: "Géolocalisation des tournées", on: true },
                  { name: "Slack", desc: "Alertes équipe", on: false },
                  { name: "QuickBooks", desc: "Synchronisation comptable", on: false },
                ].map((i) => (
                  <div
                    key={i.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      border: "1px solid var(--gray-200)",
                      borderRadius: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{i.name}</div>
                      <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{i.desc}</div>
                    </div>
                    <button
                      type="button"
                      className={"btn compact " + (i.on ? "btn-secondary" : "btn-primary")}
                    >
                      {i.on ? "Connecté" : "Connecter"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "webhooks" && (
            <div>
              <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Webhooks & API</h2>
              <div className="input-group">
                <label className="input-label">Clé API publique</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="input"
                    readOnly
                    value="pk_live_5fA9_QxM2p8vRc7DzL1mN3bT"
                    style={{ fontFamily: "monospace", fontSize: 12 }}
                  />
                  <button type="button" className="btn btn-secondary">
                    Copier
                  </button>
                </div>
              </div>
              <h3 style={{ fontSize: 14, margin: "20px 0 12px" }}>Endpoints webhook</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { url: "https://app.publeader.fr/hooks/stripe", events: "payment.*" },
                  { url: "https://app.publeader.fr/hooks/borne", events: "borne.*" },
                ].map((w) => (
                  <div
                    key={w.url}
                    style={{
                      padding: "12px 14px",
                      border: "1px solid var(--gray-200)",
                      borderRadius: 10,
                      fontFamily: "monospace",
                      fontSize: 12,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{w.url}</span>
                    <span style={{ color: "var(--gray-500)" }}>{w.events}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "audit" && (
            <div>
              <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Journal d&apos;audit</h2>
              <div className="card card-flush" style={{ boxShadow: "none", border: "1px solid var(--gray-200)" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Horodatage</th>
                      <th>Utilisateur</th>
                      <th>Action</th>
                      <th>Détail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { t: "20/04 10:14", u: "Jo Wissam", a: "Validation", d: "Chauffeur Karim Benali approuvé" },
                      { t: "20/04 09:47", u: "Claire Dupont", a: "Campagne", d: "Création « Maison Lavande »" },
                      { t: "19/04 17:22", u: "Marc Lemaire", a: "Facture", d: "Émission F-2026-0412 (2 000 €)" },
                      { t: "19/04 14:03", u: "Sofia Neri", a: "Borne", d: "Refill planifié Club Neon" },
                      { t: "18/04 11:30", u: "Jo Wissam", a: "Paramètre", d: "Mise à jour tarif LEADER" },
                    ].map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "monospace", color: "var(--gray-500)" }}>{r.t}</td>
                        <td style={{ fontWeight: 600 }}>{r.u}</td>
                        <td>
                          <span className="chip chip-neutral">{r.a}</span>
                        </td>
                        <td>{r.d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
