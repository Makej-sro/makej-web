// Makej Employer — Dashboard page

function exportJobsCsv() {
  const rows = [['Inzerát', 'Stav', 'Zhlédnutí', 'CTR (%)', 'Matche', 'Najato', 'Mzda']];
  (typeof E_JOBS !== 'undefined' ? E_JOBS : []).forEach(j => {
    rows.push([j.title || '', j.status || '', j.views ?? 0, j.ctr ?? 0, j.matches ?? 0, j.hired ?? 0, (j.pay ?? '') + ' ' + (j.payUnit || '')]);
  });
  const csv = rows.map(r => r.map(c => {
    const s = String(c).replace(/"/g, '""');
    return /[",;\n]/.test(s) ? '"' + s + '"' : s;
  }).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'makej-vykon-inzeratu-' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  if (window.empToast) window.empToast('Export hotový', 'Staženo ' + (typeof E_JOBS !== 'undefined' ? E_JOBS.length : 0) + ' inzerátů do CSV.', '📄', 'success');
}

function EDashboard({ period = '30d' }) {
  const periodDays  = { '7d': 7, '30d': 30, '90d': 90, 'rok': 365 }[period] || 30;
  const periodLabel = { '7d': '7 dní', '30d': '30 dní', '90d': '90 dní', 'rok': 'rok' }[period] || '30 dní';

  const stats = useMemoE(() => {
    const now        = Date.now();
    const cutoff     = new Date(now - periodDays * 86400000);
    const prevCutoff = new Date(now - periodDays * 2 * 86400000);

    const allNew   = E_CANDIDATES.new   || [];
    const allHired = E_CANDIDATES.hired || [];
    const all      = [...allNew, ...allHired];

    const inPeriod = c => c.createdAt && new Date(c.createdAt) >= cutoff;
    const inPrev   = c => c.createdAt && new Date(c.createdAt) >= prevCutoff && new Date(c.createdAt) < cutoff;
    const pctDelta = (curr, prev) => prev > 0 ? +((curr - prev) / prev * 100).toFixed(1) : (curr > 0 ? 100 : 0);

    const currMatches = all.filter(inPeriod).length;
    const prevMatches = all.filter(inPrev).length;
    const currHired   = allHired.filter(inPeriod).length;
    const prevHired   = allHired.filter(inPrev).length;
    const activeJobs  = E_JOBS.filter(j => j.status === 'active' || j.status === 'urgent').length;
    const reviews     = typeof E_REVIEWS !== 'undefined' ? E_REVIEWS : [];
    const avgRating   = reviews.length
      ? +(reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : '–';

    // Chart configuration
    let chartN, chartStepDays;
    if      (period === '7d')  { chartN = 7;  chartStepDays = 1;  }
    else if (period === '30d') { chartN = 30; chartStepDays = 1;  }
    else if (period === '90d') { chartN = 13; chartStepDays = 7;  }
    else                       { chartN = 12; chartStepDays = 30; }

    const labels = Array.from({ length: chartN }, (_, i) => {
      const bucketEnd = new Date(now - (chartN - 1 - i) * chartStepDays * 86400000);
      if (period === 'rok') return bucketEnd.toLocaleDateString('cs-CZ', { month: 'short' });
      return bucketEnd.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
    });

    function bucketCounts(candidates) {
      return Array.from({ length: chartN }, (_, i) => {
        const bucketStart = new Date(now - (chartN - i) * chartStepDays * 86400000);
        const bucketEnd   = i === chartN - 1
          ? new Date(now + 86400000)
          : new Date(now - (chartN - 1 - i) * chartStepDays * 86400000);
        return candidates.filter(c => {
          if (!c.createdAt) return false;
          const d = new Date(c.createdAt);
          return d >= bucketStart && d < bucketEnd;
        }).length;
      });
    }

    const matchCounts = bucketCounts(all);
    const hiredCounts = bucketCounts(allHired);
    // Views: heuristic — 12× matches; swipe-right: 2× matches
    const viewCounts  = matchCounts.map(v => v * 12);
    const swipeCounts = matchCounts.map(v => v * 2);

    // 12-point sparklines over the whole period
    const sparkStep = periodDays / 12;
    function sparks(candidates) {
      const pts = Array.from({ length: 12 }, (_, i) => {
        const start = new Date(now - (12 - i) * sparkStep * 86400000);
        const end   = new Date(now - (11 - i) * sparkStep * 86400000 + (i === 11 ? 86400000 : 0));
        return candidates.filter(c => {
          if (!c.createdAt) return false;
          const d = new Date(c.createdAt);
          return d >= start && d < end;
        }).length;
      });
      return pts.some(v => v > 0) ? pts : [0,0,1,0,1,0,0,1,0,1,0,0];
    }

    return {
      currMatches, matchDelta: pctDelta(currMatches, prevMatches),
      currHired,   hiredDelta: pctDelta(currHired, prevHired),
      activeJobs, avgRating,
      matchSpark: sparks(all),
      hiredSpark: sparks(allHired),
      labels, matchCounts, hiredCounts, viewCounts, swipeCounts,
    };
  }, [period]);

  const jobLimit  = (typeof planLimit === 'function') ? planLimit('maxActiveJobs') : Infinity;
  const ratingNum = Number(stats.avgRating);
  const kpis = [
    { id: 'jobs',    label: 'Aktivní inzeráty', value: stats.activeJobs,  delta: 0,                icon: 'document-text-bold', unit: '/' + (jobLimit === Infinity ? '∞' : jobLimit), viz: 'bar',   barValue: stats.activeJobs, barMax: jobLimit === Infinity ? Math.max(stats.activeJobs, 1) : jobLimit },
    { id: 'matches', label: 'Nové matche',       value: stats.currMatches, delta: stats.matchDelta, icon: 'heart-bold',         unit: '',  viz: 'spark', spark: stats.matchSpark },
    { id: 'hired',   label: 'Najato',            value: stats.currHired,   delta: stats.hiredDelta, icon: 'check-circle-bold',  unit: '',  viz: 'spark', spark: stats.hiredSpark },
    { id: 'rating',  label: 'Hodnocení firmy',   value: stats.avgRating,   delta: 0,                icon: 'star-bold',          unit: isNaN(ratingNum) ? '' : '/5', viz: 'stars', rating: isNaN(ratingNum) ? 0 : ratingNum },
  ];

  // Vyžaduje pozornost — akční upozornění (z reálných dat)
  const alerts = [];
  const waitingCount = (typeof E_CANDIDATES !== 'undefined' ? (E_CANDIDATES.new || []).length : 0);
  if (waitingCount > 0) alerts.push({
    key: 'waiting', icon: 'bell-bold',
    label: `${waitingCount} ${waitingCount === 1 ? 'kandidát čeká' : waitingCount < 5 ? 'kandidáti čekají' : 'kandidátů čeká'} na odpověď`,
    color: '#0020F6', bg: 'rgba(0,32,246,0.07)', border: 'rgba(0,32,246,0.20)', tab: 'candidates',
  });
  const expiringJobs = (typeof E_JOBS !== 'undefined' ? E_JOBS : []).filter(j => j.daysLeft > 0 && j.daysLeft <= 3 && j.status !== 'filled');
  if (expiringJobs.length > 0) {
    const isVeryUrgent = expiringJobs.some(j => j.daysLeft <= 1);
    const ej = expiringJobs[0];
    const shortTitle = ej.title.length > 24 ? ej.title.slice(0, 24) + '…' : ej.title;
    const lbl = expiringJobs.length === 1
      ? `„${shortTitle}" expiruje za ${ej.daysLeft} ${ej.daysLeft === 1 ? 'den' : 'dny'}`
      : `${expiringJobs.length} inzeráty brzy expirují`;
    alerts.push({
      key: 'expiring', icon: 'danger-bold', label: lbl,
      color: isVeryUrgent ? '#DC2626' : '#D97706',
      bg: isVeryUrgent ? 'rgba(220,38,38,0.07)' : 'rgba(217,119,6,0.07)',
      border: isVeryUrgent ? 'rgba(220,38,38,0.22)' : 'rgba(217,119,6,0.22)', tab: 'jobs',
    });
  }
  const unreadMsgs = (typeof E_THREADS !== 'undefined' ? E_THREADS.reduce((s, t) => s + (t.unread || 0), 0) : 0);
  if (unreadMsgs > 0) alerts.push({
    key: 'msgs', icon: 'chat-round-line-bold',
    label: `${unreadMsgs} ${unreadMsgs === 1 ? 'nepřečtená zpráva' : unreadMsgs < 5 ? 'nepřečtené zprávy' : 'nepřečtených zpráv'}`,
    color: '#059669', bg: 'rgba(5,150,105,0.07)', border: 'rgba(5,150,105,0.22)', tab: 'chat',
  });

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>

      {/* Vyžaduje pozornost */}
      {alerts.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid ' + T.border, borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
            <Icon name="danger-triangle-bold" size={15} color="#D97706" />
            <span style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Vyžaduje pozornost</span>
          </div>
          <div style={{ width: 1, height: 18, background: T.border, flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            {alerts.map(a => (
              <button key={a.key} onClick={() => window.empGoTab && window.empGoTab(a.tab)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 99, background: a.bg, border: '1px solid ' + a.border, cursor: 'pointer', transition: 'box-shadow .15s', fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, color: a.color, lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 10px ' + a.border}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <Icon name={a.icon} size={13} color={a.color} />
                {a.label}
                <span style={{ fontSize: 11, opacity: 0.55 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {kpis.map(k => {
          const isRating = k.id === 'rating';
          return (
          <ECard key={k.id} padding={18}>
            {/* header: ikona + delta */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: isRating ? 'rgba(245,166,35,0.14)' : 'rgba(0,32,246,0.10)', border: '1px solid ' + (isRating ? 'rgba(245,166,35,0.28)' : 'rgba(0,32,246,0.18)'), display: 'grid', placeItems: 'center' }}>
                <Icon name={k.icon} size={16} color={isRating ? '#F5A623' : T.primary} />
              </div>
              <span style={{
                padding: '3px 8px', borderRadius: 999,
                background: k.delta >= 0 ? 'rgba(34,160,107,0.12)' : 'rgba(244,63,94,0.12)',
                color: k.delta >= 0 ? '#16a34a' : '#f43f5e',
                fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                <Icon name={k.delta >= 0 ? 'arrow-up-bold' : 'arrow-down-bold'} size={10} color={k.delta >= 0 ? '#16a34a' : '#f43f5e'} />
                {Math.abs(k.delta).toFixed(1)}%
              </span>
            </div>

            {/* label */}
            <div style={{ color: T.muted, fontSize: 12.5, fontFamily: T.fontUI, fontWeight: 600, marginBottom: 6 }}>{k.label}</div>

            {/* hodnota */}
            <div style={{ fontFamily: T.fontHead, fontSize: 30, fontWeight: 900, color: T.ink, letterSpacing: -1, lineHeight: 1 }}>
              {typeof k.value === 'number' && k.value >= 1000 ? k.value.toLocaleString('cs-CZ').replace(/,/g, ' ') : k.value}
              {k.unit && <span style={{ fontSize: 15, color: T.mutedSoft, fontWeight: 600, marginLeft: 3 }}>{k.unit}</span>}
            </div>

            {/* footer vizualizace podle typu */}
            <div style={{ marginTop: 14, height: 34, display: 'flex', alignItems: 'center' }}>
              {k.viz === 'bar' && (
                <div style={{ width: '100%', height: 7, borderRadius: 999, background: 'rgba(0,32,246,0.10)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: Math.min(100, Math.round((k.barValue / k.barMax) * 100)) + '%', borderRadius: 999, background: 'linear-gradient(90deg, #5B6BFF, #0020F6)' }} />
                </div>
              )}
              {k.viz === 'spark' && (
                <Sparkline data={k.spark} color={k.delta >= 0 ? '#16a34a' : '#f43f5e'} width={200} height={34} />
              )}
              {k.viz === 'stars' && (
                <div style={{ display: 'flex', gap: 3 }}>
                  {[0,1,2,3,4].map(i => (
                    <Icon key={i} name="star-bold" size={17} color={i < Math.round(k.rating) ? '#F5A623' : 'rgba(15,18,40,0.15)'} />
                  ))}
                </div>
              )}
            </div>
          </ECard>
          );
        })}
      </div>

      {/* Trend + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <ECard>
          <SectionHeader
            title="Aktivita kandidátů"
            subtitle={'Zhlédnutí, swajp-right a matche za ' + periodLabel}
            action={
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {[
                  { c: '#5B6BFF', l: 'Zhlédnutí' },
                  { c: '#FFD166', l: 'Swajp right' },
                  { c: '#5BD68A', l: 'Matche' },
                ].map(x => (
                  <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: x.c }} />
                    <span style={{ fontSize: 11, color: T.muted, fontFamily: T.fontUI, fontWeight: 600 }}>{x.l}</span>
                  </div>
                ))}
              </div>
            }
          />
          <AreaChart
            width={620} height={240}
            labels={stats.labels}
            series={[
              { color: '#5B6BFF', data: stats.viewCounts },
              { color: '#FFD166', data: stats.swipeCounts },
              { color: '#5BD68A', data: stats.matchCounts },
            ]}
          />
        </ECard>

        <ECard>
          <SectionHeader title="Aktivita v reálném čase" subtitle="Posledních 24 hodin" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {E_ACTIVITY.length === 0 ? (
              <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12.5, fontStyle: 'italic', padding: '8px 0' }}>Žádná aktivita za posledních 24 hodin.</div>
            ) : E_ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < E_ACTIVITY.length - 1 ? '1px solid ' + T.border : 'none' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: a.color + '22', border: '1px solid ' + a.color + '44',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <Icon name={a.icon} size={14} color={a.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.light, fontSize: 12, fontFamily: T.fontUI, lineHeight: 1.4 }}>
                    <span style={{ color: T.ink, fontWeight: 700 }}>{a.who}</span>{' '}{a.what}
                  </div>
                  <div style={{ color: T.mutedSoft, fontSize: 10.5, fontFamily: T.fontMono, marginTop: 2 }}>{a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </ECard>
      </div>

      {/* Job performance table */}
      <ECard>
        <SectionHeader
          title="Výkon inzerátů"
          subtitle={'Klíčové metriky podle inzerátu za ' + periodLabel}
          action={
            <button onClick={exportJobsCsv} style={{ padding: '6px 10px', borderRadius: 8, background: T.surfaceAlt, border: '1px solid ' + T.border, color: T.light, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="export-bold" size={12} color={T.light}/>Export CSV
            </button>
          }
        />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontUI, fontSize: 12 }}>
          <thead>
            <tr style={{ color: T.mutedSoft, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid ' + T.border }}>Inzerát</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid ' + T.border }}>Zhlédnutí</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid ' + T.border }}>CTR</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid ' + T.border }}>Matche</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', borderBottom: '1px solid ' + T.border }}>Najato</th>
            </tr>
          </thead>
          <tbody>
            {E_JOBS.slice(0, 5).map(j => {
              // Count matches for this job in the selected period
              const jobCands = [...(E_CANDIDATES.new || []), ...(E_CANDIDATES.hired || [])].filter(c => c.job_id === j.id);
              const periodMatches = jobCands.filter(c => c.createdAt && new Date(c.createdAt) >= new Date(Date.now() - periodDays * 86400000)).length;
              const periodHired   = (E_CANDIDATES.hired || []).filter(c => c.job_id === j.id && c.createdAt && new Date(c.createdAt) >= new Date(Date.now() - periodDays * 86400000)).length;
              return (
                <tr key={j.id}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + T.border }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 26, borderRadius: 3, background: j.accent }} />
                      <div>
                        <div style={{ color: T.ink, fontWeight: 600, fontSize: 12 }}>{j.title}</div>
                        <div style={{ color: T.mutedSoft, fontSize: 10, fontFamily: T.fontMono, marginTop: 1 }}>{j.location || j.date || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + T.border, textAlign: 'right', fontFamily: T.fontMono, color: T.ink, fontWeight: 700 }}>—</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + T.border, textAlign: 'right', fontFamily: T.fontMono, color: T.light }}>—</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + T.border, textAlign: 'right', fontFamily: T.fontMono, color: T.light }}>{periodMatches}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + T.border, textAlign: 'right' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(91,214,138,0.15)', color: '#5BD68A', fontFamily: T.fontMono, fontSize: 11, fontWeight: 700 }}>{periodHired}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ECard>

    </div>
  );
}

Object.assign(window, { EDashboard });
