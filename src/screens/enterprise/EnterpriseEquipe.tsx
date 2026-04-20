"use client";

/**
 * EnterpriseEquipe — advertiser's team & access management.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Éditeur" | "Lecteur";
  lastSeen: string;
  avatar: string;
  status: "active" | "invited";
}

const TEAM: Member[] = [
  { id: "m1", name: "Marine Dupont", email: "marine@nova-cosmetique.fr", role: "Admin", lastSeen: "il y a 10 min", avatar: "MD", status: "active" },
  { id: "m2", name: "Thomas Girard", email: "thomas@nova-cosmetique.fr", role: "Éditeur", lastSeen: "hier", avatar: "TG", status: "active" },
  { id: "m3", name: "Sophie Martin", email: "sophie@nova-cosmetique.fr", role: "Éditeur", lastSeen: "il y a 3 j", avatar: "SM", status: "active" },
  { id: "m4", name: "Paul Lefèvre", email: "paul@nova-cosmetique.fr", role: "Lecteur", lastSeen: "il y a 1 sem.", avatar: "PL", status: "active" },
];

const INVITES: Member[] = [
  { id: "m5", name: "Camille Rousseau", email: "camille@nova-cosmetique.fr", role: "Éditeur", lastSeen: "Envoyé hier", avatar: "CR", status: "invited" },
  { id: "m6", name: "—", email: "agence@agence-com.fr", role: "Lecteur", lastSeen: "Envoyé il y a 3 j", avatar: "?", status: "invited" },
];

const ROLE_TONE: Record<Member["role"], string> = {
  Admin: "info",
  Éditeur: "paid",
  Lecteur: "draft",
};

export function EnterpriseEquipe() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Équipe
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            {TEAM.length} membres · {INVITES.length} invitations en attente
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="glass-btn ghost">
            <Icon name="download" size={14} /> Exporter
          </button>
          <button
            type="button"
            className="glass-btn"
            onClick={() => setInviteOpen((v) => !v)}
          >
            <Icon name="user-plus" size={14} /> Inviter
          </button>
        </div>
      </div>

      {inviteOpen && (
        <div className="glass-panel" style={{ marginBottom: 20 }}>
          <div className="glass-panelhead">
            <h3 style={{ margin: 0, fontSize: 14 }}>Nouvelle invitation</h3>
          </div>
          <div
            style={{
              padding: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto auto",
              gap: 10,
              alignItems: "end",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--gray-500)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Email
              </div>
              <input className="glass-input" placeholder="prenom.nom@entreprise.fr" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--gray-500)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Rôle
              </div>
              <select className="glass-input" defaultValue="editeur">
                <option value="admin">Admin</option>
                <option value="editeur">Éditeur</option>
                <option value="lecteur">Lecteur</option>
              </select>
            </div>
            <button type="button" className="glass-btn ghost" onClick={() => setInviteOpen(false)}>
              Annuler
            </button>
            <button type="button" className="glass-btn">
              <Icon name="mail" size={14} /> Envoyer
            </button>
          </div>
        </div>
      )}

      <div className="glass-kpigrid">
        {[
          { l: "Admins", v: TEAM.filter((m) => m.role === "Admin").length.toString(), s: "accès complet" },
          { l: "Éditeurs", v: TEAM.filter((m) => m.role === "Éditeur").length.toString(), s: "campagnes & assets" },
          { l: "Lecteurs", v: TEAM.filter((m) => m.role === "Lecteur").length.toString(), s: "consultation seule" },
          { l: "Invitations", v: INVITES.length.toString(), s: "en attente" },
        ].map((k) => (
          <div key={k.l} className="glass-kpi">
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--gray-500)",
              }}
            >
              {k.l}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 700,
                margin: "4px 0",
              }}
            >
              {k.v}
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{k.s}</div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ marginTop: 24 }}>
        <div className="glass-panelhead">
          <h3 style={{ margin: 0, fontSize: 14 }}>Membres actifs</h3>
        </div>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Dernière activité</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {TEAM.map((m) => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #EC407A, #A855F7)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {m.avatar}
                    </div>
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                  </div>
                </td>
                <td style={{ color: "var(--gray-500)" }}>{m.email}</td>
                <td>
                  <span className={`ent-chip ${ROLE_TONE[m.role]}`}>{m.role}</span>
                </td>
                <td style={{ fontSize: 12, color: "var(--gray-500)" }}>{m.lastSeen}</td>
                <td style={{ textAlign: "right" }}>
                  <button type="button" className="glass-btn ghost" style={{ padding: "4px 10px" }}>
                    <Icon name="more-horizontal" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-panel" style={{ marginTop: 24 }}>
        <div className="glass-panelhead">
          <h3 style={{ margin: 0, fontSize: 14 }}>Invitations en attente</h3>
        </div>
        <div style={{ padding: 16, display: "grid", gap: 10 }}>
          {INVITES.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                background: "rgba(255,255,255,0.6)",
                border: "1px dashed rgba(35,52,102,0.2)",
                borderRadius: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(35,52,102,0.08)",
                    color: "var(--gray-500)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  <Icon name="mail" size={14} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.email}</div>
                  <div style={{ fontSize: 11.5, color: "var(--gray-500)" }}>
                    {m.role} · {m.lastSeen}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" className="glass-btn ghost" style={{ padding: "4px 10px" }}>
                  Renvoyer
                </button>
                <button type="button" className="glass-btn ghost" style={{ padding: "4px 10px", color: "#B91C1C" }}>
                  <Icon name="x" size={12} /> Annuler
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
