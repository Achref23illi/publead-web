"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";
import type { AdminUserDTO } from "@/lib/user-serializer";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  driver: "Chauffeur",
  advertiser: "Annonceur",
  partner: "Partenaire",
  team_member: "Équipe",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function UsersAdmin() {
  const { pushToast } = useToast();
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [bannedFilter, setBannedFilter] = useState<"" | "true" | "false">("");
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [showBan, setShowBan] = useState<AdminUserDTO | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("");

  const reload = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/users", window.location.origin);
      if (search.trim()) url.searchParams.set("search", search.trim());
      if (role) url.searchParams.set("role", role);
      if (bannedFilter) url.searchParams.set("banned", bannedFilter);
      const r = await fetch(url.toString(), { credentials: "include" });
      const data = (await r.json()) as { users: AdminUserDTO[]; total: number };
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterIsActive = useMemo(
    () => Boolean(search.trim() || role || bannedFilter),
    [search, role, bannedFilter],
  );

  const submitBan = async () => {
    if (!showBan) return;
    setActionUserId(showBan.id);
    try {
      const expiresInSeconds = banDays
        ? Math.max(0, Math.floor(Number(banDays) * 86400))
        : undefined;
      const res = await fetch(`/api/admin/users/${showBan.id}/ban`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reason: banReason.trim() || undefined,
          expiresInSeconds,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        pushToast({
          kind: "danger",
          title: "Bannissement échoué",
          desc: d.message ?? d.error ?? "—",
        });
      } else {
        pushToast({
          kind: "success",
          title: "Utilisateur banni",
          desc: showBan.email,
        });
        setShowBan(null);
        setBanReason("");
        setBanDays("");
        await reload();
      }
    } finally {
      setActionUserId(null);
    }
  };

  const unban = async (u: AdminUserDTO) => {
    setActionUserId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/unban`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        pushToast({ kind: "success", title: "Bannissement levé", desc: u.email });
        await reload();
      } else {
        pushToast({ kind: "danger", title: "Levée du bannissement échouée" });
      }
    } finally {
      setActionUserId(null);
    }
  };

  const revoke = async (u: AdminUserDTO) => {
    if (!confirm(`Révoquer toutes les sessions de ${u.email} ?`)) return;
    setActionUserId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/revoke-sessions`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        pushToast({
          kind: "success",
          title: "Sessions révoquées",
          desc: u.email,
        });
      } else {
        pushToast({ kind: "danger", title: "Révocation échouée" });
      }
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Utilisateurs</h1>
          <p className="subtitle">
            {total} comptes · gérez bannissements et sessions actives.
          </p>
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
        <input
          type="search"
          placeholder="Email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && reload()}
          style={{
            border: "1px solid var(--gray-300)",
            borderRadius: 8,
            padding: "8px 10px",
            minWidth: 220,
          }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            border: "1px solid var(--gray-300)",
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          <option value="">Tous rôles</option>
          <option value="admin">Admin</option>
          <option value="driver">Chauffeur</option>
          <option value="advertiser">Annonceur</option>
          <option value="partner">Partenaire</option>
          <option value="team_member">Équipe</option>
        </select>
        <select
          value={bannedFilter}
          onChange={(e) =>
            setBannedFilter(e.target.value as "" | "true" | "false")
          }
          style={{
            border: "1px solid var(--gray-300)",
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          <option value="">Tous statuts</option>
          <option value="false">Actifs</option>
          <option value="true">Bannis</option>
        </select>
        <button type="button" className="btn btn-primary" onClick={reload}>
          <Icon name="refresh" size={14} /> Rechercher
        </button>
        {filterIsActive && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setSearch("");
              setRole("");
              setBannedFilter("");
              setTimeout(reload, 0);
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Banni</th>
              <th>Créé</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--gray-500)" }}>
                  Chargement…
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--gray-500)" }}>
                  Aucun utilisateur ne correspond.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div>
                    <div style={{ fontWeight: 600 }}>{u.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{u.email}</div>
                  </div>
                </td>
                <td>
                  <span className="chip chip-soft-navy">
                    {ROLE_LABEL[u.role ?? ""] ?? u.role ?? "—"}
                  </span>
                </td>
                <td>{u.status ?? "—"}</td>
                <td>
                  {u.banned ? (
                    <span className="chip chip-filled-warning" title={u.banReason ?? ""}>
                      Banni{u.banExpires ? ` · jusqu'au ${fmtDate(u.banExpires)}` : ""}
                    </span>
                  ) : (
                    <span className="chip chip-success">Actif</span>
                  )}
                </td>
                <td style={{ fontSize: 12, color: "var(--gray-500)" }}>
                  {fmtDate(u.createdAt)}
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    {u.banned ? (
                      <button
                        type="button"
                        className="btn btn-secondary compact"
                        disabled={actionUserId === u.id}
                        onClick={() => unban(u)}
                      >
                        <Icon name="check-circle" size={14} /> Débannir
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-ghost compact"
                        disabled={actionUserId === u.id}
                        onClick={() => setShowBan(u)}
                      >
                        <Icon name="x-circle" size={14} /> Bannir
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost compact"
                      disabled={actionUserId === u.id}
                      onClick={() => revoke(u)}
                      title="Force-logout"
                    >
                      <Icon name="log-out" size={14} /> Sessions
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBan && (
        <div
          className="cmdk-overlay"
          onClick={() => setShowBan(null)}
          style={{ alignItems: "center" }}
        >
          <div
            className="cmdk"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, padding: 20 }}
          >
            <h3 style={{ margin: "0 0 4px" }}>Bannir {showBan.email}</h3>
            <p style={{ margin: "0 0 16px", color: "var(--gray-500)", fontSize: 13 }}>
              L&apos;utilisateur ne pourra plus se connecter et ses sessions actives seront révoquées.
            </p>
            <label style={{ display: "block", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "var(--gray-600)" }}>Motif</span>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Optionnel"
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
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: "var(--gray-600)" }}>
                Durée (jours, vide = permanent)
              </span>
              <input
                type="number"
                min="0"
                value={banDays}
                onChange={(e) => setBanDays(e.target.value)}
                placeholder="ex. 7"
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
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowBan(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={actionUserId === showBan.id}
                onClick={submitBan}
              >
                Bannir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
