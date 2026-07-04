// Makej Worker — Root app component

// Relativní čas pro upozornění
function _wRelTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'teď';
  if (s < 3600) return `před ${Math.floor(s / 60)} min`;
  if (s < 86400) return `před ${Math.floor(s / 3600)} h`;
  return new Date(ts).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
}

// Vizuální styl podle typu upozornění
const W_NOTIF_STYLE = {
  review:  { accent: '#F5A623', iconName: 'star-bold',        iconBg: 'rgba(245,166,35,0.14)' },
  success: { accent: '#16a34a', iconName: 'heart-bold',       iconBg: 'rgba(22,163,74,0.12)' },
  match:   { accent: '#16a34a', iconName: 'heart-bold',       iconBg: 'rgba(22,163,74,0.12)' },
  shift:   { accent: '#0020F6', iconName: 'calendar-bold',    iconBg: 'rgba(0,32,246,0.1)' },
  message: { accent: '#0020F6', iconName: 'chat-round-bold',  iconBg: 'rgba(0,32,246,0.1)' },
  info:    { accent: '#0020F6', iconName: 'bell-bold',        iconBg: 'rgba(0,32,246,0.1)' },
};

function WToast({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', top: 66, right: 16,
      zIndex: 9000, display: 'flex', flexDirection: 'column', gap: 10,
      width: 'min(360px, calc(100vw - 32px))',
    }}>
      {toasts.map(t => {
        const st = W_NOTIF_STYLE[t.type] || W_NOTIF_STYLE.info;
        return (
          <div key={t.id} style={{
            position: 'relative', background: '#fff',
            border: '1px solid ' + T.border, borderLeft: '4px solid ' + (t.accent || st.accent),
            borderRadius: 16, padding: '14px 16px',
            boxShadow: '0 12px 30px rgba(20,22,40,0.14)',
            animation: 'wPop .3s cubic-bezier(.2,.8,.2,1)',
          }}>
            <button onClick={() => onRemove(t.id)} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: T.mutedSoft, cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>✕</button>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {t.avatar
                ? <div style={{ width: 44, height: 44, borderRadius: 12, background: t.avatar.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{t.avatar.initials}</div>
                : <div style={{ width: 44, height: 44, borderRadius: 12, background: st.iconBg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={st.iconName} size={20} color={t.accent || st.accent} /></div>}
              <div style={{ flex: 1, minWidth: 0, paddingRight: 14 }}>
                <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 14.5, fontWeight: 800 }}>{t.title}</div>
                {t.text && <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13, marginTop: 2, lineHeight: 1.45 }}>{t.text}</div>}
                {t.action && (
                  <button onClick={() => { t.action.onClick(); onRemove(t.id); }} style={{
                    marginTop: 11, padding: '10px 18px', borderRadius: 11,
                    background: t.action.dark ? '#141414' : T.primary, border: 'none', color: '#fff',
                    fontFamily: T.fontHead, fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
                  }}>{t.action.label}</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Profil zaměstnavatele (pohled brigádníka) ──────────────────
function WEmployerModal({ employerId, fallback, onClose }) {
  const [p, setP]         = useStateW(fallback || null);
  const [reviews, setRev] = useStateW(null);   // null = načítá se
  const [loading, setL]   = useStateW(true);

  useEffectW(() => {
    let alive = true;
    (async () => {
      const [pRes, rRes] = await Promise.all([
        sb.from('profiles').select('*').eq('id', employerId).single(),
        sb.from('reviews').select('*, reviewer:profiles!reviews_reviewer_id_fkey(name)').eq('reviewed_id', employerId).order('created_at', { ascending: false }),
      ]);
      if (!alive) return;
      if (pRes.data) setP(pRes.data);
      setRev(rRes.data || []);
      setL(false);
    })();
    return () => { alive = false; };
  }, [employerId]);

  const name    = (p && (p.company_name || p.name)) || (fallback && fallback.name) || 'Zaměstnavatel';
  const initials = name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??';
  const accent  = (fallback && fallback.color) || _wColor(employerId || name);
  const rating  = Number((p && p.rating) || (fallback && fallback.rating) || 0);
  const verified = !!(p ? p.verified : (fallback && fallback.verified));
  const bio     = (p && p.bio) || '';
  const industry = (p && p.industry) || '';
  const address = (p && p.address) || '';
  const website = (p && p.website) || '';

  const infoRow = (icon, value) => value ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid ' + T.border }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,32,246,0.08)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={15} color={T.primary} />
      </div>
      <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13.5, fontWeight: 600, wordBreak: 'break-word' }}>{value}</div>
    </div>
  ) : null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'wPop .28s cubic-bezier(.2,.8,.2,1)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440, maxHeight: '88vh',
        background: T.card, borderRadius: 24, border: '1px solid ' + T.border,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(20,22,40,0.28)',
      }}>
        {/* Hero */}
        <div style={{ position: 'relative', flexShrink: 0, padding: '22px', background: `linear-gradient(150deg, ${accent} 0%, #1b2df0 100%)` }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 999, background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 16 }}>✕</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 17, background: '#fff', color: accent, display: 'grid', placeItems: 'center', fontFamily: T.fontHead, fontWeight: 800, fontSize: 22, flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{name}</span>
                {verified && <Icon name="verified-check-bold" size={15} color="#cdd4ff" />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontFamily: T.fontUI, fontSize: 13 }}>Zaměstnavatel</span>
                {rating > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Icon name="star-bold" size={12} color="#FFD166" />
                    <span style={{ color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 13 }}>{rating.toFixed(1).replace('.', ',')}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 22px 20px' }}>
          {infoRow('buildings-2-bold', industry)}
          {infoRow('map-point-bold', address)}
          {infoRow('global-linear', website)}

          {bio && (<>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, margin: '18px 0 8px' }}>O firmě</div>
            <div style={{ color: T.inkSoft, fontFamily: T.fontUI, fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{bio}</div>
          </>)}

          <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, margin: '18px 0 8px' }}>
            Recenze{reviews && reviews.length > 0 ? ` · ${reviews.length}` : ''}
          </div>
          {loading ? (
            <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 13 }}>Načítám…</div>
          ) : (!reviews || reviews.length === 0) ? (
            <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12.5, lineHeight: 1.5 }}>Tahle firma zatím nemá žádné recenze.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reviews.map(r => {
                const author = r.reviewer?.name || 'Brigádník';
                const av = author.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??';
                return (
                  <div key={r.id} style={{ padding: '12px 14px', borderRadius: 12, background: '#fff', border: '1px solid ' + T.border, boxShadow: '0 2px 8px rgba(20,22,40,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: r.text ? 7 : 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: _wColor(r.reviewer_id || r.id), display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{av}</div>
                      <div style={{ flex: 1, minWidth: 0, color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{author}</div>
                      <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                        {[1, 2, 3, 4, 5].map(n => <Icon key={n} name="star-bold" size={12} color={n <= r.rating ? T.super : 'rgba(18,18,26,0.14)'} />)}
                      </div>
                    </div>
                    {r.text && <div style={{ color: T.inkSoft, fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.5 }}>„{r.text}"</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0, padding: '12px 22px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid ' + T.border, background: T.card }}>
          <button onClick={onClose} style={{ width: '100%', borderRadius: 12, padding: '13px 0', background: 'rgba(18,18,26,0.05)', border: '1px solid ' + T.border, color: T.ink, fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>Zavřít</button>
        </div>
      </div>
    </div>
  );
}

function WorkerApp() {
  const [tab,    setTab]    = useStateW('swipe');
  const [loaded, setLoaded] = useStateW(false);
  const [tick,   setTick]   = useStateW(0);
  const [toasts, setToasts] = useStateW([]);
  const [notifs, setNotifs] = useStateW([]);      // upozornění pro zvoneček
  const [bellOpen, setBellOpen] = useStateW(false);
  const [chatTarget, setChatTarget] = useStateW(null);
  const [employerTarget, setEmployerTarget] = useStateW(null);
  const userId = useRefW(null);
  const tabRef = useRefW(tab);
  useEffectW(() => { tabRef.current = tab; }, [tab]);

  // Bridge: otevři chat s daným matchem (z detailu brigády)
  function openChat(matchId) {
    setChatTarget(matchId);
    setTab('messages');
  }
  if (typeof window !== 'undefined') {
    window.wOpenChat = openChat;
    window.wOpenEmployer = (employerId, fallback) => { if (employerId) setEmployerTarget({ employerId, fallback }); };
  }

  // Uživatel může upozornění vypnout v profilu (Nastavení)
  function notifsEnabled() {
    try { return localStorage.getItem('makej-notifs') !== 'off'; } catch (e) { return true; }
  }

  // Toast (objekt: { title, text, type, accent, avatar, action, ttl })
  function addToast(opts) {
    if (!notifsEnabled()) return;
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...opts }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), opts.ttl || 6000);
  }

  // Upozornění do zvonečku (přežije, dokud je appka otevřená)
  function addNotif(n) {
    if (!notifsEnabled()) return;
    const id = Date.now() + Math.random();
    setNotifs(prev => [{ id, ts: Date.now(), read: false, ...n }, ...prev].slice(0, 40));
  }
  const unreadNotifs = notifs.filter(n => !n.read).length;

  useEffectW(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      userId.current = session.user.id;
      fetchWorkerData(session.user.id).then(() => {
        setLoaded(true);
        setTick(1);
        // Výzva k hodnocení dokončených brigád
        const toReview = W_HISTORY.filter(h => h.needsReview).length;
        if (toReview > 0) {
          const text = `Máš ${toReview} ${toReview === 1 ? 'dokončenou brigádu' : 'dokončené brigády'} k ohodnocení.`;
          addNotif({ type: 'review', title: 'Ohodnoť své brigády', text, kind: 'review' });
          setTimeout(() => addToast({
            type: 'review', title: 'Ohodnoť své brigády', text,
            action: { label: 'Otevřít Moje brigády', onClick: () => setTab('history') },
          }), 900);
        }
      });
    });
  }, []);

  async function refreshWorker() {
    if (!userId.current) return;
    await fetchWorkerData(userId.current);
    setTick(t => t + 1);
  }

  // Realtime: refresh when new jobs or matches appear
  useEffectW(() => {
    if (!loaded || !userId.current) return;
    const id = userId.current;

    const channel = sb.channel('w-rt-' + id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'matches',
        filter: 'worker_id=eq.' + id,
      }, async (payload) => {
        const wasAccepted = payload.new?.status === 'accepted' && payload.old?.status !== 'accepted';
        await fetchWorkerData(id);
        setTick(t => t + 1);
        if (wasAccepted) {
          const thread = W_THREADS.find(t => t.id === payload.new.id);
          const company = thread?.name || 'Zaměstnavatel';
          const mid     = payload.new.id;
          const avatar  = thread ? { initials: thread.avatar, color: thread.color } : null;
          addNotif({ type: 'match', title: 'Máte shodu! 🎉', text: `${company} má zájem o tvůj profil. Napiš jim!`, avatar, kind: 'chat', matchId: mid });
          addToast({ type: 'match', title: 'Máte shodu! 🎉', text: `${company} má zájem o tvůj profil. Napiš jim!`, avatar,
            action: { label: 'Napsat zprávu', dark: true, onClick: () => openChat(mid) } });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, async () => {
        await fetchWorkerData(id);
        setTick(t => t + 1);
      })
      .subscribe();

    return () => { try { sb.removeChannel(channel); } catch (e) {} };
  }, [loaded]);

  // Realtime: příchozí zprávy → upozornění (zvoneček + toast)
  useEffectW(() => {
    if (!loaded || !userId.current) return;
    const id = userId.current;

    const chan = sb.channel('w-notif-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const msg = payload.new;
        if (!msg || msg.sender_id === id) return;                 // vlastní zprávy ignoruj
        const thread = W_THREADS.find(t => t.id === msg.match_id);
        if (!thread) return;                                       // není to můj chat
        const company = thread.name || 'Zaměstnavatel';
        const avatar  = { initials: thread.avatar, color: thread.color };
        const isShift = msg.type === 'shift_offer';
        const title   = isShift ? 'Nová nabídka směny' : company;
        const text    = isShift ? `${company} ti nabídl/a směnu. Otevři chat.` : msg.text;
        addNotif({ type: isShift ? 'shift' : 'message', title, text, avatar: isShift ? null : avatar, kind: 'chat', matchId: msg.match_id });
        // aktualizuj náhledy v seznamu konverzací
        fetchWorkerData(id).then(() => setTick(t => t + 1));
        // toast jen když nejsem zrovna ve Zprávách
        if (tabRef.current !== 'messages') {
          addToast({ type: isShift ? 'shift' : 'message', title, text, avatar: isShift ? null : avatar,
            action: { label: isShift ? 'Zobrazit směnu' : 'Napsat zprávu', onClick: () => openChat(msg.match_id) } });
        }
      })
      .subscribe();

    return () => { try { sb.removeChannel(chan); } catch (e) {} };
  }, [loaded]);

  async function handleSignOut() {
    await sb.auth.signOut();
    window.location.href = '/';
  }

  const unreadMessages = W_THREADS.reduce((s, t) => s + (t.unread || 0), 0);
  const reviewsToDo    = W_HISTORY.filter(h => h.needsReview).length;

  const NAV = [
    { id: 'swipe',    label: 'Práce',    icon: 'case-round-bold' },
    { id: 'history',  label: 'Brigády',  icon: 'checklist-minimalistic-bold', badge: reviewsToDo },
    { id: 'messages', label: 'Zprávy',   icon: 'chat-round-bold', badge: unreadMessages },
    { id: 'profile',  label: 'Profil',   icon: 'user-bold' },
  ];

  let body;
  if (!loaded) {
    body = (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 999,
            border: '3px solid rgba(0,32,246,0.18)', borderTopColor: '#5B6BFF',
            animation: 'empSpin .75s linear infinite', margin: '0 auto',
          }} />
          <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13, marginTop: 14 }}>Načítám brigády…</div>
        </div>
      </div>
    );
  } else if (tab === 'swipe') {
    body = <WSwipe tick={tick} />;
  } else if (tab === 'history') {
    body = <WHistory tick={tick} onReviewed={refreshWorker} />;
  } else if (tab === 'messages') {
    body = <WMessages tick={tick} chatTarget={chatTarget} onChatOpened={() => setChatTarget(null)} />;
  } else if (tab === 'profile') {
    body = <WProfile tick={tick} onSignOut={handleSignOut} />;
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100%',
      background: T.bg,
      position: 'relative',
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.25,
        backgroundImage: 'radial-gradient(rgba(91,107,255,0.1) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
      <div style={{
        position: 'absolute', top: -200, left: -160, width: 500, height: 500, borderRadius: 999,
        background: 'radial-gradient(circle, rgba(0,32,246,0.2), transparent 60%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
        {body}
      </div>

      {/* Zvoneček upozornění */}
      {loaded && (
        <div style={{ position: 'fixed', top: 14, right: 16, zIndex: 8500 }}>
          <button
            onClick={() => { setBellOpen(o => !o); if (!bellOpen) setNotifs(prev => prev.map(n => ({ ...n, read: true }))); }}
            style={{
              width: 42, height: 42, borderRadius: 999, position: 'relative',
              background: '#fff', border: '1px solid ' + T.border, cursor: 'pointer',
              display: 'grid', placeItems: 'center', boxShadow: '0 6px 16px rgba(20,22,40,0.12)',
            }}>
            <Icon name="bell-bold" size={19} color={T.ink} />
            {unreadNotifs > 0 && (
              <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999, background: T.destructive, color: '#fff', fontSize: 10, fontWeight: 800, fontFamily: T.fontUI, display: 'grid', placeItems: 'center', border: '2px solid #fff' }}>{unreadNotifs}</span>
            )}
          </button>

          {bellOpen && (<>
            <div onClick={() => setBellOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: -1 }} />
            <div style={{
              position: 'absolute', top: 50, right: 0, width: 'min(360px, calc(100vw - 32px))',
              maxHeight: '70vh', overflowY: 'auto',
              background: '#fff', border: '1px solid ' + T.border, borderRadius: 18,
              boxShadow: '0 24px 50px rgba(20,22,40,0.2)', animation: 'wPop .22s cubic-bezier(.2,.8,.2,1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid ' + T.border }}>
                <span style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 16, fontWeight: 800 }}>Upozornění</span>
                {notifs.length > 0 && <button onClick={() => setNotifs([])} style={{ background: 'none', border: 'none', color: T.muted, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Vymazat</button>}
              </div>
              {notifs.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🔔</div>
                  <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13 }}>Zatím žádná upozornění.</div>
                </div>
              ) : (
                <div style={{ padding: '8px' }}>
                  {notifs.map(n => {
                    const st = W_NOTIF_STYLE[n.type] || W_NOTIF_STYLE.info;
                    return (
                      <button key={n.id}
                        onClick={() => { setBellOpen(false); if (n.kind === 'chat' && n.matchId) openChat(n.matchId); else if (n.kind === 'review') setTab('history'); }}
                        style={{ width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', gap: 11, alignItems: 'flex-start', padding: '11px 12px', borderRadius: 12, background: 'transparent', border: 'none' }}>
                        {n.avatar
                          ? <div style={{ width: 40, height: 40, borderRadius: 11, background: n.avatar.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{n.avatar.initials}</div>
                          : <div style={{ width: 40, height: 40, borderRadius: 11, background: st.iconBg, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={st.iconName} size={18} color={st.accent} /></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 13.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                          {n.text && <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 12.5, marginTop: 1, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.text}</div>}
                          <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 11, marginTop: 3 }}>{_wRelTime(n.ts)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>)}
        </div>
      )}

      <WToast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      {employerTarget && (
        <WEmployerModal
          employerId={employerTarget.employerId}
          fallback={employerTarget.fallback}
          onClose={() => setEmployerTarget(null)}
        />
      )}

      {/* Bottom navigation */}
      {loaded && (
        <nav style={{
          display: 'flex', alignItems: 'center',
          padding: '8px 16px calc(8px + env(safe-area-inset-bottom))',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid ' + T.border,
          flexShrink: 0,
          position: 'relative', zIndex: 10,
        }}>
          {NAV.map(n => {
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 0', border: 'none', background: 'transparent',
                  cursor: 'pointer', position: 'relative',
                }}>
                <div style={{ position: 'relative' }}>
                  <Icon
                    name={n.icon}
                    size={22}
                    color={active ? T.ink : T.mutedSoft}
                  />
                  {n.badge > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -6,
                      minWidth: 16, height: 16, padding: '0 4px',
                      borderRadius: 999, background: T.primary,
                      color: '#fff', fontSize: 9, fontWeight: 800,
                      fontFamily: T.fontUI, display: 'grid', placeItems: 'center',
                    }}>{n.badge}</span>
                  )}
                </div>
                <span style={{
                  color: active ? T.ink : T.mutedSoft,
                  fontFamily: T.fontUI, fontSize: 10, fontWeight: active ? 700 : 500,
                }}>{n.label}</span>
                {active && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                    width: 20, height: 2, borderRadius: 999,
                    background: 'linear-gradient(90deg, #0020F6, #5B6BFF)',
                  }} />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<WorkerApp />);
