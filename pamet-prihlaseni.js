/* ═══════════ PAMATOVÁNÍ PŘIHLÁŠENÍ ═══════════
   Sdílí web (script.js), firemní dashboard (/employer/) i /worker/ — všude
   je stejný Supabase klient se storageKey 'makej-auth', takže přihlášení
   na webu platí i v dashboardu a naopak. Načítá se hned za supabase-js,
   dřív než se klient vytvoří.

   „Zůstat přihlášen" v přihlašovacím okně (Yasin 2026-10-01):
   - zaškrtnuté (výchozí) → přihlášení leží v localStorage a vydrží 30 dní
     od poslední návštěvy; každé otevření webu nebo dashboardu lhůtu posune,
   - odškrtnuté → přihlášení leží v sessionStorage a zmizí se zavřením
     prohlížeče (přesněji karty; přechod web → dashboard → web je v jedné
     kartě, takže v něm drží).
   Heslo se nikde neukládá, jen přihlašovací klíč od Supabase (platí hodinu
   a sám se obnovuje). Odhlášení ho smaže a Supabase zneplatní. */
(function () {
  var KLIC = 'makej-auth';             // storageKey Supabase klienta (+ odvozené klíče s pomlčkou)
  var REZIM = 'makej-pamatovat';       // '0' = jen do zavření prohlížeče, jinak pamatovat
  var NAPOSLEDY = 'makej-naposledy';   // čas poslední návštěvy (ms) pro 30denní lhůtu
  var LHUTA = 30 * 24 * 60 * 60 * 1000;

  function uloz(typ) { try { var s = window[typ]; s.getItem('x'); return s; } catch (e) { return null; } }
  var trvale = uloz('localStorage'), docasne = uloz('sessionStorage');

  function pamatovat() {
    try { return !trvale || trvale.getItem(REZIM) !== '0'; } catch (e) { return true; }
  }
  function aktivni() { return pamatovat() ? trvale : (docasne || trvale); }
  function smazPrihlaseni(s) {
    if (!s) return;
    try {
      // Klíče nejdřív posbírat, pak mazat — pořadí key(i) se po smazání mění.
      var pryc = [];
      for (var i = 0; i < s.length; i++) {
        var k = s.key(i);
        if (k === KLIC || (k && k.indexOf(KLIC + '-') === 0)) pryc.push(k);
      }
      pryc.forEach(function (k) { s.removeItem(k); });
    } catch (e) {}
  }

  // Prošlé přihlášení zahodit dřív, než ho klient načte. Kdo byl přihlášený
  // před zavedením lhůty (NAPOSLEDY chybí), tomu se začne počítat teď.
  try {
    if (trvale && pamatovat() && trvale.getItem(KLIC)) {
      var t = Number(trvale.getItem(NAPOSLEDY)) || 0;
      if (t && Date.now() - t > LHUTA) smazPrihlaseni(trvale);
      else trvale.setItem(NAPOSLEDY, String(Date.now()));
    }
  } catch (e) {}

  // Úložiště pro supabase.createClient({ auth: { storage } }).
  window.mkAuthUloziste = {
    getItem: function (k) { var s = aktivni(); try { return s ? s.getItem(k) : null; } catch (e) { return null; } },
    setItem: function (k, v) {
      var s = aktivni();
      try {
        if (s) s.setItem(k, v);
        if (s === trvale && trvale) trvale.setItem(NAPOSLEDY, String(Date.now()));
      } catch (e) {}
    },
    removeItem: function (k) {
      try { if (trvale) trvale.removeItem(k); } catch (e) {}
      try { if (docasne) docasne.removeItem(k); } catch (e) {}
    }
  };

  // Volá přihlašovací okno těsně před přihlášením (heslem i přes Google).
  // Zbytky přihlášení z druhého úložiště se smažou, ať se nepletou.
  window.mkNastavPamatovani = function (ano) {
    try { if (trvale) trvale.setItem(REZIM, ano ? '1' : '0'); } catch (e) {}
    smazPrihlaseni(ano ? docasne : trvale);
    if (ano) { try { trvale && trvale.setItem(NAPOSLEDY, String(Date.now())); } catch (e) {} }
  };
})();
