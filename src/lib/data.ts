// Mock data for the Publeader admin prototype — ported from data.jsx.
// All identifiers kept identical so screens that reference `PUB.X` in the
// prototype behave the same here.

import type { IconName } from "@/components/Icon";

export interface DriverPending {
  id: string;
  name: string;
  city: string;
  since: string;
  docs: number[]; // 4 slots, 1 = present, 0 = missing
  vehicle: string;
  rating: number | null;
}

export interface DriverActive {
  id: string;
  name: string;
  city: string;
  camp: number;
  rating: number;
  km: number;
  vehicle: string;
  plate: string;
  status: "Actif" | "Pause";
}

export interface CompanyPending {
  id: string;
  name: string;
  sector: string;
  city: string;
  since: string;
  color: string;
}

export interface Campaign {
  id: string;
  brand: string;
  color: string;
  initials: string;
  company: string;
  type: "Flocage" | "Borne";
  city: string;
  period: string;
  drivers: [number | null, number | null];
  km: [number | null, number | null];
  rev: string;
  status: "active" | "completed" | "draft";
  progress: number;
}

export interface Borne {
  id: string;
  name: string;
  type: string;
  address: string;
  status: "En service" | "Maintenance" | "Hors ligne";
  refill: string;
  sprays: number;
  rev: string;
  alert: boolean;
  x: number; // percentage on the map placeholder
  y: number;
}

export interface ValidationItem {
  id: string;
  kind: "Chauffeur" | "Entreprise";
  name: string;
  since: string;
}

export interface CityCount {
  city: string;
  count: number;
}

export interface NotificationItem {
  id: string;
  type: "validation" | "payment" | "campaign" | "borne" | "system";
  icon: IconName;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

export const DRIVERS_PENDING: DriverPending[] = [
  { id: "d1", name: "Karim Benali", city: "Lyon", since: "il y a 2 h", docs: [1, 1, 1, 0], vehicle: "Peugeot 308 · AB-123-CD", rating: null },
  { id: "d2", name: "Sophie Martin", city: "Paris 11e", since: "il y a 5 h", docs: [1, 1, 0, 0], vehicle: "Renault Clio · EF-456-GH", rating: null },
  { id: "d3", name: "Mehdi Cherif", city: "Marseille", since: "hier", docs: [1, 1, 1, 1], vehicle: "Citroën C3 · IJ-789-KL", rating: null },
  { id: "d4", name: "Anaïs Dubois", city: "Toulouse", since: "hier", docs: [1, 1, 0, 1], vehicle: "Peugeot 2008 · MN-012-OP", rating: null },
];

export const DRIVERS_VALID: DriverActive[] = [
  { id: "v1", name: "Lucas Fontaine", city: "Lyon 3e", camp: 12, rating: 4.9, km: 18540, vehicle: "Peugeot 308", plate: "AZ-492-KR", status: "Actif" },
  { id: "v2", name: "Amélie Rousseau", city: "Bordeaux", camp: 9, rating: 4.8, km: 14220, vehicle: "Renault Captur", plate: "BG-281-LM", status: "Actif" },
  { id: "v3", name: "Thomas Girard", city: "Paris 15e", camp: 7, rating: 5.0, km: 11890, vehicle: "Dacia Duster", plate: "CH-374-NP", status: "Actif" },
  { id: "v4", name: "Nadia El-Amrani", city: "Lille", camp: 15, rating: 4.7, km: 22410, vehicle: "Peugeot 2008", plate: "DJ-019-QR", status: "Actif" },
  { id: "v5", name: "Paul Mercier", city: "Nantes", camp: 6, rating: 4.6, km: 9730, vehicle: "Citroën C4", plate: "EK-826-ST", status: "Pause" },
  { id: "v6", name: "Inès Moreau", city: "Lyon 7e", camp: 11, rating: 4.9, km: 17060, vehicle: "Renault Megane", plate: "FL-731-UV", status: "Actif" },
];

export const COMPANIES_PENDING: CompanyPending[] = [
  { id: "c1", name: "Nova Cosmétique", sector: "Beauté", city: "Paris 8e", since: "il y a 3 h", color: "#D946EF" },
  { id: "c2", name: "Château de Bellevue", sector: "Hôtellerie", city: "Bordeaux", since: "il y a 6 h", color: "#0EA5E9" },
];

export const CAMPAIGNS: Campaign[] = [
  { id: "k1", brand: "Renault Électrique", color: "#FDD835", initials: "R", company: "Renault France", type: "Flocage", city: "Lyon", period: "14 avr. → 14 mai", drivers: [4, 5], km: [1240, 2000], rev: "3 200 €", status: "active", progress: 62 },
  { id: "k2", brand: "Le Clos des Vignes", color: "#8D6E63", initials: "CV", company: "Le Clos des Vignes", type: "Borne", city: "Paris", period: "01 avr. → 30 avr.", drivers: [null, null], km: [null, null], rev: "1 820 €", status: "active", progress: 80 },
  { id: "k3", brand: "Maison Lavande", color: "#9C27B0", initials: "ML", company: "Maison Lavande", type: "Flocage", city: "Marseille", period: "20 avr. → 20 mai", drivers: [3, 3], km: [420, 1500], rev: "1 250 €", status: "active", progress: 28 },
  { id: "k4", brand: "Kalis Gym", color: "#E53935", initials: "KG", company: "Kalis Gym", type: "Borne", city: "Paris 11e", period: "15 avr. → 15 mai", drivers: [null, null], km: [null, null], rev: "940 €", status: "active", progress: 45 },
  { id: "k5", brand: "Artisan Boulanger", color: "#795548", initials: "AB", company: "Fédération Artisans", type: "Flocage", city: "Nantes", period: "02 avr. → 02 juin", drivers: [8, 8], km: [4120, 6000], rev: "5 800 €", status: "active", progress: 68 },
  { id: "k6", brand: "SoBio Market", color: "#43A047", initials: "SB", company: "SoBio Market SAS", type: "Flocage", city: "Lyon", period: "10 mar. → 10 avr.", drivers: [5, 5], km: [4800, 5000], rev: "2 000 €", status: "completed", progress: 100 },
  { id: "k7", brand: "Nova Cosmétique", color: "#EC407A", initials: "N", company: "Nova Cosmétique", type: "Flocage", city: "Paris", period: "22 avr. → 22 juin", drivers: [0, 6], km: [0, 3500], rev: "0 €", status: "draft", progress: 0 },
];

export const BORNES: Borne[] = [
  { id: "b1", name: "Le Sélect", type: "Bar", address: "12 rue Vavin, Paris 6e", status: "En service", refill: "il y a 3 j", sprays: 1840, rev: "480 €", alert: false, x: 32, y: 38 },
  { id: "b2", name: "Hôtel Central", type: "Hôtel", address: "Cours Mirabeau, Aix", status: "En service", refill: "il y a 1 j", sprays: 1210, rev: "320 €", alert: false, x: 70, y: 72 },
  { id: "b3", name: "Club Neon", type: "Nightclub", address: "Quai de la Loire, Paris 19e", status: "En service", refill: "il y a 8 j", sprays: 2010, rev: "540 €", alert: true, x: 38, y: 34 },
  { id: "b4", name: "FitZone", type: "Salle de sport", address: "Rue Rivet, Lyon", status: "Maintenance", refill: "il y a 12 j", sprays: 160, rev: "60 €", alert: true, x: 50, y: 58 },
  { id: "b5", name: "Brasserie Lina", type: "Restaurant", address: "Place du Parlement, Bordeaux", status: "En service", refill: "il y a 5 j", sprays: 1490, rev: "390 €", alert: false, x: 22, y: 70 },
  { id: "b6", name: "Le Perchoir", type: "Bar", address: "Rue de la Liberté, Nantes", status: "En service", refill: "hier", sprays: 1620, rev: "420 €", alert: false, x: 14, y: 54 },
  { id: "b7", name: "Studio Velvet", type: "Nightclub", address: "Cours Jean Jaurès, Toulouse", status: "Hors ligne", refill: "il y a 18 j", sprays: 0, rev: "0 €", alert: true, x: 40, y: 78 },
  { id: "b8", name: "Grand Hôtel Opéra", type: "Hôtel", address: "Place de l'Opéra, Paris 9e", status: "En service", refill: "il y a 2 j", sprays: 980, rev: "260 €", alert: false, x: 36, y: 36 },
];

export const VALIDATION_QUEUE: ValidationItem[] = [
  { id: "q1", kind: "Chauffeur", name: "Karim Benali", since: "il y a 2 h" },
  { id: "q2", kind: "Entreprise", name: "Nova Cosmétique", since: "il y a 3 h" },
  { id: "q3", kind: "Chauffeur", name: "Sophie Martin", since: "il y a 5 h" },
  { id: "q4", kind: "Chauffeur", name: "Mehdi Cherif", since: "hier" },
  { id: "q5", kind: "Entreprise", name: "Château de Bellevue", since: "hier" },
];

export const CITY_DIST: CityCount[] = [
  { city: "Paris", count: 38 },
  { city: "Lyon", count: 26 },
  { city: "Marseille", count: 18 },
  { city: "Bordeaux", count: 14 },
  { city: "Toulouse", count: 12 },
  { city: "Nantes", count: 10 },
  { city: "Lille", count: 8 },
];

export const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", type: "validation", icon: "shield-check", title: "Nouveau dossier chauffeur à valider", body: "Karim Benali a soumis ses documents.", time: "il y a 14 min", unread: true },
  { id: "n2", type: "payment", icon: "banknote", title: "Facture F-2026-0412 encaissée", body: "Paiement de 2 000 € reçu de SoBio Market SAS.", time: "il y a 1 h", unread: true },
  { id: "n3", type: "campaign", icon: "megaphone", title: "Campagne « Le Clos des Vignes » démarre demain", body: "3 bornes assignées — prêtes à diffuser.", time: "il y a 2 h", unread: true },
  { id: "n4", type: "borne", icon: "spray-can", title: "Parfum bas — Club Neon", body: "Flacon #3 à 12 %. Planifier un refill.", time: "il y a 4 h", unread: false },
  { id: "n5", type: "system", icon: "alert-triangle", title: "Export comptable — mars 2026", body: "Le rapport mensuel a été généré.", time: "hier", unread: false },
  { id: "n6", type: "validation", icon: "shield-check", title: "Entreprise validée", body: "Château de Bellevue est désormais client actif.", time: "hier", unread: false },
];

export const brandBg = (hex: string) => hex;

/** Aggregate export for callers that used the prototype's `PUB` global. */
export const PUB = {
  DRIVERS_PENDING,
  DRIVERS_VALID,
  COMPANIES_PENDING,
  CAMPAIGNS,
  BORNES,
  VALIDATION_QUEUE,
  CITY_DIST,
  NOTIFICATIONS,
  brandBg,
};
