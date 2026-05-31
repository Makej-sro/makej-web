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

function _isPro() {
  const plan = (EPROFILE.plan || '').toLowerCase();
  if (['pro', 'business', 'premium'].includes(plan)) return true;
  const until = EPROFILE.premium_until || EPROFILE.plan_expires_at;
  if (until && new Date(until) > new Date()) return true;
  return false;
}

function ProGate({ feature, children }) {
  if (_isPro()) return children;
  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      {/* Rozmazaný náhled obsahu */}
      <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.55 }}>
        {children}
      </div>

      {/* Overlay s CTA */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(180deg, rgba(7,7,26,0.15) 0%, rgba(7,7,26,0.75) 40%, rgba(7,7,26,0.85) 100%)',
      }}>
        <div style={{
          textAlign: 'center', maxWidth: 460, padding: '36px 32px',
          background: 'rgba(16,16,48,0.92)',
          border: '1px solid rgba(255,209,102,0.2)',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,209,102,0.08)',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Ikona */}
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(255,209,102,0.18), rgba(255,209,102,0.06))',
            border: '1px solid rgba(255,209,102,0.35)',
            display: 'grid', placeItems: 'center', margin: '0 auto 20px',
          }}>
            <Icon name="crown-star-bold" size={32} color="#FFD166" />
          </div>

          {/* Titulek */}
          <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', fontFamily: T.fontHead, marginBottom: 8, lineHeight: 1.25 }}>
            {feature || 'Tato sekce'} je dostupná v tarifu Pro
          </div>

          {/* Popis */}
          <div style={{ fontSize: 13, color: T.muted, fontFamily: T.fontUI, lineHeight: 1.7, marginBottom: 24 }}>
            Odemkněte <strong style={{ color: '#d0d0ff' }}>pokročilé reporty</strong>,{' '}
            demografii kandidátů, analýzu nákladů na nábor a retenci brigádníků.
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 26, textAlign: 'left' }}>
            {[
              'Cohort analýza a konverzní funnel',
              'Demografické přehledy kandidátů',
              'Cost per hire vs. průměr trhu',
              'Retence brigádníků + AI insights',
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: T.light, fontFamily: T.fontUI }}>
                <Icon name="check-circle-bold" size={14} color="#FFD166" />
                {f}
              </div>
            ))}
          </div>

          {/* CTA tlačítko */}
          <button style={{
            width: '100%', padding: '13px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #292978, #3a3a99)',
            border: '1px solid rgba(91,107,255,0.4)',
            color: '#fff', fontFamily: T.fontUI, fontSize: 15, fontWeight: 800,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 24px rgba(41,41,120,0.55)',
            transition: 'opacity .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Icon name="crown-star-bold" size={16} color="#FFD166" />
            Upgradovat na Pro
          </button>

          <div style={{ marginTop: 12, fontSize: 12, color: T.mutedSoft, fontFamily: T.fontUI }}>
            Otázky? <a href="mailto:support@makej.eu" style={{ color: '#8AB4FF', textDecoration: 'none' }}>support@makej.eu</a>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYTIKA — 4 sub-sekce: Přehled / Demografie / Náklady / Retence
// ─────────────────────────────────────────────────────────────
function EAnalytics() {
  const [seg, setSeg] = useStateE('overview');
  const segs = [
    { k: 'overview', l: 'Přehled' },
    { k: 'demo', l: 'Demografie' },
    { k: 'cost', l: 'Náklady' },
    { k: 'retention', l: 'Retence' },
  ];

  return (
    <ProGate feature="Analytika">
      <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid ' + T.border, alignSelf: 'flex-start' }}>
          {segs.map(s => (
            <button key={s.k} onClick={() => setSeg(s.k)} style={{
              padding: '8px 16px', borderRadius: 8,
              background: seg === s.k ? 'rgba(91,107,255,0.22)' : 'transparent',
              border: 'none', color: seg === s.k ? '#fff' : T.muted,
              fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}>{s.l}</button>
          ))}
        </div>

        {seg === 'overview' && <AnalyticsOverview />}
        {seg === 'demo' && <AnalyticsDemo />}
        {seg === 'cost' && <AnalyticsCost />}
        {seg === 'retention' && <AnalyticsRetention />}
      </div>
    </ProGate>
  );
}

// ── Přehled ──────────────────────────────────────────────────
function AnalyticsOverview() {
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                      {c.l}
                    </span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                      <span style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10.5 }}>{c.views.toLocaleString('cs-CZ').replace(/,/g,' ')} views</span>
                      <span style={{ color: '#5BD68A', fontFamily: T.fontMono, fontSize: 11.5, fontWeight: 700 }}>{c.hires} najato</span>
                      <span style={{ color: '#fff', fontFamily: T.fontMono, fontSize: 11.5, fontWeight: 700, minWidth: 44, textAlign: 'right' }}>{conv}%</span>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
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
            <div key={i} style={{ padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: x.c + '22', border: '1px solid ' + x.c + '44', display: 'grid', placeItems: 'center' }}>
                  <Icon name={x.i} size={13} color={x.c}/>
                </div>
                <span style={{ color: x.c, fontSize: 10, fontWeight: 800, fontFamily: T.fontUI, letterSpacing: 0.7, textTransform: 'uppercase' }}>{x.tag}</span>
              </div>
              <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 12, lineHeight: 1.5 }}>{x.t}</div>
            </div>
          ))}
        </div>
      </ECard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ECard>
          <SectionHeader title="Doba odpovědi" subtitle="Kandidáti s odpovědí do 1h matchují 3.4× častěji" />
          <BarChart
            width={460} height={200}
            data={[
              { l: '<5 min', v: 142, color: '#5BD68A' },
              { l: '5-30m', v: 98, color: '#5BD68A' },
              { l: '30-1h', v: 64, color: '#FFD166' },
              { l: '1-3h', v: 41, color: '#FFD166' },
              { l: '3-12h', v: 22, color: '#f43f5e' },
              { l: '>12h', v: 8, color: '#f43f5e' },
            ]}
          />
          <div style={{ marginTop: 8, color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 11 }}>
            Váš průměr: <span style={{ color: '#fff', fontFamily: T.fontMono, fontWeight: 700 }}>14 minut</span> · Top 5 % v segmentu
          </div>
        </ECard>
        <ECard>
          <SectionHeader title="Distribuce hodinovky v segmentu" subtitle="Brno · gastro · poslední 30 dní" />
          <DistroChart />
        </ECard>
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
        <tr style={{ color: T.mutedSoft, fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Týden nástupu</th>
          <th style={{ textAlign: 'right', padding: '4px 8px' }}>Vel.</th>
          {['T0','T+1','T+2','T+3','T+4','T+5'].map(h => <th key={h} style={{ padding: '4px 6px', textAlign: 'center' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {cohorts.map((c, i) => (
          <tr key={i}>
            <td style={{ color: T.light, padding: '6px 8px', fontWeight: 600 }}>{c.week}</td>
            <td style={{ color: T.muted, fontFamily: T.fontMono, padding: '6px 8px', textAlign: 'right' }}>{c.size}</td>
            {[0,1,2,3,4,5].map(j => {
              const v = c.vals[j];
              if (v == null) return <td key={j} style={{ padding: 0 }}><div style={{ height: 26, borderRadius: 5, background: 'rgba(255,255,255,0.02)' }}/></td>;
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

function DistroChart() {
  const buckets = [
    { l: '120', v: 8 },
    { l: '140', v: 24 },
    { l: '160', v: 41 },
    { l: '180', v: 35 }, // YOU
    { l: '200', v: 18 },
    { l: '220', v: 7 },
    { l: '240+', v: 3 },
  ];
  const max = Math.max(...buckets.map(b => b.v));
  const W = 460, H = 180, padL = 28, padB = 28, padT = 8;
  const innerW = W - padL - 8, innerH = H - padT - padB;
  const bw = (innerW / buckets.length) * 0.7;
  const gap = (innerW / buckets.length) * 0.3;
  return (
    <div>
      <svg width={W} height={H} style={{ display: 'block' }}>
        {buckets.map((b, i) => {
          const h = (b.v / max) * innerH;
          const x = padL + i * (bw + gap) + gap / 2;
          const y = padT + innerH - h;
          const isYou = b.l === '180';
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={h} rx="4" fill={isYou ? '#FFD166' : '#5B6BFF'} opacity={isYou ? 1 : 0.6} />
              {isYou && <text x={x + bw/2} y={y - 8} textAnchor="middle" fill="#FFD166" fontFamily={T.fontUI} fontSize="9.5" fontWeight="800">VY</text>}
              <text x={x + bw/2} y={H - 12} textAnchor="middle" fill={T.mutedSoft} fontFamily={T.fontMono} fontSize="9.5">{b.l}</text>
            </g>
          );
        })}
        <text x={padL} y={H - 2} fill={T.mutedSoft} fontFamily={T.fontUI} fontSize="9">Kč/h</text>
      </svg>
      <div style={{ display: 'flex', gap: 20, marginTop: 6, fontFamily: T.fontMono, fontSize: 11 }}>
        <div><span style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Medián segmentu</span><div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>162 Kč</div></div>
        <div><span style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vy</span><div style={{ color: '#FFD166', fontWeight: 700, fontSize: 14 }}>180 Kč</div></div>
        <div><span style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Top 10 %</span><div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>220+ Kč</div></div>
      </div>
    </div>
  );
}

// ── Demografie ────────────────────────────────────────────────
function AnalyticsDemo() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <ECard>
          <SectionHeader title="Věk" />
          <BarChart width={300} height={200} data={[
            { l: '15-17', v: 22 }, { l: '18-21', v: 87 }, { l: '22-25', v: 68 }, { l: '26-30', v: 31 }, { l: '30+', v: 14 },
          ]} color="#0020F6" />
        </ECard>
        <ECard>
          <SectionHeader title="Pohlaví" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
                    <span style={{ color: T.light, flex: 1 }}>{x.l}</span>
                    <span style={{ color: '#fff', fontFamily: T.fontMono, fontWeight: 700 }}>{x.v}</span>
                  </div>
                  <div style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, marginLeft: 14 }}>{x.n} kandidátů</div>
                </div>
              ))}
            </div>
          </div>
        </ECard>
        <ECard>
          <SectionHeader title="Zaměstnanecký status" />
          {[
            { l: 'Středoškolák', v: 38, c: '#0020F6' },
            { l: 'Vysokoškolák', v: 42, c: '#5B6BFF' },
            { l: 'Pracující na vedlejšák', v: 14, c: '#FFD166' },
            { l: 'Bez práce', v: 6, c: '#E0B0FF' },
          ].map((x, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontFamily: T.fontUI, marginBottom: 4 }}>
                <span style={{ color: T.light }}>{x.l}</span>
                <span style={{ color: '#fff', fontFamily: T.fontMono, fontWeight: 700 }}>{x.v} %</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.3)' }}>
                <div style={{ height: '100%', width: x.v + '%', borderRadius: 3, background: x.c }} />
              </div>
            </div>
          ))}
        </ECard>
      </div>
      <ECard>
        <SectionHeader title="Mapa kandidátů — Brno" subtitle="Hustota podle čtvrti" />
        <BrnoMap />
      </ECard>
    </>
  );
}

function BrnoMap() {
  const dots = [
    { x: 50, y: 50, r: 28, l: 'Brno-střed', n: 89 },
    { x: 35, y: 38, r: 22, l: 'Veveří', n: 64 },
    { x: 58, y: 28, r: 18, l: 'Královo Pole', n: 41 },
    { x: 28, y: 55, r: 15, l: 'Žabovřesky', n: 28 },
    { x: 78, y: 60, r: 14, l: 'Líšeň', n: 22 },
    { x: 70, y: 75, r: 11, l: 'Jih', n: 12 },
    { x: 22, y: 70, r: 10, l: 'Bohunice', n: 9 },
    { x: 45, y: 78, r: 9, l: 'Komárov', n: 8 },
    { x: 80, y: 38, r: 12, l: 'Maloměřice', n: 14 },
  ];
  return (
    <div style={{ position: 'relative', width: '100%', height: 360, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,32,246,0.08), rgba(15,15,40,0.6))', border: '1px solid ' + T.border, overflow: 'hidden' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {Array.from({length: 12}, (_, i) => <line key={'h'+i} x1="0" y1={i*8.3} x2="100" y2={i*8.3} stroke="rgba(91,107,255,0.06)" strokeWidth="0.1" />)}
        {Array.from({length: 12}, (_, i) => <line key={'v'+i} x1={i*8.3} y1="0" x2={i*8.3} y2="100" stroke="rgba(91,107,255,0.06)" strokeWidth="0.1" />)}
        <path d="M 5 80 C 20 65, 40 55, 50 60 S 75 75, 95 70" stroke="rgba(91,107,255,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
      {dots.map((d, i) => (
        <div key={i} style={{ position: 'absolute', left: d.x + '%', top: d.y + '%', transform: 'translate(-50%,-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: d.r * 2, height: d.r * 2, borderRadius: 999, background: 'radial-gradient(circle, rgba(0,32,246,0.5), rgba(0,32,246,0.05))', border: '1px solid rgba(91,107,255,0.5)' }} />
          <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ color: '#fff', fontFamily: T.fontMono, fontSize: 13, fontWeight: 700 }}>{d.n}</div>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 9.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{d.l}</div>
          </div>
        </div>
      ))}
      <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '6px 10px', borderRadius: 8, background: 'rgba(7,7,26,0.7)', border: '1px solid ' + T.border, color: T.muted, fontSize: 10.5, fontFamily: T.fontUI }}>
        <Icon name="point-on-map-bold" size={11} color={T.super}/> 287 kandidátů v okolí 5 km
      </div>
    </div>
  );
}

// ── Náklady ───────────────────────────────────────────────────
function AnalyticsCost() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Cost per hire', v: '480 Kč', sub: '↓ 8 % vs. min. měsíc', c: '#5BD68A' },
          { l: 'Marketing výdaje', v: '12 480 Kč', sub: 'Boost + Premium', c: '#5B6BFF' },
          { l: 'ROI Premium tarifu', v: '+ 280 %', sub: '14 200 Kč ušetřeno', c: '#FFD166' },
          { l: 'Cost per match', v: '40 Kč', sub: 'medián segmentu 64 Kč', c: '#5BD68A' },
        ].map((x, i) => (
          <ECard key={i} padding={16}>
            <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.4, textTransform: 'uppercase' }}>{x.l}</div>
            <div style={{ color: '#fff', fontFamily: T.fontMono, fontSize: 26, fontWeight: 700, marginTop: 6, letterSpacing: -0.8 }}>{x.v}</div>
            <div style={{ color: x.c, fontSize: 11.5, fontFamily: T.fontUI, marginTop: 4, fontWeight: 600 }}>{x.sub}</div>
          </ECard>
        ))}
      </div>
      <ECard>
        <SectionHeader title="Náklady na nábor v čase" subtitle="Cost per hire vs. trh" />
        <AreaChart
          width={1200} height={240}
          labels={['Led','Úno','Bře','Dub','Kvě','Čer','Čec','Srp','Zář','Říj','Lis','Pro']}
          series={[
            { color: '#0020F6', data: [780, 720, 690, 640, 600, 580, 560, 540, 520, 510, 495, 480] },
            { color: '#6e6ea8', data: [820, 810, 790, 770, 760, 740, 720, 710, 700, 690, 685, 680] },
          ]}
        />
        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#0020F6' }} /><span style={{ fontSize: 11.5, color: T.light, fontFamily: T.fontUI }}>Vy</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#6e6ea8' }} /><span style={{ fontSize: 11.5, color: T.muted, fontFamily: T.fontUI }}>Průměr trhu</span></div>
        </div>
      </ECard>
    </>
  );
}

// ── Retence ───────────────────────────────────────────────────
function AnalyticsRetention() {
  return (
    <ECard>
      <SectionHeader title="Retence brigádníků" subtitle="Kolik zůstává po 30 / 60 / 90 dnech" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { d: 30, v: 84, c: '#5BD68A' },
          { d: 60, v: 67, c: '#FFD166' },
          { d: 90, v: 52, c: '#5B6BFF' },
        ].map((x, i) => (
          <div key={i} style={{ padding: 18, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid ' + T.border, textAlign: 'center' }}>
            <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.5, textTransform: 'uppercase' }}>{x.d} dní</div>
            <div style={{ color: x.c, fontFamily: T.fontMono, fontSize: 38, fontWeight: 700, marginTop: 8, letterSpacing: -1.5 }}>{x.v}%</div>
            <div style={{ color: T.mutedSoft, fontSize: 11, fontFamily: T.fontUI, marginTop: 4 }}>průměr segmentu {x.v - 14}%</div>
          </div>
        ))}
      </div>
      <SectionHeader title="Důvody odchodu" />
      {[
        { l: 'Dokončili semestr / školu', v: 32 },
        { l: 'Lepší nabídka jinde', v: 24 },
        { l: 'Změna životní situace', v: 18 },
        { l: 'Nespokojenost s rozvrhem', v: 14 },
        { l: 'Jiné', v: 12 },
      ].map((x, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: T.fontUI, marginBottom: 4 }}>
            <span style={{ color: T.light }}>{x.l}</span>
            <span style={{ color: '#fff', fontFamily: T.fontMono, fontWeight: 700 }}>{x.v} %</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ height: '100%', width: (x.v * 3) + '%', borderRadius: 3, background: 'linear-gradient(90deg, #5B6BFF, #0020F6)' }} />
          </div>
        </div>
      ))}
    </ECard>
  );
}

// ─────────────────────────────────────────────────────────────
// PLÁN SMĚN — reálný kalendář z Supabase dat (E_JOBS)
// ─────────────────────────────────────────────────────────────

function ECalendar() {
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

  // Pole dnů pro grid (null = prázdná buňka před 1. v měsíci)
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Po = 0
  const calDays = [];
  for (let i = 0; i < firstWeekday; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

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
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

      {/* KPI čísla */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { l: 'Brigády ' + MONTH_NAMES[viewMonth], v: monthJobs.length || '—', sub: 'inzerátů s datem v tomto měsíci', c: '#FFD166' },
          { l: 'Otevřené',    v: open     || '—', sub: 'potřebují brigádníky',  c: '#f43f5e' },
          { l: 'Naplněno',   v: filled    || '—', sub: 'brigád s obsazenou rolí', c: '#5BD68A' },
          { l: 'Najato',     v: totalHired || '—', sub: 'přijatých brigádníků',  c: '#5B6BFF' },
        ].map((x, i) => (
          <ECard key={i} padding={16}>
            <div style={{ color: T.muted, fontSize: 11, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.4, textTransform: 'uppercase' }}>{x.l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <div style={{ color: x.c, fontFamily: T.fontMono, fontSize: 24, fontWeight: 700, letterSpacing: -0.6 }}>{x.v}</div>
            </div>
            <div style={{ color: T.mutedSoft, fontSize: 11, fontFamily: T.fontUI, marginTop: 2 }}>{x.sub}</div>
          </ECard>
        ))}
      </div>

      {/* Kalendář */}
      <ECard padding={0} style={{ overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid ' + T.border }}>
          <button onClick={prevMonth} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, color: T.light, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <Icon name="alt-arrow-left-line-duotone" size={14} color={T.light}/>
          </button>
          <div style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, color: '#fff', minWidth: 160 }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </div>
          <button onClick={nextMonth} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, color: T.light, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <Icon name="alt-arrow-right-line-duotone" size={14} color={T.light}/>
          </button>
          <div style={{ flex: 1 }} />
          {/* Legenda */}
          <div style={{ display: 'flex', gap: 14, fontSize: 11, fontFamily: T.fontUI }}>
            {[['#5BD68A','Naplněno'],['#8AB4FF','Aktivní'],['#f43f5e','ASAP']].map(([c,l]) => (
              <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c }}/>
                <span style={{ color: T.light }}>{l}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Názvy dní */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid ' + T.border }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ padding: '8px 12px', fontSize: 10.5, fontFamily: T.fontUI, fontWeight: 700, color: T.mutedSoft, letterSpacing: 0.6, textTransform: 'uppercase', textAlign: i >= 5 ? 'center' : 'left', background: i >= 5 ? 'rgba(0,0,0,0.2)' : 'transparent' }}>{d}</div>
          ))}
        </div>

        {/* Buňky */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {calDays.map((d, i) => {
            const dayJobs   = d ? (byDay[d] || []) : [];
            const isWeekend = (i % 7) >= 5;
            const isToday   = isCurrentMonth && d === today;
            return (
              <div key={i} style={{
                minHeight: 100, padding: 8,
                borderRight:  (i % 7 < 6) ? '1px solid ' + T.border : 'none',
                borderBottom: '1px solid ' + T.border,
                background:   isWeekend ? 'rgba(0,0,0,0.15)' : 'transparent',
                opacity:      d ? 1 : 0.25,
              }}>
                {d && (
                  <>
                    <div style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center', background: isToday ? T.primary : 'transparent', color: isToday ? '#fff' : T.light, fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{d}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {dayJobs.map((job, j) => {
                        const c = jobColor(job);
                        return (
                          <div key={j} style={{ padding: '3px 6px', borderRadius: 5, background: c + '22', borderLeft: '2px solid ' + c }}>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 10.5, fontFamily: T.fontUI, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                            {(job.time_start || job.time_end) && (
                              <div style={{ color: T.muted, fontFamily: T.fontMono, fontSize: 9.5 }}>
                                {[job.time_start, job.time_end].filter(Boolean).join('–')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
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
                <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < openJobs.length - 1 ? '1px solid ' + T.border : 'none' }}>
                  <div style={{ textAlign: 'center', width: 44, flexShrink: 0 }}>
                    <div style={{ color: c, fontFamily: T.fontMono, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{d ? d.getDate() : '—'}</div>
                    <div style={{ color: T.muted, fontSize: 10, fontFamily: T.fontUI }}>{dayName}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</div>
                    {(j.time_start || j.time_end || j.location) && (
                      <div style={{ color: T.muted, fontFamily: T.fontMono, fontSize: 10.5, marginTop: 2 }}>
                        {[j.time_start && j.time_end ? j.time_start + '–' + j.time_end : j.time_start, j.location].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: (j.hired || 0) > 0 ? '#FFD166' : '#f43f5e', fontFamily: T.fontMono, fontSize: 13, fontWeight: 700 }}>
                      {j.hired || 0} najato
                    </div>
                    {j.matches > 0 && (
                      <div style={{ color: T.mutedSoft, fontSize: 10, fontFamily: T.fontUI }}>{j.matches} zájemců</div>
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
        <div style={{ textAlign: 'center', padding: '40px 20px', color: T.muted, fontFamily: T.fontUI }}>
          <Icon name="calendar-bold" size={44} color={T.mutedSoft} />
          <div style={{ marginTop: 14, fontSize: 16, fontWeight: 700, color: T.light }}>
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

Object.assign(window, { EAnalytics, ECalendar });
