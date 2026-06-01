// Makej Worker — Root app component

function WToast({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9000, display: 'flex', flexDirection: 'column', gap: 8,
      width: 'min(340px, calc(100vw - 24px))', pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'rgba(16,16,42,0.97)',
          border: '1px solid ' + (t.type === 'success' ? 'rgba(91,214,138,0.5)' : 'rgba(91,107,255,0.45)'),
          borderRadius: 16, padding: '12px 14px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'wPop .3s cubic-bezier(.2,.8,.2,1)',
          pointerEvents: 'auto',
        }}>
          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{t.icon}</span>
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

function WorkerApp() {
  const [tab,    setTab]    = useStateW('swipe');
  const [loaded, setLoaded] = useStateW(false);
  const [tick,   setTick]   = useStateW(0);
  const [toasts, setToasts] = useStateW([]);
  const userId = useRefW(null);

  function addToast(title, text, icon = '🔔', type = 'info') {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, text, icon, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }

  useEffectW(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      userId.current = session.user.id;
      fetchWorkerData(session.user.id).then(() => {
        setLoaded(true);
        setTick(1);
      });
    });
  }, []);

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
          const job     = thread?.role || 'brigádu';
          addToast('Přijat/a!', `${company} tě přijal/a na pozici: ${job}. Otevři Zprávy a napiš jim!`, '🎉', 'success');
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, async () => {
        await fetchWorkerData(id);
        setTick(t => t + 1);
      })
      .subscribe();

    return () => { try { sb.removeChannel(channel); } catch (e) {} };
  }, [loaded]);

  async function handleSignOut() {
    await sb.auth.signOut();
    window.location.href = '/';
  }

  const unreadMessages = W_THREADS.reduce((s, t) => s + (t.unread || 0), 0);

  const NAV = [
    { id: 'swipe',    label: 'Práce',   icon: 'case-round-bold' },
    { id: 'messages', label: 'Zprávy',  icon: 'chat-round-bold', badge: unreadMessages },
    { id: 'profile',  label: 'Profil',  icon: 'user-bold' },
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
  } else if (tab === 'messages') {
    body = <WMessages tick={tick} />;
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

      <WToast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Bottom navigation */}
      {loaded && (
        <nav style={{
          display: 'flex', alignItems: 'center',
          padding: '8px 16px calc(8px + env(safe-area-inset-bottom))',
          background: 'rgba(10,10,30,0.95)',
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
                    color={active ? '#fff' : T.mutedSoft}
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
                  color: active ? '#fff' : T.mutedSoft,
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
