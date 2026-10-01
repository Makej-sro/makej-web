/* ══════════════════════════════════════════════════════════════════════════
   KOVOVÉ NÁZVY A TLAČÍTKA V CENÍKU (metal-fx)
   ══════════════════════════════════════════════════════════════════════════
   Dashboard kreslí názvy tarifů a tlačítka jako tekutý kov přes WebGL2
   (knihovna /vendor/metal-fx/, MIT). Její komponenty jsou React, takže se
   sem musí React dotáhnout — ale jen ten, ne Babel: tenhle soubor je prostý
   JS s React.createElement, žádné JSX.

   Načítá se až ve chvíli, kdy ceník přijede do obrazu. Do té doby (a
   v prohlížeči bez WebGL2) zůstane čistě CSS náhrada z /cenik.css, která
   vypadá skoro stejně — takže když se tohle nenačte, nic se nerozbije.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  var sekce = document.getElementById('pricing');
  if (!sekce) return;

  // React máme u sebe (vendor/react/, MIT) — veřejná stránka nemusí viset na
  // cizí CDN a v dev prostředí to funguje i bez internetu.
  var REACT     = '/vendor/react/react.production.min.js';
  var REACT_DOM = '/vendor/react/react-dom.production.min.js';

  // Barvy tarifů 1:1 z dashboardu (_MK_TIER v employer-shell.jsx).
  var TIER = {
    zakladni:  { hex: '#B7C1D6', pillBg: '#B7C1D6', pillText: '#1F2430', core: 0.6  },
    vyhodny:   { hex: '#2E33F0', pillBg: '#2E33F0', pillText: '#FFFFFF', core: 0.18 },
    dynamicky: { hex: '#229B54', pillBg: '#229B54', pillText: '#FFFFFF', core: 0.18 },
    maximalni: { hex: '#BE5518', pillBg: '#BE5518', pillText: '#FFFFFF', core: 0.18 },
    vlastni:   { hex: '#7A41C8', pillBg: '#7A41C8', pillText: '#FFFFFF', core: 0.18 },
  };

  function skript(src) {
    return new Promise(function (ok, chyba) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = ok; s.onerror = function () { chyba(new Error(src)); };
      document.head.appendChild(s);
    });
  }

  function nasad(MFX) {
    if (typeof MFX.isMetalFxSupported === 'function' && !MFX.isMetalFxSupported()) return;
    var R = window.React, RD = window.ReactDOM, h = R.createElement;
    var D = MFX.METAL_BADGE_DEFAULTS;

    // ── Název tarifu ──
    sekce.querySelectorAll('.e-c2-nazev .mk-grad').forEach(function (el) {
      var id = el.closest('[data-tier]').getAttribute('data-tier');
      var t = TIER[id]; if (!t) return;
      var obal = el.parentNode;
      var font = '700 19px/1.2 Inter, sans-serif';
      obal.innerHTML = '';
      obal.setAttribute('data-cell', 'text');
      RD.createRoot(obal).render(
        h(MFX.MetalText, { font: font, color: t.hex, strength: 0.9 }, el.textContent)
      );
    });

    // ── Tlačítko ──
    // 1:1 podle _MkMetalButtonGL v employer-shell.jsx. Klíčová je `mask`:
    // ořezává kovové plátno do tvaru pilulky. Bez ní se kov rozlije přes celý
    // obdélník a tlačítko vypadá vybledle.
    sekce.querySelectorAll('.mk-rim--btn').forEach(function (ram) {
      var id = ram.closest('[data-tier]').getAttribute('data-tier');
      var t = TIER[id]; if (!t) return;
      var odkaz = ram.querySelector('.mk-rim-fill');
      // Jen třída pro obsluhu kliknutí. `mk-rim-fill` sem nepatří — je to
      // CSS náhrada a vnucuje výšku 22 px, takže by tlačítko zůstalo ploché.
      var text = odkaz.textContent;
      var trida = (odkaz.className.match(/employer-cta-register/) || [''])[0];
      var rad = 999, glow = D.glow, core = D.core;
      var maska = function (g, w, hh, b) {
        g.beginPath(); g.roundRect(0, 0, w, hh, Math.min(hh / 2, rad * b)); g.fill();
      };
      var abs = { position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: rad };
      var stin = 'inset 0px 0px 8.333px 0px rgba(255,255,255,' + glow + '), '
               + 'inset 0px 0px 8.333px 0px rgba(255,255,255,' + glow + '), '
               + 'inset 0px 0px 0px 0.833px rgba(255,255,255,0.5), '
               + 'inset 0px 0.833px 0px 0px rgba(255,255,255,0.78)';
      var obal = document.createElement('span');
      obal.setAttribute('data-cell', 'btn');
      obal.style.display = 'inline-flex';
      ram.parentNode.replaceChild(obal, ram);
      // Kliknutí na původním odkazu obsluhuje script.js (employer-cta-register →
      // skok na čekací list). Ten posluchač visí na tom konkrétním prvku, ne na
      // třídě — nový odkaz by ho nedostal, takže klik přepošleme na něj. Prvek
      // je sice vyjmutý z dokumentu, ale posluchač na něm drží dál.
      var kliknuti = function (e) { e.preventDefault(); odkaz.click(); };
      RD.createRoot(obal).render(
        h(MFX.MetalFx, {
          preset: 'silver', strength: id === 'zakladni' ? D.metalOpacity : 0.45,
          shaderScale: D.shaderScale, mask: maska, glowMode: 'ring', disableGlow: true,
          borderRadius: rad, style: { background: t.pillBg, borderRadius: rad },
        },
          h('div', { style: { position: 'relative', borderRadius: rad } },
            h('div', { 'aria-hidden': 'true', style: Object.assign({}, abs, { opacity: t.core,
              background: 'radial-gradient(ellipse ' + core.size + '% ' + core.size + '% at 50% 50%, '
                + 'rgba(255,255,255,1) ' + core.r + '%, rgba(255,255,255,0) '
                + Math.min(100, core.r + core.blur) + '%)' }) }),
            h('div', { 'aria-hidden': 'true', style: Object.assign({}, abs, {
              background: 'linear-gradient(to bottom, rgba(255,255,255,' + D.gradient + '), rgba(255,255,255,0))',
              boxShadow: stin }) }),
            h('a', { href: 'javascript:void(0)', className: trida, onClick: kliknuti, style: {
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 0, borderRadius: rad, padding: '10px 20px', background: 'transparent',
              boxShadow: 'none', color: t.pillText, fontSize: 15, fontWeight: 600, lineHeight: 1.2,
              whiteSpace: 'nowrap', textDecoration: 'none', cursor: 'pointer',
            } }, text)
          )
        )
      );
    });
  }

  var spusteno = false;
  // Prohlížeč bez IntersectionObserver načte kov po dokončení stránky —
  // pořád až po všem ostatním, jen bez čekání na scroll.
  if (!window.IntersectionObserver) {
    addEventListener('load', function () { if (!spusteno) { spusteno = true; nacti(); } });
    return;
  }
  new IntersectionObserver(function (zaznamy, io) {
    if (!zaznamy.some(function (z) { return z.isIntersecting; }) || spusteno) return;
    spusteno = true; io.disconnect(); nacti();
  }, { rootMargin: '400px' }).observe(sekce);

  function nacti() {
    skript(REACT).then(function () { return skript(REACT_DOM); })
      .then(function () { return import('/vendor/metal-fx/metal-fx.js?v=2'); })
      .then(function (MFX) { try { MFX.setCursorLightConfig({ cursor: false }); } catch (e) {} nasad(MFX); })
      .catch(function (e) { console.warn('[cenik] kov se nenačetl, zůstává CSS náhrada', e); });
  }
})();
