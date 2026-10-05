# Makej! — CLAUDE.md

> **Nejdřív si přečti [`STAV.md`](STAV.md)** (aktuální stav — co se řešilo naposledy, co je rozdělané).
> Co se musí přepnout při ostrém startu (přístupový klíč, demo data, klíče Supabase) je
> v [`PRED-SPUSTENIM.md`](PRED-SPUSTENIM.md) — **když něco nastavuješ „jen na teď", zapiš to tam.**
> Detaily (struktura souborů, DB triggery/RLS, flows, realtime, „kde co hledat") jsou v
> [`REFERENCE.md`](REFERENCE.md) — **čti ho jen když potřebuješ konkrétní podrobnost.** Tenhle soubor drž stručný.

## Co je Makej!

Česká appka pro hledání práce — „Tinder pro práci". Brigádník swipuje nabídky, zaměstnavatel přijímá/odmítá kandidáty, po matchi chat. Brigády, part-time i full-time. Cílovka: studenti, brigádníci, gastro/eventy/sklad i další obory.

## Repozitáře
| Repo | Složka | Doména | URL |
|---|---|---|---|
| Mobilní app (Next.js 16 + React 19 + TS + Tailwind v4) | `~/cursor/makej` | — | github.com/Sam-hub303/makej- |
| Marketingový web (čistý HTML/CSS/JS) | `~/Makej-projekt/makej-web` | makej.eu | github.com/Makej-sro/makej-web |
| Firemní dashboard + webová appka (React přes Babel Standalone) | `~/Makej-projekt/makej-app` | **app.makej.eu** | github.com/Makej-sro/makej-app |
| Brigádnická appka (Capacitor obal, iOS/Android) | `~/Makej-projekt/makej-aplikace` | — | — (untracked) |

> **Pozor na strukturu:** od 2026-10 jsou **dashboard a webová appka ve vlastním repu `makej-app`** na doméně `app.makej.eu` — ve `makej-web` už složky `employer/` ani `worker/` nejsou. Marketingový web na ně odkazuje přes konstantu `APPKA` ve `script.js` (jediné místo, kde je doména napsaná), přihlašuje se na `app.makej.eu`. Staré adresy `/employer/*` a `/worker/*` míří 301 na novou doménu. Marketingový web na ně odkazuje přes konstantu `APPKA` ve `script.js` (jediné místo, kde je doména napsaná). Staré adresy `/employer/*` a `/worker/*` míří 301 na novou doménu. `makej-web`, `makej-app` a `makej-aplikace` jsou sourozenci ve složce `Makej-projekt/`; mobilní `makej` je samostatně v `cursor/makej`.

Všechny appky sdílí jednu Supabase a session → změny se přes realtime propisují mezi mobilem a web dashboardem.

## Supabase (základ)
- Projekt `cxegfwfbgcgpwerfbvra` · URL `https://cxegfwfbgcgpwerfbvra.supabase.co`
- Anon (publishable) key: `sb_publishable_N_BIwMCTD6ZOTrtBl3juyw_CGIQ_lvh` — **veřejný, bezpečný ve frontendu**
- Session storage key `makej-auth` — **musí být stejný ve všech Supabase klientech**, jinak se nesdílí session
- Session se ukládá do **cookie pro `.makej.eu`**, ne do `localStorage` (`pamet-prihlaseni.js`) — jinak by se člověk
  musel přihlásit zvlášť na `makej.eu` a zvlášť na `app.makej.eu`. Klient se vytváří s `storage: window.mkAuthUloziste`.
  Supabase session má 2–4 kB a limit cookie je 4 kB, proto se ukládá po kusech (`makej-auth.0`, `.1` …).
- Tabulky, triggery, RLS, DB funkce → viz REFERENCE.md. Migrace přes Supabase MCP `apply_migration`.

## Lokální servery
- `localhost:3000` — makej app (`npm run dev` ve `makej`)
- `localhost:3333` — makej-web (`python3 -m http.server 3333` ve `makej-web`)
- `localhost:3334` — makej-app (`python3 -m http.server 3334` ve `makej-app`)

> Na localhostu **nefunguje sdílená session** — cookie se nastavuje jen na `.makej.eu` (prohlížeč by cizí doménu zahodil), takže se na každém portu přihlašuje zvlášť. To je v pořádku, naostro to drží.

## Kritické gotchas (tohle musíš znát vždy)
- **Gradient tlačítek (mobilní app):** `from-primary to-accent` (tmavě modrý). **NIKDY `to-secondary`** — starý světlý styl, záměrně odstraněn.
- **Dashboard je inline-styled React** (žádné CSS classy) a od 2026-10 **v repu `makej-app`**, ne tady. Responzivita = `useIsMobile()` hook (v `employer/employer-theme.jsx`) + globální `!important` atributové CSS v `employer/index.html`. **Po změně JSX vždy bumpni `?v=N`** v `employer/index.html` (cache-busting).
- **`E_JOBS`, `E_THREADS` atd.** jsou `const` globály v browseru — `employer-supabase.jsx` je mutuje in-place, **nereassignovat**.
- **Employer dashboard mock data** (`employer-data.jsx`) se přepíší reálnými při načtení — neodstraňovat, jsou fallback.
- **DB trigger** (`match accepted → job filled`) je primární zdroj pravdy; aplikační kód to dělá taky pro jistotu.
- **JSX v dashboardu nemá build** — validuj parserem (postup v STAV.md).
- **Pět souborů je vědomá kopie v `makej-web` i `makej-app`:** `cenik.css`, `nahravani.css`, `consent.js`, `consent.css`, `pamet-prihlaseni.js` (a `vendor/metal-fx/`). Od rozdělení domén nemají jak být sdílené. **Měníš jeden → projdi i druhý**, v hlavičce každého je to napsané. U `nahravani.css` na tom záleží nejvíc: kreslí přechodovou modrou na obou doménách, a rozdíl o pixel je při přechodu vidět jako cuknutí.
- **`sessionStorage` ani `localStorage` nejde mezi `makej.eu` a `app.makej.eu`** — patří jednomu původu. Co si ty dvě strany předávají, musí jít přes cookie na `.makej.eu` (`mkAuthUloziste` pro session, `mkBrana` pro přístupový klíč) nebo přes adresu (`?od=…` pro čas kliknutí). Při přidávání dalšího předávání na to pozor; tiše to nespadne, jen to přestane fungovat.
- **Ikony na webu musí být v `iconify-icons.js`.** `<iconify-icon>` si ikonu, kterou nemá lokálně, stáhne z api.iconify.design **až když prvek přijde scrollem do viewportu** → viditelné naskakování (nejvíc v patičce a v CTA na konci stránky). Když přidáš novou ikonu do HTML, **přidej ji i do předloadu**:
  `curl -s "https://api.iconify.design/<prefix>.json?icons=<a>,<b>"` → vlož jako další `IconifyPreload.push({...})`.
  Kontrola: **`node kontrola-ikon.mjs`** — vypíše, co chybí, včetně hotového `curl` příkazu.
  Komponenta `iconify-icon.min.js` se načítá **lokálně a synchronně** (přes CDN s `async` se upgradovala pozdě). V `style.css` je navíc blok, který ikonám **rezervuje místo** podle `width="…"` — bez něj se po upgradu roztáhne všechno, co ikonu obsahuje. **Nová velikost v HTML → přidat pravidlo i tam.**
- Commit message končí: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
