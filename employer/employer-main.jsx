// Makej Employer — main entry (with live Supabase data)

// ── Datumový „revolver" picker (den·měsíc·rok) — tmavá varianta pro dashboard ──
const _E_MESICE = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const _E_ROKY = (() => { const l = new Date().getFullYear(); const a = []; for (let r = l; r <= l + 3; r++) a.push(r); return a; })();
function _eRozloz(v) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); const n = new Date(); return m ? { y: +m[1], mo: +m[2] - 1, d: +m[3] } : { y: n.getFullYear(), mo: n.getMonth(), d: n.getDate() }; }
function _eFmt(v) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? (+m[3] + '. ' + (+m[2]) + '. ' + m[1]) : ''; }

function EWheel({ items, index, itemW, onIndex }) {
  const boxRef = useRefE(null);
  const timRef = useRefE(null);
  useEffectE(() => { const el = boxRef.current; if (el) el.scrollLeft = index * itemW; return () => clearTimeout(timRef.current); }, []);
  function onScroll() { clearTimeout(timRef.current); timRef.current = setTimeout(() => { const el = boxRef.current; if (!el) return; const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollLeft / itemW))); if (i !== index) onIndex(i); }, 90); }
  function klepni(i) { const el = boxRef.current; if (el) el.scrollTo({ left: i * itemW, behavior: 'smooth' }); if (i !== index) onIndex(i); }
  const okraj = 'calc(50% - ' + (itemW / 2) + 'px)';
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: '50%', top: 4, bottom: 4, width: itemW - 10, transform: 'translateX(-50%)', borderRadius: 12, background: 'rgba(120,130,255,0.20)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 34, pointerEvents: 'none', zIndex: 2, background: 'linear-gradient(to right, ' + T.card + ', rgba(22,22,59,0))' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 34, pointerEvents: 'none', zIndex: 2, background: 'linear-gradient(to left, ' + T.card + ', rgba(22,22,59,0))' }} />
      <div ref={boxRef} onScroll={onScroll} className="w-wheel" style={{ display: 'flex', overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ flex: '0 0 ' + okraj }} />
        {items.map((it, i) => { const a = i === index; return (
          <button key={i} type="button" onClick={() => klepni(i)} style={{ flex: '0 0 ' + itemW + 'px', scrollSnapAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '11px 0', fontFamily: T.fontHead, fontSize: a ? 16 : 14.5, fontWeight: a ? 800 : 600, color: a ? '#a0b4ff' : T.mutedSoft, transition: 'color .15s, font-size .15s', whiteSpace: 'nowrap' }}>{it}</button>
        ); })}
        <div style={{ flex: '0 0 ' + okraj }} />
      </div>
    </div>
  );
}

function EDatePicker({ value, onChange, placeholder, style }) {
  const [open, setOpen] = useStateE(false);
  const [dmy, setDmy] = useStateE(() => _eRozloz(value));
  const ref = useRefE(null);
  useEffectE(() => { setDmy(_eRozloz(value)); }, [value]);
  useEffectE(() => { if (!open) return; const onClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('click', onClick, true); return () => document.removeEventListener('click', onClick, true); }, [open]);
  const dim = new Date(dmy.y, dmy.mo + 1, 0).getDate();
  const DNY = []; for (let d = 1; d <= dim; d++) DNY.push(d);
  function zmen(nv) { const next = { ...dmy, ...nv }; const dm = new Date(next.y, next.mo + 1, 0).getDate(); if (next.d > dm) next.d = dm; setDmy(next); onChange(next.y + '-' + String(next.mo + 1).padStart(2, '0') + '-' + String(next.d).padStart(2, '0')); }
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ ...(style || {}), width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, color: value ? T.text : T.mutedSoft }}>
        <Icon name="calendar-bold" size={16} color={value ? '#a0b4ff' : T.mutedSoft} />
        <span style={{ flex: 1 }}>{value ? _eFmt(value) : (placeholder || 'Vyber datum')}</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 400, marginTop: 8, padding: '10px 0 12px', background: T.card, border: '1px solid ' + T.border, borderRadius: 16, boxShadow: '0 18px 40px -12px rgba(0,0,0,0.5)', animation: 'wPop .18s cubic-bezier(.2,.8,.2,1)', overflow: 'hidden' }}>
          <EWheel key={'d-' + dmy.y + '-' + dmy.mo} items={DNY} index={dmy.d - 1} itemW={62} onIndex={i => zmen({ d: i + 1 })} />
          <div style={{ height: 1, background: T.border, margin: '8px 14px' }} />
          <EWheel items={_E_MESICE} index={dmy.mo} itemW={116} onIndex={i => zmen({ mo: i })} />
          <div style={{ height: 1, background: T.border, margin: '8px 14px' }} />
          <EWheel items={_E_ROKY} index={Math.max(0, _E_ROKY.indexOf(dmy.y))} itemW={86} onIndex={i => zmen({ y: _E_ROKY[i] })} />
        </div>
      )}
    </div>
  );
}

const TITLES = {
  dash:       { title: 'Dashboard',   subtitle: 'Přehled výkonu náboru za 30 dní' },
  analytics:  { title: 'Analytika',   subtitle: 'Pokročilé reporty a segmentace' },
  jobs:       { title: 'Inzeráty',   subtitle: 'Správa a výkon vašich brigád' },
  candidates: { title: 'Kandidáti',  subtitle: 'Náborový pipeline' },
  chat:       { title: 'Zprávy',     subtitle: 'Komunikace s kandidáty' },
  calendar:   { title: 'Plán směn',  subtitle: 'Kalendář obsazení a otevřené sloty' },
  settings:   { title: 'Nastavení',  subtitle: 'Firemní profil a nastavení' },
  team:       { title: 'Tým',        subtitle: 'Pozvi kolegy a spravuj přístupy' },
  pricing:    { title: 'Tarify',     subtitle: 'Správa předplatného a ceník' },
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
        <div style={{ marginTop: 18, fontSize: 20, color: T.ink, fontWeight: 800, fontFamily: T.fontHead }}>
          Zatím žádné inzeráty
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: T.muted, fontFamily: T.fontUI, lineHeight: 1.6 }}>
          Vytvořte první inzerát v mobilní aplikaci Makej a kandidáti se začnou ozývat.
        </div>
        <div style={{
          marginTop: 20, padding: '12px 20px', borderRadius: 12,
          background: 'rgba(91,107,255,0.12)', border: '1px solid rgba(91,107,255,0.25)',
          color: T.light, fontFamily: T.fontUI, fontSize: 12, lineHeight: 1.5,
        }}>
          📱 Stáhněte aplikaci Makej a přidejte první brigádu
        </div>
      </div>
    </div>
  );
}

const EMPTY_JOB_FORM = {
  title: '', description: '', pay: '', pay_unit: 'Kč/h',
  location: '', kraj: '', city: '', _lat: null, _lng: null, photos: [], date: '', time_start: '', time_end: '',
  tags: '', requirements: '', job_type: 'brigada',
  hours_per_week: '', start_date: '', contract_duration: '',
  contract_type: 'HPP', benefits: '',
  positions: '1', dress_code: '', contact_note: '',
};

const KRAJE = [
  { id: 'praha', name: 'Praha' }, { id: 'stredocesky', name: 'Středočeský' },
  { id: 'jihocesky', name: 'Jihočeský' }, { id: 'plzensky', name: 'Plzeňský' },
  { id: 'karlovarsky', name: 'Karlovarský' }, { id: 'ustecky', name: 'Ústecký' },
  { id: 'liberecky', name: 'Liberecký' }, { id: 'kralovehradecky', name: 'Královéhradecký' },
  { id: 'pardubicky', name: 'Pardubický' }, { id: 'vysocina', name: 'Vysočina' },
  { id: 'jihomoravsky', name: 'Jihomoravský' }, { id: 'olomoucky', name: 'Olomoucký' },
  { id: 'zlinsky', name: 'Zlínský' }, { id: 'moravskoslezsky', name: 'Moravskoslezský' },
];

const JOB_TYPES = [
  { value: 'jednrazova_vypomoc', label: 'Jednorázová výpomoc', icon: '⚡', desc: 'Jednorázová akce' },
  { value: 'brigada',            label: 'Brigáda',             icon: '💼', desc: 'Krátkodobá práce' },
  { value: 'part_time',          label: 'Part-time',           icon: '🕐', desc: 'Částečný úvazek' },
  { value: 'full_time',          label: 'Full-time',           icon: '🏢', desc: 'Plný úvazek' },
];

const CONTRACT_TYPES = ['HPP', 'DPP', 'DPČ', 'Živnostenský list'];

function ENewJobModal({ onClose, onCreated, editJob, duplicateJob }) {
  const isEdit = !!editJob;
  const isDup  = !!duplicateJob;
  const [form,   setForm]   = useStateE(EMPTY_JOB_FORM);
  const [saving, setSaving] = useStateE(false);
  const [err,    setErr]    = useStateE('');
  const [confirmDel, setConfirmDel] = useStateE(false);
  const [deleting,   setDeleting]   = useStateE(false);
  const [publishLater, setPublishLater] = useStateE(false);
  const [publishAt,    setPublishAt]    = useStateE('');
  const [cities,       setCities]       = useStateE([]);
  const [uploadingPhoto, setUploadingPhoto] = useStateE(false);
  const photoInputRef = useRefE(null);

  async function handlePhotoPick(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const { data: { session } } = await sb.auth.getSession();
    const uid = session && session.user ? session.user.id : null;
    if (!uid) return;
    setUploadingPhoto(true);
    for (const file of files.slice(0, 8)) {
      const url = typeof uploadImageE === 'function' ? await uploadImageE(uid, 'job', file, 1600) : null;
      if (url) setForm(f => ({ ...f, photos: [...(f.photos || []), url].slice(0, 8) }));
    }
    setUploadingPhoto(false);
  }

  // Seznam měst pro výběr polohy brigády (souřadnice → radius u brigádníků)
  useEffectE(() => { sb.from('cities').select('*').order('name').then(({ data }) => setCities(data || [])); }, []);
  // Při editaci předvyplň město podle uložených souřadnic jobu
  useEffectE(() => {
    if (!cities.length || form.city || form._lat == null) return;
    const m = cities.find(c => Math.abs(c.lat - form._lat) < 1e-4 && Math.abs(c.lng - form._lng) < 1e-4);
    if (m) setForm(f => ({ ...f, city: m.id, kraj: m.kraj }));
  }, [cities, form._lat]);

  async function handleDelete() {
    if (!editJob) return;
    setDeleting(true); setErr('');
    const ok = await deleteJobE(editJob.id);
    setDeleting(false);
    if (!ok) { setErr('Inzerát se nepodařilo smazat. Zkus to znovu.'); return; }
    if (window.empToast) window.empToast('Inzerát smazán', 'Inzerát i jeho odezvy byly odstraněny.', '🗑️', 'success');
    onCreated();
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  // Editace/duplikace: předvyplň formulář ze syrového řádku v DB
  // (u duplikace necháme datum a čas prázdné, ať si je nastaví znovu)
  useEffectE(() => {
    const src = editJob || duplicateJob;
    if (!src) return;
    sb.from('jobs').select('*').eq('id', src.id).single().then(({ data }) => {
      if (!data) return;
      setForm({
        title: data.title || '', description: data.description || '',
        pay: data.pay != null ? String(data.pay) : '', pay_unit: data.pay_unit || 'Kč/h',
        location: data.location || '', kraj: data.kraj || '',
        city: '', _lat: data.lat != null ? data.lat : null, _lng: data.lng != null ? data.lng : null,
        photos: Array.isArray(data.photos) ? data.photos : [],
        date: isDup ? '' : (data.date || ''),
        time_start: isDup ? '' : (data.time_start || ''),
        time_end: isDup ? '' : (data.time_end || ''),
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        requirements: Array.isArray(data.requirements) ? data.requirements.join(', ') : '',
        job_type: data.job_type || 'brigada',
        hours_per_week: '', start_date: '', contract_duration: '',
        contract_type: 'HPP',
        benefits: Array.isArray(data.benefits) ? data.benefits.join(', ') : '',
        positions: data.positions != null ? String(data.positions) : '1',
        dress_code: data.dress_code || '', contact_note: data.contact_note || '',
      });
    });
  }, []);

  const isOneshot  = form.job_type === 'jednrazova_vypomoc';
  const isBrigada  = form.job_type === 'brigada';
  const isPartTime = form.job_type === 'part_time';
  const isFullTime = form.job_type === 'full_time';
  const isShortTerm = isOneshot || isBrigada;

  async function handleSubmit() {
    // Všechna pole, která zaměstnavatel u daného typu inzerátu vidí, jsou povinná
    if (!form.title.trim())    { setErr('Vyplň název pozice.'); return; }
    if (!form.pay)             { setErr('Vyplň mzdu.'); return; }
    if (!form.city)            { setErr('Vyber město brigády.'); return; }
    if (isShortTerm) {
      if (!form.date)          { setErr('Vyber datum.'); return; }
      if (!form.time_start)    { setErr('Vyplň začátek směny.'); return; }
      if (!form.time_end)      { setErr('Vyplň konec směny.'); return; }
      if (!form.positions || parseInt(form.positions) < 1) { setErr('Zadej počet volných míst.'); return; }
    }
    if (isPartTime) {
      if (!form.hours_per_week)            { setErr('Vyplň počet hodin týdně.'); return; }
      if (!form.start_date)               { setErr('Vyber datum nástupu.'); return; }
      if (!form.contract_duration.trim()) { setErr('Vyplň délku spolupráce.'); return; }
    }
    if (isFullTime) {
      if (!form.contract_type)            { setErr('Vyber typ úvazku.'); return; }
      if (!form.start_date)               { setErr('Vyber datum nástupu.'); return; }
      if (!form.contract_duration.trim()) { setErr('Vyplň délku spolupráce.'); return; }
    }
    if (!form.description.trim())  { setErr('Vyplň popis.'); return; }
    if (!form.benefits.trim())     { setErr('Vyplň, co nabízíš (co nabízíme).'); return; }
    if (!form.dress_code.trim())   { setErr('Vyplň dress code.'); return; }
    if (!form.contact_note.trim()) { setErr('Vyplň, kam dorazit / kontakt.'); return; }
    if (!form.tags.trim())         { setErr('Přidej alespoň jeden tag.'); return; }
    if (!isOneshot && !form.requirements.trim()) { setErr('Vyplň požadavky.'); return; }
    setSaving(true); setErr('');
    const { data: { session } } = await sb.auth.getSession();
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const reqs = form.requirements.split(',').map(r => r.trim()).filter(Boolean);
    const benefits = form.benefits.split(/[,\n]/).map(b => b.trim()).filter(Boolean);
    const publishIso = (!isEdit && publishLater && publishAt) ? new Date(publishAt).toISOString() : null;
    const cityObj = cities.find(c => c.id === form.city);
    const extra = {
      tags, requirements: reqs, benefits, positions: parseInt(form.positions) || 1, publish_at: publishIso,
      location: form.location.trim() || (cityObj ? cityObj.name : ''),   // fallback na název města
      lat: cityObj ? cityObj.lat : (form._lat != null ? form._lat : null),
      lng: cityObj ? cityObj.lng : (form._lng != null ? form._lng : null),
    };
    const result = isEdit
      ? await updateJobE(editJob.id, { ...form, ...extra })
      : await createJobE(window._makejActingId || session.user.id, { ...form, ...extra });
    setSaving(false);
    if (!result) { setErr(isEdit ? 'Nepodařilo se uložit změny. Zkus to znovu.' : 'Nepodařilo se přidat inzerát. Zkus to znovu.'); return; }
    onCreated();
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 9,
    background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(208,208,255,0.14)',
    color: T.ink, fontFamily: T.fontUI, fontSize: 13, outline: 'none',
    transition: 'border-color .2s',
  };
  const labelStyle = { color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 5 };
  const rowStyle   = { marginBottom: 14 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#ffffff', border: '1px solid rgba(208,208,255,0.12)', borderRadius: 20,
        padding: 28, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'empPop .3s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 18, fontWeight: 800 }}>{isEdit ? 'Upravit inzerát' : isDup ? 'Duplikovat inzerát' : 'Nový inzerát'}</div>
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
                  background: form.job_type === opt.value ? 'rgba(0,32,246,0.1)' : 'rgba(0,32,246,0.05)',
                  border: '1px solid ' + (form.job_type === opt.value ? 'rgba(208,208,255,0.5)' : 'rgba(208,208,255,0.12)'),
                  transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <span style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700 }}>{opt.label}</span>
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

        {/* Místo — bližší popis (nepovinné) */}
        <div style={rowStyle}>
          <label style={labelStyle}>Bližší místo / adresa</label>
          <input style={inputStyle} placeholder="např. Brno — Veveří, U nádraží" value={form.location} onChange={e => setF('location', e.target.value)} />
        </div>

        {/* Město / část — povinné (určuje polohu pro radius u brigádníků) */}
        <div style={rowStyle}>
          <label style={labelStyle}>Město / část *</label>
          <select style={{ ...inputStyle, appearance: 'auto' }} value={form.city} onChange={e => {
            const c = cities.find(x => x.id === e.target.value);
            setForm(f => ({ ...f, city: e.target.value, kraj: c ? c.kraj : f.kraj, _lat: c ? c.lat : f._lat, _lng: c ? c.lng : f._lng }));
          }}>
            <option value="">Vyber město…</option>
            {KRAJE.map(k => {
              const inKraj = cities.filter(c => c.kraj === k.id);
              return inKraj.length ? (
                <optgroup key={k.id} label={k.name}>
                  {inKraj.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              ) : null;
            })}
          </select>
        </div>

        {/* Fotky brigády — galerie (nepovinné) */}
        <div style={rowStyle}>
          <label style={labelStyle}>Fotky brigády <span style={{ textTransform: 'none', fontWeight: 500, color: T.mutedSoft }}>· nepovinné, ukážou se na kartě</span></label>
          <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoPick} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(form.photos || []).map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 76, height: 76, borderRadius: 10, overflow: 'hidden', border: '1px solid ' + T.border }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, k) => k !== i) }))} style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 999, background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, lineHeight: 1, display: 'grid', placeItems: 'center' }}>✕</button>
              </div>
            ))}
            {(form.photos || []).length < 8 && (
              <button type="button" onClick={() => photoInputRef.current && photoInputRef.current.click()} disabled={uploadingPhoto} style={{ width: 76, height: 76, borderRadius: 10, border: '1.5px dashed ' + T.border, background: 'rgba(0,32,246,0.04)', color: T.primary, cursor: uploadingPhoto ? 'default' : 'pointer', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 300 }}>
                {uploadingPhoto ? <span style={{ width: 18, height: 18, borderRadius: 999, border: '2.5px solid rgba(0,32,246,0.25)', borderTopColor: T.primary, display: 'inline-block', animation: 'empSpin .7s linear infinite' }} /> : '+'}
              </button>
            )}
          </div>
        </div>

        {/* Krátkodobé: datum + čas (jednorázová / brigáda) */}
        {isShortTerm && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Datum *</label>
              <EDatePicker style={inputStyle} value={form.date} onChange={v => setF('date', v)} placeholder="Vyber datum" />
            </div>
            <div>
              <label style={labelStyle}>Začátek *</label>
              <input style={inputStyle} type="time" value={form.time_start} onChange={e => setF('time_start', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Konec *</label>
              <input style={inputStyle} type="time" value={form.time_end} onChange={e => setF('time_end', e.target.value)} />
            </div>
          </div>
        )}

        {/* Part-time: hodin týdně + nástup */}
        {isPartTime && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Hodin týdně *</label>
              <input style={inputStyle} type="number" placeholder="20" value={form.hours_per_week} onChange={e => setF('hours_per_week', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Nástup od *</label>
              <EDatePicker style={inputStyle} value={form.start_date} onChange={v => setF('start_date', v)} placeholder="Vyber datum" />
            </div>
          </div>
        )}
        {isPartTime && (
          <div style={rowStyle}>
            <label style={labelStyle}>Délka spolupráce *</label>
            <input style={inputStyle} placeholder="např. 3 měsíce, neurčito…" value={form.contract_duration} onChange={e => setF('contract_duration', e.target.value)} />
          </div>
        )}

        {/* Full-time: typ úvazku + nástup + délka */}
        {isFullTime && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Typ úvazku *</label>
              <select style={{ ...inputStyle, appearance: 'none' }} value={form.contract_type} onChange={e => setF('contract_type', e.target.value)}>
                {CONTRACT_TYPES.map(ct => <option key={ct}>{ct}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nástup od *</label>
              <EDatePicker style={inputStyle} value={form.start_date} onChange={v => setF('start_date', v)} placeholder="Vyber datum" />
            </div>
          </div>
        )}
        {isFullTime && (
          <div style={rowStyle}>
            <label style={labelStyle}>Délka spolupráce *</label>
            <input style={inputStyle} placeholder="např. neurčito, 1 rok, zkušební 3 měs.…" value={form.contract_duration} onChange={e => setF('contract_duration', e.target.value)} />
          </div>
        )}

        {/* Popis — vždy, ale placeholder se mění */}
        <div style={rowStyle}>
          <label style={labelStyle}>{isFullTime ? 'Popis pozice *' : isPartTime ? 'Popis práce *' : 'Popis *'}</label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            rows={isFullTime ? 4 : 3}
            placeholder={
              isFullTime  ? 'Náplň práce, co hledáme, pracovní podmínky a prostředí…' :
              isPartTime  ? 'Co bude zaměstnanec dělat, prostředí, co nabízíte…' :
              isOneshot   ? 'Stručný popis práce…' :
                            'Popis práce, čeká se na brigádníka…'
            }
            value={form.description}
            onChange={e => setF('description', e.target.value)}
          />
        </div>

        {/* Co nabízíme (benefity) — vždy */}
        <div style={rowStyle}>
          <label style={labelStyle}>Co nabízíme * <span style={{ textTransform: 'none', fontWeight: 500, color: T.mutedSoft }}>· oddělené čárkou</span></label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            rows={2}
            placeholder={
              isFullTime  ? 'Stravenky, home office, 5 týdnů dovolené, sick days…' :
                            'Jídlo zdarma, spropitné, flexibilní směny, možnost stálé spolupráce…'
            }
            value={form.benefits}
            onChange={e => setF('benefits', e.target.value)}
          />
        </div>

        {/* Počet míst + dress code */}
        <div style={{ ...rowStyle, display: 'grid', gridTemplateColumns: isShortTerm ? '1fr 1.5fr' : '1fr', gap: 10 }}>
          {isShortTerm && (
            <div>
              <label style={labelStyle}>Volných míst *</label>
              <input style={inputStyle} type="number" min="1" placeholder="1" value={form.positions} onChange={e => setF('positions', e.target.value)} />
            </div>
          )}
          <div>
            <label style={labelStyle}>Dress code *</label>
            <input style={inputStyle} placeholder="např. Černé tričko a kalhoty, uzavřená obuv" value={form.dress_code} onChange={e => setF('dress_code', e.target.value)} />
          </div>
        </div>

        {/* Kam dorazit / kontakt */}
        <div style={rowStyle}>
          <label style={labelStyle}>Kam dorazit / kontakt *</label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            rows={2}
            placeholder="např. Vchod z dvora, zeptej se na Petru na baru. Tel: 777 123 456"
            value={form.contact_note}
            onChange={e => setF('contact_note', e.target.value)}
          />
        </div>

        {/* Tagy — vždy */}
        <div style={rowStyle}>
          <label style={labelStyle}>Tagy (oddělené čárkou) *</label>
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
            <label style={labelStyle}>{isFullTime ? 'Požadavky *' : 'Výhody / požadavky *'} (oddělené čárkou)</label>
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

        {!isEdit && (
          <div style={{ marginBottom: 12, padding: 14, borderRadius: 11, background: 'rgba(0,32,246,0.04)', border: '1px solid ' + T.border }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="calendar-bold" size={14} color={T.primary}/> Zveřejnit později
                  {(typeof can === 'function' && !can('scheduleJobs')) && <span style={{ marginLeft: 6, padding: '2px 7px', borderRadius: 999, background: 'rgba(0,32,246,0.10)', color: T.primary, fontSize: 9.5, fontWeight: 800 }}>BUSINESS</span>}
                </div>
                <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, marginTop: 3 }}>Inzerát se brigádníkům ukáže až ve zvolený čas.</div>
              </div>
              <div onClick={() => {
                if (typeof can === 'function' && !can('scheduleJobs')) { window.empToast && window.empToast('Plánování je v Business', 'Zveřejnění inzerátu na později je od tarifu Business.', '📅', 'info'); return; }
                setPublishLater(v => !v);
              }} style={{ width: 44, height: 24, borderRadius: 999, background: publishLater ? T.primary : 'rgba(15,18,40,0.15)', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s', marginTop: 2 }}>
                <div style={{ position: 'absolute', top: 3, left: publishLater ? 23 : 3, width: 18, height: 18, borderRadius: 999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
              </div>
            </div>
            {publishLater && (
              <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)} min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)} style={{ ...inputStyle, marginTop: 12 }} />
            )}
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
          {saving ? (isEdit ? 'Ukládám…' : 'Přidávám…') : (isEdit ? 'Uložit změny' : 'Přidat inzerát')}
        </button>

        {isEdit && (
          !confirmDel ? (
            <button
              onClick={() => setConfirmDel(true)}
              style={{
                width: '100%', padding: '11px', borderRadius: 11, marginTop: 10,
                background: 'transparent', border: '1px solid rgba(244,63,94,0.4)',
                color: '#f43f5e', fontFamily: T.fontHead, fontSize: 13.5, fontWeight: 800,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <Icon name="trash-bin-trash-bold" size={15} color="#f43f5e" /> Smazat inzerát
            </button>
          ) : (
            <div style={{ marginTop: 10, padding: 14, borderRadius: 12, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.3)' }}>
              <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600, lineHeight: 1.5, marginBottom: 12 }}>
                Opravdu smazat tento inzerát? Odstraní se i všechny jeho odezvy a chaty. Akce je nevratná.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmDel(false)} disabled={deleting} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(15,18,40,0.04)', border: '1px solid ' + T.border, color: T.light, fontFamily: T.fontHead, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Zrušit</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#f43f5e', border: 'none', color: '#fff', fontFamily: T.fontHead, fontSize: 13, fontWeight: 800, cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.6 : 1 }}>{deleting ? 'Mažu…' : 'Smazat'}</button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

const E_TOAST_STYLE = {
  success: { accent: '#16a34a', soft: 'rgba(22,163,74,0.09)' },
  info:    { accent: '#0020F6', soft: 'rgba(0,32,246,0.07)' },
  warn:    { accent: '#F5A623', soft: 'rgba(245,166,35,0.11)' },
  review:  { accent: '#F5A623', soft: 'rgba(245,166,35,0.11)' },
};
function EToast({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', top: 20, right: 24, zIndex: 9000,
      display: 'flex', flexDirection: 'column', gap: 10,
      width: 'min(360px, calc(100vw - 48px))', pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const st = E_TOAST_STYLE[t.type] || E_TOAST_STYLE.info;
        return (
          <div key={t.id} style={{
            position: 'relative', overflow: 'hidden', pointerEvents: 'auto',
            background: 'linear-gradient(180deg, ' + st.soft + ' 0%, #fff 46%)',
            border: '1px solid ' + T.border, borderRadius: 16, padding: '13px 15px 14px',
            boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 14px 34px -14px rgba(15,18,40,0.32), 0 4px 10px rgba(15,18,40,0.05)',
            animation: 'empPop .32s cubic-bezier(.2,.8,.2,1)',
          }}>
            <button onClick={() => onRemove(t.id)} aria-label="Zavřít" style={{
              position: 'absolute', top: 9, right: 9, width: 22, height: 22, borderRadius: 999,
              display: 'grid', placeItems: 'center', background: 'rgba(15,18,40,0.05)', border: 'none',
              color: T.muted, cursor: 'pointer', fontSize: 11, lineHeight: 1, transition: 'background .15s, color .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,18,40,0.1)'; e.currentTarget.style.color = T.ink; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,18,40,0.05)'; e.currentTarget.style.color = T.muted; }}
            >✕</button>
            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: st.accent + '14', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 19, boxShadow: 'inset 0 0 0 1px ' + st.accent + '22' }}>{t.icon}</div>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                {t.title && <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.01em' }}>{t.title}</div>}
                {t.text && <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 12, marginTop: 2, lineHeight: 1.45 }}>{t.text}</div>}
              </div>
            </div>
            {/* odpočet do zmizení */}
            <div style={{ position: 'absolute', left: 0, bottom: 0, height: 2.5, width: '100%', background: st.accent, opacity: 0.85, transformOrigin: 'left', animation: 'empToastBar 6s linear forwards' }} />
          </div>
        );
      })}
    </div>
  );
}

// ── Plný profil brigádníka: reálná data + recenze (žádný mock) ──
function EWorkerProfileModal({ workerId, fallback, onClose }) {
  const [p, setP]       = useStateE(fallback || null);
  const [reviews, setR] = useStateE(null);   // null = načítá se
  const [loading, setL] = useStateE(true);
  const [replies, setReplies]     = useStateE({});   // { review_id: [reply] }
  const [drafts, setDrafts]       = useStateE({});
  const [sendingId, setSendingId] = useStateE(null);
  const [myId, setMyId]           = useStateE(null);

  useEffectE(() => {
    if (!workerId) return;
    let alive = true;
    (async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (alive) setMyId(session?.user?.id || null);
      const [profRes, revRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', workerId).single(),
        sb.from('reviews')
          .select('*, reviewer:profiles!reviews_reviewer_id_fkey(name, company_name)')
          .eq('reviewed_id', workerId)
          .order('created_at', { ascending: false }),
      ]);
      if (!alive) return;
      if (profRes.data) setP(profRes.data);
      const revs = revRes.data || [];
      setR(revs);
      setL(false);
      const ids = revs.map(r => r.id);
      if (ids.length) {
        const { data: reps } = await sb.from('review_replies').select('*').in('review_id', ids).order('created_at', { ascending: true });
        if (!alive) return;
        const map = {};
        (reps || []).forEach(x => { (map[x.review_id] = map[x.review_id] || []).push(x); });
        setReplies(map);
      }
    })();
    return () => { alive = false; };
  }, [workerId]);

  // Realtime odpovědi (brigádník odpoví → objeví se hned)
  useEffectE(() => {
    const chan = sb.channel('e-rev-replies-' + (workerId || 'x'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'review_replies' }, (payload) => {
        const rep = payload.new;
        setReplies(prev => {
          const list = prev[rep.review_id] || [];
          if (list.some(x => x.id === rep.id)) return prev;
          return { ...prev, [rep.review_id]: [...list, rep] };
        });
      })
      .subscribe();
    return () => { try { sb.removeChannel(chan); } catch (e) {} };
  }, [workerId]);

  async function sendReply(reviewId) {
    const text = (drafts[reviewId] || '').trim();
    if (!text || sendingId) return;
    setSendingId(reviewId);
    const tempId = 'tmp-' + Date.now();
    setReplies(prev => ({ ...prev, [reviewId]: [...(prev[reviewId] || []), { id: tempId, review_id: reviewId, author_id: myId, text, created_at: new Date().toISOString() }] }));
    setDrafts(prev => ({ ...prev, [reviewId]: '' }));
    const { data, error } = await sb.from('review_replies').insert({ review_id: reviewId, author_id: myId, text }).select().single();
    setSendingId(null);
    setReplies(prev => {
      const list = prev[reviewId] || [];
      return { ...prev, [reviewId]: (data && !error) ? list.map(x => x.id === tempId ? data : x) : list.filter(x => x.id !== tempId) };
    });
  }

  const name    = p?.name || 'Kandidát';
  const initials = name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??';
  const skills  = Array.isArray(p?.skills) ? p.skills : [];
  const rating  = Number(p?.rating || 0);
  const age     = p?.birth_date ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000) : null;
  const krajName = p?.kraj ? ((KRAJE.find(k => k.id === p.kraj) || {}).name || '') : '';
  const genderTxt = { muz: 'Muž', male: 'Muž', zena: 'Žena', female: 'Žena', jine: 'Jiné' }[p?.gender] || '';
  const card    = { background: '#ffffff', border: '1px solid ' + T.border, borderRadius: 12, padding: 14 };
  const secTitle = { color: T.muted, fontSize: 10.5, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 };

  function stars(n) {
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }

  const avatarColor = _strColor(workerId || name);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,18,40,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20,
        border: '1px solid ' + T.border,
        boxShadow: '0 24px 80px rgba(15,18,40,0.18)',
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        animation: 'empPop .28s cubic-bezier(.2,.8,.2,1)',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid ' + T.border, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: 999, background: avatarColor, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 26, flexShrink: 0, overflow: 'hidden' }}>
            {p?.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 22, fontWeight: 800 }}>{name}</span>
              {p?.verified && <Icon name="verified-check-bold" size={18} color="#5B6BFF" />}
            </div>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 12.5, marginTop: 3 }}>
              {[age ? age + ' let' : null, genderTxt, krajName, p?.address, p?.level ? 'Makač L' + p.level : null].filter(Boolean).join(' · ') || 'Brigádník'}
            </div>
            {loading && <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 11, marginTop: 4 }}>Načítám profil…</div>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: T.surfaceAlt, border: '1px solid ' + T.border, color: T.muted, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Statistiky ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { l: 'Hodnocení', v: rating > 0 ? rating.toFixed(1) + '★' : '–', c: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
              { l: 'Brigád',    v: p?.jobs_done || 0,                            c: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE' },
              { l: 'Hodin',     v: p?.hours_logged || 0,                         c: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
              { l: 'Vyděláno',  v: (Number(p?.total_earned || 0)).toLocaleString('cs-CZ') + ' Kč', c: '#0020F6', bg: 'rgba(0,32,246,0.05)', border: 'rgba(0,32,246,0.15)' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: s.bg, border: '1px solid ' + s.border }}>
                <div style={{ color: s.c, fontFamily: T.fontMono, fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{s.v}</div>
                <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 9.5, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* ── O kandidátovi ── */}
          {p?.bio && (
            <div>
              <div style={secTitle}>O kandidátovi</div>
              <div style={{ color: T.light, fontSize: 13, fontFamily: T.fontUI, lineHeight: 1.65, whiteSpace: 'pre-line' }}>{p.bio}</div>
            </div>
          )}

          {/* ── Vzdělání ── */}
          {p?.education && (
            <div>
              <div style={secTitle}>Vzdělání</div>
              <div style={{ color: T.light, fontSize: 13, fontFamily: T.fontUI }}>{p.education}</div>
            </div>
          )}

          {/* ── Dovednosti ── */}
          <div>
            <div style={secTitle}>Dovednosti</div>
            {skills.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skills.map((t, i) => (
                  <span key={i} style={{ padding: '5px 11px', borderRadius: 7, background: 'rgba(0,32,246,0.06)', border: '1px solid rgba(0,32,246,0.15)', color: T.ink, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            ) : <div style={{ color: T.mutedSoft, fontSize: 12.5, fontFamily: T.fontUI, fontStyle: 'italic' }}>Brigádník zatím neuvedl žádné dovednosti.</div>}
          </div>

          {/* ── Životopis ── */}
          <div>
            <div style={secTitle}>Životopis</div>
            {p?.cv_url ? (
              <a href={p.cv_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, background: 'rgba(0,32,246,0.07)', border: '1px solid rgba(0,32,246,0.2)', color: '#0020F6', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                <Icon name="document-text-bold" size={14} color="#0020F6" />Otevřít životopis
              </a>
            ) : <div style={{ color: T.mutedSoft, fontSize: 12.5, fontFamily: T.fontUI, fontStyle: 'italic' }}>Brigádník nenahrál životopis.</div>}
          </div>

          {/* ── Recenze z minulých brigád ── */}
          <div>
            <div style={secTitle}>Recenze z minulých brigád</div>
            {reviews === null ? (
              <div style={{ color: T.mutedSoft, fontSize: 12.5, fontFamily: T.fontUI, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: 999, border: '2px solid rgba(0,32,246,0.3)', borderTopColor: '#0020F6', animation: 'empSpin .7s linear infinite' }} />
                Načítám recenze…
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ padding: 18, borderRadius: 12, background: T.surfaceAlt, border: '1px solid ' + T.border, color: T.mutedSoft, fontSize: 12.5, fontFamily: T.fontUI, fontStyle: 'italic', textAlign: 'center' }}>
                Brigádník zatím nemá žádné recenze.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reviews.map((r, i) => {
                  const thread = replies[r.id] || [];
                  const canReply = r.reviewer_id === myId;
                  return (
                  <div key={r.id || i} style={{ padding: '14px 16px', borderRadius: 12, background: T.surfaceAlt, border: '1px solid ' + T.border }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{r.reviewer?.company_name || r.reviewer?.name || 'Firma'}{canReply ? ' · vy' : ''}</span>
                      <span style={{ color: '#D97706', fontSize: 14, letterSpacing: 1 }}>{stars(Number(r.rating) || 0)}</span>
                    </div>
                    {r.text && <div style={{ color: T.light, fontSize: 12.5, fontFamily: T.fontUI, lineHeight: 1.6 }}>{r.text}</div>}
                    <div style={{ color: T.mutedSoft, fontSize: 11, fontFamily: T.fontUI, marginTop: 6 }}>{_relTime(r.created_at)}</div>

                    {thread.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                        {thread.map(rep => {
                          const mine = rep.author_id === myId;
                          return (
                            <div key={rep.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                              <div style={{ color: T.mutedSoft, fontSize: 10, fontWeight: 700, fontFamily: T.fontUI, marginBottom: 2, textAlign: mine ? 'right' : 'left' }}>{mine ? 'Vy' : name}</div>
                              <div style={{ padding: '8px 12px', borderRadius: 12, background: mine ? '#0020F6' : '#fff', color: mine ? '#fff' : T.ink, border: mine ? 'none' : '1px solid ' + T.border, fontFamily: T.fontUI, fontSize: 12.5, lineHeight: 1.45, borderBottomRightRadius: mine ? 4 : 12, borderBottomLeftRadius: mine ? 12 : 4 }}>{rep.text}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {canReply && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <input
                          value={drafts[r.id] || ''}
                          onChange={e => setDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendReply(r.id); } }}
                          placeholder="Odpovědět brigádníkovi…"
                          style={{ flex: 1, minWidth: 0, padding: '9px 13px', borderRadius: 999, background: '#fff', border: '1px solid ' + T.border, color: T.ink, fontFamily: T.fontUI, fontSize: 12.5, outline: 'none' }}
                        />
                        <button onClick={() => sendReply(r.id)} disabled={sendingId === r.id || !(drafts[r.id] || '').trim()} style={{ width: 38, height: 38, borderRadius: 999, flexShrink: 0, border: 'none', cursor: 'pointer', background: '#0020F6', display: 'grid', placeItems: 'center', opacity: (sendingId === r.id || !(drafts[r.id] || '').trim()) ? 0.5 : 1 }}>
                          <Icon name="plain-bold" size={15} color="#fff" />
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal hodnocení (firma → brigádník po dokončené brigádě) ────
// ── Rozhodnutí o zrušené směně (znovu zveřejnit / nechat zavřený) ──
function ECancelModal({ target, onDone }) {
  const [busy, setBusy] = useStateE(false);
  async function reopen() { if (busy) return; setBusy(true); await reopenJobE(target.match_id, target.job_id); setBusy(false); onDone?.(); }
  async function keep()   { if (busy) return; setBusy(true); await dismissCancelE(target.match_id); setBusy(false); onDone?.(); }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ background: '#ffffff', border: '1px solid rgba(208,208,255,0.12)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, textAlign: 'center', animation: 'empPop .3s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ width: 54, height: 54, borderRadius: 15, background: 'rgba(244,63,94,0.14)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
          <Icon name="close-circle-bold" size={26} color="#f43f5e" />
        </div>
        <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 19, fontWeight: 800 }}>Brigádník zrušil směnu</div>
        <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
          <b style={{ color: T.ink }}>{target.workerName}</b> zrušil/a potvrzenou směnu na <b style={{ color: T.ink }}>{target.jobTitle}</b>. Chceš inzerát znovu zveřejnit a hledat dál?
        </div>

        <button onClick={reopen} disabled={busy} style={{ width: '100%', marginTop: 20, padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #0020F6, #3a3a99)', border: 'none', color: '#fff', fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon name="refresh-bold" size={16} color="#fff" /> Znovu zveřejnit inzerát
        </button>
        <button onClick={keep} disabled={busy} style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 12, background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(208,208,255,0.14)', color: T.light, fontFamily: T.fontHead, fontSize: 14, fontWeight: 800, cursor: busy ? 'default' : 'pointer' }}>Nechat zavřený</button>
      </div>
    </div>
  );
}

function EReviewModal({ target, onClose, onDone }) {
  const [rating, setRating] = useStateE(0);
  const [hover,  setHover]  = useStateE(0);
  const [text,   setText]   = useStateE('');
  const [saving, setSaving] = useStateE(false);
  const [err,    setErr]    = useStateE('');

  const LABELS = ['', 'Špatné', 'Slabší', 'Dobré', 'Skvělé', 'Perfektní'];
  const shown = hover || rating;

  async function submit() {
    if (rating < 1) { setErr('Vyber počet hvězdiček.'); return; }
    setSaving(true); setErr('');
    const ok = await submitReviewE(target.match_id, target.worker_id, rating, text);
    setSaving(false);
    if (!ok) { setErr('Hodnocení se nepodařilo uložit.'); return; }
    onDone?.();
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#ffffff', border: '1px solid rgba(208,208,255,0.12)', borderRadius: 20,
        padding: 28, width: '100%', maxWidth: 400, textAlign: 'center',
        animation: 'empPop .3s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, overflow: 'hidden', background: target.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 19, margin: '0 auto 12px' }}>{target.avatarUrl ? <img src={target.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : target.avatar}</div>
        <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 18, fontWeight: 800 }}>Ohodnoť brigádníka</div>
        <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13, marginTop: 4 }}>{target.workerName} · {target.jobTitle}</div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '20px 0 6px' }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n}
              onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
              onClick={() => { setRating(n); setErr(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0 }}>
              <Icon name="star-bold" size={36} color={n <= shown ? '#FFD166' : 'rgba(255,255,255,0.15)'} />
            </button>
          ))}
        </div>
        <div style={{ color: shown ? '#FFD166' : T.mutedSoft, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, height: 18 }}>{LABELS[shown] || 'Vyber hodnocení'}</div>

        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="Jak se brigádník osvědčil? Dochvilnost, přístup… (nepovinné)"
          rows={3}
          style={{ width: '100%', marginTop: 16, padding: '11px 13px', borderRadius: 12, background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(208,208,255,0.14)', color: T.ink, fontFamily: T.fontUI, fontSize: 13, outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
        />

        {err && <div style={{ color: '#f43f5e', fontFamily: T.fontUI, fontSize: 12, marginTop: 10 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: '0 0 auto', padding: '12px 18px', borderRadius: 12, background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(208,208,255,0.14)', color: T.light, fontFamily: T.fontUI, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Později</button>
          <button onClick={submit} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg, #0020F6, #3a3a99)', border: 'none', color: '#fff', fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Ukládám…' : 'Odeslat hodnocení'}</button>
        </div>
      </div>
    </div>
  );
}

function EmployerApp() {
  const [tab,       setTab]       = useStateE('dash');
  const [period,    setPeriod]    = useStateE('30d');
  const [profileWorker, setProfileWorker] = useStateE(null);
  if (typeof window !== 'undefined') {
    window.empGoTab = setTab;  // bridge pro navigaci z child komponent
    window.empOpenProfile = (workerId, fallback) => setProfileWorker({ workerId, fallback });
  }
  const [loaded,    setLoaded]    = useStateE(false);
  const [tick,      setTick]      = useStateE(0);
  const [showNewJob, setShowNewJob] = useStateE(false);
  const [editJob,    setEditJob]    = useStateE(null);
  const [dupJob,     setDupJob]     = useStateE(null);
  const [reviewTarget, setReviewTarget] = useStateE(null);
  const [cancelTarget, setCancelTarget] = useStateE(null);
  const [toasts,    setToasts]    = useStateE([]);
  const empId                     = useRefE(null);
  const isMobile                  = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useStateE(false);

  function addToast(title, text, icon = '🔔', type = 'info') {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, text, icon, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }
  // Bridge: nech volat toasty i z child komponent (shell, pages) bez prop drilling
  if (typeof window !== 'undefined') window.empToast = addToast;

  // Initial data fetch on mount
  useEffectE(() => {
    function start() {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      // ID firmy, za kterou pracuju (z rozcestníku); fallback = vlastní účet
      const actId = window._makejActingId || session.user.id;
      empId.current = actId;
      fetchEmployerData(actId).then(() => {
        setLoaded(true);
        setTick(1);
        // Rozhodnutí o zrušených směnách má přednost
        if (E_CANCELLED.length > 0) {
          setTimeout(() => {
            addToast('Zrušená směna', `${E_CANCELLED.length === 1 ? 'Jeden brigádník zrušil' : E_CANCELLED.length + ' brigádníků zrušilo'} potvrzenou směnu.`, '⚠️', 'info');
            setCancelTarget(E_CANCELLED[0]);
          }, 1000);
        } else if (E_REVIEW_QUEUE.length > 0) {
          setTimeout(() => {
            addToast('Ohodnoť brigádníky', `Máš ${E_REVIEW_QUEUE.length} ${E_REVIEW_QUEUE.length === 1 ? 'dokončenou brigádu' : 'dokončených brigád'} k ohodnocení.`, '⭐', 'review');
            setReviewTarget(E_REVIEW_QUEUE[0]);
          }, 1000);
        }
      }).catch((err) => {
        console.error('[employer] načtení dat selhalo:', err);
        setLoaded(true);   // degraduj gracefully místo věčného „Načítám data…"
        setTick(1);
      });
    });
    }
    // Počkej na výběr pracovního prostoru z rozcestníku (auth gate)
    if (window._makejActingId) start();
    else window.addEventListener('makej-workspace', start, { once: true });
    return () => window.removeEventListener('makej-workspace', start);
  }, []);

  // Realtime: refresh data when matches or jobs change
  useEffectE(() => {
    if (!loaded || !empId.current) return;
    const id = empId.current;

    const channel = sb.channel('emp-rt-' + id)
      // SPOLEHLIVÝ signál: notifications mají triviální RLS (user_id=auth.uid()),
      // takže realtime k firmě vždy dorazí (na rozdíl od matches přes RLS s can_act_as).
      // Server trigger vytvoří firmě upozornění při novém kandidátu / potvrzení / zrušení.
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + id }, async (payload) => {
        const n = payload.new;
        if (!n) return;
        if (n.type === 'message') return;     // zprávy řeší chat (vlastní realtime)
        await fetchEmployerData(id);          // obnov kandidáty, směny, KPI…
        setTick(t => t + 1);
        if (n.type === 'match')      addToast(n.title || 'Nový zájem o brigádu', n.body || '', '👤', 'info');
        else if (n.type === 'shift') addToast(n.title || 'Změna u směny', n.body || '', '📅', 'success');
        else if (n.type === 'info')  addToast(n.title || 'Upozornění', n.body || '', '⚠️', 'warn');
        // u zrušené směny ještě otevři potvrzovací modal (data už jsou načtená)
        if (n.type === 'info' && /zru/i.test(n.title || '')) {
          const c = E_CANCELLED.find(x => x.match_id === n.match_id);
          if (c) setCancelTarget(c);
        }
      })
      // Záložní refresh z matches (kdyby realtime na matches přece jen dorazil).
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, async () => {
        await fetchEmployerData(id);
        setTick(t => t + 1);
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
  } else if (tab === 'dash')        body = <EDashboard key={tick} period={period} />;
  else if (tab === 'analytics')     body = <EAnalytics key={tick} />;
  else if (tab === 'jobs')          body = <EJobs key={tick} onTab={setTab} onEdit={setEditJob} onDuplicate={setDupJob} />;
  else if (tab === 'candidates')    body = <ECandidates key={tick} />;
  else if (tab === 'chat')          body = <EMessages key={tick} />;
  else if (tab === 'calendar')      body = <ECalendar key={tick} />;
  else if (tab === 'settings')      body = <ESettings key={tick} />;
  else if (tab === 'team')          body = <ETeamTab key={tick} />;
  else if (tab === 'pricing')       body = <EPricing key={tick} onTab={setTab} onPlanChange={() => setTick(t => t + 1)} />;
  else body = (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: T.muted, fontFamily: T.fontUI }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Icon name="hourglass-bold" size={48} color={T.mutedSoft} />
        <div style={{ marginTop: 16, fontSize: 16, color: T.light, fontWeight: 700, fontFamily: T.fontHead }}>{meta.title} — brzy</div>
        <div style={{ marginTop: 6, fontSize: 13 }}>Tato sekce je v přípravě.</div>
        <button onClick={() => setTab('dash')} style={{ marginTop: 18, padding: '10px 18px', borderRadius: 9, background: 'rgba(91,107,255,0.18)', border: '1px solid rgba(91,107,255,0.35)', color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Zpět na dashboard</button>
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

      {loaded && <ESidebar tab={tab} onTab={setTab} mobile={isMobile} open={drawerOpen} onClose={() => setDrawerOpen(false)} />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {loaded && <ETopbar mobile={isMobile} onMenu={() => setDrawerOpen(true)} title={meta.title} subtitle={meta.subtitle} onNew={() => {
          const lim = (typeof planLimit === 'function') ? planLimit('maxActiveJobs') : Infinity;
          const activeCount = (E_JOBS || []).filter(j => j.status === 'active' || j.status === 'urgent').length;
          if (activeCount >= lim) {
            const label = (typeof PLAN_LIMITS !== 'undefined') ? PLAN_LIMITS[planId()].label : 'tvůj';
            window.empToast && window.empToast('Dosažen limit tarifu', `Tarif ${label} umožňuje ${lim} aktivní inzerát${lim === 1 ? '' : 'y'}. Ukonči některý inzerát nebo přejdi na vyšší tarif.`, '🔒', 'info');
            setTab('pricing');
            return;
          }
          setShowNewJob(true);
        }} onSignOut={handleSignOut} period={period} onPeriod={setPeriod} showPeriod={tab === 'dash'} />}
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

      {editJob && (
        <ENewJobModal
          editJob={editJob}
          onClose={() => setEditJob(null)}
          onCreated={async () => {
            setEditJob(null);
            await fetchEmployerData(empId.current);
            setTick(t => t + 1);
          }}
        />
      )}

      {dupJob && (
        <ENewJobModal
          duplicateJob={dupJob}
          onClose={() => setDupJob(null)}
          onCreated={async () => {
            setDupJob(null);
            await fetchEmployerData(empId.current);
            setTick(t => t + 1);
          }}
        />
      )}

      {profileWorker && (
        <EWorkerProfileModal
          workerId={profileWorker.workerId}
          fallback={profileWorker.fallback}
          onClose={() => setProfileWorker(null)}
        />
      )}

      {reviewTarget && (
        <EReviewModal
          target={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onDone={async () => {
            const next = E_REVIEW_QUEUE.find(r => r.match_id !== reviewTarget.match_id);
            await fetchEmployerData(empId.current);
            setTick(t => t + 1);
            setReviewTarget(E_REVIEW_QUEUE.length > 0 ? E_REVIEW_QUEUE[0] : null);
          }}
        />
      )}

      {cancelTarget && (
        <ECancelModal
          target={cancelTarget}
          onDone={async () => {
            await fetchEmployerData(empId.current);
            setTick(t => t + 1);
            setCancelTarget(E_CANCELLED.length > 0 ? E_CANCELLED[0] : null);
          }}
        />
      )}

      <EToast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<EmployerApp />);
