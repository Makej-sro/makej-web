# Makej! — CLAUDE.md

> **Nejdřív si přečti [`STAV.md`](STAV.md)** (aktuální stav — co se řešilo naposledy, co je rozdělané).
> Detaily (struktura souborů, DB triggery/RLS, flows, realtime, „kde co hledat") jsou v
> [`REFERENCE.md`](REFERENCE.md) — **čti ho jen když potřebuješ konkrétní podrobnost.** Tenhle soubor drž stručný.

## Co je Makej!

Česká appka pro hledání práce — „Tinder pro práci". Brigádník swipuje nabídky, zaměstnavatel přijímá/odmítá kandidáty, po matchi chat. Brigády, part-time i full-time. Cílovka: studenti, brigádníci, gastro/eventy/sklad i další obory.

## Repozitáře
| Repo | Složka | URL |
|---|---|---|
| Mobilní app (Next.js 16 + React 19 + TS + Tailwind v4) | `/Users/samuelpseja/cursor/makej` | github.com/Sam-hub303/makej- |
| Marketingový web (čistý HTML/CSS/JS + React dashboard přes Babel Standalone) | `/Users/samuelpseja/cursor/Makej-projekt/makej-web` | github.com/Makej-sro/makej-web |
| Brigádnická appka (Capacitor obal, iOS/Android) | `/Users/samuelpseja/cursor/Makej-projekt/makej-aplikace` | — (untracked, součást makej-web) |

> **Pozor na strukturu:** `makej-web` a `makej-aplikace` jsou od 2026-07 **sourozenci** ve složce `Makej-projekt/` (dřív byla appka uvnitř webu). Mobilní `makej` zůstává samostatně v `cursor/makej`.

Obě appky sdílí jednu Supabase a session → změny se přes realtime propisují mezi mobilem a web dashboardem.

## Supabase (základ)
- Projekt `cxegfwfbgcgpwerfbvra` · URL `https://cxegfwfbgcgpwerfbvra.supabase.co`
- Anon (publishable) key: `sb_publishable_N_BIwMCTD6ZOTrtBl3juyw_CGIQ_lvh` — **veřejný, bezpečný ve frontendu**
- Session storage key `makej-auth` — **musí být stejný ve všech Supabase klientech**, jinak se nesdílí session
- Tabulky, triggery, RLS, DB funkce → viz REFERENCE.md. Migrace přes Supabase MCP `apply_migration`.

## Lokální servery
- `localhost:3000` — makej app (`npm run dev` ve `makej`)
- `localhost:3333` — makej-web (`python3 -m http.server 3333` ve `makej-web`)

## Kritické gotchas (tohle musíš znát vždy)
- **Gradient tlačítek (mobilní app):** `from-primary to-accent` (tmavě modrý). **NIKDY `to-secondary`** — starý světlý styl, záměrně odstraněn.
- **Dashboard je inline-styled React** (žádné CSS classy). Responzivita = `useIsMobile()` hook (v `employer/employer-theme.jsx`) + globální `!important` atributové CSS v `employer/index.html`. **Po změně JSX vždy bumpni `?v=N`** v `employer/index.html` (cache-busting).
- **`E_JOBS`, `E_THREADS` atd.** jsou `const` globály v browseru — `employer-supabase.jsx` je mutuje in-place, **nereassignovat**.
- **Employer dashboard mock data** (`employer-data.jsx`) se přepíší reálnými při načtení — neodstraňovat, jsou fallback.
- **DB trigger** (`match accepted → job filled`) je primární zdroj pravdy; aplikační kód to dělá taky pro jistotu.
- **JSX v dashboardu nemá build** — validuj parserem (postup v STAV.md).
- **Ikony na webu musí být v `iconify-icons.js`.** `<iconify-icon>` si ikonu, kterou nemá lokálně, stáhne z api.iconify.design **až když prvek přijde scrollem do viewportu** → viditelné naskakování (nejvíc v patičce a v CTA na konci stránky). Když přidáš novou ikonu do HTML, **přidej ji i do předloadu**:
  `curl -s "https://api.iconify.design/<prefix>.json?icons=<a>,<b>"` → vlož jako další `IconifyPreload.push({...})`.
  Kontrola: **`node kontrola-ikon.mjs`** — vypíše, co chybí, včetně hotového `curl` příkazu.
  Komponenta `iconify-icon.min.js` se načítá **lokálně a synchronně** (přes CDN s `async` se upgradovala pozdě). V `style.css` je navíc blok, který ikonám **rezervuje místo** podle `width="…"` — bez něj se po upgradu roztáhne všechno, co ikonu obsahuje. **Nová velikost v HTML → přidat pravidlo i tam.**
- Commit message končí: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
