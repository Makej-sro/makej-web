// Makej Employer — Dashboard page
// Reuses ECard, KPI charts, E_KPIS, E_FUNNEL, E_ACTIVITY, E_HEATMAP, E_GEO, E_BENCH

function EDashboard() {
  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {E_KPIS.map(k => (
          <ECard key={k.id} padding={18}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(91,107,255,0.15)', display: 'grid', placeItems: 'center', border: '1px solid rgba(91,107,255,0.25)' }}>
                  <Icon name={k.icon} size={14} color={T.light} />
                </div>
                <span style={{ color: T.muted, fontSize: 11.5, fontFamily: T.fontUI, fontWeight: 600, letterSpacing: 0.3 }}>{k.label}</span>
              </div>
              <span style={{
                padding: '3px 7px', borderRadius: 6,
                background: k.delta >= 0 ? 'rgba(91,214,138,0.15)' : 'rgba(244,63,94,0.15)',
                color: k.delta >= 0 ? '#5BD68A' : '#f43f5e',
                fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 3,
              }}>
                <Icon name={k.delta >= 0 ? 'arrow-up-bold' : 'arrow-down-bold'} size={10} color={k.delta >= 0 ? '#5BD68A' : '#f43f5e'} />
                {Math.abs(k.delta).toFixed(1)}%
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontFamily: T.fontMono, fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: -1, lineHeight: 1 }}>
                  {typeof k.value === 'number' && k.value >= 1000 ? k.value.toLocaleString('cs-CZ').replace(/,/g, ' ') : k.value}
                  <span style={{ fontSize: 14, color: T.muted, fontWeight: 600, marginLeft: 2 }}>{k.unit}</span>
                </div>
                <div style={{ color: T.mutedSoft, fontSize: 10.5, fontFamily: T.fontUI, marginTop: 4 }}>vs. minulých 30 dní</div>
              </div>
              <Sparkline data={k.spark} color={k.delta >= 0 ? '#5BD68A' : '#f43f5e'} width={84} height={32} />
            </div>
          </ECard>
        ))}
      </div>

      {/* Trend + Funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <ECard>
          <SectionHeader
            title="Aktivita kandidátů"
            subtitle="Zhlédnutí, swipe-right a matche za posledních 30 dní"
            action={
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {[
                  { c: '#5B6BFF', l: 'Zhlédnutí' },
                  { c: '#FFD166', l: 'Swipe right' },
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
            labels={['1.5','5.5','10.5','15.5','20.5','25.5','30.5']}
            series={[
              { color: '#5B6BFF', data: [320, 380, 420, 510, 480, 560, 620, 590, 670, 720, 760, 820, 880, 940, 1010, 1080, 1140, 1200, 1280, 1340, 1410, 1480, 1540, 1620, 1700, 1780, 1860, 1940, 2030, 2120] },
                { color: '#FFD166', data: [80, 95, 110, 130, 125, 145, 160, 155, 170, 185, 195, 210, 225, 240, 260, 275, 290, 310, 330, 350, 365, 385, 410, 430, 455, 475, 495, 520, 545, 568] },
                { color: '#5BD68A', data: [8, 10, 12, 15, 13, 17, 19, 18, 21, 23, 25, 27, 29, 32, 35, 37, 40, 42, 45, 48, 50, 53, 56, 59, 62, 65, 68, 72, 75, 78] },
            ]}
          />
        </ECard>

        <ECard>
          <SectionHeader title="Náborový funnel" subtitle="Cesta od zobrazení k najetí" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {E_FUNNEL.map((f, i) => {
              const widthPct = (f.count / E_FUNNEL[0].count) * 100;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: f.color }} />
                      <span style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600 }}>{f.stage}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                      <span style={{ color: '#fff', fontFamily: T.fontMono, fontSize: 13, fontWeight: 700 }}>{f.count.toLocaleString('cs-CZ').replace(/,/g, ' ')}</span>
                      <span style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10 }}>{f.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${widthPct}%`, background: `linear-gradient(90deg, ${f.color}, ${f.color}aa)`, borderRadius: 4, transition: 'width .4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: 'rgba(91,214,138,0.08)', border: '1px solid rgba(91,214,138,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="lightbulb-bold" size={16} color="#5BD68A" />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#5BD68A', fontSize: 11, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.4 }}>INSIGHT</div>
              <div style={{ color: T.light, fontSize: 11.5, fontFamily: T.fontUI, marginTop: 1 }}>Konverze pohovor → najato je o 12% nad průměrem v Brně.</div>
            </div>
          </div>
        </ECard>
      </div>

      {/* Heatmap + Geo + Bench */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 14 }}>
        <ECard>
          <SectionHeader title="Kdy jsou kandidáti aktivní" subtitle="Heatmapa swipů podle dne a hodiny" />
          <Heatmap />
        </ECard>

        <ECard>
          <SectionHeader title="Odkud přichází" subtitle="Top 6 čtvrtí Brna" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Donut size={120} thickness={16} data={E_GEO.map((g, i) => ({ v: g.count, color: ['#0020F6','#5B6BFF','#FFD166','#5BD68A','#E0B0FF','#6e6ea8'][i] }))} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {E_GEO.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontFamily: T.fontUI }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: ['#0020F6','#5B6BFF','#FFD166','#5BD68A','#E0B0FF','#6e6ea8'][i] }} />
                  <span style={{ color: T.light, flex: 1 }}>{g.city}</span>
                  <span style={{ color: T.muted, fontFamily: T.fontMono, fontWeight: 700 }}>{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </ECard>

        <ECard>
          <SectionHeader title="Srovnání s trhem" subtitle="Brno · gastro segment" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {E_BENCH.map((b, i) => {
              const better = b.lowerBetter ? b.you < b.avg : b.you > b.avg;
              const youPct = b.lowerBetter ? Math.min(100, (b.avg / b.you) * 50) : Math.min(100, (b.you / b.avg) * 50);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: T.light, fontSize: 11.5, fontFamily: T.fontUI, fontWeight: 600 }}>{b.metric}</span>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                      <span style={{ color: '#fff', fontFamily: T.fontMono, fontSize: 12, fontWeight: 700 }}>{b.you}{b.unit}</span>
                      <span style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10 }}>vs {b.avg}{b.unit}</span>
                    </span>
                  </div>
                  <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.2)', zIndex: 2 }} />
                    <div style={{ height: '100%', width: `${youPct + 50}%`, background: better ? 'linear-gradient(90deg, #5BD68A, #5BD68Aaa)' : 'linear-gradient(90deg, #f43f5e, #f43f5eaa)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ECard>
      </div>

      {/* Activity + Top Jobs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>
        <ECard>
          <SectionHeader title="Aktivita v reálném čase" subtitle="Posledních 24 hodin" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {E_ACTIVITY.map((a, i) => (
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
                    <span style={{ color: '#fff', fontWeight: 700 }}>{a.who}</span>{' '}{a.what}
                  </div>
                  <div style={{ color: T.mutedSoft, fontSize: 10.5, fontFamily: T.fontMono, marginTop: 2 }}>{a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </ECard>

        <ECard>
          <SectionHeader
            title="Výkon inzerátů"
            subtitle="Klíčové metriky podle inzerátu"
            action={<button style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid ' + T.border, color: T.light, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="export-bold" size={12} color={T.light}/>Export CSV</button>}
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
              {E_JOBS.slice(0, 4).map(j => (
                <tr key={j.id}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + T.border }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 26, borderRadius: 3, background: j.accent }} />
                      <div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>{j.title}</div>
                        <div style={{ color: T.mutedSoft, fontSize: 10, fontFamily: T.fontMono, marginTop: 1 }}>{j.plan}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + T.border, textAlign: 'right', fontFamily: T.fontMono, color: '#fff', fontWeight: 700 }}>{j.views.toLocaleString('cs-CZ').replace(/,/g, ' ')}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + T.border, textAlign: 'right', fontFamily: T.fontMono, color: T.light }}>{j.ctr}%</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + T.border, textAlign: 'right', fontFamily: T.fontMono, color: T.light }}>{j.matches}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + T.border, textAlign: 'right' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(91,214,138,0.15)', color: '#5BD68A', fontFamily: T.fontMono, fontSize: 11, fontWeight: 700 }}>{j.hired}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ECard>
      </div>
    </div>
  );
}

function Heatmap() {
  const days = ['Po','Út','St','Čt','Pá','So','Ne'];
  const max = Math.max(...E_HEATMAP.flat());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 4, paddingLeft: 22 }}>
        {[0, 6, 12, 18, 23].map(h => (
          <div key={h} style={{ flex: 1, fontFamily: T.fontMono, fontSize: 9.5, color: T.mutedSoft }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>
      {E_HEATMAP.map((row, d) => (
        <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 18, fontFamily: T.fontUI, fontSize: 10.5, color: T.muted, fontWeight: 700 }}>{days[d]}</div>
          <div style={{ display: 'flex', gap: 2, flex: 1 }}>
            {row.map((v, h) => {
              const pct = v / max;
              const bg = pct < 0.05
                ? 'rgba(91,107,255,0.06)'
                : `rgba(${91 + (0 - 91) * pct}, ${107 - 75 * pct}, ${255 - 9 * pct}, ${0.2 + pct * 0.8})`;
              return (
                <div key={h} title={`${days[d]} ${String(h).padStart(2,'0')}:00 — ${v}`} style={{
                  flex: 1, height: 16, borderRadius: 3,
                  background: bg,
                  border: '1px solid rgba(255,255,255,0.03)',
                }} />
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, paddingLeft: 22, fontSize: 10, color: T.mutedSoft, fontFamily: T.fontUI }}>
        <span>málo</span>
        {[0.1, 0.3, 0.5, 0.7, 0.95].map(p => (
          <span key={p} style={{ width: 14, height: 8, borderRadius: 2, background: `rgba(${91 - 91*p}, ${107 - 75*p}, ${255 - 9*p}, ${0.2 + p*0.8})` }} />
        ))}
        <span>hodně</span>
      </div>
    </div>
  );
}

Object.assign(window, { EDashboard });
