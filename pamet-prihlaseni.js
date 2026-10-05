/* ═══════════ PAMATOVÁNÍ PŘIHLÁŠENÍ ═══════════
   Sdílí marketingový web (makej.eu) i appka s dashboardem (app.makej.eu).
   Načítá se hned za supabase-js, dřív než se vytvoří klient.

   PROČ COOKIE A NE localStorage: localStorage patří jednomu původu, takže
   makej.eu a app.makej.eu by každý měl vlastní a člověk by se musel
   přihlašovat dvakrát. Cookie s `domain=.makej.eu` platí pro doménu i
   všechny její poddomény.

   „Zůstat přihlášen" v přihlašovacím okně:
   - zaškrtnuté (výchozí) → cookie s platností 30 dní, každý zápis lhůtu
     posune, takže kdo chodí, zůstane přihlášený,
   - odškrtnuté → cookie bez platnosti, zmizí se zavřením prohlížeče.

   DĚLENÍ NA KUSY: přihlašovací klíč od Supabase bývá 2–4 kB, limit jedné
   cookie je 4 kB i s názvem a atributy. Hodnota se proto ukládá po kusech
   do `makej-auth.0`, `makej-auth.1` … a při čtení se zase slepí. Bez toho
   by delší session tiše spadla pod stůl a člověka by to odhlásilo.

   Heslo se nikde neukládá, jen přihlašovací klíč (platí hodinu a sám se
   obnovuje). Odhlášení ho smaže a Supabase zneplatní.

   POZOR: tenhle soubor je ve dvou repozitářích (makej-web a makej-app)
   a musí být v obou stejný — jinak si weby přestanou rozumět. */
(function () {
  var KLIC    = 'makej-auth';          // storageKey Supabase klienta
  var REZIM   = 'makej-pamatovat';     // '0' = jen do zavření prohlížeče
  var DNI     = 30;
  var KUS     = 3200;                  // bajtů na jednu cookie, se zásobou

  // Na localhostu a náhledech Netlify doménu nenastavujeme — prohlížeč by
  // cookie s cizí doménou zahodil.
  var host = location.hostname;
  var DOMENA = /(^|\.)makej\.eu$/.test(host) ? '; domain=.makej.eu' : '';
  var ZABEZPECENO = location.protocol === 'https:' ? '; secure' : '';

  function vsechny() {
    var m = {};
    document.cookie.split(';').forEach(function (kus) {
      var i = kus.indexOf('=');
      if (i < 0) return;
      m[decodeURIComponent(kus.slice(0, i).trim())] = kus.slice(i + 1);
    });
    return m;
  }

  function zapisCookie(jmeno, hodnota, trvale) {
    var platnost = trvale ? '; max-age=' + (DNI * 24 * 60 * 60) : '';
    document.cookie = encodeURIComponent(jmeno) + '=' + hodnota +
      '; path=/' + DOMENA + platnost + '; samesite=lax' + ZABEZPECENO;
  }

  function smazCookie(jmeno) {
    document.cookie = encodeURIComponent(jmeno) + '=; path=/' + DOMENA +
      '; max-age=0; samesite=lax' + ZABEZPECENO;
  }

  function pamatovat() {
    return vsechny()[REZIM] !== '0';
  }

  // ── Úložiště pro supabase.createClient({ auth: { storage } }) ──
  window.mkAuthUloziste = {
    getItem: function (k) {
      var c = vsechny();
      if (c[k] != null) return decodeURIComponent(c[k]);     // krátká hodnota
      var slepeno = '', i = 0;
      while (c[k + '.' + i] != null) { slepeno += c[k + '.' + i]; i++; }
      return i ? decodeURIComponent(slepeno) : null;
    },
    setItem: function (k, v) {
      var trvale = pamatovat();
      var text = encodeURIComponent(v);
      // Staré kusy pryč, ať po kratší hodnotě nezůstane ocas z delší.
      this.removeItem(k);
      if (text.length <= KUS) { zapisCookie(k, text, trvale); return; }
      for (var i = 0; i * KUS < text.length; i++) {
        zapisCookie(k + '.' + i, text.substr(i * KUS, KUS), trvale);
      }
    },
    removeItem: function (k) {
      smazCookie(k);
      var c = vsechny();
      for (var i = 0; c[k + '.' + i] != null; i++) smazCookie(k + '.' + i);
    },
  };

  // Přepínač „Zůstat přihlášen" — volá ho přihlašovací okno ve script.js
  // těsně před přihlášením. Název drží původní API, ať se volající nemění.
  window.mkNastavPamatovani = function (ano) {
    zapisCookie(REZIM, ano ? '1' : '0', true);
    // Přepnutí režimu musí přepsat i už uloženou session, jinak by si
    // podržela platnost z doby, kdy bylo zaškrtnutí jinak.
    var s = window.mkAuthUloziste.getItem(KLIC);
    if (s != null) window.mkAuthUloziste.setItem(KLIC, s);
  };

  // ── Přístupová brána před spuštěním ──
  // Klíč z přihlašovacího okna na makej.eu musí znát i appka na app.makej.eu,
  // jinak by ho po přesměrování chtěla znovu. Proto cookie pro celou doménu,
  // ne sessionStorage — ten patří jednomu původu. Bez platnosti, takže zmizí
  // se zavřením prohlížeče, jak se u brány čekalo i dřív.
  var BRANA = 'makej-brana';
  window.mkBrana = {
    precti: function () {
      var h = vsechny()[BRANA];
      return h == null ? null : decodeURIComponent(h);
    },
    uloz: function (hodnota) { zapisCookie(BRANA, encodeURIComponent(hodnota), false); },
  };

  // Jednorázový přesun ze starého localStorage, ať se nikdo neodhlásí.
  try {
    var ls = window.localStorage;
    if (ls && ls.getItem(KLIC) && !window.mkAuthUloziste.getItem(KLIC)) {
      window.mkAuthUloziste.setItem(KLIC, ls.getItem(KLIC));
      ls.removeItem(KLIC);
    }
  } catch (e) { /* localStorage může být zakázaný, nevadí */ }
})();
