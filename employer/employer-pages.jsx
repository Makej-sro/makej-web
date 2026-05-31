// Makej Employer — Inzeráty (jobs management) + Kandidáti (kanban)

const STATUS_META = {
  active: { label: 'Aktivní', color: '#5BD68A', dot: true },
  urgent: { label: 'ASAP · spěchá', color: '#f43f5e', dot: true, pulse: true },
  paused: { label: 'Pozastaveno', color: '#FFD166' },
  filled: { label: 'Naplněno', color: '#8AB4FF' },
};

function EJobs({ onTab }) {
  const [filter, setFilter] = useStateE('all');
  const filtered = filter === 'all' ? E_JOBS : E_JOBS.filter(j => j.status === filter);

  return (
    <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Aktivních', value: E_JOBS.filter(j=>j.status==='active'||j.status==='urgent').length, sub: 'inzerátů', color: '#5BD68A' },
          { label: 'Celkem zhlédnutí', value: E_JOBS.reduce((a,j)=>a+j.views,0).toLocaleString('cs-CZ').replace(/,/g,' '), sub: 'za 30 dní', color: '#5B6BFF' },
          { label: 'Průměrný CTR', value: (E_JOBS.reduce((a,j)=>a+j.ctr,0)/E_JOBS.length).toFixed(1)+'%', sub: 'swajp → match', color: '#FFD166' },
          { label: 'Najato celkem', value: E_JOBS.reduce((a,j)=>a+j.hired,0), sub: 'v tomto měsíci', color: '#5BD68A' },
        ].map((s, i) => (
          <ECard key={i} padding={16}>
            <div style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: -0.8 }}>{s.value}</div>
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
            background: filter === f.k ? 'rgba(91,107,255,0.2)' : 'rgba(255,255,255,0.03)',
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
          <input placeholder="Hledat inzerát…" style={{
            paddingLeft: 30, padding: '8px 12px 8px 30px',
            borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border,
            color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, width: 220, outline: 'none',
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
                    <span style={{ fontSize: 10, fontFamily: T.fontMono, color: T.mutedSoft }}>{j.plan}</span>
                  </div>
                  <div style={{ paddingLeft: 8 }}>
                    <div style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.3, lineHeight: 1.2 }}>{j.title}</div>
                    <div style={{ fontFamily: T.fontUI, fontSize: 11.5, color: T.muted, marginTop: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="dollar-bold" size={12} color={T.muted} />
                        <span style={{ fontFamily: T.fontMono, color: '#fff', fontWeight: 700 }}>{j.pay}</span> {j.payUnit}
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
                        <div style={{ color: '#fff', fontFamily: T.fontMono, fontSize: 20, fontWeight: 700, marginTop: 3, letterSpacing: -0.6 }}>{m.v}</div>
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
                  <button onClick={() => onTab?.('candidates')} style={{
                    padding: '10px 12px', borderRadius: 9,
                    background: 'linear-gradient(135deg, #0020F6, #2D2CA7)',
                    border: 'none', color: '#fff', cursor: 'pointer',
                    fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><Icon name="users-group-rounded-bold" size={14} color="#fff"/>Kandidáti ({j.matches})</button>
                  <button style={{
                    padding: '8px 12px', borderRadius: 9,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border,
                    color: T.light, cursor: 'pointer',
                    fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><Icon name="rocket-2-bold" size={12} color={T.super}/>Boostnout</button>
                  <button style={{
                    padding: '8px 12px', borderRadius: 9,
                    background: 'transparent', border: '1px solid ' + T.border,
                    color: T.muted, cursor: 'pointer',
                    fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><Icon name="pen-2-linear" size={12} color={T.muted}/>Upravit</button>
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
        <span style={{ color: '#fff', fontFamily: T.fontMono, fontSize: 11.5, fontWeight: 700 }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, #5B6BFF, #0020F6)' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CANDIDATES — kanban
// ─────────────────────────────────────────────────────────────
function ECandidates() {
  const [selected, setSelected] = useStateE(null);
  const columns = [
    { k: 'new', label: 'Noví matche', count: E_CANDIDATES.new.length, color: '#5B6BFF', icon: 'star-bold' },
    { k: 'shortlist', label: 'Shortlist', count: E_CANDIDATES.shortlist.length, color: '#FFD166', icon: 'bookmark-bold' },
    { k: 'interview', label: 'Pohovor', count: E_CANDIDATES.interview.length, color: '#E0B0FF', icon: 'phone-bold' },
    { k: 'hired', label: 'Najato', count: E_CANDIDATES.hired.length, color: '#5BD68A', icon: 'check-circle-bold' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '24px 28px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13 }}>
          Inzerát: <span style={{ color: '#fff', fontWeight: 700 }}>{E_JOBS[0]?.title || 'Všechny inzeráty'}</span>
        </div>
        <span style={{ width: 3, height: 3, borderRadius: 999, background: T.mutedSoft }} />
        <span style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 12 }}>{Object.values(E_CANDIDATES).flat().length} matchů · {E_CANDIDATES.hired.length} najato</span>
        <div style={{ flex: 1 }} />
        <button style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, color: T.light, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="filter-bold" size={12} color={T.light}/>
          Filtry
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, padding: '0 28px 28px', overflow: 'hidden' }}>
        {columns.map(col => (
          <div key={col.k} style={{
            display: 'flex', flexDirection: 'column', minHeight: 0,
            borderRadius: 14,
            background: 'rgba(15,15,40,0.4)',
            border: '1px solid ' + T.border,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 14px', borderBottom: '1px solid ' + T.border,
              display: 'flex', alignItems: 'center', gap: 8,
              background: col.color + '11',
            }}>
              <Icon name={col.icon} size={14} color={col.color} />
              <span style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{col.label}</span>
              <span style={{
                padding: '1px 7px', borderRadius: 999,
                background: col.color + '22', color: col.color,
                fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 700,
              }}>{col.count}</span>
              <div style={{ flex: 1 }} />
              <Icon name="menu-dots-bold" size={14} color={T.mutedSoft}/>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {E_CANDIDATES[col.k].map(c => (
                <CandidateCard key={c.id} c={c} stage={col.k} active={selected?.id === c.id} onClick={() => setSelected({ ...c, stage: col.k })} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected ? (
        <CandidateDrawer
          c={selected}
          onClose={() => setSelected(null)}
          onAccepted={async () => {
            // Refresh global data so dashboard reflects the change
            const { data: { session } } = await sb.auth.getSession();
            if (session?.user) {
              await fetchEmployerData(session.user.id);
              setSelected(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function CandidateCard({ c, stage, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', padding: 12, borderRadius: 11,
      background: active ? 'linear-gradient(135deg, rgba(0,32,246,0.2), rgba(91,107,255,0.08))' : 'rgba(22,22,59,0.6)',
      border: '1px solid ' + (active ? 'rgba(91,107,255,0.4)' : T.border),
      cursor: 'pointer', color: 'inherit',
      display: 'flex', flexDirection: 'column', gap: 10,
      fontFamily: 'inherit',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 999,
          background: c.color, display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 13,
          flexShrink: 0,
        }}>{c.avatar}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
          <div style={{ color: T.muted, fontSize: 10.5, fontFamily: T.fontUI, marginTop: 1 }}>
            {c.distance != null ? <><span style={{ fontFamily: T.fontMono }}>{c.age}</span> · {c.distance} km</> : (c.age != null ? <span style={{ fontFamily: T.fontMono }}>{c.age}</span> : null)}
          </div>
        </div>
        <div style={{
          padding: '2px 7px', borderRadius: 6,
          background: 'rgba(91,214,138,0.18)', color: '#5BD68A',
          fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 800,
        }}>{c.match}%</div>
      </div>

      {/* metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        <MiniMetric icon="star-bold" v={c.rating} c="#FFD166" />
        <MiniMetric icon="medal-ribbon-star-bold" v={c.jobsDone} c="#5B6BFF" />
        <MiniMetric icon="cup-star-bold" v={'L' + c.level} c="#5BD68A" />
      </div>

      {/* tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {c.tags.slice(0, 3).map((t, i) => (
          <span key={i} style={{
            padding: '2px 7px', borderRadius: 5,
            background: 'rgba(255,255,255,0.05)', border: '1px solid ' + T.border,
            color: T.light, fontFamily: T.fontUI, fontSize: 10, fontWeight: 600,
          }}>{t}</span>
        ))}
      </div>

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid ' + T.border, paddingTop: 8 }}>
        <span style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 9.5 }}>{c.lastSeen}</span>
        {stage === 'interview' ? <span style={{ color: '#E0B0FF', fontFamily: T.fontMono, fontSize: 9.5, fontWeight: 700 }}>{c.interview}</span> : null}
        {stage === 'hired' ? <span style={{ color: '#5BD68A', fontFamily: T.fontMono, fontSize: 9.5, fontWeight: 700 }}>{c.shift}</span> : null}
        {(stage === 'new' || stage === 'shortlist') ? <Icon name="alt-arrow-right-line-duotone" size={12} color={T.muted}/> : null}
      </div>
    </button>
  );
}

function MiniMetric({ icon, v, c }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center',
      padding: '5px 6px', borderRadius: 6,
      background: 'rgba(0,0,0,0.25)', border: '1px solid ' + T.border,
    }}>
      <Icon name={icon} size={11} color={c} />
      <span style={{ color: '#fff', fontFamily: T.fontMono, fontSize: 11, fontWeight: 700 }}>{v}</span>
    </div>
  );
}

function CandidateDrawer({ c, onClose, onAccepted }) {
  const [accepting, setAccepting] = useStateE(false);
  const [rejecting, setRejecting] = useStateE(false);
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
      background: 'rgba(7,7,26,0.96)', backdropFilter: 'blur(24px)',
      borderLeft: '1px solid ' + T.border,
      boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
      zIndex: 100, display: 'flex', flexDirection: 'column',
      animation: 'mkBubbleIn .25s',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>Detail kandidáta</span>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, color: T.light, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
          <Icon name="close-square-bold" size={16} color={T.muted}/>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Hero */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: c.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 26 }}>{c.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 20, fontWeight: 800 }}>{c.name}</div>
            <div style={{ color: T.muted, fontSize: 12, fontFamily: T.fontUI, marginTop: 2 }}>{c.age} let · Brno · {c.distance} km</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(91,214,138,0.2)', color: '#5BD68A', fontFamily: T.fontMono, fontSize: 11, fontWeight: 800 }}>{c.match}% match</span>
              <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(91,107,255,0.2)', color: '#5B6BFF', fontFamily: T.fontMono, fontSize: 11, fontWeight: 800 }}>Makač L{c.level}</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { l: 'Hodnocení', v: c.rating + '★', c: '#FFD166' },
            { l: 'Brigád', v: c.jobsDone, c: '#5B6BFF' },
            { l: 'Spolehlivost', v: '98%', c: '#5BD68A' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 12, borderRadius: 10, background: 'rgba(22,22,59,0.6)', border: '1px solid ' + T.border, textAlign: 'center' }}>
              <div style={{ color: s.c, fontFamily: T.fontMono, fontSize: 18, fontWeight: 700 }}>{s.v}</div>
              <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Why match */}
        <div>
          <div style={{ color: T.muted, fontSize: 10.5, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Proč je to dobrý match</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { i: 'check-circle-bold', t: 'Má 23 brigád v gastru s hodnocením 4.9★', c: '#5BD68A' },
              { i: 'check-circle-bold', t: 'Bydlí 1.2 km od vaší kavárny', c: '#5BD68A' },
              { i: 'check-circle-bold', t: 'Volný v požadovaných slotech (Po-Pá ráno)', c: '#5BD68A' },
              { i: 'info-circle-bold', t: 'Maturuje na jaře — preferuje odpolední směny', c: '#FFD166' },
            ].map((x, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                <Icon name={x.i} size={14} color={x.c}/>
                <span style={{ color: T.light, fontSize: 12, fontFamily: T.fontUI }}>{x.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <div style={{ color: T.muted, fontSize: 10.5, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Dovednosti</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {[...c.tags, 'Pokladna', 'AJ B2', 'Týmovost'].map((t, i) => (
              <span key={i} style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(91,107,255,0.12)', border: '1px solid rgba(91,107,255,0.25)', color: T.light, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Reliability radar-ish bars */}
        <div>
          <div style={{ color: T.muted, fontSize: 10.5, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>Profil spolehlivosti</div>
          {[
            { l: 'Dochvilnost', v: 98 },
            { l: 'Komunikace', v: 92 },
            { l: 'Stálost', v: 88 },
            { l: 'Recenze od firem', v: 96 },
          ].map((r, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.fontUI, marginBottom: 3 }}>
                <span style={{ color: T.light }}>{r.l}</span>
                <span style={{ color: '#fff', fontFamily: T.fontMono, fontWeight: 700 }}>{r.v}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: r.v + '%', background: 'linear-gradient(90deg, #5BD68A, #5BD68Aaa)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, borderTop: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
        <button style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border,
          color: T.light, cursor: 'pointer',
          fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}><Icon name="chat-round-line-bold" size={13} color={T.light}/>Napsat zprávu</button>
      </div>
    </div>
  );
}

Object.assign(window, { EJobs, ECandidates });
