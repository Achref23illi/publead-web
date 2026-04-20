"use client";

/**
 * UiStateContext — holds the global UI chrome state that used to live in App():
 *   - command palette open/close
 *   - notifications sheet open/close
 *   - tweaks panel open/close (internal dev toggle)
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface UiStateValue {
  cmdkOpen: boolean;
  openCmdk: () => void;
  closeCmdk: () => void;
  notifOpen: boolean;
  openNotifs: () => void;
  closeNotifs: () => void;
  tweaksOpen: boolean;
  setTweaksOpen: (v: boolean) => void;
}

const UiStateContext = createContext<UiStateValue | null>(null);

export function UiStateProvider({ children }: { children: ReactNode }) {
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const openCmdk = useCallback(() => setCmdkOpen(true), []);
  const closeCmdk = useCallback(() => setCmdkOpen(false), []);
  const openNotifs = useCallback(() => setNotifOpen(true), []);
  const closeNotifs = useCallback(() => setNotifOpen(false), []);

  // ⌘K / Ctrl-K global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdkOpen(true);
      }
      if (e.key === "Escape") setCmdkOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo<UiStateValue>(
    () => ({
      cmdkOpen,
      openCmdk,
      closeCmdk,
      notifOpen,
      openNotifs,
      closeNotifs,
      tweaksOpen,
      setTweaksOpen,
    }),
    [cmdkOpen, openCmdk, closeCmdk, notifOpen, openNotifs, closeNotifs, tweaksOpen],
  );

  return <UiStateContext.Provider value={value}>{children}</UiStateContext.Provider>;
}

export function useUiState() {
  const ctx = useContext(UiStateContext);
  if (!ctx) throw new Error("useUiState must be used inside <UiStateProvider>");
  return ctx;
}
