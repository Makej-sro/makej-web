// Makej Worker — Messages (chat)

function WMessages({ tick }) {
  const [threads,  setThreads]  = useStateW(() => [...W_THREADS]);
  const [active,   setActive]   = useStateW(() => W_THREADS[0]?.id || null);
  const [msgInput, setMsgInput] = useStateW('');
  const [sending,  setSending]  = useStateW(false);
  const scrollRef = useRefW(null);
  const userId    = useRefW(null);
  const activeRef = useRefW(active);

  useEffectW(() => { activeRef.current = active; }, [active]);

  // Sync threads when tick changes (new data loaded)
  useEffectW(() => {
    setThreads([...W_THREADS]);
    if (W_THREADS.length > 0 && !active) setActive(W_THREADS[0].id);
  }, [tick]);

  useEffectW(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      userId.current = session?.user?.id || null;
    });
  }, []);

  // Auto-scroll
  useEffectW(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active, threads]);

  // Global subscription — sidebar preview updates
  useEffectW(() => {
    const chan = sb.channel('w-msgs-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        const preview = msg.type === 'shift_offer' ? '📅 Nabídka směny' : msg.text;
        setThreads(prev => prev.map(t => {
          if (t.id !== msg.match_id) return t;
          const isMine = msg.sender_id === userId.current;
          if (t.id === activeRef.current) return { ...t, last: preview };
          return { ...t, last: preview, unread: isMine ? t.unread : (t.unread || 0) + 1 };
        }));
      })
      .subscribe();
    return () => { try { sb.removeChannel(chan); } catch (e) {} };
  }, []);

  // Per-thread subscription for active thread
  useEffectW(() => {
    if (!active) return;
    const chan = sb.channel('w-thread-' + active)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: 'match_id=eq.' + active,
      }, (payload) => {
        const msg = payload.new;
        setThreads(prev => prev.map(t => {
          if (t.id !== active) return t;
          if (t.msgs.some(m => m.id === msg.id)) return t;
          const isShift = msg.type === 'shift_offer' && msg.metadata;
          const newMsg = isShift
            ? { from: msg.sender_id === userId.current ? 'me' : 'them', kind: 'shift', shift: msg.metadata, t: _wFmtTime(msg.created_at), id: msg.id }
            : { from: msg.sender_id === userId.current ? 'me' : 'them', text: msg.text, t: _wFmtTime(msg.created_at), id: msg.id };
          return {
            ...t,
            last: isShift ? '📅 Nabídka směny' : msg.text,
            msgs: [...t.msgs, newMsg],
          };
        }));
      })
      .subscribe();
    return () => { try { sb.removeChannel(chan); } catch (e) {} };
  }, [active]);

  async function handleSend() {
    const text = msgInput.trim();
    if (!text || !active || !userId.current || sending) return;
    setMsgInput('');
    setSending(true);
    const tempId = 'tmp-' + Date.now();
    setThreads(prev => prev.map(t => t.id !== active ? t : {
      ...t, last: text,
      msgs: [...t.msgs, { from: 'me', text, t: _wFmtTime(new Date().toISOString()), id: tempId }],
    }));
    const { data } = await sb.from('messages').insert({
      match_id: active, sender_id: userId.current, text,
    }).select().single();
    if (data) {
      setThreads(prev => prev.map(t => t.id !== active ? t : {
        ...t, msgs: t.msgs.map(m => m.id === tempId ? { ...m, id: data.id, t: _wFmtTime(data.created_at) } : m),
      }));
    }
    setSending(false);
  }

  async function handleRespondToShift(response) {
    if (!active || !userId.current) return;
    const text = response === 'accepted'
      ? '✓ Přijímám nabídku směny!'
      : 'Bohužel tuto směnu nemohu přijmout.';
    const tempId = 'tmp-resp-' + Date.now();
    setThreads(prev => prev.map(t => t.id !== active ? t : {
      ...t, last: text,
      msgs: [...t.msgs, { from: 'me', text, t: _wFmtTime(new Date().toISOString()), id: tempId }],
    }));
    const { data } = await sb.from('messages').insert({
      match_id: active, sender_id: userId.current, text,
    }).select().single();
    if (data) {
      setThreads(prev => prev.map(t => t.id !== active ? t : {
        ...t, msgs: t.msgs.map(m => m.id === tempId ? { ...m, id: data.id } : m),
      }));
    }
  }

  const thread   = threads.find(t => t.id === active) || null;
  const totalUnread = threads.reduce((s, t) => s + (t.unread || 0), 0);

  if (threads.length === 0) {
    return (
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '20px 32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>💬</div>
          <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Zatím žádné zprávy</div>
          <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.6 }}>
            Swajpuj brigády a jakmile tě zaměstnavatel přijme,<br />otevře se chat přímo tady.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

      {/* Thread list sidebar */}
      <aside style={{
        width: 260, flexShrink: 0,
        borderRight: '1px solid ' + T.border,
        display: 'flex', flexDirection: 'column',
        background: 'rgba(15,15,40,0.3)',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + T.border }}>
          <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 16, fontWeight: 800 }}>
            Zprávy
            {totalUnread > 0 && (
              <span style={{
                marginLeft: 8, padding: '2px 7px', borderRadius: 999,
                background: T.primary, color: '#fff',
                fontFamily: T.fontUI, fontSize: 11, fontWeight: 800,
              }}>{totalUnread}</span>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {threads.map(t => {
            const isActive = t.id === active;
            return (
              <button key={t.id} onClick={() => { setActive(t.id); setThreads(prev => prev.map(x => x.id === t.id ? { ...x, unread: 0 } : x)); }} style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', textAlign: 'left',
                background: isActive ? 'rgba(91,107,255,0.12)' : 'transparent',
                border: 'none', borderLeft: '3px solid ' + (isActive ? T.primary : 'transparent'),
                cursor: 'pointer', color: 'inherit', fontFamily: 'inherit',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 999, background: t.color,
                  display: 'grid', placeItems: 'center',
                  color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 13, flexShrink: 0,
                }}>{t.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                    <span style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                    <span style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, flexShrink: 0 }}>{t.time}</span>
                  </div>
                  <div style={{ color: T.muted, fontSize: 10, fontFamily: T.fontUI, marginBottom: 2 }}>{t.role}</div>
                  <div style={{ color: t.unread > 0 ? T.light : T.mutedSoft, fontSize: 11, fontFamily: T.fontUI, fontWeight: t.unread > 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.last}</div>
                </div>
                {t.unread > 0 && (
                  <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: T.primary, color: '#fff', fontSize: 10, fontWeight: 800, fontFamily: T.fontUI, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{t.unread}</span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Active thread */}
      {thread ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Thread header */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: thread.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 13 }}>{thread.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{thread.name}</div>
              <div style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI }}>{thread.role}</div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {thread.msgs.map((m, i) => {
              if (m.kind === 'shift') {
                return (
                  <WShiftCard
                    key={m.id || i}
                    msg={m}
                    isMe={m.from === 'me'}
                    onAccept={() => handleRespondToShift('accepted')}
                    onReject={() => handleRespondToShift('rejected')}
                  />
                );
              }
              return (
                <div key={m.id || i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 14,
                    background: m.from === 'me' ? 'linear-gradient(135deg, #0020F6, #2D2CA7)' : 'rgba(255,255,255,0.07)',
                    color: '#fff', fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.45,
                    borderBottomRightRadius: m.from === 'me' ? 4 : 14,
                    borderBottomLeftRadius: m.from === 'me' ? 14 : 4,
                  }}>{m.text}</div>
                  <div style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, marginTop: 3, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.t}</div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid ' + T.border, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <input
              placeholder="Napište zprávu…"
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              style={{
                flex: 1, padding: '11px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border,
                color: '#fff', fontSize: 13, outline: 'none', fontFamily: T.fontUI,
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !msgInput.trim()}
              style={{
                width: 40, height: 38, borderRadius: 9,
                background: 'linear-gradient(135deg, #0020F6, #2D2CA7)',
                border: 'none', color: '#fff', cursor: 'pointer',
                display: 'grid', placeItems: 'center',
                opacity: (sending || !msgInput.trim()) ? 0.5 : 1,
              }}>
              <Icon name="plain-bold" size={16} color="#fff" />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13 }}>Vyberte konverzaci</div>
        </div>
      )}
    </div>
  );
}

// ── Shift offer card (worker view) ─────────────────────────────
function WShiftCard({ msg, isMe, onAccept, onReject }) {
  const [responded, setResponded] = useStateW(null); // 'accepted' | 'rejected'
  const s = msg.shift || {};

  const handleAccept = () => {
    setResponded('accepted');
    onAccept?.();
  };
  const handleReject = () => {
    setResponded('rejected');
    onReject?.();
  };

  return (
    <div style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
      <div style={{
        padding: 14, borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(0,32,246,0.22), rgba(91,107,255,0.10))',
        border: '1px solid rgba(91,107,255,0.3)',
      }}>
        <div style={{ color: T.super, fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: T.fontUI, marginBottom: 6 }}>
          📅 Nabídka směny
        </div>
        {s.role && (
          <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{s.role}</div>
        )}
        <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {s.date && <div><Icon name="calendar-bold" size={11} color={T.muted} /> {s.date}{s.time ? (' · ' + s.time) : ''}</div>}
          {s.pay > 0 && <div><Icon name="dollar-bold" size={11} color={T.muted} /> Odměna <span style={{ color: '#fff', fontWeight: 700, fontFamily: T.fontMono }}>{s.pay} Kč</span></div>}
          {s.location && <div><Icon name="map-point-bold" size={11} color={T.muted} /> {s.location}</div>}
        </div>

        {!isMe && (
          responded ? (
            <div style={{
              marginTop: 10, padding: '7px 12px', borderRadius: 8,
              background: responded === 'accepted' ? 'rgba(91,214,138,0.15)' : 'rgba(244,63,94,0.12)',
              border: '1px solid ' + (responded === 'accepted' ? 'rgba(91,214,138,0.3)' : 'rgba(244,63,94,0.25)'),
              color: responded === 'accepted' ? '#5BD68A' : '#f43f5e',
              fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, textAlign: 'center',
            }}>
              {responded === 'accepted' ? '✓ Přijato' : '✕ Odmítnuto'}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button
                onClick={handleReject}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8,
                  background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
                  color: '#f43f5e', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>Odmítnout</button>
              <button
                onClick={handleAccept}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8,
                  background: 'rgba(91,214,138,0.15)', border: '1px solid rgba(91,214,138,0.3)',
                  color: '#5BD68A', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>Přijmout</button>
            </div>
          )
        )}
      </div>
      <div style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>{msg.t}</div>
    </div>
  );
}
