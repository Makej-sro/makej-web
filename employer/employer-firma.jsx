// ═══════════ PROFIL FIRMY — samostatná záložka (26. 9., Yasin + Claude) ═══════════
// Dřív byl profil firmy schovaný v Nastavení mezi notifikacemi a GDPR.
// Teď vlastní záložka (otevírá se z karty firmy dole v levém menu → „Profil
// firmy"). Stránka vypadá jako profil, který uvidí brigádník v aplikaci:
// nahoře velká fotka pozadí (firma si na ni může dát i název, cokoli) a přes
// ni logo, pod tím všechno, co o sobě firma chce říct, a vpravo účet a tarif.
// Nastavení zůstalo jen na nastavení (notifikace, soukromí, smazání účtu).
//
// Ukládá se tlačítkem „Uložit změny" (dole se objeví, jakmile se něco změní).
// Pole ve dvou skupinách:
//  - ZAKLAD — sloupce, které v `profiles` už jsou (appka je čte ve WEmployerModal),
//  - NOVE   — nové sloupce z supabase/migration_profil_firmy.sql (čeká na Sama).
// Když nové sloupce ještě chybí, uloží se aspoň základ a firma se to dozví.

const _PF_DNY = [['po', 'Pondělí'], ['ut', 'Úterý'], ['st', 'Středa'], ['ct', 'Čtvrtek'], ['pa', 'Pátek'], ['so', 'Sobota'], ['ne', 'Neděle']];
const _PF_OBORY = ['Gastro', 'Kavárna', 'Maloobchod', 'Sklad / logistika', 'Eventy / catering', 'Hotelnictví', 'Výroba', 'Úklid', 'Stavebnictví', 'Doprava', 'Administrativa', 'Jiné'];
const _PF_KRAJE = [
  ['praha', 'Praha'], ['stredocesky', 'Středočeský'], ['jihocesky', 'Jihočeský'], ['plzensky', 'Plzeňský'],
  ['karlovarsky', 'Karlovarský'], ['ustecky', 'Ústecký'], ['liberecky', 'Liberecký'], ['kralovehradecky', 'Královéhradecký'],
  ['pardubicky', 'Pardubický'], ['vysocina', 'Vysočina'], ['jihomoravsky', 'Jihomoravský'], ['olomoucky', 'Olomoucký'],
  ['zlinsky', 'Zlínský'], ['moravskoslezsky', 'Moravskoslezský'],
];
const _PF_SITE = [
  ['facebook', 'Facebook', 'facebook.com/firma', '#1877F2'],
  ['instagram', 'Instagram', 'instagram.com/firma', '#C13584'],
  ['linkedin', 'LinkedIn', 'linkedin.com/company/firma', '#0A66C2'],
  ['tiktok', 'TikTok', 'tiktok.com/@firma', '#0B1233'],
  ['youtube', 'YouTube', 'youtube.com/@firma', '#E62117'],
];

function _pfZProfilu(P, C) {
  const s = (P.socials && typeof P.socials === 'object') ? P.socials : {};
  const h = (P.opening_hours && typeof P.opening_hours === 'object') ? P.opening_hours : {};
  return {
    name: P.company_name || '',
    industry: P.industry || '',
    bio: P.bio || '',
    rules: P.chat_rules || '',
    ico: P.ic || '',
    founded: P.founded ? String(P.founded) : '',
    kraj: P.kraj || '',
    address: P.address || '',
    web: P.website || '',
    career: P.career_url || '',
    phone: P.phone || '',
    email: P.contact_email || '',
    logo_url: P.logo_url || '',
    cover_url: P.cover_url || '',
    photos: Array.isArray(P.photos) ? P.photos.filter(Boolean) : [],
    brand: (P.branding && P.branding.color) || C.logoColor || '#1B34F0',
    socials: { facebook: s.facebook || '', instagram: s.instagram || '', linkedin: s.linkedin || '', tiktok: s.tiktok || '', youtube: s.youtube || '' },
    hours: Object.fromEntries(_PF_DNY.map(([k]) => [k, h[k] || ''])),
  };
}

// Řádek údaje ve stylu „štítek vlevo, hodnota vpravo" (jako firmy.cz),
// hodnota se upravuje rovnou na místě.
function PFRadek({ label, children, first }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '112px minmax(0,1fr)', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: first ? 'none' : '1px solid #F0F2FA' }}>
      <span style={{ fontSize: 13, color: '#7A82A6' }}>{label}</span>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

function ECompanyProfile({ onTab, onSignOut } = {}) {
  const P = (typeof EPROFILE !== 'undefined' ? EPROFILE : {});
  const C = (typeof ECOMPANY !== 'undefined' ? ECOMPANY : {});
  const [form, setForm] = React.useState(() => _pfZProfilu(P, C));
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [hlaska, setHlaska] = React.useState(null);       // { text, chyba }
  const [nahravam, setNahravam] = React.useState(null);   // 'cover' | 'logo' | 'photos'
  const [email, setEmail] = React.useState(P.email || '');
  const soubory = React.useRef({});

  React.useEffect(() => {
    if (email || typeof sb === 'undefined') return;
    sb.auth.getSession().then(({ data }) => { const e = data && data.session && data.session.user && data.session.user.email; if (e) setEmail(e); });
  }, []);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setDirty(true); };
  const setSit = (k, v) => { setForm(f => ({ ...f, socials: { ...f.socials, [k]: v } })); setDirty(true); };
  const setDen = (k, v) => { setForm(f => ({ ...f, hours: { ...f.hours, [k]: v } })); setDirty(true); };
  const ukaz = (text, chyba) => { setHlaska({ text, chyba }); setTimeout(() => setHlaska(null), chyba ? 5200 : 3200); };

  // ── Fotky: výběr souboru → zmenšení → bucket `uploads` → URL do formuláře ──
  const vyber = kind => { const el = soubory.current[kind]; if (el) { el.value = ''; el.click(); } };
  async function nahraj(kind, fileList) {
    const files = Array.from(fileList || []).filter(f => /^image\//.test(f.type));
    if (!files.length || typeof uploadImageE !== 'function' || typeof sb === 'undefined') return;
    setNahravam(kind);
    const { data: { session } } = await sb.auth.getSession();
    const uid = session && session.user && session.user.id;
    if (kind === 'photos') {
      const volno = Math.max(0, 8 - form.photos.length);
      const urls = [];
      for (const f of files.slice(0, volno)) { const u = await uploadImageE(uid, 'firma-foto', f, 1400); if (u) urls.push(u); }
      if (urls.length) { setForm(fm => ({ ...fm, photos: [...fm.photos, ...urls] })); setDirty(true); }
      if (urls.length < Math.min(files.length, volno)) ukaz('Některou fotku se nepodařilo nahrát, zkuste to znovu.', true);
    } else {
      const u = await uploadImageE(uid, kind === 'cover' ? 'firma-pozadi' : 'firma-logo', files[0], kind === 'cover' ? 2400 : 600);
      if (u) set(kind === 'cover' ? 'cover_url' : 'logo_url', u);
      else ukaz('Fotku se nepodařilo nahrát, zkuste to znovu.', true);
    }
    setNahravam(null);
  }
  const souborInput = kind => (
    <input type="file" accept="image/*" multiple={kind === 'photos'} hidden
      ref={el => { if (el) soubory.current[kind] = el; }} onChange={e => nahraj(kind, e.target.files)} />
  );

  async function uloz() {
    if (saving) return;
    setSaving(true);
    const zaklad = {
      company_name: form.name.trim(), industry: form.industry, bio: form.bio, chat_rules: form.rules,
      ic: form.ico.trim(), address: form.address.trim(), website: form.web.trim(), kraj: form.kraj || null,
      logo_url: form.logo_url, photos: form.photos,
      socials: form.socials, branding: { ...(P.branding || {}), color: form.brand },
    };
    const nove = {
      cover_url: form.cover_url, founded: form.founded.trim() || null, career_url: form.career.trim(),
      phone: form.phone.trim(), contact_email: form.email.trim(), opening_hours: form.hours,
    };
    let ok = typeof updateEmployerProfile === 'function' ? await updateEmployerProfile(zaklad) : false;
    let noveOk = ok && typeof updateEmployerProfile === 'function' ? await updateEmployerProfile(nove) : false;
    setSaving(false);
    if (!ok) { ukaz('Uložení se nezdařilo, zkuste to znovu.', true); return; }
    setDirty(false);
    if (C && form.name.trim()) { C.name = form.name.trim(); C.logo = C.name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase(); }
    window.dispatchEvent(new Event('emp-profil-ulozen'));   // levé menu (logo, název)
    ukaz(noveOk ? 'Profil uložen.' : 'Profil uložen. Fotka pozadí, kontakty a otevírací doba se začnou ukládat po úpravě databáze.', !noveOk);
  }
  const zahod = () => { setForm(_pfZProfilu(P, C)); setDirty(false); };

  // ── Vyplněnost ──
  const kontrola = [
    ['název firmy', !!form.name.trim()], ['obor', !!form.industry], ['popis firmy', form.bio.trim().length > 30],
    ['logo', !!form.logo_url], ['fotku pozadí', !!form.cover_url], ['adresu', !!form.address.trim()],
    ['kontakt', !!(form.phone.trim() || form.email.trim())], ['fotky firmy', form.photos.length > 0],
  ];
  const pct = Math.round(kontrola.filter(k => k[1]).length / kontrola.length * 100);
  const chybi = kontrola.filter(k => !k[1]).map(k => k[0]);

  const nazev = form.name.trim() || 'Název vaší firmy';
  const inicialy = (form.name.trim() || C.name || '?').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  const krajTxt = (_PF_KRAJE.find(k => k[0] === form.kraj) || [])[1] || '';
  const verified = !!P.verified;
  const recenze = (typeof E_REVIEWS !== 'undefined' ? E_REVIEWS : []);
  const prumer = recenze.length ? (recenze.reduce((a, r) => a + (r.rating || 0), 0) / recenze.length) : 0;
  const jobs = (typeof E_JOBS !== 'undefined' ? E_JOBS : []);
  const aktivni = jobs.filter(j => j.status === 'active' || j.status === 'urgent').length;
  const tier = (typeof _employerPlanTier === 'function') ? _employerPlanTier() : 'vyhodny';
  const limit = (typeof EMPLOYER_MAX_ACTIVE !== 'undefined' && EMPLOYER_MAX_ACTIVE[tier] != null) ? EMPLOYER_MAX_ACTIVE[tier] : 2;
  const brandGrad = 'linear-gradient(120deg, ' + form.brand + ' 0%, ' + form.brand + 'B3 55%, ' + form.brand + '33 100%)';

  const karta = { background: '#fff', border: '1px solid #E6E9F5', borderRadius: 18, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 };
  const nadpis = { fontSize: 16, fontWeight: 800, color: '#0B1233', letterSpacing: '-.01em' };
  const inp = { width: '100%', fontSize: 14, fontWeight: 600, color: '#0B1233', background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 10, padding: '11px 13px', outline: 'none' };

  return (
    <div className="e-ram e-volne" style={{ padding: 20 }}>
      <div style={{ background: '#F1F3FB', border: '1px solid #DDE1F0', borderRadius: 22, overflow: 'hidden' }}>
        <ETabHlava title="Profil firmy">
          {dirty ? (
            <>
              <EBtnSek onClick={zahod} disabled={saving}>Zahodit změny</EBtnSek>
              <EBtnHl onClick={uloz} disabled={saving}>{saving ? 'Ukládám…' : 'Uložit změny'}</EBtnHl>
            </>
          ) : (
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#7A82A6' }}>Takhle vás uvidí brigádníci v aplikaci</span>
          )}
        </ETabHlava>

        <div style={{ padding: '4px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* ── Hlavička: fotka pozadí + logo + název ── */}
          <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 18, overflow: 'hidden' }}>
            {souborInput('cover')}{souborInput('logo')}{souborInput('photos')}
            <div style={{ position: 'relative', height: 300, background: form.cover_url ? ('#DDE1F0 center/cover no-repeat url("' + form.cover_url + '")') : brandGrad }}>
              {!form.cover_url && (
                <div onClick={() => vyber('cover')} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', color: '#fff', textAlign: 'center', padding: '0 24px' }}>
                  <span style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,.22)', display: 'grid', placeItems: 'center' }}><Icon name="gallery-add-bold" size={24} color="#fff" /></span>
                  <span style={{ fontSize: 17, fontWeight: 800 }}>Přidat fotku pozadí</span>
                  <span style={{ fontSize: 13, opacity: .9, maxWidth: 440, lineHeight: 1.45 }}>Provozovna, tým, auta, výrobek — nebo grafika s názvem firmy. Na šířku, ideálně 2400 × 600 px.</span>
                </div>
              )}
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
                {form.cover_url && <button onClick={() => set('cover_url', '')} style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: 'rgba(11,18,51,.5)', backdropFilter: 'blur(6px)', border: 'none', padding: '9px 13px', borderRadius: 10, cursor: 'pointer' }}>Odebrat</button>}
                <button onClick={() => vyber('cover')} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: '#0B1233', background: 'rgba(255,255,255,.94)', border: 'none', padding: '9px 13px', borderRadius: 10, cursor: 'pointer' }}>
                  <Icon name="camera-bold" size={15} color="#0B1233" />{form.cover_url ? 'Změnit fotku pozadí' : 'Nahrát fotku pozadí'}
                </button>
              </div>
              {nahravam === 'cover' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,18,51,.45)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 15, fontWeight: 800 }}>Nahrávám fotku…</div>}
            </div>
            <div style={{ padding: '0 28px 22px', display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: -64, position: 'relative', flexWrap: 'wrap' }}>
              <div onClick={() => vyber('logo')} title={form.logo_url ? 'Změnit logo' : 'Nahrát logo'}
                style={{ position: 'relative', width: 132, height: 132, flex: 'none', borderRadius: 30, border: '5px solid #fff', background: form.logo_url ? '#fff' : form.brand, boxShadow: '0 12px 30px -12px rgba(11,18,51,.5)', overflow: 'hidden', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 44, fontWeight: 800 }}>
                {form.logo_url ? <img src={form.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : inicialy}
                <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '6px 0', background: 'rgba(11,18,51,.58)', color: '#fff', fontSize: 11.5, fontWeight: 800, textAlign: 'center' }}>{nahravam === 'logo' ? 'Nahrávám…' : (form.logo_url ? 'Změnit logo' : 'Nahrát logo')}</span>
              </div>
              <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: form.name.trim() ? '#0B1233' : '#A6ADCB', letterSpacing: '-.025em', lineHeight: 1.1 }}>{nazev}</span>
                  {verified
                    ? <span style={{ fontSize: 12, fontWeight: 800, color: '#0B7B4B', background: '#E6F7EF', padding: '4px 10px', borderRadius: 999 }}>Ověřená firma</span>
                    : <span style={{ fontSize: 12, fontWeight: 700, color: '#7A82A6', background: '#F1F3FB', padding: '4px 10px', borderRadius: 999 }}>Neověřená firma</span>}
                </div>
                <span style={{ fontSize: 14, color: '#7A82A6' }}>{[form.industry, krajTxt, form.address.trim()].filter(Boolean).join(' · ') || 'Obor a místo doplníte níž'}</span>
              </div>
              {prumer > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', background: '#0FA968', padding: '5px 9px', borderRadius: 8 }}>{prumer.toFixed(1).replace('.', ',')}</span>
                  <span style={{ fontSize: 13, color: '#3A4266' }}>{recenze.length} {recenze.length === 1 ? 'hodnocení' : 'hodnocení'}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Tělo: vlevo o firmě, vpravo údaje + účet ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 18, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
              <div style={karta}>
                <span style={nadpis}>O firmě</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3A4266' }}>Název firmy</span>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Např. RPS Czech – Nabourali Vás" style={{ ...inp, fontSize: 15 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3A4266' }}>Obor</span>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {_PF_OBORY.map(o => {
                      const on = form.industry === o;
                      return <span key={o} onClick={() => set('industry', on ? '' : o)} style={{ fontSize: 13, fontWeight: 700, padding: '8px 13px', borderRadius: 999, cursor: 'pointer', color: on ? '#fff' : '#3A4266', background: on ? '#1B34F0' : '#fff', border: '1px solid ' + (on ? '#1B34F0' : '#E6E9F5'), whiteSpace: 'nowrap' }}>{o}</span>;
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3A4266' }}>Co jste za firmu a čím se zabýváte</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: form.bio.length > 900 ? '#B96F06' : '#A6ADCB' }}>{form.bio.length} / 1000</span>
                  </div>
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value.slice(0, 1000))} rows={6}
                    placeholder="Kdo jste, co děláte, pro koho. Jaké to u vás je a proč by k vám měl člověk chtít na brigádu."
                    style={{ ...inp, fontWeight: 400, lineHeight: 1.6, resize: 'vertical', minHeight: 140 }} />
                </div>
              </div>

              <div style={karta}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={nadpis}>Fotky firmy</span>
                  <span style={{ fontSize: 12, color: '#A6ADCB' }}>galerie na profilu · max. 8</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {form.photos.map((url, i) => (
                    <span key={url + i} style={{ position: 'relative', height: 104, borderRadius: 12, overflow: 'hidden', background: '#F1F3FB' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                      <button onClick={() => { setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) })); setDirty(true); }} title="Odebrat fotku"
                        style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 999, border: 'none', background: 'rgba(11,18,51,.6)', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>✕</button>
                    </span>
                  ))}
                  {form.photos.length < 8 && (
                    <span onClick={() => nahravam ? null : vyber('photos')} style={{ height: 104, border: '1.5px dashed #D5DAF0', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', background: '#FBFCFE' }}>
                      <Icon name="gallery-add-linear" size={22} color="#1B34F0" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1B34F0' }}>{nahravam === 'photos' ? 'Nahrávám…' : 'Přidat fotky'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Otevírací doba — dva sloupce, ať nenatahuje stránku o sedm řádků */}
              <div style={karta}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <span style={nadpis}>Otevírací doba</span>
                  <span style={{ fontSize: 11.5, color: '#A6ADCB' }}>např. 8:00–16:30 · prázdné = zavřeno</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 22, rowGap: 2 }}>
                  {_PF_DNY.map(([k, l]) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '78px minmax(0,1fr)', alignItems: 'center', gap: 8, borderBottom: '1px solid #F0F2FA', padding: '3px 0' }}>
                      <span style={{ fontSize: 13, color: '#7A82A6' }}>{l}</span>
                      <input className="e-pf-inp" value={form.hours[k]} onChange={e => setDen(k, e.target.value)} placeholder="+ Doplnit" />
                    </div>
                  ))}
                </div>
              </div>

              <div style={karta}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={nadpis}>Pro nové brigádníky</span>
                  <span style={{ fontSize: 12.5, color: '#7A82A6' }}>Co mají vědět před první směnou — pošlete jim to ve Zprávách jedním klikem.</span>
                </div>
                <textarea value={form.rules} onChange={e => set('rules', e.target.value)} rows={4}
                  placeholder="Např. přijďte 10 minut předem, vezměte si pracovní obuv, hlaste se u vedoucího směny…"
                  style={{ ...inp, fontWeight: 400, lineHeight: 1.6, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {pct < 100 && (
                <div style={{ ...karta, gap: 10, background: '#FFF8EE', borderColor: '#FFE2B8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0B1233' }}>Profil vyplněný na {pct} %</span>
                    <span style={{ width: 90, height: 6, borderRadius: 999, background: '#FFE2B8', overflow: 'hidden', display: 'block' }}><span style={{ display: 'block', width: pct + '%', height: '100%', background: '#F5920B', borderRadius: 999 }} /></span>
                  </div>
                  <span style={{ fontSize: 12.5, color: '#7A5A2A', lineHeight: 1.5 }}>Ještě chybí: {chybi.join(', ')}.</span>
                </div>
              )}

              <div style={{ ...karta, gap: 12 }}>
                <span style={nadpis}>Účet a tarif</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  {typeof TierMetalBadge === 'function' ? <TierMetalBadge plan={C.plan} label={null} /> : <span>{C.plan}</span>}
                  <button onClick={() => onTab && onTab('pricing')} style={{ fontSize: 13, fontWeight: 800, color: '#1B34F0', background: '#EEF1FF', border: 'none', padding: '8px 12px', borderRadius: 9, cursor: 'pointer' }}>Změnit tarif</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#7A82A6' }}>Aktivní inzeráty</span>
                    <span style={{ fontWeight: 800, color: '#0B1233' }}>{aktivni} / {limit === Infinity ? '∞' : limit}</span>
                  </div>
                  <span style={{ height: 6, borderRadius: 999, background: '#EEF1FF', display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', borderRadius: 999, background: '#1B34F0', width: (limit === Infinity ? 100 : Math.min(100, Math.round(aktivni / Math.max(1, limit) * 100))) + '%' }} /></span>
                </div>
                <PFRadek label="Přihlášení" first><span style={{ fontSize: 13.5, fontWeight: 600, color: '#0B1233', wordBreak: 'break-all' }}>{email || '—'}</span></PFRadek>
                <PFRadek label="Ověření">
                  {verified
                    ? <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0B7B4B' }}>Firma je ověřená</span>
                    : <a href="mailto:podpora@makej.eu?subject=Ověření%20firmy" style={{ fontSize: 13.5, fontWeight: 800, color: '#1B34F0', textDecoration: 'none' }}>Požádat o ověření ›</a>}
                </PFRadek>
                <button onClick={() => onSignOut && onSignOut()} style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#7A82A6', background: '#fff', border: '1px solid #E6E9F5', padding: 11, borderRadius: 11, cursor: 'pointer' }}>
                  <Icon name="logout-2-linear" size={15} color="#7A82A6" />Odhlásit se
                </button>
              </div>

              <div style={{ ...karta, gap: 4 }}>
                <span style={{ ...nadpis, marginBottom: 8 }}>Údaje o firmě</span>
                <PFRadek label="IČO" first><input className="e-pf-inp" value={form.ico} onChange={e => set('ico', e.target.value)} placeholder="+ Doplnit" inputMode="numeric" /></PFRadek>
                <PFRadek label="Založeno"><input className="e-pf-inp" value={form.founded} onChange={e => set('founded', e.target.value)} placeholder="+ Doplnit" inputMode="numeric" /></PFRadek>
                <PFRadek label="Kraj">
                  <select className="e-pf-inp" value={form.kraj} onChange={e => set('kraj', e.target.value)} style={form.kraj ? undefined : { color: '#1B34F0', opacity: .8, fontWeight: 700 }}>
                    <option value="">+ Doplnit</option>
                    {_PF_KRAJE.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
                  </select>
                </PFRadek>
                <PFRadek label="Adresa"><input className="e-pf-inp" value={form.address} onChange={e => set('address', e.target.value)} placeholder="+ Doplnit" /></PFRadek>
                <PFRadek label="Web"><input className="e-pf-inp" value={form.web} onChange={e => set('web', e.target.value)} placeholder="+ Doplnit" /></PFRadek>
                <PFRadek label="Kariéra"><input className="e-pf-inp" value={form.career} onChange={e => set('career', e.target.value)} placeholder="+ Doplnit" /></PFRadek>
                <PFRadek label="Telefon"><input className="e-pf-inp" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+ Doplnit" inputMode="tel" /></PFRadek>
                <PFRadek label="E-mail"><input className="e-pf-inp" value={form.email} onChange={e => set('email', e.target.value)} placeholder="+ Doplnit" inputMode="email" /></PFRadek>
              </div>

              <div style={{ ...karta, gap: 4 }}>
                <span style={{ ...nadpis, marginBottom: 8 }}>Sociální sítě</span>
                {_PF_SITE.map(([k, l, ph, c], i) => (
                  <PFRadek key={k} first={i === 0} label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: 3, background: c }} />{l}</span>}>
                    <input className="e-pf-inp" value={form.socials[k]} onChange={e => setSit(k, e.target.value)} placeholder="+ Doplnit" title={'Např. ' + ph} />
                  </PFRadek>
                ))}
              </div>



            </div>
          </div>

          {/* Lišta s uložením — ukáže se, jakmile se něco změní */}
          {dirty && (
            <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 70, display: 'flex', alignItems: 'center', gap: 14, background: '#0B1233', color: '#fff', padding: '10px 10px 10px 18px', borderRadius: 14, boxShadow: '0 18px 40px -12px rgba(11,18,51,.55)', animation: 'eKartaIn .2s ease both' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>Máte neuložené změny</span>
              <button onClick={zahod} disabled={saving} style={{ fontSize: 13, fontWeight: 700, color: '#C7D0FF', background: 'transparent', border: 'none', padding: '9px 10px', cursor: 'pointer' }}>Zahodit</button>
              <button onClick={uloz} disabled={saving} style={{ fontSize: 13.5, fontWeight: 800, color: '#0B1233', background: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', opacity: saving ? .7 : 1 }}>{saving ? 'Ukládám…' : 'Uložit změny'}</button>
            </div>
          )}
        </div>
      </div>

      {hlaska && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 80, maxWidth: 520, textAlign: 'center', background: hlaska.chyba ? '#8A4B00' : '#0B1233', color: '#fff', fontSize: 13, fontWeight: 700, padding: '12px 18px', borderRadius: 11, boxShadow: '0 14px 34px -10px rgba(11,18,51,.5)' }}>{hlaska.text}</div>
      )}
    </div>
  );
}

Object.assign(window, { ECompanyProfile });
