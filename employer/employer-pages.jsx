// Makej Employer — Inzeráty (jobs management) + Kandidáti (kanban)

// Akční tlačítko inzerátu — v klidu černobílé, po najetí myší se zbarví do modra.
function EActionButton({ icon, label, onClick }) {
  const [hover, setHover] = useStateE(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
        fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600,
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

const STATUS_META = {
  active: { label: 'Aktivní', color: '#5BD68A', dot: true },
  urgent: { label: 'ASAP · spěchá', color: '#f43f5e', dot: true, pulse: true },
  paused: { label: 'Pozastaveno', color: '#FFD166' },
  filled: { label: 'Naplněno', color: '#8AB4FF' },
  scheduled: { label: 'Naplánováno', color: '#5B6BFF' },
};

function EJobs({ onTab, onEdit, onDuplicate }) {
  const [filter, setFilter] = useStateE('all');
  const [q, setQ] = useStateE('');
  const [refresh, setRefresh] = useStateE(0);

  // Živý odpočet boostu — přerenderuj každou minutu, ať čísla klesají sama
  useEffectE(() => {
    const id = setInterval(() => setRefresh(x => x + 1), 60000);
    return () => clearInterval(id);
  }, []);

  async function handleBoost(j) {
    if (typeof can === 'function' && !can('topJob')) {
      window.empToast && window.empToast('Topování je prémiové', 'Zvýhodněné zobrazení je od tarifu Standard výš. Přejdi na vyšší tarif a inzerát vystřelí nahoru.', '🚀', 'info');
      window.empGoTab && window.empGoTab('pricing');
      return;
    }
    const ok = await boostJobE(j.id, 48);
    if (ok) {
      window.empToast && window.empToast('Inzerát boostnutý 🚀', j.title + ' se teď 48 hodin zobrazuje nahoře ve feedu brigádníků, pak se boost sám vypne.', '🚀', 'success');
      setRefresh(x => x + 1);
    } else {
      window.empToast && window.empToast('Chyba', 'Boost se nepodařilo zapnout.', '⚠️', 'error');
    }
  }

  const byStatus = filter === 'all' ? E_JOBS : E_JOBS.filter(j => j.status === filter);
  const filtered = q.trim()
    ? byStatus.filter(j => (j.title || '').toLowerCase().includes(q.trim().toLowerCase()))
    : byStatus;

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
        {[
          { label: 'Aktivních', value: E_JOBS.filter(j=>j.status==='active'||j.status==='urgent').length, sub: 'inzerátů', color: '#5BD68A' },
          { label: 'Najato celkem', value: E_JOBS.reduce((a,j)=>a+j.hired,0), sub: 'v tomto měsíci', color: '#5BD68A' },
        ].map((s, i) => (
          <ECard key={i} padding={16}>
            <div style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 24, fontWeight: 700, color: T.ink, letterSpacing: -0.8 }}>{s.value}</div>
              <div style={{ fontFamily: T.fontUI, fontSize: 11, color: T.mutedSoft }}>{s.sub}</div>
            </div>
          </ECard>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[
          { k: 'all', l: 'Vše', n: E_JOBS.length },
          { k: 'active', l: 'Aktivní', n: E_JOBS.filter(j=>j.status==='active').length },
          { k: 'urgent', l: 'ASAP', n: E_JOBS.filter(j=>j.status==='urgent').length },
          { k: 'paused', l: 'Pozastaveno', n: E_JOBS.filter(j=>j.status==='paused').length },
          { k: 'filled', l: 'Naplněno', n: E_JOBS.filter(j=>j.status==='filled').length },
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            padding: '8px 14px', borderRadius: 9,
            background: filter === f.k ? 'rgba(0,32,246,0.1)' : 'rgba(0,32,246,0.05)',
            border: '1px solid ' + (filter === f.k ? 'rgba(91,107,255,0.4)' : T.border),
            color: filter === f.k ? '#fff' : T.muted,
            fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 7,
          }}>
            {f.l}
            <span style={{ fontFamily: T.fontMono, fontSize: 11, opacity: 0.7 }}>{f.n}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Icon name="magnifer-bold" size={14} color={T.mutedSoft} />
          <input placeholder="Hledat inzerát…" value={q} onChange={e => setQ(e.target.value)} style={{
            paddingLeft: 30, padding: '8px 12px 8px 30px',
            borderRadius: 9, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border,
            color: T.ink, fontFamily: T.fontUI, fontSize: 12.5, width: 220, outline: 'none',
          }} />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <Icon name="magnifer-linear" size={14} color={T.mutedSoft} />
          </span>
        </div>
      </div>

      {/* Jobs list — analytical cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(j => {
          const status = STATUS_META[j.status];
          const boostActive = j.boostedUntil && new Date(j.boostedUntil).getTime() > Date.now();
          const boostLeftH  = boostActive ? Math.max(1, Math.ceil((new Date(j.boostedUntil).getTime() - Date.now()) / 3600000)) : 0;
          const matchRate = ((j.matches / j.swipes) * 100).toFixed(1);
          const hireRate = ((j.hired / j.matches) * 100).toFixed(1);
          return (
            <ECard key={j.id} padding={0} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 200px', alignItems: 'stretch' }}>
                {/* Left: title + status */}
                <div style={{ padding: 18, borderRight: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: j.accent }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 8px', borderRadius: 6,
                      background: status.color + '22',
                      color: status.color,
                      fontSize: 10, fontWeight: 800, fontFamily: T.fontUI, letterSpacing: 0.5, textTransform: 'uppercase',
                    }}>
                      {status.dot ? <span style={{ width: 6, height: 6, borderRadius: 999, background: status.color, animation: status.pulse ? 'mkBubbleIn 1s infinite alternate' : 'none' }} /> : null}
                      {status.label}
                    </span>
                    {boostActive && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(245,166,35,0.16)', color: '#F5A623', fontSize: 10, fontWeight: 800, fontFamily: T.fontUI, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        <Icon name="bolt-bold" size={11} color="#F5A623" /> Top
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.mutedSoft }}>{j.plan}</span>
                  </div>
                  {j.scheduled && j.publishAt && (
                    <div style={{ paddingLeft: 8, marginTop: -4, color: '#5B6BFF', fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Icon name="calendar-bold" size={11} color="#5B6BFF" /> Zveřejní se {new Date(j.publishAt).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  <div style={{ paddingLeft: 8 }}>
                    <div style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, color: T.ink, letterSpacing: -0.3, lineHeight: 1.2 }}>{j.title}</div>
                    <div style={{ fontFamily: T.fontUI, fontSize: 11.5, color: T.muted, marginTop: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="dollar-bold" size={12} color={T.muted} />
                        <span style={{ fontFamily: T.fontMono, color: T.ink, fontWeight: 700 }}>{j.pay}</span> {j.payUnit}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="clock-circle-bold" size={12} color={T.muted} />
                        <span style={{ fontFamily: T.fontMono }}>{j.daysLeft}d zbývá</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: metrics + bars */}
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                    {[
                      { l: 'Zhlédnutí', v: j.views.toLocaleString('cs-CZ').replace(/,/g,' '), c: '#5B6BFF' },
                      { l: 'Swipe right', v: j.swipes.toLocaleString('cs-CZ').replace(/,/g,' '), c: '#FFD166' },
                      { l: 'Matche', v: j.matches, c: '#0020F6' },
                      { l: 'Najato', v: j.hired, c: '#5BD68A' },
                    ].map((m, i) => (
                      <div key={i}>
                        <div style={{ color: T.mutedSoft, fontSize: 10, fontFamily: T.fontUI, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{m.l}</div>
                        <div style={{ color: T.ink, fontFamily: T.fontMono, fontSize: 20, fontWeight: 700, marginTop: 3, letterSpacing: -0.6 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, paddingTop: 4, borderTop: '1px solid ' + T.border }}>
                    <BarMetric label="CTR (zhlédnuto → swajp)" value={j.ctr} max={30} suffix="%" />
                    <BarMetric label="Match rate (swajp → match)" value={parseFloat(matchRate)} max={20} suffix="%" />
                    <BarMetric label="Hire rate (match → najato)" value={parseFloat(hireRate)} max={30} suffix="%" />
                  </div>
                </div>

                {/* Right: actions */}
                <div style={{ padding: 18, borderLeft: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                  <button onClick={() => {
                    window._empPresetJobIds = [j.id];
                    onTab?.('candidates');
                  }} style={{
                    padding: '10px 12px', borderRadius: 9,
                    background: 'linear-gradient(135deg, #0020F6, #2D2CA7)',
                    border: 'none', color: '#fff', cursor: 'pointer',
                    fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><Icon name="users-group-rounded-bold" size={14} color="#fff"/>Kandidáti ({j.matches})</button>
                  <button onClick={() => handleBoost(j)} disabled={boostActive} style={{
                    padding: '8px 12px', borderRadius: 9,
                    background: boostActive ? 'rgba(245,166,35,0.12)' : 'rgba(0,32,246,0.05)',
                    border: '1px solid ' + (boostActive ? 'rgba(245,166,35,0.35)' : T.border),
                    color: boostActive ? '#F5A623' : T.light, cursor: boostActive ? 'default' : 'pointer',
                    fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><Icon name={boostActive ? 'bolt-bold' : 'rocket-2-bold'} size={12} color={boostActive ? '#F5A623' : T.super}/>{boostActive ? ('Boostnuto · ' + boostLeftH + ' h') : 'Boostnout'}</button>
                  <EActionButton icon="pen-2-linear" label="Upravit" onClick={() => onEdit && onEdit(j)} />
                  <EActionButton icon="copy-bold" label="Duplikovat" onClick={() => onDuplicate && onDuplicate(j)} />
                </div>
              </div>
            </ECard>
          );
        })}
      </div>
    </div>
  );
}

function BarMetric({ label, value, max, suffix = '' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: T.muted, fontSize: 10.5, fontFamily: T.fontUI, fontWeight: 600 }}>{label}</span>
        <span style={{ color: T.ink, fontFamily: T.fontMono, fontSize: 11.5, fontWeight: 700 }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, #5B6BFF, #0020F6)' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CANDIDATES — list view s filtry (inspirace Yasin, reálná data)
// ─────────────────────────────────────────────────────────────

// Flatten všech kandidátů do jednoho pole s relStatus
function _eAllCands() {
  const out = [];
  (E_CANDIDATES.new || []).forEach(c => out.push({ ...c, relStatus: 'pending' }));
  (E_CANDIDATES.hired || []).forEach(c => out.push({
    ...c,
    relStatus: c.status,
    workedHere: c.status === 'confirmed',
  }));
  return out;
}

// Generuje důvody proč je to dobrý match z reálných dat
function _matchReasons(c, jobTags) {
  const reasons = [];
  const r = parseFloat(c.rating) || 0;
  if (c.jobsDone > 0) reasons.push({ ok: true, text: `${c.jobsDone} dokončených brigád` });
  if (r >= 4.0) reasons.push({ ok: true, text: `Hodnocení ${c.rating}★ od předchozích firem` });
  if (c.verified) reasons.push({ ok: true, text: 'Ověřený profil' });
  if (c.super) reasons.push({ ok: true, text: 'Projevil super zájem o tuto pozici' });
  if (c.workedHere) reasons.push({ ok: true, text: 'Potvrzená směna u vás' });
  if (jobTags && jobTags.length && c.tags && c.tags.length) {
    const matching = c.tags.filter(t => jobTags.some(jt => jt.toLowerCase() === t.toLowerCase()));
    if (matching.length) reasons.push({ ok: true, text: `Relevantní dovednosti: ${matching.slice(0, 2).join(', ')}` });
  }
  if (c.level >= 3) reasons.push({ ok: true, text: `Level ${c.level} — zkušený makač` });
  if (reasons.length < 2) reasons.push({ ok: false, text: 'Nový na platformě — zatím málo dat' });
  return reasons.slice(0, 4);
}

// Spolehlivost z reálných dat
function _reliabilityBars(c) {
  const r = parseFloat(c.rating) || 0;
  const jobs = c.jobsDone || 0;
  const punct = c.punctuality != null ? Math.round(c.punctuality) : Math.min(100, Math.round(r * 18 + jobs * 0.5));
  return [
    { label: 'Dochvilnost',        value: punct },
    { label: 'Komunikace',         value: Math.min(100, Math.round(r * 17 + (jobs > 5 ? 8 : 0))) },
    { label: 'Stálost',            value: Math.min(100, Math.round(jobs * 5 + r * 8)) },
    { label: 'Hodnocení od firem', value: Math.min(100, Math.round(r * 20)) },
  ];
}

const CAND_FILTERS = [
  { k: 'all',        label: 'Všichni' },
  { k: 'favorites',  label: 'Oblíbení',   desc: 'Kandidáti s hodnocením ≥ 4.8 a alespoň 15 brigádami.' },
  { k: 'known',      label: 'Známe se',   desc: 'Kandidáti, se kterými jste již potvrdili spolupráci.' },
  { k: 'experience', label: 'Zkušenost', desc: 'Kandidáti s dovednostmi relevantnímí pro vaše inzeráty.' },
];

function _passFilter(c, filter, jobTags) {
  if (filter === 'all') return true;
  if (filter === 'favorites')  return parseFloat(c.rating) >= 4.8 && c.jobsDone >= 15;
  if (filter === 'known')      return !!c.workedHere;
  if (filter === 'experience') {
    if (!jobTags || !jobTags.length) return !!(c.tags && c.tags.length);
    return !!(c.tags && c.tags.some(t => jobTags.some(jt => jt.toLowerCase() === t.toLowerCase())));
  }
  return true;
}

const CAND_STATUS_PILL = {
  pending:   { label: 'Nový match',        color: '#5B6BFF', bg: 'rgba(91,107,255,0.12)' },
  accepted:  { label: 'Přijat — v chatu', color: '#5BD68A', bg: 'rgba(91,214,138,0.12)' },
  confirmed: { label: 'Potvrzeno',         color: '#0020F6', bg: 'rgba(0,32,246,0.10)'  },
  rejected:  { label: 'Odmítnuto',         color: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
};

function ECandidates() {
  const [filter, setFilter]       = useStateE('all');
  const [jobIds, setJobIds]       = useStateE([]);   // [] = všechny, jinak array vybraných job IDs
  const [dropOpen, setDropOpen]   = useStateE(false);
  const [q, setQ]                 = useStateE('');
  const [selected, setSelected]   = useStateE(null);
  const dropRef = useRefE(null);

  // Přijmout předfiltr z EJobs — čte globální proměnnou nastavenou před přepnutím tabu
  useEffectE(() => {
    if (window._empPresetJobIds) {
      setJobIds(window._empPresetJobIds);
      window._empPresetJobIds = null;
    }
  }, []);

  // Zavřít dropdown kliknutím mimo
  useEffectE(() => {
    if (!dropOpen) return;
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [dropOpen]);

  const allCands = _eAllCands();

  const STATUS_DOT   = { active: '#5BD68A', urgent: '#f43f5e', paused: '#FFD166', filled: '#8AB4FF' };
  const STATUS_LABEL = { active: 'Aktivní', urgent: 'ASAP', paused: 'Pozastaveno', filled: 'Naplněno' };

  // Tagy ze všech vybraných inzerátů (pro filtr Zkušenost a drawer)
  const selectedJobs = jobIds.length ? E_JOBS.filter(j => jobIds.includes(j.id)) : E_JOBS;
  const jobTags = [...new Set(selectedJobs.flatMap(j => j.tags || []))];

  // Kandidáti filtrovaní podle inzerátů
  const jobFiltered = jobIds.length
    ? allCands.filter(c => jobIds.includes(c.job_id))
    : allCands;

  const visible = jobFiltered.filter(c => {
    if (!_passFilter(c, filter, jobTags)) return false;
    if (q.trim()) {
      const sq = q.toLowerCase();
      return (c.name || '').toLowerCase().includes(sq)
        || (c.jobTitle || '').toLowerCase().includes(sq)
        || (c.tags || []).some(t => t.toLowerCase().includes(sq));
    }
    return true;
  });

  const activeF = CAND_FILTERS.find(f => f.k === filter);

  function toggleJob(id) {
    setJobIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  // Label tlačítka dropdown
  const btnLabel = jobIds.length === 0
    ? 'Všechny inzeráty'
    : jobIds.length === 1
      ? (E_JOBS.find(j => j.id === jobIds[0])?.title || '1 inzerát')
      : `${jobIds.length} inzeráty`;

  async function onAccepted() {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) {
      await fetchEmployerData(session.user.id);
      setSelected(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* ── Řádek 1: dropdown inzerátů + search ── */}
      <div style={{ padding: '18px 28px 0', display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Dropdown trigger */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropOpen(o => !o)}
            style={{
              padding: '8px 14px', borderRadius: 10,
              background: jobIds.length ? 'rgba(0,32,246,0.07)' : '#fff',
              border: '1px solid ' + (jobIds.length ? 'rgba(0,32,246,0.28)' : T.border),
              color: jobIds.length ? '#0020F6' : T.ink,
              fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 1px 4px rgba(15,18,40,0.06)',
              transition: 'all .15s',
            }}>
            <Icon name="document-text-bold" size={14} color={jobIds.length ? '#0020F6' : T.muted} />
            <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {btnLabel}
            </span>
            {jobIds.length > 0 && (
              <span style={{ padding: '1px 7px', borderRadius: 6, background: '#0020F6', color: '#fff', fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700 }}>
                {jobIds.length}
              </span>
            )}
            <svg width="10" height="6" viewBox="0 0 10 6" style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
              <path d="M0 0l5 6 5-6z" fill={jobIds.length ? '#0020F6' : T.mutedSoft} />
            </svg>
          </button>

          {/* Dropdown panel */}
          {dropOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
              background: '#fff', borderRadius: 14,
              border: '1px solid ' + T.border,
              boxShadow: '0 8px 32px rgba(15,18,40,0.14)',
              minWidth: 280, maxWidth: 360,
              animation: 'mkBubbleIn .18s',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>Filtr podle inzerátu</span>
                {jobIds.length > 0 && (
                  <button onClick={() => setJobIds([])} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Zrušit výběr
                  </button>
                )}
              </div>
              {/* "Vše" row */}
              <button onClick={() => { setJobIds([]); setDropOpen(false); }} style={{
                width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
                background: jobIds.length === 0 ? 'rgba(0,32,246,0.05)' : 'transparent',
                border: 'none', cursor: 'pointer', borderBottom: '1px solid ' + T.border,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: jobIds.length === 0 ? '#0020F6' : '#fff',
                  border: '1.5px solid ' + (jobIds.length === 0 ? '#0020F6' : T.border),
                  display: 'grid', placeItems: 'center',
                }}>
                  {jobIds.length === 0 && <Icon name="check-bold" size={10} color="#fff" />}
                </div>
                <span style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: jobIds.length === 0 ? 700 : 500 }}>Všechny inzeráty</span>
                <span style={{ marginLeft: 'auto', fontFamily: T.fontMono, fontSize: 11, color: T.mutedSoft }}>{allCands.length}</span>
              </button>
              {/* Job rows */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {E_JOBS.map(j => {
                  const checked = jobIds.includes(j.id);
                  const cnt = allCands.filter(c => c.job_id === j.id).length;
                  const dot = STATUS_DOT[j.status] || T.mutedSoft;
                  const lbl = STATUS_LABEL[j.status] || j.status;
                  return (
                    <button key={j.id} onClick={() => toggleJob(j.id)} style={{
                      width: '100%', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                      background: checked ? 'rgba(0,32,246,0.04)' : 'transparent',
                      border: 'none', borderBottom: '1px solid ' + T.border, cursor: 'pointer',
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        background: checked ? '#0020F6' : '#fff',
                        border: '1.5px solid ' + (checked ? '#0020F6' : T.border),
                        display: 'grid', placeItems: 'center',
                      }}>
                        {checked && <Icon name="check-bold" size={10} color="#fff" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: checked ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: dot, flexShrink: 0 }} />
                          <span style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 10.5 }}>{lbl}</span>
                        </div>
                      </div>
                      <span style={{ fontFamily: T.fontMono, fontSize: 11.5, fontWeight: 700, color: cnt > 0 ? T.ink : T.mutedSoft, flexShrink: 0 }}>{cnt}</span>
                    </button>
                  );
                })}
              </div>
              {/* Footer */}
              {jobIds.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid ' + T.border }}>
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

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ position: 'absolute', left: 10, pointerEvents: 'none', display: 'flex' }}>
            <Icon name="magnifer-linear" size={13} color={T.mutedSoft} />
          </span>
          <input
            placeholder="Hledat kandidáta…"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              paddingLeft: 30, padding: '8px 12px 8px 30px',
              borderRadius: 9, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border,
              color: T.ink, fontFamily: T.fontUI, fontSize: 12.5, width: 200, outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Řádek 2: filter tabs ── */}
      <div style={{ padding: '10px 28px 0', display: 'flex', gap: 6 }}>
        {CAND_FILTERS.map(f => {
          const cnt = f.k === 'all' ? jobFiltered.length
            : jobFiltered.filter(c => _passFilter(c, f.k, jobTags)).length;
          const active = filter === f.k;
          return (
            <button key={f.k} onClick={() => setFilter(f.k)} style={{
              padding: '7px 14px', borderRadius: 9,
              background: active ? '#0020F6' : 'rgba(0,32,246,0.05)',
              border: '1px solid ' + (active ? '#0020F6' : T.border),
              color: active ? '#fff' : T.muted,
              fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .15s',
            }}>
              {f.label}
              <span style={{
                padding: '1px 6px', borderRadius: 6,
                background: active ? 'rgba(255,255,255,0.2)' : 'rgba(15,18,40,0.06)',
                fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700,
                color: active ? '#fff' : T.mutedSoft,
              }}>{cnt}</span>
            </button>
          );
        })}
      </div>

      {/* ── Filter banner ── */}
      {filter !== 'all' && activeF?.desc && (
        <div style={{
          margin: '8px 28px 0', padding: '9px 14px', borderRadius: 10,
          background: 'rgba(0,32,246,0.04)', border: '1px solid rgba(0,32,246,0.12)',
          color: T.ink, fontFamily: T.fontUI, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="info-circle-bold" size={14} color="#5B6BFF" />
          {activeF.desc}
        </div>
      )}

      {/* ── Count row ── */}
      <div style={{ padding: '7px 28px 0', color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span>{visible.length} {visible.length === 1 ? 'kandidát' : visible.length >= 2 && visible.length <= 4 ? 'kandidáti' : 'kandidátů'}</span>
        {jobIds.length > 0 && selectedJobs.map(j => (
          <span key={j.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,32,246,0.07)', border: '1px solid rgba(0,32,246,0.18)', color: '#0020F6', fontFamily: T.fontUI, fontSize: 11, fontWeight: 600 }}>
            {j.title}
            <button onClick={() => toggleJob(j.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', lineHeight: 0 }}>
              <Icon name="close-circle-bold" size={12} color="rgba(0,32,246,0.5)" />
            </button>
          </span>
        ))}
        {q && <span>· hledání: &quot;{q}&quot;</span>}
      </div>

      {/* ── List ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 28px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(c => (
          <CandidateListCard
            key={c.id}
            c={c}
            jobTags={jobTags}
            active={selected?.id === c.id}
            onClick={() => setSelected(c)}
          />
        ))}
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Icon name="users-group-rounded-bold" size={36} color={T.border} />
            <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 13 }}>
              {q ? 'Žádný kandidát neodpovídá hledání.' : 'Žádní kandidáti v této kategorii.'}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <CandidateDrawer
          c={selected}
          jobTags={jobTags}
          onClose={() => setSelected(null)}
          onAccepted={onAccepted}
        />
      )}
    </div>
  );
}

// ── Kandidát — řádkový card ──
function CandidateListCard({ c, jobTags, active, onClick }) {
  const isFavorite = parseFloat(c.rating) >= 4.8 && c.jobsDone >= 15;
  const hasExp = !!(jobTags && jobTags.length && c.tags && c.tags.some(
    t => jobTags.some(jt => jt.toLowerCase() === t.toLowerCase())
  ));
  const pill = CAND_STATUS_PILL[c.relStatus] || CAND_STATUS_PILL[c.status] || CAND_STATUS_PILL.pending;

  return (
    <button onClick={onClick} style={{
      textAlign: 'left', padding: '14px 18px', borderRadius: 14,
      background: active ? 'rgba(0,32,246,0.04)' : '#fff',
      border: '1px solid ' + (active ? 'rgba(0,32,246,0.25)' : T.border),
      boxShadow: active ? '0 0 0 3px rgba(0,32,246,0.08)' : '0 1px 4px rgba(0,32,246,0.06)',
      cursor: 'pointer', color: 'inherit', fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'all .15s',
    }}>
      {/* Avatar */}
      <div style={{
        width: 50, height: 50, borderRadius: 999, flexShrink: 0, overflow: 'hidden',
        background: c.color, display: 'grid', placeItems: 'center',
        color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 17,
      }}>{c.avatarUrl ? <img src={c.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.avatar}</div>

      {/* Střed: jméno + meta + metriky */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 14, fontWeight: 700 }}>{c.name}</span>
          {c.city ? <span style={{ color: T.mutedSoft, fontSize: 12, fontFamily: T.fontUI }}>· {c.city}</span> : null}
          {c.super && (
            <span style={{ padding: '2px 7px', borderRadius: 6, background: 'rgba(245,166,35,0.13)', color: '#F5A623', fontFamily: T.fontUI, fontSize: 10, fontWeight: 800 }}>
              ⭐ Super zájem
            </span>
          )}
          {isFavorite && (
            <span style={{ padding: '2px 7px', borderRadius: 6, background: 'rgba(91,214,138,0.12)', color: '#5BD68A', fontFamily: T.fontUI, fontSize: 10, fontWeight: 700 }}>
              Oblíbený
            </span>
          )}
          {c.workedHere && (
            <span style={{ padding: '2px 7px', borderRadius: 6, background: 'rgba(255,209,102,0.14)', color: '#C99A00', fontFamily: T.fontUI, fontSize: 10, fontWeight: 700 }}>
              Známe se
            </span>
          )}
          {hasExp && !c.workedHere && (
            <span style={{ padding: '2px 7px', borderRadius: 6, background: 'rgba(91,107,255,0.10)', color: '#5B6BFF', fontFamily: T.fontUI, fontSize: 10, fontWeight: 700 }}>
              Zkušenost
            </span>
          )}
          {(typeof E_NOTES !== 'undefined' && (E_NOTES[c.worker_id] || '').trim()) && (
            <span title="Máš u tohoto kandidáta poznámku" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 6, background: 'rgba(245,166,35,0.14)', color: '#C99A00', fontFamily: T.fontUI, fontSize: 10, fontWeight: 700 }}>
              <Icon name="notes-bold" size={10} color="#C99A00" /> Poznámka
            </span>
          )}
        </div>

        <div style={{ color: T.muted, fontSize: 12, fontFamily: T.fontUI, marginBottom: 8 }}>
          {c.jobTitle ? `Reaguje na: ${c.jobTitle}` : 'Brigádník'}
        </div>

        {/* Metriky + tagy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, color: T.ink }}>
            <Icon name="star-bold" size={11} color="#FFD166" />
            {parseFloat(c.rating) > 0 ? c.rating : '–'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: T.muted, fontFamily: T.fontUI, fontSize: 12 }}>
            <Icon name="medal-ribbon-star-bold" size={11} color="#5B6BFF" />
            {c.jobsDone} brigád
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: T.muted, fontFamily: T.fontUI, fontSize: 12 }}>
            <Icon name="cup-star-bold" size={11} color="#5BD68A" />
            L{c.level}
          </span>
          {(c.tags || []).slice(0, 2).map((t, i) => (
            <span key={i} style={{
              padding: '2px 8px', borderRadius: 5,
              background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border,
              color: T.light, fontFamily: T.fontUI, fontSize: 10.5, fontWeight: 600,
            }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Pravá strana: status pill + čas */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <span style={{
          padding: '5px 12px', borderRadius: 8,
          background: pill.bg, color: pill.color,
          fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 700,
        }}>{pill.label}</span>
        <span style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10.5 }}>{c.lastSeen}</span>
      </div>
    </button>
  );
}

function MiniMetric({ icon, v, c }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
      padding: '5px 6px', borderRadius: 6,
      background: T.surfaceAlt, border: '1px solid ' + T.border,
    }}>
      <Icon name={icon} size={11} color={c} />
      <span style={{ color: T.ink, fontFamily: T.fontMono, fontSize: 11, fontWeight: 700 }}>{v}</span>
    </div>
  );
}

// ── Kandidát — detail drawer ──
function CandidateDrawer({ c, jobTags, onClose, onAccepted }) {
  const [accepting, setAccepting] = useStateE(false);
  const [rejecting, setRejecting] = useStateE(false);
  const [note, setNote]           = useStateE(() => (typeof E_NOTES !== 'undefined' ? (E_NOTES[c.worker_id] || '') : ''));
  const [noteSaving, setNoteSaving] = useStateE(false);
  const [noteSaved,  setNoteSaved]  = useStateE(false);

  async function saveNote() {
    setNoteSaving(true); setNoteSaved(false);
    const ok = await saveNoteE(c.worker_id, note);
    setNoteSaving(false);
    if (ok) { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000); }
  }
  const accepted  = c.status === 'accepted' || c.status === 'confirmed';
  const rejected  = c.status === 'rejected';
  const isPending = c.relStatus === 'pending' || c.status === 'pending';

  const reasons  = _matchReasons(c, jobTags);
  const relBars  = _reliabilityBars(c);

  async function handleAccept() {
    if (!c.match_id || !c.job_id || accepting) return;
    setAccepting(true);
    const ok = await acceptCandidate(c.match_id, c.job_id);
    if (ok) { onAccepted?.(); }
    setAccepting(false);
  }

  async function handleReject() {
    if (!c.match_id || rejecting) return;
    setRejecting(true);
    await rejectCandidate(c.match_id);
    onAccepted?.();
    setRejecting(false);
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, maxWidth: '100vw',
      background: '#fff',
      borderLeft: '1px solid ' + T.border,
      boxShadow: '-16px 0 50px rgba(20,22,40,0.14)',
      zIndex: 100, display: 'flex', flexDirection: 'column',
      animation: 'mkBubbleIn .22s',
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Detail kandidáta</span>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: T.surfaceAlt, border: '1px solid ' + T.border, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
          <Icon name="close-square-bold" size={16} color={T.muted} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Hero ── */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, overflow: 'hidden', background: c.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 26, flexShrink: 0 }}>
            {c.avatarUrl ? <img src={c.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{c.name}</div>
            <div style={{ color: T.muted, fontSize: 12, fontFamily: T.fontUI, marginTop: 3 }}>
              {[c.city, c.jobTitle ? `Reaguje na: ${c.jobTitle}` : null].filter(Boolean).join(' · ') || 'Brigádník'}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 9px', borderRadius: 6, background: 'rgba(91,107,255,0.12)', color: '#5B6BFF', fontFamily: T.fontMono, fontSize: 11, fontWeight: 800 }}>Makač L{c.level}</span>
              {c.verified && <span style={{ padding: '3px 9px', borderRadius: 6, background: 'rgba(91,214,138,0.12)', color: '#5BD68A', fontFamily: T.fontMono, fontSize: 11, fontWeight: 800 }}>Ověřený</span>}
              {c.super && <span style={{ padding: '3px 9px', borderRadius: 6, background: 'rgba(245,166,35,0.12)', color: '#F5A623', fontFamily: T.fontMono, fontSize: 11, fontWeight: 800 }}>⭐ Super zájem</span>}
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { l: 'Hodnocení', v: parseFloat(c.rating) > 0 ? c.rating + '★' : '–', col: '#FFD166' },
            { l: 'Brigád',    v: c.jobsDone,              col: '#5B6BFF' },
            { l: 'Hodin',     v: c.hoursLogged || 0,       col: '#5BD68A' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 10, background: T.surfaceAlt, border: '1px solid ' + T.border, textAlign: 'center' }}>
              <div style={{ color: s.col, fontFamily: T.fontMono, fontSize: 20, fontWeight: 700 }}>{s.v}</div>
              <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 10, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── Soukromá poznámka (vidí jen ty) ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: T.ink, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700 }}>
              <Icon name="notes-bold" size={14} color={T.primary} /> Soukromá poznámka
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 10.5 }}>
              <Icon name="lock-keyhole-minimalistic-bold" size={11} color={T.mutedSoft} /> jen ty
            </span>
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={saveNote}
            placeholder="Např. Volal jsem, ozve se ve čtvrtek. Zkušený, ale chce vyšší mzdu…"
            style={{ width: '100%', minHeight: 84, resize: 'vertical', padding: '11px 13px', borderRadius: 11, background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.28)', color: T.ink, fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.5, outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, minHeight: 16 }}>
            <span style={{ color: noteSaved ? '#16a34a' : T.mutedSoft, fontFamily: T.fontUI, fontSize: 11 }}>
              {noteSaving ? 'Ukládám…' : noteSaved ? '✓ Uloženo' : 'Uloží se automaticky po kliknutí mimo pole'}
            </span>
            <button onClick={saveNote} disabled={noteSaving} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.border, color: T.primary, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 700, cursor: noteSaving ? 'default' : 'pointer' }}>Uložit</button>
          </div>
        </div>

        {/* ── Proč je to dobrý match ── */}
        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(0,32,246,0.04)', border: '1px solid rgba(0,32,246,0.10)' }}>
          <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Proč je to dobrý match</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {reasons.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: 999, flexShrink: 0, display: 'grid', placeItems: 'center', background: r.ok ? 'rgba(91,214,138,0.15)' : 'rgba(244,63,94,0.10)' }}>
                  <Icon name={r.ok ? 'check-circle-bold' : 'info-circle-bold'} size={12} color={r.ok ? '#5BD68A' : '#f43f5e'} />
                </div>
                <span style={{ color: T.light, fontFamily: T.fontUI, fontSize: 12.5 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── O kandidátovi ── */}
        {c.bio && (
          <div>
            <div style={{ color: T.muted, fontSize: 10.5, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>O kandidátovi</div>
            <div style={{ color: T.light, fontSize: 12.5, fontFamily: T.fontUI, lineHeight: 1.65, whiteSpace: 'pre-line' }}>{c.bio}</div>
          </div>
        )}

        {/* ── Vzdělání ── */}
        {c.education && (
          <div>
            <div style={{ color: T.muted, fontSize: 10.5, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Vzdělání</div>
            <div style={{ color: T.light, fontSize: 12.5, fontFamily: T.fontUI }}>{c.education}</div>
          </div>
        )}

        {/* ── Dovednosti ── */}
        <div>
          <div style={{ color: T.muted, fontSize: 10.5, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Dovednosti</div>
          {c.tags && c.tags.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {c.tags.map((t, i) => {
                const matched = jobTags && jobTags.some(jt => jt.toLowerCase() === t.toLowerCase());
                return (
                  <span key={i} style={{
                    padding: '5px 11px', borderRadius: 7,
                    background: matched ? 'rgba(0,32,246,0.08)' : 'rgba(91,107,255,0.08)',
                    border: '1px solid ' + (matched ? 'rgba(0,32,246,0.20)' : 'rgba(91,107,255,0.18)'),
                    color: matched ? '#0020F6' : T.light,
                    fontFamily: T.fontUI, fontSize: 11.5, fontWeight: matched ? 700 : 600,
                  }}>{t}</span>
                );
              })}
            </div>
          ) : (
            <div style={{ color: T.mutedSoft, fontSize: 12, fontFamily: T.fontUI, fontStyle: 'italic' }}>Zatím neuvedl žádné dovednosti.</div>
          )}
        </div>

        {/* ── Spolehlivost ── */}
        {(parseFloat(c.rating) > 0 || c.jobsDone > 0) && (
          <div>
            <div style={{ color: T.muted, fontSize: 10.5, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 }}>Spolehlivost</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {relBars.map((bar, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: T.light, fontSize: 12, fontFamily: T.fontUI, fontWeight: 500 }}>{bar.label}</span>
                    <span style={{ color: T.ink, fontFamily: T.fontMono, fontSize: 12, fontWeight: 700 }}>{bar.value}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: T.surfaceAlt, overflow: 'hidden', border: '1px solid ' + T.border }}>
                    <div style={{
                      height: '100%', width: bar.value + '%',
                      background: bar.value >= 70
                        ? 'linear-gradient(90deg, #5BD68A, #1a8f52)'
                        : bar.value >= 40
                          ? 'linear-gradient(90deg, #FFD166, #C99A00)'
                          : 'linear-gradient(90deg, #f43f5e, #c0002a)',
                      borderRadius: 4, transition: 'width .4s',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Plný profil ── */}
        <button
          onClick={() => window.empOpenProfile && window.empOpenProfile(c.worker_id, { name: c.name, address: c.city, level: c.level, jobs_done: c.jobsDone, rating: c.rating, verified: c.verified })}
          style={{
            padding: '11px 14px', borderRadius: 10,
            background: T.surfaceAlt, border: '1px solid ' + T.border,
            color: T.ink, cursor: 'pointer', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
          <Icon name="user-id-bold" size={14} color="#5B6BFF" />
          Otevřít plný profil + recenze
        </button>
      </div>

      {/* ── Footer akce ── */}
      <div style={{ padding: 16, borderTop: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {accepted && !isPending ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, background: 'rgba(91,214,138,0.10)', border: '1px solid rgba(91,214,138,0.25)', color: '#5BD68A', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>
            <Icon name="check-circle-bold" size={16} color="#5BD68A" />
            {c.status === 'confirmed' ? 'Směna potvrzena' : 'Kandidát přijat — domlouvá se v chatu'}
          </div>
        ) : rejected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', fontFamily: T.fontUI, fontSize: 13, fontWeight: 600 }}>
            <Icon name="close-circle-bold" size={16} color="#f43f5e" />Odmítnuto
          </div>
        ) : isPending ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={handleAccept} disabled={accepting} style={{
              padding: '12px 14px', borderRadius: 10,
              background: accepting ? 'rgba(91,214,138,0.2)' : 'linear-gradient(135deg, #1a8f52, #15713f)',
              border: '1px solid rgba(91,214,138,0.4)', color: '#fff', cursor: 'pointer',
              fontFamily: T.fontUI, fontSize: 13, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: accepting ? 0.7 : 1,
            }}>
              <Icon name="check-circle-bold" size={14} color="#fff" />
              {accepting ? 'Přijímám…' : 'Přijmout'}
            </button>
            <button onClick={handleReject} disabled={rejecting} style={{
              padding: '12px 14px', borderRadius: 10,
              background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.25)',
              color: '#f43f5e', cursor: 'pointer',
              fontFamily: T.fontUI, fontSize: 13, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: rejecting ? 0.7 : 1,
            }}>
              <Icon name="close-circle-bold" size={14} color="#f43f5e" />
              {rejecting ? 'Odmítám…' : 'Odmítnout'}
            </button>
          </div>
        ) : null}
        <button style={{
          padding: '10px 14px', borderRadius: 10,
          background: T.surfaceAlt, border: '1px solid ' + T.border,
          color: T.light, cursor: 'pointer',
          fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }} onClick={() => window.empGoTab && window.empGoTab('chat')}>
          <Icon name="chat-round-line-bold" size={13} color={T.light} />
          Napsat zprávu
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { EJobs, ECandidates });
