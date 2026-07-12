// Makej Worker — Swipe UI

const KRAJE_W = [
  { id: 'praha', name: 'Praha' }, { id: 'stredocesky', name: 'Středočeský' },
  { id: 'jihocesky', name: 'Jihočeský' }, { id: 'plzensky', name: 'Plzeňský' },
  { id: 'karlovarsky', name: 'Karlovarský' }, { id: 'ustecky', name: 'Ústecký' },
  { id: 'liberecky', name: 'Liberecký' }, { id: 'kralovehradecky', name: 'Královéhradecký' },
  { id: 'pardubicky', name: 'Pardubický' }, { id: 'vysocina', name: 'Vysočina' },
  { id: 'jihomoravsky', name: 'Jihomoravský' }, { id: 'olomoucky', name: 'Olomoucký' },
  { id: 'zlinsky', name: 'Zlínský' }, { id: 'moravskoslezsky', name: 'Moravskoslezský' },
];
const _krajName = id => (KRAJE_W.find(k => k.id === id) || {}).name || id;

function WSwipe({ tick }) {
  const [jobs,       setJobs]       = useStateW(() => W_JOBS.map(jobToCard));
  const [topIdx,     setTopIdx]     = useStateW(0);
  const [drag,       setDrag]       = useStateW({ x: 0, y: 0, dragging: false, moved: false, startX: 0, startY: 0 });
  const [matchAnim,  setMatchAnim]  = useStateW(null);
  const [isSuperAnim,setIsSuperAnim]= useStateW(false);
  const [actionAnim, setActionAnim] = useStateW(null); // 'like' | 'pass' | 'super'
  const [detailJob,  setDetailJob]  = useStateW(null);
  const [kraje,      setKraje]      = useStateW(() => { try { return JSON.parse(localStorage.getItem('makej-worker-kraje') || '[]'); } catch (e) { return []; } });
  const [filterOpen, setFilterOpen] = useStateW(false);
  const userId  = useRefW(null);
  const dragRef = useRefW(drag);

  const _filterKraj = list => kraje.length ? list.filter(j => kraje.includes(j.kraj)) : list;

  useEffectW(() => { dragRef.current = drag; }, [drag]);

  useEffectW(() => {
    sb.auth.getSession().then(({ data: { session } }) => { userId.current = session?.user?.id || null; });
    setJobs(_filterKraj(W_JOBS.map(jobToCard)));
    setTopIdx(0);
  }, [tick]);

  // Filtr krajů — ulož + přefiltruj feed
  useEffectW(() => {
    try { localStorage.setItem('makej-worker-kraje', JSON.stringify(kraje)); } catch (e) {}
    setJobs(_filterKraj(W_JOBS.map(jobToCard)));
    setTopIdx(0);
  }, [kraje]);

  const toggleKraj = id => setKraje(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const currentJob   = jobs[topIdx] || null;
  const visibleCards = jobs.slice(topIdx, topIdx + 3);

  // Zaznamenat zhlédnutí, když se inzerát dostane navrch
  useEffectW(() => {
    if (currentJob && currentJob.id && typeof logJobViewW === 'function') logJobViewW(currentJob.id);
  }, [currentJob && currentJob.id]);
  const lvl          = makejLevel(W_PROFILE.xp);
  const remaining    = Math.max(0, jobs.length - topIdx);

  const snapBack = () => setDrag({ x: 0, y: 0, dragging: false, moved: false, startX: 0, startY: 0 });

  const animateFly = (dir, cb) => {
    if (dir === 'super') setDrag(d => ({ ...d, x: 0, y: -1400, dragging: false }));
    else setDrag(d => ({ ...d, x: dir === 'like' ? 1400 : -1400, y: 0, dragging: false }));
    setTimeout(() => { snapBack(); cb(); }, 380);
  };

  async function doLike(sup) {
    if (!currentJob) return;
    const job = currentJob;
    setActionAnim(sup ? 'super' : 'like');
    setTimeout(() => setActionAnim(null), 600);
    animateFly(sup ? 'super' : 'like', async () => {
      setTopIdx(i => i + 1);
      const uid = userId.current;
      if (uid) {
        await createMatchW(uid, job.id, sup);
        setIsSuperAnim(!!sup);
        setMatchAnim(job);
        setTimeout(() => setMatchAnim(null), 3000);
      }
    });
  }
  const doSuper = () => doLike(true);

  async function doPass() {
    if (!currentJob) return;
    const job = currentJob;
    setActionAnim('pass');
    setTimeout(() => setActionAnim(null), 600);
    animateFly('pass', async () => {
      setTopIdx(i => i + 1);
      const uid = userId.current;
      if (uid) await createRejectionW(uid, job.id);
    });
  }

  const onPointerDown = e => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ x: 0, y: 0, dragging: true, moved: false, startX: e.clientX, startY: e.clientY });
  };
  const onPointerMove = e => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const x = e.clientX - d.startX;
    const y = e.clientY - d.startY;
    setDrag(prev => ({ ...prev, x, y, moved: Math.abs(x) > 8 || Math.abs(y) > 8 }));
  };
  const onPointerUp = e => {
    const d = dragRef.current;
    if (!d.dragging) return;
    if      (d.y < -110 && Math.abs(d.y) > Math.abs(d.x)) doSuper();
    else if (d.x >  90) doLike(false);
    else if (d.x < -90) doPass();
    else if (!d.moved && currentJob) { snapBack(); setDetailJob(currentJob); }
    else                snapBack();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingTop: 4 }}>

      {/* Header */}
      <div style={{ padding: '12px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ color: '#0020F6', fontFamily: T.fontHead, fontSize: 28, fontWeight: 900, letterSpacing: -0.8, lineHeight: 1 }}>Makej!</div>
          <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13.5, marginTop: 4 }}>{remaining} {_wPlural(remaining, 'nabídka', 'nabídky', 'nabídek')} v okolí</div>
        </div>
        <div title={`Level ${lvl.level} · ${lvl.title}`} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px 5px 5px', borderRadius: 999, marginRight: 50,
          background: 'rgba(0,32,246,0.08)', border: '1px solid rgba(0,32,246,0.16)', flexShrink: 0,
        }}>
          <span style={{
            width: 24, height: 24, borderRadius: 999, flexShrink: 0,
            background: 'linear-gradient(135deg, #0020F6, #5B6BFF)',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 12,
          }}>{lvl.level}</span>
          <span style={{ color: T.primary, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700 }}>{lvl.title}</span>
        </div>
      </div>

      {/* Filtr krajů */}
      <div style={{ padding: '0 20px 10px', flexShrink: 0, position: 'relative' }}>
        <button onClick={() => setFilterOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999, background: kraje.length ? 'rgba(0,32,246,0.10)' : '#fff', border: '1px solid ' + (kraje.length ? 'rgba(0,32,246,0.3)' : T.border), color: kraje.length ? T.primary : T.muted, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Icon name="map-point-bold" size={15} color={kraje.length ? T.primary : T.muted} />
          {kraje.length === 0 ? 'Všechny kraje' : kraje.length === 1 ? _krajName(kraje[0]) : kraje.length + ' krajů'}
          <Icon name="alt-arrow-down-bold" size={13} color={kraje.length ? T.primary : T.muted} />
        </button>
        {filterOpen && (
          <>
            <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', top: '100%', left: 20, zIndex: 41, marginTop: 6, width: 260, maxHeight: 340, overflowY: 'auto', background: '#fff', border: '1px solid ' + T.border, borderRadius: 14, boxShadow: '0 12px 30px rgba(20,22,40,0.16)', padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px 8px' }}>
                <span style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Kde chceš pracovat</span>
                {kraje.length > 0 && <button onClick={() => setKraje([])} style={{ background: 'none', border: 'none', color: T.primary, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Vše</button>}
              </div>
              {KRAJE_W.map(k => {
                const on = kraje.includes(k.id);
                return (
                  <button key={k.id} onClick={() => toggleKraj(k.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, background: on ? 'rgba(0,32,246,0.08)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ width: 18, height: 18, borderRadius: 5, border: '1.5px solid ' + (on ? T.primary : T.border), background: on ? T.primary : '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{on && <Icon name="check-read-bold" size={12} color="#fff" />}</span>
                    <span style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13.5, fontWeight: on ? 700 : 500 }}>{k.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Card stack */}
      {visibleCards.length === 0 ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '20px 40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>{kraje.length ? '📍' : '🎉'}</div>
            <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{kraje.length ? 'Ve vybraných krajích nic není' : 'Konec zásobníku!'}</div>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.6 }}>
              {kraje.length
                ? <>V {kraje.length === 1 ? 'tomto kraji' : 'těchto krajích'} teď nejsou žádné brigády.<br />Zkus přidat další kraj ve filtru nahoře.</>
                : <>Prošel/la jsi všechny dostupné nabídky.<br />Zaměstnavatelé přidávají nové brigády každý den.</>}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', minHeight: 0 }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 420,
            height: 'min(560px, calc(100vh - 200px))',
            userSelect: 'none', touchAction: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {[...visibleCards].reverse().map((job, ri) => {
            const depth = visibleCards.length - 1 - ri;
            const isTop = depth === 0;
            return (
              <WJobCard
                key={job.id}
                job={job}
                drag={isTop ? drag : { x: 0, y: 0, dragging: false, moved: false }}
                isTop={isTop}
                depth={depth}
                onTap={() => setDetailJob(job)}
              />
            );
          })}
        </div>
        </div>
      )}

      {/* Action buttons */}
      {visibleCards.length > 0 && (
        <div style={{ padding: '14px 32px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flexShrink: 0 }}>
          <button
            onClick={doPass}
            style={{
              width: 60, height: 60, borderRadius: 999,
              background: actionAnim === 'pass' ? 'rgba(244,63,94,0.14)' : '#fff',
              border: `1px solid ${actionAnim === 'pass' ? '#f43f5e' : T.border}`,
              boxShadow: '0 6px 16px rgba(20,20,30,0.08)',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              transition: 'all .2s', outline: 'none',
            }}
          >
            <Icon name="close-circle-bold" size={28} color="#f43f5e" />
          </button>

          <button
            onClick={doSuper}
            style={{
              width: 46, height: 46, borderRadius: 999,
              background: actionAnim === 'super' ? 'rgba(245,166,35,0.18)' : '#fff',
              border: `1px solid ${actionAnim === 'super' ? T.super : T.border}`,
              boxShadow: '0 6px 16px rgba(20,20,30,0.08)',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              transition: 'all .2s', outline: 'none',
            }}
            title="Super zájem — zaměstnavatel tě uvidí přednostně"
          >
            <Icon name="star-bold" size={20} color={T.super} />
          </button>

          <button
            onClick={() => doLike(false)}
            style={{
              width: 60, height: 60, borderRadius: 999,
              background: '#141414',
              border: 'none',
              boxShadow: actionAnim === 'like' ? '0 0 0 6px rgba(20,20,20,0.12)' : '0 8px 20px rgba(20,20,30,0.28)',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              transition: 'all .2s', outline: 'none',
            }}
          >
            <Icon name="heart-bold" size={28} color="#fff" />
          </button>
        </div>
      )}

      {/* Match animation */}
      {matchAnim && (
        <div
          onClick={() => setMatchAnim(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)',
            animation: 'wPop .35s cubic-bezier(.2,.8,.2,1)',
          }}
        >
          <div style={{ textAlign: 'center', padding: '32px 40px', maxWidth: 360 }}>
            <div style={{ fontSize: 80, marginBottom: 4, lineHeight: 1 }}>{isSuperAnim ? '⭐' : '💙'}</div>
            <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 34, fontWeight: 900, letterSpacing: -1, marginTop: 8 }}>
              {isSuperAnim ? 'Super zájem odeslán!' : 'Zájem odeslán!'}
            </div>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>
              {isSuperAnim
                ? <>Zaměstnavatel uvidí tvůj profil <span style={{ color: T.super, fontWeight: 700 }}>přednostně</span>.<br />Jakmile tě přijme, otevře se chat.</>
                : <>Tvůj profil byl odeslán zaměstnavateli.<br />Jakmile tě přijme, otevře se chat.</>}
            </div>
            <div style={{
              margin: '20px auto 0',
              padding: '12px 20px',
              borderRadius: 14,
              background: 'rgba(91,107,255,0.15)',
              border: '1px solid rgba(91,107,255,0.3)',
              color: '#fff',
              fontFamily: T.fontUI,
              fontSize: 14,
            }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{matchAnim.title}</div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 3 }}>{matchAnim.company} · {matchAnim.when}</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setMatchAnim(null); }}
              style={{
                marginTop: 24, padding: '13px 36px', borderRadius: 999,
                background: '#141414',
                border: 'none', color: '#fff',
                fontFamily: T.fontHead, fontSize: 15, fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Pokračovat →
            </button>
          </div>
        </div>
      )}

      {/* Detail inzerátu */}
      {detailJob && (
        <WJobDetailModal
          job={detailJob}
          onClose={() => setDetailJob(null)}
          onLike={() => { setDetailJob(null); doLike(false); }}
          onSuper={() => { setDetailJob(null); doSuper(); }}
          onPass={() => { setDetailJob(null); doPass(); }}
        />
      )}
    </div>
  );
}

// ── Swipovací karta (light styl podle mockupu) ─────────────────
function WJobCard({ job, drag, isTop, depth = 0, onTap }) {
  const x = isTop ? drag.x : 0;
  const y = isTop ? drag.y : 0;
  const rot = isTop ? (x / 18) : 0;
  const opacity = isTop ? 1 : (1 - depth * 0.08);
  const scale = isTop ? 1 : (1 - depth * 0.04);
  const translateY = isTop ? 0 : (depth * 12);

  const likeShown = isTop && x > 40;
  const passShown = isTop && x < -40;
  const superShown = isTop && y < -60;

  const distanceTxt = job.distance != null ? String(job.distance).replace('.', ',') + ' km' : (job.location || '');
  const tags = Array.isArray(job.tags) ? job.tags : [];

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        transform: `translate(${x}px, ${y + translateY}px) rotate(${rot}deg) scale(${scale})`,
        opacity,
        transition: drag.dragging ? 'none' : 'transform .35s cubic-bezier(.2,.8,.2,1), opacity .35s',
        willChange: 'transform', zIndex: 10 - depth,
        pointerEvents: isTop ? 'auto' : 'none',
      }}
      onClick={() => isTop && !drag.moved && onTap?.()}
    >
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 30, overflow: 'hidden',
        background: '#fff', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 45px rgba(20,22,40,0.16), 0 2px 8px rgba(20,22,40,0.06)',
      }}>
        {/* Hero (vsazené modré pole) */}
        <div style={{ padding: '12px 12px 0', flex: 1, minHeight: 0, display: 'flex' }}>
          <div style={{
            position: 'relative', flex: 1, borderRadius: 22, overflow: 'hidden',
            background: `linear-gradient(150deg, ${job.accent || '#2f4bff'} 0%, #1b2df0 100%)`,
          }}>
            {/* lesk */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 78% 18%, rgba(255,255,255,0.28), transparent 55%)' }} />

            {/* logo firmy — klik otevře profil zaměstnavatele */}
            <div
              onClick={(e) => { e.stopPropagation(); if (!drag.moved && window.wOpenEmployer) window.wOpenEmployer(job.employer_id, { name: job.company, color: job.accent, rating: job.rating, verified: job.verified }); }}
              title="Zobrazit profil firmy"
              style={{
                position: 'absolute', top: 16, left: 16,
                width: 56, height: 56, borderRadius: 16, background: '#fff',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
                color: job.accent || '#2f4bff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 20,
                boxShadow: '0 6px 16px rgba(0,0,0,0.14)',
              }}>{job.logo}</div>

            {/* boost štítek */}
            {job.boosted && (
              <div style={{ position: 'absolute', top: 82, left: 16, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.95)', color: '#F5A623', fontFamily: T.fontHead, fontSize: 11, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <Icon name="bolt-bold" size={12} color="#F5A623" /> TOP
              </div>
            )}

            {/* vzdálenost */}
            {distanceTxt && (
              <div style={{
                position: 'absolute', top: 20, right: 16,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', borderRadius: 999,
                background: 'rgba(10,14,40,0.34)', backdropFilter: 'blur(6px)',
                color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600,
                maxWidth: '55%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}>
                <Icon name="map-point-bold" size={14} color="#fff" /> {distanceTxt}
              </div>
            )}

            {/* tagy dole v hero */}
            {tags.length > 0 && (
              <div style={{ position: 'absolute', left: 16, bottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 'calc(100% - 32px)' }}>
                {tags.slice(0, 3).map((t, i) => (
                  <span key={i} style={{
                    padding: '7px 15px', borderRadius: 999,
                    fontFamily: T.fontUI, fontSize: 13, fontWeight: 700,
                    background: i === 0 ? '#fff' : 'rgba(255,255,255,0.2)',
                    color: i === 0 ? '#14141b' : 'rgba(255,255,255,0.92)',
                    backdropFilter: i === 0 ? 'none' : 'blur(6px)',
                  }}>{t}</span>
                ))}
              </div>
            )}

            {/* swipe razítka */}
            <Stamp show={likeShown} angle={-12} pos={{ top: 26, left: 20 }} color="#22c55e" label="MÁM ZÁJEM" intensity={Math.min(1, x / 120)} />
            <Stamp show={passShown} angle={14} pos={{ top: 26, right: 20 }} color={T.destructive} label="PŘESKOČIT" intensity={Math.min(1, -x / 120)} />
            <Stamp show={superShown} angle={-4} pos={{ top: '38%', left: '50%', transform: 'translate(-50%,-50%)' }} color="#F5A623" label="SUPER" big intensity={Math.min(1, -y / 140)} />
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: '0 0 auto', padding: '15px 20px 20px' }}>
          {/* firma + ověřeno + rating */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.company}</span>
              {job.verified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#16a34a', flexShrink: 0 }}>
                  <Icon name="verified-check-bold" size={14} color="#16a34a" />
                  <span style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>Ověřeno</span>
                </span>
              )}
            </div>
            {job.rating > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <Icon name="star-bold" size={15} color={T.super} />
                <span style={{ color: T.ink, fontFamily: T.fontHead, fontWeight: 800, fontSize: 15 }}>{job.rating.toFixed(1).replace('.', ',')}</span>
              </span>
            )}
          </div>

          {/* název */}
          <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 26, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.12, marginBottom: 12 }}>{job.title}</div>

          {/* datum + čas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: T.muted, fontFamily: T.fontUI, fontSize: 14, marginBottom: 12 }}>
            {job.when && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="calendar-minimalistic-bold" size={15} color={T.muted} />{job.when}</span>}
            {job.time && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock-circle-bold" size={15} color={T.muted} />{job.time}</span>}
          </div>

          {/* popis */}
          {job.desc && (
            <div style={{
              color: T.inkSoft, fontFamily: T.fontUI, fontSize: 14.5, lineHeight: 1.5, marginBottom: 14,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{job.desc}</div>
          )}

          <div style={{ height: 1, background: T.border, margin: '0 0 14px' }} />

          {/* cena */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ color: T.ink, fontFamily: T.fontHead, fontWeight: 800, fontSize: 34, letterSpacing: -1 }}>{job.pay}</span>
              <span style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 15 }}>{job.payUnit}</span>
            </div>
            {job.shiftTotal > 0 && (
              <span style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13.5 }}>≈ {job.shiftTotal.toLocaleString('cs-CZ').replace(/,/g, ' ')} Kč / směna</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail inzerátu (reálná data od zaměstnavatele) ────────────
function WJobDetailModal({ job, onClose, onLike, onSuper, onPass, readOnly, statusLabel, onChat, onCancel }) {
  const JOB_TYPE_LABEL = {
    jednrazova_vypomoc: 'Jednorázová výpomoc',
    brigada: 'Brigáda', part_time: 'Part-time', full_time: 'Full-time',
  };
  const row = (icon, label, value) => value ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid ' + T.border }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(91,107,255,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={15} color="#8AB4FF" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
        <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13.5, fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  ) : null;

  const sectionTitle = txt => (
    <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, margin: '18px 0 8px' }}>{txt}</div>
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 120,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      animation: 'wPop .28s cubic-bezier(.2,.8,.2,1)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440, maxHeight: '88vh',
        background: T.card, borderRadius: 24,
        border: '1px solid ' + T.border,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(20,22,40,0.28)',
      }}>
        {/* Hero */}
        <div style={{
          position: 'relative', flexShrink: 0, padding: '20px 22px 18px',
          background: `linear-gradient(155deg, ${job.accent} 0%, ${T.primaryDeep || '#141436'} 90%)`,
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 999,
            background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', cursor: 'pointer',
            display: 'grid', placeItems: 'center', fontSize: 16,
          }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div
              onClick={() => window.wOpenEmployer && window.wOpenEmployer(job.employer_id, { name: job.company, color: job.accent, rating: job.rating, verified: job.verified })}
              title="Zobrazit profil firmy"
              style={{
                width: 48, height: 48, borderRadius: 13, background: 'rgba(255,255,255,0.95)',
                color: job.accent, display: 'grid', placeItems: 'center', cursor: 'pointer',
                fontFamily: T.fontHead, fontWeight: 800, fontSize: 18, flexShrink: 0,
              }}>{job.logo}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <button
                onClick={() => window.wOpenEmployer && window.wOpenEmployer(job.employer_id, { name: job.company, color: job.accent, rating: job.rating, verified: job.verified })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontFamily: T.fontUI, fontSize: 13, fontWeight: 600 }}>{job.company}</span>
                {job.rating > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#FFD166' }}>
                    <Icon name="star-bold" size={11} color="#FFD166" />
                    <span style={{ fontFamily: T.fontMono, fontWeight: 700, fontSize: 11 }}>{job.rating.toFixed(1)}</span>
                  </span>
                )}
                {job.verified && <Icon name="verified-check-bold" size={13} color="#cdd4ff" />}
                <Icon name="alt-arrow-right-bold" size={12} color="rgba(255,255,255,0.6)" />
              </button>
              <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, letterSpacing: -0.4, marginTop: 2 }}>{job.title}</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, color: '#fff' }}>
            <span style={{ fontFamily: T.fontMono, fontWeight: 700, fontSize: 30, letterSpacing: -1 }}>{job.pay}</span>
            <span style={{ fontFamily: T.fontUI, fontSize: 13, opacity: 0.9 }}>{job.payUnit}</span>
            {job.tips && <span style={{ marginLeft: 8, fontSize: 11, color: '#fff', background: 'rgba(255,255,255,0.18)', padding: '3px 9px', borderRadius: 999 }}>+ spropitné</span>}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 22px 20px' }}>
          {row('case-round-bold', 'Typ úvazku', JOB_TYPE_LABEL[job.jobType] || 'Brigáda')}
          {row('calendar-bold', 'Datum', job.when || job.date)}
          {row('clock-circle-bold', 'Čas', job.time)}
          {row('map-point-bold', 'Místo', job.location)}
          {job.positions > 1 && row('users-group-rounded-bold', 'Volných míst', job.positions)}
          {row('hanger-2-bold', 'Dress code', job.dressCode)}

          {job.desc && (<>
            {sectionTitle('Popis brigády')}
            <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{job.desc}</div>
          </>)}

          {job.requirements && job.requirements.length > 0 && (<>
            {sectionTitle('Co budeš potřebovat')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {job.requirements.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: T.light, fontFamily: T.fontUI, fontSize: 13 }}>
                  <Icon name="check-circle-bold" size={15} color="#5BD68A" /> <span>{r}</span>
                </div>
              ))}
            </div>
          </>)}

          {job.benefits && job.benefits.length > 0 && (<>
            {sectionTitle('Co nabízíme')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {job.benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: T.light, fontFamily: T.fontUI, fontSize: 13 }}>
                  <Icon name="star-bold" size={15} color={T.super} /> <span>{b}</span>
                </div>
              ))}
            </div>
          </>)}

          {job.contactNote && (<>
            {sectionTitle('Kam dorazit / kontakt')}
            <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{job.contactNote}</div>
          </>)}

          {job.tags && job.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 18 }}>
              {job.tags.map(t => (
                <span key={t} style={{ padding: '6px 11px', borderRadius: 999, background: 'rgba(208,208,255,0.08)', border: '1px solid rgba(208,208,255,0.12)', color: T.light, fontSize: 11, fontWeight: 600, fontFamily: T.fontUI }}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {readOnly ? (
          <div style={{ flexShrink: 0, padding: '12px 22px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid ' + T.border, background: T.card }}>
            {statusLabel && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: T.light, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, marginBottom: onChat ? 12 : 0 }}>
                <Icon name="check-circle-bold" size={16} color="#5BD68A" /> {statusLabel}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{
                flex: '0 0 auto', borderRadius: 12, padding: '13px 22px',
                background: 'rgba(18,18,26,0.05)', border: '1px solid ' + T.border,
                color: T.light, fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, cursor: 'pointer',
              }}>Zavřít</button>
              {onChat && (
                <button onClick={onChat} style={{
                  flex: 1, borderRadius: 12, padding: '13px 0',
                  background: '#141414', border: 'none',
                  color: '#fff', fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}><Icon name="chat-round-bold" size={17} color="#fff" /> Otevřít chat</button>
              )}
            </div>
            {onCancel && (
              <button onClick={onCancel} style={{
                width: '100%', marginTop: 10, borderRadius: 12, padding: '11px 0',
                background: 'none', border: 'none',
                color: '#f43f5e', fontFamily: T.fontHead, fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}><Icon name="close-circle-bold" size={15} color="#f43f5e" /> Zrušit směnu</button>
            )}
          </div>
        ) : (
        <div style={{ flexShrink: 0, padding: '12px 22px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid ' + T.border, display: 'flex', gap: 10, background: T.card }}>
          <button onClick={onPass} style={{
            width: 52, flexShrink: 0, borderRadius: 12, padding: '13px 0',
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.28)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}><Icon name="close-circle-bold" size={22} color="#f43f5e" /></button>
          <button onClick={onSuper} style={{
            width: 52, flexShrink: 0, borderRadius: 12, padding: '13px 0',
            background: 'rgba(255,209,102,0.08)', border: '1px solid rgba(255,209,102,0.3)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }} title="Super zájem"><Icon name="star-bold" size={20} color={T.super} /></button>
          <button onClick={onLike} style={{
            flex: 1, borderRadius: 12, padding: '13px 0',
            background: '#141414', border: 'none',
            color: '#fff', fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}><Icon name="heart-bold" size={17} color="#fff" /> Mám zájem</button>
        </div>
        )}
      </div>
    </div>
  );
}
