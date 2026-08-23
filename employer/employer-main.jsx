// Makej Employer — main entry (with live Supabase data)

const TITLES = {
  dash:       { title: 'Dashboard',   subtitle: 'Přehled výkonu náboru za 30 dní' },
  analytics:  { title: 'Analytika',   subtitle: 'Pokročilé reporty a segmentace' },
  jobs:       { title: 'Inzeráty',   subtitle: 'Správa a výkon vašich brigád' },
  candidates: { title: 'Kandidáti',  subtitle: '' },
  chat:       { title: 'Zprávy',     subtitle: 'Komunikace s kandidáty' },
  calendar:   { title: 'Plán směn',  subtitle: 'Kalendář obsazení a otevřené sloty' },
  reviews:    { title: 'Recenze',    subtitle: 'Všechna hodnocení od kandidátů' },
  settings:   { title: 'Nastavení',  subtitle: 'Firemní profil a nastavení' },
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
        <div style={{ marginTop: 18, fontSize: 20, color: T.text, fontWeight: 800, fontFamily: T.fontHead }}>
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

// ── Kraje ────────────────────────────────────────────────────────
// Id musí souhlasit s KRAJE_W ve worker appce (www/worker-swipe.jsx) —
// brigádník podle nich filtruje. Jiná id = filtr nic nenajde.
const KRAJE_E = [
  { id: 'praha', name: 'Praha' }, { id: 'stredocesky', name: 'Středočeský' },
  { id: 'jihocesky', name: 'Jihočeský' }, { id: 'plzensky', name: 'Plzeňský' },
  { id: 'karlovarsky', name: 'Karlovarský' }, { id: 'ustecky', name: 'Ústecký' },
  { id: 'liberecky', name: 'Liberecký' }, { id: 'kralovehradecky', name: 'Královéhradecký' },
  { id: 'pardubicky', name: 'Pardubický' }, { id: 'vysocina', name: 'Vysočina' },
  { id: 'jihomoravsky', name: 'Jihomoravský' }, { id: 'olomoucky', name: 'Olomoucký' },
  { id: 'zlinsky', name: 'Zlínský' }, { id: 'moravskoslezsky', name: 'Moravskoslezský' },
];

// Odvození kraje z adresy — ať firma nevyplňuje podruhé to, co už napsala.
// Nezná každou obec; když netrefí, vybere se ručně (pole jde vždy přepsat).
const _MESTA_KRAJ = {
  praha: ['praha', 'prague'],
  stredocesky: ['kladno', 'mladá boleslav', 'mlada boleslav', 'příbram', 'pribram', 'kolín', 'kolin',
    'kutná hora', 'kutna hora', 'beroun', 'mělník', 'melnik', 'nymburk', 'benešov', 'benesov', 'rakovník', 'rakovnik'],
  jihocesky: ['české budějovice', 'ceske budejovice', 'budějovice', 'budejovice', 'tábor', 'tabor',
    'písek', 'pisek', 'strakonice', 'jindřichův hradec', 'jindrichuv hradec', 'český krumlov', 'cesky krumlov', 'prachatice'],
  plzensky: ['plzeň', 'plzen', 'klatovy', 'rokycany', 'domažlice', 'domazlice', 'tachov', 'sušice', 'susice'],
  karlovarsky: ['karlovy vary', 'cheb', 'sokolov', 'mariánské lázně', 'marianske lazne'],
  ustecky: ['ústí nad labem', 'usti nad labem', 'most', 'děčín', 'decin', 'teplice', 'chomutov',
    'litoměřice', 'litomerice', 'louny', 'žatec', 'zatec'],
  liberecky: ['liberec', 'jablonec', 'česká lípa', 'ceska lipa', 'turnov', 'semily'],
  kralovehradecky: ['hradec králové', 'hradec kralove', 'trutnov', 'náchod', 'nachod', 'jičín', 'jicin',
    'rychnov', 'dvůr králové', 'dvur kralove'],
  pardubicky: ['pardubice', 'chrudim', 'svitavy', 'ústí nad orlicí', 'usti nad orlici', 'česká třebová', 'ceska trebova'],
  vysocina: ['jihlava', 'třebíč', 'trebic', 'žďár', 'zdar', 'havlíčkův brod', 'havlickuv brod', 'pelhřimov', 'pelhrimov'],
  jihomoravsky: ['brno', 'znojmo', 'břeclav', 'breclav', 'hodonín', 'hodonin', 'vyškov', 'vyskov',
    'blansko', 'kyjov', 'boskovice'],
  olomoucky: ['olomouc', 'přerov', 'prerov', 'prostějov', 'prostejov', 'šumperk', 'sumperk', 'jeseník', 'jesenik'],
  zlinsky: ['zlín', 'zlin', 'kroměříž', 'kromeriz', 'uherské hradiště', 'uherske hradiste', 'vsetín', 'vsetin',
    'valašské meziříčí', 'valasske mezirici', 'otrokovice'],
  moravskoslezsky: ['ostrava', 'havířov', 'havirov', 'karviná', 'karvina', 'frýdek', 'frydek', 'opava',
    'třinec', 'trinec', 'nový jičín', 'novy jicin', 'bruntál', 'bruntal'],
};

function _krajZAdresy(text) {
  const s = (text || '').toLowerCase();
  if (!s.trim()) return '';
  for (const kraj of Object.keys(_MESTA_KRAJ)) {
    if (_MESTA_KRAJ[kraj].some(m => s.includes(m))) return kraj;
  }
  return '';
}

const EMPTY_JOB_FORM = {
  title: '', description: '', pay: '', pay_unit: 'Kč/h',
  location: '', kraj: '', date: '', time_start: '', time_end: '',
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

function ENewJobModalOld({ onClose, onPublish }) {
  const [form,   setForm]   = useStateE(EMPTY_JOB_FORM);
  const [err,    setErr]    = useStateE('');

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const isOneshot  = form.job_type === 'jednrazova_vypomoc';
  const isBrigada  = form.job_type === 'brigada';
  const isPartTime = form.job_type === 'part_time';
  const isFullTime = form.job_type === 'full_time';
  const isShortTerm = isOneshot || isBrigada;

  function handleSubmit() {
    if (!form.title.trim())    { setErr('Vyplň název pozice.'); return; }
    if (!form.pay)             { setErr('Vyplň mzdu.'); return; }
    if (!form.location.trim()) { setErr('Vyplň místo.'); return; }
    // Bez kraje by inzerát nešel v appce najít přes filtr — proto povinný
    if (!form.kraj) { setErr('Vyber kraj — podle něj brigádníci filtrují nabídky.'); return; }
    setErr('');
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const reqs = form.requirements.split(',').map(r => r.trim()).filter(Boolean);
    onPublish({ ...form, tags, requirements: reqs });   // parent řídí publikaci + „pill"
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 9,
    background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(0,32,246,0.2)',
    color: '#0020F6', fontFamily: T.fontUI, fontSize: 13, outline: 'none',
    transition: 'border-color .2s',
  };
  const labelStyle = { color: '#6677cc', fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, display: 'block', marginBottom: 5 };
  const rowStyle   = { marginBottom: 14 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#ffffff', border: '1px solid rgba(0,32,246,0.18)', borderRadius: 20,
        padding: 28, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'empPop .3s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#0020F6', fontFamily: T.fontHead, fontSize: 18, fontWeight: 800 }}>Nový inzerát</div>
            <div style={{ color: '#6677cc', fontFamily: T.fontUI, fontSize: 11, marginTop: 2 }}>
              {isOneshot  ? 'Vyplň základní info — datum, čas a odměnu' :
               isBrigada  ? 'Krátkodobá brigáda s konkrétním termínem' :
               isPartTime ? 'Částečný úvazek — hodinový nebo měsíční' :
               'Plný úvazek s detailními podmínkami'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6677cc', cursor: 'pointer', padding: 4, fontSize: 16, lineHeight: 1, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
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
                  background: form.job_type === opt.value ? 'rgba(0,32,246,0.12)' : 'rgba(0,32,246,0.04)',
                  border: '1px solid ' + (form.job_type === opt.value ? 'rgba(0,32,246,0.4)' : 'rgba(0,32,246,0.15)'),
                  transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <span style={{ color: '#0020F6', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700 }}>{opt.label}</span>
                <span style={{ color: '#6677cc', fontFamily: T.fontUI, fontSize: 10.5 }}>{opt.desc}</span>
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

        {/* Místo + kraj — kraj se odvodí z adresy, ale jde přepsat */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Místo *</label>
            <input
              style={inputStyle}
              placeholder="např. Brno — Veveří"
              value={form.location}
              onChange={e => {
                const loc = e.target.value;
                const auto = _krajZAdresy(loc);
                // kraj přepiš jen dokud ho uživatel nezvolil sám
                setForm(f => ({ ...f, location: loc, kraj: f.krajRucne ? f.kraj : (auto || f.kraj) }));
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Kraj *</label>
            <select
              style={inputStyle}
              value={form.kraj}
              onChange={e => setForm(f => ({ ...f, kraj: e.target.value, krajRucne: true }))}>
              <option value="">Vyber kraj…</option>
              {KRAJE_E.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
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
          style={{
            width: '100%', padding: '13px', borderRadius: 11,
            background: 'linear-gradient(135deg, #0020F6, #3a3a99)',
            border: 'none', color: '#fff',
            fontFamily: T.fontHead, fontSize: 15, fontWeight: 800,
            cursor: 'pointer', marginTop: 4,
          }}>
          Přidat inzerát
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
        <div key={t.id} onClick={() => onRemove(t.id)} style={{
          display: 'flex', gap: 11, alignItems: 'center', padding: '12px 14px',
          borderRadius: 20,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '0.5px solid rgba(255,255,255,0.9)',
          boxShadow: '0 12px 32px -10px rgba(20,22,40,0.35), 0 2px 6px rgba(20,22,40,0.08)',
          cursor: 'pointer', pointerEvents: 'auto',
          animation: 'wToastIn .42s cubic-bezier(.16,1,.3,1)',
        }}>
          {t.avatar
            ? <span style={{ width: 40, height: 40, borderRadius: 999, flexShrink: 0, background: t.avatar.color || '#5B6BFF', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 14 }}>{t.avatar.initials || '?'}</span>
            : <span style={{ width: 40, height: 40, borderRadius: 999, flexShrink: 0, background: 'rgba(0,32,246,0.10)', display: 'grid', placeItems: 'center', fontSize: 20 }}>{t.icon}</span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ flex: 1, minWidth: 0, color: '#0a0a1a', fontFamily: T.fontHead, fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
              <span style={{ color: '#8a90b0', fontFamily: T.fontUI, fontSize: 11.5, flexShrink: 0 }}>teď</span>
            </div>
            {t.text && <div style={{ color: '#5b6080', fontFamily: T.fontUI, fontSize: 12.5, marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{t.text}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFIL KANDIDÁTA — modal s recenzemi (otevírá se z chatu/kandidátů)
// ─────────────────────────────────────────────────────────────
function EWorkerProfileModal({ workerId, fallback, onClose }) {
  const [p, setP]       = useStateE(fallback || null);
  const [reviews, setR] = useStateE(null);   // null = načítá se
  const [loading, setL] = useStateE(true);

  useEffectE(() => {
    if (!workerId) return;
    let alive = true;
    (async () => {
      const [profRes, revRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', workerId).single(),
        sb.from('reviews')
          .select('*, reviewer:profiles!reviews_reviewer_id_fkey(name, company_name)')
          .eq('reviewed_id', workerId)
          .order('created_at', { ascending: false }),
      ]);
      if (!alive) return;
      if (profRes.data) setP(profRes.data);
      setR(revRes.data || []);
      setL(false);
    })();
    return () => { alive = false; };
  }, [workerId]);

  const name    = p?.name || 'Kandidát';
  const initials = name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??';
  const skills  = Array.isArray(p?.skills) ? p.skills : [];
  const rating  = Number(p?.rating || 0);
  const secTitle = { color: T.cardMuted, fontSize: 10.5, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 };

  function stars(n) {
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }

  const avatarColor = _strColor(workerId || name);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,18,40,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20,
        border: '1px solid ' + T.cardBorder,
        boxShadow: '0 24px 80px rgba(15,18,40,0.18)',
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        animation: 'empPop .28s cubic-bezier(.2,.8,.2,1)',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid ' + T.cardBorder, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: 999, background: avatarColor, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 26, flexShrink: 0, overflow: 'hidden' }}>
            {p?.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: T.cardText, fontFamily: T.fontHead, fontSize: 22, fontWeight: 800 }}>{name}</span>
              {p?.verified && <Icon name="verified-check-bold" size={18} color="#5B6BFF" />}
            </div>
            <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12.5, marginTop: 3 }}>
              {[p?.address, p?.level ? 'Makač L' + p.level : null].filter(Boolean).join(' · ') || 'Brigádník'}
            </div>
            {loading && <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 11, marginTop: 4 }}>Načítám profil…</div>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: T.cardSoft, border: '1px solid ' + T.cardBorder, color: T.cardMuted, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 16 }}>✕</button>
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
                <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 9.5, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* ── O kandidátovi ── */}
          {p?.bio && (
            <div>
              <div style={secTitle}>O kandidátovi</div>
              <div style={{ color: T.cardMuted, fontSize: 13, fontFamily: T.fontUI, lineHeight: 1.65, whiteSpace: 'pre-line' }}>{p.bio}</div>
            </div>
          )}

          {/* ── Vzdělání ── */}
          {p?.education && (
            <div>
              <div style={secTitle}>Vzdělání</div>
              <div style={{ color: T.cardMuted, fontSize: 13, fontFamily: T.fontUI }}>{p.education}</div>
            </div>
          )}

          {/* ── Dovednosti ── */}
          <div>
            <div style={secTitle}>Dovednosti</div>
            {skills.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skills.map((t, i) => (
                  <span key={i} style={{ padding: '5px 11px', borderRadius: 7, background: 'rgba(0,32,246,0.06)', border: '1px solid rgba(0,32,246,0.15)', color: T.cardText, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            ) : <div style={{ color: T.cardMutedSoft, fontSize: 12.5, fontFamily: T.fontUI, fontStyle: 'italic' }}>Brigádník zatím neuvedl žádné dovednosti.</div>}
          </div>

          {/* ── Životopis ── */}
          <div>
            <div style={secTitle}>Životopis</div>
            {p?.cv_url ? (
              <a href={p.cv_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, background: 'rgba(0,32,246,0.07)', border: '1px solid rgba(0,32,246,0.2)', color: '#0020F6', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                <Icon name="document-text-bold" size={14} color="#0020F6" />Otevřít životopis
              </a>
            ) : <div style={{ color: T.cardMutedSoft, fontSize: 12.5, fontFamily: T.fontUI, fontStyle: 'italic' }}>Brigádník nenahrál životopis.</div>}
          </div>

          {/* ── Recenze z minulých brigád ── */}
          <div>
            <div style={secTitle}>Recenze z minulých brigád</div>
            {reviews === null ? (
              <div style={{ color: T.cardMutedSoft, fontSize: 12.5, fontFamily: T.fontUI, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: 999, border: '2px solid rgba(0,32,246,0.3)', borderTopColor: '#0020F6', animation: 'empSpin .7s linear infinite' }} />
                Načítám recenze…
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ padding: 18, borderRadius: 12, background: T.cardSoft, border: '1px solid ' + T.cardBorder, color: T.cardMutedSoft, fontSize: 12.5, fontFamily: T.fontUI, fontStyle: 'italic', textAlign: 'center' }}>
                Brigádník zatím nemá žádné recenze.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reviews.map((r, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: T.cardSoft, border: '1px solid ' + T.cardBorder }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: T.cardText, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{r.reviewer?.company_name || r.reviewer?.name || 'Firma'}</span>
                      <span style={{ color: '#D97706', fontSize: 14, letterSpacing: 1 }}>{stars(Number(r.rating) || 0)}</span>
                    </div>
                    {r.text && <div style={{ color: T.cardMuted, fontSize: 12.5, fontFamily: T.fontUI, lineHeight: 1.6 }}>{r.text}</div>}
                    <div style={{ color: T.cardMutedSoft, fontSize: 11, fontFamily: T.fontUI, marginTop: 6 }}>{_relTime(r.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Publikační „pill" — načítání (šipka + prstenec) → zelené „Hotovo"
function EPublishPill({ state }) {
  const done = state === 'done' || state === 'pop';
  const popping = state === 'pop';
  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 30, transform: 'translateX(-50%)', zIndex: 400,
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px 12px 14px', borderRadius: 999,
      background: done ? '#16a34a' : '#26262e', color: '#fff',
      fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, letterSpacing: -0.2,
      boxShadow: done ? '0 14px 34px rgba(22,163,74,0.42)' : '0 14px 34px rgba(0,0,0,0.34)',
      transition: 'background .45s ease, box-shadow .45s ease',
      animation: popping ? 'empPillPop .45s ease-out forwards' : 'empPillIn .34s cubic-bezier(.2,.8,.2,1)',
    }}>
      <div style={{ position: 'relative', width: 30, height: 30, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {done ? (
          <>
            <span style={{ position: 'absolute', animation: 'empArrowFly .42s cubic-bezier(.4,0,.2,1) forwards' }}>
              <img src="/right-arrow.png" alt="" style={{ width: 13, display: 'block', transform: 'rotate(-90deg)', filter: 'brightness(0) invert(1)' }} />
            </span>
            <img src="/checked.png" alt="" style={{ width: 27, height: 27, display: 'block', filter: 'brightness(0) invert(1)', animation: 'empCheckIn .38s .24s both' }} />
          </>
        ) : (
          <>
            <svg viewBox="0 0 36 36" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="3.2" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round"
                style={{ strokeDasharray: 100.53, strokeDashoffset: 100.53, transform: 'rotate(-90deg)', transformOrigin: '50% 50%', animation: 'empRingFill 3s linear forwards' }} />
            </svg>
            <img src="/right-arrow.png" alt="" style={{ width: 13, display: 'block', position: 'relative', transform: 'rotate(-90deg)', filter: 'brightness(0) invert(1)' }} />
          </>
        )}
      </div>
      <span>{done ? 'Hotovo' : 'Publikuji…'}</span>
    </div>
  );
}

function EmployerApp() {
  const [tab,       setTab]       = useStateE('dash');
  const [loaded,    setLoaded]    = useStateE(false);
  const [tick,      setTick]      = useStateE(0);
  const [unreadNudge, setUnreadNudge] = useStateE(0);   // překreslí sidebar/badge, aniž by se přemountoval chat
  const [showNewJob, setShowNewJob] = useStateE(false);
  const [publish,   setPublish]   = useStateE(null);   // null | 'loading' | 'done'
  const [toasts,    setToasts]    = useStateE([]);
  const [period,    setPeriod]    = useStateE('30d');
  // Mobilní režim: sidebar se schová do drawer, otevírá ho plovoucí hamburger.
  const isMobile = typeof useIsMobile === 'function' ? useIsMobile() : false;
  const [navOpen, setNavOpen] = useStateE(false);
  useEffectE(() => { if (!isMobile) setNavOpen(false); }, [isMobile]);
  const [openThreadId, setOpenThreadId] = useStateE(null);
  const [profileWorker, setProfileWorker] = useStateE(null);
  const empId                     = useRefE(null);

  if (typeof window !== 'undefined') {
    window.empGoTab = setTab;  // bridge pro navigaci z child komponent
    window.empOpenProfile = (workerId, fallback) => setProfileWorker({ workerId, fallback });
  }

  function openChat(matchId) {
    setOpenThreadId(matchId || null);
    setTab('chat');
  }

  function addToast(title, text, icon = '🔔', type = 'info', avatar = null) {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, text, icon, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }
  // Bridge: nech volat toasty i z child komponent (shell, pages) bez prop drilling
  if (typeof window !== 'undefined') window.empToast = addToast;

  // Publikace inzerátu s „pill" feedbackem: načítání → zelené Hotovo
  async function handlePublish(fields) {
    setShowNewJob(false);
    setPublish('loading');
    const started = Date.now();
    let result = null;
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) result = await createJobE(session.user.id, fields);
    } catch (e) { result = null; }
    if (!result) {
      setPublish(null);
      addToast('Nepovedlo se', 'Inzerát se nepodařilo přidat. Zkus to prosím znovu.', '⚠️', 'error');
      return;
    }
    await fetchEmployerData(empId.current);
    setTick(t => t + 1);
    // Načítání ukaž aspoň chvíli, ať to nepřeskočí (i když se uloží hned)
    const MIN_LOADING = 2600;
    setTimeout(() => {
      setPublish('done');
      setTimeout(() => setPublish('pop'), 1800);   // prasknutí jako balónek
      setTimeout(() => setPublish(null), 2300);
    }, Math.max(0, MIN_LOADING - (Date.now() - started)));
  }

  // Theme toggle re-render
  useEffectE(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('makej-theme-toggle', handler);
    return () => window.removeEventListener('makej-theme-toggle', handler);
  }, []);

  // Initial data fetch on mount
  useEffectE(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      // Realtime s RLS potřebuje přihlašovací token, jinak socket běží anonymně
      // a živé události (zprávy, oznámení) nedorazí — přijdou až po refreshi.
      if (session.access_token) { try { sb.realtime.setAuth(session.access_token); } catch (e) {} }
      empId.current = session.user.id;
      fetchEmployerData(session.user.id).then(() => {
        setLoaded(true);
        setTick(1);
      });
    });
    // Token drž aktuální i po obnově session
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (session?.access_token) { try { sb.realtime.setAuth(session.access_token); } catch (e) {} }
    });
    return () => { try { sub.subscription.unsubscribe(); } catch (e) {} };
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

    // Otevření threadu jinde → jen překresli badge v menu
    const onRefreshUnread = () => setUnreadNudge(n => n + 1);
    window.addEventListener('emp-refresh-unread', onRefreshUnread);

    return () => { try { sb.removeChannel(channel); } catch(e) {} window.removeEventListener('emp-refresh-unread', onRefreshUnread); };
  }, [loaded]);

  // Vždy-běžící odběr příchozích zpráv (na jakékoliv záložce). Vlastní kanál vytvořený
  // až PO getSession + setAuth, aby realtime nezůstal anonymní — to byl důvod, proč to
  // na jiných záložkách nechodilo. Zprávu přidá i do vlákna, ať se ukáže po přepnutí do chatu.
  useEffectE(() => {
    if (!loaded) return;
    let chan;
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      const id = session.user.id;
      try { sb.realtime.setAuth(session.access_token); } catch (e) {}
      chan = sb.channel('emp-allmsg-' + id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new; if (!msg || msg.sender_id === id) return;
          const t = E_THREADS.find(x => x.id === msg.match_id);
          if (!t) return;
          const open = window.__empOpenThread || null;
          const preview = (msg.file_url ? 'Příloha' : (msg.type === 'shift_offer' ? 'Nabídka směny' : msg.type === 'interview_offer' ? 'Pozvánka na pohovor' : msg.text)) || '';
          t.last = msg.file_url ? '📎 Příloha' : (msg.type === 'shift_offer' ? '📅 Nabídka směny' : msg.type === 'interview_offer' ? '🗓️ Pozvánka na pohovor' : msg.text) || t.last;
          if (Array.isArray(t.msgs) && !t.msgs.some(m => m.id === msg.id)) {
            const bubble = msg.file_url
              ? { from: 'them', kind: 'file', file: _ePrilohaZRadku(msg), t: _fmtTime(msg.created_at), id: msg.id }
              : (msg.type === 'shift_offer' && msg.metadata) ? { from: 'them', kind: 'shift', shift: { role: msg.metadata.role, date: msg.metadata.date, time: msg.metadata.time, pay: msg.metadata.pay }, t: _fmtTime(msg.created_at), id: msg.id }
              : (msg.type === 'interview_offer' && msg.metadata) ? { from: 'them', kind: 'interview', interview: { date: msg.metadata.date, time: msg.metadata.time, location: msg.metadata.location, note: msg.metadata.note }, t: _fmtTime(msg.created_at), id: msg.id }
              : { from: 'them', text: msg.text, t: _fmtTime(msg.created_at), id: msg.id };
            t.msgs = [...t.msgs, bubble];
          }
          if (msg.match_id === open) { try { localStorage.setItem('emp-lastread-' + msg.match_id, Date.now()); } catch (e) {} }
          else { t.unread = (t.unread || 0) + 1; addToast(t.name || 'Nová zpráva', preview, '💬', 'info', { initials: t.avatar, color: t.color }); }
          setUnreadNudge(n => n + 1);
          window.dispatchEvent(new CustomEvent('emp-new-message', { detail: { id: msg.id, matchId: msg.match_id, title: t.name || 'Nová zpráva', text: preview, ts: msg.created_at ? new Date(msg.created_at).getTime() : Date.now(), read: msg.match_id === open } }));
        })
        .subscribe();
    });
    return () => { if (chan) { try { sb.removeChannel(chan); } catch (e) {} } };
  }, [loaded]);

  async function handleSignOut() {
    await sb.auth.signOut();
    window.location.href = '/';
  }

  const periodLabel = { '7d': '7 dní', '30d': '30 dní', '90d': '90 dní', 'rok': 'rok' }[period];
  const meta   = { ...(TITLES[tab] || TITLES.dash), subtitle: tab === 'dash' ? `Přehled výkonu náboru za ${periodLabel}` : (TITLES[tab] || TITLES.dash).subtitle };
  const noData = loaded && E_JOBS.length === 0;

  let body;
  if (!loaded) {
    body = <ELoadingSpinner />;
  } else if (noData && tab === 'dash') {
    body = <EEmptyState />;
  } else if (tab === 'dash')        body = <EDashboard key={tick + period} period={period} onTab={setTab} onNew={() => setShowNewJob(true)} onPeriod={setPeriod} />;
  else if (tab === 'analytics')     body = <EAnalytics key={tick + period} period={period} onNew={() => setShowNewJob(true)} onTab={setTab} onPeriod={setPeriod} />;
  else if (tab === 'jobs')          body = <EJobs key={tick} onTab={setTab} onNew={() => setShowNewJob(true)} period={period} onPeriod={setPeriod} />;
  else if (tab === 'candidates')    body = <ECandidates key={tick} onOpenChat={openChat} onNew={() => setShowNewJob(true)} period={period} onPeriod={setPeriod} />;
  else if (tab === 'chat')          body = <EMessages key={tick + '-' + openThreadId} initialThreadId={openThreadId} period={period} onPeriod={setPeriod} onNew={() => setShowNewJob(true)} />;
  else if (tab === 'calendar')      body = <EShifts key={tick} period={period} onPeriod={setPeriod} onTab={setTab} onNew={() => setShowNewJob(true)} />;
  else if (tab === 'reviews')       body = <EReviews key={tick} period={period} onPeriod={setPeriod} onNew={() => setShowNewJob(true)} />;
  else if (tab === 'settings')      body = <ESettings key={tick} onTab={setTab} onNew={() => setShowNewJob(true)} onSignOut={handleSignOut} />;
  else if (tab === 'pricing')       body = <EPricing onTab={setTab} onPlanChange={() => setTick(t => t + 1)} />;
  else body = (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: T.muted, fontFamily: T.fontUI }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Icon name="hourglass-bold" size={48} color={T.mutedSoft} />
        <div style={{ marginTop: 16, fontSize: 16, color: T.light, fontWeight: 700, fontFamily: T.fontHead }}>{meta.title} — brzy</div>
        <div style={{ marginTop: 6, fontSize: 13 }}>Tato sekce je v přípravě.</div>
        <button onClick={() => setTab('dash')} style={{ marginTop: 18, padding: '10px 18px', borderRadius: 9, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: T.text, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Zpět na dashboard</button>
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

      {loaded && <ESidebar tab={tab} onTab={setTab} onSignOut={handleSignOut}
        mobile={isMobile} open={navOpen} onClose={() => setNavOpen(false)} />}

      {/* Ztmavení obsahu pod vysunutým drawerem */}
      {loaded && isMobile && navOpen && (
        <div onClick={() => setNavOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 55,
          background: 'rgba(10,13,46,.45)', backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* Hamburger musí být plovoucí — ETopbar se u většiny záložek vůbec nerenderuje */}
      {loaded && isMobile && !navOpen && (
        <button onClick={() => setNavOpen(true)} aria-label="Menu" style={{
          position: 'fixed', top: 12, left: 12, zIndex: 50,
          width: 42, height: 42, borderRadius: 12,
          background: '#fff', border: '1px solid ' + T.cardBorder,
          boxShadow: '0 6px 20px -8px rgba(10,13,46,.4)',
          display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          <Icon name="hamburger-menu-bold" size={20} color={T.cardText} />
        </button>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', overflowY: tab === 'dash' ? 'hidden' : 'auto', background: (tab === 'dash' || tab === 'reviews' || tab === 'calendar' || tab === 'chat' || tab === 'candidates' || tab === 'jobs' || tab === 'settings' || tab === 'analytics') ? '#F1F3FB' : 'transparent' }}>
        {loaded && tab !== 'dash' && tab !== 'reviews' && tab !== 'calendar' && tab !== 'chat' && tab !== 'candidates' && tab !== 'jobs' && tab !== 'settings' && tab !== 'analytics' && <ETopbar title={meta.title} subtitle={meta.subtitle} onNew={() => setShowNewJob(true)} onSignOut={handleSignOut} period={period} onPeriod={setPeriod} />}
        {body}
      </main>

      {showNewJob && (
        <ENewJobModal
          onClose={() => setShowNewJob(false)}
          onPublish={handlePublish}
        />
      )}

      {publish && <EPublishPill state={publish} />}

      {profileWorker && (
        <EWorkerProfileModal
          workerId={profileWorker.workerId}
          fallback={profileWorker.fallback}
          onClose={() => setProfileWorker(null)}
        />
      )}

      <EToast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<EmployerApp />);
