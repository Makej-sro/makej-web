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

// ── Posun a přiblížení fotky v rámu (30. 9.) ──
// Společné pro logo (okno PFOrez) i úvodní fotku (upravuje se přímo na profilu,
// jako na Facebooku). Fotka se posouvá tažením (myš i prst), přibližuje kolečkem
// k místu pod myší nebo posuvníkem (1–4×) a vždy vyplní celý rám — prázdný okraj
// nevznikne. vyrez() vykreslí to, co je v rámu vidět, do JPEG.
const _PF_ZOOM_MAX = 4;
function _usePfPozice(img, ramRef) {
  const [ram, setRam] = React.useState({ w: 0, h: 0 });
  const [st, setSt] = React.useState(null);            // { z, u, v } — přiblížení a bod fotky uprostřed rámu
  const [tahne, setTahne] = React.useState(false);
  const tah = React.useRef(null);
  React.useEffect(() => { setSt(img ? { z: 1, u: img.naturalWidth / 2, v: img.naturalHeight / 2 } : null); }, [img]);
  React.useLayoutEffect(() => {
    const el = ramRef.current; if (!el) return;
    const zmer = () => setRam({ w: el.clientWidth, h: el.clientHeight });
    zmer();
    if (!window.ResizeObserver) return;
    const ro = new ResizeObserver(zmer); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const iw = img ? img.naturalWidth : 1, ih = img ? img.naturalHeight : 1;
  const s0 = ram.w && ram.h ? Math.max(ram.w / iw, ram.h / ih) : 1;   // při z = 1 fotka přesně vyplní rám
  const omez = (z, u, v) => {
    const s = s0 * z, pw = ram.w / (2 * s), ph = ram.h / (2 * s);
    return { z, u: Math.min(Math.max(u, pw), iw - pw), v: Math.min(Math.max(v, ph), ih - ph) };
  };
  const cur = img && st && ram.w ? omez(st.z, st.u, st.v) : null;
  const s = cur ? s0 * cur.z : 1;
  // Přiblížit tak, aby bod pod myší (px, py v rámu) zůstal na místě; bez myši střed
  const zoomNa = (z2, px, py) => setSt(p => {
    if (!p) return p;
    const c = omez(p.z, p.u, p.v);
    const z = Math.min(Math.max(z2, 1), _PF_ZOOM_MAX);
    const ox = (px == null ? ram.w / 2 : px) - ram.w / 2, oy = (py == null ? ram.h / 2 : py) - ram.h / 2;
    return omez(z, c.u + ox / (s0 * c.z) - ox / (s0 * z), c.v + oy / (s0 * c.z) - oy / (s0 * z));
  });
  // Kolečko: nativní posluchač (React ho má pasivní) — stránka se přitom nesmí posouvat
  const kolecko = React.useRef(null);
  kolecko.current = e => {
    if (!cur) return;
    e.preventDefault();
    const r = ramRef.current.getBoundingClientRect();
    zoomNa(cur.z * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  };
  React.useEffect(() => {
    const el = ramRef.current; if (!el) return;
    const h = e => kolecko.current(e);
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);
  const ovladani = {
    onPointerDown: e => { if (!cur) return; e.currentTarget.setPointerCapture(e.pointerId); tah.current = { x: e.clientX, y: e.clientY }; setTahne(true); },
    onPointerMove: e => {
      const t = tah.current; if (!t) return;
      const dx = e.clientX - t.x, dy = e.clientY - t.y;
      tah.current = { x: e.clientX, y: e.clientY };
      setSt(p => { const c = omez(p.z, p.u, p.v); return omez(c.z, c.u - dx / (s0 * c.z), c.v - dy / (s0 * c.z)); });
    },
    onPointerUp: () => { tah.current = null; setTahne(false); },
    onPointerCancel: () => { tah.current = null; setTahne(false); },
  };
  const obrazekStyl = cur ? { position: 'absolute', left: ram.w / 2 - cur.u * s, top: ram.h / 2 - cur.v * s, width: iw * s, height: ih * s, maxWidth: 'none', pointerEvents: 'none', display: 'block' } : null;
  // Výřez → JPEG. Malou fotku nezvětšuje (výstup nejvýš tak velký jako výřez);
  // průhlednost (logo) dostane bílý podklad — JPEG ji neumí.
  const vyrez = maxW => new Promise((ok, chyba) => {
    if (!cur) return chyba(new Error('neni'));
    const sw = ram.w / s, sh = ram.h / s, sx = cur.u - sw / 2, sy = cur.v - sh / 2;
    const W = Math.max(1, Math.min(maxW, Math.round(sw))), H = Math.max(1, Math.round(W * ram.h / ram.w));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    try { c.toBlob(b => b ? ok(b) : chyba(new Error('toBlob')), 'image/jpeg', 0.9); } catch (e) { chyba(e); }
  });
  return { cur, zoomNa, ovladani, obrazekStyl, vyrez, tahne };
}

// Načíst fotku pro úpravu — ze souboru, nebo z adresy (úvodní fotka, fotky firmy).
// Z adresy s crossOrigin, jinak by plátno nešlo uložit (Supabase Storage CORS povoluje).
function _pfNactiFotku(zdroj) {
  return new Promise((ok, chyba) => {
    const soubor = typeof zdroj !== 'string';
    const url = soubor ? URL.createObjectURL(zdroj) : zdroj;
    const i = new Image();
    if (!soubor) i.crossOrigin = 'anonymous';
    i.onload = () => ok({ img: i, url });
    i.onerror = () => { if (soubor) URL.revokeObjectURL(url); chyba(new Error('load')); };
    i.src = url;
  });
}

// ── Úprava loga před nahráním (30. 9.) — okno se čtvercovým rámem ──
// Rám má tvar, v jakém se logo ukazuje (čtverec se zaoblenými rohy). Úvodní
// fotka se neupravuje v okně, ale přímo na profilu (viz ECompanyProfile).
function PFOrez({ file, onZrus, onUloz, onJina }) {
  const ramRef = React.useRef(null);
  const [foto, setFoto] = React.useState(null);        // { img, url }
  const [ukladam, setUkladam] = React.useState(false);
  const poz = _usePfPozice(foto && foto.img, ramRef);
  React.useEffect(() => {
    let zruseno = false, url = null;
    _pfNactiFotku(file).then(f => { url = f.url; if (!zruseno) setFoto(f); }).catch(() => onZrus(true));
    return () => { zruseno = true; if (url) URL.revokeObjectURL(url); };
  }, [file]);
  React.useEffect(() => {
    const esc = e => { if (e.key === 'Escape') onZrus(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);
  const uloz = () => {
    if (!poz.cur || ukladam) return;
    setUkladam(true);
    poz.vyrez(600).then(onUloz).catch(() => setUkladam(false));
  };

  return ReactDOM.createPortal(
    <div onClick={() => !ukladam && onZrus()} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(11,18,51,.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'eDotazIn .18s ease-out' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Upravit logo"
        style={{ width: 440, maxWidth: '100%', background: '#fff', borderRadius: 18, boxShadow: '0 30px 80px -20px rgba(11,18,51,.45)', padding: '24px 26px 22px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em' }}>Upravit logo</div>

        <div ref={ramRef} {...poz.ovladani}
          style={{ position: 'relative', margin: '18px auto 0', width: 'min(300px, 100%)', aspectRatio: '1', borderRadius: '23%',
            overflow: 'hidden', background: '#F1F3FB', boxShadow: 'inset 0 0 0 1px #E6E9F5', cursor: poz.cur ? (poz.tahne ? 'grabbing' : 'grab') : 'default', touchAction: 'none', userSelect: 'none' }}>
          {poz.cur && <img src={foto.url} alt="" draggable={false} style={poz.obrazekStyl} />}
          {!poz.cur && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 13.5, color: '#7A82A6' }}>Načítám fotku…</div>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#3A4266', flex: 'none' }}>Přiblížení</span>
          <input type="range" min="1" max={_PF_ZOOM_MAX} step="0.01" value={poz.cur ? poz.cur.z : 1} disabled={!poz.cur}
            onChange={e => poz.zoomNa(parseFloat(e.target.value))} aria-label="Přiblížení"
            style={{ flex: 1, accentColor: '#1B34F0', cursor: 'pointer' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
          <span onClick={() => !ukladam && onJina()} style={{ fontSize: 13.5, fontWeight: 700, color: '#1B34F0', cursor: 'pointer' }}>Vybrat jinou fotku</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <EBtnSek onClick={() => onZrus()} disabled={ukladam}>Zrušit</EBtnSek>
            <EBtnHl onClick={uloz} disabled={!poz.cur || ukladam}>{ukladam ? 'Ukládám…' : 'Uložit'}</EBtnHl>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Nabídka u úvodní fotky (jako Facebook): bez fotky jen Nahrát fotku; s fotkou
// i Vybrat z fotek firmy, Změnit pozici a Odebrat. V portálu — karta hlavičky
// má overflow:hidden a nabídku by ořízla.
function PFCoverMenu({ poz, polozky, onZavri }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const venku = e => { if (ref.current && !ref.current.contains(e.target)) onZavri(); };
    const esc = e => { if (e.key === 'Escape') onZavri(); };
    document.addEventListener('mousedown', venku, true);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', onZavri, true);
    window.addEventListener('resize', onZavri);
    return () => { document.removeEventListener('mousedown', venku, true); document.removeEventListener('keydown', esc); window.removeEventListener('scroll', onZavri, true); window.removeEventListener('resize', onZavri); };
  }, []);
  return ReactDOM.createPortal(
    <div ref={ref} role="menu" style={{ position: 'fixed', top: poz.top, right: poz.right, zIndex: 300, minWidth: 240, background: '#fff', border: '1px solid #E6E9F5', borderRadius: 12, padding: 6, boxShadow: '0 18px 40px -14px rgba(20,22,40,.3)', animation: 'eKartaIn .16s cubic-bezier(.2,.8,.2,1) both' }}>
      {polozky.map((x, i) => x === '-' ? <div key={i} style={{ height: 1, background: '#F0F2FA', margin: '4px 6px' }} /> : (
        <button key={x.l} role="menuitem" onClick={() => { onZavri(); x.go(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#1F2433', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name={x.ic} size={19} color="#3A4266" />{x.l}
        </button>
      ))}
    </div>,
    document.body
  );
}

// Výběr úvodní fotky z Fotek firmy
function PFVyberFotky({ fotky, onVyber, onZrus }) {
  React.useEffect(() => {
    const esc = e => { if (e.key === 'Escape') onZrus(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);
  return ReactDOM.createPortal(
    <div onClick={onZrus} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(11,18,51,.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'eDotazIn .18s ease-out' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Vybrat úvodní fotku"
        style={{ width: 620, maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', background: '#fff', borderRadius: 18, boxShadow: '0 30px 80px -20px rgba(11,18,51,.45)', padding: '24px 26px 22px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em' }}>Vybrat úvodní fotku</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginTop: 18 }}>
          {fotky.map(u => (
            <button key={u} type="button" onClick={() => onVyber(u)} className="e-pf-vyber"
              style={{ padding: 0, border: 'none', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', aspectRatio: '4 / 3', background: '#F1F3FB' }}>
              <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><EBtnSek onClick={onZrus}>Zrušit</EBtnSek></div>
      </div>
    </div>,
    document.body
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
  const [orez, setOrez] = React.useState(null);           // { file } — okno úpravy loga před nahráním
  // Úvodní fotka se upravuje přímo na profilu (jako Facebook): { img, url, novy }
  const [coverUprava, setCoverUprava] = React.useState(null);
  const [coverMenu, setCoverMenu] = React.useState(null); // { top, right } — nabídka u tlačítka
  const [vyberFotky, setVyberFotky] = React.useState(false);
  const soubory = React.useRef({});
  const coverRef = React.useRef(null);
  const poz = _usePfPozice(coverUprava && coverUprava.img, coverRef);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setDirty(true); };
  const setSit = (k, v) => { setForm(f => ({ ...f, socials: { ...f.socials, [k]: v } })); setDirty(true); };
  const setDen = (k, v) => { setForm(f => ({ ...f, hours: { ...f.hours, [k]: v } })); setDirty(true); };
  const ukaz = (text, chyba) => { setHlaska({ text, chyba }); setTimeout(() => setHlaska(null), chyba ? 9000 : 3200); };

  // ── Fotky: výběr souboru → zmenšení → bucket `uploads` → URL do formuláře ──
  const vyber = kind => { const el = soubory.current[kind]; if (el) { el.value = ''; el.click(); } };
  async function nahraj(kind, fileList) {
    const files = Array.from(fileList || []).filter(f => /^image\//.test(f.type));
    if (!files.length || typeof uploadImageE !== 'function' || typeof sb === 'undefined') return;
    // Logo: nejdřív okno úpravy; úvodní fotka: hned na profil do úpravy pozice
    if (kind === 'logo') { setOrez({ file: files[0] }); return; }
    if (kind === 'cover') { upravCover(files[0]); return; }
    setNahravam(kind);
    const { data: { session } } = await sb.auth.getSession();
    const uid = session && session.user && session.user.id;
    if (kind === 'photos') {
      const volno = Math.max(0, 8 - form.photos.length);
      const urls = [];
      for (const f of files.slice(0, volno)) { const u = await uploadImageE(uid, 'firma-foto', f, 1400); if (u) urls.push(u); }
      if (urls.length) { setForm(fm => ({ ...fm, photos: [...fm.photos, ...urls] })); setDirty(true); }
      if (urls.length < Math.min(files.length, volno)) ukaz('Některou fotku se nepodařilo nahrát, zkuste to znovu.', true);
    }
    setNahravam(null);
  }
  // Výřez (logo z okna, úvodní fotka z profilu) → bucket `uploads` → hned do profilu.
  // Fotky se ukládají rovnou po „Uložit" v úpravě, ne až tlačítkem Uložit změny.
  async function nahrajVyrez(kind, blob) {
    setOrez(null);
    setNahravam(kind);
    const { data: { session } } = await sb.auth.getSession();
    const uid = session && session.user && session.user.id;
    const u = await uploadImageE(uid, kind === 'cover' ? 'firma-pozadi' : 'firma-logo', blob, kind === 'cover' ? 2400 : 600);
    if (u) await ulozFotku(kind === 'cover' ? 'cover_url' : 'logo_url', u);
    else ukaz('Fotku se nepodařilo nahrát, zkuste to znovu.', true);
    setNahravam(null);
    return !!u;
  }
  async function ulozFotku(pole, url) {
    setForm(f => ({ ...f, [pole]: url }));
    const ok = typeof updateEmployerProfile === 'function' ? await updateEmployerProfile({ [pole]: url }) : false;
    if (ok) { window.dispatchEvent(new Event('emp-profil-ulozen')); return; }   // levé menu ukazuje logo
    setDirty(true);   // zůstane ve formuláři, lišta dole nabídne uložit znovu
    ukaz(pole === 'cover_url' ? 'Úvodní fotku se zatím nepodařilo uložit — databáze na ni ještě není připravená.' : 'Logo se nepodařilo uložit, zkuste to znovu.', true);
  }

  // ── Úvodní fotka: úprava pozice přímo na profilu ──
  // zdroj = soubor (nová fotka) nebo adresa (stávající úvodní / fotka firmy)
  async function upravCover(zdroj) {
    try {
      const f = await _pfNactiFotku(zdroj);
      setCoverUprava({ ...f, soubor: typeof zdroj !== 'string' });
    } catch (e) { ukaz('Tuhle fotku se nepodařilo otevřít. Zkuste JPG nebo PNG, případně ji nahrajte znovu.', true); }
  }
  const zrusCover = () => { if (coverUprava && coverUprava.soubor) URL.revokeObjectURL(coverUprava.url); setCoverUprava(null); };
  async function ulozCover() {
    if (!poz.cur || nahravam) return;
    let blob;
    try { blob = await poz.vyrez(2400); }
    catch (e) { ukaz('Tuhle fotku teď nejde upravit — nahrajte ji prosím znovu.', true); return; }
    const ok = await nahrajVyrez('cover', blob);
    if (ok) zrusCover();
  }
  const otevriCoverMenu = e => {
    const r = e.currentTarget.getBoundingClientRect();
    setCoverMenu({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
  };
  const coverPolozky = form.cover_url ? [
    ...(form.photos.length ? [{ l: 'Vybrat úvodní fotku', ic: 'gallery-linear', go: () => setVyberFotky(true) }] : []),
    { l: 'Nahrát fotku', ic: 'upload-minimalistic-linear', go: () => vyber('cover') },
    { l: 'Změnit pozici', ic: 'move-linear', go: () => upravCover(form.cover_url) },
    '-',
    { l: 'Odebrat', ic: 'trash-bin-minimalistic-linear', go: () => ulozFotku('cover_url', '') },
  ] : [
    { l: 'Nahrát fotku', ic: 'upload-minimalistic-linear', go: () => vyber('cover') },
  ];
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
    // Sloupce z migration_profil_firmy.sql. Každý zvlášť: když v DB některý chybí
    // (30. 9. chyběly cover_url, career_url, contact_email, opening_hours), dřív
    // spadl celý zápis a neuložil se ani telefon a rok založení, které v DB už jsou.
    const nove = [
      ['cover_url', form.cover_url, 'úvodní fotka'], ['founded', form.founded.trim() || null, 'rok založení'],
      ['career_url', form.career.trim(), 'kariérní stránka'], ['phone', form.phone.trim(), 'telefon'],
      ['contact_email', form.email.trim(), 'e-mail'], ['opening_hours', form.hours, 'otevírací doba'],
    ];
    const ok = typeof updateEmployerProfile === 'function' ? await updateEmployerProfile(zaklad) : false;
    const neulozene = [];
    if (ok) for (const [k, v, popis] of nove) { if (!(await updateEmployerProfile({ [k]: v }))) neulozene.push(popis); }
    setSaving(false);
    if (!ok) { ukaz('Uložení se nezdařilo, zkuste to znovu.', true); return; }
    setDirty(false);
    if (C && form.name.trim()) { C.name = form.name.trim(); C.logo = C.name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase(); }
    window.dispatchEvent(new Event('emp-profil-ulozen'));   // levé menu (logo, název)
    ukaz(neulozene.length
      ? 'Profil uložen, ale ' + neulozene.join(', ') + (neulozene.length > 1 ? ' se zatím neukládají' : ' se zatím neukládá') + ' — databáze na to ještě není připravená.'
      : 'Profil uložen.', neulozene.length > 0);
  }
  const zahod = () => { setForm(_pfZProfilu(P, C)); setDirty(false); };

  const nazev = form.name.trim() || 'Název vaší firmy';
  const inicialy = (form.name.trim() || C.name || '?').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
  const krajTxt = (_PF_KRAJE.find(k => k[0] === form.kraj) || [])[1] || '';
  const verified = !!P.verified;
  const recenze = (typeof E_REVIEWS !== 'undefined' ? E_REVIEWS : []);
  const prumer = recenze.length ? (recenze.reduce((a, r) => a + (r.rating || 0), 0) / recenze.length) : 0;

  const karta = { background: '#fff', border: '1px solid #E6E9F5', borderRadius: 18, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 };
  const nadpis = { fontSize: 16, fontWeight: 800, color: '#0B1233', letterSpacing: '-.01em' };
  const inp = { width: '100%', fontSize: 14, fontWeight: 600, color: '#0B1233', background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 10, padding: '11px 13px', outline: 'none' };

  return (
    <div className="e-ram e-volne" style={{ padding: 20 }}>
      <div style={{ background: '#F1F3FB', border: '1px solid #DDE1F0', borderRadius: 22, overflow: 'hidden' }}>
        {/* Bez nadpisu „Profil firmy" a popisku (Yasin 30. 9.) — že jde o profil,
            je vidět; víc místa pro samotný vzhled. Uložení nabízí plovoucí lišta dole. */}
        <div style={{ padding: '4px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* ── Hlavička: fotka pozadí + logo + název ── */}
          <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 18, overflow: 'hidden' }}>
            {souborInput('cover')}{souborInput('logo')}{souborInput('photos')}
            {orez && <PFOrez key={orez.file.name + orez.file.size + orez.file.lastModified} file={orez.file}
              onZrus={chyba => { setOrez(null); if (chyba === true) ukaz('Tuhle fotku se nepodařilo otevřít. Zkuste JPG nebo PNG.', true); }}
              onJina={() => vyber('logo')} onUloz={blob => nahrajVyrez('logo', blob)} />}
            {coverMenu && <PFCoverMenu poz={coverMenu} polozky={coverPolozky} onZavri={() => setCoverMenu(null)} />}
            {vyberFotky && <PFVyberFotky fotky={form.photos} onZrus={() => setVyberFotky(false)} onVyber={u => { setVyberFotky(false); upravCover(u); }} />}
            {/* Úvodní fotka (Yasin 30. 9., jako Facebook). Rám 4 : 1 — stejný poměr, v jakém
                se výřez ukládá, takže na profilu je přesně to, co si firma nastavila.
                Bez fotky světlá plocha #F2F8FC, při najetí zešedne (.e-pf-cover-prazdne).
                V úpravě: tažením posun, kolečkem / posuvníkem přiblížení, Zrušit / Uložit. */}
            <div ref={coverRef} className={form.cover_url || coverUprava ? undefined : 'e-pf-cover-prazdne'} {...(coverUprava ? poz.ovladani : {})}
              style={{ position: 'relative', aspectRatio: '4 / 1', minHeight: 170, overflow: 'hidden',
                background: form.cover_url ? ('#DDE1F0 center/cover no-repeat url("' + form.cover_url + '")') : undefined,
                ...(coverUprava ? { background: '#0B1233', cursor: poz.tahne ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none' } : {}) }}>
              {coverUprava && poz.cur && <img src={coverUprava.url} alt="" draggable={false} style={poz.obrazekStyl} />}
              {!form.cover_url && !coverUprava && (
                <div onClick={() => vyber('cover')} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', color: '#0B1233', textAlign: 'center', padding: '0 24px' }}>
                  <span style={{ width: 52, height: 52, borderRadius: 16, background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px -6px rgba(11,18,51,.18)' }}><Icon name="gallery-add-bold" size={24} color="#1B34F0" /></span>
                  <span style={{ fontSize: 17, fontWeight: 800 }}>Přidat úvodní fotku</span>
                </div>
              )}
              {coverUprava ? (
                <>
                  {/* Nahoře vpravo jen přiblížení — bez vysvětlivek (Yasin 30. 9.); táhnout jde všude kromě posuvníku */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, padding: '14px 18px 26px', background: 'linear-gradient(180deg, rgba(11,18,51,.45), rgba(11,18,51,0))', color: '#fff', pointerEvents: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }} onPointerDown={e => e.stopPropagation()}>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>Přiblížení</span>
                      <input type="range" min="1" max={_PF_ZOOM_MAX} step="0.01" value={poz.cur ? poz.cur.z : 1} disabled={!poz.cur}
                        onChange={e => poz.zoomNa(parseFloat(e.target.value))} aria-label="Přiblížení" style={{ width: 150, accentColor: '#fff', cursor: 'pointer' }} />
                    </span>
                  </div>
                  <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 3, display: 'flex', gap: 8 }} onPointerDown={e => e.stopPropagation()}>
                    <button onClick={zrusCover} disabled={nahravam === 'cover'} style={{ fontSize: 13.5, fontWeight: 700, color: '#0B1233', background: 'rgba(255,255,255,.94)', border: 'none', padding: '9px 16px', borderRadius: 10, cursor: 'pointer' }}>Zrušit</button>
                    <button onClick={ulozCover} disabled={!poz.cur || nahravam === 'cover'} className="e-btn-hl" style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', background: '#1B34F0', border: 'none', padding: '9px 18px', borderRadius: 10, cursor: 'pointer' }}>{nahravam === 'cover' ? 'Ukládám…' : 'Uložit'}</button>
                  </div>
                </>
              ) : (
                /* Tlačítko vpravo dole → nabídka (bez fotky jen Nahrát fotku) */
                <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 3 }}>
                  <button onClick={e => coverMenu ? setCoverMenu(null) : otevriCoverMenu(e)} aria-haspopup="menu" aria-expanded={!!coverMenu}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 800, color: '#0B1233', background: 'rgba(255,255,255,.96)', border: 'none', padding: '9px 14px', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 14px -6px rgba(11,18,51,.3)' }}>
                    <Icon name="camera-bold" size={16} color="#0B1233" />{form.cover_url ? 'Upravit úvodní fotku' : 'Přidat úvodní fotku'}
                  </button>
                </div>
              )}
              {nahravam === 'cover' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,18,51,.45)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 15, fontWeight: 800 }}>Ukládám úvodní fotku…</div>}
            </div>
            {/* Řádek s logem zasahuje 64 px do úvodní fotky: jeho průhledná část nesmí brát
                kliknutí (Zrušit / Uložit / Upravit úvodní fotku) ani tažení fotky — klikat jde jen na obsah */}
            <div className="e-pf-radek-loga" style={{ padding: '0 28px 22px', display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: -64, position: 'relative', flexWrap: 'wrap', pointerEvents: 'none' }}>
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
              {/* Karty „Profil vyplněný na X %" a „Účet a tarif" zatím pryč (Yasin 30. 9.).
                  Tarif a odhlášení jsou v kartě firmy dole v levém menu, nedoplněný
                  profil hlásí Dashboard v „Co je potřeba udělat". */}
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
