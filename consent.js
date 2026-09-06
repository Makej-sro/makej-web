/* ═══════════════════════════════════════════════════════════════════════════
   Makej — souhlas s cookies (makej.eu)
   ─────────────────────────────────────────────────────────────────────────
   Jeden soubor bez závislostí, načítá ho každá stránka z hlavičky (spolu
   s consent.css). JEDINÝ ZDROJ PRAVDY pro kategorie a inventář je INVENTAR
   níže — seznamy v dialogu i tabulka na /zasady-cookies se z něj generují,
   takže se nemůžou rozejít s tím, co web opravdu ukládá.

   Přidáváš nástroj třetí strany (pixel, chat, mapu, video)?
     1. zapiš jeho cookies do INVENTAR (kategorie bez položek se v dialogu
        vůbec neukáže — proto teď chybí „Marketingové"),
     2. zvyš VERZE — staré souhlasy tím přestanou platit a lišta se zeptá znovu,
     3. jeho skript načítej AŽ po souhlasu (vzor: nactiAnalytiku), ne v <head>.
        Přidat skript do hlavičky a jen mu „vypnout" typ nestačí, prohlížeč
        ho stejně stáhne.

   Co tenhle soubor drží (§ 89 odst. 3 zák. 127/2005 Sb., GDPR čl. 7):
     - Odmítnout vše / Přijmout vše rovnocenné na první vrstvě, bez křížku.
       Scroll, klik mimo ani Esc souhlas nezakládají; není to cookie wall.
     - Volitelné kategorie nikdy nejsou předzaškrtnuté.
     - Nic volitelného se nenačte, dokud není souhlas; Google Analytics jde
       na stránku až odsud.
     - Odvolání je stejně snadné jako udělení: odkaz v patičce každé stránky.
     - Po odebrání kategorie se smažou její cookies a stránka se znovu načte,
       protože cizí skript v paměti stránky jinak běží dál.
     - Každé rozhodnutí se zapíše do Supabase (RPC log_consent) kvůli
       doložitelnosti — bez IP, bez plného user-agentu. Výpadek nic nerozbije.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VERZE        = '2026-09-06.1';   // verze kategorií + inventáře (zvýšit při každé změně)
  var VERZE_ZASAD  = '2026-09-06';     // verze textu na /zasady-cookies
  var KLIC         = 'makej.consent';  // localStorage: celý záznam rozhodnutí
  var COOKIE       = 'makej_consent';  // cookie: zkratka „verze:kategorie" pro server
  var STARY_KLIC   = 'makej-cookie-consent';   // předchozí lišta (jen ano/ne) — smazat, ptáme se znovu
  var DNY_SOUHLAS  = 365;              // souhlas platí rok
  var DNY_ODMITNUTI = 182;             // po odmítnutí půl roku neotravovat
  var GA_ID        = 'G-25X9CMKGRD';
  var SUPABASE_URL = 'https://cxegfwfbgcgpwerfbvra.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_N_BIwMCTD6ZOTrtBl3juyw_CGIQ_lvh';   // veřejný (publishable) klíč
  var ODKAZY = { cookies: '/zasady-cookies', soukromi: '/privacy' };

  var KATEGORIE = [
    { klic: 'necessary', nazev: 'Nezbytné', zamcena: true,
      popis: 'Drží tě přihlášeného, pamatují si tvou volbu cookies a to, že ses zapsal do čekacího listu. Bez nich web nefunguje, proto je nelze vypnout — souhlas se na ně nevyžaduje.' },
    { klic: 'analytics', nazev: 'Analytické',
      popis: 'Google Analytics měří, kolik lidí web navštíví a které stránky čtou. Data vidíme jen v souhrnu, nepoužíváme je k cílení reklamy.' },
    { klic: 'marketing', nazev: 'Marketingové',
      popis: 'Měření reklamy a její cílení jinde na internetu. Zatím žádné takové nástroje nepoužíváme.' },
    { klic: 'preferences', nazev: 'Preferenční',
      popis: 'Pamatují si tvá nastavení ve webové verzi aplikace — vybrané kraje ve filtru brigád a nastavení upozornění. Bez nich vše funguje, jen si to nepamatuje.' },
  ];

  /* Skutečný inventář — ověřeno v kódu webu 2026-09-06 (grep localStorage /
     sessionStorage / cookie napříč webem, firemním dashboardem i webovou verzí
     appky). Co tu není, web neukládá. */
  var INVENTAR = [
    // ── nezbytné ──
    { nazev: 'makej_consent', kategorie: 'necessary', kdo: 'Makej', typ: 'cookie', doba: '12 měsíců',
      ucel: 'Zkratka tvé volby cookies (verze a povolené kategorie), aby se lišta neukazovala pořád znovu.' },
    { nazev: 'makej.consent', kategorie: 'necessary', kdo: 'Makej', typ: 'localStorage', doba: '12 měsíců (po odmítnutí 6)',
      ucel: 'Úplný záznam tvé volby cookies — kdy, jak a s jakou verzí zásad ses rozhodl(a).' },
    { nazev: 'makej-auth', kategorie: 'necessary', kdo: 'Makej (Supabase)', typ: 'localStorage', doba: 'do odhlášení',
      ucel: 'Přihlašovací session. Bez ní bys zadával(a) heslo při každém otevření webu i aplikace.' },
    { nazev: 'makej-cekacka', kategorie: 'necessary', kdo: 'Makej', typ: 'localStorage', doba: 'do smazání',
      ucel: 'Pamatuje, že ses zapsal(a) do čekacího listu, aby se ti formulář neukazoval znovu.' },
    { nazev: 'makej-gate-ok', kategorie: 'necessary', kdo: 'Makej', typ: 'sessionStorage', doba: 'do zavření prohlížeče',
      ucel: 'Pamatuje, že jsi zadal(a) přístupový kód k náhledu aplikace před spuštěním.' },
    { nazev: 'makej-emp-jobdraft', kategorie: 'necessary', kdo: 'Makej', typ: 'localStorage', doba: 'do odeslání inzerátu',
      ucel: 'Rozepsaný inzerát ve firemním dashboardu, aby se neztratil při zavření stránky.' },
    { nazev: 'emp-lastread-*', kategorie: 'necessary', kdo: 'Makej', typ: 'localStorage', doba: 'do smazání',
      ucel: 'Kdy jsi naposledy otevřel(a) konverzaci ve firemním dashboardu — z toho se počítají nepřečtené zprávy.' },
    // ── analytické ──
    { nazev: '_ga', kategorie: 'analytics', kdo: 'Google Ireland Ltd.', typ: 'cookie', doba: '2 roky',
      ucel: 'Rozlišuje návštěvníky pro souhrnnou statistiku návštěvnosti (Google Analytics 4).' },
    { nazev: '_ga_25X9CMKGRD', kategorie: 'analytics', kdo: 'Google Ireland Ltd.', typ: 'cookie', doba: '2 roky',
      ucel: 'Drží stav návštěvy pro Google Analytics 4 (měření G-25X9CMKGRD).' },
    // ── preferenční ──
    { nazev: 'makej-worker-kraje', kategorie: 'preferences', kdo: 'Makej', typ: 'localStorage', doba: 'do smazání',
      ucel: 'Vybrané kraje ve filtru brigád ve webové verzi aplikace.' },
    { nazev: 'makej-notifs', kategorie: 'preferences', kdo: 'Makej', typ: 'localStorage', doba: 'do smazání',
      ucel: 'Zapnutá / vypnutá upozornění ve webové verzi aplikace.' },
  ];

  /* Co smazat, když člověk kategorii odebere. Hvězdička na konci = vše, co tím
     začíná (Google dělá _ga_G-XXXX). Marketing je připravený dopředu. */
  var MAZAT = {
    analytics:   { cookies: ['_ga', '_ga_*', '_gid', '_gat*', '_gcl_au'], local: [] },
    marketing:   { cookies: ['_fbp', '_fbc', 'fr', '_ttp', 'ttclid'], local: [] },
    preferences: { cookies: [], local: ['makej-worker-kraje', 'makej-notifs'] },
  };
  var VOLITELNE = ['analytics', 'marketing', 'preferences'];
  var FOKUS = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  var zaznam = null;                       // platný záznam, nebo null → lišta
  var lista = null, dialog = null, spoustec = null, roVyska = null, gaNacteno = false;

  /* Kategorie, které mají smysl ukazovat: nezbytné vždy, ostatní jen když
     mají v inventáři aspoň jednu položku. Prázdná kategorie by slibovala
     souhlas s něčím, co neexistuje. */
  function viditelne() {
    return KATEGORIE.filter(function (k) {
      return k.zamcena || INVENTAR.some(function (i) { return i.kategorie === k.klic; });
    });
  }

  // ── úložiště záznamu ──────────────────────────────────────────────────────
  function uuid() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function dniOd(iso) { var t = Date.parse(iso); return isNaN(t) ? Infinity : (Date.now() - t) / 864e5; }
  function jePlatny(r) {
    if (!r || r.version !== VERZE || !r.categories || !r.decidedAt) return false;
    var necoPovoleno = VOLITELNE.some(function (k) { return !!r.categories[k]; });
    return dniOd(r.decidedAt) < (necoPovoleno ? DNY_SOUHLAS : DNY_ODMITNUTI);
  }
  function cti() {
    try { var r = JSON.parse(localStorage.getItem(KLIC) || 'null'); return jePlatny(r) ? r : null; }
    catch (e) { return null; }
  }
  function zapis(r) {
    try { localStorage.setItem(KLIC, JSON.stringify(r)); } catch (e) { /* soukromé okno */ }
    var f = (r.categories.analytics ? 'a' : '') + (r.categories.marketing ? 'm' : '') + (r.categories.preferences ? 'p' : '');
    document.cookie = COOKIE + '=' + r.version + ':' + (f || 'none') + '; path=/; max-age=' + (86400 * DNY_SOUHLAS)
      + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }
  function zahod() {
    try { localStorage.removeItem(KLIC); } catch (e) {}
    document.cookie = COOKIE + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  // ── evidence (Supabase RPC, best-effort) ──────────────────────────────────
  function zaloguj(r) {
    try {
      fetch(SUPABASE_URL + '/rest/v1/rpc/log_consent', {
        method: 'POST', keepalive: true,   // přežije i reload po odvolání
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
        body: JSON.stringify({
          p_consent_id: r.consentId, p_consent_version: r.version, p_policy_version: r.policyVersion,
          p_decided_at: r.decidedAt, p_method: r.method,
          p_analytics: !!r.categories.analytics, p_marketing: !!r.categories.marketing, p_preferences: !!r.categories.preferences,
        }),
      }).catch(function () {});
    } catch (e) { /* logování je best-effort */ }
  }

  // ── Google Consent Mode v2 + načtení Analytics až po souhlasu ─────────────
  function signaly(v) {
    var s = function (b) { return b ? 'granted' : 'denied'; };
    return {
      ad_storage: s(v.marketing), ad_user_data: s(v.marketing), ad_personalization: s(v.marketing),
      analytics_storage: s(v.analytics),
      functionality_storage: s(v.preferences), personalization_storage: s(v.preferences),
      security_storage: 'granted',
    };
  }
  function gtagFn() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') window.gtag = function () { window.dataLayer.push(arguments); };
    return window.gtag;
  }
  function posliUpdate(v) { gtagFn()('consent', 'update', signaly(v)); }
  function nactiAnalytiku() {
    if (gaNacteno) return;
    gaNacteno = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    var g = gtagFn();
    g('js', new Date());
    g('config', GA_ID);
  }
  function aplikuj(v) { posliUpdate(v); if (v.analytics) nactiAnalytiku(); }

  // ── mazání při odebrání kategorie ─────────────────────────────────────────
  function smazCookie(n) {
    // Prohlížeč neřekne, na které doméně/cestě cookie sedí — zkusit všechny.
    var host = location.hostname, casti = host.split('.'), domeny = [host, '.' + host], i, d;
    for (i = 0; i < casti.length - 1; i++) { d = casti.slice(i).join('.'); domeny.push(d, '.' + d); }
    var exp = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
    ['/', location.pathname].forEach(function (p) {
      document.cookie = n + '=; ' + exp + '; path=' + p;
      domeny.forEach(function (dm) { document.cookie = n + '=; ' + exp + '; path=' + p + '; domain=' + dm; });
    });
  }
  function jmenaCookies(vzor) {
    var vse = document.cookie.split(';').map(function (c) { return c.split('=')[0].trim(); }).filter(Boolean);
    if (vzor.slice(-1) !== '*') return vse.indexOf(vzor) >= 0 ? [vzor] : [];
    var p = vzor.slice(0, -1);
    return vse.filter(function (n) { return n.indexOf(p) === 0; });
  }
  function vyklidOdebrane(prev, next) {
    VOLITELNE.forEach(function (k) {
      if (!prev || !prev[k] || next[k]) return;
      MAZAT[k].cookies.forEach(function (vz) { jmenaCookies(vz).forEach(smazCookie); });
      MAZAT[k].local.forEach(function (n) { try { localStorage.removeItem(n); } catch (e) {} });
    });
  }
  function potrebujeReload(prev, next) {
    return !!prev && VOLITELNE.some(function (k) { return prev[k] && !next[k]; });
  }

  // ── rozhodnutí ────────────────────────────────────────────────────────────
  function potvrd(volba, metoda) {
    var prev = zaznam ? zaznam.categories : null;
    var kat = { necessary: true, analytics: !!volba.analytics, marketing: !!volba.marketing, preferences: !!volba.preferences };
    var r = {
      consentId: zaznam ? zaznam.consentId : uuid(),
      version: VERZE, policyVersion: VERZE_ZASAD,
      decidedAt: new Date().toISOString(), method: metoda, categories: kat,
    };
    zapis(r); zaloguj(r); vyklidOdebrane(prev, kat);
    zaznam = r;
    zavriDialog(); skryjListu(); obnovStav();
    // Odebraná kategorie: cizí skript už je v paměti stránky, pryč ho dostane
    // jen nové načtení.
    if (potrebujeReload(prev, kat)) { location.reload(); return; }
    aplikuj(kat);
  }
  function prijmoutVse() {
    // Jen kategorie, které se opravdu ukazují — souhlas „s ničím" nedává smysl.
    var v = {};
    viditelne().forEach(function (k) { if (!k.zamcena) v[k.klic] = true; });
    potvrd(v, 'accept_all');
  }
  function odmitnoutVse() { potvrd({}, 'reject_all'); }
  function odvolat() {
    var prev = zaznam ? zaznam.categories : null;
    var nic = { necessary: true, analytics: false, marketing: false, preferences: false };
    zaloguj({ consentId: zaznam ? zaznam.consentId : uuid(), version: VERZE, policyVersion: VERZE_ZASAD,
              decidedAt: new Date().toISOString(), method: 'withdraw', categories: nic });
    posliUpdate(nic); vyklidOdebrane(prev, nic); zahod();
    location.reload();
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  function ukazListu() {
    if (lista || dialog) return;
    lista = el(
      '<div class="mk-ck" role="region" aria-label="Nastavení cookies">' +
        '<div class="mk-ck__body">' +
          '<p class="mk-ck__t">Používáme cookies na měření návštěvnosti a zapamatování nastavení — jen s tvým souhlasem. ' +
            '<a href="' + ODKAZY.cookies + '">Zásady cookies</a> · ' +
            '<button class="mk-ck__more" type="button" data-akce="podrobne">Podrobné nastavení</button></p>' +
          '<div class="mk-ck__row">' +
            '<button class="mk-ck__btn mk-ck__btn--reject" type="button" data-akce="odmitnout">Odmítnout vše</button>' +
            '<button class="mk-ck__btn mk-ck__btn--accept" type="button" data-akce="prijmout">Přijmout vše</button>' +
          '</div>' +
        '</div>' +
      '</div>');
    lista.addEventListener('click', function (e) {
      var b = e.target.closest('[data-akce]');
      if (!b) return;
      if (b.getAttribute('data-akce') === 'odmitnout') odmitnoutVse();
      else if (b.getAttribute('data-akce') === 'prijmout') prijmoutVse();
      else otevriDialog(b);
    });
    document.body.appendChild(lista);
    // Rezerva pod obsahem podle skutečné výšky lišty — na mobilu je ve sloupci
    // a měří i 200 px; bez toho by překryla formuláře u spodní hrany.
    var nastavVysku = function () { if (lista) document.documentElement.style.setProperty('--mk-ck-h', (lista.offsetHeight + 36) + 'px'); };
    nastavVysku();
    if (window.ResizeObserver) { roVyska = new ResizeObserver(nastavVysku); roVyska.observe(lista); }
    window.addEventListener('resize', nastavVysku);
  }
  function skryjListu() {
    if (!lista) return;
    if (roVyska) { roVyska.disconnect(); roVyska = null; }
    lista.parentNode.removeChild(lista);
    lista = null;
    document.documentElement.style.removeProperty('--mk-ck-h');
  }

  function otevriDialog(spoust) {
    if (dialog) return;
    spoustec = spoust || document.activeElement;
    // Výchozí stav volitelných je vždy false — předzaškrtnuté políčko je porušení.
    var navrh = { analytics: false, marketing: false, preferences: false };
    if (zaznam) VOLITELNE.forEach(function (k) { navrh[k] = !!zaznam.categories[k]; });

    var seznam = viditelne().map(function (k) {
      var polozky = INVENTAR.filter(function (i) { return i.kategorie === k.klic; });
      var on = k.zamcena || navrh[k.klic];
      return '<div class="mk-cat">' +
        '<div class="mk-cat__hd">' +
          '<div class="mk-cat__t"><span class="mk-cat__name">' + k.nazev + '</span><span class="mk-cat__desc">' + k.popis + '</span></div>' +
          (k.zamcena
            ? '<span class="mk-cat__lock">Vždy aktivní</span>'
            : '<button class="mk-sw' + (on ? ' mk-sw--on' : '') + '" type="button" role="switch" aria-checked="' + on + '" aria-label="' + k.nazev + '" data-akce="prepnout" data-kat="' + k.klic + '"><span class="mk-sw__k"></span></button>') +
        '</div>' +
        (polozky.length
          ? '<button class="mk-cat__more" type="button" aria-expanded="false" data-akce="seznam">Zobrazit seznam (' + polozky.length + ')</button>' +
            '<ul class="mk-cat__items" hidden>' + polozky.map(function (i) {
              return '<li class="mk-item"><span class="mk-item__n">' + i.nazev + '</span><span class="mk-item__p">' + i.ucel + '</span>' +
                     '<span class="mk-item__m">' + i.kdo + ' · ' + i.doba + ' · ' + i.typ + '</span></li>';
            }).join('') + '</ul>'
          : '') +
      '</div>';
    }).join('');

    dialog = el(
      '<div class="mk-pf">' +
        '<div class="mk-pf__scrim" data-akce="zavrit"></div>' +
        '<div class="mk-pf__box" role="dialog" aria-modal="true" aria-labelledby="mk-pf-title" aria-describedby="mk-pf-desc">' +
          '<div class="mk-pf__hd"><div>' +
            '<h2 class="mk-pf__title" id="mk-pf-title">Nastavení cookies</h2>' +
            '<p class="mk-pf__sub" id="mk-pf-desc">Vyber si, co smíme ukládat. Nezbytné cookies drží web v provozu, proto je nelze vypnout.</p>' +
          '</div>' +
          '<button class="mk-pf__x" type="button" data-akce="zavrit" aria-label="Zavřít bez uložení">' +
            '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
          '</button></div>' +
          '<div class="mk-pf__list">' + seznam + '</div>' +
          '<div class="mk-pf__ft">' +
            '<div class="mk-pf__row">' +
              '<button class="mk-ck__btn mk-ck__btn--reject" type="button" data-akce="odmitnout">Odmítnout vše</button>' +
              '<button class="mk-ck__btn mk-ck__btn--accept" type="button" data-akce="prijmout">Přijmout vše</button>' +
            '</div>' +
            '<button class="mk-pf__save" type="button" data-akce="ulozit">Uložit moji volbu</button>' +
            '<p class="mk-pf__fine">Volbu můžeš kdykoli změnit v patičce. Podrobnosti v <a href="' + ODKAZY.cookies + '">zásadách cookies</a>.</p>' +
          '</div>' +
        '</div>' +
      '</div>');

    dialog.addEventListener('click', function (e) {
      var b = e.target.closest('[data-akce]');
      if (!b) return;
      var a = b.getAttribute('data-akce');
      if (a === 'zavrit') zavriDialog();                       // bez uložení
      else if (a === 'prepnout') {
        var k = b.getAttribute('data-kat');
        navrh[k] = !navrh[k];
        b.classList.toggle('mk-sw--on', navrh[k]);
        b.setAttribute('aria-checked', String(navrh[k]));
      }
      else if (a === 'seznam') {
        var ul = b.nextElementSibling, otevrit = ul.hidden;
        ul.hidden = !otevrit;
        b.setAttribute('aria-expanded', String(otevrit));
        b.textContent = otevrit ? 'Skrýt seznam' : 'Zobrazit seznam (' + ul.children.length + ')';
      }
      else if (a === 'odmitnout') odmitnoutVse();
      else if (a === 'prijmout') prijmoutVse();
      else if (a === 'ulozit') potvrd(navrh, 'custom');
    });
    // Esc zavře bez uložení, Tab cykluje jen po prvcích dialogu.
    dialog._klavesy = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); zavriDialog(); return; }
      if (e.key !== 'Tab') return;
      var prvky = Array.prototype.filter.call(dialog.querySelector('.mk-pf__box').querySelectorAll(FOKUS), function (n) { return n.offsetParent !== null; });
      if (!prvky.length) return;
      var prvni = prvky[0], posledni = prvky[prvky.length - 1];
      if (e.shiftKey && document.activeElement === prvni) { e.preventDefault(); posledni.focus(); }
      else if (!e.shiftKey && document.activeElement === posledni) { e.preventDefault(); prvni.focus(); }
    };
    document.addEventListener('keydown', dialog._klavesy);
    dialog._overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(dialog);
    var prvni = dialog.querySelector('.mk-pf__box').querySelector(FOKUS);
    if (prvni) prvni.focus();
  }
  function zavriDialog() {
    if (!dialog) return;
    document.removeEventListener('keydown', dialog._klavesy);
    document.body.style.overflow = dialog._overflow || '';
    dialog.parentNode.removeChild(dialog);
    dialog = null;
    // Fokus zpět na spouštěč, jinak skočí na začátek dokumentu.
    if (spoustec && spoustec.focus) { try { spoustec.focus(); } catch (e) {} }
    spoustec = null;
  }

  // ── /zasady-cookies: tabulka z inventáře + aktuální stav ──────────────────
  function nazevKategorie(klic) {
    var k = KATEGORIE.filter(function (x) { return x.klic === klic; })[0];
    return k ? k.nazev : klic;
  }
  function vykresliTabulku(cil) {
    var radky = INVENTAR.map(function (i) {
      return '<tr><td><code>' + i.nazev + '</code></td><td>' + nazevKategorie(i.kategorie) + '</td><td>' + i.kdo + '</td><td>' + i.ucel + '</td><td>' + i.doba + '</td><td>' + i.typ + '</td></tr>';
    }).join('');
    cil.innerHTML = '<div class="mk-tab-obal"><table class="mk-tab"><colgroup><col><col><col><col><col><col></colgroup><thead><tr><th>Název</th><th>Kategorie</th><th>Kdo ukládá</th><th>Účel</th><th>Doba</th><th>Typ</th></tr></thead><tbody>' + radky + '</tbody></table></div>';
  }
  function obnovStav() {
    var stav = document.querySelector('[data-cookie-stav]');
    var odvolani = document.querySelector('[data-cookie-odvolat]');
    if (!stav) return;
    if (!zaznam) {
      stav.textContent = 'Zatím ses nerozhodl(a) — lišta se ukáže při načtení stránky. Bez rozhodnutí web ukládá jen nezbytné záznamy.';
      if (odvolani) odvolani.hidden = true;
      return;
    }
    var casti = viditelne().filter(function (k) { return !k.zamcena; }).map(function (k) {
      return k.nazev.toLowerCase() + ': ' + (zaznam.categories[k.klic] ? 'povoleno' : 'zakázáno');
    });
    var kdy = new Date(zaznam.decidedAt);
    stav.textContent = 'Tvoje aktuální volba — ' + casti.join(', ') + '. Rozhodnuto ' + kdy.toLocaleDateString('cs-CZ') + ', verze souhlasu ' + zaznam.version + '.';
    if (odvolani) odvolani.hidden = !VOLITELNE.some(function (k) { return !!zaznam.categories[k]; });
  }

  // ── start ─────────────────────────────────────────────────────────────────
  function start() {
    try { localStorage.removeItem(STARY_KLIC); } catch (e) {}   // stará lišta měla jiné kategorie → ptáme se znovu
    zaznam = cti();
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-cookie-nastaveni]');
      if (a) { e.preventDefault(); otevriDialog(a); return; }
      var o = e.target.closest && e.target.closest('[data-cookie-odvolat]');
      if (o) { e.preventDefault(); odvolat(); }
    });
    var tab = document.querySelector('[data-cookie-tabulka]');
    if (tab) vykresliTabulku(tab);
    obnovStav();
    if (zaznam) aplikuj(zaznam.categories);
    else setTimeout(ukazListu, 600);
    if (location.hash === '#nastaveni') setTimeout(function () { otevriDialog(null); }, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.MakejConsent = {
    VERZE: VERZE, KATEGORIE: KATEGORIE, INVENTAR: INVENTAR,
    /** Má návštěvník povolenou kategorii? `necessary` vrací vždy true. */
    ma: function (k) { return k === 'necessary' ? true : !!(zaznam && zaznam.categories[k]); },
    zaznam: function () { return zaznam; },
    otevrit: function () { otevriDialog(null); },
    prijmoutVse: prijmoutVse, odmitnoutVse: odmitnoutVse, odvolat: odvolat,
  };
})();
