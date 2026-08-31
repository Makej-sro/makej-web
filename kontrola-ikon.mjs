/**
 * Ověří, že každá ikona použitá v HTML je přednačtená v iconify-icons.js.
 * Když chybí, <iconify-icon> ji stáhne z api.iconify.design teprve při scrollu
 * do viewportu → ikony viditelně naskakují. Viz gotcha v CLAUDE.md.
 *
 * Spuštění:  node kontrola-ikon.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';

globalThis.window = {};
await import('./iconify-icons.js');

const prednacteno = new Set();
for (const b of globalThis.window.IconifyPreload ?? [])
  for (const n of [...Object.keys(b.icons ?? {}), ...Object.keys(b.aliases ?? {})])
    prednacteno.add(`${b.prefix}:${n}`);

const soubory = [
  ...readdirSync('.').filter(f => f.endsWith('.html')),
  ...readdirSync('blog').filter(f => f.endsWith('.html')).map(f => `blog/${f}`),
];

const pouzito = new Map();
for (const f of soubory)
  for (const m of readFileSync(f, 'utf8').matchAll(/<iconify-icon[^>]*\bicon="([^"]+)"/g))
    (pouzito.get(m[1]) ?? pouzito.set(m[1], []).get(m[1])).push(f);

const chybi = [...pouzito].filter(([ikona]) => !prednacteno.has(ikona));

console.log(`přednačteno: ${prednacteno.size} ikon · použito v HTML: ${pouzito.size}`);
if (chybi.length === 0) {
  console.log('✓ všechny použité ikony jsou přednačtené');
} else {
  console.log('\n✗ chybí v iconify-icons.js (budou naskakovat při scrollu):');
  for (const [ikona, kde] of chybi) console.log(`  ${ikona}  — ${[...new Set(kde)].join(', ')}`);
  const prefixy = [...new Set(chybi.map(([i]) => i.split(':')[0]))];
  console.log('\ndoplň:');
  for (const p of prefixy) {
    const jmena = chybi.filter(([i]) => i.startsWith(p + ':')).map(([i]) => i.split(':')[1]);
    console.log(`  curl -s "https://api.iconify.design/${p}.json?icons=${jmena.join(',')}"`);
  }
  process.exitCode = 1;
}
