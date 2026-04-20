"use client";

/**
 * Toaster — renders the global toast stack (prototype Toasts component).
 */

import { Icon } from "@/components/Icon";
import { useToast } from "@/contexts/ToastContext";

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={"toast " + (t.kind || "")}>
          <Icon
            name={t.kind === "success" ? "check-circle" : t.kind === "danger" ? "x-circle" : "info"}
            size={18}
            style={{
              color:
                t.kind === "success"
                  ? "var(--success)"
                  : t.kind === "danger"
                    ? "var(--danger)"
                    : "var(--navy)",
            }}
          />
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.desc && <div className="toast-desc">{t.desc}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
