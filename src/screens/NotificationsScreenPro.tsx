"use client";

/**
 * NotificationsScreenPro — full-page notifications list.
 * 1:1 port of other-screens.jsx's <NotificationsScreen>.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { NOTIFICATIONS, type NotificationItem } from "@/lib/data";

type FilterLabel = "Tous" | "Non lus" | "Campagnes" | "Paiements" | "Validations" | "Bornes";

const FILTERS: { label: FilterLabel; match?: NotificationItem["type"]; unread?: boolean }[] = [
  { label: "Tous" },
  { label: "Non lus", unread: true },
  { label: "Validations", match: "validation" },
  { label: "Paiements", match: "payment" },
  { label: "Campagnes", match: "campaign" },
  { label: "Bornes", match: "borne" },
];

const typeColor: Record<NotificationItem["type"], string> = {
  validation: "#3B82F6",
  payment: "#43A047",
  campaign: "#9C27B0",
  borne: "#8D6E63",
  system: "#737373",
};

export function NotificationsScreenPro() {
  const [filter, setFilter] = useState<FilterLabel>("Tous");
  const [items, setItems] = useState(NOTIFICATIONS);
  const f = FILTERS.find((x) => x.label === filter)!;
  const rows = items.filter((n) => {
    if (f.unread) return n.unread;
    if (f.match) return n.type === f.match;
    return true;
  });

  const markAllRead = () => setItems((s) => s.map((n) => ({ ...n, unread: false })));
  const markOne = (id: string) =>
    setItems((s) => s.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="subtitle">Historique des alertes et événements système.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={markAllRead}>
          <Icon name="check" size={16} /> Tout marquer lu
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map((x) => (
          <button
            key={x.label}
            type="button"
            className={"chip " + (filter === x.label ? "chip-filled-navy" : "chip-outline")}
            onClick={() => setFilter(x.label)}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="card card-flush">
        {rows.length === 0 && (
          <div className="empty" style={{ padding: 40 }}>
            <div className="empty-icon">
              <Icon name="bell" size={24} />
            </div>
            <h3>Rien à signaler</h3>
            <p>Aucune notification ne correspond à ce filtre.</p>
          </div>
        )}
        {rows.map((n) => (
          <div
            key={n.id}
            onClick={() => markOne(n.id)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "16px 20px",
              borderBottom: "1px solid var(--gray-100)",
              cursor: "pointer",
              background: n.unread ? "rgba(35,52,102,0.04)" : "transparent",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: typeColor[n.type],
                color: "#fff",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={n.icon} size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: "var(--gray-500)", flexShrink: 0 }}>
                  {n.time}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--gray-600)", marginTop: 2 }}>{n.body}</div>
            </div>
            {n.unread && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--navy)",
                  marginTop: 14,
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
