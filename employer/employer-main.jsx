// Makej Employer — main entry (with live Supabase data)

const TITLES = {
  dash:       { title: 'Dashboard',   subtitle: 'Přehled výkonu náboru za 30 dní' },
  analytics:  { title: 'Analytika',   subtitle: 'Pokročilé reporty a segmentace' },
  jobs:       { title: 'Inzeráty',   subtitle: 'Správa a výkon vašich brigád' },
  candidates: { title: 'Kandidáti',  subtitle: 'Náborový pipeline' },
  chat:       { title: 'Zprávy',     subtitle: 'Komunikace s kandidáty' },
  calendar:   { title: 'Plán směn',  subtitle: 'Kalendář obsazení a otevřené sloty' },
  settings:   { title: 'Nastavení',  subtitle: 'Firemní profil a nastavení' },
};

function ELoadingSpinner() {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 999,
          border: '3px solid rgba(0,32,246,0.18)', borderTopColor: '#5B6BFF',
          animation: 'empSpin .75s linear infinite', margin: '0 auto',
        }} />
        <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13, marginTop: 14 }}>Načítám data…</div>
      </div>
    </div>
  );
}

function EEmptyState() {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40, maxWidth: 400 }}>
        <Icon name="document-add-bold" size={56} color={T.mutedSoft} />
        <div style={{ marginTop: 18, fontSize: 20, color: '#fff', fontWeight: 800, fontFamily: T.fontHead }}>
          Zatím žádné inzeráty
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: T.muted, fontFamily: T.fontUI, lineHeight: 1.6 }}>
          Vytvořte první inzerát v mobilní aplikaci Makej! a kandidáti se začnou ozývat.
        </div>
        <div style={{
          marginTop: 20, padding: '12px 20px', borderRadius: 12,
          background: 'rgba(91,107,255,0.12)', border: '1px solid rgba(91,107,255,0.25)',
          color: T.light, fontFamily: T.fontUI, fontSize: 12, lineHeight: 1.5,
        }}>
          📱 Stáhněte aplikaci Makej! a přidejte první brigádu
        </div>
      </div>
    </div>
  );
}

const EMPTY_JOB_FORM = {
  title: '', description: '', pay: '', pay_unit: 'Kč/h',
  location: '', date: '', time_start: '', time_end: '',
  tags: '', requirements: '', job_type: 'brigada',
  hours_per_week: '', start_date: '', contract_duration: '',
  contract_type: 'HPP', benefits: '',
};

const JOB_TYPES = [
  { value: 'jednrazova_vypomoc', label: 'Jednorázová výpomoc', icon: '⚡', desc: 'Jednorázová akce' },
  { value: 'brigada',            label: 'Brigáda',             icon: '💼', desc: 'Krátkodobá práce' },
  { value: 'part_time',          label: 'Part-time',           icon: '🕐', desc: 'Částečný úvazek' },
  { value: 'full_time',          label: 'Full-time',           icon: '🏢', desc: 'Plný úvazek' },
];

const CONTRACT_TYPES = ['HPP', 'DPP', 'DPČ', 'Živnostenský list'];

function ENewJobModal({ onClose, onCreated }) {
  const [form,   setForm]   = useStateE(EMPTY_JOB_FORM);
  const [saving, setSaving] = useStateE(false);
  const [err,    setErr]    = useStateE('');

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const isOneshot  = form.job_type === 'jednrazova_vypomoc';
  const isBrigada  = form.job_type === 'brigada';
  const isPartTime = form.job_type === 'part_time';
  const isFullTime = form.job_type === 'full_time';
  const isShortTerm = isOneshot || isBrigada;

  async function handleSubmit() {
    if (!form.title.trim())    { setErr('Vyplň název pozice.'); return; }
    if (!form.pay)             { setErr('Vyplň mzdu.'); return; }
    if (!form.location.trim()) { setErr('Vyplň místo.'); return; }
    setSaving(true); setErr('');
    const { data: { session } } = await sb.auth.getSession();
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const reqs = form.requirements.split(',').map(r => r.trim()).filter(Boolean);
    const result = await createJobE(session.user.id, { ...form, tags, requirements: reqs });
    setSaving(false);
    if (!result) { setErr('Nepodařilo se přidat inzerát. Zkus to znovu.'); return; }
    onCreated();
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 9,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(208,208,255,0.14)',
    color: '#fff', fontFamily: T.fontUI, fontSize: 13, outline: 'none',
    transition: 'border-color .2s',
  };
  const labelStyle = { color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 5 };
  const rowStyle   = { marginBottom: 14 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#16163b', border: '1px solid rgba(208,208,255,0.12)', borderRadius: 20,
        padding: 28, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'empPop .3s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 18, fontWeight: 800 }}>Nový inzerát</div>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, marginTop: 2 }}>
              {isOneshot  ? 'Vyplň základní info — datum, čas a odměnu' :
               isBrigada  ? 'Krátkodobá brigáda s konkrétním termínem' :
               isPartTime ? 'Částečný úvazek — hodinový nebo měsíční' :
               'Plný úvazek s detailními podmínkami'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4, fontSize: 16, lineHeight: 1, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {err && <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 9, padding: '9px 13px', color: '#f87171', fontFamily: T.fontUI, fontSize: 12, marginBottom: 14 }}>{err}</div>}

        {/* Typ inzerátu */}
        <div style={rowStyle}>
          <label style={labelStyle}>Typ inzerátu</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {JOB_TYPES.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const n = opt.value;
                  setForm(f => ({
                    ...f, job_type: n,
                    pay_unit: (n === 'full_time' || n === 'part_time') ? 'Kč/měsíc' : 'Kč/h',
                    date: '', time_start: '', time_end: '',
                    hours_per_week: '', start_date: '', contract_duration: '',
                    contract_type: 'HPP', benefits: '',
                  }));
                }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  background: form.job_type === opt.value ? 'rgba(41,41,120,0.5)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid ' + (form.job_type === opt.value ? 'rgba(208,208,255,0.5)' : 'rgba(208,208,255,0.12)'),
                  transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <span style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700 }}>{opt.label}</span>
                <span style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 10.5 }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Název pozice — vždy */}
        <div style={rowStyle}>
          <label style={labelStyle}>Název pozice *</label>
          <input style={inputStyle} placeholder="např. Barista, Skladník, Hosteska…" value={form.title} onChange={e => setF('title', e.target.value)} />
        </div>

        {/* Mzda — vždy, label a jednotky se mění podle typu */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>{isFullTime ? 'Měsíční mzda *' : 'Mzda *'}</label>
            <input style={inputStyle} type="number" placeholder={isFullTime ? '35 000' : isPartTime ? '180' : '180'} value={form.pay} onChange={e => setF('pay', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Jednotka</label>
            {isFullTime ? (
              <select style={{ ...inputStyle, appearance: 'none' }} value={form.pay_unit} onChange={e => setF('pay_unit', e.target.value)}>
                <option>Kč/měsíc</option>
              </select>
            ) : isPartTime ? (
              <select style={{ ...inputStyle, appearance: 'none' }} value={form.pay_unit} onChange={e => setF('pay_unit', e.target.value)}>
                <option>Kč/h</option>
                <option>Kč/měsíc</option>
              </select>
            ) : (
              <select style={{ ...inputStyle, appearance: 'none' }} value={form.pay_unit} onChange={e => setF('pay_unit', e.target.value)}>
                <option>Kč/h</option>
                <option>Kč/směna</option>
                <option>Kč/den</option>
              </select>
            )}
          </div>
        </div>

        {/* Místo — vždy */}
        <div style={rowStyle}>
          <label style={labelStyle}>Místo *</label>
          <input style={inputStyle} placeholder="např. Brno — Veveří" value={form.location} onChange={e => setF('location', e.target.value)} />
        </div>

        {/* Krátkodobé: datum + čas (jednorázová / brigáda) */}
        {isShortTerm && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Datum</label>
              <input style={inputStyle} type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Začátek</label>
              <input style={inputStyle} type="time" value={form.time_start} onChange={e => setF('time_start', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Konec</label>
              <input style={inputStyle} type="time" value={form.time_end} onChange={e => setF('time_end', e.target.value)} />
            </div>
          </div>
        )}

        {/* Part-time: hodin týdně + nástup */}
        {isPartTime && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Hodin týdně</label>
              <input style={inputStyle} type="number" placeholder="20" value={form.hours_per_week} onChange={e => setF('hours_per_week', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Nástup od</label>
              <input style={inputStyle} type="date" value={form.start_date} onChange={e => setF('start_date', e.target.value)} />
            </div>
          </div>
        )}
        {isPartTime && (
          <div style={rowStyle}>
            <label style={labelStyle}>Délka spolupráce</label>
            <input style={inputStyle} placeholder="např. 3 měsíce, neurčito…" value={form.contract_duration} onChange={e => setF('contract_duration', e.target.value)} />
          </div>
        )}

        {/* Full-time: typ úvazku + nástup + délka */}
        {isFullTime && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Typ úvazku</label>
              <select style={{ ...inputStyle, appearance: 'none' }} value={form.contract_type} onChange={e => setF('contract_type', e.target.value)}>
                {CONTRACT_TYPES.map(ct => <option key={ct}>{ct}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nástup od</label>
              <input style={inputStyle} type="date" value={form.start_date} onChange={e => setF('start_date', e.target.value)} />
            </div>
          </div>
        )}
        {isFullTime && (
          <div style={rowStyle}>
            <label style={labelStyle}>Délka spolupráce</label>
            <input style={inputStyle} placeholder="např. neurčito, 1 rok, zkušební 3 měs.…" value={form.contract_duration} onChange={e => setF('contract_duration', e.target.value)} />
          </div>
        )}

        {/* Popis — vždy, ale placeholder se mění */}
        <div style={rowStyle}>
          <label style={labelStyle}>{isFullTime ? 'Popis pozice' : isPartTime ? 'Popis práce' : 'Popis'}</label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            rows={isFullTime ? 4 : 3}
            placeholder={
              isFullTime  ? 'Náplň práce, co hledáme, pracovní podmínky a prostředí…' :
              isPartTime  ? 'Co bude zaměstnanec dělat, prostředí, co nabízíte…' :
              isOneshot   ? 'Stručný popis práce (nepovinné)' :
                            'Popis práce, čeká se na brigádníka…'
            }
            value={form.description}
            onChange={e => setF('description', e.target.value)}
          />
        </div>

        {/* Benefity — jen full-time */}
        {isFullTime && (
          <div style={rowStyle}>
            <label style={labelStyle}>Benefity</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
              rows={2}
              placeholder="Stravenky, home office, 5 týdnů dovolené, sick days, cafeterie…"
              value={form.benefits}
              onChange={e => setF('benefits', e.target.value)}
            />
          </div>
        )}

        {/* Tagy — vždy */}
        <div style={rowStyle}>
          <label style={labelStyle}>Tagy (oddělené čárkou)</label>
          <input
            style={inputStyle}
            placeholder={
              isFullTime  ? 'IT, Marketing, Vedoucí pozice, Praha' :
              isPartTime  ? 'Gastro, Administrativa, Víkendy' :
                            'Gastro, Ranní směna, Bez zkušeností'
            }
            value={form.tags}
            onChange={e => setF('tags', e.target.value)}
          />
        </div>

        {/* Požadavky — skryté u jednorázové */}
        {!isOneshot && (
          <div style={rowStyle}>
            <label style={labelStyle}>{isFullTime ? 'Požadavky' : 'Výhody / požadavky'} (oddělené čárkou)</label>
            <input
              style={inputStyle}
              placeholder={
                isFullTime  ? 'VŠ vzdělání, angličtina B2, praxe 2+ roky' :
                isPartTime  ? 'Spolehlivost, flexibilita, zájem o obor' :
                              'Káva zdarma, Nástup ihned'
              }
              value={form.requirements}
              onChange={e => setF('requirements', e.target.value)}
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: '100%', padding: '13px', borderRadius: 11,
            background: 'linear-gradient(135deg, #0020F6, #3a3a99)',
            border: 'none', color: '#fff',
            fontFamily: T.fontHead, fontSize: 15, fontWeight: 800,
            cursor: 'pointer', opacity: saving ? 0.6 : 1, marginTop: 4,
          }}>
          {saving ? 'Přidávám…' : 'Přidat inzerát'}
        </button>
      </div>
    </div>
  );
}

function EToast({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', top: 20, right: 24, zIndex: 9000,
      display: 'flex', flexDirection: 'column', gap: 10,
      width: 'min(360px, calc(100vw - 48px))', pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'rgba(16,16,42,0.97)',
          border: '1px solid ' + (t.type === 'success' ? 'rgba(91,214,138,0.45)' : 'rgba(91,107,255,0.45)'),
          borderRadius: 14, padding: '13px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'empPop .3s cubic-bezier(.2,.8,.2,1)',
          pointerEvents: 'auto',
        }}>
          <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {t.title && <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{t.title}</div>}
            <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 12, lineHeight: 1.4 }}>{t.text}</div>
          </div>
          <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', color: T.mutedSoft, cursor: 'pointer', padding: 2, lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

function EmployerApp() {
  const [tab,       setTab]       = useStateE('dash');
  const [loaded,    setLoaded]    = useStateE(false);
  const [tick,      setTick]      = useStateE(0);
  const [showNewJob, setShowNewJob] = useStateE(false);
  const [toasts,    setToasts]    = useStateE([]);
  const empId                     = useRefE(null);

  function addToast(title, text, icon = '🔔', type = 'info') {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, text, icon, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }

  // Initial data fetch on mount
  useEffectE(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      empId.current = session.user.id;
      fetchEmployerData(session.user.id).then(() => {
        setLoaded(true);
        setTick(1);
      });
    });
  }, []);

  // Realtime: refresh data when matches or jobs change
  useEffectE(() => {
    if (!loaded || !empId.current) return;
    const id = empId.current;

    const channel = sb.channel('emp-rt-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, async (payload) => {
        await fetchEmployerData(id);
        setTick(t => t + 1);
        const jobId = payload.new?.job_id;
        const job = E_JOBS.find(j => j.id === jobId);
        addToast('Nový zájem o brigádu', job?.title || 'Někdo projevil zájem', '👤', 'info');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, async () => {
        await fetchEmployerData(id);
        setTick(t => t + 1);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, async () => {
        await fetchEmployerData(id);
        setTick(t => t + 1);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs' }, async () => {
        await fetchEmployerData(id);
        setTick(t => t + 1);
      })
      .subscribe();

    return () => { try { sb.removeChannel(channel); } catch(e) {} };
  }, [loaded]);

  async function handleSignOut() {
    await sb.auth.signOut();
    window.location.href = '/';
  }

  const meta   = TITLES[tab] || TITLES.dash;
  const noData = loaded && E_JOBS.length === 0;

  let body;
  if (!loaded) {
    body = <ELoadingSpinner />;
  } else if (noData && tab === 'dash') {
    body = <EEmptyState />;
  } else if (tab === 'dash')        body = <EDashboard key={tick} />;
  else if (tab === 'analytics')     body = <EAnalytics key={tick} />;
  else if (tab === 'jobs')          body = <EJobs key={tick} onTab={setTab} />;
  else if (tab === 'candidates')    body = <ECandidates key={tick} />;
  else if (tab === 'chat')          body = <EMessages key={tick} />;
  else if (tab === 'calendar')      body = <ECalendar key={tick} />;
  else if (tab === 'settings')      body = <ESettings key={tick} />;
  else body = (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: T.muted, fontFamily: T.fontUI }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Icon name="hourglass-bold" size={48} color={T.mutedSoft} />
        <div style={{ marginTop: 16, fontSize: 16, color: T.light, fontWeight: 700, fontFamily: T.fontHead }}>{meta.title} — brzy</div>
        <div style={{ marginTop: 6, fontSize: 13 }}>Tato sekce je v přípravě.</div>
        <button onClick={() => setTab('dash')} style={{ marginTop: 18, padding: '10px 18px', borderRadius: 9, background: 'rgba(91,107,255,0.18)', border: '1px solid rgba(91,107,255,0.35)', color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Zpět na dashboard</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: T.bg, position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4,
        backgroundImage: 'radial-gradient(rgba(91,107,255,0.08) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      <div style={{
        position: 'absolute', top: -300, left: -200, width: 700, height: 700, borderRadius: 999,
        background: 'radial-gradient(circle, rgba(0,32,246,0.18), transparent 60%)',
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      {loaded && <ESidebar tab={tab} onTab={setTab} />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {loaded && <ETopbar title={meta.title} subtitle={meta.subtitle} onNew={() => setShowNewJob(true)} onSignOut={handleSignOut} />}
        {body}
      </main>

      {showNewJob && (
        <ENewJobModal
          onClose={() => setShowNewJob(false)}
          onCreated={async () => {
            setShowNewJob(false);
            await fetchEmployerData(empId.current);
            setTick(t => t + 1);
          }}
        />
      )}

      <EToast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<EmployerApp />);
