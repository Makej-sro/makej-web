# STAV — aktuální kontext projektu

> Tenhle soubor je „kde právě jsme". `CLAUDE.md` = neměnný popis projektu (architektura, DB, konvence).
> `STAV.md` = co se řešilo naposledy, na co si dát pozor, co je rozdělané.
> **Po dokončení každé větší práce sem AI zapíše 2–3 řádky.** Drž to stručné.

---

## Jak pracovat s tímhle projektem (důležité pro úsporu kontextu)

- **Zakládej nové chaty místo jednoho dlouhého.** `/compact` konverzaci nemaže, jen ji zabalí do shrnutí, které se táhne dál — čím déle chat běží, tím víc tokenů se přenáší. Nový chat = jen `CLAUDE.md` + `STAV.md`.
- Nový chat automaticky přečte `CLAUDE.md` (a přes odkaz i tenhle soubor). Nemusíš nic vysvětlovat od nuly.
- Lokální servery: web `python3 -m http.server 3333` ve složce `makej-web`, mobilní app `npm run dev` ve složce `makej`.

## Kontrola JSX v dashboardu (Babel Standalone běží v prohlížeči)

JSX soubory ve `employer/` nemají build — validují se ručně parserem:
```bash
node -e 'const p=require("/Users/samuelpseja/cursor/makej/node_modules/@babel/parser");
const fs=require("fs"); p.parse(fs.readFileSync("employer/employer-main.jsx","utf8"),
{sourceType:"script",plugins:["jsx"]}); console.log("OK")'
```
Po změně JSX **vždy bumpni `?v=N`** u daného souboru v `employer/index.html` (cache-busting), jinak prohlížeč načte starou verzi.

## Dashboard je inline-styled React (žádné CSS classy)

- Komponenty používají výhradně `style={{}}` — media query je nepřebijí přes classy.
- Responzivita řešena dvěma způsoby:
  1. **JS hook `useIsMobile()`** (definován v `employer/employer-theme.jsx`, breakpoint `MOBILE_BP = 820`) — pro logiku (drawer sidebar, přepínání panelů).
  2. **Globální CSS v `employer/index.html`** s `!important` atributovým selektorem (`[style*="repeat(4, 1fr)"]` apod.) — přebíjí inline gridy a stackuje je na mobilu. Když přidáš nový vícesloupcový grid, buď použij existující `repeat(N, 1fr)` string (chytne ho selektor), nebo přidej pravidlo.

---

## Hotovo naposledy

- **Reorganizace složek** (2026-07): `makej-web` a `makej-aplikace` jsou teď **sourozenci** ve složce `/Users/samuelpseja/cursor/Makej-projekt/` (dřív byla appka uvnitř webu jako `makej-web/makej-aplikace/`). Mobilní `makej` zůstává samostatně v `cursor/makej`. Claude Code paměť zkopírována na novou path-encoded cestu (`-Users-samuelpseja-cursor-Makej-projekt-makej-web`). Cesty aktualizované v `CLAUDE.md` i README appky. Lokální test appky: `python3 -m http.server 4000` ve `Makej-projekt/makej-aplikace/www`.
- **Plné profily místo jen recenzí (obě strany)** (2026-07): `WEmployerModal` (worker appka → profil firmy, `makej-aplikace/www/worker-main.jsx`) teď ukazuje **celý profil firmy** — hero s modrým gradientem + logo (`logo_url`), fotky firmy (`photos`), sekce O firmě (`bio`), Informace (obor `industry`, kraj, sídlo `address`, web `website`, IČO `ic`, „Na Makej od" z `created_at`), sociální sítě (`socials`), pak recenze; fallback hláška když firma nic nevyplnila. Dashboard `EWorkerProfileModal` (`employer-main.jsx`, bump `?v=23`) už plný profil měl (staty, bio, vzdělání, dovednosti, CV, recenze) — přidán jen **věk** (z `birth_date`), pohlaví a kraj do podtitulku. **Žádná migrace** — všechna pole už v `profiles` existovala.
- **Redesign vizuálu appky dle mockupu „Makej-redesign-15" (makej-aplikace)** (2026-07): kompletní vizuální předělání 4 hlavních obrazovek (swipe/Domů, Moje brigády, Zprávy, Profil) podle staženého HTML mockupu (design_doc bundle → rozbaleno v `scratchpadu`). Změny: **nové fonty** Space Grotesk (nadpisy/čísla, 800) + Instrument Sans (text) — woff2 vytaženy z bundlu do `www/fonts/` (`SpaceGrotesk-*`, `InstrumentSans-*`), `@font-face` v `fonts.css` (weight ranges). **Nová paleta v `worker-theme.jsx`**: primary `#1a34e8`, bg `#f5f7fd`, ink `#14162b`, muted `#9096ad`, + tokeny `tint`/`green`/`greenSoft`/`navBg`/`heroGrad`/`avatarGrad`. **Navbar** (`worker-main.jsx`) = tmavě-modrý pill `#14162b`, aktivní tab modrý s popiskem (zachována flex-grow animace). **Swipe karta** (`worker-swipe.jsx`): hero = radiální modrý gradient + tečkovaná textura + monogram + skleněné logo + rating pill + „NABÍRÁ TEĎ" odznak; datum/čas jako chipy; akční tlačítka pod kartou (červené X / zlatá hvězda / velké modré srdce). **Historie**: výzva k hodnocení = modrá gradientová karta, „Hotovo" zelený badge. **Zprávy**: gradient avatary (r16) + online tečka, nepřečtené řádky jako bílé karty. **Profil**: nadpis „Profil", gradient avatar, výdělek = radiální hero karta s chipem, level = **prstenec pokroku** (SVG), stat karty barevné. Login/onboarding v `index.html` sladěno (blue `#1a34e8`, Instrument Sans). Vše ověřeno parserem + preview render swipe karty v prohlížeči (sedí s mockupem). **Pozor:** změny jen v `makej-aplikace/` — web `worker/` nezměněn.
- **Onboarding + nová registrace/přihlášení (makej-aplikace)** (2026-07): 1) uvítací splash při **prvním spuštění** — obrázek `www/onboarding.png` (z `splash-11a.png`, ořezaný) jako celoobrazovkové pozadí `#onboarding`, klik = zavře + `localStorage: makej-onboarded`. 2) auth brána přepsaná ze staré tmavé na **světlou full-screen** (dle `Registrace 12b.png`): registrace (výchozí) + přihlášení, přepínání, oko u hesla, povinný souhlas, Google/Apple přes `signInWithOAuth` (fallback hláška když provider není nastaven), napojeno na stávající `sb.auth` (role `worker`, CV odebráno z registrace). Vše v `www/index.html` (inline HTML/CSS/JS, offline). Domény: zaměstnavatel by šel na `https://makej.eu/employer/` (appka je ale jen pro brigádníky — role-select se nedělá).
- **Odpovědi na recenze — obousměrné (brigádník ↔ zaměstnavatel), realtime** (2026-07): nová tabulka `review_replies` (review_id, author_id, text, created_at) + RLS (vidí/odpovídá jen účastník recenze: reviewer_id nebo reviewed_id) + přidána do `supabase_realtime` publikace. **Migrace aplikovaná přes MCP** (není v `supabase/migrations/`). Worker (`makej-aplikace/`): karta „Recenze na mě" v profilu otevře **celou stránku** (`WReviewsPage` ve `worker-profile.jsx`) se všemi recenzemi, vlákny odpovědí a inputem; funkce `fetchReviewRepliesW`/`postReviewReplyW` ve `worker-supabase.jsx` (+ `reviewerId` do W_REVIEWS). Dashboard (`employer-main.jsx` → `EWorkerProfileModal`): u každé recenze vlákno odpovědí + input (odpovídat jde jen u recenzí, které firma napsala, `r.reviewer_id === myId`). Bump `employer-main.jsx?v=22`.
- **Redesign worker appky (Xefag/produkt styl, naše barvy)** (2026-07): swipe karta = barevný modrý panel + plovoucí bílá karta + velká typografie; akční tlačítka bílá s modrou ikonou; swipe razítka modrá/bílá; profil = header s avatarem + „Lv" odznak + gradientová karta výdělku; jednotné modré avatary bez profilovky (`W_AVATAR_BG`); zprávy jedno-panelové (seznam↔vlákno). Kompletní offline sada 33 Solar ikon (`vendor/icons-solar.js`).
- **Employer: povinná pole inzerátu** (2026-07): `ENewJobModal` validuje všechna viditelná pole podle typu úvazku (`employer-main.jsx handleSubmit`), popisky mají `*`.
- **`makej-aplikace/` — Capacitor obal rozhraní pro brigádníky** (2026-07): nová složka pro nativní iOS/Android appku. `www/` = kopie worker appky (`app.jsx` + `worker-*.jsx`), ale **100 % offline** — React/ReactDOM/Supabase/Babel/iconify + fonty (latin+latin-ext) + Solar ikony (`IconifyPreload`) staženy lokálně do `www/vendor/` a `www/fonts/`. `index.html` má nativní viewport (viewport-fit=cover, no-zoom), safe-area insety, no-bounce, odstraněn „zpět na web" odkaz + GA. `capacitor.config.json` (appId `eu.makej.brigadnik`), `package.json`, README s kroky pro App Store i Google Play. Ověřeno v prohlížeči (iPhone viewport, bez chyb). **Pozor:** kód se duplikuje s `worker/` — při změně workeru přenést i sem (`cp` + `cap sync`), viz README.
- **Mobilní responzivita webu i dashboardu** (2026-07):
  - Dashboard: výsuvný drawer sidebar + hamburger v topbaru, kompaktní topbar, Zprávy přepínají seznam↔vlákno se zpět tlačítkem, gridy se stackují, fixní panely/modaly dostaly `maxWidth`.
  - Web: většina stránek už responzivní byla; doladěn ceník (balíčky 1 sloupec <600px), ověřeny ukázka dashboardu/before-after posuvník (škálují se), srovnávací tabulka scrolluje.
- Footer: odkaz „Ceník" odstraněn ze všech stránek (stránka `cenik.html` ale pořád existuje).
- Nový ceník od Yasina (yp-* karty) na `pro-zamestnavatele.html`; e-maily sjednoceny na `admin@makej.eu` (na této stránce).

## Rozdělané / ke zvážení (nedělat bez potvrzení)

- Kompaktnější pohledy na mobilu zůstávají hutné: **týdenní kalendář směn** (grid 7 sloupců) a **grafy analytiky** — funkční, ale těsné. Případně doladit.
- Sjednotit `hello@makej.eu` → `admin@makej.eu` i na ostatních stránkách (zatím jen pro-zamestnavatele).
- Exportovat DB migrace (aplikované přes Supabase MCP) do `supabase/migrations/` — zatím nejsou v gitu.
- `pro-zamestnavatele.html` má mrtvý CSS starého ceníku (`.cn-*` blok kolem ř. 258–290) — nepoužívá se.

## Na co si dát pozor (gotchas)

- **Gradient tlačítek** v mobilní app: `from-primary to-accent` (tmavě modrý). NIKDY `to-secondary`.
- `E_JOBS`, `E_THREADS` atd. jsou `const` globály — `employer-supabase.jsx` je mutuje in-place, nereassignovat.
- `storageKey: 'makej-auth'` musí být stejný ve všech Supabase klientech (sdílená session web ↔ app).
- Supabase anon/publishable key je veřejný — bezpečný ve frontend kódu.
- Commit message končí: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
