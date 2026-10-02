// ═══════════════════════════════════════════════════════════════
// PRÉMIOVÁ FUNKCE: Pokročilá analytika + Plán směn
// ═══════════════════════════════════════════════════════════════
//
// Doporučený tarif:  Premium / Pro
// Zapojení:
//   1. Přidat <script type="text/babel" src="_premium/analytics.jsx"> do index.html
//   2. Viz README.md pro ostatní kroky
//
// Závislosti: T, Icon, ECard, SectionHeader, Sparkline, AreaChart, BarChart, Donut
//             (všechny dostupné z employer-shell.jsx a app.jsx)
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// PRO GATE — zobrazí upgrade CTA pokud uživatel nemá Pro tarif
// ─────────────────────────────────────────────────────────────

// Odemčeno podle skutečných tarifů (employer-plans.jsx): analytika je od
// Dynamického výš. Dřív se tu hledal tarif „Pro/Business", který v ceníku
// není, takže by ji neviděla ani firma, která si Dynamický zaplatí.
function _isPro() {
  if (typeof can === 'function' && can('analytics')) return true;
  const until = EPROFILE.premium_until || EPROFILE.plan_expires_at;
  if (until && new Date(until) > new Date()) return true;
  return false;
}

function ProGate({ feature, children }) {
  if (_isPro()) return children;
  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Rozmazaný náhled obsahu */}
      <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 }} aria-hidden="true">
        {children}
      </div>

      {/* Světlá karta ve stylu dashboardu — co to je, v jakém tarifu, kam kliknout */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 150, background: 'linear-gradient(180deg, rgba(255,255,255,.35) 0%, rgba(255,255,255,.85) 45%)' }}>
        <div style={{ width: 440, maxWidth: 'calc(100% - 32px)', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 18, boxShadow: '0 24px 60px -20px rgba(16,24,64,.25)', padding: '28px 28px 24px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7A82A6', marginBottom: 6 }}>Tarif Dynamický a vyšší</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1.25, marginBottom: 8 }}>
            {feature || 'Tato sekce'} není ve vašem tarifu
          </div>
          <div style={{ fontSize: 14, color: '#3A4266', lineHeight: 1.55, marginBottom: 18 }}>
            Uvidíte, kolik lidí hledá práci ve vašem kraji, jaké hodinovky se platí a jak si stojí vaše inzeráty.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
            {['Plné statistiky + CSV export', '5 aktivních inzerátů', 'Topování inzerátu 3×/měs', 'Prioritní řešení podpory'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, fontWeight: 600, color: '#374151' }}>
                <Icon name="check-circle-bold" size={15} color="#16a34a" />{f}
              </div>
            ))}
          </div>
          <EBtnHl onClick={() => window.empGoTab && window.empGoTab('pricing')}>Zobrazit tarify</EBtnHl>
          <div style={{ marginTop: 12, fontSize: 12.5, color: '#7A82A6' }}>
            Otázky? <a href="mailto:podpora@makej.eu" style={{ color: '#1B34F0', textDecoration: 'none', fontWeight: 600 }}>podpora@makej.eu</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYTIKA — jedna sekce: mapa nahoře, statistiky pod ní
// ─────────────────────────────────────────────────────────────
function EAnalyticsOld({ period = '30d' }) {
  return (
    <ProGate feature="Analytika">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
        <KrajeMap />
        <div style={{ padding: '0 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <AnalyticsOverview period={period} />
          <AnalyticsDemo />
        </div>
      </div>
    </ProGate>
  );
}

// ── Přehled ──────────────────────────────────────────────────
function AnalyticsOverview({ period = '30d' }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <ECard>
          <SectionHeader title="Cohort: konverze podle týdne nástupu" subtitle="% kandidátů, kteří po N týdnech stále chodí na směny" />
          <CohortTable />
        </ECard>
        <ECard>
          <SectionHeader title="Srovnání kanálů" subtitle="Kde se vám daří nejlépe" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {[
              { l: 'Swajp feed', views: 8420, hires: 28, color: '#0020F6' },
              { l: 'Search', views: 2140, hires: 9, color: '#5B6BFF' },
              { l: 'Doporučení', views: 1280, hires: 11, color: '#5BD68A' },
              { l: 'Boost (placený)', views: 1007, hires: 14, color: '#FFD166' },
            ].map((c, i) => {
              const conv = ((c.hires / c.views) * 100).toFixed(2);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.cardText, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                      {c.l}
                    </span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                      <span style={{ color: T.cardMutedSoft, fontFamily: T.fontMono, fontSize: 10.5 }}>{c.views.toLocaleString('cs-CZ').replace(/,/g,' ')} views</span>
                      <span style={{ color: '#1a9e4d', fontFamily: T.fontMono, fontSize: 11.5, fontWeight: 700 }}>{c.hires} najato</span>
                      <span style={{ color: T.cardText, fontFamily: T.fontMono, fontSize: 11.5, fontWeight: 700, minWidth: 44, textAlign: 'right' }}>{conv}%</span>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: T.cardSoft, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (parseFloat(conv) * 60) + '%', background: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ECard>
      </div>

      <ECard>
        <SectionHeader title="AI insights z vašich dat" subtitle="Generováno automaticky · obnoveno před 4 hodinami" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { i: 'lightbulb-bold', c: '#FFD166', tag: 'Příležitost', t: 'Inzeráty s hodinovkou nad 180 Kč mají o 41 % vyšší swajp-right rate. Vaše konkurence platí v průměru 162 Kč.' },
            { i: 'shield-warning-bold', c: '#f43f5e', tag: 'Pozor', t: 'Inzerát „Brand ambassador" má CTR jen 13 %. Doporučujeme přepsat headline a přidat fotky týmu.' },
            { i: 'rocket-2-bold', c: '#5BD68A', tag: 'Trend', t: 'Pondělí 17–21h je vaše nejsilnější okno — 32 % všech matchů. Zvažte plánovaný boost na tento čas.' },
            { i: 'target-bold', c: '#5B6BFF', tag: 'Doporučení', t: 'Kandidáti, kteří mají v profilu „latte art", u vás vydrží průměrně 3.2× déle. Filtrujte primárně podle této dovednosti.' },
            { i: 'graph-down-bold', c: '#E0B0FF', tag: 'Anomálie', t: 'Time-to-hire klesl o 28 % po zapnutí Premium tarifu — odhad ROI je +14 200 Kč/měsíc.' },
            { i: 'medal-ribbon-star-bold', c: '#FFD166', tag: 'Výkon', t: 'Vaše firma je v top 8 % gastro segmentu v Brně podle hodnocení i rychlosti odpovědí.' },
          ].map((x, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 12, background: T.cardSoft, border: '1px solid ' + T.cardBorder, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: x.c + '22', border: '1px solid ' + x.c + '44', display: 'grid', placeItems: 'center' }}>
                  <Icon name={x.i} size={13} color={x.c}/>
                </div>
                <span style={{ color: x.c, fontSize: 10, fontWeight: 800, fontFamily: T.fontUI, letterSpacing: 0.7, textTransform: 'uppercase' }}>{x.tag}</span>
              </div>
              <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12, lineHeight: 1.5 }}>{x.t}</div>
            </div>
          ))}
        </div>
      </ECard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ECard>
          <ResponseTimeCard period={period} />
        </ECard>
        <ECard>
          <WageBenchmark />
        </ECard>
        <ECard>
          <FirstInterestCard period={period} />
        </ECard>
        <ECard>
          <RetentionCard />
        </ECard>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// DOBA ODEZVY FIRMY + DOBA DO PRVNÍHO ZÁJMU
// Zdroj: simulovaná data na úrovni (kandidát, inzerát) / (inzerát), zapouzdřená
// v getResponseRecords()/getFirstSwipeRecords(). Až bude platforma reálně
// ukládat swipe_at / firm_response_at / firm_decision (matches) a
// published_at / first_swipe_at (jobs), stačí přepsat tělo těchto dvou funkcí
// na živý dotaz do Supabase — zbytek (bucketing, statistiky, komponenty) se
// nemění, protože pracuje jen s tvarem { swipe_at, firm_response_at, firm_decision }
// resp. { published_at, first_swipe_at }.
// ─────────────────────────────────────────────────────────────

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90, 'rok': 365 };

const RESPONSE_BUCKETS = [
  { key: 'lt5m',  label: '<5 min',     color: '#5BD68A' },
  { key: '5_30m', label: '5-30m',      color: '#5BD68A' },
  { key: '30_1h', label: '30-1h',      color: '#FFD166' },
  { key: '1_3h',  label: '1-3h',       color: '#FFD166' },
  { key: '3_12h', label: '3-12h',      color: '#f43f5e' },
  { key: 'gt12h', label: '>12h',       color: '#f43f5e' },
  { key: 'none',  label: 'Bez odezvy', color: '#9999cc' },
];

function _bucketForMinutes(minutes) {
  if (minutes < 5)   return 'lt5m';
  if (minutes < 30)  return '5_30m';
  if (minutes < 60)  return '30_1h';
  if (minutes < 180) return '1_3h';
  if (minutes < 720) return '3_12h';
  return 'gt12h';
}

function _fmtMinutes(min) {
  if (min == null) return '—';
  if (min < 60) return Math.round(min) + ' min';
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h + 'h' + (m ? ' ' + m + 'min' : '');
}

// Deterministický pseudonáhodný generátor (stejný vstup → stejný výstup, žádné blikání při re-renderu)
function _seededRnd(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// ── Zástupný zdroj: páry (kandidát, inzerát) se swipe_at / firm_response_at / firm_decision ──
function getResponseRecords(rangeDays) {
  const now = Date.now();
  const DAY = 86400000;
  const mult = rangeDays / 30;
  const rnd = _seededRnd(Math.round(rangeDays) + 42);

  const plan = [
    { min: 1,   max: 5,    count: 142, acceptRate: 0.34 },
    { min: 5,   max: 30,   count: 98,  acceptRate: 0.30 },
    { min: 30,  max: 60,   count: 64,  acceptRate: 0.22 },
    { min: 60,  max: 180,  count: 41,  acceptRate: 0.17 },
    { min: 180, max: 720,  count: 22,  acceptRate: 0.10 },
    { min: 720, max: 1440, count: 8,   acceptRate: 0.06 },
  ];

  const records = [];
  plan.forEach(p => {
    const count = Math.max(1, Math.round(p.count * mult));
    for (let i = 0; i < count; i++) {
      const minutes = p.min + rnd() * (p.max - p.min);
      const swipeAt = now - rnd() * rangeDays * DAY;
      records.push({
        swipe_at: new Date(swipeAt).toISOString(),
        firm_response_at: new Date(swipeAt + minutes * 60000).toISOString(),
        firm_decision: rnd() < p.acceptRate ? 'accepted' : 'rejected',
      });
    }
  });

  // "Bez odezvy" — swipnuto 7+ dní zpět, firma nikdy nezareagovala
  const noneCount = Math.max(0, Math.round(19 * mult));
  const noneSpan = Math.max(7, rangeDays);
  for (let i = 0; i < noneCount; i++) {
    const swipeAt = now - (7 + rnd() * (noneSpan - 7)) * DAY;
    records.push({ swipe_at: new Date(swipeAt).toISOString(), firm_response_at: null, firm_decision: null });
  }

  // Čerstvé swipy (< 7 dní) — firma zatím neodpověděla, do statistiky se ještě nepočítají
  const pendingCount = Math.max(0, Math.round(6 * mult));
  const pendingSpan = Math.min(6, rangeDays);
  for (let i = 0; i < pendingCount; i++) {
    const swipeAt = now - rnd() * pendingSpan * DAY;
    records.push({ swipe_at: new Date(swipeAt).toISOString(), firm_response_at: null, firm_decision: null });
  }

  return records;
}

// Bucketing + "míra výběru podle rychlosti" (chrání proti cherry-pickingu — nezodpovězení
// 7+ dní se počítají jako nejhorší kategorie, ne že by z výpočtu úplně vypadli)
function computeResponseStats(records, rangeDays) {
  const now = Date.now();
  const DAY = 86400000;
  const cutoff = now - rangeDays * DAY;

  const counted = records
    .filter(r => new Date(r.swipe_at).getTime() >= cutoff)
    .map(r => {
      const swipeMs = new Date(r.swipe_at).getTime();
      if (r.firm_response_at) {
        const minutes = (new Date(r.firm_response_at).getTime() - swipeMs) / 60000;
        return { bucket: _bucketForMinutes(minutes), minutes, decision: r.firm_decision };
      }
      const ageDays = (now - swipeMs) / DAY;
      if (ageDays >= 7) return { bucket: 'none', minutes: null, decision: null };
      return null; // stále čeká na odpověď firmy — do statistiky zatím nevstupuje
    })
    .filter(Boolean);

  const byBucket = {};
  RESPONSE_BUCKETS.forEach(b => byBucket[b.key] = { total: 0, accepted: 0 });
  counted.forEach(c => { byBucket[c.bucket].total++; if (c.decision === 'accepted') byBucket[c.bucket].accepted++; });

  const fastKeys = ['lt5m', '5_30m', '30_1h'];
  const slowKeys = ['3_12h', 'gt12h', 'none'];
  const sum = (keys, field) => keys.reduce((a, k) => a + byBucket[k][field], 0);
  const fastTotal = sum(fastKeys, 'total'), fastAcc = sum(fastKeys, 'accepted');
  const slowTotal = sum(slowKeys, 'total'), slowAcc = sum(slowKeys, 'accepted');
  const fastRate = fastTotal ? fastAcc / fastTotal : 0;
  const slowRate = slowTotal ? slowAcc / slowTotal : 0;
  const multiplier = slowTotal && slowRate > 0 ? fastRate / slowRate : null;

  const respondedMinutes = counted.filter(c => c.minutes != null).map(c => c.minutes);
  const avgMinutes = respondedMinutes.length ? respondedMinutes.reduce((a, m) => a + m, 0) / respondedMinutes.length : null;

  return {
    chartData: RESPONSE_BUCKETS.map(b => ({ l: b.label, v: byBucket[b.key].total, color: b.color })),
    multiplier,
    avgMinutes,
    total: counted.length,
  };
}

function ResponseTimeCard({ period = '30d' }) {
  const rangeDays = PERIOD_DAYS[period] || 30;
  const stats = computeResponseStats(getResponseRecords(rangeDays), rangeDays);
  const subtitle = stats.multiplier != null
    ? `Kandidáti s odpovědí do 1 h matchují ${stats.multiplier.toFixed(1)}× častěji`
    : 'Rychlost odpovědi vs. míra výběru kandidátů';

  return (
    <>
      <SectionHeader title="Doba odpovědi firmy" subtitle={subtitle} />
      <BarChart width={500} height={200} data={stats.chartData} />
      <div style={{ marginTop: 8, color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 11 }}>
        Váš průměr: <span style={{ color: T.cardText, fontFamily: T.fontMono, fontWeight: 700 }}>{_fmtMinutes(stats.avgMinutes)}</span>
        {' · '}{stats.total} vyhodnocených kandidátů
      </div>
      <div style={{ marginTop: 4, color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 10 }}>
        „Bez odezvy" = firma na kandidáta nereagovala do 7 dní od jeho swipu.
      </div>
    </>
  );
}

// ── Zástupný zdroj: inzeráty se published_at / first_swipe_at ──
function getFirstSwipeRecords(rangeDays) {
  const now = Date.now();
  const DAY = 86400000;
  const mult = rangeDays / 30;
  const rnd = _seededRnd(Math.round(rangeDays) + 777);

  const plan = [
    { min: 1,   max: 5,    count: 2 },
    { min: 5,   max: 30,   count: 5 },
    { min: 30,  max: 60,   count: 7 },
    { min: 60,  max: 180,  count: 9 },
    { min: 180, max: 720,  count: 6 },
    { min: 720, max: 1440, count: 3 },
  ];

  const records = [];
  plan.forEach(p => {
    const count = Math.max(0, Math.round(p.count * mult));
    for (let i = 0; i < count; i++) {
      const minutes = p.min + rnd() * (p.max - p.min);
      const publishedAt = now - rnd() * rangeDays * DAY;
      records.push({
        published_at: new Date(publishedAt).toISOString(),
        first_swipe_at: new Date(publishedAt + minutes * 60000).toISOString(),
      });
    }
  });

  // Inzerát publikován 7+ dní zpět a dosud nikdo neswipnul
  const noneCount = Math.max(0, Math.round(2 * mult));
  const noneSpan = Math.max(7, rangeDays);
  for (let i = 0; i < noneCount; i++) {
    const publishedAt = now - (7 + rnd() * (noneSpan - 7)) * DAY;
    records.push({ published_at: new Date(publishedAt).toISOString(), first_swipe_at: null });
  }

  return records;
}

function computeFirstSwipeStats(records, rangeDays) {
  const now = Date.now();
  const DAY = 86400000;
  const cutoff = now - rangeDays * DAY;

  const counted = records
    .filter(r => new Date(r.published_at).getTime() >= cutoff)
    .map(r => {
      const pubMs = new Date(r.published_at).getTime();
      if (r.first_swipe_at) {
        const minutes = (new Date(r.first_swipe_at).getTime() - pubMs) / 60000;
        return { bucket: _bucketForMinutes(minutes), minutes };
      }
      const ageDays = (now - pubMs) / DAY;
      if (ageDays >= 7) return { bucket: 'none', minutes: null };
      return null; // inzerát je nový, na první swipe se ještě čeká
    })
    .filter(Boolean);

  const byBucket = {};
  RESPONSE_BUCKETS.forEach(b => byBucket[b.key] = 0);
  counted.forEach(c => byBucket[c.bucket]++);

  const minutesList = counted.filter(c => c.minutes != null).map(c => c.minutes);
  const avgMinutes = minutesList.length ? minutesList.reduce((a, m) => a + m, 0) / minutesList.length : null;
  const medianMinutes = minutesList.length ? [...minutesList].sort((a, b) => a - b)[Math.floor(minutesList.length / 2)] : null;

  return {
    chartData: RESPONSE_BUCKETS.map(b => ({ l: b.label, v: byBucket[b.key], color: '#5B6BFF' })),
    avgMinutes,
    medianMinutes,
    total: counted.length,
  };
}

function FirstInterestCard({ period = '30d' }) {
  const rangeDays = PERIOD_DAYS[period] || 30;
  const stats = computeFirstSwipeStats(getFirstSwipeRecords(rangeDays), rangeDays);
  const hasHistogram = stats.total >= 5;

  return (
    <>
      <SectionHeader title="Doba do prvního zájmu" subtitle="Jak rychle si lidé všimnou vašeho inzerátu" />
      <div style={{ padding: hasHistogram ? '14px 0 10px' : '20px 0 6px' }}>
        <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>Průměrně</div>
        <div style={{ color: T.cardText, fontFamily: T.fontMono, fontSize: 28, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>{_fmtMinutes(stats.avgMinutes)}</div>
      </div>
      {hasHistogram && <BarChart width={500} height={160} data={stats.chartData} />}
      <div style={{ marginTop: 8, color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 11 }}>
        Napříč {stats.total} inzeráty za dané období{stats.medianMinutes != null ? ` · medián ${_fmtMinutes(stats.medianMinutes)}` : ''}
      </div>
    </>
  );
}

function CohortTable() {
  const cohorts = [
    { week: '6.4. – 12.4.', size: 12, vals: [100, 92, 83, 75, 75, 67] },
    { week: '13.4. – 19.4.', size: 18, vals: [100, 89, 78, 72, 67] },
    { week: '20.4. – 26.4.', size: 14, vals: [100, 86, 79, 71] },
    { week: '27.4. – 3.5.', size: 22, vals: [100, 91, 82] },
    { week: '4.5. – 10.5.', size: 16, vals: [100, 88] },
    { week: 'Tento týden', size: 9, vals: [100] },
  ];
  return (
    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 3, fontFamily: T.fontUI, fontSize: 11.5 }}>
      <thead>
        <tr style={{ color: T.cardMutedSoft, fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Týden nástupu</th>
          <th style={{ textAlign: 'right', padding: '4px 8px' }}>Vel.</th>
          {['T0','T+1','T+2','T+3','T+4','T+5'].map(h => <th key={h} style={{ padding: '4px 6px', textAlign: 'center' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {cohorts.map((c, i) => (
          <tr key={i}>
            <td style={{ color: T.cardLight, padding: '6px 8px', fontWeight: 600 }}>{c.week}</td>
            <td style={{ color: T.cardMuted, fontFamily: T.fontMono, padding: '6px 8px', textAlign: 'right' }}>{c.size}</td>
            {[0,1,2,3,4,5].map(j => {
              const v = c.vals[j];
              if (v == null) return <td key={j} style={{ padding: 0 }}><div style={{ height: 26, borderRadius: 5, background: T.cardSoft }}/></td>;
              const op = 0.2 + (v / 100) * 0.7;
              return (
                <td key={j} style={{ padding: 0 }}>
                  <div style={{ height: 26, borderRadius: 5, background: `rgba(0, 32, 246, ${op})`, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700 }}>{v}%</div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─────────────────────────────────────────────────────────────
// MZDOVÝ BENCHMARK — ručně udržovaná distribuce mezd napříč firmami na platformě.
// Žádný region/obor (to dřív vedlo k zavádějícímu srovnání) — obecný trh, zobrazený
// jako histogram (kolik firem platí v jakém pásmu), s vaším pásmem zvýrazněným.
//
// TODO: nahradit živým výpočtem — potřebuje agregaci hodinovek napříč VŠEMI
// aktivními inzeráty VŠECH zaměstnavatelů na platformě (ne jen vlastní firmy),
// tu zatím nemáme. Do té doby getWageDistribution()/getWagePercentiles() vrací
// ručně udržovaná referenční data — zbytek komponenty (bucketing, percentil,
// barvy) se pak nemusí měnit.
// ─────────────────────────────────────────────────────────────
const WAGE_DISTRIBUTION = [
  { bucket_kc_h: 120, count: 18 },
  { bucket_kc_h: 140, count: 42 },
  { bucket_kc_h: 160, count: 65 },
  { bucket_kc_h: 180, count: 48 },
  { bucket_kc_h: 200, count: 34 },
  { bucket_kc_h: 220, count: 16 },
  { bucket_kc_h: 240, count: 7 },
];
const WAGE_PERCENTILES = [
  { pct: 5,  wage_kc_h: 120 },
  { pct: 25, wage_kc_h: 145 },
  { pct: 50, wage_kc_h: 170 },
  { pct: 75, wage_kc_h: 195 },
  { pct: 95, wage_kc_h: 230 },
];
const WAGE_TOP10_KC_H = 220;
const WAGE_BENCHMARK_UPDATED = '2026-04-01';
const WAGE_BENCHMARK_EMAIL = 'data@makej.eu';

// Jediné místo, které zná zdroj dat. Později stačí přepsat tělo těchto funkcí
// (např. na fetch živých dat z platformy) — zbytek komponenty zůstane beze změny.
function getWageDistribution() {
  return WAGE_DISTRIBUTION;
}
function getWagePercentiles() {
  return WAGE_PERCENTILES;
}

// Lineární interpolace mezi nejbližšími body křivky — odhad, kolik % firem platí míň než `wage`.
function estimateWagePercentile(wage, points) {
  if (!points.length) return null;
  if (wage <= points[0].wage_kc_h) return points[0].pct;
  if (wage >= points[points.length - 1].wage_kc_h) return points[points.length - 1].pct;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    if (wage >= a.wage_kc_h && wage <= b.wage_kc_h) {
      const t = (wage - a.wage_kc_h) / (b.wage_kc_h - a.wage_kc_h);
      return Math.round(a.pct + t * (b.pct - a.pct));
    }
  }
  return 50;
}

// Do kterého pásma histogramu vaše mzda spadá (poslední pásmo je otevřené — "240+")
function _wageBucketIndex(wage, distribution) {
  for (let i = distribution.length - 1; i >= 0; i--) {
    if (wage >= distribution[i].bucket_kc_h) return i;
  }
  return 0;
}

function WageBenchmark() {
  const distribution = getWageDistribution();
  const points = getWagePercentiles();
  const median = points.find(p => p.pct === 50);

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  // Fallback pro jistotu, kdyby benchmark data chyběla (v běžném provozu nenastane)
  if (!distribution.length || !median) {
    return (
      <>
        <SectionHeader title="Průměrná hodinovka brigádníků" />
        <div style={{ padding: '18px 0 6px', color: T.cardMuted, fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.55 }}>
          Zatím nemáme aktuální data. Napište nám na{' '}
          <a href={`mailto:${WAGE_BENCHMARK_EMAIL}`} style={{ color: '#0020F6', textDecoration: 'none', fontWeight: 700 }}>{WAGE_BENCHMARK_EMAIL}</a>.
        </div>
      </>
    );
  }

  // „Váš průměr" — průměr hodinovky napříč všemi aktivními inzeráty firmy (celé portfolio)
  const jobs = (typeof E_JOBS !== 'undefined' ? E_JOBS : []).filter(j => j.status === 'active' || j.status === 'urgent');
  const yourWage = jobs.length ? Math.round(jobs.reduce((a, j) => a + Number(j.pay || 0), 0) / jobs.length) : null;
  const percentile = yourWage != null ? estimateWagePercentile(yourWage, points) : null;
  const yourBucketIdx = yourWage != null ? _wageBucketIndex(yourWage, distribution) : -1;

  // Barevná logika podle percentilu: zelená nad polovinou trhu, žlutá kolem mediánu, červená pod
  let cmp = null;
  if (percentile != null) {
    if (percentile >= 60)      cmp = { color: '#1a9e4d', label: 'nad trhem' };
    else if (percentile >= 40) cmp = { color: '#c99400', label: 'na úrovni trhu' };
    else                       cmp = { color: '#f43f5e', label: 'pod trhem' };
  }

  const maxCount = Math.max(...distribution.map(d => d.count));
  const BAR_TRACK_H = 110;

  return (
    <>
      <SectionHeader title="Průměrná hodinovka brigádníků" subtitle={`Napříč trhem · aktualizováno ${fmtDate(WAGE_BENCHMARK_UPDATED)}`} />

      {percentile != null && (
        <div style={{ color: cmp.color, fontFamily: T.fontUI, fontSize: 15.5, fontWeight: 800, lineHeight: 1.3, marginTop: 4 }}>
          Platíte {percentile >= 50 ? 'více' : 'méně'} než {percentile}&nbsp;% firem na Makej
        </div>
      )}

      {/* Histogram — kolik firem platí v jakém pásmu, vaše pásmo zvýrazněné */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: BAR_TRACK_H + 24, marginTop: 18 }}>
        {distribution.map((d, i) => {
          const isYou = i === yourBucketIdx;
          const h = maxCount ? Math.max(4, Math.round((d.count / maxCount) * BAR_TRACK_H)) : 4;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ height: 16, width: '100%', textAlign: 'center' }}>
                {isYou && <span style={{ color: cmp.color, fontFamily: T.fontUI, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vy</span>}
              </div>
              <div style={{ width: '100%', height: h, borderRadius: '8px 8px 3px 3px', background: isYou ? cmp.color : 'rgba(91,107,255,0.45)', marginTop: 4 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {distribution.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', color: T.cardMutedSoft, fontFamily: T.fontMono, fontSize: 10 }}>
            {i === distribution.length - 1 ? `${d.bucket_kc_h}+` : d.bucket_kc_h}
          </div>
        ))}
      </div>

      {/* Souhrn — medián trhu / vy / top 10 % */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid ' + T.cardBorder }}>
        <div>
          <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Medián trhu</div>
          <div style={{ color: T.cardText, fontFamily: T.fontMono, fontSize: 19, fontWeight: 800 }}>{median.wage_kc_h}<span style={{ fontSize: 12, fontWeight: 600, color: T.cardMuted }}> Kč</span></div>
        </div>
        {yourWage != null && (
          <div>
            <div style={{ color: cmp.color, fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Vy</div>
            <div style={{ color: cmp.color, fontFamily: T.fontMono, fontSize: 19, fontWeight: 800 }}>{yourWage}<span style={{ fontSize: 12, fontWeight: 600 }}> Kč</span></div>
          </div>
        )}
        <div>
          <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Top 10 %</div>
          <div style={{ color: T.cardText, fontFamily: T.fontMono, fontSize: 19, fontWeight: 800 }}>{WAGE_TOP10_KC_H}+<span style={{ fontSize: 12, fontWeight: 600, color: T.cardMuted }}> Kč</span></div>
        </div>
      </div>

      {yourWage == null && (
        <div style={{ marginTop: 14, color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12.5, lineHeight: 1.55 }}>
          Zatím nemáte žádný aktivní inzerát, se kterým bychom vás mohli srovnat s trhem.
        </div>
      )}

      <div style={{ marginTop: 12, color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 10.5, lineHeight: 1.5 }}>
        Orientační odhad na základě interní distribuce mezd na platformě. Nemusí odpovídat aktuální situaci na trhu.
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// RETENCE KANDIDÁTŮ — kolik najatých kandidátů se k firmě vrací opakovaně
// (2+ záznamy se stavem "Najato" napříč různými inzeráty, ne v rámci jednoho inzerátu).
// Počítá se za celou historii firmy, ne za zvolené období — retence je dlouhodobá metrika.
//
// TODO: napojit na reálný "Najato" stav, jakmile bude definován spolehlivý mechanismus
// označování kandidátů jako najatých (otevřený bod z dřívějška). Do té doby vrací
// getRetentionRecords() mock data ve správné struktuře { id, name, hires } — zbytek
// komponenty (výpočet %, edge case, seznam nejvěrnějších) se pak nemusí měnit.
// ─────────────────────────────────────────────────────────────
function getRetentionRecords() {
  return [
    { id: 'r1',  name: 'Petr N.',    hires: 4 },
    { id: 'r2',  name: 'Klára V.',   hires: 3 },
    { id: 'r3',  name: 'Tomáš M.',   hires: 3 },
    { id: 'r4',  name: 'Eliška Š.',  hires: 2 },
    { id: 'r5',  name: 'Adam P.',    hires: 2 },
    { id: 'r6',  name: 'Markéta L.', hires: 1 },
    { id: 'r7',  name: 'Jakub V.',   hires: 1 },
    { id: 'r8',  name: 'Sára D.',    hires: 1 },
    { id: 'r9',  name: 'David K.',   hires: 1 },
    { id: 'r10', name: 'Nikola H.',  hires: 1 },
    { id: 'r11', name: 'Filip R.',   hires: 1 },
  ];
}

function computeRetentionStats(records) {
  const total = records.length;
  const returning = records.filter(r => r.hires >= 2).length;
  const pct = total > 0 ? Math.round((returning / total) * 100) : null;
  const top = [...records].sort((a, b) => b.hires - a.hires).filter(r => r.hires >= 2).slice(0, 5);

  // Rozpad podle počtu brigád — pro firmy s víc inzeráty/kandidáty vypovídá líp než jmenovky
  const tiers = [
    { key: '1', label: '1× najato',   test: h => h === 1 },
    { key: '2', label: '2× najato',   test: h => h === 2 },
    { key: '3+', label: '3+ × najato', test: h => h >= 3 },
  ];
  const breakdown = tiers.map(t => {
    const count = records.filter(r => t.test(r.hires)).length;
    return { ...t, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });

  return { total, returning, pct, top, breakdown, hasEnoughData: total >= 5 };
}

// Tarif firmy rozhoduje, jestli dává smysl vypisovat konkrétní jména (malá firma, pár inzerátů)
// nebo procentuální rozpad (větší firma s víc inzeráty — jmenovky by u desítek kandidátů nic neřekly).
// Stejná normalizace starých názvů tarifů jako v EPricing (ECOMPANY.plan v datech zatím ukládá
// staré názvy — Standard, Business, Enterprise…).
function _planTier() {
  const planName = ((typeof ECOMPANY !== 'undefined' && ECOMPANY.plan) || '').toLowerCase();
  if (planName.includes('enterprise') || planName.includes('vlastní') || planName.includes('vlastni')) return 'vlastni';
  if (planName.includes('business') || planName.includes('premium') || planName.includes('maximální') || planName.includes('maximalni')) return 'maximalni';
  if (planName.includes('dynamick')) return 'dynamicky';
  if (planName.includes('standard') || planName.includes('výhodný') || planName.includes('vyhodny')) return 'vyhodny';
  return 'zakladni';
}

function RetentionCard() {
  const stats = computeRetentionStats(getRetentionRecords()); // TODO: napojit na reálný "Najato" stav
  const showNamed = ['zakladni', 'vyhodny'].includes(_planTier());

  return (
    <>
      <SectionHeader title="Retence kandidátů" subtitle="Kolik lidí se k vám vrací" />

      {!stats.hasEnoughData && (
        <div style={{ padding: '18px 0 6px', color: T.cardMuted, fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.55 }}>
          Zatím nedostatek dat — potřebujeme alespoň 5 najatých kandidátů pro spolehlivou statistiku.
        </div>
      )}

      {stats.hasEnoughData && (
        <>
          <div style={{ padding: '18px 0 6px' }}>
            <div style={{ color: '#0020F6', fontFamily: T.fontMono, fontSize: 34, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
              {stats.pct}<span style={{ fontSize: 18, fontWeight: 700 }}>%</span>
            </div>
            <div style={{ marginTop: 8, color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12.5 }}>
              {stats.returning} z {stats.total} najatých kandidátů u vás pracovalo opakovaně
            </div>
          </div>

          {showNamed && stats.top.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Nejvěrnější kandidáti
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stats.top.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 9, background: T.cardSoft, border: '1px solid ' + T.cardBorder }}>
                    <span style={{ color: T.cardText, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ color: '#0020F6', fontFamily: T.fontMono, fontSize: 12, fontWeight: 800 }}>{c.hires}× brigáda</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showNamed && (
            <div style={{ marginTop: 6 }}>
              <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Rozpad podle počtu brigád
              </div>
              {stats.breakdown.map(t => (
                <div key={t.key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontFamily: T.fontUI, marginBottom: 4 }}>
                    <span style={{ color: T.cardLight }}>{t.label}</span>
                    <span style={{ color: T.cardText, fontFamily: T.fontMono, fontWeight: 700 }}>{t.count} · {t.pct} %</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: T.cardSoft }}>
                    <div style={{ height: '100%', width: t.pct + '%', borderRadius: 3, background: '#0020F6' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 12, color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 10.5, lineHeight: 1.5 }}>
        Počítáno za celou historii firmy napříč všemi inzeráty, nezávisle na zvoleném období.
      </div>
    </>
  );
}

// ── Demografie ────────────────────────────────────────────────
function AnalyticsDemo() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <ECard style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeader title="Věk" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <BarChart width={300} height={200} data={[
              { l: '15-17', v: 22 }, { l: '18-21', v: 87 }, { l: '22-25', v: 68 }, { l: '26-30', v: 31 }, { l: '30+', v: 14 },
            ]} color="#0020F6" />
          </div>
        </ECard>
        <ECard style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeader title="Pohlaví" />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Donut size={130} thickness={20} data={[{ v: 58, color: '#5B6BFF' }, { v: 41, color: '#FFD166' }, { v: 1, color: '#E0B0FF' }]} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: T.fontUI, fontSize: 12 }}>
              {[
                { l: 'Žena', v: '58 %', n: 130, c: '#5B6BFF' },
                { l: 'Muž', v: '41 %', n: 92, c: '#FFD166' },
                { l: 'Jiné', v: '1 %', n: 2, c: '#E0B0FF' },
              ].map((x, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
                    <span style={{ color: T.cardLight, flex: 1 }}>{x.l}</span>
                    <span style={{ color: T.cardText, fontFamily: T.fontMono, fontWeight: 700 }}>{x.v}</span>
                  </div>
                  <div style={{ color: T.cardMutedSoft, fontFamily: T.fontMono, fontSize: 10, marginLeft: 14 }}>{x.n} kandidátů</div>
                </div>
              ))}
            </div>
          </div>
        </ECard>
        <ECard style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeader title="Zaměstnanecký status" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {[
              { l: 'Středoškolák', v: 38, c: '#0020F6' },
              { l: 'Vysokoškolák', v: 42, c: '#5B6BFF' },
              { l: 'Pracující na vedlejšák', v: 14, c: '#FFD166' },
              { l: 'Bez práce', v: 6, c: '#E0B0FF' },
            ].map((x, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontFamily: T.fontUI, marginBottom: 4 }}>
                  <span style={{ color: T.cardLight }}>{x.l}</span>
                  <span style={{ color: T.cardText, fontFamily: T.fontMono, fontWeight: 700 }}>{x.v} %</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.cardSoft }}>
                  <div style={{ height: '100%', width: x.v + '%', borderRadius: 3, background: x.c }} />
                </div>
              </div>
            ))}
          </div>
        </ECard>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PLÁN SMĚN — reálný kalendář z Supabase dat (E_JOBS)
// ─────────────────────────────────────────────────────────────

function ECalendar() {
  const dark    = window._makejIsDark;
  const cText   = dark ? '#ffffff'    : '#111111';
  const cMuted  = dark ? T.muted      : '#666666';
  const cSoft   = dark ? T.mutedSoft  : '#888888';
  const cLight  = dark ? T.light      : '#444444';
  const cBorder = dark ? T.border     : T.cardBorder;

  const now = new Date();
  const [viewYear,  setViewYear]  = useStateE(now.getFullYear());
  const [viewMonth, setViewMonth] = useStateE(now.getMonth()); // 0-indexed

  const MONTH_NAMES = ['Leden','Únor','Březen','Duben','Květen','Červen',
                       'Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
  const DAY_NAMES   = ['Po','Út','St','Čt','Pá','So','Ne'];

  // Parse ISO "2025-05-14" nebo Czech "14.5.2025"
  function parseDate(s) {
    if (!s) return null;
    const iso = new Date(s);
    if (!isNaN(iso.getTime())) return iso;
    const p = s.split('.');
    if (p.length >= 2) {
      const d2 = new Date(p[2] ? parseInt(p[2]) : now.getFullYear(), parseInt(p[1]) - 1, parseInt(p[0]));
      if (!isNaN(d2.getTime())) return d2;
    }
    return null;
  }

  function jobColor(j) {
    if (j.status === 'filled')  return '#5BD68A';
    if (j.status === 'urgent')  return '#f43f5e';
    if (j.status === 'paused')  return '#9999cc';
    return j.accent || '#8AB4FF';
  }

  // Jobs pro aktuální zobrazený měsíc
  const monthJobs = E_JOBS.filter(j => {
    const d = parseDate(j.date);
    return d && d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  // Seskupit podle dne
  const byDay = {};
  monthJobs.forEach(j => {
    const d = parseDate(j.date);
    if (!d) return;
    const day = d.getDate();
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(j);
  });

  // Pole dnů pro grid — včetně přetékajících dnů z předchozího/dalšího měsíce
  const daysInMonth     = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstWeekday    = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Po = 0
  const calDays = [];
  for (let i = 0; i < firstWeekday; i++) calDays.push({ d: daysInPrevMonth - firstWeekday + 1 + i, current: false });
  for (let d = 1; d <= daysInMonth; d++) calDays.push({ d, current: true });
  const totalCells = Math.ceil(calDays.length / 7) * 7;
  let nextMonthDay = 1;
  while (calDays.length < totalCells) calDays.push({ d: nextMonthDay++, current: false });

  // Statistiky
  const filled     = monthJobs.filter(j => j.status === 'filled').length;
  const open       = monthJobs.filter(j => j.status === 'active' || j.status === 'urgent').length;
  const totalHired = monthJobs.reduce((s, j) => s + (j.hired || 0), 0);

  const isCurrentMonth = now.getFullYear() === viewYear && now.getMonth() === viewMonth;
  const today = now.getDate();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* KPI čísla */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Brigády ' + MONTH_NAMES[viewMonth], v: monthJobs.length || '—', sub: 'inzerátů s datem v tomto měsíci', c: '#FFD166' },
          { l: 'Otevřené',    v: open     || '—', sub: 'potřebují brigádníky',  c: '#f43f5e' },
          { l: 'Naplněno',   v: filled    || '—', sub: 'brigád s obsazenou rolí', c: '#5BD68A' },
          { l: 'Najato',     v: totalHired || '—', sub: 'přijatých brigádníků',  c: '#5B6BFF' },
        ].map((x, i) => (
          <ECard key={i} padding={16}>
            <div style={{ color: cMuted, fontSize: 11, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.4, textTransform: 'uppercase' }}>{x.l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <div style={{ color: dark ? x.c : '#111111', fontFamily: T.fontMono, fontSize: 24, fontWeight: 700, letterSpacing: -0.6 }}>{x.v}</div>
            </div>
            <div style={{ color: cSoft, fontSize: 11, fontFamily: T.fontUI, marginTop: 2 }}>{x.sub}</div>
          </ECard>
        ))}
      </div>

      {/* Kalendář */}
      <ECard padding={0} style={{ overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid ' + cBorder }}>
          <button onClick={prevMonth} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + cBorder, color: cLight, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <Icon name="alt-arrow-left-line-duotone" size={14} color={cLight}/>
          </button>
          <div style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, color: cText, minWidth: 160 }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </div>
          <button onClick={nextMonth} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + cBorder, color: cLight, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <Icon name="alt-arrow-right-line-duotone" size={14} color={cLight}/>
          </button>
          <div style={{ flex: 1 }} />
          {/* Legenda */}
          <div style={{ display: 'flex', gap: 14, fontSize: 11, fontFamily: T.fontUI }}>
            {[['#5BD68A','Naplněno'],['#8AB4FF','Aktivní'],['#f43f5e','ASAP']].map(([c,l]) => (
              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c }}/>
                <span style={{ color: cLight }}>{l}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Názvy dní */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid ' + T.border }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ padding: '8px 12px', fontSize: 10.5, fontFamily: T.fontUI, fontWeight: 700, color: cSoft, letterSpacing: 0.6, textTransform: 'uppercase', textAlign: i >= 5 ? 'center' : 'left', background: i >= 5 ? 'rgba(0,0,0,0.08)' : 'transparent' }}>{d}</div>
          ))}
        </div>

        {/* Buňky */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {calDays.map((item, i) => {
            const { d, current } = item;
            const dayJobs   = current ? (byDay[d] || []) : [];
            const isWeekend = (i % 7) >= 5;
            const isToday   = isCurrentMonth && current && d === today;
            const dayNumColor = isToday ? '#fff' : current ? cLight : (dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.22)');
            return (
              <div key={i} style={{
                minHeight: 100, padding: 8,
                borderRight:  (i % 7 < 6) ? '1px solid ' + cBorder : 'none',
                borderBottom: '1px solid ' + cBorder,
                background:   isWeekend ? 'rgba(0,0,0,0.06)' : 'transparent',
              }}>
                <>
                  <div style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center', background: isToday ? T.primary : 'transparent', color: dayNumColor, fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{d}</div>
                  {current && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {dayJobs.map((job, j) => {
                        const c = jobColor(job);
                        return (
                          <div key={j} style={{ padding: '3px 6px', borderRadius: 5, background: c + '22', borderLeft: '2px solid ' + c }}>
                            <div style={{ color: cText, fontWeight: 700, fontSize: 10.5, fontFamily: T.fontUI, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                            {(job.time_start || job.time_end) && (
                              <div style={{ color: cMuted, fontFamily: T.fontMono, fontSize: 9.5 }}>
                                {[job.time_start, job.time_end].filter(Boolean).join('–')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              </div>
            );
          })}
        </div>
      </ECard>

      {/* Seznam otevřených brigád */}
      {open > 0 && (() => {
        const openJobs = monthJobs
          .filter(j => j.status === 'active' || j.status === 'urgent')
          .sort((a, b) => (parseDate(a.date) || 0) - (parseDate(b.date) || 0));
        return (
          <ECard>
            <SectionHeader title="Otevřené brigády" subtitle="Potřebují obsadit brigádníky" />
            {openJobs.map((j, i) => {
              const d = parseDate(j.date);
              const c = jobColor(j);
              const dayName = d ? DAY_NAMES[(d.getDay() + 6) % 7] : '';
              return (
                <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < openJobs.length - 1 ? '1px solid ' + cBorder : 'none' }}>
                  <div style={{ textAlign: 'center', width: 44, flexShrink: 0 }}>
                    <div style={{ color: dark ? c : '#111111', fontFamily: T.fontMono, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{d ? d.getDate() : '—'}</div>
                    <div style={{ color: cMuted, fontSize: 10, fontFamily: T.fontUI }}>{dayName}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: cText, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</div>
                    {(j.time_start || j.time_end || j.location) && (
                      <div style={{ color: cMuted, fontFamily: T.fontMono, fontSize: 10.5, marginTop: 2 }}>
                        {[j.time_start && j.time_end ? j.time_start + '–' + j.time_end : j.time_start, j.location].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: (j.hired || 0) > 0 ? (dark ? '#FFD166' : '#111111') : '#f43f5e', fontFamily: T.fontMono, fontSize: 13, fontWeight: 700 }}>
                      {j.hired || 0} najato
                    </div>
                    {j.matches > 0 && (
                      <div style={{ color: cSoft, fontSize: 10, fontFamily: T.fontUI }}>{j.matches} zájemců</div>
                    )}
                  </div>
                </div>
              );
            })}
          </ECard>
        );
      })()}

      {/* Prázdný stav */}
      {monthJobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: cMuted, fontFamily: T.fontUI }}>
          <Icon name="calendar-bold" size={44} color={cSoft} />
          <div style={{ marginTop: 14, fontSize: 16, fontWeight: 700, color: cLight }}>
            Žádné brigády v {MONTH_NAMES[viewMonth]} {viewYear}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6 }}>
            Přidejte inzeráty s datem v tomto měsíci a zobrazí se zde automaticky.
          </div>
        </div>
      )}

    </div>
  );
}

/* ============================================================
   ANALYTIKA (EAnalytics) — redesign 1d: modrá hlavička + pás metrik
   reagující na výběr kraje, interaktivní choropleth mapa ČR
   (hover náhled + vícenásobný výběr + count-up), panel kraje,
   a karty: cohort, kanály, insighty, doba odpovědi, hodinovka,
   doba do zájmu, retence, demografie. Aktivní: Nový inzerát/Inzerovat
   zde → onNew, Export dat / Přepočítat → toast, období → EPeriodPicker.
   Mapová geometrie se přebírá z _premium/kraje-map.jsx (KRAJE_PATHS).
   ============================================================ */
const _AN_CR = { users: 12950, jobs: 1641, rate: 170, firms: 1284, fill: 2.4, fields: [['Pohostinství a gastro', 34], ['Sklad a logistika', 26], ['Obchod a marketing', 18]] };
const _AN_NAMES = { praha: 'Praha', stredocesky: 'Středočeský', jihomoravsky: 'Jihomoravský', moravskoslezsky: 'Moravskoslezský', ustecky: 'Ústecký', olomoucky: 'Olomoucký', jihocesky: 'Jihočeský', plzensky: 'Plzeňský', zlinsky: 'Zlínský', kralovehradecky: 'Královéhradecký', pardubicky: 'Pardubický', liberecky: 'Liberecký', vysocina: 'Vysočina', karlovarsky: 'Karlovarský' };
const _AN_REG = {
  praha:           { users: 2480, jobs: 388, rate: 195, firms: 318, fill: 1.8, fields: [['Pohostinství a gastro', 41], ['Obchod a marketing', 23], ['Provozní služby', 14]] },
  stredocesky:     { users: 1870, jobs: 236, rate: 178, firms: 214, fill: 2.1, fields: [['Sklad a logistika', 38], ['Pohostinství a gastro', 24], ['Výroba', 16]] },
  jihomoravsky:    { users: 1540, jobs: 198, rate: 172, firms: 176, fill: 2.2, fields: [['Pohostinství a gastro', 33], ['Obchod a marketing', 21], ['Sklad a logistika', 19]] },
  moravskoslezsky: { users: 1320, jobs: 154, rate: 162, firms: 132, fill: 2.6, fields: [['Výroba', 31], ['Sklad a logistika', 25], ['Pohostinství a gastro', 20]] },
  ustecky:         { users: 810,  jobs: 92,  rate: 160, firms: 84,  fill: 2.9, fields: [['Výroba', 34], ['Sklad a logistika', 24], ['Provozní služby', 17]] },
  olomoucky:       { users: 720,  jobs: 84,  rate: 158, firms: 78,  fill: 2.7, fields: [['Sklad a logistika', 29], ['Pohostinství a gastro', 23], ['Zemědělství', 15]] },
  jihocesky:       { users: 690,  jobs: 78,  rate: 165, firms: 72,  fill: 2.5, fields: [['Pohostinství a gastro', 36], ['Zemědělství', 19], ['Obchod a marketing', 17]] },
  plzensky:        { users: 640,  jobs: 88,  rate: 172, firms: 76,  fill: 2.3, fields: [['Sklad a logistika', 33], ['Výroba', 24], ['Pohostinství a gastro', 18]] },
  zlinsky:         { users: 590,  jobs: 66,  rate: 158, firms: 61,  fill: 2.8, fields: [['Výroba', 28], ['Pohostinství a gastro', 24], ['Obchod a marketing', 16]] },
  kralovehradecky: { users: 560,  jobs: 64,  rate: 163, firms: 58,  fill: 2.6, fields: [['Pohostinství a gastro', 27], ['Sklad a logistika', 24], ['Výroba', 18]] },
  pardubicky:      { users: 520,  jobs: 58,  rate: 160, firms: 54,  fill: 2.7, fields: [['Sklad a logistika', 31], ['Výroba', 23], ['Obchod a marketing', 15]] },
  liberecky:       { users: 480,  jobs: 55,  rate: 164, firms: 52,  fill: 2.6, fields: [['Pohostinství a gastro', 30], ['Výroba', 22], ['Provozní služby', 16]] },
  vysocina:        { users: 470,  jobs: 52,  rate: 156, firms: 47,  fill: 3.1, fields: [['Výroba', 30], ['Zemědělství', 21], ['Sklad a logistika', 18]] },
  karlovarsky:     { users: 260,  jobs: 28,  rate: 152, firms: 26,  fill: 3.3, fields: [['Pohostinství a gastro', 38], ['Provozní služby', 20], ['Obchod a marketing', 14]] },
};
const _AN_MAXU = Math.max.apply(null, Object.values(_AN_REG).map(r => r.users));
const _anNf = n => Math.round(n).toLocaleString('cs-CZ');
const _anDec = n => n.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const _anShade = t => { const a = [238, 241, 255], b = [27, 52, 240], k = Math.pow(t, 0.62); return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',') + ')'; };
function _anAgg(slugs) {
  if (!slugs.length) return _AN_CR;
  const rs = slugs.map(s => _AN_REG[s]);
  const users = rs.reduce((s, r) => s + r.users, 0);
  const jobs = rs.reduce((s, r) => s + r.jobs, 0);
  const firms = rs.reduce((s, r) => s + r.firms, 0);
  const rate = Math.round(rs.reduce((s, r) => s + r.rate * r.users, 0) / users);
  const fill = rs.reduce((s, r) => s + r.fill * r.jobs, 0) / jobs;
  const mix = {};
  rs.forEach(r => r.fields.forEach(([l, p]) => { mix[l] = (mix[l] || 0) + p * r.users; }));
  const fields = Object.entries(mix).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l, w]) => [l, Math.round(w / users)]);
  return { users, jobs, rate, firms, fill, fields };
}
const _AN_CHANNELS = [
  ['Swipe feed', '#1B34F0', 8420, 28, 0.33], ['Vyhledávání', '#5C71FF', 2140, 9, 0.42],
  ['Doporučení', '#0FA968', 1280, 11, 0.86], ['Boost (placený)', '#F5920B', 1007, 14, 1.39],
];
const _AN_INSIGHTS = [
  ['Příležitost', '#0B7B4B', '#E6F7EF', 'Inzeráty s hodinovkou nad 180 Kč mají o 41 % vyšší swipe-right rate. Vaše konkurence platí v průměru 162 Kč.'],
  ['Pozor', '#B96F06', '#FFF3E0', 'Inzerát „Brand ambassador" má CTR jen 13 %. Doporučujeme přepsat headline a přidat fotky týmu.'],
  ['Trend', '#1B34F0', '#EEF1FF', 'Pondělí 17–21 h je vaše nejsilnější okno — 32 % všech matchů. Zvažte plánovaný boost na tento čas.'],
  ['Doporučení', '#1B34F0', '#EEF1FF', 'Kandidáti, kteří mají v profilu „latte art", u vás vydrží průměrně 3,2× déle. Filtrujte primárně podle této dovednosti.'],
  ['Anomálie', '#5A32BC', '#F3EDFF', 'Time-to-hire klesl o 28 % po zapnutí Premium tarifu — odhad ROI je +14 200 Kč/měsíc.'],
  ['Výkon', '#0B7B4B', '#E6F7EF', 'Vaše firma je v top 8 % gastro segmentu v Brně podle hodnocení i rychlosti odpovědí.'],
];
const _AN_REPLY = [['<5 min', 142, '#0FA968'], ['5–30 m', 98, '#0FA968'], ['30 m–1 h', 64, '#5C71FF'], ['1–3 h', 41, '#5C71FF'], ['3–12 h', 22, '#F5920B'], ['>12 h', 8, '#F5920B'], ['Bez odezvy', 19, '#C7CCE3']];
const _AN_WAGE = [['120', 34, '#C7D0FF'], ['140', 58, '#C7D0FF'], ['160', 82, '#C7D0FF'], ['180', 66, '#C7D0FF'], ['200', 54, '#0FA968'], ['220', 28, '#C7D0FF'], ['240+', 14, '#C7D0FF']];
const _AN_INTEREST = [['<5 min', 2, '#5C71FF'], ['5–30 m', 5, '#5C71FF'], ['30 m–1 h', 7, '#5C71FF'], ['1–3 h', 9, '#1B34F0'], ['3–12 h', 6, '#5C71FF'], ['>12 h', 3, '#5C71FF'], ['Bez odezvy', 2, '#C7CCE3']];
const _AN_AGE = [['15–17', 22, '#5C71FF'], ['18–21', 87, '#1B34F0'], ['22–25', 68, '#1B34F0'], ['26–30', 31, '#5C71FF'], ['30+', 14, '#5C71FF']];
const _AN_GENDER = [['Žena', 58, 130, '#1B34F0'], ['Muž', 41, 92, '#F5920B'], ['Jiné', 1, 2, '#C7A6F5']];
const _AN_STATUS = [['Středoškolák', 38], ['Vysokoškolák', 42], ['Pracující na vedlejšák', 14], ['Bez práce', 6]];
const _AN_LOYAL = [['Petr N.', 4], ['Klára V.', 3], ['Tomáš M.', 3], ['Eliška Š.', 2], ['Adam P.', 2]];

function _AnBars({ data, height }) {
  const max = Math.max.apply(null, data.map(d => d[1]).concat([1]));
  return (
    <>{data.map(([label, v, color], i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#0B1233' }}>{v}</span>
        <span style={{ width: '100%', height: Math.max(4, v / max * height), background: color, borderRadius: '8px 8px 4px 4px' }} />
        <span style={{ fontSize: 11, color: '#7A82A6', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
    ))}</>
  );
}
const _AN_CARD = { background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: '20px 22px 22px' };
const _AN_H = { fontSize: 17, fontWeight: 800, color: '#0B1233', letterSpacing: '-.01em' };
const _AN_SUB = { fontSize: 13, color: '#7A82A6' };
const _AN_LBL = { fontSize: 11, fontWeight: 800, color: '#A6ADCB', letterSpacing: '.08em', textTransform: 'uppercase' };
const _AN_NUM = { fontSize: 22, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1 };

// ── Statistiky: základní pro všechny, plné od Dynamického (28. 9.) ──
// Ceník: Základní + Výhodný = „Základní statistiky", Dynamický a výš =
// „Plné statistiky + CSV export". Dřív byla celá záložka pro nižší tarify
// zamčená, takže slíbené základní statistiky nebyly nikde.
// Plná sekce u nižšího tarifu: rozmazaná, klik → okno „od Dynamického".
function EPlnaSekce({ children, onZamceno }) {
  if (_isPro()) return children;
  return (
    <div onClick={onZamceno} title="Plné statistiky — od tarifu Dynamický" style={{ position: 'relative', cursor: 'pointer', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ filter: 'blur(5px)', opacity: .55, pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true">{children}</div>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#0B1233', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 999, padding: '9px 15px', boxShadow: '0 10px 28px -12px rgba(16,24,64,.35)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B34F0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>
          Od tarifu Dynamický
        </span>
      </div>
    </div>
  );
}
function EPlneOkno({ onClose }) {
  React.useEffect(() => { const esc = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, []);
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(11,18,51,.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{ width: 440, maxWidth: '100%', background: '#fff', borderRadius: 18, boxShadow: '0 30px 80px -20px rgba(11,18,51,.45)', padding: '26px 26px 22px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7A82A6', marginBottom: 6 }}>Tarif Dynamický a vyšší</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', marginBottom: 10 }}>Plné statistiky</div>
        <div style={{ fontSize: 14, color: '#3A4266', lineHeight: 1.55, marginBottom: 16 }}>Ve vašem tarifu máte základní statistiky. Podrobné přehledy a export dat odemkne tarif Dynamický.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {['Trh práce po krajích a hodinovky na trhu', 'Jak rychle odpovídáte kandidátům', 'Kdo se k vám vrací a jak rychle přijde první zájem', 'Export dat do CSV'].map(t => (
            <div key={t} style={{ display: 'grid', gridTemplateColumns: '8px 1fr', columnGap: 12, alignItems: 'start' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1B34F0', marginTop: 8 }} />
              <span style={{ fontSize: 14, color: '#3A4266', lineHeight: 1.55 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <EBtnSek onClick={onClose}>Zavřít</EBtnSek>
          <EBtnHl onClick={() => { onClose(); window.empGoTab && window.empGoTab('pricing'); }}>Zobrazit tarify</EBtnHl>
        </div>
      </div>
    </div>,
    document.body
  );
}

function EAnalytics({ period = '30d', onNew, onTab, onPeriod } = {}) {
  const [plneOkno, setPlneOkno] = React.useState(false);
  const zamceno = () => setPlneOkno(true);

  // ── Základní statistiky ze skutečných dat (E_JOBS: zhlédnutí + zájemci s časem) ──
  const _jobs = (typeof E_JOBS !== 'undefined' ? E_JOBS : []);
  const _vlastni = period && typeof period === 'object';
  const _od = _vlastni ? new Date(period.from).getTime() : Date.now() - ({ '7d': 7, '30d': 30, '90d': 90, rok: 365 }[period] || 30) * 86400000;
  const _do = _vlastni ? new Date(period.to).getTime() + 86400000 : Date.now() + 1;
  const _vObd = t => { const x = new Date(t).getTime(); return x >= _od && x < _do; };
  const radky = _jobs.map(j => {
    const c = (j.candidates || []).filter(k => _vObd(k.matched_at));
    return { id: j.id, title: j.title, stav: j.status, views: j.views || 0, zajemci: c.length, najato: c.filter(k => k.status === 'accepted').length };
  }).sort((a, b) => b.zajemci - a.zajemci || b.views - a.views);
  const sZobr = radky.reduce((a, r) => a + r.views, 0);
  const sZaj = radky.reduce((a, r) => a + r.zajemci, 0);
  const sNaj = radky.reduce((a, r) => a + r.najato, 0);
  const _pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : null;
  // Všechny zájmy v období (s inzerátem) — pro dny v týdnu a denní dobu
  const zajmy = [];
  _jobs.forEach(j => (j.candidates || []).forEach(k => { if (_vObd(k.matched_at)) zajmy.push({ t: new Date(k.matched_at), j }); }));
  const _PAL = ['#1B34F0', '#5C71FF', '#0FA968', '#F5920B', '#8B5CF6', '#E5484D'];
  // Dny v týdnu (Po–Ne); nejsilnější den zeleně
  const dnyT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(l => [l, 0]);
  zajmy.forEach(z => { dnyT[(z.t.getDay() + 6) % 7][1]++; });
  const maxDen = Math.max(...dnyT.map(d => d[1]));
  const dnyBars = dnyT.map(([l, v]) => [l, v, v && v === maxDen ? '#0FA968' : '#5C71FF']);
  // Denní doba
  // Hodinová okna (Yasin 28. 9.: čísla hodin místo „ráno/večer"); noc 0–6 h na konci
  const doby = [[6, 9], [9, 12], [12, 15], [15, 18], [18, 21], [21, 24], [0, 6]];
  const dobyV = doby.map(([a, b]) => [a + '–' + b, zajmy.filter(z => { const h = z.t.getHours(); return h >= a && h < b; }).length, a, b]);
  const maxDoba = Math.max(1, ...dobyV.map(d => d[1]));
  // Doba do prvního zájmu (zveřejnění inzerátu → první „Mám zájem") napříč inzeráty
  const prvni = _jobs.map(j => {
    const ts = (j.candidates || []).map(k => new Date(k.matched_at).getTime()).filter(x => !isNaN(x));
    const zac = new Date(j.created_at).getTime();
    return ts.length && !isNaN(zac) ? Math.max(0, Math.min(...ts) - zac) / 3600000 : null;
  }).filter(x => x != null);
  const prumPrvni = prvni.length ? prvni.reduce((a, x) => a + x, 0) / prvni.length : null;
  const _hodTxt = h => h < 1 ? Math.max(1, Math.round(h * 60)) + ' min' : h < 48 ? (Math.floor(h) + ' h' + (Math.round((h % 1) * 60) ? ' ' + Math.round((h % 1) * 60) + ' min' : '')) : Math.round(h / 24) + ' dní';
  const prvniBars = [['<1 h', 0, 1, '#0FA968'], ['1–6 h', 1, 6, '#0FA968'], ['6–24 h', 6, 24, '#5C71FF'], ['1–3 dny', 24, 72, '#5C71FF'], ['3+ dny', 72, 1e9, '#F5920B']]
    .map(([l, a, b, c]) => [l, prvni.filter(h => h >= a && h < b).length, c]);
  // Složení zájemců v období — každý člověk jednou, i když reagoval na víc inzerátů
  const lide = {};
  _jobs.forEach(j => (j.candidates || []).forEach(k => { if (_vObd(k.matched_at) && k.worker_id) lide[k.worker_id] = k; }));
  const lideA = Object.values(lide);
  const _vek = d => { const b = new Date(d); if (!d || isNaN(b)) return null; const n = new Date(); let v = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) v--; return v; };
  const vekBars = [['15–17', 15, 18, '#5C71FF'], ['18–21', 18, 22, '#1B34F0'], ['22–25', 22, 26, '#1B34F0'], ['26–30', 26, 31, '#5C71FF'], ['30+', 31, 200, '#5C71FF']]
    .map(([l, a, b, c]) => [l, lideA.filter(k => { const v = _vek(k.birth_date); return v != null && v >= a && v < b; }).length, c]);
  const vekZnamy = vekBars.reduce((a, b) => a + b[1], 0);
  // Vzdělání = první část pole education („Stupeň — Obor", viz _W_STUPNE v appce)
  const _stupen = e => { const t = String(e || '').split(' — ')[0]; return /^Základní/.test(t) ? 'Základní' : /výuční/.test(t) ? 'Vyučen/a' : /maturitou/.test(t) ? 'Maturita' : /VOŠ/.test(t) ? 'Vyšší odborné' : /^Vysokoškolské/.test(t) ? 'Vysoká škola' : null; };
  const vzdBars = ['Základní', 'Vyučen/a', 'Maturita', 'Vyšší odborné', 'Vysoká škola'].map((l, i) => [l, lideA.filter(k => _stupen(k.education) === l).length, _PAL[i % _PAL.length]]);
  const vzdZnamo = vzdBars.reduce((a, b) => a + b[1], 0);
  const obdobiTxt = _vlastni ? 'za vybrané období' : 'za ' + ({ '7d': '7 dní', '30d': '30 dní', '90d': '90 dní', rok: '12 měsíců' }[period] || '30 dní');

  // CSV: výkon inzerátů za období (skutečná data), jen v plných statistikách
  const exportCsv = () => {
    if (!_isPro()) { zamceno(); return; }
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const csv = ['Inzerát;Zobrazení;Zájemci;Najato;Zájem ze zobrazení (%)']
      .concat(radky.map(r => [q(r.title), r.views, r.zajemci, r.najato, _pct(r.zajemci, r.views) ?? ''].join(';'))).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'makej-statistiky.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const [hovered, setHovered] = React.useState(null);
  const [selected, setSelected] = React.useState([]);
  const [disp, setDisp] = React.useState({ ...(_AN_CR) });
  const [inseed, setInseed] = React.useState(0);
  const rafRef = React.useRef(null);

  const names = hovered ? [hovered] : selected;
  const label = names.length === 0 ? 'Celá ČR' : names.length === 1 ? _AN_NAMES[names[0]] : names.length + (names.length < 5 ? ' kraje' : ' krajů');
  const state = hovered ? 'náhled' : selected.length ? 'vybráno' : 'přehled';

  React.useEffect(() => {
    const from = disp;
    const to = _anAgg(hovered ? [hovered] : selected);
    const start = performance.now();
    const dur = 450, keys = ['users', 'jobs', 'rate', 'firms', 'fill'];
    function tick(now) {
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      const e = 1 - Math.pow(1 - t, 3);
      const next = {}; keys.forEach(k => next[k] = from[k] + (to[k] - from[k]) * e);
      setDisp(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line
  }, [hovered, selected.join(',')]);

  const ratio = disp.users / disp.jobs;
  const avg = _AN_CR.users / _AN_CR.jobs;
  const none = !hovered && !selected.length;
  const d = _anAgg(names);

  // Hover se čte průběžně z prvku pod kurzorem: nad obrysem kraje = jeho slug, jinak (prázdné místo v rámci mapy) = null → náhled zmizí přesně na hranici kraje.
  const onMap = e => { const s = (e.target && e.target.getAttribute && e.target.getAttribute('data-kraj')) || null; if (s !== hovered) setHovered(s); };
  const clickMap = e => { const s = e.target && e.target.getAttribute && e.target.getAttribute('data-kraj'); if (s) setSelected(p => p.includes(s) ? p.filter(x => x !== s) : p.concat(s)); };
  const inzerovat = () => { if (names.length === 1) { try { localStorage.setItem('makej-emp-jobdraft', JSON.stringify({ region: _AN_NAMES[names[0]] })); } catch (e) {} } onNew && onNew(); };
  const exportData = () => { if (window.empToast) window.empToast('Export dat', 'Data se připravují, přijdou vám e-mailem.', '', 'ok'); };
  const refresh = () => { setInseed(s => s + 1); if (window.empToast) window.empToast('Přepočítáno', 'Insighty jsou přepočítané z aktuálních dat.', '', 'ok'); };

  const mapKeys = Object.keys(KRAJE_PATHS);
  const rank = s => s === 'praha' ? 4 : s === hovered ? 3 : (selected.includes(s) || s === hovered) ? 2 : 1;
  const ordered = mapKeys.slice().sort((a, b) => rank(a) - rank(b) || mapKeys.indexOf(a) - mapKeys.indexOf(b));

  return (
    <div className="e-ram" style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '18px 20px 40px' }}>
      <style>{`
        @keyframes anKrajPulse { 0%,100% { stroke-opacity:1; } 50% { stroke-opacity:.5; } }
        @keyframes anTipIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:none; } }
        @keyframes anFadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .an-krj { transition: fill .2s ease, stroke .2s ease, stroke-width .2s ease, transform .25s ease, filter .25s ease; transform-box: fill-box; transform-origin: center; cursor: pointer; }
        .an-krj.on { transform: scale(1.02); filter: drop-shadow(0 0 5px rgba(27,52,240,.45)); }
        .an-krj.sel { animation: anKrajPulse 2s ease-in-out infinite; }
        .an-tip { animation: anTipIn .15s ease-out both; }
      `}</style>

      <div style={{ background: '#F1F3FB', border: '1px solid #DDE1F0', borderRadius: 22, overflow: 'hidden' }}>

        <ETabHlava title="Statistiky">
          <EPeriodPicker value={period} onChange={onPeriod} />
          <EBtnSek onClick={exportCsv}>{!_isPro() && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A82A6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>}Export dat (CSV)</EBtnSek>
        </ETabHlava>

        {/* Pás čísel tu není (Yasin 28. 9.): zobrazení, zájemci a najatí jsou
            na Dashboardu a v Inzerátech, tady by se jen opakovaly. */}

        {/* Grid, ne flex: v pevném rozvržení (index.html) má tahle část omezenou
            výšku a flex by karty s overflow:hidden smáčkl. */}
        <div style={{ padding: '22px 24px 26px', display: 'grid', gridAutoRows: 'max-content', alignContent: 'start', gap: 16 }}>

          {/* ── ZÁKLADNÍ STATISTIKY (všechny tarify, Yasin 28. 9.): kdo o vás
              má zájem (věk, vzdělání) a kdy reaguje. Vše ze skutečných profilů
              lidí, kteří v období dali „Mám zájem". ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
            <div style={_AN_CARD}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={_AN_H}>Věk</span>
                <span style={_AN_SUB}>Lidé, kteří o vás projevili zájem {obdobiTxt}</span>
              </div>
              {vekZnamy === 0
                ? <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 14, color: '#7A82A6' }}>Zatím tu nikdo není.</div>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, alignItems: 'end', height: 170, marginTop: 18 }}><_AnBars data={vekBars} height={120} /></div>}
            </div>
            <div style={_AN_CARD}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={_AN_H}>Vzdělání</span>
                <span style={_AN_SUB}>Nejvyšší dosažené, jak si ho lidé vyplnili v profilu</span>
              </div>
              {vzdZnamo === 0
                ? <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 14, color: '#7A82A6' }}>Zatím to nikdo z vašich zájemců nevyplnil.</div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
                    {vzdBars.map(([n, v, c]) => (
                      <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#3A4266' }}>{n}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0B1233' }}>{Math.round(v / vzdZnamo * 100)} %</span>
                        </div>
                        <span style={{ display: 'block', height: 7, borderRadius: 999, background: '#F1F3FB', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: (v / vzdZnamo * 100) + '%', background: c, borderRadius: 999 }} /></span>
                      </div>
                    ))}
                  </div>}
            </div>
          </div>

            <div style={_AN_CARD}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
                <span style={_AN_H}>Kdy lidé reagují</span>
                <span style={_AN_SUB}>{maxDen ? 'Nejvíc zájmu přichází ' + ({ Po: 'v pondělí', Út: 'v úterý', St: 've středu', Čt: 've čtvrtek', Pá: 'v pátek', So: 'v sobotu', Ne: 'v neděli' })[dnyT.find(d => d[1] === maxDen)[0]] + ' — hodí se tehdy inzerát zveřejnit nebo topovat' : 'Dny v týdnu a denní doba, kdy chodí „Mám zájem"'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 28, alignItems: 'center' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, alignItems: 'end', height: 150 }}><_AnBars data={dnyBars} height={95} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderLeft: '1px solid #F0F2FA', paddingLeft: 24 }}>
                {dobyV.map(([l, v, od, doo]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Časy jako na hodinkách (06:00–09:00) — všechny stejně dlouhé,
                        se stejně širokými číslicemi, takže stojí přesně pod sebou */}
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#3A4266', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flex: 'none' }}>{String(od).padStart(2, '0')}:00–{String(doo).padStart(2, '0')}:00</span>
                    <span style={{ flex: 1, height: 7, borderRadius: 999, background: '#F1F3FB', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: (v / maxDoba * 100) + '%', background: v === maxDoba && v ? '#F5920B' : '#C7D0FF', borderRadius: 999 }} /></span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0B1233', width: 24, textAlign: 'right', flex: 'none' }}>{v}</span>
                  </div>
                ))}
              </div>
              </div>
            </div>

          {/* ── PLNÉ STATISTIKY (od Dynamického; u nižších tarifů rozmazané) ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <span style={{ fontSize: 19, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em' }}>Plné statistiky</span>
            {!_isPro() && <span onClick={zamceno} style={{ fontSize: 12, fontWeight: 700, color: '#1B34F0', background: '#EEF1FF', padding: '4px 10px', borderRadius: 999, cursor: 'pointer' }}>od tarifu Dynamický</span>}
          </div>

          {/* Mapa + panel kraje */}
          <EPlnaSekce onZamceno={zamceno}>
          <div style={_AN_CARD}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 16 }}>
              <span style={_AN_H}>Vyberte kraj a uvidíte, jak vypadá trh práce</span>
              {selected.length > 0 && <span onClick={() => setSelected([])} style={{ fontSize: 12, fontWeight: 800, color: '#3A4266', background: '#fff', border: '1px solid #E6E9F5', padding: '8px 13px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>✕ Zpět na celou ČR</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 372px', gap: 22, alignItems: 'stretch' }}>
              <div style={{ background: '#FBFCFE', border: '1px solid #F0F2FA', borderRadius: 14, padding: '10px 12px 4px', position: 'relative' }}>
                <svg viewBox={KRAJE_VIEWBOX} onMouseMove={onMap} onMouseLeave={() => setHovered(null)} onClick={clickMap} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                  {ordered.map(s => {
                    const on = selected.includes(s) || hovered === s;
                    return <path key={s} data-kraj={s} d={KRAJE_PATHS[s]} className={'an-krj' + (on ? ' on' : '') + (selected.includes(s) ? ' sel' : '')} fill={on ? '#fff' : _anShade(_AN_REG[s].users / _AN_MAXU)} stroke={on ? '#8AB4FF' : '#fff'} strokeWidth={on ? 0.9 : 0.5} strokeLinejoin="round" />;
                  })}
                </svg>
                <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none' }}>
                  {names.map(s => <span key={s} className="an-tip" style={{ background: 'rgba(11,18,51,.88)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}>{_AN_NAMES[s]}</span>)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em' }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 999, color: state === 'vybráno' ? '#fff' : '#7A82A6', background: state === 'vybráno' ? '#0B1233' : '#F1F3FB' }}>{state}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Brigádníků', _anNf(disp.users)], ['Příležitostí', _anNf(disp.jobs)], ['Medián hodinovky', Math.round(disp.rate) + ' Kč'], ['Firem na Makej', _anNf(disp.firms)]].map((t, i) => (
                    <div key={i} style={{ background: '#F6F7FC', borderRadius: 12, padding: '12px 13px' }}>
                      <div style={{ ...(_AN_SUB), fontSize: 11, fontWeight: 700 }}>{t[0]}</div>
                      <div style={{ ..._AN_NUM, marginTop: 5 }}>{t[1]}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                    <span style={_AN_LBL}>Poptávka po směnách</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0B1233' }}>{_anDec(ratio)} zájemce na místo</span>
                  </div>
                  <span style={{ display: 'block', height: 8, borderRadius: 999, background: '#EEF1FF', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: Math.min(100, ratio / 12 * 100) + '%', borderRadius: 999, background: none ? '#1B34F0' : ratio >= avg ? '#0FA968' : '#F5920B' }} /></span>
                  <span style={{ ...(_AN_SUB), fontSize: 11 }}>{none ? 'Průměr trhu je ' + _anDec(avg) + ' — nad průměrem obsadíte směnu rychleji.' : ratio >= avg ? 'Nad průměrem trhu (' + _anDec(avg) + ') — směnu obsadíte rychleji než jinde.' : 'Pod průměrem trhu (' + _anDec(avg) + ') — počítejte s delším náborem nebo vyšší sazbou.'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <span style={_AN_LBL}>Nejžádanější obory</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {d.fields.map(([l, p], i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#3A4266', width: 150, flex: 'none' }}>{l}</span>
                        <span style={{ flex: 1, height: 6, borderRadius: 999, background: '#EEF1FF', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: Math.min(100, p * 2.2) + '%', background: '#5C71FF', borderRadius: 999 }} /></span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0B1233', width: 32, textAlign: 'right', flex: 'none' }}>{p} %</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#F6F7FC', borderRadius: 12, padding: '12px 13px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ ...(_AN_SUB), fontSize: 11, fontWeight: 700 }}>Průměrná doba obsazení směny</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0B1233' }}>{_anDec(disp.fill)} dne</span>
                  </div>
                  <span onClick={inzerovat} style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: '#1B34F0', padding: '9px 14px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>Inzerovat zde</span>
                </div>
              </div>
            </div>
          </div>

          </EPlnaSekce>

          {/* Srovnání kanálů (na plnou šířku) */}
          <EPlnaSekce onZamceno={zamceno}>
          <div style={_AN_CARD}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 16 }}>
              <span style={_AN_H}>Srovnání kanálů</span>
              <span style={_AN_SUB}>Odkud chodí nejvíc lidí a co reálně obsazuje směny</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {_AN_CHANNELS.map(([n, color, views, hired, ctr], i) => {
                const maxV = Math.max.apply(null, _AN_CHANNELS.map(c => c[2]));
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#0B1233' }}><span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />{n}</span>
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                        <span style={{ ..._AN_SUB, fontSize: 12 }}>{_anNf(views)} zhlédnutí</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0B7B4B' }}>{hired} najato</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0B1233', width: 54, textAlign: 'right', whiteSpace: 'nowrap' }}>{ctr.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} %</span>
                      </span>
                    </div>
                    <span style={{ display: 'block', height: 7, borderRadius: 999, background: '#F1F3FB', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: views / maxV * 100 + '%', background: color, borderRadius: 999 }} /></span>
                  </div>
                );
              })}
            </div>
          </div>

          </EPlnaSekce>

          {/* Insighty */}
          <EPlnaSekce onZamceno={zamceno}>
          <div style={_AN_CARD}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={_AN_H}>Co z vašich dat vyplývá</span>
                <span style={_AN_SUB}>Generováno automaticky · obnoveno před 4 hodinami</span>
              </div>
              <span onClick={refresh} style={{ fontSize: 12, fontWeight: 700, color: '#3A4266', background: '#fff', border: '1px solid #E6E9F5', padding: '8px 13px', borderRadius: 9, cursor: 'pointer', flex: 'none' }}>Přepočítat</span>
            </div>
            <div key={inseed} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {_AN_INSIGHTS.map(([tag, color, bg, text], i) => (
                <div key={i} style={{ background: '#FBFCFE', border: '1px solid #F0F2FA', borderRadius: 14, padding: '15px 16px', display: 'flex', flexDirection: 'column', gap: 9, animation: 'anFadeUp .3s ease both', animationDelay: (i * 0.04).toFixed(2) + 's' }}>
                  <span style={{ alignSelf: 'flex-start', fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color, background: bg, padding: '5px 10px', borderRadius: 999 }}>{tag}</span>
                  <span style={{ fontSize: 13, color: '#3A4266', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          </EPlnaSekce>

          {/* Doba odpovědi + Hodinovka */}
          <EPlnaSekce onZamceno={zamceno}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
            <div style={_AN_CARD}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 18 }}>
                <span style={_AN_H}>Doba odpovědi firmy</span>
                <span style={_AN_SUB}>Kandidáti s odpovědí do 1 h matchují 3,8× častěji</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10, alignItems: 'end', height: 190 }}><_AnBars data={_AN_REPLY} height={120} /></div>
              <div style={{ borderTop: '1px solid #F0F2FA', marginTop: 16, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ ..._AN_SUB, fontSize: 12 }}>Váš průměr: <b style={{ color: '#0B1233' }}>1 h 13 min</b> · 394 vyhodnocených kandidátů</span>
                <span style={{ ..._AN_SUB, fontSize: 11 }}>„Bez odezvy" = firma na kandidáta nereagovala do 7 dní od jeho swipu.</span>
              </div>
            </div>
            <div style={_AN_CARD}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
                <span style={_AN_H}>Průměrná hodinovka brigádníků</span>
                <span style={_AN_SUB}>Napříč trhem · aktualizováno 1. 4. 2026</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E6F7EF', borderRadius: 999, padding: '7px 12px', alignSelf: 'flex-start', marginBottom: 16 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0FA968' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0B7B4B' }}>Platíte více než 78 % firem na Makej</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10, alignItems: 'end', height: 160 }}><_AnBars data={_AN_WAGE} height={100} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, borderTop: '1px solid #F0F2FA', marginTop: 16, paddingTop: 14 }}>
                <div><div style={_AN_LBL}>Medián trhu</div><div style={{ ..._AN_NUM, marginTop: 5 }}>170 <span style={{ fontSize: 13, color: '#7A82A6' }}>Kč</span></div></div>
                <div><div style={{ ..._AN_LBL, color: '#0FA968' }}>Vy</div><div style={{ ..._AN_NUM, marginTop: 5, color: '#0B7B4B' }}>200 <span style={{ fontSize: 13, color: '#7A82A6' }}>Kč</span></div></div>
                <div><div style={_AN_LBL}>Top 10 %</div><div style={{ ..._AN_NUM, marginTop: 5 }}>220+ <span style={{ fontSize: 13, color: '#7A82A6' }}>Kč</span></div></div>
              </div>
              <div style={{ ..._AN_SUB, fontSize: 11, marginTop: 12 }}>Orientační odhad na základě interní distribuce mezd na platformě. Nemusí odpovídat aktuální situaci na trhu.</div>
            </div>
          </div>

          </EPlnaSekce>

          {/* Doba do prvního zájmu (skutečná, z časů zveřejnění a zájmu) + Retence */}
          <EPlnaSekce onZamceno={zamceno}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
            <div style={_AN_CARD}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
                <span style={_AN_H}>Doba do prvního zájmu</span>
                <span style={_AN_SUB}>Jak rychle si lidé všimnou nového inzerátu</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={_AN_LBL}>Průměrně</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#0B1233', letterSpacing: '-.03em', lineHeight: 1, marginTop: 6 }}>{prumPrvni == null ? '—' : _hodTxt(prumPrvni)}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, alignItems: 'end', height: 140 }}><_AnBars data={prvniBars} height={85} /></div>
              <div style={{ ..._AN_SUB, fontSize: 11, borderTop: '1px solid #F0F2FA', marginTop: 14, paddingTop: 10 }}>{prvni.length ? 'Napříč ' + prvni.length + ' ' + (prvni.length === 1 ? 'inzerátem' : 'inzeráty') + ', na které někdo reagoval' : 'Zatím žádný inzerát nemá zájemce'}</div>
            </div>
            <div style={{ ..._AN_CARD, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 16 }}>
                <span style={_AN_H}>Retence kandidátů</span>
                <span style={_AN_SUB}>Kolik lidí se k vám vrací</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 6 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: '#1B34F0', letterSpacing: '-.03em', lineHeight: 1 }}>45 %</span>
                <span style={{ ..._AN_SUB, fontSize: 13, paddingBottom: 4 }}>5 z 11 najatých kandidátů<br />u vás pracovalo opakovaně</span>
              </div>
              <div style={{ ..._AN_LBL, margin: '14px 0 9px' }}>Nejvěrnější kandidáti</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {_AN_LOYAL.map(([n, k], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#F6F7FC', borderRadius: 10, padding: '11px 13px' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1233' }}>{n}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#1B34F0' }}>{k}× brigáda</span>
                  </div>
                ))}
              </div>
              <div style={{ ..._AN_SUB, fontSize: 11, borderTop: '1px solid #F0F2FA', marginTop: 'auto', paddingTop: 12 }}>Počítáno za celou historii firmy napříč všemi inzeráty, nezávisle na zvoleném období.</div>
            </div>
          </div>

          </EPlnaSekce>

          <div style={{ ..._AN_SUB, fontSize: 11, padding: '0 2px' }}>Krajská data jsou ukázková — v produkci je dodá agregace z profilů a inzerátů. Ostatní metriky vychází z vašeho účtu za zvolené období.</div>
        </div>
      </div>
      {plneOkno && <EPlneOkno onClose={() => setPlneOkno(false)} />}
    </div>
  );
}

Object.assign(window, { EAnalytics, ECalendar, EPlnaSekce, EPlneOkno });
