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
  // Centrální matice tarifů (employer-plans.jsx)
  if (typeof can === 'function') return can('analytics');
  // Fallback, kdyby se plans nenačetl
  const plan = (EPROFILE.plan || '').toLowerCase();
  return ['pro', 'business', 'premium', 'enterprise'].includes(plan);
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
        background: 'linear-gradient(180deg, rgba(0,32,246,0.05) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.9) 100%)',
      }}>
        <div style={{
          textAlign: 'center', maxWidth: 460, padding: '36px 32px',
          background: '#ffffff',
          border: '1px solid ' + T.border,
          borderRadius: 20,
          boxShadow: '0 24px 60px rgba(15,18,40,0.14)',
        }}>
          {/* Ikona */}
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: 'rgba(0,32,246,0.08)',
            border: '1px solid rgba(0,32,246,0.18)',
            display: 'grid', placeItems: 'center', margin: '0 auto 20px',
          }}>
            <Icon name="crown-star-bold" size={32} color={T.primary} />
          </div>

          {/* Titulek */}
          <div style={{ fontSize: 21, fontWeight: 800, color: T.ink, fontFamily: T.fontHead, marginBottom: 8, lineHeight: 1.25 }}>
            {feature || 'Tato sekce'} je dostupná v tarifu {typeof requiredPlanLabel === 'function' ? requiredPlanLabel('analytics') : 'Business'}
          </div>

          {/* Popis */}
          <div style={{ fontSize: 13, color: T.muted, fontFamily: T.fontUI, lineHeight: 1.7, marginBottom: 24 }}>
            Odemkněte <strong style={{ color: T.primary }}>pokročilé reporty</strong>,{' '}
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
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: T.ink, fontFamily: T.fontUI }}>
                <Icon name="check-circle-bold" size={14} color={T.primary} />
                {f}
              </div>
            ))}
          </div>

          {/* CTA tlačítko */}
          <button style={{
            width: '100%', padding: '13px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0020F6, #2D2CA7)',
            border: 'none',
            color: '#ffffff', fontFamily: T.fontUI, fontSize: 15, fontWeight: 800,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 8px 24px rgba(0,32,246,0.28)',
            transition: 'opacity .2s',
          }}
            onClick={() => window.empGoTab && window.empGoTab('pricing')}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Icon name="crown-star-bold" size={16} color="#ffffff" />
            Zobrazit tarify
          </button>

          <div style={{ marginTop: 12, fontSize: 12, color: T.mutedSoft, fontFamily: T.fontUI }}>
            Otázky? <a href="mailto:support@makej.eu" style={{ color: T.primary, textDecoration: 'none' }}>support@makej.eu</a>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ANALYTIKA — reálná data z E_JOBS (zhlédnutí, konverze, matche, najato)
// ─────────────────────────────────────────────────────────────
function EAnalytics() {
  return (
    <ProGate feature="Analytika">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
        <KrajeMap />
        <div style={{ padding: '0 28px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <AnalyticsOverview />
          <AnalyticsDemo />
        </div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ECard>
          <SectionHeader title="Doba odpovědi" subtitle="Jak rychle odpovídáš kandidátům v chatu" />
          {(() => {
            const resp = (typeof window !== 'undefined' && window.E_RESPONSE) || { data: [], avg: null, count: 0 };
            if (!resp.count) return <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 12, fontStyle: 'italic', padding: '24px 0' }}>Zatím žádná data o odezvě — spočítá se z tvých chatů s kandidáty.</div>;
            const fmt = m => m == null ? '–' : (m < 60 ? m + ' min' : (m / 60).toFixed(1).replace('.', ',') + ' h');
            return (
              <>
                <BarChart width={460} height={200} data={resp.data} />
                <div style={{ marginTop: 8, color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 11 }}>
                  Tvůj průměr: <span style={{ color: T.cardText, fontFamily: T.fontMono, fontWeight: 700 }}>{fmt(resp.avg)}</span> · z {resp.count} konverzací
                </div>
              </>
            );
          })()}
        </ECard>
        <ECard>
          <SectionHeader title="Distribuce hodinovky" subtitle="Rozložení mezd napříč tvými inzeráty (Kč/h)" />
          {(() => {
            const wage = (typeof window !== 'undefined' && window.E_WAGE_DISTRO) || [];
            if (!wage.some(b => b.v > 0)) return <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 12, fontStyle: 'italic', padding: '24px 0' }}>Zatím žádné inzeráty s hodinovou mzdou.</div>;
            return <BarChart width={460} height={200} data={wage} color="#0020F6" />;
          })()}
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
              {isYou && <text x={x + bw/2} y={y - 8} textAnchor="middle" fill="#c99400" fontFamily={T.fontUI} fontSize="9.5" fontWeight="800">VY</text>}
              <text x={x + bw/2} y={H - 12} textAnchor="middle" fill={T.cardMutedSoft} fontFamily={T.fontMono} fontSize="9.5">{b.l}</text>
            </g>
          );
        })}
        <text x={padL} y={H - 2} fill={T.cardMutedSoft} fontFamily={T.fontUI} fontSize="9">Kč/h</text>
      </svg>
      <div style={{ display: 'flex', gap: 20, marginTop: 6, fontFamily: T.fontMono, fontSize: 11 }}>
        <div><span style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Medián segmentu</span><div style={{ color: T.cardText, fontWeight: 700, fontSize: 14 }}>162 Kč</div></div>
        <div><span style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vy</span><div style={{ color: '#c99400', fontWeight: 700, fontSize: 14 }}>180 Kč</div></div>
        <div><span style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Top 10 %</span><div style={{ color: T.cardText, fontWeight: 700, fontSize: 14 }}>220+ Kč</div></div>
      </div>
    </div>
  );
}

// ── Demografie ────────────────────────────────────────────────
function AnalyticsDemo() {
  const cands = (typeof E_CANDIDATES !== 'undefined') ? [ ...(E_CANDIDATES.new || []), ...(E_CANDIDATES.hired || []) ] : [];
  const withAge = cands.filter(c => c.age != null);
  const ageData = [
    { l: '15-17', v: withAge.filter(c => c.age >= 15 && c.age <= 17).length },
    { l: '18-21', v: withAge.filter(c => c.age >= 18 && c.age <= 21).length },
    { l: '22-25', v: withAge.filter(c => c.age >= 22 && c.age <= 25).length },
    { l: '26-30', v: withAge.filter(c => c.age >= 26 && c.age <= 30).length },
    { l: '30+',   v: withAge.filter(c => c.age > 30).length },
  ];
  const GEN = { zena: { l: 'Žena', c: '#5B6BFF' }, muz: { l: 'Muž', c: '#FFD166' }, jine: { l: 'Jiné', c: '#E0B0FF' } };
  const withGen = cands.filter(c => c.gender && GEN[c.gender]);
  const genderData = ['zena', 'muz', 'jine']
    .map(k => ({ key: k, l: GEN[k].l, c: GEN[k].c, n: withGen.filter(c => c.gender === k).length }))
    .filter(g => g.n > 0);
  const genTotal = withGen.length;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ECard>
          <SectionHeader title="Věk" subtitle={withAge.length ? withAge.length + ' kandidátů s věkem' : undefined} />
          {withAge.length ? (
            <BarChart width={300} height={200} data={ageData} color="#0020F6" />
          ) : (
            <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 12, fontStyle: 'italic', padding: '24px 0' }}>Věk se sbírá od registrace — čísla naskočí, jak se přihlásí noví brigádníci s datem narození.</div>
          )}
        </ECard>
        <ECard>
          <SectionHeader title="Pohlaví" subtitle={genTotal ? genTotal + ' kandidátů' : undefined} />
          {genTotal ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Donut size={130} thickness={20} data={genderData.map(g => ({ v: g.n, color: g.c }))} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: T.fontUI, fontSize: 12 }}>
                {genderData.map((x, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
                      <span style={{ color: T.cardLight, flex: 1 }}>{x.l}</span>
                      <span style={{ color: T.cardText, fontFamily: T.fontMono, fontWeight: 700 }}>{Math.round(x.n / genTotal * 100)} %</span>
                    </div>
                    <div style={{ color: T.cardMutedSoft, fontFamily: T.fontMono, fontSize: 10, marginLeft: 14 }}>{x.n} kandidátů</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 12, fontStyle: 'italic', padding: '24px 0' }}>Pohlaví se sbírá od registrace — naskočí, jak se přihlásí noví brigádníci.</div>
          )}
        </ECard>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PLÁN SMĚN — reálný kalendář z Supabase dat (E_JOBS)
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// PLÁN SMĚN — reálný kalendář z Supabase dat (E_JOBS)
// ─────────────────────────────────────────────────────────────

function ECalendar() {
  const now = new Date();
  const [viewYear,  setViewYear]  = useStateE(now.getFullYear());
  const [viewMonth, setViewMonth] = useStateE(now.getMonth()); // 0-indexed
  const [selected,  setSelected]  = useStateE(null); // { job, candidates }

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
          <button onClick={prevMonth} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.light, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <Icon name="alt-arrow-left-line-duotone" size={14} color={T.light}/>
          </button>
          <div style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, color: T.ink, minWidth: 160 }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </div>
          <button onClick={nextMonth} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.light, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
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
                        const allCands = [...(E_CANDIDATES.new || []), ...(E_CANDIDATES.hired || [])];
                        const cands = allCands.filter(cx => cx.job_id === job.id);
                        return (
                          <button key={j} onClick={() => setSelected({ job, candidates: cands })} style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '3px 6px', borderRadius: 5,
                            background: c + '22',
                            borderWidth: '0 0 0 2px', borderStyle: 'solid', borderColor: c,
                            cursor: 'pointer', outline: 'none',
                          }}>
                            <div style={{ color: T.ink, fontWeight: 700, fontSize: 10.5, fontFamily: T.fontUI, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                            {(job.time_start || job.time_end) && (
                              <div style={{ color: T.muted, fontFamily: T.fontMono, fontSize: 9.5 }}>
                                {[job.time_start, job.time_end].filter(Boolean).join('–')}
                              </div>
                            )}
                          </button>
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
                    <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</div>
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

      {/* Detail drawer */}
      {selected && (() => {
        const { job, candidates } = selected;
        const c = jobColor(job);
        const STATUS = {
          pending:   { label: 'Nová přihláška',   color: '#5B6BFF', bg: 'rgba(91,107,255,0.1)' },
          accepted:  { label: 'Přijat — v chatu', color: '#5BD68A', bg: 'rgba(91,214,138,0.1)' },
          confirmed: { label: 'Potvrzeno',         color: '#0020F6', bg: 'rgba(0,32,246,0.08)' },
          rejected:  { label: 'Odmítnuto',         color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
        };
        return (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(15,18,40,0.35)', backdropFilter: 'blur(4px)' }}>
            <div onClick={e => e.stopPropagation()} style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 440,
              background: '#fff', boxShadow: '-8px 0 48px rgba(15,18,40,0.16)',
              display: 'flex', flexDirection: 'column', overflowY: 'auto',
              animation: 'empPop .2s cubic-bezier(.2,.8,.2,1)',
            }}>

              {/* Header */}
              <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c, marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 19, fontWeight: 800, lineHeight: 1.2 }}>{job.title}</div>
                  <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 12, marginTop: 3 }}>
                    {[job.date, job.location].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: 8, background: T.surfaceAlt, border: '1px solid ' + T.border, color: T.muted, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 16 }}>✕</button>
              </div>

              {/* Detaily brigády */}
              <div style={{ padding: '16px 22px', borderBottom: '1px solid ' + T.border }}>
                <div style={{ color: T.mutedSoft, fontSize: 10, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>Detaily brigády</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    job.pay        && { l: 'Mzda',   v: job.pay + ' ' + (job.payUnit || 'Kč/h') },
                    job.time_start && { l: 'Čas',    v: [job.time_start, job.time_end].filter(Boolean).join(' – ') },
                    job.location   && { l: 'Místo',  v: job.location },
                    job.positions  && { l: 'Míst',   v: job.positions + ' × ' + (job.hired || 0) + ' obsazeno' },
                  ].filter(Boolean).map((r, i) => (
                    <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: T.surfaceAlt, border: '1px solid ' + T.border }}>
                      <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.l}</div>
                      <div style={{ color: T.ink, fontFamily: T.fontMono, fontSize: 12.5, fontWeight: 700, marginTop: 2 }}>{r.v}</div>
                    </div>
                  ))}
                </div>
                {job.description && (
                  <div style={{ marginTop: 10, color: T.light, fontFamily: T.fontUI, fontSize: 12.5, lineHeight: 1.55 }}>{job.description}</div>
                )}
                {Array.isArray(job.tags) && job.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                    {job.tags.map((tag, i) => (
                      <span key={i} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(0,32,246,0.06)', border: '1px solid rgba(0,32,246,0.15)', color: T.ink, fontFamily: T.fontUI, fontSize: 11, fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Uchazeči */}
              <div style={{ padding: '16px 22px', flex: 1 }}>
                <div style={{ color: T.mutedSoft, fontSize: 10, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>
                  Uchazeči ({candidates.length})
                </div>
                {candidates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12.5, fontStyle: 'italic' }}>
                    Zatím žádní uchazeči.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {candidates.map((cand, i) => {
                      const st = STATUS[cand.status] || STATUS.pending;
                      const canChat = cand.status === 'accepted' || cand.status === 'confirmed'
                        || (E_THREADS || []).some(t => t.id === cand.id || t.match_id === cand.id);
                      return (
                        <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: T.surfaceAlt, border: '1px solid ' + T.border }}>
                          {/* Řádek info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 999, background: cand.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                              {cand.avatar}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{cand.name}</div>
                              <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, marginTop: 1 }}>
                                {[cand.city, Number(cand.rating) > 0 ? cand.rating + '★' : null, cand.jobsDone > 0 ? cand.jobsDone + ' brigád' : null].filter(Boolean).join(' · ') || 'Brigádník'}
                              </div>
                            </div>
                            <span style={{ padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color, fontFamily: T.fontUI, fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>{st.label}</span>
                          </div>
                          {/* Akce */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => window.empOpenProfile && window.empOpenProfile(cand.worker_id, { name: cand.name, address: cand.city, level: cand.level, jobs_done: cand.jobsDone, rating: cand.rating, verified: cand.verified })}
                              style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.ink, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                              Profil
                            </button>
                            {canChat && (
                              <button
                                onClick={() => {
                                  window._empPresetThread = cand.id;
                                  window.empGoTab && window.empGoTab('chat');
                                  setSelected(null);
                                }}
                                style={{ flex: 2, padding: '7px 10px', borderRadius: 8, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <Icon name="chat-round-line-bold" size={13} color="#fff" />Otevřít chat
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

Object.assign(window, { EAnalytics, ECalendar });
