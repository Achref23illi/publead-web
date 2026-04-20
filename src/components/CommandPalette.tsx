"use client";

/**
 * CommandPalette — ⌘K palette. 1:1 port of shell.jsx's <CmdK>.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { useUiState } from "@/contexts/UiStateContext";

interface Entry {
  type: "action" | "jump" | "entity";
  icon: IconName;
  label: string;
  desc?: string;
  kbd?: string;
  go?: string;
}

const actions: Entry[] = [
  { type: "action", icon: "plus", label: "Nouvelle campagne", desc: "Créer une campagne depuis un contrat", go: "/campagnes/new" },
  { type: "action", icon: "shield-check", label: "Valider un chauffeur", desc: "Ouvrir la file d'attente", go: "/validations" },
  { type: "action", icon: "download", label: "Exporter les factures du mois", desc: "CSV · mars 2026" },
];

const jumps: Entry[] = [
  { type: "jump", icon: "layout-dashboard", label: "Vue d'ensemble", kbd: "G D", go: "/" },
  { type: "jump", icon: "shield-check", label: "Validations", kbd: "G V", go: "/validations" },
  { type: "jump", icon: "car", label: "Chauffeurs", kbd: "G C", go: "/chauffeurs" },
  { type: "jump", icon: "building-2", label: "Entreprises", kbd: "G E", go: "/entreprises" },
  { type: "jump", icon: "megaphone", label: "Campagnes", kbd: "G K", go: "/campagnes" },
  { type: "jump", icon: "spray-can", label: "Leader Bornes", kbd: "G B", go: "/bornes" },
  { type: "jump", icon: "banknote", label: "Finances", kbd: "G F", go: "/finances" },
];

const entities: Entry[] = [
  { type: "entity", icon: "building-2", label: "Nova Cosmétique", desc: "Entreprise · Paris 8e", go: "/entreprises" },
  { type: "entity", icon: "car", label: "Lucas Fontaine", desc: "Chauffeur · Lyon 3e", go: "/chauffeurs" },
  { type: "entity", icon: "megaphone", label: "Renault Électrique — Printemps 2026", desc: "Campagne · Flocage · active", go: "/campagnes/k1" },
];

export function CommandPalette() {
  const { cmdkOpen, closeCmdk } = useUiState();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (cmdkOpen) setTimeout(() => inputRef.current?.focus(), 20);
  }, [cmdkOpen]);

  const filter = (l: Entry[]) =>
    q.trim() === ""
      ? l
      : l.filter((i) => (i.label + " " + (i.desc || "")).toLowerCase().includes(q.toLowerCase()));

  const groups = [
    { title: "Actions rapides", items: filter(actions) },
    { title: "Aller à", items: filter(jumps) },
    { title: "Résultats", items: filter(entities) },
  ].filter((g) => g.items.length);
  const flat = groups.flatMap((g) => g.items);

  useEffect(() => {
    if (!cmdkOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCmdk();
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const item = flat[activeIdx];
        if (item?.go) {
          router.push(item.go);
          closeCmdk();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cmdkOpen, activeIdx, flat, router, closeCmdk]);

  useEffect(() => setActiveIdx(0), [q]);

  if (!cmdkOpen) return null;
  let idx = -1;
  return (
    <div className="cmdk-overlay" onClick={closeCmdk}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-wrap">
          <Icon name="search" size={18} style={{ color: "var(--gray-500)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tapez une commande ou recherchez…"
          />
          <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gray-500)" }}>
            ESC
          </kbd>
        </div>
        <div className="cmdk-body">
          {groups.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--gray-500)" }}>
              Aucun résultat
            </div>
          )}
          {groups.map((g) => (
            <div key={g.title}>
              <div className="cmdk-group-title">{g.title}</div>
              {g.items.map((item) => {
                idx++;
                const isActive = idx === activeIdx;
                return (
                  <div
                    key={item.label}
                    className={"cmdk-item" + (isActive ? " active" : "")}
                    onClick={() => {
                      if (item.go) {
                        router.push(item.go);
                        closeCmdk();
                      }
                    }}
                  >
                    <Icon name={item.icon} size={16} style={{ color: "var(--gray-600)" }} />
                    <span>{item.label}</span>
                    {item.desc && (
                      <span
                        className="cm-desc"
                        style={{ color: "var(--gray-500)", fontSize: 12, marginLeft: 6 }}
                      >
                        · {item.desc}
                      </span>
                    )}
                    {item.kbd && <kbd>{item.kbd}</kbd>}
                    {isActive && (
                      <Icon name="arrow-right" size={14} style={{ color: "var(--navy)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
