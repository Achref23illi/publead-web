"use client";

/**
 * NotificationsScreenGlass — rond/vitré full notifications list.
 * Port of glass-screens.jsx's <NotificationsGlass>.
 */

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { NOTIFICATIONS, type NotificationItem } from "@/lib/data";

type FilterLabel = "Tous" | "Non lus" | "Validations" | "Paiements" | "Campagnes" | "Bornes";

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

export function NotificationsScreenGlass() {
  const [filter, setFilter] = useState<FilterLabel>("Tous");
  const [items, setItems] = useState(NOTIFICATIONS);
  const f = FILTERS.find((x) => x.label === filter)!;
  const rows = items.filter((n) => {
    if (f.unread) return n.unread;
    if (f.match) return n.type === f.match;
    return true;
  });

  return (
    <div className="glass-page">
      <div className="glass-pagehead">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0 }}>
            Notifications
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--gray-500)", fontSize: 13 }}>
            Alertes et événements.
          </p>
        </div>
        <button
          type="button"
          className="glass-btn"
          onClick={() => setItems((s) => s.map((n) => ({ ...n, unread: false })))}
        >
          <Icon name="check" size={14} /> Tout marquer lu
        </button>
      </div>

      <div className="glass-filterrow">
        {FILTERS.map((x) => (
          <button
            key={x.label}
            type="button"
            className={"glass-fpill" + (filter === x.label ? " active" : "")}
            onClick={() => setFilter(x.label)}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="glass-panel">
        {rows.length === 0 && (
          <div className="glass-empty">
            <Icon name="bell" size={28} />
            <h3>Rien à signaler</h3>
            <p>Aucune notification ne correspond à ce filtre.</p>
          </div>
        )}
        {rows.map((n) => (
          <div
            key={n.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "16px 20px",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
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
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: "var(--gray-500)" }}>{n.time}</div>
              </div>
              <div style={{ fontSize: 13, color: "var(--gray-600)", marginTop: 2 }}>{n.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
