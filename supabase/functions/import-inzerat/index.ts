// Edge Function: import-inzerat (2026-09-28, Yasin + Claude)
// ---------------------------------------------------------------------------
// Firma v dashboardu vloží odkaz na svůj inzerát (prace.cz, jobs.cz, vlastní
// web…) nebo jeho text → funkce ho stáhne a rozebere na pole Makej inzerátu.
// Prohlížeč to sám nezvládne (cizí weby nepovolí čtení z jiné domény — CORS),
// proto server.
//
//   POST { url } nebo { text }, volitelně styl: 'makej' | 'doslovne'
//                                     (přihlášený uživatel, Authorization: Bearer …)
//   → { ok: true, zdroj: 'ai' | 'jsonld' | 'text', inzerat: {...}, upozorneni: [...] }
//   → { ok: false, chyba: '…' }
//
// Celé v JEDNOM souboru, ať jde nasadit i vložením do editoru v Supabase
// dashboardu (Edge Functions → Deploy a new function → Via Editor).
//
// Rozbor bez AI (sekce ROZBOR níž: JSON-LD JobPosting + nadpisy popisu). Když je
// nastavený secret ANTHROPIC_API_KEY, výsledek ještě projde Claudem, který ho
// přepíše do stylu appky (tykání, krátké body) a doplní, co heuristika minula.
// Bez klíče funguje taky, jen hrubší.
//
// Nasazení:  supabase functions deploy import-inzerat --project-ref cxegfwfbgcgpwerfbvra
//            (nebo vložit do editoru v dashboardu, název funkce import-inzerat)
// Klíč:      secret ANTHROPIC_API_KEY (Edge Functions → Secrets) — nikdy do gitu

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ENV = (k: string) => (typeof Deno !== 'undefined' ? Deno.env.get(k) : undefined) || '';
const SUPABASE_URL = ENV('SUPABASE_URL');
const SUPABASE_ANON = ENV('SUPABASE_ANON_KEY');
const ANTHROPIC_KEY = ENV('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-5';
const MAX_BAJTU = 3_000_000;


// ═══════════════════════════════════════════════════════════════════════
// ROZBOR — čisté funkce bez Deno API (test v Node: import z tohoto souboru)
// Většina portálů (prace.cz, jobs.cz, LinkedIn, Indeed…) má v HTML data
// schema.org JobPosting kvůli Google for Jobs. Z nich se bere název, mzda,
// místo a úvazek; popis se rozdělí podle nadpisů („Náplň práce",
// „Požadujeme", „Nabízíme"…) do sekcí inzerátu v appce.
// ═══════════════════════════════════════════════════════════════════════
export type Inzerat = {
  title: string;
  contract: string;          // DPP | DPČ | HPP | IČO | ''
  hours_per_week: number | null;
  recurrence: string;        // Pravidelná | Jednorázová | ''
  pay: number | null;
  pay_unit: string;          // Kč/h | Kč/den | Kč/měs
  payout: string;
  location: string;
  region: string;            // název kraje ze zdroje (dashboard si ho převede na id)
  date: string;              // RRRR-MM-DD nebo ''
  time_start: string;
  time_end: string;
  positions: number | null;
  description: string;       // Náplň práce
  expectations: string[];    // Co od tebe čekáme
  bonuses: string[];         // Co oceníme
  offer: string[];           // Co ti nabídneme
  perks: string[];           // Benefity
  requirements: string[];    // Co potřebuješ
  tags: string[];            // Vlastnosti brigády
};

export const prazdny = (): Inzerat => ({
  title: '', contract: '', hours_per_week: null, recurrence: '', pay: null, pay_unit: 'Kč/h', payout: '',
  location: '', region: '', date: '', time_start: '', time_end: '', positions: null, description: '',
  expectations: [], bonuses: [], offer: [], perks: [], requirements: [], tags: [],
});

// ── HTML → text ─────────────────────────────────────────────────────────
const ENTITY: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ndash: '–', mdash: '—', bull: '•', hellip: '…' };
export function dekoduj(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITY[n.toLowerCase()] ?? m);
}

// HTML popisu → řádky. Nadpis = <h1–6> nebo krátký tučný odstavec končící dvojtečkou.
export type Radek = { typ: 'nadpis' | 'odstavec' | 'bod'; text: string };
export function naRadky(html: string): Radek[] {
  let s = String(html || '');
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, t) => '\n§N§' + t + '\n');
  s = s.replace(/<li[^>]*>/gi, '\n§B§').replace(/<\/li>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|ul|ol|section|article|tr)>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = dekoduj(s);
  const out: Radek[] = [];
  for (let r of s.split('\n')) {
    r = r.replace(/\s+/g, ' ').trim();
    if (!r) continue;
    if (r.startsWith('§N§')) { const t = r.slice(3).trim().replace(/:$/, ''); if (t) out.push({ typ: 'nadpis', text: t }); continue; }
    if (r.startsWith('§B§')) { const t = r.slice(3).trim(); if (t) out.push({ typ: 'bod', text: t }); continue; }
    // odrážky napsané rovnou textem
    const m = /^[•\-–*·▪►✓✔]\s*(.+)$/.exec(r);
    if (m) { out.push({ typ: 'bod', text: m[1].trim() }); continue; }
    if (r.length <= 80 && /:$/.test(r)) { out.push({ typ: 'nadpis', text: r.replace(/:$/, '').trim() }); continue; }
    out.push({ typ: 'odstavec', text: r });
  }
  return out;
}

// ── Rozdělení popisu do sekcí appky ─────────────────────────────────────
type Sekce = 'napln' | 'cekame' | 'ocenime' | 'nabidneme' | 'benefity' | 'pokyny' | null;
export function druhNadpisu(t: string): Sekce {
  const s = t.toLowerCase();
  if (/(odpovězte|odpovědět|reaguj|zašlet|životopis|\bcv\b|kontakt|jak se přihlás)/.test(s)) return 'pokyny';
  if (/(benefit)/.test(s)) return 'benefity';
  if (/(nabízíme|co získá|co vám nabíd|co ti nabíd|čeká vás|čeká tě|odměn|proč k nám|proč u nás)/.test(s)) return 'nabidneme';
  if (/(výhodou|uvítáme|oceníme|bonus|plusem)/.test(s)) return 'ocenime';
  if (/(požad|očekáv|hledáme|předpoklad|kvalifikac|dovednost|zkušenost|co bys|co byste|musí|podmínk|profil kandidát|koho hledáme)/.test(s)) return 'cekame';
  if (/(náplň|úkol|popis|čím se|co budeš|co budete|pracovní|o pozici|o práci|role|zodpověd|odpověd)/.test(s)) return 'napln';
  return null;
}

const POKYNY = /(odpovědět|zažádat|životopis|\bcv\b|reagujte|zašlete|přihlásit se|výběrového řízení|klikněte|tlačítk)/i;

export function rozdelPopis(radky: Radek[]): Pick<Inzerat, 'description' | 'expectations' | 'bonuses' | 'offer' | 'perks'> & { vynechano: number } {
  const napln: string[] = [];
  const out = { expectations: [] as string[], bonuses: [] as string[], offer: [] as string[], perks: [] as string[] };
  let sekce: Sekce = null, vynechano = 0;
  for (const r of radky) {
    if (r.typ === 'nadpis') {
      // „Popis pozice:" bývá i na konci tučného odstavce s pokyny
      const d = druhNadpisu(r.text.split(/[.!]\s/).pop() || r.text);
      sekce = d || (POKYNY.test(r.text) ? 'pokyny' : sekce);
      continue;
    }
    if (sekce === 'pokyny' || POKYNY.test(r.text)) { vynechano++; continue; }
    const t = r.text.replace(/[;,.]\s*$/, '');
    if (r.typ === 'bod') {
      if (sekce === 'cekame' || sekce === 'ocenime') {
        // „…výhodou" / „uvítáme…" patří mezi „Co oceníme", i když je v požadavcích
        (/výhodou|uvítáme|oceníme|je plus/i.test(t) || sekce === 'ocenime' ? out.bonuses : out.expectations).push(velke(t));
      } else if (sekce === 'benefity') out.perks.push(velke(t));
      else if (sekce === 'nabidneme') out.offer.push(velke(t));
      else napln.push('• ' + t);
    } else {
      if (sekce === 'cekame') out.expectations.push(velke(t));
      else if (sekce === 'nabidneme' || sekce === 'benefity') out.offer.push(velke(t));
      else napln.push(r.text);
    }
  }
  // Odstavce náplně oddělit prázdným řádkem, odrážky držet pohromadě
  const description = napln.reduce((a, r, i) => a + (i === 0 ? '' : (r.startsWith('• ') && napln[i - 1].startsWith('• ') ? '\n' : '\n\n')) + r, '');
  const orez = (a: string[], n: number) => a.map(x => x.length > 140 ? x.slice(0, 137).trim() + '…' : x).slice(0, n);
  return { description: description.slice(0, 1500), expectations: orez(out.expectations, 8), bonuses: orez(out.bonuses, 6), offer: orez(out.offer, 6), perks: orez(out.perks, 8), vynechano };
}
const velke = (s: string) => s ? s[0].toUpperCase() + s.slice(1) : s;

// ── Hledání věcí v textu ────────────────────────────────────────────────
// \b v JS nezná česká písmena (DPČ, IČO) — hranice slova proto přes \p{L}
const slovo = (w: string) => new RegExp('(^|[^\\p{L}\\d])' + w + '(?=$|[^\\p{L}\\d])', 'iu');
export function smlouvaZTextu(t: string): string {
  if (slovo('DPP').test(t) || /dohod[aěu] o provedení práce/i.test(t)) return 'DPP';
  if (slovo('DP[ČC]').test(t) || /dohod[aěu] o pracovní činnosti/i.test(t)) return 'DPČ';
  if (slovo('I[ČC]O').test(t) || slovo('OSV[ČC]').test(t) || /živnostensk|fakturac/i.test(t)) return 'IČO';
  if (slovo('HPP').test(t) || /pracovní poměr|pracovní smlouv|hlavní pracovní/i.test(t)) return 'HPP';
  return '';
}
// Výplata a pravidelnost — hodnoty přesně jako filtr v appce
export function vyplataZTextu(t: string): string {
  if (/výplat\p{L}*[^.\n]{0,25}(hned|ihned|po (akci|směně|skončení)|v hotovosti)|hotově po/iu.test(t)) return 'Hned po akci';
  if (/výplat\p{L}*[^.\n]{0,25}týd|týdenní výplat|každý týden/iu.test(t)) return 'Týdně';
  if (/do 14 dn|do 14 dní|do dvou týdnů/i.test(t)) return 'Do 14 dní';
  if (/výplat\p{L}*[^.\n]{0,25}měsí|měsíční výplat/iu.test(t)) return 'Měsíčně';
  return '';
}
export function pravidelnostZTextu(t: string): string {
  if (/jednoráz|jednodenní|na jeden den|jednorázov/i.test(t)) return 'Jednorázová';
  if (/dlouhodob|pravideln|stálé|na dobu neurčitou|každý týden/i.test(t)) return 'Pravidelná';
  return '';
}
export function casZTextu(t: string): [string, string] | null {
  const m = /\b(\d{1,2})[:.](\d{2})\s*(?:–|-|—|do)\s*(\d{1,2})[:.](\d{2})\b/.exec(t);
  if (!m || +m[1] > 23 || +m[3] > 24) return null;
  const f = (h: string, mm: string) => String(+h).padStart(2, '0') + ':' + mm;
  return [f(m[1], m[2]), f(m[3], m[4])];
}
const STITKY: [RegExp, string][] = [
  [/ranní/i, 'Ranní směna'], [/odpolední/i, 'Odpolední směna'], [/noční/i, 'Noční směna'],
  [/víkend/i, 'Víkendy'], [/bez (předchozí )?(zkušeností|praxe)|praxe není/i, 'Bez zkušeností'],
  [/student/i, 'Pro studenty'], [/od 15 let|15\+/i, 'Od 15 let'], [/zaučíme|zaškolíme|zaškolení|zaučení/i, 'Zaučíme'],
];
const POTREBA: [RegExp, string][] = [
  [/češtin|český jazyk|českém jazyce/i, 'Čeština'], [/angličtin|anglick/i, 'Angličtina'], [/němčin|německ/i, 'Němčina'],
  [/řidičsk|řidičák/i, 'Řidičák sk. B'], [/zdravotní průkaz/i, 'Zdravotní průkaz'], [/\bVZV\b|vysokozdvižn/i, 'Průkaz VZV'],
  [/vlastní auto|vlastním autem/i, 'Vlastní auto'],
];
export function najdi(text: string, seznam: [RegExp, string][], krome: string[] = []): string[] {
  const out: string[] = [];
  for (const [re, v] of seznam) if (re.test(text) && !out.includes(v) && !krome.includes(v)) out.push(v);
  return out;
}

// ── JSON-LD JobPosting ──────────────────────────────────────────────────
export function najdiJobPosting(html: string): any | null {
  const re = /<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let d: any;
    try { d = JSON.parse(m[1].trim()); } catch { continue; }
    const kandidati = ([] as any[]).concat(d, d && d['@graph'] ? d['@graph'] : []);
    for (const k of kandidati) {
      const typ = k && k['@type'];
      if (typ === 'JobPosting' || (Array.isArray(typ) && typ.includes('JobPosting'))) return k;
    }
  }
  return null;
}

const JEDNOTKA: Record<string, string> = { HOUR: 'Kč/h', DAY: 'Kč/den', WEEK: 'Kč/měs', MONTH: 'Kč/měs', YEAR: 'Kč/měs' };

export function zJobPosting(jp: any): { inzerat: Inzerat; upozorneni: string[] } {
  const z = prazdny(); const up: string[] = [];
  z.title = dekoduj(String(jp.title || jp.name || '')).replace(/\s+/g, ' ').trim();
  // Mzda
  const bs = jp.baseSalary || jp.estimatedSalary;
  const v = bs && (bs.value || bs);
  if (v) {
    const min = Number(v.minValue ?? v.value), max = Number(v.maxValue ?? v.value);
    let unit = String(v.unitText || bs.unitText || '').toUpperCase();
    if (!isNaN(min) && min > 0) {
      let pay = min;
      if (unit === 'YEAR') { pay = Math.round(min / 12); up.push('Mzda byla roční, přepočítal jsem ji na měsíc.'); }
      if (unit === 'WEEK') { pay = Math.round(min * 52 / 12); up.push('Mzda byla týdenní, přepočítal jsem ji na měsíc.'); }
      z.pay = Math.round(pay);
      z.pay_unit = JEDNOTKA[unit] || (min < 1000 ? 'Kč/h' : 'Kč/měs');
      if (max && max > min) up.push('Mzda byla rozpětí ' + min.toLocaleString('cs-CZ') + '–' + max.toLocaleString('cs-CZ') + ' Kč — appka ukazuje jedno číslo, dal jsem spodní hranici.');
    }
  }
  // Místo
  const loc = ([] as any[]).concat(jp.jobLocation || [])[0];
  const adr = loc && (loc.address || loc);
  if (adr && typeof adr === 'object') {
    const mesto = String(adr.addressLocality || '').trim(), ulice = String(adr.streetAddress || '').trim();
    z.location = [mesto, ulice].filter(Boolean).join(' — ');
    z.region = String(adr.addressRegion || '').trim();
  }
  if (/TELECOMMUTE/i.test(String(jp.jobLocationType || ''))) z.location = z.location || 'Z domova';
  // Úvazek → smlouva a pravidelnost (text popisu má přednost, pokud smlouvu jmenuje)
  const typy = ([] as string[]).concat(jp.employmentType || []).map(x => String(x).toUpperCase());
  const radky = naRadky(String(jp.description || ''));
  const cely = radky.map(r => r.text).join('\n');
  z.contract = smlouvaZTextu(cely);
  if (!z.contract) {
    if (typy.includes('CONTRACTOR')) z.contract = 'IČO';
    else if (typy.includes('FULL_TIME') || typy.includes('PART_TIME')) z.contract = 'HPP';
    else if (typy.some(t => ['TEMPORARY', 'PER_DIEM', 'INTERN', 'VOLUNTEER'].includes(t))) z.contract = 'DPP';
    if (z.contract) up.push('Typ smlouvy jsem odhadl z úvazku — zkontrolujte ho.');
  }
  if (z.contract === 'HPP') z.hours_per_week = typy.includes('PART_TIME') && !typy.includes('FULL_TIME') ? 20 : 40;
  z.recurrence = typy.some(t => ['TEMPORARY', 'PER_DIEM'].includes(t)) ? 'Jednorázová' : (typy.length ? 'Pravidelná' : '');
  // Popis → sekce
  const p = rozdelPopis(radky);
  Object.assign(z, { description: p.description, expectations: p.expectations, bonuses: p.bonuses, offer: p.offer, perks: p.perks });
  if (p.vynechano) up.push('Vynechal jsem pokyny, jak odpovědět na původním webu — na Makej se reaguje v appce.');
  z.tags = najdi(cely, STITKY);
  z.requirements = najdi(z.expectations.join('\n') || cely, POTREBA);
  z.payout = vyplataZTextu(cely);
  z.recurrence = pravidelnostZTextu(cely) || z.recurrence;
  const cas = casZTextu(cely); if (cas) [z.time_start, z.time_end] = cas;
  if (jp.totalJobOpenings && Number(jp.totalJobOpenings) > 1) z.positions = Number(jp.totalJobOpenings);
  return { inzerat: z, upozorneni: up };
}

// Stránka bez JobPosting: aspoň titulek a text hlavního obsahu
export function zTextuStranky(html: string): { inzerat: Inzerat; upozorneni: string[] } {
  const z = prazdny();
  const og = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i.exec(html);
  const tt = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  z.title = dekoduj((og ? og[1] : tt ? tt[1] : '')).split(/\s[|–-]\s/)[0].trim();
  const telo = (/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i.exec(html) || [])[2] || (/<body[^>]*>([\s\S]*)<\/body>/i.exec(html) || [])[1] || html;
  const radky = naRadky(telo.replace(/<(nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, ' '));
  return zTextu(radky.map(r => (r.typ === 'bod' ? '• ' : '') + r.text).join('\n'), z);
}

// Vložený text inzerátu (nebo text stránky)
export function zTextu(text: string, zaklad?: Inzerat): { inzerat: Inzerat; upozorneni: string[] } {
  const z = zaklad || prazdny(); const up: string[] = [];
  const radky = naRadky(String(text || '').replace(/\n/g, '<br>'));
  if (!z.title) { const prvni = radky.find(r => r.typ !== 'bod'); if (prvni && prvni.text.length <= 70) z.title = prvni.text; }
  const cely = radky.map(r => r.text).join('\n');
  const p = rozdelPopis(radky.filter(r => r.text !== z.title));
  Object.assign(z, { description: p.description, expectations: p.expectations, bonuses: p.bonuses, offer: p.offer, perks: p.perks });
  z.contract = smlouvaZTextu(cely);
  const mz = /(\d[\d\s.]{1,7})\s*(?:,-)?\s*Kč\s*(?:\/|za\s*)?\s*(h(?:od)?|hodinu|den|měs(?:íc)?)?/i.exec(cely);
  if (mz) {
    z.pay = Number(mz[1].replace(/[\s.]/g, '')) || null;
    const j = (mz[2] || '').toLowerCase();
    z.pay_unit = j.startsWith('h') ? 'Kč/h' : j === 'den' ? 'Kč/den' : j.startsWith('měs') ? 'Kč/měs' : (z.pay && z.pay < 1000 ? 'Kč/h' : 'Kč/měs');
  }
  z.tags = najdi(cely, STITKY);
  z.requirements = najdi(z.expectations.join('\n') || cely, POTREBA);
  z.payout = vyplataZTextu(cely);
  z.recurrence = pravidelnostZTextu(cely);
  const cas = casZTextu(cely); if (cas) [z.time_start, z.time_end] = cas;
  if (p.vynechano) up.push('Vynechal jsem pokyny, jak odpovědět na původním webu — na Makej se reaguje v appce.');
  up.push('Inzerát neměl strukturovaná data, rozdělil jsem ho podle textu — projděte všechny kroky.');
  return { inzerat: z, upozorneni: up };
}

// ═══════════════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════════════
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const odpoved = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const chyba = (text: string, status = 400) => odpoved({ ok: false, chyba: text }, status);

// ── Bezpečnost odkazu: jen veřejné http(s) adresy (žádné localhost / vnitřní sítě) ──
function bezpecnaAdresa(raw: string): URL | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
  if (u.port && !['80', '443'].includes(u.port)) return null;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!h.includes('.') || h === 'localhost' || /\.(local|internal|lan|home)$/.test(h)) return null;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    const [a, b] = h.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224) return null;
  }
  if (h.includes(':')) return null;   // IPv6 literál rovnou ne
  return u;
}

async function stahni(url: URL): Promise<string> {
  let adresa = url;
  for (let i = 0; i < 4; i++) {
    const r = await fetch(adresa, {
      redirect: 'manual',
      signal: AbortSignal.timeout(12_000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MakejImport/1.0; +https://www.makej.eu)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'cs,en;q=0.8',
      },
    });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      const dalsi = bezpecnaAdresa(new URL(r.headers.get('location')!, adresa).toString());
      if (!dalsi) throw new Error('Odkaz přesměrovává na adresu, kterou nejde načíst.');
      adresa = dalsi; continue;
    }
    if (r.status === 403 || r.status === 429) throw new Error('Web načtení inzerátu zablokoval. Zkopírujte místo odkazu text inzerátu.');
    if (!r.ok) throw new Error('Stránka vrátila chybu ' + r.status + '. Zkontrolujte odkaz.');
    const typ = r.headers.get('content-type') || '';
    if (typ && !/html|xml|text/i.test(typ)) throw new Error('Odkaz nevede na webovou stránku s inzerátem.');
    // čtení s limitem velikosti
    const reader = r.body!.getReader(); const casti: Uint8Array[] = []; let celkem = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      celkem += value.length; if (celkem > MAX_BAJTU) { await reader.cancel(); break; }
      casti.push(value);
    }
    const buf = new Uint8Array(celkem > MAX_BAJTU ? MAX_BAJTU : celkem); let o = 0;
    for (const c of casti) { const k = c.subarray(0, Math.min(c.length, buf.length - o)); buf.set(k, o); o += k.length; if (o >= buf.length) break; }
    const kod = /charset=([\w-]+)/i.exec(typ)?.[1] || 'utf-8';
    try { return new TextDecoder(kod).decode(buf); } catch { return new TextDecoder('utf-8').decode(buf); }
  }
  throw new Error('Příliš mnoho přesměrování.');
}

// ── Claude: přepis do stylu appky (volitelné) ──
const TAGY = ['Ranní směna', 'Odpolední směna', 'Noční směna', 'Víkendy', 'Bez zkušeností', 'Pro studenty', 'Od 15 let', 'Zaučíme', 'Práce s lidmi', 'Fyzická práce', 'Venku'];
const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Název pozice, max 50 znaků, bez názvu firmy a bez typu smlouvy' },
    contract: { type: 'string', enum: ['DPP', 'DPČ', 'HPP', 'IČO', ''] },
    hours_per_week: { type: ['integer', 'null'], description: 'Jen u HPP: hodin týdně (40 = plný úvazek)' },
    recurrence: { type: 'string', enum: ['Pravidelná', 'Jednorázová', ''] },
    pay: { type: ['integer', 'null'], description: 'Jedno číslo v Kč; u rozpětí spodní hranice' },
    pay_unit: { type: 'string', enum: ['Kč/h', 'Kč/den', 'Kč/měs'] },
    payout: { type: 'string', enum: ['Hned po akci', 'Týdně', 'Do 14 dní', 'Měsíčně', ''] },
    location: { type: 'string', description: 'Město — ulice / čtvrť, např. „Brno — Veveří"' },
    region: { type: 'string', description: 'Český kraj, pokud jde poznat (např. „Jihomoravský")' },
    date: { type: 'string', description: 'Datum první směny RRRR-MM-DD, jen když je v textu' },
    time_start: { type: 'string', description: 'HH:MM, jen když je v textu' },
    time_end: { type: 'string', description: 'HH:MM, jen když je v textu' },
    positions: { type: ['integer', 'null'] },
    description: { type: 'string', description: 'Náplň práce: 2–6 vět v tykání („Připravíš…, obsloužíš…"), co člověk na směně dělá. Max 1200 znaků.' },
    expectations: { type: 'array', items: { type: 'string' }, description: 'Co od tebe čekáme — povinné požadavky, max 6 krátkých bodů' },
    bonuses: { type: 'array', items: { type: 'string' }, description: 'Co oceníme — výhody, ne podmínky, max 4' },
    offer: { type: 'array', items: { type: 'string' }, description: 'Co ti nabídneme — co firma dává (zaučení, tým, jistota…), max 5' },
    perks: { type: 'array', items: { type: 'string' }, description: 'Benefity — konkrétní perky (stravenky, doprava…), max 8 krátkých' },
    requirements: { type: 'array', items: { type: 'string' }, description: 'Co potřebuješ — krátké štítky: jazyk, řidičák, průkazy (max 5)' },
    tags: { type: 'array', items: { type: 'string', enum: TAGY }, description: 'Vlastnosti — jen z povoleného seznamu' },
    upozorneni: { type: 'array', items: { type: 'string' }, description: 'Co musí firma zkontrolovat (odhady, chybějící údaje), česky, max 4' },
  },
  required: ['title', 'contract', 'recurrence', 'pay', 'pay_unit', 'payout', 'location', 'description', 'expectations', 'bonuses', 'offer', 'perks', 'requirements', 'tags', 'upozorneni'],
};

// Firma si vybere, jak text převzít (Yasin 28. 9.: „někomu by mohlo vadit, že se přepíše"):
//   'makej'    — přepsat do stylu appky (tykání, krátké body)
//   'doslovne' — věty přesně jako v originále, jen roztříděné do sekcí
const DOSLOVNE_POPISY: Record<string, string> = {
  title: 'Název pozice přesně jako ve zdroji (jen bez názvu firmy), max 50 znaků',
  description: 'Náplň práce DOSLOVNĚ ze zdroje — stejné věty a slova, jen bez pokynů k přihlášení. Max 1500 znaků.',
  expectations: 'Požadavky DOSLOVNĚ ze zdroje (každý bod beze změny), max 8',
  bonuses: 'Co je „výhodou" / „uvítáme" DOSLOVNĚ ze zdroje, max 6',
  offer: 'Co firma nabízí (mimo konkrétní benefity) DOSLOVNĚ ze zdroje, max 6',
  perks: 'Konkrétní benefity DOSLOVNĚ ze zdroje, max 8',
};
function schema(doslovne: boolean) {
  if (!doslovne) return SCHEMA;
  const p: any = JSON.parse(JSON.stringify(SCHEMA.properties));
  for (const k of Object.keys(DOSLOVNE_POPISY)) p[k].description = DOSLOVNE_POPISY[k];
  return { ...SCHEMA, properties: p };
}
const SYSTEM_MAKEJ = 'Převádíš pracovní inzerát na inzerát do české appky Makej (brigády a práce). ' +
  'Piš česky a brigádníkovi tykej, krátce a lidsky, jako ukázky v appce („Připravíš espresso…", „Zaučíme tě"). ' +
  'Nic si nevymýšlej — co v textu není, nech prázdné a uveď v upozorneni. Nepiš pokyny, jak se přihlásit na původním webu, ' +
  'ani kontakty (na Makej se reaguje v appce). Nepoužívej formulace o DPH.';
const SYSTEM_DOSLOVNE = 'Převádíš pracovní inzerát do české appky Makej. Firma chce texty převzít DOSLOVNĚ: ' +
  'věty a body kopíruj přesně tak, jak jsou ve zdroji — stejná slova, stejné oslovení (vykání zůstává vykáním), ' +
  'nic nepřeformulovávej, nezkracuj ani stylisticky neupravuj. Tvým úkolem je jen roztřídit text do správných polí ' +
  '(náplň práce, požadavky, co je výhodou, co firma nabízí, benefity) a vyčíst údaje (smlouva, mzda, místo, čas…). ' +
  'Vynech jen pokyny, jak se přihlásit na původním webu, a kontakty (na Makej se reaguje v appce). ' +
  'Nic si nevymýšlej — co v textu není, nech prázdné a uveď v upozorneni.';

async function prepisClaudem(zdrojText: string, hrube: Inzerat, doslovne = false): Promise<{ inzerat: Inzerat; upozorneni: string[] } | null> {
  if (!ANTHROPIC_KEY) return null;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(45_000),
    headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: doslovne ? 3000 : 2000,
      tools: [{ name: 'inzerat', description: 'Vyplněný inzerát pro appku Makej', input_schema: schema(doslovne) }],
      tool_choice: { type: 'tool', name: 'inzerat' },
      system: doslovne ? SYSTEM_DOSLOVNE : SYSTEM_MAKEJ,
      messages: [{
        role: 'user',
        content: 'Text inzerátu (zdroj):\n"""\n' + zdrojText.slice(0, 18_000) + '\n"""\n\nHrubý automatický rozbor (může být špatně):\n' + JSON.stringify(hrube),
      }],
    }),
  });
  if (!r.ok) { console.error('Claude', r.status, await r.text()); return null; }
  const d = await r.json();
  const blok = (d.content || []).find((b: any) => b.type === 'tool_use');
  if (!blok) return null;
  const x = blok.input || {};
  const up = Array.isArray(x.upozorneni) ? x.upozorneni.slice(0, 4) : [];
  delete x.upozorneni;
  return { inzerat: { ...hrube, ...x, tags: (x.tags || []).filter((t: string) => TAGY.includes(t)) }, upozorneni: up };
}

if (typeof Deno !== 'undefined') Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return chyba('Jen POST.', 405);

  // Jen přihlášený uživatel (anon klíč by prošel ověřením JWT, proto getUser)
  const auth = req.headers.get('Authorization') || '';
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return chyba('Nejste přihlášení.', 401);

  let body: any;
  try { body = await req.json(); } catch { return chyba('Chybí odkaz nebo text.'); }

  try {
    let vysledek: { inzerat: Inzerat; upozorneni: string[] };
    let zdroj: 'jsonld' | 'text';
    let zdrojText: string;
    if (body && typeof body.url === 'string' && body.url.trim()) {
      const url = bezpecnaAdresa(body.url);
      if (!url) return chyba('Tohle nevypadá jako odkaz na veřejnou stránku.');
      const html = await stahni(url);
      const jp = najdiJobPosting(html);
      if (jp) {
        vysledek = zJobPosting(jp); zdroj = 'jsonld';
        zdrojText = [jp.title, naRadky(String(jp.description || '')).map(r => (r.typ === 'bod' ? '• ' : '') + r.text).join('\n'), JSON.stringify({ baseSalary: jp.baseSalary, jobLocation: jp.jobLocation, employmentType: jp.employmentType })].join('\n\n');
      } else {
        vysledek = zTextuStranky(html); zdroj = 'text';
        zdrojText = vysledek.inzerat.title + '\n' + naRadky(html.replace(/<(nav|header|footer|aside|form|script|style)[\s\S]*?<\/\1>/gi, ' ')).map(r => (r.typ === 'bod' ? '• ' : '') + r.text).join('\n');
      }
    } else if (body && typeof body.text === 'string' && body.text.trim().length >= 40) {
      zdrojText = body.text.slice(0, 20_000);
      vysledek = zTextu(zdrojText); zdroj = 'text';
    } else {
      return chyba('Vložte odkaz na inzerát, nebo aspoň pár vět jeho textu.');
    }

    try {
      const ai = await prepisClaudem(zdrojText, vysledek.inzerat, body.styl === 'doslovne');
      if (ai) return odpoved({ ok: true, zdroj: 'ai', inzerat: ai.inzerat, upozorneni: ai.upozorneni });
    } catch (e) { console.error('prepisClaudem', e); }
    return odpoved({ ok: true, zdroj, inzerat: vysledek.inzerat, upozorneni: vysledek.upozorneni });
  } catch (e) {
    const zprava = e instanceof Error && /[ěščřžýáíéůú]/i.test(e.message) ? e.message : 'Stránku se nepodařilo načíst. Zkuste vložit text inzerátu.';
    console.error('import-inzerat', e);
    return chyba(zprava, 502);
  }
});
