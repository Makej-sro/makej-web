// Makej Employer — Zprávy, Tým, Fakturace, Nastavení

// ─────────────────────────────────────────────────────────────
// ZPRÁVY — split inbox
// ─────────────────────────────────────────────────────────────
const E_THREADS = [
  { id: 't1', name: 'Tomáš Marek', avatar: 'TM', color: '#5B6BFF', role: 'Barista — kandidát', last: 'Díky za pozvání, můžu klidně už ve čtvrtek od 7:00.', time: '12:42', unread: 0, online: true, pinned: true,
    msgs: [
      { from: 'them', text: 'Dobrý den, viděl jsem nabídku na pozici barista. Mám 2 roky zkušeností ze Skog Café.', t: '11:08' },
      { from: 'me', text: 'Ahoj Tomáši, super CV. Máš čas zítra na rychlý 15min hovor?', t: '11:42' },
      { from: 'them', text: 'Jasně, klidně.', t: '11:48' },
      { from: 'them', kind: 'shift', shift: { role: 'Barista', date: 'Čt 8.5.', time: '7:00 – 15:00', pay: 1440 }, t: '11:50' },
      { from: 'me', text: 'Posílám ti termín. Klikni „Přijmout" v aplikaci, ať to máme potvrzené.', t: '12:01' },
      { from: 'them', text: 'Díky za pozvání, můžu klidně už ve čtvrtek od 7:00.', t: '12:42' },
    ],
  },
  { id: 't2', name: 'Klára Novotná', avatar: 'KN', color: '#F4A261', role: 'Servírka — pohovor Pá 14:00', last: 'Můžu se zeptat, jestli je dress code spíš casual nebo formal?', time: '11:18', unread: 2, online: true,
    msgs: [{ from: 'them', text: 'Můžu se zeptat, jestli je dress code spíš casual nebo formal?', t: '11:18' }] },
  { id: 't3', name: 'Adam Procházka', avatar: 'AP', color: '#FFD166', role: 'Bar — shortlist', last: 'Posílám reference z poslední brigády.', time: 'včera', unread: 0, online: false,
    msgs: [{ from: 'them', text: 'Posílám reference z poslední brigády.', t: 'včera' }] },
  { id: 't4', name: 'Jakub Veselý', avatar: 'JV', color: '#8AB4FF', role: 'Bar — pohovor Pá 14:00', last: 'Tak v pátek.', time: 'včera', unread: 0, online: false,
    msgs: [{ from: 'them', text: 'Tak v pátek.', t: 'včera' }] },
  { id: 't5', name: 'Sára Dvořáková', avatar: 'SD', color: '#5BD68A', role: 'Servírka — najato', last: 'Děkuju, těším se na pondělí!', time: 'pondělí', unread: 0, online: false,
    msgs: [{ from: 'them', text: 'Děkuju, těším se na pondělí!', t: 'pondělí' }] },
  { id: 't6', name: 'Markéta L.', avatar: 'ML', color: '#FF6B35', role: 'Barista — shortlist', last: 'Mám zájem.', time: 'pondělí', unread: 0, online: false,
    msgs: [{ from: 'them', text: 'Mám zájem.', t: 'pondělí' }] },
];

function EMessages() {
  // Local thread state — initialized from (possibly mutated) global E_THREADS
  const [threads, setThreads]   = useStateE(() => [...E_THREADS]);
  const [active,  setActive]    = useStateE(() => E_THREADS[0]?.id || null);
  const [filter,  setFilter]    = useStateE('all');
  const [msgInput, setMsgInput] = useStateE('');
  const [sending,  setSending]  = useStateE(false);
  const [showShiftModal, setShowShiftModal] = useStateE(false);
  const [shiftForm, setShiftForm] = useStateE({ role: '', date: '', time: '', pay: '', location: '' });
  const userId                  = useRefE(null);
  const scrollRef               = useRefE(null);

  // Grab current user id once
  useEffectE(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      userId.current = session?.user?.id || null;
    });
  }, []);

  // Global subscription: update thread sidebar previews for ALL incoming messages
  // (active thread messages are handled separately by the per-thread subscription)
  useEffectE(() => {
    const chan = sb.channel('e-msgs-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        const preview = msg.type === 'shift_offer' ? '📅 Nabídka směny' : msg.text;
        setThreads(prev => prev.map(t => {
          if (t.id !== msg.match_id) return t;
          const isMine = msg.sender_id === userId.current;
          if (t.id === active) return { ...t, last: preview };
          return { ...t, last: preview, unread: isMine ? t.unread : (t.unread || 0) + 1 };
        }));
      })
      .subscribe();
    return () => { try { sb.removeChannel(chan); } catch(e) {} };
  }, [active]);

  // Auto-scroll chat to bottom when thread or messages change
  useEffectE(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active, threads]);

  // Realtime: subscribe to new messages for the active thread
  useEffectE(() => {
    if (!active) return;
    const chan = sb.channel('e-thread-' + active)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: 'match_id=eq.' + active,
      }, (payload) => {
        const msg = payload.new;
        setThreads(prev => prev.map(t => {
          if (t.id !== active) return t;
          // Avoid duplicate if it's our own optimistic message
          if (t.msgs.some(m => m.id === msg.id)) return t;
          const isShift = msg.type === 'shift_offer' && msg.metadata;
          const newMsg = isShift
            ? { from: msg.sender_id === userId.current ? 'me' : 'them', kind: 'shift', shift: { role: msg.metadata.role, date: msg.metadata.date, time: msg.metadata.time, pay: msg.metadata.pay }, t: _fmtTime(msg.created_at), id: msg.id }
            : { from: msg.sender_id === userId.current ? 'me' : 'them', text: msg.text, t: _fmtTime(msg.created_at), id: msg.id };
          return {
            ...t,
            last: isShift ? '📅 Nabídka směny' : msg.text,
            msgs: [...t.msgs, newMsg],
          };
        }));
      })
      .subscribe();
    return () => { try { sb.removeChannel(chan); } catch(e) {} };
  }, [active]);

  async function handleSend() {
    const text = msgInput.trim();
    if (!text || !active || !userId.current || sending) return;
    setMsgInput('');
    setSending(true);

    const tempId = 'tmp-' + Date.now();
    // Optimistic update
    setThreads(prev => prev.map(t => t.id !== active ? t : {
      ...t, last: text,
      msgs: [...t.msgs, { from: 'me', text, t: _fmtTime(new Date().toISOString()), id: tempId }],
    }));

    const { data } = await sb.from('messages').insert({
      match_id: active,
      sender_id: userId.current,
      text,
    }).select().single();

    // Replace temp id with real id
    if (data) {
      setThreads(prev => prev.map(t => t.id !== active ? t : {
        ...t,
        msgs: t.msgs.map(m => m.id === tempId ? { ...m, id: data.id, t: _fmtTime(data.created_at) } : m),
      }));
    }
    setSending(false);
  }

  async function handleSendShift() {
    if (!active || !userId.current) return;
    const meta = {
      role: shiftForm.role || thread?.role?.split(' — ')[0] || 'Brigádník',
      date: shiftForm.date,
      time: shiftForm.time,
      pay: parseInt(shiftForm.pay) || 0,
      location: shiftForm.location,
    };
    const tempId = 'tmp-shift-' + Date.now();
    const shiftMsg = { from: 'me', kind: 'shift', shift: { role: meta.role, date: meta.date, time: meta.time, pay: meta.pay }, t: _fmtTime(new Date().toISOString()), id: tempId };
    setThreads(prev => prev.map(t => t.id !== active ? t : {
      ...t, last: '📅 Nabídka směny',
      msgs: [...t.msgs, shiftMsg],
    }));
    setShowShiftModal(false);
    setShiftForm({ role: '', date: '', time: '', pay: '', location: '' });
    const { error } = await sb.from('messages').insert({
      match_id: active,
      sender_id: userId.current,
      text: 'Nabídka směny',
      type: 'shift_offer',
      metadata: meta,
    }).select().single();
    if (error) {
      console.error('sendShiftOffer error:', error);
      // Rollback optimistic message if DB insert failed
      setThreads(prev => prev.map(t => t.id !== active ? t : {
        ...t, msgs: t.msgs.filter(m => m.id !== tempId),
      }));
      alert('Nepodařilo se odeslat nabídku. Je potřeba spustit DB migraci: ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT \'text\'; ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;');
    }
  }

  const thread   = threads.find(t => t.id === active) || threads[0];
  const filtered = threads.filter(t => {
    if (filter === 'unread') return t.unread > 0;
    if (filter === 'pinned') return t.pinned;
    return true;
  });

  if (!thread) return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', color: T.muted, fontFamily: T.fontUI }}>
        <Icon name="chat-round-line-bold" size={48} color={T.mutedSoft} />
        <div style={{ marginTop: 12, fontSize: 13 }}>Zatím žádné zprávy.<br/>Začněte komunikovat s kandidáty v aplikaci.</div>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* List */}
      <aside style={{ width: 320, flexShrink: 0, borderRight: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', background: 'rgba(15,15,40,0.3)' }}>
        <div style={{ padding: 16, borderBottom: '1px solid ' + T.border }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><Icon name="magnifer-linear" size={14} color={T.mutedSoft}/></span>
            <input placeholder="Hledat v konverzacích…" style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, color: '#fff', fontSize: 12.5, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {[{k:'all',l:'Všechny'},{k:'unread',l:'Nepřečtené'},{k:'pinned',l:'Připnuté'}].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)} style={{
                padding: '5px 10px', borderRadius: 6,
                background: filter === f.k ? 'rgba(91,107,255,0.2)' : 'transparent',
                border: '1px solid ' + (filter === f.k ? 'rgba(91,107,255,0.35)' : T.border),
                color: filter === f.k ? '#fff' : T.muted,
                fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>{f.l}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((t, _i) => {
            const isActive = t.id === active;
            return (
              <button key={t.id} onClick={() => setActive(t.id)} style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px', textAlign: 'left',
                background: isActive ? 'rgba(91,107,255,0.12)' : 'transparent',
                border: 'none', borderLeft: '3px solid ' + (isActive ? T.primary : 'transparent'),
                cursor: 'pointer', color: 'inherit',
                fontFamily: 'inherit',
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 999, background: t.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 13 }}>{t.avatar}</div>
                  {t.online ? <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 999, background: '#5BD68A', border: '2px solid #07071a' }} /> : null}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                    <span style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.pinned ? '📌 ' : ''}{t.name}
                    </span>
                    <span style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, flexShrink: 0 }}>{t.time}</span>
                  </div>
                  <div style={{ color: T.muted, fontSize: 10.5, fontFamily: T.fontUI, marginBottom: 3 }}>{t.role}</div>
                  <div style={{ color: t.unread > 0 ? T.light : T.mutedSoft, fontSize: 11.5, fontFamily: T.fontUI, fontWeight: t.unread > 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.last}</div>
                </div>
                {t.unread > 0 ? <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: T.primary, color: '#fff', fontSize: 10, fontWeight: 800, fontFamily: T.fontUI, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{t.unread}</span> : null}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Thread */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '14px 22px', borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 999, background: thread.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 13 }}>{thread.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 14, fontWeight: 700 }}>{thread.name}</div>
            <div style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI }}>{thread.role} · {thread.online ? <span style={{ color: '#5BD68A' }}>online</span> : 'offline'}</div>
          </div>
          <button style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(91,107,255,0.18)', border: '1px solid rgba(91,107,255,0.3)', color: '#fff', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="user-id-bold" size={13} color="#fff"/>Profil
          </button>
          <button onClick={() => setShowShiftModal(true)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, color: T.light, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="calendar-bold" size={13} color={T.light}/>Nabídnout směnu
          </button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {thread.msgs.map((m, i) => {
            if (m.kind === 'shift') {
              return (
                <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ padding: 14, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,32,246,0.25), rgba(91,107,255,0.1))', border: '1px solid rgba(91,107,255,0.3)' }}>
                    <div style={{ color: T.super, fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: T.fontUI }}>Nabídka směny</div>
                    <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, marginTop: 4 }}>{m.shift.role}</div>
                    <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 12, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div><Icon name="calendar-bold" size={11} color={T.muted}/> {m.shift.date} · {m.shift.time}</div>
                      <div><Icon name="dollar-bold" size={11} color={T.muted}/> Odhad odměny <span style={{ color: '#fff', fontWeight: 700, fontFamily: T.fontMono }}>{m.shift.pay} Kč</span></div>
                    </div>
                  </div>
                  <div style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, marginTop: 4, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.t}</div>
                </div>
              );
            }
            return (
              <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 14,
                  background: m.from === 'me' ? 'linear-gradient(135deg, #0020F6, #2D2CA7)' : 'rgba(255,255,255,0.06)',
                  color: '#fff', fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.45,
                  borderBottomRightRadius: m.from === 'me' ? 4 : 14,
                  borderBottomLeftRadius: m.from === 'me' ? 14 : 4,
                }}>{m.text}</div>
                <div style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, marginTop: 4, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.t}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid ' + T.border, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Napište zprávu…"
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            style={{ flex: 1, padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, color: '#fff', fontSize: 13, outline: 'none', fontFamily: T.fontUI }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !msgInput.trim()}
            style={{ width: 40, height: 38, borderRadius: 9, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', opacity: (sending || !msgInput.trim()) ? 0.5 : 1 }}>
            <Icon name="plain-bold" size={16} color="#fff"/>
          </button>
        </div>

        {/* Quick replies */}
        <div style={{ padding: '0 16px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Nabídnout směnu','Pozvat na pohovor','Zaslat pravidla','Bohužel ne'].map(q => (
            <button key={q} onClick={() => {
              if (q === 'Nabídnout směnu') { setShowShiftModal(true); return; }
              setMsgInput(q);
            }} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid ' + T.border, color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{q}</button>
          ))}
        </div>
      </main>

      {/* Right: candidate context */}
      <aside style={{ width: 280, flexShrink: 0, borderLeft: '1px solid ' + T.border, padding: 18, overflowY: 'auto', background: 'rgba(15,15,40,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: thread.color, margin: '0 auto', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 22 }}>{thread.avatar}</div>
          <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, marginTop: 8 }}>{thread.name}</div>
          <div style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI, marginTop: 2 }}>22 let · Brno · 1.2 km</div>
          <div style={{ display: 'inline-flex', gap: 5, marginTop: 8 }}>
            <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(91,214,138,0.2)', color: '#5BD68A', fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 800 }}>96 % match</span>
            <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(91,107,255,0.2)', color: '#5B6BFF', fontFamily: T.fontMono, fontSize: 10.5, fontWeight: 800 }}>L7</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
          {[
            { l: '★', v: '4.9' },
            { l: 'brigád', v: '23' },
            { l: 'odp.', v: '4 min' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, textAlign: 'center' }}>
              <div style={{ color: '#fff', fontFamily: T.fontMono, fontSize: 14, fontWeight: 700 }}>{s.v}</div>
              <div style={{ color: T.mutedSoft, fontSize: 9.5, fontFamily: T.fontUI, marginTop: 1 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ color: T.muted, fontSize: 10, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Sdílené dokumenty</div>
        {[
          { i: 'document-text-bold', n: 'CV — Tomáš Marek.pdf', s: '142 kB' },
          { i: 'shield-check-bold', n: 'Potvrzení o studiu', s: 'ověřeno' },
        ].map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid ' + T.border, marginBottom: 6 }}>
            <Icon name={d.i} size={14} color={T.light}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.n}</div>
              <div style={{ color: T.mutedSoft, fontSize: 10, fontFamily: T.fontMono }}>{d.s}</div>
            </div>
          </div>
        ))}
        <button style={{ width: '100%', marginTop: 10, padding: '9px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, color: T.light, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Otevřít plný profil →</button>
      </aside>

      {/* Shift offer modal */}
      {showShiftModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowShiftModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 200 }}>
          <div style={{ background: '#0d0d28', border: '1px solid rgba(208,208,255,.14)', borderRadius: 18, padding: 28, width: 380, position: 'relative' }}>
            <button onClick={() => setShowShiftModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(208,208,255,.08)', border: 'none', borderRadius: 8, padding: 6, color: T.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Nabídnout směnu</div>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 12, marginBottom: 20 }}>Nabídka bude odeslána jako zpráva — brigádník ji může přijmout nebo odmítnout.</div>
            {[
              { label: 'Pozice / název směny', key: 'role', placeholder: 'např. Barista, Servírka…', type: 'text' },
              { label: 'Datum', key: 'date', placeholder: 'např. Čt 15.5.', type: 'text' },
              { label: 'Čas (od – do)', key: 'time', placeholder: 'např. 7:00 – 15:00', type: 'text' },
              { label: 'Odměna (Kč)', key: 'pay', placeholder: 'např. 1440', type: 'number' },
              { label: 'Adresa / místo', key: 'location', placeholder: 'např. Náměstí Míru 3, Praha 2', type: 'text' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{field.label}</div>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={shiftForm[field.key]}
                  onChange={e => setShiftForm(f => ({ ...f, [field.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(208,208,255,.14)', color: '#fff', fontSize: 13, outline: 'none', fontFamily: T.fontUI, boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <button
              onClick={handleSendShift}
              disabled={!shiftForm.date || !shiftForm.time}
              style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', fontFamily: T.fontHead, fontSize: 14, fontWeight: 800, cursor: (!shiftForm.date || !shiftForm.time) ? 'not-allowed' : 'pointer', opacity: (!shiftForm.date || !shiftForm.time) ? 0.5 : 1, marginTop: 4 }}>
              Odeslat nabídku směny
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NASTAVENÍ (inline — TÝM a FAKTURACE odebrány jako nepotřebné při launchi)
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// NASTAVENÍ
// ─────────────────────────────────────────────────────────────
function ESettings() {
  const [seg, setSeg] = useStateE('profile');
  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
      <aside style={{ width: 220, padding: 22, borderRight: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { k: 'profile', l: 'Firemní profil', i: 'buildings-3-bold' },
          { k: 'notif', l: 'Notifikace', i: 'bell-bold' },
          { k: 'priv', l: 'Soukromí + GDPR', i: 'shield-keyhole-bold' },
          { k: 'danger', l: 'Nebezpečná zóna', i: 'shield-warning-bold' },
        ].map(s => (
          <button key={s.k} onClick={() => setSeg(s.k)} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 9,
            background: seg === s.k ? 'rgba(91,107,255,0.18)' : 'transparent',
            border: '1px solid ' + (seg === s.k ? 'rgba(91,107,255,0.35)' : 'transparent'),
            color: seg === s.k ? '#fff' : (s.k === 'danger' ? '#f43f5e' : T.muted),
            cursor: 'pointer', textAlign: 'left',
            fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600,
          }}>
            <Icon name={s.i} size={14} color={seg === s.k ? T.light : (s.k === 'danger' ? '#f43f5e' : T.muted)}/>
            {s.l}
          </button>
        ))}
        {/* Odhlásit se */}
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid ' + T.border }}>
          <button onClick={async () => {
            await sb.auth.signOut();
            window.location.href = '/';
          }} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 9, width: '100%',
            background: 'transparent', border: '1px solid transparent',
            color: T.muted, cursor: 'pointer', textAlign: 'left',
            fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600,
            transition: 'color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.12)'; e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = 'transparent'; }}>
            <Icon name="logout-2-bold" size={14} color="currentColor"/>
            Odhlásit se
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
        {seg === 'profile' && <SettingsProfile />}
        {seg === 'notif' && <SettingsNotif />}
        {seg === 'priv' && <SettingsPrivacy />}
        {seg === 'danger' && <SettingsDanger />}
      </div>
    </div>
  );
}

function FormRow({ label, sub, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, padding: '14px 0', borderBottom: '1px solid ' + T.border, alignItems: 'flex-start' }}>
      <div>
        <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700 }}>{label}</div>
        {sub ? <div style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI, marginTop: 3 }}>{sub}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'rgba(0,0,0,0.3)', border: '1px solid ' + T.border,
  color: '#fff', fontFamily: T.fontUI, fontSize: 13, outline: 'none',
};

function SettingsProfile() {
  const initForm = () => ({
    company_name: EPROFILE.company_name || ECOMPANY.name || '',
    bio: EPROFILE.bio || '',
  });
  const [form, setForm]     = useStateE(initForm);
  const [saving, setSaving] = useStateE(false);
  const [toast, setToast]   = useStateE(null);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    setSaving(true);
    const ok = await updateEmployerProfile({ company_name: form.company_name, bio: form.bio });
    setSaving(false);
    setToast(ok ? 'ok' : 'err');
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <ECard>
      <SectionHeader title="Firemní profil" subtitle="Tyto informace vidí kandidáti na profilu vaší firmy" />
      {toast === 'ok' && (
        <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(91,214,138,0.18)', border: '1px solid rgba(91,214,138,0.35)', color: '#5BD68A', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
          ✓ Profil uložen
        </div>
      )}
      {toast === 'err' && (
        <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
          Chyba při ukládání
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid ' + T.border }}>
        <div style={{ width: 64, height: 64, borderRadius: 14, background: ECOMPANY.logoColor + '22', border: '1px solid ' + ECOMPANY.logoColor + '55', display: 'grid', placeItems: 'center', color: ECOMPANY.logoColor, fontFamily: T.fontHead, fontWeight: 800, fontSize: 22 }}>{ECOMPANY.logo}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 16, fontWeight: 800 }}>Logo firmy</div>
          <div style={{ color: T.muted, fontSize: 11.5, fontFamily: T.fontUI, marginTop: 2 }}>PNG / SVG, min. 256×256, max. 1 MB</div>
        </div>
        <button style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border, color: T.light, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Nahrát</button>
      </div>
      <FormRow label="Název firmy">
        <input style={inputStyle} value={form.company_name} onChange={set('company_name')} />
      </FormRow>
      <FormRow label="Krátký popis" sub="Max. 280 znaků — vidí se v kartě firmy">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: T.fontUI }} value={form.bio} onChange={set('bio')} placeholder="Napiš něco o firmě…" />
      </FormRow>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 14 }}>
        <button
          onClick={() => setForm(initForm())}
          disabled={saving}
          style={{ padding: '9px 16px', borderRadius: 8, background: 'transparent', border: '1px solid ' + T.border, color: T.muted, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
        >Zrušit</button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '9px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >{saving ? 'Ukládám…' : 'Uložit změny'}</button>
      </div>
    </ECard>
  );
}


function SettingsNotif() {
  const rows = [
    { l: 'Nový match', s: 'Někdo swajpnul vpravo na váš inzerát', e: true, p: true, push: true },
    { l: 'Zpráva od kandidáta', s: 'Nová zpráva ve schránce', e: true, p: true, push: true },
    { l: 'Kandidát potvrdil směnu', s: 'Po nabídce směny v threadu', e: false, p: true, push: true },
    { l: 'Kandidát zrušil směnu', s: 'Důležité — vyžaduje akci', e: true, p: true, push: true },
    { l: 'Týdenní report', s: 'Pondělní mail s KPI', e: true, p: false, push: false },
    { l: 'Doporučení AI', s: 'Tipy z analytiky', e: false, p: true, push: false },
  ];
  return (
    <ECard padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px 8px' }}>
        <SectionHeader title="Notifikace" subtitle="Kdy vás máme rušit" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 0, padding: '6px 22px', color: T.mutedSoft, fontSize: 10, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', borderBottom: '1px solid ' + T.border }}>
        <div>Událost</div>
        <div style={{ textAlign: 'center' }}>E-mail</div>
        <div style={{ textAlign: 'center' }}>V appce</div>
        <div style={{ textAlign: 'center' }}>Push</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 0, padding: '14px 22px', alignItems: 'center', borderBottom: i < rows.length - 1 ? '1px solid ' + T.border : 'none' }}>
          <div>
            <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{r.l}</div>
            <div style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI, marginTop: 2 }}>{r.s}</div>
          </div>
          {[r.e, r.p, r.push].map((on, j) => (
            <div key={j} style={{ display: 'flex', justifyContent: 'center' }}>
              <Toggle on={on} />
            </div>
          ))}
        </div>
      ))}
    </ECard>
  );
}

function Toggle({ on }) {
  return (
    <div style={{
      width: 36, height: 20, borderRadius: 999,
      background: on ? T.primary : 'rgba(255,255,255,0.1)',
      position: 'relative', cursor: 'pointer', transition: 'all .2s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: 999, background: '#fff',
        transition: 'left .2s',
      }} />
    </div>
  );
}


function SettingsPrivacy() {
  return (
    <ECard>
      <SectionHeader title="Soukromí + GDPR" subtitle="Jak nakládáme s daty kandidátů" />
      {[
        { l: 'Anonymizovat odmítnuté kandidáty po', v: '90 dnech', sub: 'Po této době zmizí jméno, fotka i kontakty' },
        { l: 'Sdílet souhrnnou analytiku se segmentem', v: 'Ano (anonymně)', sub: 'Pomáhá lepším benchmarkům' },
        { l: 'Doporučovat váš profil podobným firmám', v: 'Ne', sub: 'Snížená viditelnost mimo přímé kandidáty' },
      ].map((r, i) => (
        <FormRow key={i} label={r.l} sub={r.sub}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, padding: '6px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border }}>{r.v}</span>
            <button style={{ padding: '6px 12px', borderRadius: 7, background: 'transparent', border: '1px solid ' + T.border, color: T.muted, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Změnit</button>
          </div>
        </FormRow>
      ))}
      <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: 'rgba(91,107,255,0.08)', border: '1px solid rgba(91,107,255,0.2)' }}>
        <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700 }}>Export všech dat</div>
        <div style={{ color: T.muted, fontSize: 11.5, fontFamily: T.fontUI, marginTop: 4 }}>Stáhněte JSON se všemi inzeráty, kandidáty a zprávami. Zpracování trvá ~10 minut.</div>
        <button style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid ' + T.border, color: '#fff', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Vyžádat export</button>
      </div>
    </ECard>
  );
}

function SettingsDanger() {
  return (
    <ECard style={{ borderColor: 'rgba(244,63,94,0.3)' }}>
      <SectionHeader title="Nebezpečná zóna" subtitle="Tato kroky nelze vrátit" />
      {[
        { l: 'Pozastavit účet', s: 'Inzeráty zmizí, ale data zůstanou. Můžete kdykoli obnovit.', cta: 'Pozastavit', tone: '#FFD166' },
        { l: 'Převést vlastnictví', s: 'Předat účet jinému členu týmu jako vlastníkovi.', cta: 'Převést', tone: '#5B6BFF' },
        { l: 'Smazat účet a všechna data', s: 'Trvale odstraní všechny inzeráty, kandidáty, zprávy a fakturační historii. Nelze vrátit.', cta: 'Smazat účet', tone: '#f43f5e' },
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < 2 ? '1px solid ' + T.border : 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{r.l}</div>
            <div style={{ color: T.muted, fontSize: 11.5, fontFamily: T.fontUI, marginTop: 3 }}>{r.s}</div>
          </div>
          <button style={{ padding: '9px 14px', borderRadius: 8, background: 'transparent', border: '1px solid ' + r.tone + '66', color: r.tone, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{r.cta}</button>
        </div>
      ))}
    </ECard>
  );
}

Object.assign(window, { EMessages, ESettings });
