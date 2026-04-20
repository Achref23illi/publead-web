"use client";

/**
 * Topbar — pro UI top chrome. 1:1 port of shell.jsx's <Topbar>.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useUiState } from "@/contexts/UiStateContext";
import type { BreadcrumbItem } from "@/lib/nav";

interface TopbarProps {
  title: string;
  breadcrumb?: BreadcrumbItem[] | null;
}

export function Topbar({ title, breadcrumb }: TopbarProps) {
  const router = useRouter();
  const { openCmdk, openNotifs } = useUiState();

  return (
    <header className="topbar">
      <div className="topbar-title">
        {breadcrumb && (
          <div className="breadcrumb">
            {breadcrumb.map((b, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <Icon name="chevron-right" size={12} />}
                {b.href ? <Link href={b.href}>{b.label}</Link> : <span>{b.label}</span>}
              </span>
            ))}
          </div>
        )}
        <h1>{title}</h1>
      </div>
      <button type="button" className="cmdk-trigger" onClick={openCmdk}>
        <Icon name="search" size={16} />
        <span>Rechercher une entreprise, un chauffeur, une campagne…</span>
        <kbd>⌘K</kbd>
      </button>
      <div className="topbar-actions">
        <button
          type="button"
          className="btn btn-primary compact"
          onClick={() => router.push("/campagnes/new")}
        >
          <Icon name="plus" size={16} /> Nouvelle campagne
        </button>
        <button type="button" className="icon-btn" onClick={openNotifs}>
          <Icon name="bell" size={18} />
          <span className="red-dot" />
        </button>
        <button type="button" className="icon-btn">
          <Icon name="help-circle" size={18} />
        </button>
        <div className="topbar-avatar">CL</div>
      </div>
    </header>
  );
}
