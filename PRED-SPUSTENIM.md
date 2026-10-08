# PŘED SPUŠTĚNÍM — co se musí přepnout

> Seznam věcí, které jsou teď schválně nastavené „na předspuštění" a při ostrém
> startu se musí změnit. **Každá položka má soubor i řádek**, ať se nic nehledá.
>
> Týká se dvou repozitářů: **`makej-web`** (marketingový web, makej.eu)
> a **`makej-app`** (dashboard + appka, app.makej.eu). Některé věci jsou v obou —
> je to u nich napsané.
>
> Po změně v `makej-app` **bumpni `?v=N`** u daného souboru v `employer/index.html`
> (JSX nemá build a prohlížeč by načetl starou verzi). U `makej-web` totéž
> u `script.js` ve všech HTML.

---

## 1 · Přístupová brána (klíč `8939`)

Dokud se nespustí, do rozhraní se nikdo nedostane bez klíče. **Je na třech
místech a musí se vypnout na všech**, jinak zůstane jedna cesta zavřená.
Vypnutí = prázdný řetězec, ne smazání řádku — kód s tím počítá a bránu sám
přeskočí (`if (!ACCESS_KEY) return true`).

| kde | soubor | řádek |
|---|---|---|
| web — přihlašovací modál | `makej-web/script.js` | 402 |
| appka — přihlašovací stránka | `makej-app/index.html` | 258 |
| appka — brána `/worker/` | `makej-app/worker/index.html` | 148 |

```js
const ACCESS_KEY = '';   // bylo '8939'
```

Na přihlašovací stránce se tím **samo schová pole „Přístupový klíč"**, nemusí se
nic mazat z HTML.

> Souvisí: cookie `makej-brana` (`pamet-prihlaseni.js`) si pamatuje, že klíč
> prošel, aby ho appka nechtěla podruhé. Po vypnutí brány je nečinná, nevadí.
> Je popsaná v `consent.js` (seznam úložišť) — pokud se bude rušit úplně,
> vyhodit ji i odtamtud.

---

## 2 · Vývojové přepínače v dashboardu

### `E_DEMO_INZERATY` → `false`
`makej-app/employer/employer-demo.jsx:12`

Ukázkové inzeráty, aby prázdný dashboard nevypadal rozbitě. **Naostro by se
firmám míchaly mezi jejich vlastní.** Komentář u toho nabízí i smazat celý
soubor i s jeho `<script>` v `employer/index.html` — čistší, pokud už ho
nebudeme chtít.

### `E_LIMITY_OD_PRIHLASENI` → `false`
`makej-app/employer/employer-supabase.jsx:187`

Limit topování se teď počítá **od posledního přihlášení**, ne za kalendářní
měsíc — kvůli testování (Yasin, 1. 10.). Každé přihlášení dá znovu plný počet
podle tarifu. **Naostro by to znamenalo neomezené topování** — stačí se
odhlásit a přihlásit. Po přepnutí se zase počítá kalendářní měsíc.

### Potvrzování e-mailu
`makej-app/worker/index.html:214` (komentář o dva řádky výš)

Když je v Supabase potvrzování e-mailu vypnuté, `signUp` uživatele rovnou
přihlásí — to se před spuštěním nechce, takže se hned po registraci odhlásí.
**Až se spustí, tenhle `signOut` zrušit**, jinak si člověk založí účet a bude
vyhozen ven.

---

## 3 · „Zaregistruj se" → skutečná registrace

`makej-app/index.html:236`

Teď vede na sběr e-mailů, protože se účty nezakládají volně:

```html
<a href="https://makej.eu/#predregistrace">Zaregistruj se</a>
```

Po spuštění přehodit na:

```html
<a href="https://makej.eu/?registrace=1">Zaregistruj se</a>
```

Obsluha `?registrace=` je na webu **už hotová** (`makej-web/script.js`, blok
u `?login=`) — otevře registrační okno rovnou. Dá se přidat i role
(`?registrace=employer`), pak se přeskočí rozcestník „Kdo jsi?".

> Stejně tak „Vytvořit účet" na webu dnes míří na čekací list
> (`goToEmailSignup()` ve `script.js`). Až budou registrace otevřené,
> rozhodnout, jestli má vést na registrační okno.

---

## 4 · Supabase

### Nasadit `import-inzerat`
`makej-web/supabase/functions/import-inzerat/index.ts`

V projektu běží **verze 1 z 28. 9. 2026** — místní soubor má novější změnu
v tom, jak se hledá veřejný klíč (`SUPABASE_PUBLISHABLE_KEY` →
`publishableZProstredi()` → `SUPABASE_ANON_KEY`), a ta **není nasazená**.

**Pořadí je důležité:** nasadit tuhle funkci **dřív**, než se vypnou staré
(legacy) klíče — jinak si běžící verze nemá čím ověřit přihlášeného uživatele
a import spadne.

Blokuje to ještě rozhodnutí s Yasinem o parametru `styl` (`'makej'` =
přepsat do stylu appky, `'doslovne'` = jen roztřídit do polí).

### Rotovat klíče
Service_role klíč `sb_secret_…` i osobní token (PAT) **byly sdílené v chatu**,
takže se musí přegenerovat v Supabase dashboardu. PAT je navíc uložený
v `Makej-projekt/.mcp.json` **plaintextem** (ten soubor není v gitu).

Po rotaci vypnout **legacy JWT klíče** — ale až po nasazení `import-inzerat`
výš. Udělat to **jednou dávkou**, ne po částech, ať nic nezůstane rozpůlené.

> Anon klíč `sb_publishable_…` se netýká — je veřejný záměrně a chrání ho RLS.

**Zvážit i klíč Resendu** (`resend_api_key` v Supabase Vaultu). Nikde neunikl,
ale od 8. 10. 2026 je citlivější než dřív: v Google Workspace je výjimka ze
spamového filtru pro celou doménu `makej.eu` s podmínkou ověření, takže
kdokoli s tím klíčem dokáže poslat poštu, která projde DKIM jako `@makej.eu`
a **dorazí všem do doručené pošty bez kontroly**.

---

## 4b · Doručitelnost pošty

Vyřešeno 8. 10. 2026, ale ať se to nerozbije:

- **SPF neprochází zarovnaně.** Obálková doména Resendu je Amazon SES
  (`54.240.3.11`), ne `send.makej.eu`, takže SPF sice projde, ale nezarovná se
  na `makej.eu`. **DMARC drží výhradně na DKIM.** Kdyby záznam
  `resend._domainkey.makej.eu` zmizel nebo se rozbil, DMARC spadne, pošta jde
  do spamu a zároveň přestane platit výjimka v Gmailu, která ověření vyžaduje.
- Klíč `resend._domainkey` je **1024bitový** (Google doporučuje 2048). Když
  Resend nabídne přetočení na 2048, udělat to.
- DMARC je `v=DMARC1; p=none;` **bez `rua=`** — nechodí žádná hlášení, takže
  o příští potíži se dozvíme až od příjemce. Doplnit `rua=mailto:…`.
- E-maily se posílají **jen jako HTML, bez textové verze** (`makej_posli_email`
  skládá tělo jen s `html`). Chybějící `text/plain` je mírný spamový signál.
- Doménu poškodila vlna botů (29. 9.–4. 10. 2026, ~90 nevyžádaných uvítacích
  e-mailů na vykradené adresy). Před hromadnou poštou proto vždy filtrovat
  `where not podezrele`.

---

## 5 · Úklid

### Dva 404 obrázky v onboardingu
`makej-app/employer/employer-main.jsx:625,627,636` odkazuje na `/right-arrow.png`
a `/checked.png`, které **nikdy neexistovaly** (ani ve `makej-web` před
rozdělením). Je to v animaci dokončené registrace firmy. Buď je doplnit, nebo
nahradit ikonou — teď tam jsou prázdná místa.

### Nepoužité soubory ve `makej-web`
Netrackované, takže se nenasazují — ale zabírají místo a pletou:

- `_dashtest/` (824 kB), `_employer-moje-zaloha/` (624 kB)
- `lide-hero-orig.jpg`, `lide-hero.png`, `logo-m.png`, `neres.png`

### Chybějící obrázek v blogu
Článek „Očekávání vs. realita" nemá obrázek na úvod.

### „Staň se Makačem"
Na `/hledam-si-praci` zůstal starý text, zatímco úvodka už používá nový.

---

## 6 · Hotovo

- ~~**Resend — suppressions**~~ (hotovo 5. 10. 2026). Adresy z vlny botů jsou
  nahrané. **Platí dál:** před jakoukoli hromadnou poštou filtrovat
  `where not podezrele` v `launch_emails` — sloupec označuje zápisy
  z vlny botů přes Tor (29. 9.–4. 10. 2026), viz
  `supabase/migration_launch_list_boti.sql`.
- ~~Přesun dashboardu a appky na `app.makej.eu`~~ (hotovo 5. 10. 2026, obě fáze).

---

## Kontrola na závěr

Po všech změnách projít:

```bash
node kontrola-ikon.mjs          # ikony musí být přednačtené
node --check script.js
python3 -m http.server 3333     # makej-web
python3 -m http.server 3334     # makej-app
```

A ručně: přihlásit se **bez klíče** (musí projít), zkusit registraci
brigádníka (po založení účtu **nesmí** vyhodit ven), v dashboardu ověřit, že
nejsou vidět ukázkové inzeráty a že topování má limit podle tarifu.
