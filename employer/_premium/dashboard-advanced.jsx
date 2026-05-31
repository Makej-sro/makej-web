// ─────────────────────────────────────────────────────────────
//  Makej — Employer Premium: Pokročilý dashboard
//  Tarif: Premium
//
//  Jak zapojit zpět — viz _premium/README.md
//
//  Exportuje:  Heatmap (komponenta), sekce JSX (viz níže)
//
//  Data constants (přidat do employer-data.jsx + Object.assign):
//    E_FUNNEL, E_HEATMAP, E_GEO, E_BENCH
//
//  Sekce k přidání do employer-dashboard.jsx → EDashboard:
//    1. Funnel karta (viz FunnelSection)
//    2. Heatmap + Geo + Bench 3-col sekce (viz AdvancedSection)
// ─────────────────────────────────────────────────────────────

// ── DATA CONSTANTS ─────────────────────────────────────────────
// Tyto konstanty přidat do employer-data.jsx a zahrnout do Object.assign

const E_FUNNEL = [
  { label: 'Zobrazeno',       value: 12_847, pct: 100,  color: '#8AB4FF' },
  { label: 'Swajp right',     value:  3_163, pct:  24.6, color: '#5B6BFF' },
  { label: 'Match potvrzen',  value:    312, pct:   9.9, color: '#9B59FF' },
  { label: 'Pohovor',         value:     48, pct:  15.4, color: '#E0B0FF' },
  { label: 'Najato',          value:     18, pct:  37.5, color: '#5BD68A' },
];

// 7 × 24 heatmap — procedurální hodnoty (seed 42)
const E_HEATMAP = (() => {
  const rng = (s => () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 4294967296; })(42);
  const days = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  return days.map(day => ({
    day,
    hours: Array.from({ length: 24 }, (_, h) => {
      const workBump = (h >= 8 && h <= 11) || (h >= 17 && h <= 21) ? 0.6 : 0;
      const weekBump = (day === 'So' || day === 'Ne') ? 0.2 : 0;
      return Math.min(1, Math.max(0, rng() * 0.4 + workBump + weekBump));
    }),
  }));
})();

const E_GEO = [
  { district: 'Brno-střed',   candidates: 842, lat: 49.195, lon: 16.607 },
  { district: 'Brno-sever',   candidates: 317, lat: 49.224, lon: 16.612 },
  { district: 'Brno-jih',     candidates: 251, lat: 49.175, lon: 16.610 },
  { district: 'Židenice',     candidates: 198, lat: 49.198, lon: 16.641 },
  { district: 'Královo Pole', candidates: 164, lat: 49.216, lon: 16.585 },
  { district: 'Bohunice',     candidates: 119, lat: 49.166, lon: 16.570 },
];

const E_BENCH = [
  { label: 'Swajp right rate', yours: 24.6, market: 19.2, unit: '%',   better: true },
  { label: 'Time-to-hire',     yours:  2.1, market:  4.8, unit: ' dny', better: true },
  { label: 'Cost per hire',    yours:  480, market:  720, unit: ' Kč',  better: true },
  { label: 'Match-to-hire',    yours: 5.8, market:  8.3, unit: '%',    better: true },
];

// ── HEATMAP KOMPONENTA ─────────────────────────────────────────

function Heatmap({ data = E_HEATMAP }) {
  const HOW_MANY_HOURS = 24;
  const cellW = 18;
  const cellH = 18;
  const gap = 2;
  const paddingLeft = 28;
  const paddingTop = 20;

  const total_w = paddingLeft + HOW_MANY_HOURS * (cellW + gap);
  const total_h = paddingTop + data.length * (cellH + gap) + 20;

  function cellColor(v) {
    if (v < 0.1) return 'rgba(208,208,255,0.05)';
    if (v < 0.3) return `rgba(138,180,255,${0.2 + v * 0.3})`;
    if (v < 0.6) return `rgba(91,107,255,${0.3 + v * 0.5})`;
    return `rgba(91,107,255,${0.5 + v * 0.45})`;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${total_w} ${total_h}`} style={{ overflow: 'visible' }}>
      {/* Hour labels — every 3 hours */}
      {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
        <text
          key={h}
          x={paddingLeft + h * (cellW + gap) + cellW / 2}
          y={paddingTop - 4}
          fontSize={9}
          fill="#9999cc"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
        >
          {h}h
        </text>
      ))}

      {/* Day rows */}
      {data.map((row, ri) => (
        <g key={row.day}>
          {/* Day label */}
          <text
            x={paddingLeft - 4}
            y={paddingTop + ri * (cellH + gap) + cellH / 2 + 3}
            fontSize={9}
            fill="#9999cc"
            textAnchor="end"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            {row.day}
          </text>

          {/* Hour cells */}
          {row.hours.map((v, hi) => (
            <rect
              key={hi}
              x={paddingLeft + hi * (cellW + gap)}
              y={paddingTop + ri * (cellH + gap)}
              width={cellW}
              height={cellH}
              rx={3}
              fill={cellColor(v)}
            />
          ))}
        </g>
      ))}

      {/* Legend */}
      {[0.05, 0.25, 0.5, 0.75, 1].map((v, i) => (
        <rect
          key={i}
          x={paddingLeft + i * (cellW + gap) + total_w * 0.6}
          y={total_h - 14}
          width={cellW}
          height={10}
          rx={2}
          fill={cellColor(v)}
        />
      ))}
      <text x={paddingLeft + total_w * 0.6 - 4} y={total_h - 6} fontSize={8} fill="#9999cc" textAnchor="end">méně</text>
      <text x={paddingLeft + 5 * (cellW + gap) + total_w * 0.6 + 4} y={total_h - 6} fontSize={8} fill="#9999cc">více</text>
    </svg>
  );
}

// ── FUNNEL SEKCE ───────────────────────────────────────────────
// Přidat do EDashboard jako samostatná karta vedle Trend chartu.
// Viz `employer-dashboard.jsx` — umístit do 2-col sekce:
//   <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:20 }}>
//     {/* trend chart */}
//     <ECard>...</ECard>
//     <FunnelSection />    ← přidat tuto komponentu
//   </div>

function FunnelSection() {
  const data = E_FUNNEL;
  const maxVal = data[0].value;

  return (
    <ECard>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <SectionHeader title="Conversion funnel" subtitle="Celkem · posledních 30 dní" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((stage, i) => (
            <div key={stage.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#9999cc' }}>{stage.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {stage.value.toLocaleString('cs-CZ')}
                  {i > 0 && (
                    <span style={{ color: stage.color, fontSize: 11, marginLeft: 6 }}>
                      {stage.pct}%
                    </span>
                  )}
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(208,208,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(stage.value / maxVal) * 100}%`,
                  background: stage.color,
                  borderRadius: 4,
                  transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ECard>
  );
}

// ── POKROČILÁ SEKCE (HEATMAP + GEO + BENCH) ───────────────────
// Přidat do EDashboard jako poslední sekce po job performance tabulce.
// Použití:
//   <AdvancedSection />

function GeoCard() {
  const data = E_GEO;
  const max = Math.max(...data.map(d => d.candidates));

  return (
    <ECard>
      <div style={{ padding: '18px 20px' }}>
        <SectionHeader title="Kde jsou brigádníci" subtitle="Aktivní v Brně a okolí" />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {data.map(d => (
            <div key={d.district}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: '#d0d0ff' }}>{d.district}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {d.candidates}
                  <span style={{ color: '#9999cc', fontWeight: 400 }}> lidí</span>
                </span>
              </div>
              <div style={{ height: 5, background: 'rgba(208,208,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(d.candidates / max) * 100}%`,
                  background: 'linear-gradient(90deg, #5B6BFF, #8AB4FF)',
                  borderRadius: 3,
                }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: '#9999cc' }}>
          <Icon name="map-point-bold" size={11} /> Celkem {E_GEO.reduce((s, d) => s + d.candidates, 0).toLocaleString('cs-CZ')} aktivních brigádníků
        </div>
      </div>
    </ECard>
  );
}

function BenchCard() {
  const data = E_BENCH;

  return (
    <ECard>
      <div style={{ padding: '18px 20px' }}>
        <SectionHeader title="Benchmark" subtitle="Vaše firma vs. průměr trhu" />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.map(d => (
            <div key={d.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#9999cc' }}>{d.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.better ? '#5BD68A' : '#f43f5e' }}>
                    {d.yours}{d.unit}
                  </span>
                  <span style={{ fontSize: 11, color: '#555580' }}>
                    vs {d.market}{d.unit}
                  </span>
                  <Icon
                    name={d.better ? 'alt-arrow-up-bold' : 'alt-arrow-down-bold'}
                    size={12}
                    color={d.better ? '#5BD68A' : '#f43f5e'}
                  />
                </div>
              </div>
              {/* Dual bar */}
              <div style={{ position: 'relative', height: 6, background: 'rgba(208,208,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                {/* Market avg */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: '100%', background: 'rgba(208,208,255,0.1)', borderRadius: 3,
                }} />
                {/* Yours */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${d.better
                    ? (d.yours / d.market) * 60
                    : (d.yours / d.market) * 60}%`,
                  background: d.better ? '#5BD68A' : '#f43f5e',
                  borderRadius: 3,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ECard>
  );
}

function AdvancedSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Heatmap */}
      <ECard>
        <div style={{ padding: '18px 20px' }}>
          <SectionHeader title="Aktivita brigádníků" subtitle="Kdy brigádníci nejvíce swajpují (počet swajpů/hodinu)" />
          <div style={{ marginTop: 16, overflowX: 'auto' }}>
            <Heatmap data={E_HEATMAP} />
          </div>
        </div>
      </ECard>

      {/* Geo + Bench */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <GeoCard />
        <BenchCard />
      </div>
    </div>
  );
}

// ── EXPORT ─────────────────────────────────────────────────────
// Exportuje Heatmap jako sdílenou komponentu a všechny sekce

Object.assign(window, {
  // Komponenty
  Heatmap,
  FunnelSection,
  AdvancedSection,
  GeoCard,
  BenchCard,
  // Data (přidat taky do employer-data.jsx Object.assign)
  E_FUNNEL,
  E_HEATMAP,
  E_GEO,
  E_BENCH,
});
