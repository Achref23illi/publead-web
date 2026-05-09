"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";
import { authClient } from "@/lib/auth-client";

export function PersonalData() {
  const { pushToast } = useToast();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/me/gdpr/export", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        pushToast({ kind: "danger", title: "Export échoué" });
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] ?? "donnees.zip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushToast({ kind: "success", title: "Export téléchargé" });
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== "SUPPRIMER") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/me/gdpr/delete", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        pushToast({
          kind: "danger",
          title: "Suppression échouée",
          desc: d.message ?? d.error ?? "—",
        });
        return;
      }
      // Server already revoked sessions; force a client-side sign-out for
      // good measure, then send the user to the login page.
      try {
        await authClient.signOut();
      } catch {
        /* session already gone */
      }
      pushToast({
        kind: "success",
        title: "Compte anonymisé",
        desc: "Vos données personnelles ont été supprimées.",
      });
      router.replace("/login");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mes données personnelles</h1>
          <p className="subtitle">
            Droits d&apos;accès et d&apos;effacement (RGPD Art. 15 + Art. 17).
          </p>
        </div>
      </div>

      <div className="grid grid-12" style={{ gap: 20 }}>
        <div className="col-6">
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--gray-200)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15 }}>
              <Icon name="download" size={16} /> Télécharger mes données
            </h3>
            <p style={{ fontSize: 13, color: "var(--gray-600)", margin: "8px 0 16px" }}>
              Une archive ZIP contenant toutes les informations que Publeader détient sur vous,
              au format JSON par ressource (profil, transactions, factures, documents, etc.).
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={exportData}
              disabled={exporting}
            >
              {exporting ? "Préparation…" : "Télécharger ZIP"}
            </button>
          </div>
        </div>

        <div className="col-6">
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--danger-soft, #fee2e2)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, color: "var(--danger)" }}>
              <Icon name="trash" size={16} /> Supprimer mon compte
            </h3>
            <p style={{ fontSize: 13, color: "var(--gray-600)", margin: "8px 0 16px" }}>
              Action irréversible. Vos informations personnelles seront anonymisées.
              Les enregistrements financiers (factures, transactions) sont conservés
              10 ans pour répondre aux obligations comptables, mais ne sont plus
              attribuables à votre identité.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
              onClick={() => setShowDelete(true)}
            >
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>

      {showDelete && (
        <div
          className="cmdk-overlay"
          onClick={() => !deleting && setShowDelete(false)}
          style={{ alignItems: "center" }}
        >
          <div
            className="cmdk"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, padding: 20 }}
          >
            <h3 style={{ margin: "0 0 4px", color: "var(--danger)" }}>
              Confirmer la suppression
            </h3>
            <p style={{ margin: "0 0 16px", color: "var(--gray-600)", fontSize: 13 }}>
              Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous. Cette action est
              irréversible.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              autoFocus
              style={{
                display: "block",
                width: "100%",
                marginBottom: 16,
                border: "1px solid var(--gray-300)",
                borderRadius: 8,
                padding: "8px 10px",
                textTransform: "uppercase",
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowDelete(false)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "var(--danger)" }}
                disabled={deleting || confirmText.trim().toUpperCase() !== "SUPPRIMER"}
                onClick={deleteAccount}
              >
                {deleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
