"use client";

/**
 * EnterpriseSupport — advertiser support center.
 * Tickets list, new-ticket form, FAQ, contact info.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";

interface Ticket {
  id: string;
  ref: string;
  subject: string;
  status: "open" | "progress" | "solved";
  priority: "low" | "medium" | "high";
  updated: string;
  messages: number;
}

const TICKETS: Ticket[] = [
  { id: "t1", ref: "#A3420", subject: "Visuel Flocage Nova — problème de rendu", status: "progress", priority: "high", updated: "il y a 2 h", messages: 4 },
  { id: "t2", ref: "#A3415", subject: "Ajouter un second responsable facturation", status: "open", priority: "medium", updated: "hier", messages: 1 },
  { id: "t3", ref: "#A3398", subject: "Question sur la période de diffusion", status: "solved", priority: "low", updated: "il y a 3 j", messages: 6 },
  { id: "t4", ref: "#A3372", subject: "Export impressions par ville", status: "solved", priority: "low", updated: "il y a 1 sem.", messages: 3 },
];

const FAQ = [
  {
    q: "Combien de temps avant qu'une campagne démarre ?",
    a: "Une fois votre brief validé et vos assets livrés, une campagne de flocage démarre en moyenne sous 7 à 10 jours. Les campagnes « Leader Borne » démarrent sous 48 h.",
  },
  {
    q: "Puis-je modifier un visuel en cours de campagne ?",
    a: "Les modifications de visuel de flocage impliquent un re-flocage et sont facturées séparément. Les créatifs diffusés sur borne peuvent être échangés à tout moment sans surcoût.",
  },
  {
    q: "Comment mesurer l'impact de ma campagne ?",
    a: "Chaque campagne est suivie en impressions estimées (reach * km * durée), heures de diffusion et couverture par ville. Les données sont disponibles en temps réel dans l'onglet Performance.",
  },
  {
    q: "Quelles sont les conditions de paiement ?",
    a: "Paiement à 30 jours fin de mois par carte ou virement SEPA. Des remises sont appliquées pour les engagements supérieurs à 3 mois ou les budgets au-delà de 25 000 €.",
  },
  {
    q: "Puis-je mettre une campagne en pause ?",
    a: "Oui, avec un préavis de 72 h pour le flocage (la dépose nécessite une intervention). Les campagnes borne se mettent en pause en 1 clic depuis la fiche campagne.",
  },
];

const PRIORITY_CHIP: Record<Ticket["priority"], string> = {
  low: "draft",
  medium: "info",
  high: "late",
};

const STATUS_CHIP: Record<Ticket["status"], { cls: string; label: string }> = {
  open: { cls: "pending", label: "Ouvert" },
  progress: { cls: "info", label: "En cours" },
  solved: { cls: "paid", label: "Résolu" },
};

export function EnterpriseSupport() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Support
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Votre équipe Publeader vous répond en moyenne sous 2 h ouvrées.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn ghost">
            <Icon name="help-circle" size={14} /> Centre d&apos;aide
          </button>
          <button
            type="button"
            className="glass-btn"
            onClick={() => setShowForm((v) => !v)}
          >
            <Icon name="plus" size={14} /> Nouveau ticket
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        <div>
          {showForm && (
            <div className="glass-panel" style={{ marginBottom: 20 }}>
              <div className="glass-panelhead">
                <h3 style={{ margin: 0, fontSize: 14 }}>Nouvelle demande</h3>
              </div>
              <div style={{ padding: 16, display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
                    Sujet
                  </span>
                  <input className="glass-input" placeholder="Ex. Question sur la facture F-2026-0418" />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
                      Catégorie
                    </span>
                    <select className="glass-input" defaultValue="campagne">
                      <option value="campagne">Campagne en cours</option>
                      <option value="facturation">Facturation</option>
                      <option value="technique">Technique / accès</option>
                      <option value="autre">Autre</option>
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
                      Priorité
                    </span>
                    <select className="glass-input" defaultValue="medium">
                      <option value="low">Faible</option>
                      <option value="medium">Normale</option>
                      <option value="high">Urgente</option>
                    </select>
                  </label>
                </div>
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--gray-500)" }}>
                    Message
                  </span>
                  <textarea
                    className="glass-input"
                    rows={5}
                    placeholder="Décrivez votre demande en détail…"
                    style={{ resize: "vertical", height: "auto", padding: "12px 14px" }}
                  />
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" className="glass-btn ghost" onClick={() => setShowForm(false)}>
                    Annuler
                  </button>
                  <button type="button" className="glass-btn">
                    <Icon name="arrow-up-right" size={14} /> Envoyer
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel">
            <div className="glass-panelhead">
              <h3 style={{ margin: 0, fontSize: 14 }}>Vos tickets</h3>
              <span style={{ fontSize: 11, color: "var(--gray-500)" }}>
                {TICKETS.filter((t) => t.status !== "solved").length} ouverts ·{" "}
                {TICKETS.filter((t) => t.status === "solved").length} résolus
              </span>
            </div>
            <div style={{ padding: 16 }}>
              {TICKETS.map((t) => (
                <div key={t.id} className="ent-ticket">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "var(--navy-soft)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--navy)",
                      flex: "none",
                    }}
                  >
                    <Icon name="message-square" size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0A0E1F" }}>
                      {t.subject}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginTop: 3,
                        fontSize: 11.5,
                        color: "var(--gray-500)",
                      }}
                    >
                      <span className="ent-ticket-id">{t.ref}</span>
                      <span>·</span>
                      <span>Mis à jour {t.updated}</span>
                      <span>·</span>
                      <span>{t.messages} message{t.messages > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <span className={`ent-chip ${PRIORITY_CHIP[t.priority]}`}>
                    {t.priority === "high" ? "Urgente" : t.priority === "medium" ? "Normale" : "Faible"}
                  </span>
                  <span className={`ent-chip ${STATUS_CHIP[t.status].cls}`}>
                    {STATUS_CHIP[t.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ marginTop: 20 }}>
            <div className="glass-panelhead">
              <h3 style={{ margin: 0, fontSize: 14 }}>Questions fréquentes</h3>
            </div>
            <div style={{ padding: 16 }}>
              {FAQ.map((f) => (
                <details key={f.q} className="ent-faq-item">
                  <summary className="ent-faq-summary">
                    <span>{f.q}</span>
                    <span className="ent-faq-chev">
                      <Icon name="chevron-right" size={14} />
                    </span>
                  </summary>
                  <div className="ent-faq-body">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="glass-panel">
            <div className="glass-panelhead">
              <h3 style={{ margin: 0, fontSize: 14 }}>Votre chargée de compte</h3>
            </div>
            <div style={{ padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #233466, #3A4B8A)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                AL
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Amélie Legrand</div>
                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                  Chargée de compte Nova Cosmétique
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="button" className="glass-btn ghost" style={{ padding: "4px 10px" }}>
                    <Icon name="phone" size={12} /> Appeler
                  </button>
                  <button type="button" className="glass-btn ghost" style={{ padding: "4px 10px" }}>
                    <Icon name="mail" size={12} /> Écrire
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <div className="glass-panelhead">
              <h3 style={{ margin: 0, fontSize: 14 }}>Nous contacter</h3>
            </div>
            <div style={{ padding: 16, display: "grid", gap: 12, fontSize: 13 }}>
              <Row icon="mail" label="support@publeader.fr" />
              <Row icon="phone" label="+33 1 84 80 00 24" />
              <Row icon="clock" label="Lun-Ven · 9 h – 19 h" />
              <Row icon="map-pin" label="12 rue des Tournelles, 75004 Paris" />
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              background:
                "linear-gradient(140deg, rgba(236,64,122,0.12), rgba(168,85,247,0.1))",
            }}
          >
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                Urgence campagne en cours ?
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-500)", lineHeight: 1.5 }}>
                Une ligne dédiée 24/7 est disponible pour les incidents sur campagne active.
              </div>
              <button type="button" className="glass-btn" style={{ marginTop: 10 }}>
                <Icon name="phone" size={14} /> Ligne urgences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label }: { icon: "mail" | "phone" | "clock" | "map-pin"; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "var(--navy-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--navy)",
        }}
      >
        <Icon name={icon} size={13} />
      </div>
      <span>{label}</span>
    </div>
  );
}
