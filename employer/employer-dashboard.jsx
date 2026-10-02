// Makej Employer — Dashboard: přehled všeho, co firma potřebuje vědět (30. 9.: co udělat, inzeráty, tarif, nábor)
// Reuses T, E_KPIS, E_JOBS, E_CANDIDATES, E_ACTIVITY, E_REVIEWS, E_THREADS, window.empOpenProfile

// ── Výběr období: bílá roletka (7/30/90 dní · Rok) + „Vlastní" rozsah v klasickém
//    kalendáři (27. 9.: kolečka den/měsíc/rok byla na výběr období moc složitá) ──
const _EMES  = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
const _EDNY_T = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
// Místní datum → 'RRRR-MM-DD' (toISOString by kolem půlnoci posunul den kvůli UTC)
const _eIso   = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const _eRozloz = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); const t = new Date(); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() }; };
const _eFmt      = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? (+m[3] + '. ' + (+m[2]) + '. ' + m[1]) : ''; };
const _eFmtShort = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? (+m[3] + '. ' + (+m[2]) + '.') : ''; };

// Kalendář na jeden den (pro „Od" a „Do" zvlášť). Nahoře šipky + výběr
// měsíce a roku; dny mimo min–max nejdou vybrat; rozsah od–do je podbarvený,
// ať je vidět, co už je vybrané.
function ECalDen({ value, min, max, od, doo, onPick }) {
  const [view, setView] = useStateE(() => { const r = _eRozloz(value); return { y: r.y, m: r.m }; });
  const rokDnes = new Date().getFullYear(), mesDnes = new Date().getMonth();
  const ROKY = []; for (let r = rokDnes; r >= rokDnes - 6; r--) ROKY.push(r);
  const posun = k => setView(v => { const d = new Date(v.y, v.m + k, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const lzeDal = view.y < rokDnes || (view.y === rokDnes && view.m < mesDnes);

  const odsazeni = (new Date(view.y, view.m, 1).getDay() + 6) % 7;   // pondělí = 0
  const pocet = new Date(view.y, view.m + 1, 0).getDate();
  const bunky = [];
  for (let i = 0; i < odsazeni; i++) bunky.push(null);
  for (let d = 1; d <= pocet; d++) bunky.push(_eIso(new Date(view.y, view.m, d)));
  const dnes = _eIso(new Date());
  const sel = { fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#0B1233', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 8, padding: '4px 4px', cursor: 'pointer', outline: 'none' };
  const sipka = on => ({ width: 28, height: 28, borderRadius: 8, border: '1px solid #E6E9F5', background: '#fff', color: on ? '#0B1233' : '#C7CCE3', fontSize: 15, cursor: on ? 'pointer' : 'default', display: 'grid', placeItems: 'center' });

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
        <button type="button" className="e-btn-sek" onClick={() => posun(-1)} style={sipka(true)} aria-label="Předchozí měsíc">‹</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <select value={view.m} onChange={e => setView(v => ({ ...v, m: +e.target.value }))} style={sel} aria-label="Měsíc">
            {_EMES.map((n, i) => <option key={i} value={i} disabled={view.y === rokDnes && i > mesDnes}>{n}</option>)}
          </select>
          <select value={view.y} onChange={e => { const y = +e.target.value; setView(v => ({ y, m: y === rokDnes ? Math.min(v.m, mesDnes) : v.m })); }} style={sel} aria-label="Rok">
            {ROKY.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button type="button" className={lzeDal ? 'e-btn-sek' : ''} onClick={() => lzeDal && posun(1)} style={sipka(lzeDal)} aria-label="Další měsíc">›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
        {_EDNY_T.map(t => <div key={t} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: '#A6ADCB', padding: '4px 0 6px' }}>{t}</div>)}
        {bunky.map((d, i) => {
          if (!d) return <div key={'x' + i} />;
          const mimo = (min && d < min) || (max && d > max);
          const vybrany = d === value;
          const uvnitr = od && doo && d > od && d < doo;
          const kraj = d === od || d === doo;
          return (
            <div key={d} style={{ height: 31, display: 'grid', placeItems: 'center', background: uvnitr ? '#F3F5FF' : 'transparent' }}>
              <button type="button" disabled={mimo} onClick={() => onPick(d)}
                className={'e-cal-den' + (vybrany ? ' kraj' : '')}
                style={{ width: 29, height: 29, borderRadius: '50%', border: 'none', fontSize: 13, fontWeight: vybrany || kraj ? 800 : 600, cursor: mimo ? 'default' : 'pointer',
                  background: vybrany ? '#0020F6' : kraj ? '#E2E7FF' : 'transparent', color: vybrany ? '#fff' : mimo ? '#D1D5E4' : '#0B1233',
                  boxShadow: d === dnes && !vybrany ? 'inset 0 0 0 1.5px #C7D0FF' : 'none' }}>{+d.slice(8)}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Roletka výběru období: 7/30/90 dní · Rok · Vlastní (od–do přes kolečka).
// Šířka tlačítka Období: pro 7/30/90 dní a Rok stejná (nejdelší „30 dní"),
// takže mezi nimi ikona neposkočí; vlastní datum potřebuje víc místa.
const _E_OBD_SIRKA = 154, _E_OBD_SIRKA_VL = 208;
function EPeriodPicker({ value, onChange }) {
  const [open, setOpen] = useStateE(false);
  const [showCustom, setShowCustom] = useStateE(false);   // místo seznamu je vidět Od / Do
  const [kal, setKal] = useStateE(null);                   // 'od' | 'do' — který kalendář je rozbalený
  const isCustom = value && typeof value === 'object';
  const [rozsah, setRozsah] = useStateE(() => isCustom ? { from: value.from, to: value.to } : { from: _eIso(new Date(Date.now() - 29 * 86400000)), to: _eIso(new Date()) });
  const ref = useRefE(null);
  const zavri = () => { setOpen(false); setShowCustom(false); setKal(null); };
  useEffectE(() => {
    if (!open) return;
    const onClick = e => { if (ref.current && !ref.current.contains(e.target)) zavri(); };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [open]);

  const presets = [['7d', '7 dní'], ['30d', '30 dní'], ['90d', '90 dní'], ['rok', 'Rok']];
  const label = isCustom ? (_eFmtShort(value.from) + ' – ' + _eFmtShort(value.to)) : ((presets.find(p => p[0] === value) || ['', '30 dní'])[1]);
  const pickPreset = k => { onChange(k); zavri(); };
  // Vybraný den se jen zapíše do Od/Do (kalendář se zavře); data se přepočítají
  // až tlačítkem Potvrdit.
  const vyberDen = (kde, d) => {
    const r = kde === 'od' ? { from: d, to: rozsah.to && rozsah.to < d ? d : rozsah.to } : { from: rozsah.from, to: d };
    setRozsah(r); setKal(null);
  };
  const potvrd = () => { if (!rozsah.from || !rozsah.to) return; onChange({ from: rozsah.from, to: rozsah.to }); zavri(); };
  const optStyle = active => ({ display: 'block', width: '100%', textAlign: 'center', padding: '9px 16px', border: 'none', background: active ? '#EEF1FF' : 'transparent', color: active ? '#1B34F0' : '#0B1233', fontSize: 13.5, fontWeight: active ? 800 : 600, cursor: 'pointer' });
  const radek = (kde, popis, hodnota) => (
    <div>
      <button type="button" className="e-obd-vol" onClick={() => setKal(k => k === kde ? null : kde)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', padding: '10px 12px', border: 'none', background: kal === kde ? '#EEF1FF' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#7A82A6', width: 22 }}>{popis}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, textAlign: 'right', color: kal === kde ? '#1B34F0' : '#0B1233' }}>{_eFmt(hodnota)}</span>
      </button>
      {kal === kde && (
        <div style={{ padding: '4px 10px 10px' }}>
          <ECalDen value={hodnota} od={rozsah.from} doo={rozsah.to}
            min={kde === 'do' ? rozsah.from : null} max={_eIso(new Date())}
            onPick={d => vyberDen(kde, d)} />
        </div>
      )}
    </div>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bílé tlačítko s linkou (hlavičky záložek už nejsou modré). Popisek
          říká, co to je — „Období: 30 dní", ne jen „30 dní". */}
      {/* Pevná šířka: při přepnutí 7 dní ↔ 30 dní ↔ vlastní datum se mění jen
          text, ikona ani tlačítko neposkočí. */}
      <button type="button" className="e-btn-sek" onClick={() => open ? zavri() : setOpen(true)} style={{ width: isCustom ? _E_OBD_SIRKA_VL : _E_OBD_SIRKA, boxSizing: 'border-box', fontSize: 13.5, fontWeight: 600, color: '#0B1233', background: '#fff', padding: '9px 12px 9px 14px', borderRadius: 10, border: '1px solid #E6E9F5', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <span aria-hidden="true" style={{ display: 'block', width: 17, height: 17, background: '#7A82A6', WebkitMaskImage: 'url(ikony/plan-smen.svg?v=1)', maskImage: 'url(ikony/plan-smen.svg?v=1)', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
        <span style={{ color: '#7A82A6' }}>Období:</span> {label}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 60, width: kal ? 258 : (isCustom ? _E_OBD_SIRKA_VL : _E_OBD_SIRKA), background: '#fff', border: '1px solid #E6E9F5', borderRadius: 12, boxShadow: '0 18px 40px -14px rgba(20,22,40,.28)', overflow: 'hidden' }}>
          {!showCustom ? (
            <>
              {presets.map(([k, l]) => <button key={k} className="e-obd-vol" onClick={() => pickPreset(k)} style={optStyle(!isCustom && value === k)}>{l}</button>)}
              <button className="e-obd-vol" onClick={() => setShowCustom(true)} style={{ ...optStyle(isCustom), borderTop: '1px solid #F0F2FA' }}>
                Vlastní
              </button>
            </>
          ) : (
            // „Vlastní": seznam zmizí, zůstane jen Od a Do; každé rozbalí svůj kalendář.
            // Zpět na 7/30/90 dní = zavřít a znovu otevřít roletku.
            <>
              {radek('od', 'Od', rozsah.from)}
              <div style={{ height: 1, background: '#F0F2FA' }} />
              {radek('do', 'Do', rozsah.to)}
              <div style={{ padding: '8px 10px 10px', borderTop: '1px solid #F0F2FA' }}>
                <button type="button" className="e-btn-hl" onClick={potvrd} disabled={!rozsah.from || !rozsah.to}
                  style={{ width: '100%', padding: '8px 0', borderRadius: 9, border: 'none', background: '#0020F6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Potvrdit</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD — přehled všeho na jednom místě (30. 9.) ──
// Yasin 30. 9.: „hrozně těžký se v tom vyznat". Pás čísel byl na každé záložce
// a nebylo jasné, kde co hledat. Z ostatních záložek proto zmizel a všechno,
// co by firma měla vědět, je jen tady:
//  - Co je potřeba udělat: kdo čeká na odpověď ve Zprávách, noví zájemci po
//    inzerátech, inzeráty, které potřebují pozornost, nedoplněný profil firmy.
//    Každá položka jedním klikem vede přesně tam, kde se vyřídí.
//  - Vpravo Tarif (kolik inzerátů ještě jde zapnout, topování) a Nábor za období.
//  - Vaše inzeráty: karty 1:1 jako v Inzerátech (tak je vidí brigádník) v řadě
//    do strany (EJobRada z pages3) — Yasin: tabulka „je to jenom text". Nad
//    kartou stav (Aktivní / Urgentní / Neaktivní — Naplněno není).
//  - Dole Poslední aktivita a Hodnocení.
// Všechno ze skutečných dat (E_JOBS, E_CANDIDATES, E_THREADS, E_REVIEWS,
// E_ACTIVITY, EPROFILE) — nic vymyšleného.
const _DB_UKOLU = 6;          // kolik položek „Co je potřeba udělat" je vidět, než se rozbalí zbytek

// Kulatý čtvereček s fotkou nebo iniciálami (jako seznam konverzací ve Zprávách)
function _EDbAvatar({ foto, ini, barva, size = 40, ring }) {
  return (
    <span style={{ width: size, height: size, flex: 'none', borderRadius: Math.round(size * .3), overflow: 'hidden', display: 'grid', placeItems: 'center',
      background: foto ? '#EEF1FF' : (barva || '#1B34F0'), color: '#fff', fontSize: Math.round(size * .34), fontWeight: 800, boxShadow: ring ? '0 0 0 2px #fff' : 'none' }}>
      {foto ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none'; }} /> : ini}
    </span>
  );
}

function EDashboard({ period = '30d', onTab, onNew, onPeriod, onOpenChat }) {
  const [vse, setVse] = useStateE(false);
  const go = tab => () => onTab && onTab(tab);
  const pl = (n, a, b, c) => n === 1 ? a : (n >= 2 && n <= 4) ? b : c;
  const ink = '#0B1233', ink2 = '#3A4266', muted = '#7A82A6', line = '#EEF0F6', blue = '#1B34F0', oranz = '#F5920B';

  const jobs = (typeof E_JOBS !== 'undefined' ? E_JOBS : []);
  const C = (typeof E_CANDIDATES !== 'undefined' ? E_CANDIDATES : {});
  const vlakna = (typeof E_THREADS !== 'undefined' ? E_THREADS : []);
  const recenze = (typeof E_REVIEWS !== 'undefined' ? E_REVIEWS : []);
  const aktivita = (typeof E_ACTIVITY !== 'undefined' ? E_ACTIVITY : []);
  const P = (typeof EPROFILE !== 'undefined' ? EPROFILE : {});
  const F = (typeof ECOMPANY !== 'undefined' ? ECOMPANY : {});
  const prumer = recenze.length ? recenze.reduce((a, r) => a + (r.rating || 0), 0) / recenze.length : 0;
  const aktivni = jobs.filter(j => j.status === 'active' || j.status === 'urgent');

  // Tarif: kolik inzerátů smí běžet najednou a kolikrát za měsíc jde topovat
  const tier = (typeof _employerPlanTier === 'function') ? _employerPlanTier() : 'vyhodny';
  const limit = (typeof EMPLOYER_MAX_ACTIVE !== 'undefined' && EMPLOYER_MAX_ACTIVE[tier] != null) ? EMPLOYER_MAX_ACTIVE[tier] : 2;
  const tarif = (typeof EMPLOYER_TARIF_NAZEV !== 'undefined' && EMPLOYER_TARIF_NAZEV[tier]) || '';
  const topLimit = (typeof EMPLOYER_TOP_MESICNE !== 'undefined' && EMPLOYER_TOP_MESICNE[tier]) || 0;
  const topPouzito = (typeof E_TOPOVANI !== 'undefined' ? E_TOPOVANI : []).length;
  const volno = limit === Infinity ? Infinity : limit - aktivni.length;

  // Jak dlouho už něco čeká: minuty od času → „20 min" / „5 h" / „3 dny"
  const minOd = iso => { const t = new Date(iso).getTime(); return iso && !isNaN(t) ? Math.max(0, Math.floor((Date.now() - t) / 60000)) : null; };
  const dobaTxt = m => m < 60 ? Math.max(1, m) + ' min' : m < 1440 ? Math.floor(m / 60) + ' h' : Math.floor(m / 1440) + ' ' + pl(Math.floor(m / 1440), 'den', 'dny', 'dní');
  // Detail inzerátu přes adresu (#inzeraty/<id>) — EJobs si ho z ní při otevření vezme
  const otevriInzerat = id => () => { try { history.pushState(null, '', '#inzeraty/' + encodeURIComponent(id)); } catch (e) {} onTab && onTab('jobs'); };
  const firma = [{ foto: P.logo_url || null, ini: F.logo || '?', barva: '#0020F6' }];   // logo jako v levém menu

  // ── Co je potřeba udělat ──
  const ukoly = [];
  // Zprávy, na které firma ještě neodpověděla (poslední zpráva je od kandidáta)
  vlakna.forEach(t => {
    const m = t.msgs && t.msgs[t.msgs.length - 1];
    if (!m || m.from !== 'them') return;
    ukoly.push({ key: 'z' + t.id, min: minOd(t.lastAt), lide: [{ foto: t.photo, ini: t.avatar, barva: t.color }],
      titul: t.name + ' čeká na vaši odpověď',
      pod: [t.last ? '„' + t.last + '"' : '', t.role].filter(Boolean).join(' · '),
      akce: 'Odepsat', klik: () => onOpenChat ? onOpenChat(t.id) : onTab && onTab('chat') });
  });
  // Noví zájemci, na které firma ještě nereagovala — po inzerátech
  const skupiny = {};
  (C.new || []).forEach(c => {
    const k = c.job_id || c.jobTitle || '?';
    const s = skupiny[k] || (skupiny[k] = { job_id: c.job_id, titul: c.jobTitle || 'Inzerát', lidi: [], min: null });
    s.lidi.push(c);
    const m = minOd(c.createdAt);
    if (m != null && (s.min == null || m > s.min)) s.min = m;
  });
  // Urgentní inzerát (firma ho označila, platí do začátku směny, employer-supabase.jsx) s neobsazenými místy
  const naborHori = j => j.status === 'urgent' && (j.hired || 0) < Math.max(1, j.positions || 0);
  const terminTxt = j => 'termín ' + (j.daysLeft === 1 ? 'zítra' : 'za ' + j.daysLeft + ' dny') + ', ' + (j.positions ? 'přijato ' + (j.hired || 0) + ' z ' + j.positions : 'zatím nikdo přijatý');
  Object.values(skupiny).forEach(s => {
    const n = s.lidi.length;
    const j = jobs.find(x => x.id === s.job_id);
    const jmena = s.lidi.slice(0, 2).map(c => c.name).join(', ') + (n > 2 ? ' a ' + (n - 2) + ' ' + pl(n - 2, 'další', 'další', 'dalších') : '');
    ukoly.push({ key: 'k' + s.job_id, min: s.min, lide: s.lidi.map(c => ({ foto: c.photo, ini: c.avatar, barva: c.color })),
      titul: s.titul + ': ' + n + ' ' + pl(n, 'nový zájemce čeká', 'noví zájemci čekají', 'nových zájemců čeká') + ' na vaši reakci',
      pod: j && naborHori(j) ? 'Pozor, ' + terminTxt(j) + ' · ' + jmena : jmena,
      akce: 'Projít', klik: () => { window.__empCandJob = s.job_id || null; onTab && onTab('candidates'); } });
  });
  ukoly.sort((a, b) => (b.min || 0) - (a.min || 0));   // nejdéle čekající nahoře
  // Inzeráty, které potřebují pozornost
  const fotoInzeratu = j => [{ foto: j.image || (Array.isArray(j.photos) && j.photos[0]) || null, ini: F.logo || '?', barva: '#1B34F0' }];
  if (!jobs.length) ukoly.push({ key: 'j0', lide: firma, titul: 'Přidejte první inzerát', pod: 'Dokud nemáte inzerát, brigádníci vás v aplikaci nenajdou.', akce: 'Vytvořit', klik: onNew });
  else if (!aktivni.length) ukoly.push({ key: 'j1', lide: firma, titul: 'Nemáte žádný aktivní inzerát', pod: 'Brigádníci vás teď v aplikaci nevidí. Zapněte některý z inzerátů.', akce: 'Inzeráty', klik: go('jobs') });
  if (volno < 0) ukoly.push({ key: 'j2', lide: firma, titul: 'Máte víc aktivních inzerátů, než dovoluje tarif', pod: 'Aktivní ' + aktivni.length + ' z ' + limit + '. Pozastavte ' + (-volno) + ' ' + pl(-volno, 'inzerát', 'inzeráty', 'inzerátů') + ', nebo si navyšte tarif.', akce: 'Tarify', klik: go('pricing') });
  // Urgentní inzerát, na který se zatím nikdo nepřihlásil (se zájemci je výš u nich)
  aktivni.filter(j => naborHori(j) && !skupiny[j.id]).forEach(j => {
    ukoly.push({ key: 'u' + j.id, lide: fotoInzeratu(j), titul: j.title + ': ' + terminTxt(j),
      pod: 'Zatím se nikdo nepřihlásil.' + (topPouzito < topLimit && !(j.topUntil && new Date(j.topUntil) > new Date()) ? ' Topování ho v aplikaci posune mezi první inzeráty.' : ''),
      akce: 'Otevřít', klik: otevriInzerat(j.id) });
  });
  // Nedoplněný profil firmy (jen sloupce, které v DB už jsou — stejné hranice jako Profil firmy)
  const chybi = [['název firmy', (P.company_name || '').trim()], ['logo', P.logo_url], ['popis firmy', (P.bio || '').trim().length > 30],
    ['obor', P.industry], ['adresa', (P.address || '').trim()]].filter(x => !x[1]).map(x => x[0]);
  if (chybi.length) ukoly.push({ key: 'p', lide: firma, titul: 'Doplňte profil firmy', pod: 'Chybí: ' + chybi.join(', ') + '. Brigádníci si profil otevřou u vašich inzerátů.', akce: 'Doplnit', klik: go('company') });
  const vidimUkoly = vse ? ukoly : ukoly.slice(0, _DB_UKOLU);

  // ── Nábor za zvolené období ──
  const isCustom = period && typeof period === 'object';
  const od = isCustom ? new Date(period.from).getTime() : Date.now() - ({ '7d': 7, '30d': 30, '90d': 90, rok: 365 }[period] || 30) * 86400000;
  const doT = isCustom ? new Date(period.to).getTime() + 86400000 : Date.now() + 1;
  const vObdobi = [];
  jobs.forEach(j => (j.candidates || []).forEach(c => { const t = new Date(c.matched_at).getTime(); if (t >= od && t < doT) vObdobi.push(c); }));
  const zajemci = vObdobi.length;
  const najato = vObdobi.filter(c => c.status === 'accepted').length;
  // Zhlédnutí po dnech jen když je DB měří s datem (viewsByDay), jinak se neukazují
  const sDatem = jobs.some(j => j.viewsByDay);
  let zhlednuti = 0;
  if (sDatem) jobs.forEach(j => Object.entries(j.viewsByDay || {}).forEach(([den, n]) => { const t = new Date(den + 'T12:00:00').getTime(); if (t >= od - 43200000 && t < doT) zhlednuti += n; }));

  // ── Inzeráty: urgentní a aktivní první, pak neaktivní (stav Naplněno není, 30. 9.) ──
  const PORADI = { urgent: 0, active: 1, paused: 2 };
  const _stav = s => (typeof _jbStatusMap === 'function') ? _jbStatusMap(s) : 'active';
  const serazene = jobs.map(j => ({ ...j, _state: _stav(j.status) })).sort((a, b) => ((PORADI[a.status] ?? 9) - (PORADI[b.status] ?? 9)) || (new Date(b.created_at || 0) - new Date(a.created_at || 0)));

  // ── Společné kousky ──
  const karta = { background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: '18px 22px 20px', minWidth: 0 };
  const nadpis = (t, prava) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 32, marginBottom: 8 }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: ink, letterSpacing: '-.01em' }}>{t}</span>
      {prava}
    </div>
  );
  const odkaz = (t, kam) => <span onClick={typeof kam === 'function' ? kam : go(kam)} style={{ fontSize: 13, fontWeight: 700, color: blue, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</span>;
  const klavesa = f => e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } };
  const cislo = (l, v, pod) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: muted }}>{l}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: ink, letterSpacing: '-.02em', lineHeight: 1.25, marginTop: 2 }}>{v}</div>
      {pod ? <div style={{ fontSize: 12, color: muted, marginTop: 1 }}>{pod}</div> : null}
    </div>
  );

  return (
    <div className="e-ram" style={{ padding: 20 }}>
      <div style={{ background: '#F1F3FB', border: '1px solid #DDE1F0', borderRadius: 22, overflow: 'hidden' }}>

        {/* „+ Nový inzerát" je nahoře v levém menu (30. 9.), v hlavičce už ne */}
        <ETabHlava title="Dashboard" />

        {/* Jedna posuvná plocha: nahoře co udělat + tarif a nábor, pod tím
            karty inzerátů přes celou šířku, dole aktivita a hodnocení */}
        <div className="e-db-telo" style={{ padding: '2px 24px 24px', overflowX: 'hidden' }}>
          <div className="e-db-mriz" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 20, alignItems: 'start' }}>

            {/* Co je potřeba udělat */}
            <div style={karta}>
              {nadpis(<>Co je potřeba udělat{ukoly.length > 0 && <span style={{ marginLeft: 8, fontSize: 12.5, fontWeight: 700, color: blue, background: '#EEF1FF', padding: '3px 9px', borderRadius: 999, verticalAlign: 2 }}>{ukoly.length}</span>}</>)}
              {ukoly.length === 0 ? (
                <div style={{ borderTop: '1px solid ' + line, padding: '16px 0 2px' }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: ink }}>Všechno máte vyřízené</div>
                  <div style={{ fontSize: 13, color: muted, marginTop: 3 }}>Až vám někdo napíše nebo projeví zájem o inzerát, uvidíte to tady.</div>
                </div>
              ) : (
                <div style={{ margin: '0 -22px -20px' }}>
                  {vidimUkoly.map(u => {
                    const dlouho = u.min != null && u.min >= 1440;
                    const lide = (u.lide || []).slice(0, 2);
                    return (
                      <div key={u.key} className="e-db-rad e-db-ukol" role="button" tabIndex={0} onClick={u.klik} onKeyDown={klavesa(u.klik)}
                        style={{ display: 'grid', gridTemplateColumns: '56px minmax(0,1fr) auto auto', alignItems: 'center', gap: 12, padding: '12px 22px', borderTop: '1px solid ' + line, cursor: 'pointer' }}>
                        {/* Kdo nebo co: profilovka, u víc zájemců dvě přes sebe; logo firmy; fotka inzerátu */}
                        <span style={{ position: 'relative', width: 56, height: 40, display: 'block' }}>
                          {lide.map((a, i) => <span key={i} style={{ position: 'absolute', top: 0, left: i * 16, zIndex: 2 - i }}><_EDbAvatar {...a} ring={lide.length > 1} /></span>)}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 700, color: ink, lineHeight: 1.35 }}>{u.titul}</div>
                          {u.pod && <div style={{ fontSize: 13, color: muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.pod}</div>}
                        </div>
                        {u.min != null
                          ? (dlouho
                              ? <span style={{ fontSize: 11.5, fontWeight: 700, color: '#B96F06', background: '#FFF3E0', padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>čeká {dobaTxt(u.min)}</span>
                              : <span style={{ fontSize: 12.5, color: muted, whiteSpace: 'nowrap' }}>čeká {dobaTxt(u.min)}</span>)
                          : <span />}
                        <span style={{ fontSize: 13, fontWeight: 700, color: blue, whiteSpace: 'nowrap', minWidth: 58, textAlign: 'right' }}>{u.akce}</span>
                      </div>
                    );
                  })}
                  {ukoly.length > _DB_UKOLU && (
                    <div className="e-db-rad" role="button" tabIndex={0} onClick={() => setVse(v => !v)} onKeyDown={klavesa(() => setVse(v => !v))}
                      style={{ padding: '12px 22px', borderTop: '1px solid ' + line, fontSize: 13, fontWeight: 700, color: blue, cursor: 'pointer' }}>
                      {vse ? 'Ukázat méně' : 'Ukázat všech ' + ukoly.length}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 20, minWidth: 0 }}>
              {/* Tarif: kolik inzerátů ještě jde zapnout a kolikrát topovat */}
              <div style={karta}>
                {nadpis(tarif ? 'Tarif ' + tarif : 'Tarif', odkaz('Změnit tarif', 'pricing'))}
                <div style={{ borderTop: '1px solid ' + line, paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: ink2 }}>Aktivní inzeráty</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: volno < 0 ? '#C2410C' : ink }}>{aktivni.length}{limit !== Infinity && <span style={{ fontWeight: 600, color: muted }}> z {limit}</span>}</span>
                  </div>
                  {limit !== Infinity && limit <= 10 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + limit + ', minmax(0,1fr))', gap: 4, marginTop: 10 }}>
                      {Array.from({ length: limit }, (_, i) => <span key={i} style={{ height: 8, borderRadius: 4, background: i < aktivni.length ? (volno < 0 ? oranz : blue) : '#E6E9F5' }} />)}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: volno < 0 ? '#C2410C' : muted, marginTop: 9, lineHeight: 1.45 }}>
                    {volno === Infinity ? 'Váš tarif nemá limit.'
                      : volno > 0 ? 'Můžete zapnout ještě ' + volno + ' ' + pl(volno, 'inzerát', 'inzeráty', 'inzerátů') + '.'
                      : volno === 0 ? 'Limit je plný. Další inzerát zapnete, až jiný pozastavíte.'
                      : 'O ' + (-volno) + ' víc, než tarif dovoluje.'}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid ' + line, marginTop: 14, paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: ink2 }}>{typeof E_LIMITY_OD_PRIHLASENI !== 'undefined' && E_LIMITY_OD_PRIHLASENI ? 'Topování' : 'Topování tento měsíc'}</span>
                    {topLimit > 0 && <span style={{ fontSize: 15, fontWeight: 800, color: ink }}>{topPouzito}<span style={{ fontWeight: 600, color: muted }}> z {topLimit}</span></span>}
                  </div>
                  <div style={{ fontSize: 13, color: muted, marginTop: 5, lineHeight: 1.45 }}>
                    {topLimit === 0 ? 'Váš tarif topování nezahrnuje.'
                      : topPouzito >= topLimit ? (typeof E_LIMITY_OD_PRIHLASENI !== 'undefined' && E_LIMITY_OD_PRIHLASENI ? 'Máte vyčerpané, obnoví se při dalším přihlášení.' : 'Tento měsíc máte vyčerpané.')
                      : 'Můžete topovat ještě ' + (topLimit - topPouzito) + '×.'}
                  </div>
                </div>
              </div>

              {/* Nábor za zvolené období */}
              <div style={karta}>
                {nadpis('Nábor', <EPeriodPicker value={period} onChange={onPeriod} />)}
                <div style={{ borderTop: '1px solid ' + line, paddingTop: 14, display: 'grid', gridTemplateColumns: sDatem ? 'repeat(3, minmax(0,1fr))' : 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                  {sDatem && cislo('Zhlédnutí', zhlednuti.toLocaleString('cs-CZ'))}
                  {cislo('Zájemci', zajemci)}
                  {cislo('Najato', najato, zajemci ? Math.round(najato / zajemci * 100) + ' % zájemců' : null)}
                </div>
              </div>
            </div>

            {/* Vaše inzeráty — karty přes celou šířku, stejná řada jako v záložce Inzeráty (EJobRada) */}
            <div className="e-db-cela" style={{ gridColumn: '1 / -1', minWidth: 0, paddingTop: 8 }}>
              {jobs.length === 0 ? (
                <>
                  {nadpis('Vaše inzeráty')}
                  <div style={{ ...karta, padding: '28px 22px', textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: ink }}>Zatím žádný inzerát</div>
                    <div style={{ fontSize: 13.5, color: muted, marginTop: 4 }}>Až ho přidáte, uvidíte ho tady tak, jak ho vidí brigádníci v aplikaci.</div>
                    <div style={{ marginTop: 14 }}><EBtnHl onClick={onNew}>+ Nový inzerát</EBtnHl></div>
                  </div>
                </>
              ) : typeof EJobRada !== 'undefined' && (
                <EJobRada nazev="Vaše inzeráty" stavNad jobs={serazene} onOpen={j => otevriInzerat(j.id)()}
                  extra={<span style={{ marginLeft: 6 }}>{odkaz('Spravovat v Inzerátech', 'jobs')}</span>} />
              )}
            </div>

            {/* Poslední aktivita */}
            <div style={karta}>
              {nadpis('Poslední aktivita')}
              {aktivita.length === 0 && <div style={{ borderTop: '1px solid ' + line, paddingTop: 14, fontSize: 14, color: muted }}>Zatím se nic nestalo.</div>}
              {aktivita.slice(0, 5).map((a, i) => (
                <div key={i} style={{ padding: '11px 0', borderTop: '1px solid ' + line, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13.5, color: ink2, lineHeight: 1.4, minWidth: 0 }}><b style={{ color: ink }}>{a.who}</b> {a.what}</span>
                  <span style={{ fontSize: 12, color: muted, whiteSpace: 'nowrap', flex: 'none' }}>{a.when}</span>
                </div>
              ))}
            </div>

            {/* Hodnocení */}
            <div style={karta}>
              {nadpis('Hodnocení', recenze.length ? odkaz('Recenze', 'reviews') : null)}
              <div style={{ borderTop: '1px solid ' + line, paddingTop: 14 }}>
                {recenze.length ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: ink, letterSpacing: '-.02em' }}>{prumer.toFixed(1).replace('.', ',')}</span>
                      <span style={{ fontSize: 13, color: muted }}>z 5 · {recenze.length} hodnocení</span>
                    </div>
                    {recenze[0] && recenze[0].text && <div style={{ fontSize: 13.5, color: ink2, lineHeight: 1.5, marginTop: 8 }}>„{recenze[0].text}" — {recenze[0].author}</div>}
                  </>
                ) : (
                  <div style={{ fontSize: 14, color: muted }}>Zatím vás nikdo nehodnotil.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EDashboard });
