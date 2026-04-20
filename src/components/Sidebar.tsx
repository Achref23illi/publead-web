"use client";

/**
 * Sidebar — pro UI classic navy sidebar. 1:1 port of shell.jsx's <Sidebar>.
 * Uses Next.js <Link> for client-side navigation instead of href-based hash
 * routing.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { NAV, navIdForPath, type NavEntry, type NavItem } from "@/lib/nav";
import { useTheme } from "@/contexts/ThemeContext";

function isNavItem(e: NavEntry): e is NavItem {
  return (e as NavItem).id !== undefined;
}

export function Sidebar() {
  const pathname = usePathname();
  const current = navIdForPath(pathname || "/");
  const { sidebarCollapsed: collapsed, setSidebarCollapsed } = useTheme();

  return (
    <aside className={"sidebar" + (collapsed ? " collapsed" : "")}>
      <div className="sidebar-header">
        {collapsed ? (
          <div className="monogram">PL</div>
        ) : (
          <div className="wordmark">PUBLEADER</div>
        )}
      </div>
      <nav className="sidebar-nav">
        {NAV.map((item, i) => {
          if ("divider" in item) return <div key={`d${i}`} style={{ height: 12 }} />;
          if ("caption" in item) {
            return !collapsed ? (
              <div key={`c${i}`} className="nav-caption">
                {item.caption}
              </div>
            ) : null;
          }
          if (!isNavItem(item)) return null;
          const active = item.id === current;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={"nav-item" + (active ? " active" : "")}
            >
              <Icon name={item.icon} size={20} />
              {!collapsed && <span className="nav-label">{item.label}</span>}
              {!collapsed && item.badge != null && (
                <span className={"nav-badge" + (item.urgent ? " urgent" : "")}>{item.badge}</span>
              )}
            </Link>
          );
        })}
        <div style={{ height: 16 }} />
        <Link
          href="/parametres"
          className={"nav-item" + (current === "settings" ? " active" : "")}
        >
          <Icon name="settings" size={20} />
          {!collapsed && <span className="nav-label">Paramètres</span>}
        </Link>
      </nav>
      <div className="sidebar-footer">
        <button
          type="button"
          className="collapse-btn"
          onClick={() => setSidebarCollapsed(!collapsed)}
        >
          <Icon name={collapsed ? "chevrons-right" : "chevrons-left"} size={16} />
          {!collapsed && <span>Réduire</span>}
        </button>
        <div className="user-row">
          <div className="avatar">CL</div>
          {!collapsed && (
            <>
              <div className="user-meta">
                <div className="user-name">Claire Lemoine</div>
                <div className="user-role">Admin · Ops</div>
              </div>
              <Icon name="chevron-down" size={16} style={{ opacity: 0.6 }} />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
