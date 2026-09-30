// Kreslení orbu ve vlastním vlákně (Web Worker + OffscreenCanvas).
//
// Proč: dashboard se po otevření 2–4 s překládá v prohlížeči (Babel, 12 JSX)
// a hlavní vlákno je celou dobu zaneprázdněné. Orb kreslený tam by zamrzl
// a pak se znovu rozjel. Tady ho překlad nezastaví. Spouští ho orb.js.
//
// Po prvním nakresleném snímku pošle `{ hotovo: true }` — orb.js teprve
// potom schová svoje plátno z hlavního vlákna. Do té doby orb kreslí hlavní
// vlákno, aby nebyla chvíle, kdy orb chybí (start workeru trvá 100–300 ms).
import { MODE_FRAMES, resolvePreset, paintFrame } from './engine.es.js';

const BILA = { r: 255, g: 255, b: 255 };
let bezi = true;

self.onmessage = (e) => {
  const d = e.data;
  if (d.stop) { bezi = false; return; }

  const { canvas, state, size, speed, bila, od, dpr } = d;
  const zobrazit = d.zobrazit || size;
  const meritko = dpr * zobrazit / size;   // preset 64, na obrazovce větší
  canvas.width = Math.round(zobrazit * dpr);
  canvas.height = Math.round(zobrazit * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { mode, speed: zaklad, opts } = resolvePreset(state, size);
  const snimek = MODE_FRAMES[mode];
  const tempo = zaklad * speed;
  const dalsi = typeof self.requestAnimationFrame === 'function'
    ? (f) => self.requestAnimationFrame(f)
    : (f) => setTimeout(f, 16);

  let ohlaseno = false;
  const krok = () => {
    if (!bezi) return;
    // Čas od společného začátku (`od`) — orb pokračuje ve stejné fázi jako
    // na předchozí stránce i jako kopie na hlavním vlákně.
    const t = (Date.now() - od) / 1000 * tempo;
    ctx.setTransform(meritko, 0, 0, meritko, 0, 0);
    ctx.clearRect(0, 0, size, size);
    if (bila) paintFrame(ctx, snimek(size, t, opts), false, BILA);
    else paintFrame(ctx, snimek(size, t, opts), true);
    if (!ohlaseno) { ohlaseno = true; self.postMessage({ hotovo: true }); }
    dalsi(krok);
  };
  krok();
};
