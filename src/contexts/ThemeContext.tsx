"use client";

/**
 * ThemeContext — replaces the prototype's TWEAKS object.
 *
 * Controls which UI style is rendered:
 *  - "glass" = rond, vitré
 *  - "pro"   = navy classique (sidebar + topbar)
 *
 * Also exposes a dashboardStyle setting (only used when uiStyle === "pro")
 * and sidebarCollapsed for the pro shell.
 *
 * State is persisted in localStorage under `publeader_theme`. We keep the
 * same top-level keys as the prototype's TWEAKS so tooling stays compatible.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type UiStyle = "glass" | "pro";
export type DashboardStyle = "glass" | "pro";
export type Density = "comfortable" | "compact";

export interface Tweaks {
  uiStyle: UiStyle;
  dashboardStyle: DashboardStyle;
  sidebarCollapsed: boolean;
  density: Density;
  showTweaksByDefault: boolean;
}

const DEFAULT_TWEAKS: Tweaks = {
  uiStyle: (process.env.NEXT_PUBLIC_DEFAULT_UI_STYLE as UiStyle) || "glass",
  dashboardStyle: (process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_STYLE as DashboardStyle) || "glass",
  sidebarCollapsed: false,
  density: "comfortable",
  showTweaksByDefault: false,
};

const STORAGE_KEY = "publeader_theme";

interface ThemeContextValue extends Tweaks {
  setUiStyle: (v: UiStyle) => void;
  setDashboardStyle: (v: DashboardStyle) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setDensity: (v: Density) => void;
  resetTweaks: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Tweaks>;
        setTweaks((t) => ({ ...t, ...parsed }));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist on change (once hydrated, to avoid overwriting stored prefs on first paint)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
    } catch {
      /* ignore */
    }
  }, [tweaks, hydrated]);

  const setUiStyle = useCallback((v: UiStyle) => setTweaks((t) => ({ ...t, uiStyle: v })), []);
  const setDashboardStyle = useCallback(
    (v: DashboardStyle) => setTweaks((t) => ({ ...t, dashboardStyle: v })),
    [],
  );
  const setSidebarCollapsed = useCallback(
    (v: boolean) => setTweaks((t) => ({ ...t, sidebarCollapsed: v })),
    [],
  );
  const setDensity = useCallback((v: Density) => setTweaks((t) => ({ ...t, density: v })), []);
  const resetTweaks = useCallback(() => setTweaks(DEFAULT_TWEAKS), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...tweaks,
      setUiStyle,
      setDashboardStyle,
      setSidebarCollapsed,
      setDensity,
      resetTweaks,
    }),
    [tweaks, setUiStyle, setDashboardStyle, setSidebarCollapsed, setDensity, resetTweaks],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
