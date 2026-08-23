// Makej Employer — Dashboard (varianta 1d: modrá hlavička + pás metrik + pipeline + plán/živě/recenze)
// Reuses T, E_KPIS, E_JOBS, E_CANDIDATES, E_ACTIVITY, E_REVIEWS, E_THREADS, window.empOpenProfile

// ── Výběr období: vlastní bílo-modrá roletka + „Vlastní" rozsah přes vodorovná kolečka
//    (stejný vizuál i chování jako výběr data narození v brigádnické appce: WWheel/WDatumPicker) ──
const _EMES  = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
const _EROKY = (() => { const y = new Date().getFullYear(); const a = []; for (let r = y; r >= y - 6; r--) a.push(r); return a; })();
const _eIso   = d => d.toISOString().slice(0, 10);
const _eRozloz = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); const t = new Date(); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() }; };
const _eFmt      = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? (+m[3] + '. ' + (+m[2]) + '. ' + m[1]) : ''; };
const _eFmtShort = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? (+m[3] + '. ' + (+m[2]) + '.') : ''; };

// Vodorovné „kolečko" — roluješ do středu, prostřední položka se vybere (port WWheel).
function EWheel({ items, index, itemW, onIndex }) {
  const boxRef = useRefE(null);
  const timRef = useRefE(null);
  useEffectE(() => { const el = boxRef.current; if (el) el.scrollLeft = index * itemW; return () => clearTimeout(timRef.current); }, []);
  function onScroll() {
    clearTimeout(timRef.current);
    timRef.current = setTimeout(() => {
      const el = boxRef.current; if (!el) return;
      const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollLeft / itemW)));
      if (i !== index) onIndex(i);
    }, 90);
  }
  function klepni(i) { const el = boxRef.current; if (el) el.scrollTo({ left: i * itemW, behavior: 'smooth' }); if (i !== index) onIndex(i); }
  const okraj = 'calc(50% - ' + (itemW / 2) + 'px)';
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: '50%', top: 4, bottom: 4, width: itemW - 10, transform: 'translateX(-50%)', borderRadius: 10, background: 'rgba(27,52,240,0.10)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 28, pointerEvents: 'none', zIndex: 2, background: 'linear-gradient(to right,#fff,rgba(255,255,255,0))' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 28, pointerEvents: 'none', zIndex: 2, background: 'linear-gradient(to left,#fff,rgba(255,255,255,0))' }} />
      <div ref={boxRef} onScroll={onScroll} className="e-wheel" style={{ display: 'flex', overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ flex: '0 0 ' + okraj }} />
        {items.map((it, i) => (
          <button key={i} onClick={() => klepni(i)} style={{ flex: '0 0 ' + itemW + 'px', scrollSnapAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', fontSize: i === index ? 15 : 13.5, fontWeight: i === index ? 800 : 600, color: i === index ? '#1B34F0' : '#7A82A6', transition: 'color .15s, font-size .15s' }}>{it}</button>
        ))}
        <div style={{ flex: '0 0 ' + okraj }} />
      </div>
    </div>
  );
}

// Výběr data přes tři kolečka (den · měsíc · rok) — jako datum narození.
function EDateWheel({ value, onChange }) {
  const [dmy, setDmy] = useStateE(() => _eRozloz(value));
  useEffectE(() => { setDmy(_eRozloz(value)); }, [value]);
  const dim = new Date(dmy.y, dmy.m + 1, 0).getDate();
  const DNY = []; for (let d = 1; d <= dim; d++) DNY.push(d);
  function zmen(nove) {
    const next = { ...dmy, ...nove };
    const di = new Date(next.y, next.m + 1, 0).getDate();
    if (next.d > di) next.d = di;
    setDmy(next);
    onChange(next.y + '-' + String(next.m + 1).padStart(2, '0') + '-' + String(next.d).padStart(2, '0'));
  }
  return (
    <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 12, padding: '8px 0', overflow: 'hidden' }}>
      <EWheel key={'d-' + dmy.y + '-' + dmy.m} items={DNY} index={dmy.d - 1} itemW={54} onIndex={i => zmen({ d: i + 1 })} />
      <div style={{ height: 1, background: '#F0F2FA', margin: '6px 12px' }} />
      <EWheel items={_EMES} index={dmy.m} itemW={112} onIndex={i => zmen({ m: i })} />
      <div style={{ height: 1, background: '#F0F2FA', margin: '6px 12px' }} />
      <EWheel items={_EROKY} index={Math.max(0, _EROKY.indexOf(dmy.y))} itemW={80} onIndex={i => zmen({ y: _EROKY[i] })} />
    </div>
  );
}

// Roletka výběru období: 7/30/90 dní · Rok · Vlastní (od–do přes kolečka).
function EPeriodPicker({ value, onChange }) {
  const [open, setOpen] = useStateE(false);
  const [showCustom, setShowCustom] = useStateE(false);
  const isCustom = value && typeof value === 'object';
  const [from, setFrom] = useStateE(isCustom ? value.from : _eIso(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = useStateE(isCustom ? value.to : _eIso(new Date()));
  const ref = useRefE(null);
  useEffectE(() => {
    if (!open) return;
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setShowCustom(false); } };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [open]);

  const presets = [['7d', '7 dní'], ['30d', '30 dní'], ['90d', '90 dní'], ['rok', 'Rok']];
  const label = isCustom ? (_eFmtShort(value.from) + ' – ' + _eFmtShort(value.to)) : ((presets.find(p => p[0] === value) || ['', '30 dní'])[1]);
  const pickPreset = k => { onChange(k); setOpen(false); setShowCustom(false); };
  const applyCustom = () => { let a = from, b = to; if (new Date(a) > new Date(b)) { const t = a; a = b; b = t; } onChange({ from: a, to: b }); setOpen(false); setShowCustom(false); };
  const optStyle = active => ({ display: 'block', width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: active ? '#EEF1FF' : 'transparent', color: active ? '#1B34F0' : '#0B1233', fontSize: 13.5, fontWeight: active ? 800 : 600, cursor: 'pointer' });

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.16)', padding: '9px 14px', borderRadius: 9, border: 'none', cursor: 'pointer' }}>{label}</button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 60, width: showCustom ? 300 : 172, background: '#fff', border: '1px solid #E6E9F5', borderRadius: 12, boxShadow: '0 18px 40px -14px rgba(20,22,40,.28)', overflow: 'hidden' }}>
          {presets.map(([k, l]) => <button key={k} onClick={() => pickPreset(k)} style={optStyle(!isCustom && value === k)}>{l}</button>)}
          <button onClick={() => setShowCustom(s => !s)} style={{ ...optStyle(isCustom || showCustom), borderTop: '1px solid #F0F2FA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Vlastní <span style={{ fontSize: 11 }}>{showCustom ? '▴' : '▾'}</span>
          </button>
          {showCustom && (
            <div style={{ padding: '10px 12px 12px', borderTop: '1px solid #F0F2FA', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#A6ADCB', textTransform: 'uppercase' }}>Od</div>
              <EDateWheel value={from} onChange={setFrom} />
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: '#A6ADCB', textTransform: 'uppercase', marginTop: 2 }}>Do</div>
              <EDateWheel value={to} onChange={setTo} />
              <button onClick={applyCustom} style={{ marginTop: 4, padding: '10px', borderRadius: 9, background: '#1B34F0', color: '#fff', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Použít</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EDashboard({ period = '30d', onTab, onNew, onPeriod, onSignOut }) {
  // CSS řetězec → React style objekt (aby šel referenční markup portovat 1:1)
  const sx = str => {
    const o = {};
    (str || '').split(';').forEach(p => {
      const i = p.indexOf(':'); if (i < 0) return;
      let k = p.slice(0, i).trim(); const v = p.slice(i + 1).trim();
      if (!k) return;
      k = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      o[k] = v;
    });
    return o;
  };
  const fmt = n => Number(n || 0).toLocaleString('cs-CZ').replace(/,/g, ' ');
  const pct = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
  const go = tab => () => onTab && onTab(tab);
  const openCand = c => () => {
    if (c && c.worker_id && window.empOpenProfile) window.empOpenProfile(c.worker_id, { name: c.name, level: c.level, jobs_done: c.jobsDone, rating: c.rating });
    else if (onTab) onTab('candidates');
  };

  // ── Období: jednotné GLOBÁLNÍ (preset '7d'/'30d'/'90d'/'rok' NEBO {from,to} pro „Vlastní").
  //    Roletka mění period v shellu (onPeriod = setPeriod), takže je synchronizovaná napříč stránkami. ──
  const range = period;
  const isCustom = range && typeof range === 'object';

  // Zhlédnutí/Swipe škálované obdobím (jako dřív); u „Vlastní" úměrně počtu dnů.
  const BASE_V = [320,380,420,510,480,560,620,590,670,720,760,820,880,940,1010,1080,1140,1200,1280,1340,1410,1480,1540,1620,1700,1780,1860,1940,2030,2120];
  const BASE_S = [80,95,110,130,125,145,160,155,170,185,195,210,225,240,260,275,290,310,330,350,365,385,410,430,455,475,495,520,545,568];
  const BASE_M = [8,10,12,15,13,17,19,18,21,23,25,27,29,32,35,37,40,42,45,48,50,53,56,59,62,65,68,72,75,78];
  const customDays = isCustom ? Math.max(1, Math.round((new Date(range.to) - new Date(range.from)) / 86400000) + 1) : 0;
  const scale = arr => {
    if (isCustom) { const m = customDays / 30; return arr.map(x => Math.round(x * m)); }
    return range === '7d' ? arr.slice(-7)
      : range === '90d' ? arr.map(x => Math.round(x * 2.85))
      : range === 'rok' ? arr.map(x => Math.round(x * 10.5)) : arr;
  };
  const seriesV = scale(BASE_V), seriesS = scale(BASE_S), seriesM = scale(BASE_M);
  const views  = seriesV.reduce((a, b) => a + b, 0);
  const swipes = seriesS.reduce((a, b) => a + b, 0);
  const swipeRate = views > 0 ? swipes / views * 100 : 0;
  const micro = arr => { const l = arr.slice(-5); const mx = Math.max.apply(null, l.concat(1)); return l.map(x => Math.max(15, Math.round(x / mx * 100))); };

  const kOf = id => (E_KPIS.find(k => k.id === id) || {});
  const jobs = E_JOBS || [];
  const matches = kOf('matches').value != null ? kOf('matches').value : jobs.reduce((a, j) => a + (j.matches || 0), 0);
  const hires   = kOf('hired').value   != null ? kOf('hired').value   : jobs.reduce((a, j) => a + (j.hired || 0), 0);
  const hireRate = matches > 0 ? hires / matches * 100 : 0;
  const rk = kOf('rating');
  const ratingStr = (rk.value != null ? String(rk.value) : '–').replace('.', ',');
  const ratingCount = rk.count != null ? rk.count : 0;
  const activeJobs = kOf('jobs').value != null ? kOf('jobs').value : jobs.filter(j => j.status === 'active' || j.status === 'urgent').length;
  const totalJobs  = kOf('jobs').max   != null ? kOf('jobs').max   : jobs.length;
  const rangeLbl = isCustom ? (_eFmt(range.from) + ' – ' + _eFmt(range.to)) : ({ '7d': '7 dní', '30d': '30 dní', '90d': '90 dní', 'rok': '12 měsíců' }[range] || '30 dní');

  const metrics = [
    { label: 'Zhlédnutí',   value: fmt(views),  chart: micro(seriesV), accent: '#fff' },
    { label: 'Swipe right', value: fmt(swipes), pill: pct(swipeRate) + ' %' },
    { label: 'Matche',      value: fmt(matches), chart: micro(seriesM), accent: '#FFC46B' },
    { label: 'Najato',      value: fmt(hires),  sub: pct(hireRate) + ' % z matchů' },
    { label: 'Hodnocení',   value: ratingStr, star: true, sub: ratingCount + ' hodnocení' },
  ];

  // ── Pipeline kandidátů (mapování na E_CANDIDATES) ──
  const PIP = {
    blue:  { pill: '#1B34F0', pillBg: '#EEF1FF', chipBg: '#F6F7FC', meta: '#7A82A6' },
    amber: { pill: '#fff',    pillBg: '#F5920B', chipBg: '#FFF8EE', meta: '#B96F06' },
    green: { pill: '#0B7B4B', pillBg: '#E6F7EF', chipBg: '#E6F7EF', meta: '#0B7B4B' },
  };
  const cand = E_CANDIDATES || {};
  const cols = [
    { key: 'new',       title: 'Nový match',      list: cand.new || [],       tone: PIP.blue,  meta: c => [c.jobTitle || (c.tags && c.tags[0]) || '', c.lastSeen].filter(Boolean).join(' · ') },
    { key: 'awaiting',  title: 'Čeká na odpověď', list: cand.shortlist || [], tone: PIP.amber, highlight: true, meta: c => c.lastSeen ? ('naposled ' + c.lastSeen) : 'čeká na odpověď' },
    { key: 'interview', title: 'Na pohovoru',     list: cand.interview || [], tone: PIP.blue,  meta: c => c.interview || 'pohovor domluven' },
    { key: 'hired',     title: 'Najato',          list: cand.hired || [],     tone: PIP.green, meta: c => c.shift || (c.jobTitle ? ('nástup · ' + c.jobTitle) : 'najato') },
  ];
  const pipeTotal = cols.reduce((a, c) => a + c.list.length, 0);

  // ── Tabulka inzerátů ──
  const jobRows = jobs.slice(0, 5);
  const maxV = Math.max.apply(null, jobRows.map(j => j.views || 0).concat(1));
  const maxS = Math.max.apply(null, jobRows.map(j => j.swipes || 0).concat(1));

  // ── Plán směn (zatím ukázková data — až bude API pro směny, napojit) ──
  const week = [
    { d: 'Po', v: '3', st: 'ok' }, { d: 'Út', v: '3', st: 'ok' }, { d: 'St', v: '4/5', st: 'warn' },
    { d: 'Čt', v: '4', st: 'ok' }, { d: 'Pá', v: '4', st: 'ok' }, { d: 'So', v: '—', st: 'off' }, { d: 'Ne', v: '—', st: 'off' },
  ];
  const dayStyle = { ok: 'background:#EEF1FF;color:#1B34F0', warn: 'background:#FFF3E0;color:#B96F06;border:1.5px solid #F5920B', off: 'background:#F6F7FC;color:#A6ADCB' };

  // ── Recenze ──
  const lastRev = (E_REVIEWS && E_REVIEWS[0])
    || (rk.lastReview ? { text: rk.lastReview.text, author: rk.lastReview.reviewer, when: rk.lastReview.when } : null);

  return (
    <div style={{ padding: 20, height: '100%', boxSizing: 'border-box' }}>
      <div style={sx('background:#F1F3FB;border:1px solid #DDE1F0;border-radius:22px;overflow:hidden;height:100%;display:flex;flex-direction:column')}>

        {/* Modrá hlavička — připnutá (nescrolluje) */}
        <div style={sx('background:#1B34F0;padding:14px 26px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;flex:none')}>
          <div style={sx('display:flex;align-items:center;gap:14px;min-width:0')}>
            <span style={sx('font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em')}>Dashboard</span>
            <span style={sx('width:1px;height:22px;background:rgba(255,255,255,.28)')} />
            <span style={sx('font-size:14px;color:#C7D0FF')}>{rangeLbl} · {activeJobs} aktivních inzerátů · {pipeTotal} kandidátů v procesu</span>
          </div>
          <div style={sx('display:flex;align-items:center;gap:10px')}>
            <EPeriodPicker value={range} onChange={onPeriod} />
            <button onClick={onNew} style={sx('font-size:14px;font-weight:800;color:#1B34F0;background:#fff;padding:11px 18px;border-radius:9px;border:none;cursor:pointer')}>+ Nový inzerát</button>
          </div>
        </div>

        {/* Modrý pás metrik — připnutý (nescrolluje) */}
        <div style={sx('background:#1B34F0;display:grid;grid-template-columns:repeat(5,1fr);padding-bottom:6px;flex:none')}>
          {metrics.map((m, i) => (
            <div key={i} style={sx('padding:6px 24px 12px;display:flex;flex-direction:column;gap:7px' + (i > 0 ? ';border-left:1px solid rgba(255,255,255,.2)' : ''))}>
              <span style={sx('font-size:11px;font-weight:800;letter-spacing:.09em;color:#A9B7FF;text-transform:uppercase')}>{m.label}</span>
              <div style={sx('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
                {m.star ? (
                  <div style={sx('display:flex;align-items:baseline;gap:5px')}>
                    <span style={sx('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{m.value}</span>
                    <span style={sx('font-size:14px;color:#FFC46B')}>★</span>
                  </div>
                ) : (
                  <span style={sx('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{m.value}</span>
                )}
                {m.chart && (
                  <div style={sx('display:flex;align-items:flex-end;gap:2px;height:24px')}>
                    {m.chart.map((h, j) => <span key={j} style={{ width: 5, height: h + '%', borderRadius: 2, background: j >= m.chart.length - 2 ? m.accent : 'rgba(255,255,255,.3)' }} />)}
                  </div>
                )}
                {m.pill && <span style={sx('font-size:12px;font-weight:800;color:#fff;background:rgba(255,255,255,.16);padding:3px 7px;border-radius:6px')}>{m.pill}</span>}
                {m.sub && <span style={sx('font-size:12px;color:#C7D0FF')}>{m.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Tělo — vejde se celé na jednu obrazovku, žádný scroll (overflow:hidden); rozestupy zhuštěné */}
        <div style={sx('padding:14px 22px 16px;display:grid;grid-template-columns:1fr 336px;gap:16px;align-items:stretch;flex:1;min-height:0;overflow:hidden')}>

          {/* Levý sloupec */}
          <div style={sx('display:flex;flex-direction:column;gap:12px;min-width:0')}>
            <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:16px')}>
              <div style={sx('display:flex;align-items:center;gap:10px')}>
                <span style={sx('font-size:16px;font-weight:800;color:#0B1233')}>Pipeline kandidátů</span>
                <span style={sx('font-size:12px;font-weight:700;color:#7A82A6;background:#fff;border:1px solid #E6E9F5;padding:3px 9px;border-radius:999px')}>Vše {pipeTotal}</span>
              </div>
              <button onClick={go('candidates')} style={sx('font-size:13px;font-weight:700;color:#1B34F0;background:none;border:none;cursor:pointer')}>Kandidáti →</button>
            </div>

            <div style={sx('display:grid;grid-template-columns:repeat(4,1fr);gap:12px')}>
              {cols.map(col => {
                const t = col.tone;
                return (
                  <div key={col.key} style={{ ...sx('background:#fff;border-radius:14px;display:flex;flex-direction:column;gap:9px'), border: col.highlight ? '2px solid #F5920B' : '1px solid #E6E9F5', padding: col.highlight ? 10 : 11 }}>
                    <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:8px')}>
                      <span style={sx('font-size:13px;font-weight:800;color:#0B1233')}>{col.title}</span>
                      <span style={{ ...sx('font-size:12px;font-weight:800;padding:2px 8px;border-radius:999px'), color: t.pill, background: t.pillBg }}>{col.list.length}</span>
                    </div>
                    <div style={sx('display:flex;flex-direction:column;gap:8px')}>
                      {col.list.length === 0 && <span style={sx('font-size:12px;color:#A6ADCB;text-align:center;padding:8px 4px')}>Nikdo tu teď není</span>}
                      {col.list.slice(0, 2).map(c => (
                        <div key={c.id} onClick={openCand(c)} style={{ ...sx('border-radius:10px;padding:11px 12px;display:flex;flex-direction:column;gap:4px;cursor:pointer'), background: t.chipBg }}>
                          <span style={sx('font-size:13px;font-weight:700;color:#0B1233')}>{c.name}</span>
                          <span style={{ ...sx('font-size:11px'), color: t.meta }}>{col.meta(c)}</span>
                        </div>
                      ))}
                      {col.list.length > 2 && <span onClick={go('candidates')} style={sx('font-size:11px;font-weight:700;color:#7A82A6;text-align:center;padding:4px;cursor:pointer')}>+ {col.list.length - 2} dalších</span>}
                      {col.highlight && col.list.length > 0 && <button onClick={go('chat')} style={sx('font-size:12px;font-weight:800;color:#fff;background:#0B1233;border:none;border-radius:9px;padding:9px;text-align:center;cursor:pointer')}>Odpovědět všem</button>}
                      {col.key === 'hired' && col.list.length > 0 && <button onClick={go('calendar')} style={sx('font-size:11px;font-weight:700;color:#7A82A6;background:none;border:none;text-align:center;padding:4px;cursor:pointer')}>Přidat do plánu směn</button>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabulka inzerátů — roste a vyplní zbytek levého sloupce */}
            <div style={sx('background:#fff;border:1px solid #E6E9F5;border-radius:16px;padding:14px 18px;display:flex;flex-direction:column;gap:12px;flex:1;min-height:0')}>
              <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:16px')}>
                <span style={sx('font-size:16px;font-weight:800;color:#0B1233')}>Inzeráty a jejich výkon</span>
                <button onClick={go('jobs')} style={sx('font-size:13px;font-weight:700;color:#1B34F0;background:none;border:none;cursor:pointer')}>Všech {totalJobs} →</button>
              </div>
              <div style={sx('display:flex;flex-direction:column;flex:1;justify-content:space-between')}>
                <div style={sx('display:grid;grid-template-columns:1.5fr 1fr 1fr .8fr 96px;gap:14px;padding:0 2px 8px;font-size:11px;font-weight:800;letter-spacing:.07em;color:#A6ADCB;text-transform:uppercase')}>
                  <span>Pozice</span><span>Zhlédnutí</span><span>Swipe right</span><span style={sx('text-align:right')}>Match</span><span style={sx('text-align:right')}>Stav</span>
                </div>
                {jobRows.length === 0 && (
                  <button onClick={go('jobs')} style={sx('margin-top:8px;font-size:13px;font-weight:800;color:#1B34F0;background:#EEF1FF;border:none;border-radius:10px;padding:14px;text-align:center;cursor:pointer')}>+ Vytvořit první inzerát</button>
                )}
                {jobRows.map(j => {
                  const active = j.status === 'active' || j.status === 'urgent';
                  const vW = Math.round((j.views || 0) / maxV * 100);
                  const sW = Math.round((j.swipes || 0) / maxS * 100);
                  const f1 = active ? '#1B34F0' : '#A6ADCB';
                  const f2 = active ? '#5C71FF' : '#A6ADCB';
                  return (
                    <div key={j.id} onClick={go('jobs')} style={sx('display:grid;grid-template-columns:1.5fr 1fr 1fr .8fr 96px;gap:14px;align-items:center;padding:8px 2px;border-top:1px solid #F0F2FA;cursor:pointer')}>
                      <span style={sx('font-size:14px;font-weight:700;color:#0B1233')}>{j.title}</span>
                      <div style={sx('display:flex;flex-direction:column;gap:5px')}>
                        <span style={sx('font-size:13px;font-weight:600;color:#3A4266')}>{fmt(j.views)}</span>
                        <span style={sx('height:4px;border-radius:999px;background:#EEF1FF;display:block')}><span style={{ display: 'block', width: vW + '%', height: '100%', borderRadius: 999, background: f1 }} /></span>
                      </div>
                      <div style={sx('display:flex;flex-direction:column;gap:5px')}>
                        <span style={sx('font-size:13px;font-weight:600;color:#3A4266')}>{fmt(j.swipes)}</span>
                        <span style={sx('height:4px;border-radius:999px;background:#EEF1FF;display:block')}><span style={{ display: 'block', width: sW + '%', height: '100%', borderRadius: 999, background: f2 }} /></span>
                      </div>
                      <span style={sx('font-size:14px;font-weight:800;color:#0B1233;text-align:right')}>{j.matches || 0}</span>
                      <span style={sx('text-align:right')}><span style={{ ...sx('font-size:11px;font-weight:800;padding:3px 8px;border-radius:6px'), color: active ? '#0FA968' : '#7A82A6', background: active ? '#E6F7EF' : '#F1F3FB' }}>{active ? 'Aktivní' : 'Vypnuto'}</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pravý sloupec */}
          <div style={sx('display:flex;flex-direction:column;gap:12px')}>

            {/* Plán směn */}
            <div style={sx('background:#fff;border:1px solid #E6E9F5;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:12px;flex:1;min-height:0;justify-content:space-between')}>
              <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:12px')}>
                <span style={sx('font-size:15px;font-weight:800;color:#0B1233')}>Plán směn</span>
                <button onClick={go('calendar')} style={sx('font-size:12px;font-weight:700;color:#1B34F0;background:none;border:none;cursor:pointer')}>tento týden →</button>
              </div>
              <div style={sx('display:grid;grid-template-columns:repeat(7,1fr);gap:6px')}>
                {week.map((d, i) => (
                  <div key={i} style={sx('display:flex;flex-direction:column;gap:6px;align-items:center')}>
                    <span style={sx('font-size:11px;font-weight:700;color:' + (d.st === 'warn' ? '#0B1233' : '#A6ADCB'))}>{d.d}</span>
                    <span style={{ ...sx('width:100%;height:44px;border-radius:8px;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;' + dayStyle[d.st]) }}>{d.v}</span>
                  </div>
                ))}
              </div>
              <div onClick={go('calendar')} style={sx('display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:#FFF8EE;border-radius:10px;cursor:pointer')}>
                <span style={sx('font-size:13px;color:#0B1233')}>Středa: 1 směna neobsazená</span>
                <span style={sx('font-size:12px;font-weight:800;color:#B96F06')}>Doplnit</span>
              </div>
            </div>

            {/* Živě */}
            <div style={sx('background:#fff;border:1px solid #E6E9F5;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:11px;flex:1;min-height:0')}>
              <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:12px')}>
                <div style={sx('display:flex;align-items:center;gap:8px')}>
                  <span style={sx('width:7px;height:7px;border-radius:50%;background:#0FA968')} />
                  <span style={sx('font-size:15px;font-weight:800;color:#0B1233')}>Živě</span>
                </div>
                <span style={sx('font-size:12px;color:#7A82A6')}>24 h</span>
              </div>
              <div style={sx('display:flex;flex-direction:column;gap:11px;flex:1;justify-content:space-between')}>
                {(E_ACTIVITY || []).slice(0, 5).map((a, i) => (
                  <div key={i} style={sx('display:flex;gap:10px;align-items:baseline')}>
                    <span style={sx('font-size:11px;color:#A6ADCB;width:74px;flex:none')}>{a.when}</span>
                    <span style={sx('font-size:13px;color:#0B1233;line-height:1.4')}><b>{a.who}</b> {a.what}</span>
                  </div>
                ))}
                {(!E_ACTIVITY || E_ACTIVITY.length === 0) && <span style={sx('font-size:12px;color:#A6ADCB')}>Zatím žádná aktivita</span>}
              </div>
            </div>

            {/* Recenze */}
            <div style={sx('background:#fff;border:1px solid #E6E9F5;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px;flex:1;min-height:0;justify-content:space-between')}>
              <div style={sx('display:flex;align-items:center;justify-content:space-between;gap:12px')}>
                <span style={sx('font-size:15px;font-weight:800;color:#0B1233')}>Recenze</span>
                <span style={sx('font-size:12px;font-weight:800;color:#B96F06;background:#FFF3E0;padding:3px 8px;border-radius:999px')}>{ratingCount} {ratingCount === 1 ? 'hodnocení' : 'hodnocení'}</span>
              </div>
              <div style={sx('display:flex;align-items:baseline;gap:8px')}>
                <span style={sx('font-size:28px;font-weight:800;color:#0B1233;letter-spacing:-.02em')}>{ratingStr}</span>
                <span style={sx('font-size:14px;color:#F5920B;letter-spacing:.06em')}>★★★★★</span>
              </div>
              {lastRev && <span style={sx('font-size:13px;color:#3A4266')}>„{lastRev.text}" — {lastRev.author}{lastRev.when ? (', ' + lastRev.when) : ''}</span>}
              <button onClick={go('reviews')} style={sx('font-size:12px;font-weight:800;color:#1B34F0;background:none;border:1px solid #D5DAF0;border-radius:9px;padding:9px;text-align:center;cursor:pointer')}>Reagovat</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EDashboard });
