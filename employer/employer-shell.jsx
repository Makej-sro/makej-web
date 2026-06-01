// Makej Employer — shell, charts, primitives
// Reuses T, Icon, fmtKc from app.jsx; ECOMPANY etc from employer-data.jsx

const { useState: useStateE, useEffect: useEffectE, useRef: useRefE, useMemo: useMemoE } = React;

// ─────────────────────────────────────────────────────────────
// LOGO + COMPANY BADGE
// ─────────────────────────────────────────────────────────────
function ELogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg, #0020F6 0%, #2D2CA7 100%)',
        display: 'grid', placeItems: 'center',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,32,246,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
      }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M3 22 L3 6 L8 6 L13 14 L18 6 L23 6 L23 22 L19 22 L19 13 L14.5 19 L11.5 19 L7 13 L7 22 Z" fill="#fff"/>
        </svg>
      </div>
      <div>
        <div style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: -0.5, lineHeight: 1 }}>
          makej<span style={{ color: T.super }}>.</span>
        </div>
        <div style={{ fontFamily: T.fontUI, fontSize: 9, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 3, fontWeight: 700 }}>
          for business
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
function ESidebar({ tab, onTab }) {
  const sections = [
    {
      label: 'Přehled',
      items: [
        { k: 'dash',      label: 'Dashboard', icon: 'chart-square-bold',  iconLine: 'chart-square-linear' },
        { k: 'analytics', label: 'Analytika', icon: 'graph-up-bold',      iconLine: 'graph-up-linear',    badge: 'PRO' },
      ],
    },
    {
      label: 'Nábor',
      items: [
        { k: 'jobs', label: 'Inzeráty', icon: 'document-text-bold', iconLine: 'document-text-linear', badge: 5 },
        { k: 'candidates', label: 'Kandidáti', icon: 'users-group-rounded-bold', iconLine: 'users-group-rounded-linear', badge: 12 },
        { k: 'chat', label: 'Zprávy', icon: 'chat-round-line-bold', iconLine: 'chat-round-line-linear', badge: 3 },
        { k: 'calendar', label: 'Plán směn', icon: 'calendar-bold', iconLine: 'calendar-linear' },
      ],
    },
    {
      label: 'Firma',
      items: [
        { k: 'settings', label: 'Nastavení', icon: 'settings-bold', iconLine: 'settings-linear' },
      ],
    },
  ];

  return (
    <aside style={{
      width: 256, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      padding: '20px 14px',
      borderRight: '1px solid ' + T.border,
      background: 'rgba(10,10,30,0.5)',
      backdropFilter: 'blur(20px)',
      overflowY: 'auto',
      position: 'relative', zIndex: 1,
    }}>
      <div style={{ padding: '4px 8px 18px' }}>
        <ELogo />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        {sections.map((sec, i) => (
          <div key={i}>
            <div style={{
              padding: '0 12px 6px',
              fontSize: 10, color: T.mutedSoft, fontFamily: T.fontUI,
              fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
            }}>{sec.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sec.items.map(it => {
                const active = tab === it.k;
                return (
                  <button key={it.k} onClick={() => !it.disabled && onTab(it.k)} style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '9px 12px', borderRadius: 10,
                    background: active ? 'linear-gradient(135deg, rgba(0,32,246,0.28), rgba(91,107,255,0.12))' : 'transparent',
                    border: '1px solid ' + (active ? 'rgba(91,107,255,0.4)' : 'transparent'),
                    color: active ? '#fff' : it.disabled ? 'rgba(153,153,204,0.35)' : T.muted,
                    cursor: it.disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
                    fontFamily: T.fontUI, fontWeight: active ? 700 : 500, fontSize: 13.5,
                    transition: 'all .15s',
                    opacity: it.disabled ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!active && !it.disabled) e.currentTarget.style.background = 'rgba(208,208,255,0.04)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                    <Icon name={active ? it.icon : it.iconLine} size={18} color={active ? T.light : T.muted} />
                    <span style={{ flex: 1 }}>{it.label}</span>
                    {it.disabled && <span style={{ fontSize: 9, fontWeight: 700, fontFamily: T.fontUI, color: 'rgba(153,153,204,0.5)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Brzy</span>}
                    {it.badge != null ? (
                      typeof it.badge === 'string' ? (
                        <span style={{
                          padding: '2px 6px', borderRadius: 4,
                          background: 'rgba(255,209,102,0.18)', color: T.super,
                          fontSize: 9, fontWeight: 800, fontFamily: T.fontUI, letterSpacing: 0.5,
                        }}>{it.badge}</span>
                      ) : (
                        <span style={{
                          minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                          background: T.primary, color: '#fff',
                          fontSize: 10, fontWeight: 800, fontFamily: T.fontUI,
                          display: 'grid', placeItems: 'center',
                        }}>{it.badge}</span>
                      )
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Plan card */}
      <div style={{
        margin: '12px 0',
        padding: 16, borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(91,107,255,0.18), rgba(0,32,246,0.08))',
        border: '1px solid rgba(91,107,255,0.3)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Icon name="crown-star-bold" size={16} color={T.super} />
          <span style={{ color: T.super, fontSize: 10, fontWeight: 800, fontFamily: T.fontUI, letterSpacing: 1, textTransform: 'uppercase' }}>Premium tarif</span>
        </div>
        {(() => {
          const expStr = EPROFILE.premium_until || EPROFILE.plan_expires_at || null;
          const now = new Date();
          if (!expStr) {
            return (
              <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 12, marginBottom: 12 }}>
                Bezplatný tarif
              </div>
            );
          }
          const exp = new Date(expStr);
          const daysLeft = Math.ceil((exp - now) / 86400000);
          const isActive = daysLeft > 0;
          const pct = isActive ? Math.min(100, Math.round((daysLeft / 365) * 100)) : 0;
          const expLabel = exp.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
          return (
            <>
              <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {isActive ? `Aktivní · do ${expLabel}` : `Vypršel · ${expLabel}`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', borderRadius: 999, background: 'linear-gradient(90deg, #5B6BFF, #0020F6)' }} />
                </div>
                <span style={{ color: T.muted, fontFamily: T.fontMono, fontSize: 10, fontWeight: 600 }}>{isActive ? daysLeft + 'd' : '0d'}</span>
              </div>
            </>
          );
        })()}
        <button style={{
          width: '100%', padding: '8px 10px', borderRadius: 8,
          background: 'rgba(91,107,255,0.25)', border: '1px solid rgba(91,107,255,0.4)',
          color: '#fff', cursor: 'pointer',
          fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>Spravovat tarif</button>
      </div>

      {/* Company footer */}
      <div style={{
        padding: '10px 8px', display: 'flex', alignItems: 'center', gap: 10,
        borderTop: '1px solid ' + T.border, marginTop: 6,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: ECOMPANY.logoColor + '22',
          border: '1px solid ' + ECOMPANY.logoColor + '55',
          display: 'grid', placeItems: 'center',
          color: ECOMPANY.logoColor, fontFamily: T.fontHead, fontWeight: 800, fontSize: 13,
        }}>{ECOMPANY.logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ECOMPANY.name}</div>
          <div style={{ color: T.muted, fontSize: 10.5, fontFamily: T.fontUI }}>{ECOMPANY.city}</div>
        </div>
        <Icon name="alt-arrow-down-line-duotone" size={14} color={T.muted} />
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────
function ETopbar({ title, subtitle, onNew, onSignOut }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 28px',
      borderBottom: '1px solid ' + T.border,
      background: 'rgba(7,7,26,0.55)',
      backdropFilter: 'blur(16px)',
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ margin: 0, fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.4 }}>{title}</h1>
          <span style={{ width: 4, height: 4, borderRadius: 999, background: T.mutedSoft }} />
          <span style={{ fontFamily: T.fontUI, fontSize: 13, color: T.muted, fontWeight: 500 }}>{subtitle}</span>
        </div>
      </div>

      {/* Period selector */}
      <div style={{
        display: 'flex', gap: 2, padding: 3, borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border,
      }}>
        {['7d', '30d', '90d', 'rok'].map((p, i) => (
          <button key={p} style={{
            padding: '6px 12px', borderRadius: 7,
            background: i === 1 ? 'rgba(91,107,255,0.2)' : 'transparent',
            border: 'none',
            color: i === 1 ? '#fff' : T.muted,
            fontFamily: T.fontMono, fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}>{p}</button>
        ))}
      </div>

      <button style={{
        width: 38, height: 38, borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border,
        color: T.muted, cursor: 'pointer',
        display: 'grid', placeItems: 'center', position: 'relative',
      }}>
        <Icon name="bell-bold" size={18} color={T.light} />
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 7, height: 7, borderRadius: 999, background: T.destructive,
          border: '2px solid #07071a',
        }} />
      </button>

      <button
        onClick={onSignOut}
        title="Odhlásit se"
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.22)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.6)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; }}
        style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
          color: '#f87171', cursor: 'pointer',
          display: 'grid', placeItems: 'center',
          transition: 'background .15s, border-color .15s',
        }}>
        <Icon name="logout-2-bold" size={18} color="#f87171" />
      </button>

      <button onClick={onNew} style={{
        padding: '10px 16px', borderRadius: 10,
        background: 'linear-gradient(135deg, #0020F6, #2D2CA7)',
        border: 'none', color: '#fff', cursor: 'pointer',
        fontFamily: T.fontUI, fontSize: 13, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 7,
        boxShadow: '0 6px 16px rgba(0,32,246,0.4)',
      }}>
        <Icon name="add-circle-bold" size={16} color="#fff" />
        Nový inzerát
      </button>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// CHARTS — pure SVG, no deps
// ─────────────────────────────────────────────────────────────

// Sparkline — tiny line for KPI cards
function Sparkline({ data, color = T.primary, width = 100, height = 32 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * height]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  const id = useMemoE(() => 'sg-' + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// Big area chart
function AreaChart({ series, width = 600, height = 220, labels = [] }) {
  const all = series.flatMap(s => s.data);
  const max = Math.max(...all) * 1.15;
  const min = 0;
  const range = max - min || 1;
  const padL = 36, padB = 24, padT = 8, padR = 8;
  const W = width - padL - padR, H = height - padT - padB;
  const stepX = W / (series[0].data.length - 1);

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => min + (range * i / ticks));

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={`ac-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {/* grid */}
      {yTicks.map((v, i) => {
        const y = padT + H - ((v - min) / range) * H;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={padL - 8} y={y + 3} textAnchor="end" fill={T.mutedSoft} fontFamily={T.fontMono} fontSize="9.5">
              {Math.round(v).toLocaleString('cs-CZ')}
            </text>
          </g>
        );
      })}
      {/* x-axis labels */}
      {labels.map((l, i) => {
        if (i % Math.ceil(labels.length / 6) !== 0) return null;
        const x = padL + i * stepX;
        return <text key={i} x={x} y={height - 6} textAnchor="middle" fill={T.mutedSoft} fontFamily={T.fontMono} fontSize="9.5">{l}</text>;
      })}
      {/* series */}
      {series.map((s, idx) => {
        const pts = s.data.map((v, i) => [padL + i * stepX, padT + H - ((v - min) / range) * H]);
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
        const area = `${path} L${padL + W},${padT + H} L${padL},${padT + H} Z`;
        return (
          <g key={idx}>
            <path d={area} fill={`url(#ac-${idx})`} />
            <path d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => i === pts.length - 1 ? (
              <g key={i}>
                <circle cx={p[0]} cy={p[1]} r="6" fill={s.color} opacity="0.18" />
                <circle cx={p[0]} cy={p[1]} r="3.2" fill={s.color} />
                <circle cx={p[0]} cy={p[1]} r="3.2" fill="none" stroke="#fff" strokeWidth="1.2" />
              </g>
            ) : null)}
          </g>
        );
      })}
    </svg>
  );
}

// Bars
function BarChart({ data, width = 360, height = 180, color = T.primary }) {
  const max = Math.max(...data.map(d => d.v)) * 1.1;
  const padL = 32, padB = 22, padT = 4, padR = 4;
  const W = width - padL - padR, H = height - padT - padB;
  const bw = (W / data.length) * 0.6;
  const gap = (W / data.length) * 0.4;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {[0, 0.5, 1].map((t, i) => {
        const y = padT + H - t * H;
        return <line key={i} x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(255,255,255,0.05)" />;
      })}
      {data.map((d, i) => {
        const h = (d.v / max) * H;
        const x = padL + i * (bw + gap) + gap / 2;
        const y = padT + H - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} rx="3" fill={d.color || color} opacity="0.85" />
            <text x={x + bw / 2} y={y - 4} textAnchor="middle" fill={T.light} fontFamily={T.fontMono} fontSize="9.5" fontWeight="700">{d.v}</text>
            <text x={x + bw / 2} y={height - 6} textAnchor="middle" fill={T.mutedSoft} fontFamily={T.fontUI} fontSize="9.5">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Donut
function Donut({ data, size = 140, thickness = 18 }) {
  const total = data.reduce((a, b) => a + b.v, 0);
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const dash = (d.v / total) * c;
        const off = -acc;
        acc += dash;
        return (
          <circle key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${c}`}
            strokeDashoffset={off}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// COMMON — Card + KPI + Section
// ─────────────────────────────────────────────────────────────
function ECard({ children, style, padding = 22 }) {
  return (
    <div style={{
      borderRadius: 18,
      background: 'linear-gradient(180deg, rgba(22,22,59,0.6), rgba(15,15,40,0.4))',
      border: '1px solid ' + T.border,
      padding,
      backdropFilter: 'blur(8px)',
      ...style,
    }}>{children}</div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
      <div>
        <div style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.2 }}>{title}</div>
        {subtitle ? <div style={{ fontFamily: T.fontUI, fontSize: 12, color: T.muted, marginTop: 2 }}>{subtitle}</div> : null}
      </div>
      {action || null}
    </div>
  );
}

Object.assign(window, { ELogo, ESidebar, ETopbar, Sparkline, AreaChart, BarChart, Donut, ECard, SectionHeader });
