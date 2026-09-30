// Makej Employer — Dashboard (varianta 1d: modrá hlavička + pás metrik + pipeline + plán/živě/recenze)
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

// ── DASHBOARD (zjednodušený 26. 9.) ──
// Yasin: „jednoduchost jako Stripe, ale náš vzhled". Proto: modrá hlavička
// a pás čísel zůstaly (stejné jako na ostatních záložkách), ale pod nimi
// JEDNA bílá plocha místo sedmi karet, sekce oddělené jen linkou a mezerou,
// modrá jen na odkazy. Pryč kanban „Pipeline" (zdvojoval Kandidáty),
// ukázkový Plán směn a vymyšlená čísla (zhlédnutí 33 200, swipe right) —
// všechno tady je skutečné: E_JOBS[].candidates (každý zájem s časem),
// E_CANDIDATES, E_THREADS, E_REVIEWS, E_ACTIVITY.
function EDashboard({ period = '30d', onTab, onNew, onPeriod }) {
  const go = tab => () => onTab && onTab(tab);
  const pl = (n, a, b, c) => n === 1 ? a : (n >= 2 && n <= 4) ? b : c;
  const ink = '#0B1233', ink2 = '#3A4266', muted = '#7A82A6', line = '#EEF0F6', blue = '#1B34F0';

  const jobs = (typeof E_JOBS !== 'undefined' ? E_JOBS : []);
  const C = (typeof E_CANDIDATES !== 'undefined' ? E_CANDIDATES : {});
  const cekaji = (C.new || []).slice().sort((x, y) => new Date(x.createdAt || 0) - new Date(y.createdAt || 0));
  const vlakna = (typeof E_THREADS !== 'undefined' ? E_THREADS : []);
  const neprectene = vlakna.reduce((a, t) => a + (t.unread || 0), 0);
  const recenze = (typeof E_REVIEWS !== 'undefined' ? E_REVIEWS : []);
  const prumer = recenze.length ? recenze.reduce((a, r) => a + (r.rating || 0), 0) / recenze.length : 0;
  const aktivita = (typeof E_ACTIVITY !== 'undefined' ? E_ACTIVITY : []);
  const aktivni = jobs.filter(j => j.status === 'active' || j.status === 'urgent');
  const tier = (typeof _employerPlanTier === 'function') ? _employerPlanTier() : 'vyhodny';
  const limit = (typeof EMPLOYER_MAX_ACTIVE !== 'undefined' && EMPLOYER_MAX_ACTIVE[tier] != null) ? EMPLOYER_MAX_ACTIVE[tier] : 2;

  // Zájemci a najatí za zvolené období — ze skutečných časů zájmu
  const isCustom = period && typeof period === 'object';
  const od = isCustom ? new Date(period.from).getTime() : Date.now() - ({ '7d': 7, '30d': 30, '90d': 90, rok: 365 }[period] || 30) * 86400000;
  const doT = isCustom ? new Date(period.to).getTime() + 86400000 : Date.now() + 1;
  const vObdobi = [];
  jobs.forEach(j => (j.candidates || []).forEach(c => { const t = new Date(c.matched_at).getTime(); if (t >= od && t < doT) vObdobi.push(c); }));
  const zajemci = vObdobi.length;
  const najato = vObdobi.filter(c => c.status === 'accepted').length;
  const rangeLbl = isCustom ? (_eFmt(period.from) + ' – ' + _eFmt(period.to)) : ({ '7d': '7 dní', '30d': '30 dní', '90d': '90 dní', rok: '12 měsíců' }[period] || '30 dní');

  const cisla = [
    { l: 'Zájemci', v: zajemci, s: 'za ' + rangeLbl, kam: 'Kandidáti', onClick: go('candidates') },
    { l: 'Najato', v: najato, s: zajemci ? Math.round(najato / zajemci * 100) + ' % zájemců' : 'za ' + rangeLbl },
    { l: 'Aktivní inzeráty', v: aktivni.length + (limit === Infinity ? '' : ' / ' + limit), s: 'limit tarifu', kam: 'Inzeráty', onClick: go('jobs') },
    { l: 'Hodnocení', v: prumer ? prumer.toFixed(1).replace('.', ',') : '—', s: recenze.length ? recenze.length + ' hodnocení' : 'zatím žádné', kam: recenze.length ? 'Recenze' : null, onClick: recenze.length ? go('reviews') : undefined },
  ];
  const dniOd = iso => { const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return isNaN(d) ? null : Math.max(0, d); };
  const kdy = iso => { const d = dniOd(iso); return d == null ? '' : d === 0 ? 'dnes' : d === 1 ? 'včera' : 'před ' + d + ' dny'; };
  const nadpis = (t, odkaz, kam) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: ink }}>{t}</span>
      {odkaz && <span onClick={go(kam)} style={{ fontSize: 13, fontWeight: 700, color: blue, cursor: 'pointer' }}>{odkaz}</span>}
    </div>
  );
  const radek = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid ' + line };

  return (
    <div className="e-ram" style={{ padding: 20, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: '#F1F3FB', border: '1px solid #DDE1F0', borderRadius: 22, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>

        <ETabHlava title="Dashboard">
          <EPeriodPicker value={period} onChange={onPeriod} />
          <EBtnHl onClick={onNew}>+ Nový inzerát</EBtnHl>
        </ETabHlava>

        {/* Pás čísel — 4 skutečná čísla, každé vede tam, kde se s ním pracuje */}
        <div style={{ flex: 'none' }}>
          <EMetriky items={cisla} />
        </div>

        {/* Jedna bílá plocha, sekce oddělené linkou a mezerou.
            Pevná obrazovka (28. 9.): plocha vyplní okno až dolů a každý
            sloupec se posouvá sám, jen když se do něj obsah nevejde. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px 22px' }}>
          <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 18, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gridTemplateRows: 'minmax(0,1fr)', height: '100%', minHeight: 360, boxSizing: 'border-box', overflow: 'hidden' }}>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 34, minWidth: 0, minHeight: 0, overflowY: 'auto' }}>
              {/* Čeká na vás */}
              <div>
                {nadpis('Čeká na vás', cekaji.length ? 'Všichni kandidáti' : null, 'candidates')}
                {cekaji.length === 0 && neprectene === 0 && (
                  <div style={{ ...radek, color: muted, fontSize: 14 }}>{jobs.length ? 'Všechno máte vyřízené.' : 'Až se někdo přihlásí na váš inzerát, uvidíte ho tady.'}</div>
                )}
                {cekaji.slice(0, 4).map(c => {
                  const d = dniOd(c.createdAt);
                  return (
                    <div key={c.id} style={radek}>
                      <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: '#EEF1FF', color: blue, fontSize: 13, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{c.avatar}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: ink }}>{c.name}</div>
                        <div style={{ fontSize: 12.5, color: muted }}>{[c.jobTitle || 'Inzerát', c.createdAt ? kdy(c.createdAt) : c.lastSeen].filter(Boolean).join(' · ')}</div>
                      </div>
                      {d >= 2 && <span style={{ fontSize: 12, fontWeight: 700, color: '#B96F06' }}>čeká {d} {pl(d, 'den', 'dny', 'dní')}</span>}
                      <span onClick={go('candidates')} style={{ fontSize: 13, fontWeight: 700, color: blue, cursor: 'pointer', marginLeft: 8 }}>Odpovědět</span>
                    </div>
                  );
                })}
                {cekaji.length > 4 && <div style={{ ...radek, fontSize: 13, color: muted }}>a {cekaji.length - 4} {pl(cekaji.length - 4, 'další', 'další', 'dalších')}</div>}
                {neprectene > 0 && (
                  <div style={radek}>
                    <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: '#EEF1FF', display: 'grid', placeItems: 'center' }}><Icon name="chat-round-line-bold" size={17} color={blue} /></span>
                    <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: ink }}>{neprectene} {pl(neprectene, 'nepřečtená zpráva', 'nepřečtené zprávy', 'nepřečtených zpráv')}</span>
                    <span onClick={go('chat')} style={{ fontSize: 13, fontWeight: 700, color: blue, cursor: 'pointer' }}>Otevřít</span>
                  </div>
                )}
              </div>

              {/* Inzeráty */}
              <div>
                {nadpis('Inzeráty', jobs.length ? 'Všechny inzeráty' : null, 'jobs')}
                {jobs.length === 0 ? (
                  <div style={{ ...radek, fontSize: 14, color: muted }}>Zatím žádný inzerát.<span onClick={onNew} style={{ fontWeight: 700, color: blue, cursor: 'pointer' }}>Vytvořit první</span></div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) 1fr 90px 90px', gap: 12, padding: '10px 0 8px', fontSize: 12.5, color: muted }}>
                      <span>Pozice</span><span>Stav</span><span style={{ textAlign: 'right' }}>Zájemci</span><span style={{ textAlign: 'right' }}>Najato</span>
                    </div>
                    {jobs.slice(0, 6).map(j => {
                      const zap = j.status === 'active' || j.status === 'urgent';
                      return (
                        <div key={j.id} onClick={go('jobs')} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) 1fr 90px 90px', gap: 12, padding: '12px 0', borderTop: '1px solid ' + line, fontSize: 14, color: ink, cursor: 'pointer', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: ink2 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: zap ? '#0FA968' : '#C3C8DA' }} />{zap ? 'Aktivní' : j.status === 'filled' ? 'Obsazeno' : 'Vypnuto'}</span>
                          <span style={{ textAlign: 'right' }}>{(j.candidates || []).length}</span>
                          <span style={{ textAlign: 'right' }}>{j.hired || 0}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #E6E9F5', padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 34, minHeight: 0, overflowY: 'auto' }}>
              {/* Poslední aktivita */}
              <div>
                {nadpis('Poslední aktivita')}
                {aktivita.length === 0 && <div style={{ ...radek, fontSize: 14, color: muted }}>Zatím se nic nestalo.</div>}
                {aktivita.slice(0, 5).map((a, i) => (
                  <div key={i} style={{ padding: '11px 0', borderTop: '1px solid ' + line, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13.5, color: ink2, lineHeight: 1.4 }}><b style={{ color: ink }}>{a.who}</b> {a.what}</span>
                    <span style={{ fontSize: 12, color: muted }}>{a.when}</span>
                  </div>
                ))}
              </div>
              {/* Hodnocení */}
              <div>
                {nadpis('Hodnocení', recenze.length ? 'Recenze' : null, 'reviews')}
                {recenze.length ? (
                  <div style={{ ...radek, gap: 10 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: ink, letterSpacing: '-.02em' }}>{prumer.toFixed(1).replace('.', ',')}</span>
                    <span style={{ fontSize: 13, color: muted }}>{recenze.length} hodnocení</span>
                  </div>
                ) : (
                  <div style={{ ...radek, fontSize: 14, color: muted }}>Zatím vás nikdo nehodnotil.</div>
                )}
                {recenze[0] && recenze[0].text && <div style={{ fontSize: 13.5, color: ink2, lineHeight: 1.5 }}>„{recenze[0].text}" — {recenze[0].author}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EDashboard });
