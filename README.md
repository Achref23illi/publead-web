# Publeader — Admin Dashboard (Web)

Next.js 15 + Tailwind v4 migration of the Publeader admin prototype. French UI,
two runtime-switchable design variants (**glass** and **pro**), no shadcn/ui —
every component is custom and lives under `src/components/` or is styled
directly via `src/app/globals.css`.

## Stack

- **Next.js 15.1.6** (App Router, React 19)
- **TypeScript 5.7** (`strict`)
- **Tailwind CSS v4** (`@tailwindcss/postcss` only — design tokens live in
  `globals.css` under `@theme inline`)
- **No shadcn/ui.** Custom UI library only. Icon set is a hand-rolled SVG
  switch in `src/components/Icon.tsx`.
- Client state via React Context: `ThemeContext` (`glass` / `pro` toggle,
  persisted to `localStorage` under `publeader_theme`), `ToastContext`,
  `UiStateContext` (cmd-K palette, notifications panel).

## Getting started

```bash
npm install
npm run dev
# → http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`,
`npm run typecheck`.

## Routes

| Path                 | Screen                                           |
| -------------------- | ------------------------------------------------ |
| `/`                  | Tableau de bord                                  |
| `/validations`       | Validations (chauffeurs + entreprises)           |
| `/chauffeurs`        | Annuaire chauffeurs                              |
| `/entreprises`       | Annuaire entreprises                             |
| `/campagnes`         | Liste des campagnes                              |
| `/campagnes/new`     | Nouvelle campagne (flocage / borne)              |
| `/campagnes/[id]`    | Détail campagne                                  |
| `/bornes`            | Flotte de bornes                                 |
| `/finances`          | MRR, factures, commissions, dépenses             |
| `/rapports`          | Rapports PDF                                     |
| `/notifications`     | Centre de notifications                          |
| `/parametres`        | Paramètres (profil, équipe, rôles, intégrations) |
| `/login`, `/logout`  | Auth                                             |

Every route is rendered by an `AppShell` + `<ScreenSwitcher>` pair that picks
between the matching **Glass** and **Pro** screen components based on the
active theme.

## Theme toggle (glass ↔ pro)

`src/contexts/ThemeContext.tsx` exposes a `uiStyle` string and a setter. The
toggle is reachable from `Paramètres → Apparence` and persists to
`localStorage`. Switching themes is instant — no reload — because each page
renders both variants and lets `<ScreenSwitcher>` flip the tree.

## Auth

Prototype-only. `signIn()` in `src/lib/auth.ts` writes
`publeader_auth=1` to `localStorage` *and* to a `publeader_auth` cookie.
`src/middleware.ts` redirects any request without that cookie to `/login`
(excluding `/login`, Next internals, and static assets). Replace with a signed
session the moment a backend exists.

## Structure

```
src/
├─ app/                   # App Router pages, one folder per route
│  ├─ layout.tsx          # Root layout — mounts ThemeProvider / Toast / UiState
│  ├─ globals.css         # Design tokens + glass-* / pro styles (≈2.5k lines)
│  ├─ page.tsx            # /
│  └─ <route>/page.tsx    # wraps <AppShell><ScreenSwitcher .../></AppShell>
├─ components/            # AppShell, Sidebar, Topbar, GlassShell, Icon, charts…
├─ contexts/              # ThemeContext, ToastContext, UiStateContext
├─ screens/               # <Screen>Glass.tsx + <Screen>Pro.tsx pairs
├─ lib/                   # auth, nav, data (mock)
└─ middleware.ts          # cookie-based auth gate
```

## Build notes

- `next build` works end-to-end. In the development sandbox it may fail at the
  very last cleanup step with `EPERM: operation not permitted, unlink .../export/404.html`
  — this is a filesystem quirk, not a code issue. Compilation, lint, type
  check, and static-page generation all succeed. In a normal environment the
  build finishes cleanly.
- Tailwind v4 requires `@tailwindcss/postcss ^4.2` — older 4.0.x ships a
  scanner that trips on `Missing field 'negated' on ScannerOptions.sources`.
  The current `package.json` pins `^4.2.2`.

## Design fidelity

1:1 with the prototype. Text is French verbatim. Colours, spacing, and the
glass / pro split follow the original CSS with the exception that shared
design tokens now live under Tailwind `@theme inline` so utilities can use
them directly.
