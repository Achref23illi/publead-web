// Centralised navigation map — keeps route labels, hrefs, and IDs aligned
// between the sidebar, the glass pill nav, breadcrumbs, and the command
// palette. Mirrors the structure from shell.jsx.

import type { IconName } from "@/components/Icon";

export type NavId =
  | "dashboard"
  | "validations"
  | "drivers"
  | "companies"
  | "campaigns"
  | "bornes"
  | "finances"
  | "reports"
  | "notifications"
  | "documents"
  | "ads"
  | "partner_payouts"
  | "withdrawals"
  | "stock"
  | "users"
  | "audit"
  | "platform_settings"
  | "settings";

export interface NavItem {
  id: NavId;
  label: string;
  icon: IconName;
  href: string;
  badge?: number;
  urgent?: boolean;
}

export interface NavDivider {
  divider: true;
}

export interface NavCaption {
  caption: string;
}

export type NavEntry = NavItem | NavDivider | NavCaption;

export const NAV: NavEntry[] = [
  { id: "dashboard", label: "Vue d'ensemble", icon: "layout-dashboard", href: "/" },
  { id: "validations", label: "Validations", icon: "shield-check", href: "/validations", badge: 16, urgent: true },
  { id: "drivers", label: "Chauffeurs", icon: "car", href: "/chauffeurs" },
  { id: "companies", label: "Entreprises", icon: "building-2", href: "/entreprises" },
  { divider: true },
  { caption: "PRODUITS" },
  { id: "campaigns", label: "Campagnes", icon: "megaphone", href: "/campagnes", badge: 9 },
  { id: "bornes", label: "Leader Bornes", icon: "spray-can", href: "/bornes" },
  { id: "ads", label: "Publicités", icon: "tv", href: "/publicites" },
  { divider: true },
  { caption: "OPÉRATIONS" },
  { id: "documents", label: "Documents", icon: "file-text", href: "/documents" },
  { id: "stock", label: "Stock", icon: "package", href: "/stock" },
  { id: "withdrawals", label: "Retraits", icon: "banknote", href: "/retraits" },
  { id: "partner_payouts", label: "Paiements partenaires", icon: "credit-card", href: "/paiements-partenaires" },
  { divider: true },
  { id: "finances", label: "Finances", icon: "banknote", href: "/finances" },
  { id: "reports", label: "Rapports", icon: "bar-chart-3", href: "/rapports" },
  { id: "notifications", label: "Notifications", icon: "bell", href: "/notifications", badge: 3 },
  { divider: true },
  { caption: "ADMIN" },
  { id: "users", label: "Utilisateurs", icon: "users", href: "/utilisateurs" },
  { id: "audit", label: "Audit log", icon: "file-text", href: "/audit" },
  { id: "platform_settings", label: "Paramètres plateforme", icon: "sliders", href: "/parametres-plateforme" },
];

/** Map Next.js pathname → NavId used by active-state highlighting. */
export function navIdForPath(pathname: string): NavId {
  if (pathname === "/" || pathname === "") return "dashboard";
  if (pathname.startsWith("/validations")) return "validations";
  if (pathname.startsWith("/chauffeurs")) return "drivers";
  if (pathname.startsWith("/entreprises")) return "companies";
  if (pathname.startsWith("/campagnes")) return "campaigns";
  if (pathname.startsWith("/bornes")) return "bornes";
  if (pathname.startsWith("/publicites")) return "ads";
  if (pathname.startsWith("/documents")) return "documents";
  if (pathname.startsWith("/stock")) return "stock";
  if (pathname.startsWith("/retraits")) return "withdrawals";
  if (pathname.startsWith("/paiements-partenaires")) return "partner_payouts";
  if (pathname.startsWith("/finances")) return "finances";
  if (pathname.startsWith("/rapports")) return "reports";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/utilisateurs")) return "users";
  if (pathname.startsWith("/audit")) return "audit";
  if (pathname.startsWith("/parametres-plateforme")) return "platform_settings";
  if (pathname.startsWith("/parametres")) return "settings";
  return "dashboard";
}

/** Human page title shown in the topbar, matches the prototype. */
export function titleForPath(pathname: string, campaignName?: string): string {
  if (pathname === "/" || pathname === "") return "Vue d'ensemble";
  if (pathname.startsWith("/validations")) return "Validations";
  if (pathname.startsWith("/chauffeurs")) return "Chauffeurs";
  if (pathname.startsWith("/entreprises")) return "Entreprises";
  if (pathname === "/campagnes") return "Campagnes";
  if (pathname === "/campagnes/new") return "Nouvelle campagne";
  if (pathname.startsWith("/campagnes/")) return campaignName || "Campagne";
  if (pathname.startsWith("/bornes")) return "Leader Bornes";
  if (pathname.startsWith("/publicites")) return "Publicités";
  if (pathname.startsWith("/documents")) return "Documents";
  if (pathname.startsWith("/stock")) return "Stock";
  if (pathname.startsWith("/retraits")) return "Retraits";
  if (pathname.startsWith("/paiements-partenaires")) return "Paiements partenaires";
  if (pathname.startsWith("/finances")) return "Finances";
  if (pathname.startsWith("/rapports")) return "Rapports";
  if (pathname.startsWith("/notifications")) return "Notifications";
  if (pathname.startsWith("/utilisateurs")) return "Utilisateurs";
  if (pathname.startsWith("/audit")) return "Audit log";
  if (pathname.startsWith("/parametres-plateforme")) return "Paramètres plateforme";
  if (pathname.startsWith("/parametres")) return "Paramètres";
  return "Vue d'ensemble";
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function breadcrumbForPath(
  pathname: string,
  campaignName?: string,
): BreadcrumbItem[] | null {
  if (pathname === "/campagnes/new") {
    return [{ label: "Campagnes", href: "/campagnes" }, { label: "Nouvelle" }];
  }
  if (pathname.startsWith("/campagnes/") && pathname !== "/campagnes/new") {
    return [
      { label: "Campagnes", href: "/campagnes" },
      { label: campaignName || "Campagne" },
    ];
  }
  return null;
}
