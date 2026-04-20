"use client";

/**
 * NotificationsSheet — right-side sheet with navy gradient header.
 * 1:1 port of glass-screens.jsx's <NotificationsSheet>.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { useUiState } from "@/contexts/UiStateContext";
import { NOTIFICATIONS, type NotificationItem } from "@/lib/data";

type FilterLabel = "Tous" | "Non lus" | "Campagnes" | "Paiements" | "Validations" | "Bornes";

const FILTERS: FilterLabel[] = ["Tous", "Non lus", "Campagnes", "Paiements", "Validations", "Bornes"];

const TYPE_MAP: Record<NotificationItem["type"], string> = {
  validation: "Validations",
  payment: "Paiements",
  campaign: "Campagnes",
  borne: "Bornes",
  system: "Système",
};

const COLOR_MAP: Record<NotificationItem["type"], { bg: string; fg: string }> = {
  validation: { bg: "rgba(14,165,233,0.12)", fg: "#0EA5E9" },
  payment: { bg: "rgba(34,197,94,0.12)", fg: "#16A34A" },
  campaign: { bg: "rgba(35,52,102,0.10)", fg: "var(--navy)" },
  borne: { bg: "rgba(217,119,6,0.12)", fg: "#D97706" },
  system: { bg: "rgba(217,70,70,0.12)", fg: "#B45309" },
};

type NotifRow = NotificationItem & { unread: boolean };

interface GroupProps {
  label: string;
  items: NotifRow[];
  onMarkOne: (id: string) => void;
}

function Group({ label, items, onMarkOne }: GroupProps) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          padding: "14px 24px 6px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "var(--gray-500)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {items.map((n) => {
        const c = COLOR_MAP[n.type] || COLOR_MAP.campaign;
        return (
          <div
            key={n.id}
            onClick={() => onMarkOne(n.id)}
            className="notif-row"
            style={{
              display: "flex",
              gap: 14,
              padding: "14px 24px",
              alignItems: "flex-start",
              cursor: "pointer",
              position: "relative",
              background: n.unread ? "rgba(35,52,102,0.04)" : "transparent",
              borderLeft: n.unread ? "3px solid var(--navy)" : "3px solid transparent",
              transition: "background 0.15s",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: c.bg,
                color: c.fg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={n.icon as IconName} size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: n.unread ? 700 : 600,
                  fontSize: 13.5,
                  marginBottom: 2,
                  color: "var(--navy)",
                  lineHeight: 1.35,
                }}
              >
                {n.title}
              </div>
              <div style={{ fontSize: 13, color: "var(--gray-600)", lineHeight: 1.45 }}>
                {n.body}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--gray-500)",
                  marginTop: 6,
                  fontWeight: 500,
                }}
              >
                {n.time}
              </div>
            </div>
            {n.unread && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--navy)",
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function NotificationsSheet() {
  const { notifOpen, closeNotifs } = useUiState();
  const [filter, setFilter] = useState<FilterLabel>("Tous");
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  // Escape to close
  useEffect(() => {
    if (!notifOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNotifs();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notifOpen, closeNotifs]);

  const allRows: NotifRow[] = NOTIFICATIONS.map((n) => ({
    ...n,
    unread: n.unread && !readIds.has(n.id),
  }));
  const rows =
    filter === "Tous"
      ? allRows
      : filter === "Non lus"
        ? allRows.filter((n) => n.unread)
        : allRows.filter((n) => TYPE_MAP[n.type] === filter);
  const unreadCount = allRows.filter((n) => n.unread).length;

  const markAllRead = () => setReadIds(new Set(NOTIFICATIONS.map((n) => n.id)));
  const markOne = (id: string) =>
    setReadIds((prev) => {
      const s = new Set(prev);
      s.add(id);
      return s;
    });

  // Group by day (heuristic mirroring prototype)
  const today: NotifRow[] = [];
  const yesterday: NotifRow[] = [];
  const earlier: NotifRow[] = [];
  rows.forEach((n) => {
    if (/min|h$| h /.test(n.time) && !/hier/i.test(n.time)) today.push(n);
    else if (/hier/i.test(n.time)) yesterday.push(n);
    else earlier.push(n);
  });

  return (
    <>
      <div
        className={"notif-backdrop" + (notifOpen ? " open" : "")}
        onClick={closeNotifs}
      />
      <aside
        className={"notif-sheet" + (notifOpen ? " open" : "")}
        role="dialog"
        aria-label="Notifications"
      >
        {/* Header — navy gradient panel */}
        <div className="notif-head">
          <button
            type="button"
            className="notif-close"
            onClick={closeNotifs}
            aria-label="Fermer"
          >
            <Icon name="x" size={16} />
          </button>
          <div className="notif-eyebrow">Activité · {unreadCount} non lus</div>
          <h2>Notifications</h2>
          <div className="notif-sub">Tout ce qui s&apos;est passé sur Publeader</div>
        </div>

        {/* Filter chips */}
        <div className="notif-filters">
          {FILTERS.map((f) => {
            const count =
              f === "Tous"
                ? allRows.length
                : f === "Non lus"
                  ? unreadCount
                  : allRows.filter((n) => TYPE_MAP[n.type] === f).length;
            return (
              <button
                key={f}
                type="button"
                className={"notif-chip" + (filter === f ? " active" : "")}
                onClick={() => setFilter(f)}
              >
                {f}
                {count > 0 && <span className="notif-chip-count">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="notif-list">
          {rows.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--gray-500)" }}>
              <Icon name="bell" size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>
                Rien à signaler
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Aucune notification dans cette catégorie.
              </div>
            </div>
          ) : (
            <>
              <Group label="Aujourd'hui" items={today} onMarkOne={markOne} />
              <Group label="Hier" items={yesterday} onMarkOne={markOne} />
              <Group label="Plus tôt" items={earlier} onMarkOne={markOne} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="notif-foot">
          <button
            type="button"
            className="glass-btn ghost compact"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <Icon name="check" size={14} /> Tout marquer comme lu
          </button>
          <Link
            href="/parametres"
            className="glass-btn compact"
            style={{ textDecoration: "none" }}
            onClick={closeNotifs}
          >
            <Icon name="settings" size={14} /> Préférences
          </Link>
        </div>
      </aside>
    </>
  );
}
