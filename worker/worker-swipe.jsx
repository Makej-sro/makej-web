// Makej Worker — Swipe UI

function WSwipe({ tick }) {
  const [jobs,       setJobs]       = useStateW(() => W_JOBS.map(jobToCard));
  const [topIdx,     setTopIdx]     = useStateW(0);
  const [drag,       setDrag]       = useStateW({ x: 0, y: 0, dragging: false, moved: false, startX: 0, startY: 0 });
  const [matchAnim,  setMatchAnim]  = useStateW(null);
  const [actionAnim, setActionAnim] = useStateW(null); // 'like' | 'pass'
  const userId  = useRefW(null);
  const dragRef = useRefW(drag);

  useEffectW(() => { dragRef.current = drag; }, [drag]);

  useEffectW(() => {
    sb.auth.getSession().then(({ data: { session } }) => { userId.current = session?.user?.id || null; });
    setJobs(W_JOBS.map(jobToCard));
    setTopIdx(0);
  }, [tick]);

  const currentJob   = jobs[topIdx] || null;
  const visibleCards = jobs.slice(topIdx, topIdx + 3);

  const snapBack = () => setDrag({ x: 0, y: 0, dragging: false, moved: false, startX: 0, startY: 0 });

  const animateFly = (dir, cb) => {
    const targetX = dir === 'like' ? 1400 : -1400;
    setDrag(d => ({ ...d, x: targetX, y: 0, dragging: false }));
    setTimeout(() => { snapBack(); cb(); }, 380);
  };

  async function doLike() {
    if (!currentJob) return;
    setActionAnim('like');
    setTimeout(() => setActionAnim(null), 600);
    animateFly('like', async () => {
      setTopIdx(i => i + 1);
      const uid = userId.current;
      if (uid) {
        await createMatchW(uid, currentJob.id);
        setMatchAnim(currentJob);
        setTimeout(() => setMatchAnim(null), 3000);
      }
    });
  }

  async function doPass() {
    if (!currentJob) return;
    setActionAnim('pass');
    setTimeout(() => setActionAnim(null), 600);
    animateFly('pass', async () => {
      setTopIdx(i => i + 1);
      const uid = userId.current;
      if (uid) await createRejectionW(uid, currentJob.id);
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
    if      (d.x >  90) doLike();
    else if (d.x < -90) doPass();
    else                snapBack();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingTop: 4 }}>

      {/* Header */}
      <div style={{ padding: '8px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Brigády</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.muted, fontFamily: T.fontMono, fontSize: 12 }}>
          <Icon name="layers-minimalistic-bold" size={14} color={T.mutedSoft} />
          {Math.max(0, jobs.length - topIdx)} nabídek
        </div>
      </div>

      {/* Card stack */}
      {visibleCards.length === 0 ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '20px 40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
            <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Konec zásobníku!</div>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.6 }}>
              Prošel/la jsi všechny dostupné nabídky.<br />Zaměstnavatelé přidávají nové brigády každý den.
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{ flex: 1, position: 'relative', margin: '0 16px', userSelect: 'none', touchAction: 'none', minHeight: 0 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {[...visibleCards].reverse().map((job, ri) => {
            const depth = visibleCards.length - 1 - ri;
            const isTop = depth === 0;
            return (
              <JobCard
                key={job.id}
                job={job}
                drag={isTop ? drag : { x: 0, y: 0, dragging: false, moved: false }}
                isTop={isTop}
                depth={depth}
              />
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      {visibleCards.length > 0 && (
        <div style={{ padding: '14px 32px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flexShrink: 0 }}>
          <button
            onClick={doPass}
            style={{
              width: 60, height: 60, borderRadius: 999,
              background: actionAnim === 'pass' ? 'rgba(244,63,94,0.28)' : 'rgba(244,63,94,0.06)',
              border: `2px solid ${actionAnim === 'pass' ? '#f43f5e' : 'rgba(244,63,94,0.25)'}`,
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              transition: 'all .2s', outline: 'none',
            }}
          >
            <Icon name="close-circle-bold" size={28} color="#f43f5e" />
          </button>

          <button
            onClick={() => {}}
            style={{
              width: 46, height: 46, borderRadius: 999,
              background: 'rgba(255,209,102,0.06)',
              border: '2px solid rgba(255,209,102,0.25)',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              transition: 'all .2s', outline: 'none',
            }}
            title="Super zájem"
          >
            <Icon name="star-bold" size={20} color={T.super} />
          </button>

          <button
            onClick={doLike}
            style={{
              width: 60, height: 60, borderRadius: 999,
              background: actionAnim === 'like' ? 'rgba(91,214,138,0.28)' : 'rgba(91,214,138,0.06)',
              border: `2px solid ${actionAnim === 'like' ? '#5BD68A' : 'rgba(91,214,138,0.25)'}`,
              display: 'grid', placeItems: 'center', cursor: 'pointer',
              transition: 'all .2s', outline: 'none',
            }}
          >
            <Icon name="heart-bold" size={28} color="#5BD68A" />
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
            <div style={{ fontSize: 80, marginBottom: 4, lineHeight: 1 }}>💙</div>
            <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 34, fontWeight: 900, letterSpacing: -1, marginTop: 8 }}>Zájem odeslán!</div>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>
              Tvůj profil byl odeslán zaměstnavateli.<br />Jakmile tě přijme, otevře se chat.
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
                background: 'linear-gradient(135deg, #0020F6, #3a3a99)',
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
    </div>
  );
}
