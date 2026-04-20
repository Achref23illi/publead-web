"use client";

/**
 * ValidationsPro — pro UI Validations screen.
 * 1:1 port of login-validations.jsx's <Validations>, <RejectModal>, <DriverSheet>.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";
import { DRIVERS_PENDING, COMPANIES_PENDING, type DriverPending, type CompanyPending } from "@/lib/data";

type PendingRow = DriverPending | CompanyPending;

function isDriver(r: PendingRow): r is DriverPending {
  return (r as DriverPending).vehicle !== undefined;
}

interface RejectModalProps {
  row: PendingRow;
  onClose: () => void;
  onSubmit: () => void;
}

function RejectModal({ row, onClose, onSubmit }: RejectModalProps) {
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal">
        <div className="modal-header">
          <h3>Refuser ce dossier</h3>
        </div>
        <div className="modal-body">
          <p style={{ margin: "0 0 16px", color: "var(--gray-600)" }}>
            Vous êtes sur le point de refuser <strong>{row.name}</strong>. L&apos;utilisateur
            recevra une notification par email.
          </p>
          <div className="input-group">
            <label className="input-label">Motif de refus</label>
            <select className="select">
              <option>Documents incomplets</option>
              <option>Véhicule non conforme</option>
              <option>Suspicion de fraude</option>
              <option>Autre</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Note (optionnel)</label>
            <textarea className="textarea" placeholder="Précisez pour l'équipe…" />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn btn-danger" onClick={onSubmit}>
            Confirmer le refus
          </button>
        </div>
      </div>
    </>
  );
}

interface DriverSheetProps {
  row: PendingRow;
  onClose: () => void;
}

function DriverSheet({ row, onClose }: DriverSheetProps) {
  const [tab, setTab] = useState<"profile" | "vehicle" | "docs" | "campaigns" | "payments">("profile");
  const driver = isDriver(row) ? row : null;

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-header">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              className="avatar-initials"
              style={{ width: 64, height: 64, fontSize: 22 }}
            >
              {row.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>
                {row.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span className="chip chip-warning">
                  <span className="dot" /> En attente
                </span>
                <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                  Inscrit {row.since}
                </span>
              </div>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ borderBottom: "1px solid var(--gray-200)", padding: "0 24px" }}>
          <div className="tabs" style={{ marginBottom: 0, border: "none" }}>
            {(
              [
                ["profile", "Profil"],
                ["vehicle", "Véhicule"],
                ["docs", "Documents"],
                ["campaigns", "Campagnes"],
                ["payments", "Paiements"],
              ] as const
            ).map(([k, l]) => (
              <div
                key={k}
                className={"tab" + (tab === k ? " active" : "")}
                onClick={() => setTab(k)}
              >
                {l}
              </div>
            ))}
          </div>
        </div>
        <div className="sheet-body">
          {tab === "docs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "Permis de conduire", date: "14 avr. 2026", ok: true },
                { name: "Carte grise", date: "14 avr. 2026", ok: true },
                { name: "Attestation assurance", date: "14 avr. 2026", ok: true },
                { name: "Photos du véhicule", date: "—", ok: false },
              ].map((d) => (
                <div
                  key={d.name}
                  className="file-tile"
                  style={{ justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <div className="file-thumb">
                      <Icon name={d.ok ? "file-text" : "upload-cloud"} size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                        {d.ok ? "Déposé le " + d.date : "Non déposé"}
                      </div>
                    </div>
                  </div>
                  {d.ok && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost compact"
                        style={{ color: "var(--success)" }}
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost compact btn-danger-ghost"
                      >
                        Redemander
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {tab === "profile" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                ["Téléphone", "+33 6 12 34 56 78"],
                ["Email", row.name.toLowerCase().replace(" ", ".") + "@gmail.com"],
                ["Adresse", "42 rue de la République, " + (row.city || "Lyon")],
                ["Date de naissance", "12/03/1989"],
                ["IBAN", "FR76 1027 •••• •••• 8832"],
                ["Note moyenne", "—"],
              ].map(([l, v]) => (
                <div key={l}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--gray-500)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {l}
                  </div>
                  <div style={{ fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {tab === "vehicle" && (
            <div>
              <div className="placeholder-img" style={{ height: 180, marginBottom: 16 }}>
                photo véhicule
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div className="input-label">Modèle</div>
                  <div style={{ fontWeight: 600 }}>
                    {driver?.vehicle?.split(" · ")[0] || "Peugeot 308"}
                  </div>
                </div>
                <div>
                  <div className="input-label">Plaque</div>
                  <div style={{ fontWeight: 600 }}>
                    {driver?.vehicle?.split(" · ")[1] || "AB-123-CD"}
                  </div>
                </div>
                <div>
                  <div className="input-label">Année</div>
                  <div>2022</div>
                </div>
                <div>
                  <div className="input-label">Couleur</div>
                  <div>Blanc nacré</div>
                </div>
              </div>
            </div>
          )}
          {tab === "campaigns" && (
            <div className="empty">
              <div className="empty-icon">
                <Icon name="megaphone" size={24} />
              </div>
              <h3>Aucune campagne</h3>
              <p>Ce chauffeur n&apos;a pas encore été assigné.</p>
            </div>
          )}
          {tab === "payments" && (
            <div className="empty">
              <div className="empty-icon">
                <Icon name="banknote" size={24} />
              </div>
              <h3>Pas de paiements</h3>
              <p>L&apos;historique apparaîtra ici après activation.</p>
            </div>
          )}
        </div>
        <div className="sheet-footer">
          <button type="button" className="btn btn-ghost btn-danger-ghost">
            Suspendre le compte
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary">
              Fermer
            </button>
            <button type="button" className="btn btn-primary">
              Modifier
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function ValidationsPro() {
  const { pushToast } = useToast();
  const [tab, setTab] = useState<"chauffeurs" | "entreprises">("chauffeurs");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<PendingRow | null>(null);
  const [detail, setDetail] = useState<PendingRow | null>(null);

  const rows: PendingRow[] = tab === "chauffeurs" ? DRIVERS_PENDING : COMPANIES_PENDING;
  const toggleSel = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const onValidate = (name: string) => {
    pushToast({ kind: "success", title: "Dossier validé", desc: name + " est désormais actif." });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Validations</h1>
          <p className="subtitle">Vérifiez les dossiers en attente avant activation.</p>
        </div>
      </div>

      <div className="tabs">
        <div
          className={"tab" + (tab === "chauffeurs" ? " active" : "")}
          onClick={() => setTab("chauffeurs")}
        >
          Chauffeurs <span className="tab-count">12</span>
        </div>
        <div
          className={"tab" + (tab === "entreprises" ? " active" : "")}
          onClick={() => setTab("entreprises")}
        >
          Entreprises <span className="tab-count">4</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {(
            [
              ["pending", "En attente", 12],
              ["approved", "Validés", 128],
              ["rejected", "Refusés", 7],
            ] as const
          ).map(([k, l, n]) => (
            <button
              key={k}
              type="button"
              className={"chip " + (status === k ? "chip-filled-navy" : "chip-outline")}
              onClick={() => setStatus(k)}
            >
              {l} <span style={{ opacity: 0.8, marginLeft: 4 }}>{n}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Icon
              name="search"
              size={14}
              style={{ position: "absolute", left: 12, top: 10, color: "var(--gray-500)" }}
            />
            <input
              className="input compact"
              placeholder="Rechercher par nom ou email…"
              style={{ paddingLeft: 34, width: 280, height: 36 }}
            />
          </div>
          <button
            type="button"
            className="icon-btn"
            style={{ border: "1px solid var(--gray-200)" }}
          >
            <Icon name="filter" size={16} />
          </button>
        </div>
      </div>

      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 44 }}></th>
              <th>{tab === "chauffeurs" ? "Chauffeur" : "Entreprise"}</th>
              <th>Ville</th>
              <th>Inscription</th>
              {tab === "chauffeurs" && <th>Documents</th>}
              {tab === "entreprises" && <th>Secteur</th>}
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => setDetail(r)}>
                <td onClick={(e) => e.stopPropagation()}>
                  <span
                    className={"checkbox " + (selected.includes(r.id) ? "checked" : "")}
                    onClick={() => toggleSel(r.id)}
                  >
                    {selected.includes(r.id) && <Icon name="check" size={12} />}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {tab === "chauffeurs" ? (
                      <div
                        className="avatar-initials"
                        style={{ width: 36, height: 36 }}
                      >
                        {r.name
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                    ) : (
                      <div
                        className="brand-logo"
                        style={{ background: (r as CompanyPending).color }}
                      >
                        {r.name[0]}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      {isDriver(r) && (
                        <div style={{ fontSize: 12, color: "var(--gray-500)" }}>
                          {r.vehicle}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>{r.city}</td>
                <td style={{ color: "var(--gray-500)" }}>{r.since}</td>
                {tab === "chauffeurs" && isDriver(r) && (
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="mini-bar">
                        {r.docs.map((d, i) => (
                          <span key={i} className={"seg" + (d ? " filled" : "")} />
                        ))}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--gray-500)" }}>
                        {r.docs.filter(Boolean).length}/4
                      </span>
                    </div>
                  </td>
                )}
                {tab === "entreprises" && !isDriver(r) && <td>{r.sector}</td>}
                <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    <button type="button" className="btn btn-ghost compact">
                      Voir dossier
                    </button>
                    <button
                      type="button"
                      className="btn btn-success compact"
                      onClick={() => onValidate(r.name)}
                    >
                      <Icon name="check" size={14} /> Valider
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger compact"
                      onClick={() => setRejectModal(r)}
                    >
                      <Icon name="x" size={14} /> Refuser
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.length > 0 && (
        <div className="sticky-actions">
          <div style={{ fontWeight: 600 }}>
            {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelected([])}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-danger compact"
              onClick={() => {
                pushToast({
                  kind: "danger",
                  title: "Dossiers refusés",
                  desc: selected.length + " refus envoyés.",
                });
                setSelected([]);
              }}
            >
              Refuser la sélection
            </button>
            <button
              type="button"
              className="btn btn-success compact"
              onClick={() => {
                pushToast({
                  kind: "success",
                  title: "Dossiers validés",
                  desc: selected.length + " comptes activés.",
                });
                setSelected([]);
              }}
            >
              Valider la sélection
            </button>
          </div>
        </div>
      )}

      {rejectModal && (
        <RejectModal
          row={rejectModal}
          onClose={() => setRejectModal(null)}
          onSubmit={() => {
            pushToast({
              kind: "danger",
              title: "Dossier refusé",
              desc: "L'utilisateur a été notifié.",
            });
            setRejectModal(null);
          }}
        />
      )}
      {detail && <DriverSheet row={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
