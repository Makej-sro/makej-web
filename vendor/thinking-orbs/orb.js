// Orb z balíčku thinking-orbs 0.3.2 (MIT, © Jakub Antalik — viz LICENSE vedle)
// bez Reactu. Balíček má React komponentu <ThinkingOrb>, ale web i zámek
// dashboardu jsou obyčejné HTML. Tohle dělá totéž co její useEffect: nastaví
// plátno, vybere preset stavu a každý snímek ho překreslí přes engine.
//
//   import { spustOrb } from '/vendor/thinking-orbs/orb.js';
//   const zastav = spustOrb(canvas, { state: 'connecting', size: 64, zobrazit: 104, od });
//
// `size` = preset z balíčku — engine zná jen 20, 32 a 64, jiné číslo spadne.
// `zobrazit` = skutečná velikost na obrazovce v px (výchozí = size). Orb se
// kreslí podle presetu 64 a jen se zvětší měřítkem plátna — je to vektor,
// takže zůstane ostrý.
//
// `od` = společný začátek animace (Date.now() v ms). Web při přihlášení i
// dashboard po něm předají stejné číslo, takže orb po přechodu mezi stránkami
// pokračuje ve stejné fázi, místo aby začal znovu a poskočil.
//
// Dvě plátna, jedno po druhém:
//  1. Hned se kreslí na HLAVNÍM vlákně — první snímek ještě během volání
//     spustOrb, takže orb je vidět od prvního vykreslení stránky.
//  2. Souběžně se startuje worker na druhém plátně navrch (zatím
//     neviditelném). Až nakreslí první snímek, převezme animaci a plátno
//     z hlavního vlákna se schová. Worker kreslí dál, i když je hlavní vlákno
//     zavalené (dashboard 2–4 s překládá JSX) — tam by orb zamrzl.
//  Obě plátna kreslí stejnou fázi (stejné `od`), takže výměna není vidět.
//  Dřív se kreslilo jen ve workeru a po přechodu na dashboard orb 100–300 ms
//  chyběl, než se worker rozjel — vypadalo to, že zmizel a načítá se znovu.
//
// `bila: true` (výchozí) = čistě bílé tečky, hloubka jen průhledností.
// Proč ne `dark: true` z originálu: engine vzdálené tečky ztmavuje k černé
// a na sytě modré pak vypadají špinavě šedé. `dark: false` + bílý tint dá
// ramp(255) = 255 u všech teček, takže zůstanou bílé a jen víc či míň průhledné.
import { MODE_FRAMES, resolvePreset, paintFrame } from './engine.es.js';

// Umí prohlížeč modulový worker? (Firefox do verze 113 ne.)
let umiModulovyWorker = false;
try {
  new Worker('data:,', { get type() { umiModulovyWorker = true; return 'module'; } }).terminate();
} catch (e) { /* bez workeru */ }

export function spustOrb(canvas, { state = 'connecting', size = 64, zobrazit = size, speed = 1, bila = true, od = Date.now() } = {}) {
  if (!canvas) return () => {};
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const tiche = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. hlavní vlákno: kreslí hned ──
  const meritko = dpr * zobrazit / size;
  canvas.width = Math.round(zobrazit * dpr);
  canvas.height = Math.round(zobrazit * dpr);
  canvas.style.width = zobrazit + 'px';
  canvas.style.height = zobrazit + 'px';
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const { mode, speed: zaklad, opts } = resolvePreset(state, size);
  const snimek = MODE_FRAMES[mode];
  const tempo = zaklad * speed;
  const BILA = { r: 255, g: 255, b: 255 };
  const kresli = (t) => {
    ctx.setTransform(meritko, 0, 0, meritko, 0, 0);
    ctx.clearRect(0, 0, size, size);
    if (bila) paintFrame(ctx, snimek(size, t, opts), false, BILA);
    else paintFrame(ctx, snimek(size, t, opts), true);
  };

  // Bez pohybu: jeden reprezentativní snímek, stejně jako originál.
  if (tiche) { kresli(0.6); return () => {}; }

  let raf = 0, hlavniBezi = true;
  const smycka = () => {
    if (!hlavniBezi) return;
    kresli((Date.now() - od) / 1000 * tempo);
    raf = requestAnimationFrame(smycka);
  };
  kresli((Date.now() - od) / 1000 * tempo);           // první snímek HNED
  raf = requestAnimationFrame(smycka);
  const zastavHlavni = () => { hlavniBezi = false; cancelAnimationFrame(raf); };

  // ── 2. worker na druhém plátně navrch ──
  let worker = null;
  if (umiModulovyWorker && HTMLCanvasElement.prototype.transferControlToOffscreen) {
    try {
      const obal = document.createElement('span');
      obal.style.cssText = `position:relative;display:block;width:${zobrazit}px;height:${zobrazit}px`;
      canvas.replaceWith(obal);
      obal.appendChild(canvas);
      const druhe = document.createElement('canvas');
      druhe.setAttribute('aria-hidden', 'true');
      druhe.style.cssText = `position:absolute;left:0;top:0;width:${zobrazit}px;height:${zobrazit}px;opacity:0`;
      obal.appendChild(druhe);

      worker = new Worker(new URL('./orb-worker.js?v=3', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => {
        if (!e.data || !e.data.hotovo) return;
        // Worker má první snímek — převezme animaci, hlavní vlákno končí.
        druhe.style.opacity = '1';
        canvas.style.visibility = 'hidden';
        zastavHlavni();
      };
      const off = druhe.transferControlToOffscreen();
      worker.postMessage({ canvas: off, state, size, zobrazit, speed, bila, od, dpr }, [off]);
    } catch (e) { worker = null; /* zůstane kreslení na hlavním vlákně */ }
  }

  return () => {
    zastavHlavni();
    if (worker) { worker.postMessage({ stop: true }); setTimeout(() => worker.terminate(), 50); }
  };
}
