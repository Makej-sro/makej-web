// Makej Employer — Inzeráty (jobs management) + Kandidáti (kanban)

function ClockIcon({ size = 22, color = '#5B6BFF' }) {
  const minRef = useRefE(null);
  const hrRef  = useRefE(null);
  const state  = useRefE({ start: null, lastRev: 0 });

  useEffectE(() => {
    const cx = size / 2, cy = size / 2, R = size / 2 - 1.5;
    const minLen = R * 0.68, hrLen = R * 0.44;
    const SPEED = 360 / 20000; // plná otáčka za 20 s
    let id;
    function tick(ts) {
      if (!state.current.start) state.current.start = ts;
      const deg = (ts - state.current.start) * SPEED;
      const minAngle = deg % 360;
      const rev = Math.floor(deg / 360);
      if (minRef.current) {
        const r = (minAngle - 90) * Math.PI / 180;
        minRef.current.setAttribute('x2', cx + minLen * Math.cos(r));
        minRef.current.setAttribute('y2', cy + minLen * Math.sin(r));
      }
      if (rev > state.current.lastRev && hrRef.current) {
        state.current.lastRev = rev;
        const hrAngle = 60 + rev * 30;
        const r = (hrAngle - 90) * Math.PI / 180;
        hrRef.current.setAttribute('x2', cx + hrLen * Math.cos(r));
        hrRef.current.setAttribute('y2', cy + hrLen * Math.sin(r));
      }
      id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const cx = size / 2, cy = size / 2, R = size / 2 - 1.5;
  const minLen = R * 0.68, hrLen = R * 0.44;
  const hrRad0 = (60 - 90) * Math.PI / 180;
  const ticks = [0, 90, 180, 270].map(deg => {
    const r = (deg - 90) * Math.PI / 180;
    return { x1: cx+(R-0.5)*Math.cos(r), y1: cy+(R-0.5)*Math.sin(r), x2: cx+(R-3.8)*Math.cos(r), y2: cy+(R-3.8)*Math.sin(r) };
  });
  const dots = [45, 135, 225, 315].map(deg => {
    const r = (deg - 90) * Math.PI / 180, dr = R - 2.8;
    return { x: cx + dr * Math.cos(r), y: cy + dr * Math.sin(r) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0, display: 'block' }}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth={2.2} />
      {ticks.map((t, i) => <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={color} strokeWidth={2} strokeLinecap="round" />)}
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={1.4} fill={color} />)}
      <line ref={hrRef} x1={cx} y1={cy} x2={cx+hrLen*Math.cos(hrRad0)} y2={cy+hrLen*Math.sin(hrRad0)} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <line ref={minRef} x1={cx} y1={cy} x2={cx} y2={cy-minLen} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={2} fill={color} />
    </svg>
  );
}

function JobCountdown({ activeUntil, status }) {
  const [now, setNow] = useStateE(() => new Date());
  useEffectE(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, activeUntil - now);
  if (diff === 0) return (
    <span style={{ color: '#f43f5e', fontFamily: T.fontMono, fontSize: 12, fontWeight: 800 }}>Vypršelo</span>
  );
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  const secs  = Math.floor((diff % 60000) / 1000);
  const col = days === 0 ? '#f43f5e' : days <= 3 ? '#FFD166' : T.cardText;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, fontFamily: T.fontMono }}>
      {days > 0 ? (
        <>
          <span style={{ fontSize: 17, fontWeight: 800, color: col, letterSpacing: -0.5 }}>{days}</span>
          <span style={{ fontSize: 10, color: T.cardMuted, fontWeight: 600, marginRight: 5 }}>d</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: col, letterSpacing: -0.5 }}>{String(hours).padStart(2,'0')}</span>
          <span style={{ fontSize: 10, color: T.cardMuted, fontWeight: 600 }}>h</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#f43f5e', letterSpacing: -0.5 }}>{String(hours).padStart(2,'0')}</span>
          <span style={{ fontSize: 10, color: T.cardMuted, fontWeight: 600, marginRight: 5 }}>h</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#f43f5e', letterSpacing: -0.5 }}>{String(mins).padStart(2,'0')}</span>
          <span style={{ fontSize: 10, color: T.cardMuted, fontWeight: 600, marginRight: 5 }}>m</span>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#f43f5e', letterSpacing: -0.5 }}>{String(secs).padStart(2,'0')}</span>
          <span style={{ fontSize: 10, color: T.cardMuted, fontWeight: 600 }}>s</span>
        </>
      )}
    </div>
  );
}

const STATUS_META = {
  active: { label: 'Aktivní', color: '#5BD68A', dot: true },
  urgent: { label: 'ASAP · spěchá', color: '#f43f5e', dot: true, pulse: true },
  paused: { label: 'Neaktivní', color: '#9AA0AE' },
  filled: { label: 'Naplněno', color: '#8AB4FF' },
};

// Maximální počet současně aktivních inzerátů podle tarifu firmy (viz PLANS v employer-pages3.jsx).
// Firma může mít libovolně mnoho předpřipravených (neaktivních) inzerátů, ale aktivních jen do limitu.
const EMPLOYER_MAX_ACTIVE = { zakladni: 1, vyhodny: 2, dynamicky: 5, maximalni: 10, vlastni: Infinity };

function _employerPlanTier() {
  const planName = ((typeof ECOMPANY !== 'undefined' && ECOMPANY.plan) || '').toLowerCase();
  if (planName.includes('enterprise') || planName.includes('vlastní') || planName.includes('vlastni')) return 'vlastni';
  if (planName.includes('business') || planName.includes('premium') || planName.includes('maximální') || planName.includes('maximalni')) return 'maximalni';
  if (planName.includes('dynamick')) return 'dynamicky';
  if (planName.includes('standard') || planName.includes('výhodný') || planName.includes('vyhodny')) return 'vyhodny';
  return 'zakladni';
}

// Akční tlačítko inzerátu — v klidu černobílé, po najetí myší se zbarví do modra.
function EActionButton({ icon, label, onClick }) {
  const [hover, setHover] = useStateE(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
        fontFamily: T.fontUI, fontSize: 12, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'background .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease',
        background: hover ? 'rgba(0,32,246,0.08)' : '#F3F4F6',
        border: '1px solid ' + (hover ? 'rgba(0,32,246,0.30)' : '#E5E7EB'),
        color: hover ? '#0020F6' : '#4B5563',
        boxShadow: hover ? '0 2px 10px rgba(0,32,246,0.14)' : 'none',
      }}
    >
      <Icon name={icon} size={13} color={hover ? '#0020F6' : '#6B7280'} />
      {label}
    </button>
  );
}

function EJobsOld({ onTab }) {
  const [filter, setFilter] = useStateE('active');
  const [search, setSearch] = useStateE('');
  const [sort, setSort] = useStateE('newest');
  const [minPay, setMinPay] = useStateE('');
  const [maxPay, setMaxPay] = useStateE('');
  const [statsJob, setStatsJob] = useStateE(null);
  // Lokální přepis stavu inzerátu (aktivní/neaktivní). Zatím jen v prohlížeči — až přibude
  // updateJobStatus v Supabase vrstvě, stačí sem přidat volání a zbytek se nemění.
  // TODO: perzistovat do Supabase (jobs.status) + budoucí automatické časování aktivace.
  const [statusOverrides, setStatusOverrides] = useStateE({});
  const [openStatusMenu, setOpenStatusMenu] = useStateE(null);
  const [limitModal, setLimitModal] = useStateE(false);
  const [confirmJob, setConfirmJob] = useStateE(null);

  const ALL_CANDS_FLAT = buildCandsFlat();

  // Efektivní stav = lokální přepis, jinak stav z dat
  const jobsEff = E_JOBS.map(j => ({ ...j, status: statusOverrides[j.id] || j.status }));

  const planTier    = _employerPlanTier();
  const activeLimit = EMPLOYER_MAX_ACTIVE[planTier] != null ? EMPLOYER_MAX_ACTIVE[planTier] : Infinity;
  const activeCount = jobsEff.filter(j => j.status === 'active' || j.status === 'urgent').length;

  function applyJobStatus(job, next) {
    setStatusOverrides(o => ({ ...o, [job.id]: next }));
  }

  function setJobStatus(job, next) {
    setOpenStatusMenu(null);
    const cur = statusOverrides[job.id] || job.status;
    if (cur === next) return;
    const curActive  = cur === 'active' || cur === 'urgent';
    const nextActive = next === 'active';
    if (nextActive && !curActive && activeCount >= activeLimit) {
      setLimitModal(true);
      return;
    }
    // Deaktivace aktivního inzerátu — vyžádat potvrzení
    if (next === 'paused' && curActive) {
      setConfirmJob(job);
      return;
    }
    applyJobStatus(job, next);
  }

  const filtered = React.useMemo(() => {
    let jobs = filter === 'all' ? jobsEff : jobsEff.filter(j => j.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      jobs = jobs.filter(j =>
        (j.title || '').toLowerCase().includes(q) ||
        String(j.pay).includes(q) ||
        (j.location || '').toLowerCase().includes(q)
      );
    }
    if (minPay !== '') jobs = jobs.filter(j => Number(j.pay) >= Number(minPay));
    if (maxPay !== '') jobs = jobs.filter(j => Number(j.pay) <= Number(maxPay));
    jobs = [...jobs].sort((a, b) => {
      if (sort === 'newest')   return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sort === 'oldest')   return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sort === 'pay_desc') return Number(b.pay) - Number(a.pay);
      if (sort === 'pay_asc')  return Number(a.pay) - Number(b.pay);
      if (sort === 'matches')  return b.matches - a.matches;
      return 0;
    });
    return jobs;
  }, [filter, search, sort, minPay, maxPay, statusOverrides]);

  const inputStyle = {
    paddingLeft: 10, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
    borderRadius: 9, background: '#F9FAFB', border: '1px solid #E5E7EB',
    color: '#111827', fontFamily: T.fontUI, fontSize: 12.5, outline: 'none',
  };

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18, background: '#ffffff' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Aktivních', value: activeCount, sub: activeLimit === Infinity ? 'bez limitu' : `z ${activeLimit} v tarifu`, color: '#5BD68A' },
          { label: 'Celkem zhlédnutí', value: jobsEff.reduce((a,j)=>a+j.views,0).toLocaleString('cs-CZ').replace(/,/g,' '), sub: 'za 30 dní', color: '#5B6BFF' },
          { label: 'Průměrný CTR', value: (jobsEff.length ? (jobsEff.reduce((a,j)=>a+j.ctr,0)/jobsEff.length) : 0).toFixed(1)+'%', sub: 'swajp → match', color: '#FFD166' },
          { label: 'Najato celkem', value: jobsEff.reduce((a,j)=>a+j.hired,0), sub: 'v tomto měsíci', color: '#5BD68A' },
        ].map((s, i) => (
          <ECard key={i} padding={16}>
            <div style={{ color: T.cardMuted, fontSize: 11, fontFamily: T.fontUI, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 24, fontWeight: 700, color: T.cardText, letterSpacing: -0.8 }}>{s.value}</div>
              <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.cardMuted }}>{s.sub}</div>
            </div>
          </ECard>
        ))}
      </div>

      {/* Filter + search row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {[
          { k: 'all', l: 'Vše', n: jobsEff.length },
          { k: 'active', l: 'Aktivní', n: jobsEff.filter(j=>j.status==='active').length },
          { k: 'urgent', l: 'ASAP', n: jobsEff.filter(j=>j.status==='urgent').length },
          { k: 'paused', l: 'Neaktivní', n: jobsEff.filter(j=>j.status==='paused').length },
          { k: 'filled', l: 'Naplněno', n: jobsEff.filter(j=>j.status==='filled').length },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            padding: '8px 14px', borderRadius: 9,
            background: filter === f.k ? 'rgba(0,32,246,0.08)' : '#F9FAFB',
            border: '1px solid ' + (filter === f.k ? 'rgba(0,32,246,0.3)' : '#E5E7EB'),
            color: filter === f.k ? '#0020F6' : '#6B7280',
            fontFamily: T.fontUI, fontSize: 12.5, fontWeight: filter === f.k ? 700 : 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 7,
          }}>
            {f.l}
            <span style={{ fontFamily: T.fontMono, fontSize: 11, opacity: 0.7 }}>{f.n}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* Mzda od–do */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#6B7280', fontFamily: T.fontUI }}>Kč/h</span>
          <input
            value={minPay} onChange={e => setMinPay(e.target.value)}
            placeholder="od" type="number" min="0"
            style={{ ...inputStyle, width: 58, textAlign: 'center' }}
          />
          <span style={{ color: '#6B7280', fontSize: 12 }}>–</span>
          <input
            value={maxPay} onChange={e => setMaxPay(e.target.value)}
            placeholder="do" type="number" min="0"
            style={{ ...inputStyle, width: 58, textAlign: 'center' }}
          />
        </div>
        {/* Řazení */}
        <select value={sort} onChange={e => setSort(e.target.value)} style={{
          ...inputStyle, paddingLeft: 10, paddingRight: 24, cursor: 'pointer',
          appearance: 'none', WebkitAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
        }}>
          <option value="newest">Nejnovější</option>
          <option value="oldest">Nejstarší</option>
          <option value="pay_desc">Nejvyšší mzda</option>
          <option value="pay_asc">Nejnižší mzda</option>
          <option value="matches">Nejvíce matchů</option>
        </select>
        {/* Vyhledávání */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}>
            <Icon name="magnifer-linear" size={12} color="#9CA3AF" />
          </span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Hledat inzerát…"
            style={{ ...inputStyle, paddingLeft: 32, paddingRight: 12, width: 200 }}
          />
        </div>
      </div>

      {/* Jobs list — analytical cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(j => {
          const status = STATUS_META[j.status];
          let activeUntil;
          if (j.date) {
            let d = new Date(j.date);
            if (isNaN(d.getTime())) {
              const parts = j.date.split('.');
              if (parts.length >= 2) {
                const dy = parseInt(parts[0], 10), mo = parseInt(parts[1], 10) - 1;
                const yr = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
                d = new Date(yr, mo, dy);
              }
            }
            if (!isNaN(d.getTime())) activeUntil = d;
          }
          if (!activeUntil) {
            const planDays = { Starter: 7, Standard: 30, Business: 60 }[j.plan] || 365;
            const created = new Date(j.created_at || Date.now());
            activeUntil = new Date(created.getTime() + planDays * 86400000);
          }
          const now = new Date();
          const fmtD = d => d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
          const daysLeft = Math.ceil((activeUntil - now) / 86400000);
          const plZaj = n => n === 1 ? 'zájemce' : (n >= 2 && n <= 4 ? 'zájemci' : 'zájemců');
          // Fáze náboru — v jaké je inzerát fázi a na čem stojí (reálná data: matches, hired, status)
          const phases = [
            { label: 'Zveřejněno', icon: 'document-text-bold',       reached: true,                  stat: j.created_at ? fmtD(new Date(j.created_at)) : '—' },
            { label: 'Má zájemce', icon: 'heart-bold',               reached: j.matches > 0,         stat: j.matches + ' ' + plZaj(j.matches) },
            { label: 'Nabírá',     icon: 'users-group-rounded-bold', reached: j.hired > 0,           stat: j.hired + ' najato' },
            { label: 'Obsazeno',   icon: 'check-circle-bold',        reached: j.status === 'filled', stat: j.status === 'filled' ? 'hotovo' : '—' },
          ];
          let currentIdx = 0;
          phases.forEach((p, i) => { if (p.reached) currentIdx = i; });
          const btnBase = { padding: '9px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 };
          return (
            <ECard key={j.id} padding={0} style={{ overflow: 'hidden' }}>
              {/* Hlavička */}
              <div style={{ padding: '18px 22px 4px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {(() => {
                  const canToggle = j.status !== 'filled';
                  const isActive = j.status === 'active' || j.status === 'urgent';
                  return (
                    <span style={{ position: 'relative' }}>
                      <button onClick={() => canToggle && setOpenStatusMenu(openStatusMenu === j.id ? null : j.id)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 9px', borderRadius: 6, border: 'none',
                        background: status.color + '22', color: status.color,
                        fontSize: 10, fontWeight: 800, fontFamily: T.fontUI, letterSpacing: 0.5, textTransform: 'uppercase',
                        cursor: canToggle ? 'pointer' : 'default',
                      }}>
                        {status.dot ? <span style={{ width: 6, height: 6, borderRadius: 999, background: status.color, animation: status.pulse ? 'mkBubbleIn 1s infinite alternate' : 'none' }} /> : null}
                        {status.label}
                        {canToggle && <Icon name="alt-arrow-down-line-duotone" size={11} color={status.color} />}
                      </button>
                      {openStatusMenu === j.id && (
                        <>
                          <div onClick={() => setOpenStatusMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 31, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.14)', padding: 5, minWidth: 190 }}>
                            {[
                              { key: 'active', label: 'Aktivní', color: '#5BD68A', desc: 'Vidí ho brigádníci' },
                              { key: 'paused', label: 'Neaktivní', color: '#9AA0AE', desc: 'Skrytý, předpřipravený' },
                            ].map(opt => {
                              const isCur = opt.key === 'active' ? isActive : j.status === opt.key;
                              return (
                                <button key={opt.key} onClick={() => setJobStatus(j, opt.key)} style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7,
                                  background: isCur ? 'rgba(0,32,246,0.05)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                                }}>
                                  <span style={{ width: 8, height: 8, borderRadius: 999, background: opt.color, flexShrink: 0 }} />
                                  <span style={{ flex: 1 }}>
                                    <span style={{ display: 'block', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, color: '#111827' }}>{opt.label}</span>
                                    <span style={{ display: 'block', fontFamily: T.fontUI, fontSize: 10.5, color: '#9CA3AF' }}>{opt.desc}</span>
                                  </span>
                                  {isCur && <Icon name="check-read-linear" size={15} color="#0020F6" />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </span>
                  );
                })()}
                <div style={{ fontFamily: T.fontHead, fontSize: 17, fontWeight: 800, color: T.cardText, letterSpacing: -0.3 }}>{j.title}</div>
                {ALL_CANDS_FLAT.some(c => c.jobTitle === j.title && c.rating >= 4.8 && c.jobsDone >= 15) && (
                  <img src="star.png" title="Má kandidáty Všemi oblíbení" style={{ width: 20, height: 20, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                )}
                {ALL_CANDS_FLAT.some(c => c.jobTitle === j.title && c.workedHere) && (
                  <img src="handshake.png" title="Má kandidáty Už se známe" style={{ width: 20, height: 20, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                )}
                {ALL_CANDS_FLAT.some(c => c.jobTitle === j.title && c.sameIndustry) && (
                  <img src="briefcase.png" title="Má kandidáty s zkušeností" style={{ width: 20, height: 20, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                )}

                <div style={{ flex: 1 }} />

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: T.fontUI, color: T.cardMuted }}>
                  <Icon name="clock-circle-bold" size={13} color={T.cardMutedSoft} />
                  {daysLeft > 0 ? 'Aktivní do' : 'Vypršelo'}
                  <span style={{ fontFamily: T.fontMono, color: T.cardText, fontWeight: 600 }}>{fmtD(activeUntil)}</span>
                  {daysLeft > 0 && (
                    <span style={{ padding: '1px 7px', borderRadius: 999, background: daysLeft <= 3 ? 'rgba(244,63,94,0.12)' : 'rgba(0,32,246,0.07)', color: daysLeft <= 3 ? '#f43f5e' : T.cardMuted, fontFamily: T.fontMono, fontSize: 10, fontWeight: 700 }}>{daysLeft} d</span>
                  )}
                </span>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 13px', borderRadius: 999,
                  background: 'rgba(91,214,138,0.14)', border: '1px solid rgba(91,214,138,0.35)',
                  color: '#3aab63', fontFamily: T.fontMono, fontSize: 14, fontWeight: 800,
                }}>
                  <Icon name="dollar-bold" size={13} color="#3aab63" />
                  {j.pay} Kč/h
                </span>
              </div>

              {/* Tělo: výkon inzerátu + fáze náboru vedle sebe */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'stretch' }}>
                {/* Levá půlka — výkon inzerátu */}
                <div style={{ padding: '16px 24px 20px', borderRight: '1px solid ' + T.cardBorder, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Výkon inzerátu</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, paddingTop: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                      {[
                        { l: 'Zájem', v: j.matches },
                        { l: 'Čeká na vás', v: j.pending != null ? j.pending : Math.max(0, j.matches - j.hired) },
                        { l: 'Najato', v: j.hired },
                      ].map((m, i) => (
                        <div key={i}>
                          <div style={{ color: T.cardMuted, fontSize: 10, fontFamily: T.fontUI, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{m.l}</div>
                          <div style={{ color: T.cardText, fontFamily: T.fontMono, fontSize: 20, fontWeight: 700, marginTop: 3, letterSpacing: -0.6 }}>{Number(m.v).toLocaleString('cs-CZ').replace(/,/g, ' ')}</div>
                        </div>
                      ))}
                      {(() => {
                        const s = (j.hired > 0 || j.status === 'filled')
                          ? { icon: 'check-circle-bold', color: '#3aab63', label: 'Obsazeno' }
                          : (j.status === 'active' || j.status === 'urgent'
                              ? { icon: 'question-circle-bold', color: '#0020F6', label: 'Hledáme' }
                              : { icon: 'close-circle-bold', color: '#f43f5e', label: 'Neobsazeno' });
                        return (
                          <div>
                            <div style={{ color: T.cardMuted, fontSize: 10, fontFamily: T.fontUI, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Stav</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                              <Icon name={s.icon} size={20} color={s.color} />
                              <span style={{ color: s.color, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{s.label}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Pravá půlka — fázový ukazatel */}
                <div style={{ padding: '16px 30px 24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fáze náboru</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 18 }}>
                    <div style={{ position: 'relative' }}>
                      {/* Kolej za uzly */}
                      <div style={{ position: 'absolute', top: 13, left: '12.5%', right: '12.5%', height: 3, background: '#E8EAF0', borderRadius: 2 }} />
                      <div style={{ position: 'absolute', top: 13, left: '12.5%', width: (currentIdx * 25) + '%', height: 3, background: '#0020F6', borderRadius: 2 }} />
                      {/* Uzly */}
                      <div style={{ display: 'flex', position: 'relative', zIndex: 1 }}>
                        {phases.map((p, i) => {
                          const reached = i <= currentIdx;
                          const isCurrent = i === currentIdx;
                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: reached ? '#0020F6' : '#fff',
                                border: reached ? 'none' : '2px solid #E8EAF0',
                                boxShadow: isCurrent ? '0 0 0 4px rgba(0,32,246,0.14)' : 'none',
                                display: 'grid', placeItems: 'center',
                              }}>
                                <Icon name={p.icon} size={15} color={reached ? '#fff' : '#B6BAC3'} />
                              </div>
                              <div style={{ marginTop: 10, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: isCurrent ? 800 : 700, color: reached ? T.cardText : T.cardMutedSoft }}>{p.label}</div>
                              <div style={{ marginTop: 2, fontFamily: T.fontMono, fontSize: 10, color: reached ? T.cardMuted : T.cardMutedSoft }}>{p.stat}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Akce */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderTop: '1px solid ' + T.cardBorder, background: 'rgba(0,32,246,0.015)' }}>
                <EActionButton icon="users-group-rounded-bold" label={`Kandidáti (${j.matches})`} onClick={() => onTab?.('candidates')} />
                <EActionButton icon="graph-up-bold" label="Zobrazit statistiky" onClick={() => setStatsJob(j)} />
                <EActionButton icon="rocket-2-bold" label="Boostnout" />
                <div style={{ flex: 1 }} />
                <button style={{
                  ...btnBase, background: 'transparent', border: '1px solid ' + T.cardBorder, color: T.cardMuted,
                }}><Icon name="pen-2-linear" size={12} color={T.cardMuted}/>Upravit</button>
              </div>
            </ECard>
          );
        })}
      </div>

      {statsJob && <JobStatsDrawer job={statsJob} onClose={() => setStatsJob(null)} />}

      {confirmJob && (
        <div onClick={() => setConfirmJob(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,15,35,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 'min(400px, 100%)', background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.3)' }}>
            <div style={{ fontFamily: T.fontHead, fontSize: 16.5, fontWeight: 800, color: '#111827', marginBottom: 12 }}>Označit jako neaktivní?</div>
            <div style={{ color: '#4B5563', fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Inzerát <strong style={{ color: '#111827' }}>„{confirmJob.title}"</strong> se skryje brigádníkům a přestane sbírat nové zájemce. Můžete ho kdykoli znovu aktivovat.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmJob(null)} style={{
                padding: '9px 16px', borderRadius: 9, background: '#F3F4F6', border: '1px solid #E5E7EB',
                color: '#374151', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              }}>Zrušit</button>
              <button onClick={() => { applyJobStatus(confirmJob, 'paused'); setConfirmJob(null); }} style={{
                padding: '9px 16px', borderRadius: 9, background: '#0020F6', border: 'none',
                color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,32,246,0.25)',
              }}>Opravdu chci inzerát skrýt</button>
            </div>
          </div>
        </div>
      )}

      {limitModal && (
        <div onClick={() => setLimitModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,15,35,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 'min(420px, 100%)', background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 24px 70px rgba(0,0,0,0.3)' }}>
            <div style={{ fontFamily: T.fontHead, fontSize: 16.5, fontWeight: 800, color: '#111827', marginBottom: 12 }}>Limit vašeho tarifu</div>
            <div style={{ color: '#4B5563', fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              Momentálně máte aktivní <strong style={{ color: '#111827' }}>{activeLimit}</strong> {activeLimit === 1 ? 'inzerát' : activeLimit <= 4 ? 'inzeráty' : 'inzerátů'} — to je maximum ve vašem tarifu. Situaci vyřešíte dvěma způsoby:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gridAutoRows: '1fr', gap: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', height: '100%' }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: '#0020F6', color: '#fff', fontFamily: T.fontMono, fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>1</span>
                <span style={{ color: '#374151', fontFamily: T.fontUI, fontSize: 12.5, lineHeight: 1.5 }}>Deaktivujte jeden ze svých aktivních inzerátů a nahraďte ho tímto.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', height: '100%' }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: '#0020F6', color: '#fff', fontFamily: T.fontMono, fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>2</span>
                <span style={{ color: '#374151', fontFamily: T.fontUI, fontSize: 12.5, lineHeight: 1.5 }}>Přejděte na vyšší tarif s více aktivními inzeráty.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button onClick={() => setLimitModal(false)} style={{
                padding: '9px 16px', borderRadius: 9, background: '#F3F4F6', border: '1px solid #E5E7EB',
                color: '#374151', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              }}>Zavřít</button>
              <button onClick={() => { setLimitModal(false); onTab?.('pricing'); }} style={{
                padding: '9px 16px', borderRadius: 9, background: '#0020F6', border: 'none',
                color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,32,246,0.25)',
              }}>Chci upgrade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STATISTIKY JEDNOTLIVÉHO INZERÁTU — drawer nad seznamem inzerátů
// Reálná data (z job.candidates, doplněných v employer-supabase.jsx):
//   unikátní/noví kandidáti, rychlost swipnutí po zveřejnění (job.created_at vs matched_at)
// Pohlaví a věk zatím profily neukládají — deterministické zástupné hodnoty
// odvozené z worker_id (stejný kandidát = stejný výsledek), dokud tato pole nepřibudou v DB.
// ─────────────────────────────────────────────────────────────

const AGE_BUCKETS = ['15-17', '18-21', '22-25', '26-30', '30+'];
const AGE_WEIGHTS = [0.12, 0.40, 0.28, 0.13, 0.07];

function _hashSeed(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function _mockGender(workerId) {
  const r = _seededRnd(_hashSeed(workerId) + 1)();
  if (r < 0.56) return 'F';
  if (r < 0.985) return 'M';
  return 'other';
}

function _mockAgeBucket(workerId) {
  const r = _seededRnd(_hashSeed(workerId) + 2)();
  let acc = 0;
  for (let i = 0; i < AGE_BUCKETS.length; i++) {
    acc += AGE_WEIGHTS[i];
    if (r <= acc) return AGE_BUCKETS[i];
  }
  return AGE_BUCKETS[AGE_BUCKETS.length - 1];
}

function JobStatsDrawer({ job, onClose }) {
  const jobsList = (typeof E_JOBS !== 'undefined' ? E_JOBS : []);
  const rawCandidates = job.candidates || [];

  const seen = new Map();
  rawCandidates.forEach(c => { if (!seen.has(c.worker_id)) seen.set(c.worker_id, c); });
  const uniqueCandidates = Array.from(seen.values());

  // Noví = kandidát dosud neměl match na jiném vašem inzerátu před tímto swipem
  const newCount = uniqueCandidates.filter(c => {
    const seenElsewhereEarlier = jobsList.some(j2 => j2.id !== job.id && (j2.candidates || []).some(c2 =>
      c2.worker_id === c.worker_id && new Date(c2.matched_at).getTime() < new Date(c.matched_at).getTime()
    ));
    return !seenElsewhereEarlier;
  }).length;

  // Rychlost swipnutí po zveřejnění inzerátu
  const publishedMs = job.created_at ? new Date(job.created_at).getTime() : null;
  const swipeSpeeds = publishedMs != null
    ? uniqueCandidates.map(c => (new Date(c.matched_at).getTime() - publishedMs) / 60000).filter(m => m >= 0)
    : [];
  const speedBuckets = RESPONSE_BUCKETS.filter(b => b.key !== 'none');
  const speedCounts = {};
  speedBuckets.forEach(b => speedCounts[b.key] = 0);
  swipeSpeeds.forEach(m => { const k = _bucketForMinutes(m); if (speedCounts[k] != null) speedCounts[k]++; });
  const speedChartData = speedBuckets.map(b => ({ l: b.label, v: speedCounts[b.key], color: b.color }));
  const avgSpeed = swipeSpeeds.length ? swipeSpeeds.reduce((a, m) => a + m, 0) / swipeSpeeds.length : null;

  // Pohlaví a věk — zástupné hodnoty, viz komentář výše
  const genderCounts = { F: 0, M: 0, other: 0 };
  uniqueCandidates.forEach(c => { genderCounts[_mockGender(c.worker_id)]++; });
  const ageCounts = {};
  AGE_BUCKETS.forEach(b => ageCounts[b] = 0);
  uniqueCandidates.forEach(c => { ageCounts[_mockAgeBucket(c.worker_id)]++; });

  const hasData = uniqueCandidates.length > 0;
  const sectionLabel = { color: '#6B7280', fontFamily: T.fontUI, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: '#fff', borderLeft: '1px solid #E5E7EB',
      boxShadow: '-20px 0 60px rgba(0,0,0,0.12)',
      zIndex: 100, display: 'flex', flexDirection: 'column',
      animation: 'mkBubbleIn .25s',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#6B7280', fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Statistiky inzerátu</div>
          <div style={{ color: '#111827', fontFamily: T.fontUI, fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{job.title}</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="close-square-bold" size={16} color="#6B7280"/>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {!hasData && (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.6 }}>
            Zatím žádní kandidáti na tento inzerát. Statistiky se zobrazí, jakmile někdo swipne.
          </div>
        )}

        {hasData && (
          <>
            <div>
              <div style={sectionLabel}>Kandidáti</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <div style={{ color: '#111827', fontFamily: T.fontMono, fontSize: 22, fontWeight: 800 }}>{uniqueCandidates.length}</div>
                  <div style={{ color: '#6B7280', fontFamily: T.fontUI, fontSize: 11 }}>unikátních</div>
                </div>
                <div style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(0,32,246,0.15)' }}>
                  <div style={{ color: '#0020F6', fontFamily: T.fontMono, fontSize: 22, fontWeight: 800 }}>{newCount}</div>
                  <div style={{ color: '#6B7280', fontFamily: T.fontUI, fontSize: 11 }}>nových u vás</div>
                </div>
              </div>
            </div>

            <div>
              <div style={sectionLabel}>Jak rychle lidé swipli po zveřejnění</div>
              <BarChart width={380} height={170} data={speedChartData} />
              <div style={{ marginTop: 6, color: '#6B7280', fontFamily: T.fontUI, fontSize: 11 }}>
                Průměrně: <span style={{ color: '#111827', fontFamily: T.fontMono, fontWeight: 700 }}>{_fmtMinutes(avgSpeed)}</span>
              </div>
            </div>

            <div>
              <div style={sectionLabel}>Pohlaví</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Donut size={90} thickness={14} data={[
                  { v: genderCounts.F, color: '#5B6BFF' },
                  { v: genderCounts.M, color: '#FFD166' },
                  { v: genderCounts.other, color: '#E0B0FF' },
                ]} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: T.fontUI, fontSize: 12 }}>
                  {[['Žena', genderCounts.F, '#5B6BFF'], ['Muž', genderCounts.M, '#FFD166'], ['Jiné', genderCounts.other, '#E0B0FF']].map(([l, n, c]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                      <span style={{ color: '#374151', flex: 1 }}>{l}</span>
                      <span style={{ color: '#111827', fontFamily: T.fontMono, fontWeight: 700 }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div style={sectionLabel}>Věk</div>
              <BarChart width={380} height={170} data={AGE_BUCKETS.map(b => ({ l: b, v: ageCounts[b] }))} color={T.primary} />
            </div>

            <div style={{ color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 10, lineHeight: 1.5 }}>
              Pohlaví a věk jsou orientační — profily kandidátů zatím tyto údaje neukládají.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CANDIDATES — filter tabs + vertical list
// ─────────────────────────────────────────────────────────────

const CAND_STATUS = {
  match:    { label: 'Nový match',       color: '#5BD68A', bg: 'rgba(91,214,138,0.15)',  border: 'rgba(91,214,138,0.3)'  },
  waiting:  { label: 'Čeká na odpověď', color: '#FFD166', bg: 'rgba(255,209,102,0.15)', border: 'rgba(255,209,102,0.3)' },
  rejected: { label: 'Odmítnuto',       color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.25)'  },
};

// Sestaví plochý seznam kandidátů z ŽIVÝCH reálných dat. E_CANDIDATES je mutováno
// fetchEmployerData (employer-supabase.jsx) až po načtení skriptu, proto se seznam
// musí počítat AŽ při renderu — jinak by zamrzl na mock datech a firma by nikdy
// neviděla své skutečné uchazeče.
function buildCandsFlat() {
  return [
    ...(E_CANDIDATES.new || []),
    ...(E_CANDIDATES.hired || []),
    ...(E_CANDIDATES.shortlist || []),
    ...(E_CANDIDATES.interview || []),
  ].map(c => ({
    ...c,
    relStatus: c.status === 'rejected' ? 'rejected' : 'match',
    jobTitle: c.jobTitle || '',
    // „Už se známe" / „Mají zkušenost" vyžadují historii zaměstnání a obor kandidáta,
    // což se zatím netrackuje — necháváme false, dokud nebude datový model.
    workedHere: c.workedHere || false,
    sameIndustry: c.sameIndustry || false,
  }));
}

function ECandidatesOld({ onOpenChat } = {}) {
  const [tab, setTab] = useStateE('all');
  const [search, setSearch] = useStateE('');
  const [selected, setSelected] = useStateE(null);
  const [jobIds, setJobIds] = useStateE([]);       // [] = všechny inzeráty, jinak vybraná job ID
  const [dropOpen, setDropOpen] = useStateE(false);
  const dropRef = useRefE(null);

  // Živá reálná data — přepočítá se při každém mountu (komponenta se remountuje přes key={tick})
  const ALL_CANDS_FLAT = React.useMemo(() => buildCandsFlat(), []);

  // Zavřít dropdown kliknutím mimo
  useEffectE(() => {
    if (!dropOpen) return;
    function handle(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [dropOpen]);

  const jobFiltered = jobIds.length ? ALL_CANDS_FLAT.filter(c => jobIds.includes(c.job_id)) : ALL_CANDS_FLAT;

  const favList        = React.useMemo(() => jobFiltered.filter(c => c.rating >= 4.8 && c.jobsDone >= 15).sort((a,b) => b.rating - a.rating), [jobFiltered]);
  const knownList      = React.useMemo(() => jobFiltered.filter(c => c.workedHere), [jobFiltered]);
  const experienceList = React.useMemo(() => jobFiltered.filter(c => c.sameIndustry), [jobFiltered]);

  const tabFiltered = tab === 'favorites'  ? favList
                    : tab === 'known'       ? knownList
                    : tab === 'experience'  ? experienceList
                    : jobFiltered;

  const counts = {
    all:        jobFiltered.length,
    favorites:  favList.length,
    known:      knownList.length,
    experience: experienceList.length,
  };

  function toggleJob(id) {
    setJobIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const btnLabel = jobIds.length === 0
    ? 'Všechny inzeráty'
    : jobIds.length === 1
      ? (E_JOBS.find(j => j.id === jobIds[0])?.title || '1 inzerát')
      : `${jobIds.length} inzeráty`;

  const STATUS_DOT = { active: '#5BD68A', urgent: '#f43f5e', paused: '#FFD166', filled: '#8AB4FF' };

  const visible = React.useMemo(() => {
    if (!search.trim()) return tabFiltered;
    const q = search.trim().toLowerCase();
    return tabFiltered.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.jobTitle || '').toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [tab, search, jobIds, tabFiltered]);

  const TABS = [
    { k: 'all',        l: 'Vše',            desc: null, criteria: [], iconSrc: null },
    { k: 'favorites',  l: 'Všemi oblíbení', desc: 'Kandidáti s perfektním hodnocením napříč celou kariérou. Jsou to lidé, které právě potřebujete!', criteria: ['Alespoň 35 odpracovaných směn u různých zaměstnavatelů', '90 % hodnocení na 5 hvězdiček'], iconSrc: 'star.png' },
    { k: 'known',      l: 'Už se známe',    desc: 'Kandidáti, kteří už u vás pracovali — ať na stejné nebo jiné pozici. Znáte jejich pracovní styl, oni znají vás.', criteria: ['Dříve zaměstnáni u vaší firmy', 'Znají váš provoz a firemní kulturu'], iconSrc: 'handshake.png' },
    { k: 'experience', l: 'Mají zkušenost', desc: 'Kandidáti s prokazatelnou praxí v podobném oboru nebo na stejném typu pozice. Nastoupí rovnou bez dlouhého zaškolování.', criteria: ['Praxe v podobném oboru nebo na shodném typu pozice', 'Odpracované brigády v tomto odvětví v historii profilu'], iconSrc: 'briefcase.png' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#fff' }}>
      {/* Filter tabs + search */}
      <div style={{ padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #E5E7EB' }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            padding: '7px 14px', borderRadius: 9,
            background: tab === t.k ? 'rgba(0,32,246,0.08)' : '#F9FAFB',
            border: '1px solid ' + (tab === t.k ? 'rgba(0,32,246,0.3)' : '#E5E7EB'),
            color: tab === t.k ? '#0020F6' : '#6B7280',
            fontFamily: T.fontUI, fontSize: 12.5, fontWeight: tab === t.k ? 700 : 500,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
          }}>
            {t.l}
            <span style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, opacity: tab === t.k ? 1 : 0.6 }}>{counts[t.k]}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}>
            <Icon name="magnifer-linear" size={13} color="#9CA3AF" />
          </span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Hledat kandidáta, pozici…"
            style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 9, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827', fontFamily: T.fontUI, fontSize: 12.5, outline: 'none', width: 230 }}
          />
        </div>
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropOpen(o => !o)}
            style={{
              padding: '8px 12px', borderRadius: 9,
              background: jobIds.length ? 'rgba(0,32,246,0.08)' : '#F9FAFB',
              border: '1px solid ' + (jobIds.length ? 'rgba(0,32,246,0.3)' : '#E5E7EB'),
              color: jobIds.length ? '#0020F6' : '#374151',
              fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: 200,
            }}>
            <Icon name="filter-bold" size={12} color={jobIds.length ? '#0020F6' : '#6B7280'}/>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{btnLabel}</span>
            {jobIds.length > 0 && (
              <span style={{ padding: '1px 6px', borderRadius: 6, background: '#0020F6', color: '#fff', fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700, flexShrink: 0 }}>{jobIds.length}</span>
            )}
            <svg width="9" height="6" viewBox="0 0 10 6" style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
              <path d="M0 0l5 6 5-6z" fill={jobIds.length ? '#0020F6' : '#9CA3AF'} />
            </svg>
          </button>

          {dropOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
              background: '#fff', borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 8px 32px rgba(15,18,40,0.14)',
              minWidth: 280, maxWidth: 340,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '11px 14px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#111827', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700 }}>Filtr podle inzerátu</span>
                {jobIds.length > 0 && (
                  <button onClick={() => setJobIds([])} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Zrušit výběr
                  </button>
                )}
              </div>

              <button onClick={() => { setJobIds([]); setDropOpen(false); }} style={{
                width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                background: jobIds.length === 0 ? 'rgba(0,32,246,0.05)' : 'transparent',
                border: 'none', cursor: 'pointer', borderBottom: '1px solid #E5E7EB',
              }}>
                <div style={{
                  width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                  background: jobIds.length === 0 ? '#0020F6' : '#fff',
                  border: '1.5px solid ' + (jobIds.length === 0 ? '#0020F6' : '#D1D5DB'),
                  display: 'grid', placeItems: 'center',
                }}>
                  {jobIds.length === 0 && <Icon name="check-bold" size={10} color="#fff" />}
                </div>
                <span style={{ color: '#111827', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: jobIds.length === 0 ? 700 : 500 }}>Všechny inzeráty</span>
                <span style={{ marginLeft: 'auto', fontFamily: T.fontMono, fontSize: 11, color: '#9CA3AF' }}>{ALL_CANDS_FLAT.length}</span>
              </button>

              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {E_JOBS.length === 0 ? (
                  <div style={{ padding: '18px 14px', textAlign: 'center', color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 12 }}>Zatím nemáte žádné inzeráty</div>
                ) : E_JOBS.map(j => {
                  const checked = jobIds.includes(j.id);
                  const cnt = ALL_CANDS_FLAT.filter(c => c.job_id === j.id).length;
                  const dot = STATUS_DOT[j.status] || '#9CA3AF';
                  return (
                    <button key={j.id} onClick={() => toggleJob(j.id)} style={{
                      width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
                      background: checked ? 'rgba(0,32,246,0.04)' : 'transparent',
                      border: 'none', borderBottom: '1px solid #E5E7EB', cursor: 'pointer',
                    }}>
                      <div style={{
                        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                        background: checked ? '#0020F6' : '#fff',
                        border: '1.5px solid ' + (checked ? '#0020F6' : '#D1D5DB'),
                        display: 'grid', placeItems: 'center',
                      }}>
                        {checked && <Icon name="check-bold" size={10} color="#fff" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ color: '#111827', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: checked ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: dot, flexShrink: 0 }} />
                          <span style={{ color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 10.5 }}>{j.location || j.company}</span>
                        </div>
                      </div>
                      <span style={{ fontFamily: T.fontMono, fontSize: 11.5, fontWeight: 700, color: cnt > 0 ? '#111827' : '#9CA3AF', flexShrink: 0 }}>{cnt}</span>
                    </button>
                  );
                })}
              </div>

              {jobIds.length > 0 && (
                <div style={{ padding: '10px 14px' }}>
                  <button onClick={() => setDropOpen(false)} style={{
                    width: '100%', padding: '9px', borderRadius: 9,
                    background: '#0020F6', border: 'none', color: '#fff',
                    fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>
                    Použít filtr ({jobFiltered.length} kandidátů)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab description */}
      {(() => { const active = TABS.find(t => t.k === tab); return active?.desc ? (
        <div style={{ padding: '10px 28px 14px', background: 'rgba(0,32,246,0.03)', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
          {active.iconSrc
            ? <img src={active.iconSrc} style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0, marginTop: 1 }} />
            : <Icon name="info-circle-bold" size={14} color="#0020F6" style={{ flexShrink: 0, marginTop: 2 }} />
          }
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ color: '#374151', fontFamily: T.fontUI, fontSize: 12.5, lineHeight: 1.55 }}>{active.desc}</span>
            {active.criteria.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 16, height: 16, borderRadius: 999, background: 'rgba(21,128,61,0.12)', border: '1px solid rgba(21,128,61,0.3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="check-bold" size={9} color="#15803D" />
                </div>
                <span style={{ color: '#15803D', fontFamily: T.fontUI, fontSize: 12, fontWeight: 600 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null; })()}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.length === 0 ? (
          <div style={{ paddingTop: 60, textAlign: 'center', color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 13 }}>
            Žádní kandidáti v této kategorii
          </div>
        ) : visible.map(c => (
          <CandidateListCard key={c.id} c={c} active={selected?.id === c.id} onClick={() => setSelected({ ...c })} onOpenChat={onOpenChat} />
        ))}
      </div>

      {selected && (
        <CandidateDrawer
          onOpenChat={onOpenChat}
          c={selected}
          onClose={() => setSelected(null)}
          onAccepted={async () => {
            const { data: { session } } = await sb.auth.getSession();
            if (session?.user) { await fetchEmployerData(session.user.id); }
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function CandidateListCard({ c, active, onClick, onOpenChat }) {
  const st = CAND_STATUS[c.relStatus] || CAND_STATUS.match;
  const isFavorite = c.rating >= 4.8 && c.jobsDone >= 15;
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', padding: '20px 24px', borderRadius: 18,
      background: active ? 'rgba(0,32,246,0.1)' : '#EEF2FF',
      border: '1.5px solid ' + (active ? 'rgba(0,32,246,0.4)' : '#D4DCFF'),
      cursor: 'pointer', color: 'inherit', fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: 18, width: '100%',
    }}>
      <div style={{ width: 56, height: 56, borderRadius: 999, background: c.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
        {c.avatar}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#111827', fontFamily: T.fontUI, fontSize: 15.5, fontWeight: 700 }}>{c.name}</span>
          <span style={{ fontFamily: T.fontMono, fontSize: 12.5, color: '#6B7280' }}>
            {[c.age ? `${c.age} let` : null, (c.distance != null) ? `${c.distance} km` : null].filter(Boolean).join(' · ') || c.jobTitle || ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <MiniMetricLight icon="star-bold" v={c.rating} c="#D97706" />
          <MiniMetricLight icon="medal-ribbon-star-bold" v={c.jobsDone} c="#4338CA" />
          {isFavorite && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.35)' }}>
              <img src="star.png" style={{ width: 15, height: 15, objectFit: 'contain', imageRendering: 'pixelated' }} />
              <span style={{ color: '#92650a', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700 }}>Všemi oblíbený</span>
            </div>
          )}
          {c.workedHere && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, background: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.28)' }}>
              <img src="handshake.png" style={{ width: 15, height: 15, objectFit: 'contain', imageRendering: 'pixelated' }} />
              <span style={{ color: '#4338CA', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700 }}>Už se známe</span>
            </div>
          )}
          {c.sameIndustry && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.28)' }}>
              <img src="briefcase.png" style={{ width: 15, height: 15, objectFit: 'contain', imageRendering: 'pixelated' }} />
              <span style={{ color: '#065F46', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700 }}>Má zkušenost</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={e => { e.stopPropagation(); onOpenChat?.(c.match_id); }} style={{ padding: '11px 20px', borderRadius: 11, background: 'rgba(0,32,246,0.1)', border: '1px solid rgba(0,32,246,0.25)', color: '#0020F6', fontFamily: T.fontUI, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <img src="messages-icon.png" style={{ width: 15, height: 15, objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(13%) sepia(100%) saturate(4000%) hue-rotate(228deg) brightness(103%)' }} />Napsat zprávu
        </button>
        <button onClick={e => e.stopPropagation()} style={{ padding: '11px 20px', borderRadius: 11, background: 'rgba(91,107,255,0.08)', border: '1px solid rgba(91,107,255,0.25)', color: '#4338CA', fontFamily: T.fontUI, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <img src="send.png" style={{ width: 15, height: 15, objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(26%) sepia(98%) saturate(1200%) hue-rotate(228deg) brightness(90%)' }} />Poslat inzerát
        </button>
      </div>
    </button>
  );
}

function MiniMetric({ icon, v, c }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
      padding: '5px 6px', borderRadius: 6,
      background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.border,
    }}>
      <Icon name={icon} size={11} color={c} />
      <span style={{ color: T.text, fontFamily: T.fontMono, fontSize: 11, fontWeight: 700 }}>{v}</span>
    </div>
  );
}

function MiniMetricLight({ icon, v, c }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
      padding: '4px 8px', borderRadius: 6,
      background: 'rgba(255,255,255,0.7)', border: '1px solid #D4DCFF',
    }}>
      <Icon name={icon} size={11} color={c} />
      <span style={{ color: '#111827', fontFamily: T.fontMono, fontSize: 11, fontWeight: 700 }}>{v}</span>
    </div>
  );
}

const MOCK_REVIEWS = [
  { company: 'Café Central', position: 'Barista', date: 'Březen 2025', rating: 5, text: 'Tomáš byl spolehlivý a vždy přišel včas. Zákazníci si ho oblíbili, určitě bychom ho vzali znovu.' },
  { company: 'Bistro Kolín', position: 'Číšník', date: 'Leden 2025', rating: 5, text: 'Skvělá komunikace, zvládl i stresové situace během víkendového provozu. Doporučujeme.' },
  { company: 'Event Catering s.r.o.', position: 'Cateringový asistent', date: 'Prosinec 2024', rating: 5, text: 'Perfektní přístup k práci, pomohl i nad rámec zadání. Přijdeme znovu.' },
  { company: 'Hospůdka U Nováků', position: 'Pomocník v kuchyni', date: 'Říjen 2024', rating: 4, text: 'Šikovný, jen někdy potřeboval připomenout rutinní úkoly. Celkově pozitivní zkušenost.' },
  { company: 'Pizzeria Napoli', position: 'Rozvoz jídla', date: 'Srpen 2024', rating: 5, text: 'Výborná práce pod tlakem, zákazníci spokojeni. Vrátí se k nám na léto.' },
];

function StarRow({ n }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? '#D97706' : '#E5E7EB', fontSize: 13 }}>★</span>
      ))}
    </div>
  );
}

const JOBS_POOL = [
  { company: 'Café Central',          position: 'Barista',                desc: 'Příprava kávy, obsluha espressa, komunikace se zákazníky.',         hourly: 145, review: 5 },
  { company: 'Bistro Kolín',          position: 'Číšník',                 desc: 'Obsluha stolů, přijímání objednávek, úklid sálu po zavírací době.', hourly: 135, review: 5 },
  { company: 'Event Catering s.r.o.', position: 'Cateringový asistent',   desc: 'Příprava a výdej jídla na firemní akci pro 200 hostů.',             hourly: 150, review: 5 },
  { company: 'Hospůdka U Nováků',     position: 'Pomocník v kuchyni',     desc: 'Příprava surovin, mytí nádobí, pomoc kuchaři během víkendu.',        hourly: 120, review: 4 },
  { company: 'Street Food Market',    position: 'Prodavač',               desc: 'Obsluha food truck stánku, příjem plateb, zásobování.',              hourly: 130, review: null },
  { company: 'Pizzeria Napoli',       position: 'Rozvoz jídla',           desc: 'Rozvoz objednávek na kole v rámci centra Brna.',                     hourly: 125, review: 5 },
  { company: 'Kavárna Místo',         position: 'Barista — záskok',       desc: 'Jednorázový záskok na ranní směnu, příprava nápojů a pokladna.',     hourly: 140, review: null },
  { company: 'Hotel Grandezza',       position: 'Číšník — snídaně',       desc: 'Obsluha hotelových hostů při snídaních, příprava bufetu.',           hourly: 138, review: 5 },
  { company: 'Sushi Mori',            position: 'Pomocník v restauraci',  desc: 'Příprava sushi sady, výdej objednávek, úklid kuchyně.',              hourly: 128, review: null },
  { company: 'Pivovar Šenkovna',      position: 'Výčepní',                desc: 'Točení piva, obsluha pivního baru, evidence tržeb.',                 hourly: 132, review: 4 },
  { company: 'Lidl Brno-sever',       position: 'Pokladní',               desc: 'Obsluha pokladny, doplňování zboží, práce se skenerem.',             hourly: 118, review: 5 },
  { company: 'FreshBox catering',     position: 'Příprava jídla',         desc: 'Balení krabičkových dietních jídel, etiketování, expedice.',         hourly: 122, review: null },
  { company: 'Brunch & Co.',          position: 'Servírka / číšník',      desc: 'Obsluha brunchového baru, příprava smoothie bowlů a kávy.',          hourly: 136, review: 5 },
  { company: 'Zásobování Plus',       position: 'Skladník',               desc: 'Příjem zboží, naskladnění, inventura, práce s čtečkou čárových kódů.', hourly: 115, review: null },
  { company: 'DPD doručování',        position: 'Kurýr — výpomoc',        desc: 'Ranní rozvoz balíků po Brně, práce s aplikací pro navigaci.',        hourly: 140, review: 4 },
  { company: 'Escape Room Labyrint',  position: 'Game master',            desc: 'Moderování únikových her, technická podpora, obsluha hráčů.',         hourly: 155, review: 5 },
  { company: 'Tesco Hypermarket',     position: 'Doplňování zboží',       desc: 'Noční doplňování regálů, kontrola expirace, přijímání dodávek.',     hourly: 120, review: null },
  { company: 'Burger Factory',        position: 'Kuchař fast food',       desc: 'Příprava burgerů, fritování, expedice objednávek ve špičce.',         hourly: 130, review: 5 },
  { company: 'Rockfest 2024',         position: 'Barmanka na festivalu',  desc: 'Výdej nápojů na festivalovém baru, práce s cash systémem.',           hourly: 148, review: null },
  { company: 'Sportovní centrum Fit', position: 'Recepční',               desc: 'Příjem klientů, správa rezervací, prodej členství a doplňků.',        hourly: 125, review: 5 },
];

const DATES_POOL = [
  'Červen 2025','Duben 2025','Březen 2025','Únor 2025','Leden 2025',
  'Prosinec 2024','Listopadu 2024','Říjen 2024','Září 2024','Srpen 2024',
  'Červenec 2024','Červen 2024','Květen 2024','Duben 2024','Březen 2024',
  'Únor 2024','Leden 2024','Prosinec 2023','Listopad 2023','Říjen 2023',
];

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCandidateJobs(c) {
  const seed = c.id ? c.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) : c.name.length * 17;
  const shuffled = seededShuffle(JOBS_POOL, seed);
  const dates = seededShuffle(DATES_POOL, seed + 1);
  return shuffled.map((j, i) => ({ ...j, date: dates[i % dates.length] }));
}

function CandidateDrawer({ c, onClose, onAccepted, onOpenChat }) {
  const [accepting, setAccepting] = useStateE(false);
  const [rejecting, setRejecting] = useStateE(false);
  const [showReviews, setShowReviews] = useStateE(false);
  const [showJobs, setShowJobs] = useStateE(false);
  const candidateJobs = React.useMemo(() => getCandidateJobs(c), [c.id]);
  const accepted = c.status === 'accepted';
  const rejected = c.status === 'rejected';

  async function handleAccept() {
    if (!c.match_id || !c.job_id || accepting) return;
    setAccepting(true);
    const ok = await acceptCandidate(c.match_id, c.job_id);
    if (ok) {
      onAccepted?.();
      onClose();
    }
    setAccepting(false);
  }

  async function handleReject() {
    if (!c.match_id || rejecting) return;
    setRejecting(true);
    await rejectCandidate(c.match_id);
    onAccepted?.(); // refresh parent
    onClose();
    setRejecting(false);
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: '#fff',
      borderLeft: '1px solid #E5E7EB',
      boxShadow: '-20px 0 60px rgba(0,0,0,0.12)',
      zIndex: 100, display: 'flex', flexDirection: 'column',
      animation: 'mkBubbleIn .25s',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, color: '#6B7280', fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Detail kandidáta</span>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
          <Icon name="close-square-bold" size={16} color="#6B7280"/>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Hero */}
        {(() => {
          const ls = c.lastSeen || '';
          const isOnline = ls === 'právě teď' || ls.includes('min') || ls.includes('sek');
          return (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 72, height: 72, borderRadius: 999, background: c.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 26 }}>{c.avatar}</div>
                <div style={{
                  position: 'absolute', bottom: 3, right: 3,
                  width: 13, height: 13, borderRadius: 999,
                  background: isOnline ? '#22c55e' : '#F59E0B',
                  border: '2px solid #fff',
                  animation: isOnline ? 'onlinePulse 1.8s ease-in-out infinite' : 'none',
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#111827', fontFamily: T.fontHead, fontSize: 20, fontWeight: 800 }}>{c.name}</div>
                <div style={{ color: '#6B7280', fontSize: 12, fontFamily: T.fontUI, marginTop: 2 }}>
                  {[c.age ? `${c.age} let` : null, (c.distance != null) ? `${c.distance} km` : null].filter(Boolean).join(' · ') || c.jobTitle || 'Kandidát'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  {c.match > 0 && (
                    <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(91,214,138,0.15)', color: '#15803D', fontFamily: T.fontMono, fontSize: 11, fontWeight: 800 }}>{c.match}% match</span>
                  )}
                  <span style={{ color: isOnline ? '#16a34a' : '#9CA3AF', fontFamily: T.fontUI, fontSize: 11, fontWeight: isOnline ? 700 : 400 }}>
                    {isOnline ? 'Právě swajpuje' : (ls ? 'Aktivní ' + ls : '')}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <div
            style={{ padding: '8px 6px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', textAlign: 'center' }}
          >
            <div style={{ color: '#D97706', fontFamily: T.fontMono, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 1 }}>
              {c.rating > 0 ? c.rating : '—'}<span style={{ fontSize: 11, color: '#F59E0B' }}>/5</span>
            </div>
            <div style={{ color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 9.5, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hodnocení</div>
          </div>
          <div
            style={{ padding: '8px 6px', borderRadius: 10, background: '#EEF2FF', border: '1px solid #C7D2FE', textAlign: 'center' }}
          >
            <div style={{ color: '#4338CA', fontFamily: T.fontMono, fontSize: 15, fontWeight: 700 }}>{c.jobsDone}</div>
            <div style={{ color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 9.5, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Brigád</div>
          </div>
        </div>

        {/* „Proč je to dobrý match" bylo skryto — obsahovalo napevno vymyšlená tvrzení
            o konkrétní osobě (vzdálenost, dostupnost). Zapnout až po napojení reálných
            dat (poloha, dostupnost, obor). */}

        {/* Skills */}
        <div>
          <div style={{ color: '#6B7280', fontSize: 10.5, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Dovednosti</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {(c.tags || []).length > 0 ? (c.tags || []).map((t, i) => (
              <span key={i} style={{ padding: '5px 10px', borderRadius: 7, background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#3730A3', fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600 }}>{t}</span>
            )) : (
              <span style={{ color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 12 }}>Zatím neuvedeno</span>
            )}
          </div>
        </div>

        {/* „Profil spolehlivosti" skryto — hodnoty byly napevno vymyšlené. Zapnout
            až po napojení reálných metrik (dochvilnost, recenze od firem). */}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {accepted ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, background: 'rgba(91,214,138,0.12)', border: '1px solid rgba(91,214,138,0.3)', color: '#5BD68A', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>
            <Icon name="check-circle-bold" size={16} color="#5BD68A"/>Kandidát přijat — inzerát uzavřen
          </div>
        ) : rejected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)', color: '#f43f5e', fontFamily: T.fontUI, fontSize: 13, fontWeight: 600 }}>
            <Icon name="close-circle-bold" size={16} color="#f43f5e"/>Odmítnuto
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              onClick={handleAccept}
              disabled={accepting}
              style={{
                padding: '12px 14px', borderRadius: 10,
                background: accepting ? 'rgba(91,214,138,0.2)' : 'linear-gradient(135deg, #1a8f52, #15713f)',
                border: '1px solid rgba(91,214,138,0.4)', color: '#fff', cursor: 'pointer',
                fontFamily: T.fontUI, fontSize: 13, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: accepting ? 0.7 : 1,
              }}>
              <Icon name="check-circle-bold" size={14} color="#fff"/>
              {accepting ? 'Přijímám…' : 'Přijmout'}
            </button>
            <button
              onClick={handleReject}
              disabled={rejecting}
              style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)',
                color: '#f43f5e', cursor: 'pointer',
                fontFamily: T.fontUI, fontSize: 13, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: rejecting ? 0.7 : 1,
              }}>
              <Icon name="close-circle-bold" size={14} color="#f43f5e"/>
              {rejecting ? 'Odmítám…' : 'Odmítnout'}
            </button>
          </div>
        )}
        <button onClick={() => { onOpenChat?.(c.match_id); onClose?.(); }} style={{
          padding: '10px 14px', borderRadius: 10,
          background: '#F9FAFB', border: '1px solid #E5E7EB',
          color: '#374151', cursor: 'pointer',
          fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}><Icon name="chat-round-line-bold" size={13} color="#374151"/>Napsat zprávu</button>
      </div>

      {/* Jobs sub-panel */}
      {showJobs && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#fff',
          display: 'flex', flexDirection: 'column',
          animation: 'mkBubbleIn .2s',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowJobs(false)} style={{ width: 30, height: 30, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Icon name="alt-arrow-left-bold" size={16} color="#6B7280"/>
            </button>
            <span style={{ flex: 1, color: '#111827', fontFamily: T.fontUI, fontSize: 14, fontWeight: 700 }}>Odpracované brigády — {c.name}</span>
            <span style={{ color: '#4338CA', fontFamily: T.fontMono, fontSize: 13, fontWeight: 700 }}>{c.jobsDone} brigád</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {candidateJobs.map((j, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#111827', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{j.company}</span>
                  <span style={{ color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 11 }}>{j.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4338CA', fontFamily: T.fontUI, fontSize: 12, fontWeight: 600 }}>{j.position}</span>
                  <span style={{ color: '#374151', fontFamily: T.fontMono, fontSize: 12, fontWeight: 700 }}>{j.hourly} Kč/hod</span>
                </div>
                <p style={{ margin: 0, color: '#6B7280', fontFamily: T.fontUI, fontSize: 11.5, lineHeight: 1.55 }}>{j.desc}</p>
                {j.review !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ color: s <= j.review ? '#D97706' : '#E5E7EB', fontSize: 12 }}>★</span>
                    ))}
                    <span style={{ color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 10.5, marginLeft: 3 }}>hodnocení od firmy</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews sub-panel */}
      {showReviews && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#fff',
          display: 'flex', flexDirection: 'column',
          animation: 'mkBubbleIn .2s',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowReviews(false)} style={{ width: 30, height: 30, borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Icon name="alt-arrow-left-bold" size={16} color="#6B7280"/>
            </button>
            <span style={{ flex: 1, color: '#111827', fontFamily: T.fontUI, fontSize: 14, fontWeight: 700 }}>Recenze — {c.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: '#D97706', fontFamily: T.fontMono, fontSize: 16, fontWeight: 700 }}>{c.rating}★</span>
              <span style={{ color: '#6B7280', fontFamily: T.fontUI, fontSize: 12 }}>({MOCK_REVIEWS.length} recenzí)</span>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_REVIEWS.map((r, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#111827', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{r.company}</span>
                  <span style={{ color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 11 }}>{r.date}</span>
                </div>
                <span style={{ color: '#6B7280', fontFamily: T.fontUI, fontSize: 11.5 }}>
                  <span style={{ fontWeight: 700 }}>Popis práce:</span> {r.position}
                </span>
                <StarRow n={r.rating} />
                <p style={{ margin: 0, color: '#374151', fontFamily: T.fontUI, fontSize: 12.5, lineHeight: 1.6 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// EJobs i ECandidates exportuje redesign v employer-pages3.jsx; zde zůstávají jen staré verze (EJobsOld, ECandidatesOld) mimo window.
