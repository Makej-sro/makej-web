# Makej! — REFERENCE (detailní)

> Detailní referenční příručka. `CLAUDE.md` má jen jádro; sem sáhni, když potřebuješ
> podrobnosti (struktura souborů, DB triggery/RLS, flows, realtime, mapa „kde co hledat").

---

## Supabase — detail

**Projekt:** `cxegfwfbgcgpwerfbvra` (eu-west-1) · **URL:** `https://cxegfwfbgcgpwerfbvra.supabase.co`
**Anon (publishable) key:** `sb_publishable_N_BIwMCTD6ZOTrtBl3juyw_CGIQ_lvh` (veřejný, bezpečný ve frontendu)
**Session storage key:** `makej-auth` (sdílený web ↔ app)

### Tabulky
```
profiles      — uživatelé (worker i employer), RLS zapnuto
jobs          — inzeráty brigád, RLS zapnuto
matches       — swipe matche, status: pending/accepted/rejected
messages      — chat zprávy přes match_id
rejections    — odmítnuté inzeráty (worker swipe left)
reviews       — hodnocení po dokončené brigádě
job_views     — sledování zhlédnutí inzerátů (dashboard analytics)
notifications — perzistentní notifikace (přežijí refresh)
candidate_notes — soukromé poznámky zaměstnavatele ke kandidátovi (owner-only RLS)
team_members  — členové týmu firmy (sdílený přístup, invite_token)
```

### Triggery a funkce
- **`on_auth_user_created`** → `handle_new_user()` — při registraci vytvoří `profiles` řádek (name, role, company_name, birth_date, gender, kraj z user_metadata)
- **`trg_fill_job_on_match_accepted`** → `fill_job_on_match_accepted()` — match → `accepted` nastaví job na `filled`
- **`delete_my_account()`** RPC — smaže účet
- **`can_act_as(owner)`** (security definer) — základ sdíleného týmového přístupu, používá se napříč RLS
- **`claim_team_invite(token)`**, **`my_workspaces()`** — týmové RPC (párování účtů přes invite link, rozcestník prostorů)

### RLS pravidla
- `jobs INSERT` — jen `role='employer'` (a `can_act_as`)
- `matches INSERT` — jen `role='worker'`
- `messages INSERT` — jen účastníci matche
- `rejections INSERT` — jen `role='worker'`
- `profiles SELECT` — viditelné všem (jména v chatech)

> DB migrace se aplikují přes Supabase MCP `apply_migration`. Zatím **nejsou** v gitu (viz STAV.md).

---

## `makej` — Mobilní aplikace

**Stack:** Next.js 16 + React 19 + TypeScript · Tailwind v4 (`globals.css` s `@theme inline`) · Supabase JS v2 · připraveno pro Capacitor.

**Barvy (globals.css):** `primary #292978` (tmavě navy), `accent #3a3a99`, `secondary #d0d0ff`.
Tlačítka = gradient `from-primary to-accent`. **NIKDY `to-secondary`** (starý světlý styl, odstraněn).

### Struktura
```
src/
├── app/
│   ├── (auth)/login/page.tsx      — přihlášení (email+heslo + Google OAuth)
│   ├── (auth)/register/page.tsx   — registrace (2 kroky: role → údaje; birth_date, gender, kraj)
│   ├── (app)/layout.tsx           — layout s BottomNav + NotificationProvider
│   ├── (app)/jobs/page.tsx        — worker: swipe UI / employer: správa inzerátů + kandidáti
│   ├── (app)/jobs/new/page.tsx    — nový inzerát (jen employer)
│   ├── (app)/messages/page.tsx    — chat (worker: accepted matche, employer: všechny)
│   ├── (app)/profile/page.tsx     — profil, editace, nastavení, smazání účtu
│   ├── layout.tsx                 — root layout s AuthProvider
│   └── page.tsx                   — redirect na /jobs
├── components/
│   ├── AuthProvider.tsx           — Context: user, profile, session, signOut, refreshProfile
│   ├── BottomNav.tsx              — spodní navigace (role-based)
│   ├── JobCard.tsx                — swipovatelná karta s drag gestures
│   ├── NotificationProvider.tsx   — realtime notifikace (message/accepted/new_candidate)
│   └── NotificationPanel.tsx      — panel notifikací
└── lib/
    ├── supabase.ts                — singleton klient (storageKey: 'makej-auth')
    ├── queries.ts                 — DB operace (getActiveJobs, createMatch, sendMessage…)
    ├── types.ts                   — typy (Job, Match, Message, UserProfile, Review)
    └── mock-data.ts               — mock data pro dev
```

### Flows
**Worker:** registrace jako `worker` → profil triggerem → `/jobs` swipe (doprava `createMatch`, doleva `createRejection`) → po acceptu notifikace přes `NotificationProvider` → `/messages` jen accepted.
**Employer:** registrace `employer` (company_name) → `/jobs` = `EmployerDashboard` (inzeráty + kandidáti) → přijetí `updateMatchStatus('accepted')` → trigger job→filled → header má tlačítko Dashboard (`localhost:3333/employer/`).
**Auth:** `AuthProvider` hlídá stale session (JWT errors, paused project); Google OAuth redirect `/jobs`; session sdílena přes `localStorage['makej-auth']`.

### Realtime v app
- `NotificationProvider` — `messages INSERT`, `matches UPDATE` (worker: accepted, employer: new_candidate)
- `EmployerDashboard` (jobs/page.tsx) — `matches INSERT/UPDATE`, `jobs UPDATE`
- `messages/page.tsx` — `messages INSERT` pro aktivní thread

---

## `makej-web` — Marketingový web

**Stack:** čistý HTML/CSS/JS (žádný build) · Supabase přes CDN (UMD) · employer dashboard = React + Babel Standalone (JSX v browseru).

### Soubory
```
index.html, style.css, script.js  — landing (+ další .html stránky: cenik, o-nas, podpora,
                                     pruvodce, hledam-si-praci, pro-zamestnavatele, privacy, terms)
STAV.md, REFERENCE.md, CLAUDE.md   — dokumentace
employer/
├── index.html            — dashboard (auth gate + React app + globální mobilní CSS)
├── app.jsx               — sdílené tokeny (T, Icon, fmtKc)
├── employer-theme.jsx    — světlý theme + useIsMobile hook (MOBILE_BP=820)
├── employer-data.jsx     — mock data (přepsána reálnými při načtení)
├── employer-plans.jsx    — definice tarifů / limitů
├── employer-shell.jsx    — sidebar (drawer na mobilu), topbar, grafy (Sparkline, AreaChart…)
├── employer-dashboard.jsx— Dashboard tab (KPI, funnel, heatmap, activity)
├── employer-pages.jsx    — Inzeráty + Kandidáti kanban (Přijmout/Odmítnout)
├── employer-pages2.jsx   — Analytika + Plán směn
├── employer-pages3.jsx   — Zprávy (realtime chat), Tým, Fakturace, Nastavení
├── employer-supabase.jsx — data layer (fetchEmployerData, acceptCandidate…)
├── employer-main.jsx     — root komponenta (loading, realtime, drawer state)
└── _premium/             — kraje-map.jsx, analytics.jsx (od Yasina, napojené na reálná data)
```

### Auth na webu (index.html)
Navbar tlačítka otevírají modály — Login (email+heslo + Google), Register (2 kroky worker/employer).
Po přihlášení jako employer se v navbaru zobrazí Dashboard. Session pod `makej-auth` → sdílena s `/employer/`.

### Employer dashboard (`/employer/`)
- **Auth gate:** login formulář; pokud není `role==='employer'`, odmítnuto. Pak rozcestník pracovních prostorů (`my_workspaces()`).
- **Data flow:** `getSession()` → `fetchEmployerData(actingId)` fetchuje profil/joby/matche/zprávy/reviews → mutuje globály (`E_JOBS`, `E_THREADS`, `ECOMPANY`…) in-place → `setLoaded(true)` + `setTick(1)`.
- **Acting id:** `window._makejActingId` (za kterou firmu pracuju z rozcestníku); event `makej-workspace` odstartuje app.
- **Realtime:** `matches INSERT/UPDATE`, `jobs INSERT/UPDATE` → refresh.
- **EMessages:** lokální `threads` z `E_THREADS`; per-thread subscription (nové zprávy do aktivního threadu) + globální (náhledy); odesílání `sb.from('messages').insert(...)` optimisticky.

### Mobilní responzivita dashboardu — viz STAV.md
Inline React styly → `useIsMobile()` hook + globální `!important` atributové CSS v `employer/index.html`.
Po změně JSX vždy bumpni `?v=N` v `employer/index.html`.

### Lokální servery
- `localhost:3000` — makej app (`npm run dev` ve `makej`)
- `localhost:3333` — makej-web (`python3 -m http.server 3333` ve `makej-web`)

---

## Propojení app ↔ web (realtime)
| Akce | Kde se projeví |
|---|---|
| Worker swipne v mobilu | Web dashboard (matches INSERT) |
| Employer přijme v mobilu | Web dashboard (matches UPDATE) + job→filled (trigger) |
| Employer přijme na webu | Mobil (jobs UPDATE) + job→filled |
| Zpráva z mobilu | Web dashboard (per-thread subscription) |
| Zpráva z webu | Mobil (NotificationProvider) |
| Nový inzerát z mobilu | Web dashboard (jobs INSERT) |

## Kde co hledat
| Chci… | Soubor |
|---|---|
| Přidat sloupec do DB | Supabase MCP → `apply_migration` |
| Co vidí worker na /jobs | `makej/src/app/(app)/jobs/page.tsx` |
| Swipe logika | `makej/src/components/JobCard.tsx` |
| Nové DB query (app) | `makej/src/lib/queries.ts` |
| Typy (app) | `makej/src/lib/types.ts` |
| Auth flow (app) | `makej/src/components/AuthProvider.tsx` |
| Notifikace (app) | `makej/src/components/NotificationProvider.tsx` |
| Landing page | `makej-web/index.html` + `style.css` + `script.js` |
| Employer dashboard | `makej-web/employer/employer-*.jsx` |
| Realtime v dashboardu | `makej-web/employer/employer-main.jsx` |
| Supabase query v dashboardu | `makej-web/employer/employer-supabase.jsx` |
