# Publeader Web — UI Test Guide

## Prerequisites

1. `npm run dev` running at http://localhost:3000 (or deployed URL)
2. Seed demo data once:
   ```bash
   npx tsx scripts/seed-users.ts
   npx tsx scripts/seed-companies.ts
   npx tsx scripts/seed-campaigns.ts
   npx tsx scripts/seed-terminals.ts
   npx tsx scripts/seed-ads.ts
   npx tsx scripts/seed-stock.ts
   npx tsx scripts/seed-revenue.ts
   npx tsx scripts/seed-validations.ts
   ```
3. `NEXT_PUBLIC_DEV_LOGIN=true` in `.env.local`
4. Fast login: go to `/dev-login` — click any role button

---

## Role 1 — Admin `admin@publeader.local`

Login → click **Admin** button at `/dev-login` → lands at `/`

### Dashboard `/`
- KPI cards: MRR, active campaigns, drivers, bornes
- Charts: revenue trend, campaign breakdown
- Recent activity feed
- **Toggle glass ↔ pro**: top-right settings icon or `/parametres` → Apparence

### Validations `/validations`
- Three tabs: **Chauffeurs**, **Entreprises**, **Partenaires**
- Each row shows pending dossier with status chip
- Click a row → detail sheet slides in (documents, profile info)
- Click **Approuver** → status flips to `validated`, row disappears from queue
- Click **Rejeter** → modal asks for reason
- Click **Demander infos** → sends info request

### Campagnes `/campagnes`
- Table of all campaigns (flocage + borne)
- Status chips: draft, upcoming, active, completed
- Click a row → detail page `/campagnes/[id]`
- Detail shows: brief, targeting, drivers assigned, impressions, schedule

### Nouvelle campagne `/campagnes/new`
- Fill: type (flocage/borne), title, brand, city, dates, budget
- Save as draft or publish directly

### Chauffeurs `/chauffeurs`
- Search/filter by name, status, city
- Click driver → profile sheet with tabs: **Profil**, **Véhicule**, **Documents**, **Campagnes**, **Paiements**
- Docs tab shows uploaded license/insurance with approve buttons

### Entreprises `/entreprises`
- List of advertiser companies
- Click → company detail with contact info, campaigns, invoices

### Bornes `/bornes`
- Fleet table + map view
- Each borne shows: code, partner, status (active/idle/fault), last heartbeat, cartridge levels
- Click borne → detail sheet with maintenance windows, ad schedules

### Finances `/finances`
- Tab **Factures**: invoice list, send button (emails PDF + Stripe link), status chips
- Tab **Commissions**: per-driver commission records
- Tab **Dépenses**: expense log

### Rapports `/rapports`
- Date range picker → select period
- Generate buttons: **Bilan financier**, **Annonceurs**, **Performance bornes**, **RGPD**
- Each generates a PDF and optionally uploads to Cloudinary
- Download link appears after generation

### Utilisateurs `/utilisateurs`
- List all users with role chips (admin/advertiser/driver/partner)
- Filter by role, status, banned
- Search by email
- Click user → edit role, ban/unban

### Retraits `/retraits`
- Queue of driver withdrawal requests
- Each row: driver name, amount, IBAN, status
- Buttons: **Marquer payé**, **Refuser**

### Stock `/stock`
- Stock order requests from partners
- Tabs: En attente / Livrées / Annulées
- Click **Refill** on pending order → modal: pick slot, scent, level → submit logs refill
- Click **Livrée** → marks order fulfilled
- Click **Refuser** → cancels order

### Audit `/audit`
- Chronological log of all admin actions
- Filter by action type (invoice.send, user.ban, campaign.publish, etc.)
- Each row: timestamp, actor, action, target

### Global search (Cmd+K / Ctrl+K)
- Type ≥2 chars → live results: drivers, campaigns, companies, bornes
- Arrow keys to navigate, Enter to jump

---

## Role 2 — Advertiser `advertiser@publeader.local`

Login → click **Annonceur** at `/dev-login` → lands at `/enterprise`

### Dashboard `/enterprise`
- KPI cards: impressions total, active campaigns, reach, km parcourus
- Recent campaigns list with status

### Campagnes `/enterprise/campagnes`
- List of own campaigns
- Status chips: draft / upcoming / active / completed
- Click **Nouvelle campagne** → 3-step wizard

### Nouvelle campagne `/enterprise/campagnes/new`
- **Étape 1 — Brief**: type (flocage/borne), title, brand, domain, description, select assets
- **Étape 2 — Ciblage**: city, zones, start/end dates, drivers needed or borne count
- **Étape 3 — Budget**: tier picker (BOOST/GROWTH/LEADER), custom budget, driver reward
- **Enregistrer brouillon** saves without publishing
- **Publier** submits to admin queue

### Modifier campagne `/enterprise/campagnes/[id]/edit`
- Edit unlocked fields on a draft
- Commercial fields (type, city, dates) are locked once published

### Performance `/enterprise/performance`
- Period toggle: 7j / 30j / 90j / Année
- Impressions area chart (daily timeline)
- Campaign breakdown bar (% per campaign)
- City coverage horizontal bars

### Facturation `/enterprise/facturation`
- Invoice list with amounts, due dates, status chips (brouillon/envoyée/payée)
- Click **Payer** → redirects to Stripe Checkout (test card: `4242 4242 4242 4242`)
- After payment → returns to facturation with `?paid=REF` in URL

### Équipe `/enterprise/equipe`
- Current members list with roles (admin/editor/viewer)
- **Inviter** button → email + role form → sends invitation email
- Each member row: change role, remove

### Assets `/enterprise/assets`
- Upload images/videos/PDFs via Cloudinary direct upload
- Click **Téléverser** → file picker → upload progress → asset appears in grid
- Assets are referenceable in campaign creation (step 1)

### Support `/enterprise/support`
- Contact/support form or ticket list

### Paramètres `/enterprise/parametres`
- Company profile: name, domain, city, contact email
- Save updates company record

---

## Role 3 — Partner `partner@publeader.local`

Login → click **Partenaire** at `/dev-login` → lands at `/partenaire`

### Dashboard `/partenaire`
- Overview tiles: active bornes, sprays today, revenue this month

### Bornes `/partenaire/bornes`
- List of own terminals with status (active/idle/fault)
- Cartridge slots: scent name, level percent
- Last heartbeat timestamp
- Click borne → detail with maintenance schedule

### Stock `/partenaire/stock`
- Current cartridge levels per borne
- **Commander un refill** button → select scent, quantity → submits stock order to admin queue
- Order history with status chips (En attente / Livrée / Annulée)

### Publicités `/partenaire/publicites`
- Ad schedule list for own bornes
- Each row: campaign brand, time window (startHour–endHour), interval, status
- Live status: active / paused / outside-window
- **Signaler un problème** → issue report modal (wrong ad, no display, etc.)

### Revenus `/partenaire/revenus`
- Revenue summary: sprays × rate + impressions CPM
- Period breakdown table (daily/monthly)
- Payout history

### Notifications `/partenaire/notifications`
- System notifications: refill delivered, new ad schedule, maintenance reminder

### Paramètres `/partenaire/parametres`
- Business profile: name, address, opening hours
- Contact info update

---

## Role 4 — Driver `driver@publeader.local`

No web portal. Driver interface is mobile-only (DriveAds React Native app).

Login at `/dev-login` → redirects to `/` (admin home) — no driver-specific web pages.

---

## Auth flows

| Action | Where |
|--------|-------|
| Login | `/login` or `/dev-login` (fast) |
| Logout | User menu → Se déconnecter → `/logout` |
| Accept team invite | `/invite?token=...` link in email |
| Payment redirect | `/api/pay/[id]/redirect` → Stripe → `/enterprise/facturation` |

## Theme toggle

Any page → top-right gear icon → switch glass ↔ pro. Persists in `localStorage`.
Both themes should render all screens without layout breaks.
