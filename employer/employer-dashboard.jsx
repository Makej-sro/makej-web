// Makej Employer — Dashboard page
// Reuses ECard, Sparkline, AreaChart, SectionHeader, E_KPIS, E_ACTIVITY, E_JOBS

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

      {/* Trend + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <ECard>
          <SectionHeader
            title="Aktivita kandidátů"
            subtitle="Zhlédnutí, swajp-right a matche za posledních 30 dní"
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
            labels={['1.5','5.5','10.5','15.5','20.5','25.5','30.5']}
            series={[
              { color: '#5B6BFF', data: [320,380,420,510,480,560,620,590,670,720,760,820,880,940,1010,1080,1140,1200,1280,1340,1410,1480,1540,1620,1700,1780,1860,1940,2030,2120] },
              { color: '#FFD166', data: [80,95,110,130,125,145,160,155,170,185,195,210,225,240,260,275,290,310,330,350,365,385,410,430,455,475,495,520,545,568] },
              { color: '#5BD68A', data: [8,10,12,15,13,17,19,18,21,23,25,27,29,32,35,37,40,42,45,48,50,53,56,59,62,65,68,72,75,78] },
            ]}
          />
        </ECard>

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
      </div>

      {/* Job performance table */}
      <ECard>
        <SectionHeader
          title="Výkon inzerátů"
          subtitle="Klíčové metriky podle inzerátu"
          action={
            <button style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid ' + T.border, color: T.light, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
            {E_JOBS.slice(0, 5).map(j => (
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
  );
}

Object.assign(window, { EDashboard });
