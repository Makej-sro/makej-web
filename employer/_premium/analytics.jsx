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
      {(() => {
        const jobs = (typeof E_JOBS !== 'undefined' ? E_JOBS : []) || [];

        if (jobs.length === 0) {
          return (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 40 }}>
              <div style={{ textAlign: 'center', maxWidth: 420 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(0,32,246,0.08)', border: '1px solid rgba(0,32,246,0.18)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
                  <Icon name="chart-2-bold" size={34} color={T.primary} />
                </div>
                <div style={{ fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Zatím žádná data</div>
                <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13.5, lineHeight: 1.7 }}>
                  Jakmile vytvoříš inzeráty a brigádníci je začnou vidět a swajpovat, uvidíš tu reálná čísla o zhlédnutích, konverzi a náboru.
                </div>
              </div>
            </div>
          );
        }

        const totalViews   = jobs.reduce((a, j) => a + (j.views || 0), 0);
        const totalMatches = jobs.reduce((a, j) => a + (j.matches || 0), 0);
        const totalHired   = jobs.reduce((a, j) => a + (j.hired || 0), 0);
        const avgCtr       = totalViews > 0 ? (totalMatches / totalViews) * 100 : 0;
        const fmt = n => n.toLocaleString('cs-CZ').replace(/,/g, ' ');

        const kpis = [
          { label: 'Celkem zhlédnutí', value: fmt(totalViews),        sub: 'brigádníků vidělo inzeráty', icon: 'eye-bold',          color: '#5B6BFF' },
          { label: 'Konverze',         value: avgCtr.toFixed(1) + '%', sub: 'zhlédnuto → match',           icon: 'chart-2-bold',      color: '#0020F6' },
          { label: 'Celkem matchů',    value: fmt(totalMatches),       sub: 'swajpů doprava',             icon: 'heart-bold',        color: '#5BD68A' },
          { label: 'Najato',           value: fmt(totalHired),         sub: 'potvrzených brigádníků',      icon: 'check-circle-bold', color: '#5BD68A' },
        ];

        const ranked = jobs.slice().sort((a, b) => (b.views || 0) - (a.views || 0));

        return (
          <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {kpis.map((k, i) => (
                <ECard key={i} padding={18}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: k.color + '1f', border: '1px solid ' + k.color + '33', display: 'grid', placeItems: 'center' }}>
                      <Icon name={k.icon} size={14} color={k.color} />
                    </div>
                    <span style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{k.label}</span>
                  </div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 26, fontWeight: 700, color: T.ink, letterSpacing: -0.8 }}>{k.value}</div>
                  <div style={{ color: T.mutedSoft, fontSize: 10.5, fontFamily: T.fontUI, marginTop: 3 }}>{k.sub}</div>
                </ECard>
              ))}
            </div>

            {/* Per-job performance */}
            <ECard>
              <SectionHeader title="Výkon inzerátů" subtitle="Zhlédnutí, matche a konverze podle jednotlivých inzerátů" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontUI }}>
                  <thead>
                    <tr>
                      {['Inzerát', 'Zhlédnutí', 'Matche', 'Konverze', 'Najato'].map((h, i) => (
                        <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '10px 12px', color: T.mutedSoft, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid ' + T.border }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((j, i) => {
                      const conv = (j.views || 0) > 0 ? ((j.matches || 0) / j.views * 100) : 0;
                      return (
                        <tr key={j.id || i}>
                          <td style={{ padding: '11px 12px', borderBottom: '1px solid ' + T.border }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 3, background: j.accent || T.primary, flexShrink: 0 }} />
                              <span style={{ color: T.ink, fontSize: 13, fontWeight: 600 }}>{j.title}</span>
                            </div>
                          </td>
                          <td style={{ padding: '11px 12px', textAlign: 'right', color: T.ink, fontFamily: T.fontMono, fontSize: 13, borderBottom: '1px solid ' + T.border }}>{fmt(j.views || 0)}</td>
                          <td style={{ padding: '11px 12px', textAlign: 'right', color: T.ink, fontFamily: T.fontMono, fontSize: 13, borderBottom: '1px solid ' + T.border }}>{j.matches || 0}</td>
                          <td style={{ padding: '11px 12px', textAlign: 'right', color: conv > 0 ? '#16a34a' : T.mutedSoft, fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, borderBottom: '1px solid ' + T.border }}>{conv.toFixed(1)}%</td>
                          <td style={{ padding: '11px 12px', textAlign: 'right', color: T.ink, fontFamily: T.fontMono, fontSize: 13, borderBottom: '1px solid ' + T.border }}>{j.hired || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalViews === 0 && (
                <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.muted, fontFamily: T.fontUI, fontSize: 12, lineHeight: 1.6 }}>
                  Zhlédnutí se začala počítat od zapojení trackování — čísla porostou, jak brigádníci uvidí tvoje inzeráty ve swipu.
                </div>
              )}
            </ECard>
          </div>
        );
      })()}
    </ProGate>
  );
}


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
