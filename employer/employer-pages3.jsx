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

function _eFmtDur(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function _eFmtSize(b) { b = b || 0; if (b < 1024) return b + ' B'; if (b < 1048576) return Math.round(b / 1024) + ' kB'; return (b / 1048576).toFixed(1) + ' MB'; }

function EMessages() {
  const isMobile = useIsMobile();
  // Na mobilu: přepínání mezi seznamem a vláknem
  const [mobileView, setMobileView] = useStateE('list'); // 'list' | 'thread'
  // Local thread state — initialized from (possibly mutated) global E_THREADS
  const [threads, setThreads]   = useStateE(() => [...E_THREADS]);
  const [active,  setActive]    = useStateE(() => {
    const preset = window._empPresetThread;
    if (preset) { window._empPresetThread = null; return preset; }
    return E_THREADS[0]?.id || null;
  });
  const [filter,  setFilter]    = useStateE('all');
  const [msgInput, setMsgInput] = useStateE('');
  const [sending,  setSending]  = useStateE(false);
  const [showShiftModal, setShowShiftModal] = useStateE(false);
  const [shiftForm, setShiftForm] = useStateE({ role: '', date: '', time: '', pay: '', location: '' });
  const [showInterviewModal, setShowInterviewModal] = useStateE(false);
  const [interviewForm, setInterviewForm] = useStateE({ date: '', time: '', location: '', note: '' });
  const userId                  = useRefE(null);
  const scrollRef               = useRefE(null);
  const [uploadingFile, setUploadingFile] = useStateE(false);
  const [recording, setRecording] = useStateE(false);
  const [recSecs,   setRecSecs]   = useStateE(0);
  const [signedUrls, setSignedUrls] = useStateE({});
  const attachInputRef = useRefE(null);
  const recRef      = useRefE(null);
  const recTimerRef = useRefE(null);

  function _ensureSigned(path) {
    if (!path || signedUrls[path] || typeof chatSignedUrlE !== 'function') return;
    chatSignedUrlE(path).then(url => { if (url) setSignedUrls(prev => ({ ...prev, [path]: url })); });
  }

  // Grab current user id once
  useEffectE(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      userId.current = window._makejActingId || session?.user?.id || null;
    });
  }, []);

  // Global subscription: update thread sidebar previews for ALL incoming messages
  // (active thread messages are handled separately by the per-thread subscription)
  useEffectE(() => {
    const chan = sb.channel('e-msgs-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        const preview = msg.type === 'shift_offer' ? '📅 Nabídka směny' : msg.type === 'interview_offer' ? '🗓️ Pozvánka na pohovor' : msg.text;
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

  // Předpřiprav podepsané URL pro přílohy v otevřené konverzaci
  useEffectE(() => {
    const t = threads.find(x => x.id === active);
    if (!t) return;
    t.msgs.forEach(m => { if (m.kind === 'file' && m.fileUrl) _ensureSigned(m.fileUrl); });
  }, [active, threads]);

  // Odeslání přílohy (fotka / soubor / hlasovka)
  async function sendFileMessage(fileObj, fileType, duration) {
    if (!active || !userId.current || uploadingFile || typeof uploadChatFileE !== 'function') return;
    setUploadingFile(true);
    const up = await uploadChatFileE(active, fileObj, fileType);
    if (up) {
      const payload = { match_id: active, sender_id: userId.current, file_url: up.path, file_type: fileType, file_name: up.name, file_size: up.size };
      if (duration != null) payload.duration = duration;
      const { data } = await sb.from('messages').insert(payload).select().single();
      if (data) {
        _ensureSigned(up.path);
        setThreads(prev => prev.map(t => t.id !== active ? t : {
          ...t,
          last: fileType === 'image' ? '📷 Fotka' : fileType === 'audio' ? '🎤 Hlasová zpráva' : '📎 Příloha',
          msgs: t.msgs.some(m => m.id === data.id) ? t.msgs : [...t.msgs, { from: 'me', kind: 'file', fileUrl: up.path, fileType, fileName: up.name, fileSize: up.size, duration, text: '', t: _fmtTime(data.created_at), id: data.id }],
        }));
      }
    }
    setUploadingFile(false);
  }
  function onPickAttach(e) { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) sendFileMessage(f, (f.type || '').startsWith('image/') ? 'image' : 'file'); }

  async function startRecording() {
    if (recording || !active) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) { alert('Nahrávání hlasovek prohlížeč nepodporuje.'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = () => {
        try { stream.getTracks().forEach(t => t.stop()); } catch (_) {}
        clearInterval(recTimerRef.current);
        const secs = Math.max(1, Math.round((Date.now() - recRef.current.startedAt) / 1000));
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        setRecording(false); setRecSecs(0); recRef.current = null;
        if (blob.size > 0) sendFileMessage(blob, 'audio', secs);
      };
      recRef.current = { mr, stream, startedAt: Date.now() };
      mr.start(); setRecording(true); setRecSecs(0);
      recTimerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    } catch (e) { console.error('mic:', e); alert('Nepodařilo se spustit mikrofon. Povol přístup k mikrofonu.'); }
  }
  function stopRecording(cancel) {
    const r = recRef.current;
    if (!r) return;
    if (cancel) { r.mr.onstop = () => { try { r.stream.getTracks().forEach(t => t.stop()); } catch (_) {} clearInterval(recTimerRef.current); setRecording(false); setRecSecs(0); recRef.current = null; }; }
    try { r.mr.stop(); } catch (_) {}
  }

  // Realtime: subscribe to new messages for the active thread
  useEffectE(() => {
    if (!active) return;
    const chan = sb.channel('e-thread-' + active)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: 'match_id=eq.' + active,
      }, (payload) => {
        const msg = payload.new;
        // Skip own messages — already added optimistically in handleSend / handleSendShift
        if (msg.sender_id === userId.current) return;
        setThreads(prev => prev.map(t => {
          if (t.id !== active) return t;
          if (t.msgs.some(m => m.id === msg.id)) return t;
          const from = msg.sender_id === userId.current ? 'me' : 'them';
          const isShift = msg.type === 'shift_offer' && msg.metadata;
          const isInterview = msg.type === 'interview_offer' && msg.metadata;
          const newMsg = isShift
            ? { from, kind: 'shift', shift: { role: msg.metadata.role, date: msg.metadata.date, time: msg.metadata.time, pay: msg.metadata.pay }, t: _fmtTime(msg.created_at), id: msg.id }
            : isInterview
            ? { from, kind: 'interview', interview: { date: msg.metadata.date, time: msg.metadata.time, location: msg.metadata.location, note: msg.metadata.note }, t: _fmtTime(msg.created_at), id: msg.id }
            : msg.file_url
            ? { from, kind: 'file', fileUrl: msg.file_url, fileType: msg.file_type, fileName: msg.file_name, fileSize: msg.file_size, duration: msg.duration, text: msg.text || '', t: _fmtTime(msg.created_at), id: msg.id }
            : { from, text: msg.text, t: _fmtTime(msg.created_at), id: msg.id };
          if (newMsg.kind === 'file') _ensureSigned(newMsg.fileUrl);
          return {
            ...t,
            last: isShift ? '📅 Nabídka směny' : isInterview ? '🗓️ Pozvánka na pohovor' : msg.file_url ? (msg.file_type === 'image' ? '📷 Fotka' : msg.file_type === 'audio' ? '🎤 Hlasová zpráva' : '📎 Příloha') : msg.text,
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
    const { data: insertedShift, error } = await sb.from('messages').insert({
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
    } else if (insertedShift) {
      // Nahradit temp ID skutečným DB ID, aby realtime event poznal duplikát a přeskočil ho
      setThreads(prev => prev.map(t => t.id !== active ? t : {
        ...t, msgs: t.msgs.map(m => m.id === tempId ? { ...m, id: insertedShift.id, t: _fmtTime(insertedShift.created_at) } : m),
      }));
    }
  }

  async function handleSendInterview() {
    if (!active || !userId.current) return;
    const meta = {
      date: interviewForm.date,
      time: interviewForm.time,
      location: interviewForm.location,
      note: interviewForm.note,
    };
    const tempId = 'tmp-int-' + Date.now();
    const intMsg = { from: 'me', kind: 'interview', interview: { ...meta }, t: _fmtTime(new Date().toISOString()), id: tempId };
    setThreads(prev => prev.map(t => t.id !== active ? t : {
      ...t, last: '🗓️ Pozvánka na pohovor',
      msgs: [...t.msgs, intMsg],
    }));
    setShowInterviewModal(false);
    setInterviewForm({ date: '', time: '', location: '', note: '' });
    const { data: inserted, error } = await sb.from('messages').insert({
      match_id: active,
      sender_id: userId.current,
      text: 'Pozvánka na pohovor',
      type: 'interview_offer',
      metadata: meta,
    }).select().single();
    if (error) {
      console.error('sendInterviewOffer error:', error);
      setThreads(prev => prev.map(t => t.id !== active ? t : {
        ...t, msgs: t.msgs.filter(m => m.id !== tempId),
      }));
    } else if (inserted) {
      setThreads(prev => prev.map(t => t.id !== active ? t : {
        ...t, msgs: t.msgs.map(m => m.id === tempId ? { ...m, id: inserted.id, t: _fmtTime(inserted.created_at) } : m),
      }));
    }
  }

  // Odeslání libovolného textu jako zprávy (pro tlačítko „Zaslat pravidla")
  async function sendQuickText(text) {
    if (!text || !active || !userId.current) return;
    const tempId = 'tmp-' + Date.now();
    setThreads(prev => prev.map(t => t.id !== active ? t : {
      ...t, last: text,
      msgs: [...t.msgs, { from: 'me', text, t: _fmtTime(new Date().toISOString()), id: tempId }],
    }));
    const { data } = await sb.from('messages').insert({
      match_id: active, sender_id: userId.current, text,
    }).select().single();
    if (data) {
      setThreads(prev => prev.map(t => t.id !== active ? t : {
        ...t, msgs: t.msgs.map(m => m.id === tempId ? { ...m, id: data.id, t: _fmtTime(data.created_at) } : m),
      }));
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
      <aside style={{
        width: (isMobile ? '100%' : 320), flexShrink: 0,
        borderRight: isMobile ? 'none' : '1px solid ' + T.border,
        display: (isMobile && mobileView !== 'list') ? 'none' : 'flex',
        flexDirection: 'column', background: '#ffffff',
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid ' + T.border }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><Icon name="magnifer-linear" size={14} color={T.mutedSoft}/></span>
            <input placeholder="Hledat v konverzacích…" style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.ink, fontSize: 12.5, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {[{k:'all',l:'Všechny'},{k:'unread',l:'Nepřečtené'},{k:'pinned',l:'Připnuté'}].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)} style={{
                padding: '5px 10px', borderRadius: 6,
                background: filter === f.k ? T.primary : 'transparent',
                border: '1px solid ' + (filter === f.k ? T.primary : T.border),
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
              <button key={t.id} onClick={() => { setActive(t.id); if (isMobile) setMobileView('thread'); }} style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px', textAlign: 'left',
                background: isActive ? 'rgba(0,32,246,0.09)' : 'transparent',
                border: 'none', borderLeft: '3px solid ' + (isActive ? T.primary : 'transparent'),
                cursor: 'pointer', color: 'inherit',
                fontFamily: 'inherit',
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 999, overflow: 'hidden', background: t.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 13 }}>{t.avatarUrl ? <img src={t.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : t.avatar}</div>
                  {t.online ? <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 999, background: '#5BD68A', border: '2px solid #fff' }} /> : null}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                    <span style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
      <main style={{ flex: 1, display: (isMobile && mobileView !== 'thread') ? 'none' : 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: isMobile ? '12px 14px' : '14px 22px', borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, background: '#ffffff' }}>
          {isMobile && (
            <button onClick={() => setMobileView('list')} aria-label="Zpět" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name="alt-arrow-left-linear" size={20} color={T.ink} />
            </button>
          )}
          <div style={{ width: 38, height: 38, borderRadius: 999, overflow: 'hidden', background: thread.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{thread.avatarUrl ? <img src={thread.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : thread.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 14, fontWeight: 700 }}>{thread.name}</div>
            <div style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI }}>{thread.role} · {thread.online ? <span style={{ color: '#5BD68A' }}>online</span> : 'offline'}</div>
          </div>
          <button title="Profil" onClick={() => window.empOpenProfile && window.empOpenProfile(thread.worker_id, { name: thread.name, address: thread.city, level: thread.level, jobs_done: thread.jobsDone, rating: thread.rating, verified: thread.verified, cv_url: thread.cvUrl, avatar_url: thread.avatarUrl })} style={{ padding: isMobile ? 0 : '8px 12px', width: isMobile ? 36 : 'auto', height: isMobile ? 36 : 'auto', flexShrink: 0, borderRadius: 8, background: T.primary, border: '1px solid ' + T.primary, color: '#fff', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="user-id-bold" size={13} color="#fff"/>{!isMobile && 'Profil'}
          </button>
          <button title="Nabídnout směnu" onClick={() => setShowShiftModal(true)} style={{ padding: isMobile ? 0 : '8px 12px', width: isMobile ? 36 : 'auto', height: isMobile ? 36 : 'auto', flexShrink: 0, borderRadius: 8, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.light, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="calendar-bold" size={13} color={T.light}/>{!isMobile && 'Nabídnout směnu'}
          </button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {thread.msgs.map((m, i) => {
            if (m.kind === 'shift') {
              return (
                <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ padding: 14, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,32,246,0.10), rgba(91,107,255,0.06))', border: '1px solid rgba(0,32,246,0.22)' }}>
                    <div style={{ color: T.primary, fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: T.fontUI }}>Nabídka směny</div>
                    <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, marginTop: 4 }}>{m.shift.role}</div>
                    <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 12, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div><Icon name="calendar-bold" size={11} color={T.muted}/> {m.shift.date} · {m.shift.time}</div>
                      <div><Icon name="dollar-bold" size={11} color={T.muted}/> Odhad odměny <span style={{ color: T.ink, fontWeight: 700, fontFamily: T.fontMono }}>{m.shift.pay} Kč</span></div>
                    </div>
                  </div>
                  <div style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, marginTop: 4, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.t}</div>
                </div>
              );
            }
            if (m.kind === 'interview') {
              return (
                <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ padding: 14, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,32,246,0.10), rgba(91,107,255,0.06))', border: '1px solid rgba(0,32,246,0.22)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.primary, fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: T.fontUI }}>
                      <Icon name="users-group-rounded-bold" size={12} color={T.primary}/> Pozvánka na pohovor
                    </div>
                    <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div><Icon name="calendar-bold" size={11} color={T.muted}/> {m.interview.date}{m.interview.time ? ' · ' + m.interview.time : ''}</div>
                      {m.interview.location ? <div><Icon name="map-point-bold" size={11} color={T.muted}/> {m.interview.location}</div> : null}
                      {m.interview.note ? <div style={{ color: T.muted, marginTop: 2 }}>{m.interview.note}</div> : null}
                    </div>
                  </div>
                  <div style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, marginTop: 4, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.t}</div>
                </div>
              );
            }
            const mine = m.from === 'me';
            if (m.kind === 'file') {
              const url = signedUrls[m.fileUrl];
              const bubbleBg = mine ? 'linear-gradient(135deg, #0020F6, #2D2CA7)' : '#fff';
              return (
                <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  {m.fileType === 'image' ? (
                    <a href={url || undefined} target="_blank" rel="noopener noreferrer" onClick={e => { if (!url) e.preventDefault(); }} style={{ display: 'block', borderRadius: 14, overflow: 'hidden', border: '1px solid ' + T.border, background: 'rgba(0,32,246,0.05)' }}>
                      {url ? <img src={url} alt="" style={{ display: 'block', maxWidth: 220, width: '100%', maxHeight: 280, objectFit: 'cover' }} /> : <div style={{ width: 170, height: 110, display: 'grid', placeItems: 'center', color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12 }}>Načítám…</div>}
                    </a>
                  ) : m.fileType === 'audio' ? (
                    <div style={{ padding: '9px 11px', borderRadius: 14, background: bubbleBg, border: mine ? 'none' : '1px solid ' + T.border, display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
                      {url ? <audio controls src={url} style={{ height: 32, maxWidth: 190, flex: 1 }} /> : <span style={{ color: mine ? '#fff' : T.muted, fontFamily: T.fontUI, fontSize: 12, flex: 1 }}>Načítám…</span>}
                      <span style={{ color: mine ? 'rgba(255,255,255,0.85)' : T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, flexShrink: 0 }}>{_eFmtDur(m.duration)}</span>
                    </div>
                  ) : (
                    <a href={url || undefined} target="_blank" rel="noopener noreferrer" download={m.fileName} onClick={e => { if (!url) e.preventDefault(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 14, background: bubbleBg, border: mine ? 'none' : '1px solid ' + T.border, textDecoration: 'none', minWidth: 170, maxWidth: 240 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 16, background: mine ? 'rgba(255,255,255,0.18)' : 'rgba(0,32,246,0.08)' }}>📎</span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: mine ? '#fff' : T.ink, fontFamily: T.fontHead, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.fileName || 'Soubor'}</div>
                        <div style={{ color: mine ? 'rgba(255,255,255,0.8)' : T.mutedSoft, fontFamily: T.fontUI, fontSize: 11, marginTop: 1 }}>{_eFmtSize(m.fileSize)}{url ? '' : ' · načítám…'}</div>
                      </span>
                    </a>
                  )}
                  <div style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, marginTop: 4, textAlign: mine ? 'right' : 'left' }}>{m.t}</div>
                </div>
              );
            }
            return (
              <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 14,
                  background: m.from === 'me' ? 'linear-gradient(135deg, #0020F6, #2D2CA7)' : 'rgba(0,32,246,0.05)',
                  color: m.from === 'me' ? '#fff' : T.ink, fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.45,
                  borderBottomRightRadius: m.from === 'me' ? 4 : 14,
                  borderBottomLeftRadius: m.from === 'me' ? 14 : 4,
                }}>{m.text}</div>
                <div style={{ color: T.mutedSoft, fontFamily: T.fontMono, fontSize: 10, marginTop: 4, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.t}</div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid ' + T.border, display: 'flex', gap: 8, alignItems: 'center', background: '#ffffff' }}>
          <input ref={attachInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" style={{ display: 'none' }} onChange={onPickAttach} />
          <button onClick={() => attachInputRef.current && attachInputRef.current.click()} disabled={uploadingFile} title="Příloha" style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, cursor: uploadingFile ? 'default' : 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 17 }}>
            {uploadingFile ? <span style={{ width: 16, height: 16, borderRadius: 999, border: '2.5px solid rgba(0,32,246,0.25)', borderTopColor: T.primary, display: 'inline-block', animation: 'empSpin .7s linear infinite' }} /> : '📎'}
          </button>
          <input
            placeholder="Napište zprávu…"
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 10, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.ink, fontSize: 13, outline: 'none', fontFamily: T.fontUI }}
          />
          <button onClick={handleSend} disabled={sending || !msgInput.trim()} title="Odeslat" style={{ width: 40, height: 38, borderRadius: 9, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', cursor: (sending || !msgInput.trim()) ? 'default' : 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0, opacity: (sending || !msgInput.trim()) ? 0.5 : 1 }}>
            <Icon name="plain-bold" size={16} color="#fff"/>
          </button>
        </div>

        {/* Quick replies */}
        <div style={{ padding: '0 16px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', background: '#ffffff' }}>
          {['Nabídnout směnu','Pozvat na pohovor','Zaslat pravidla','Bohužel ne'].map(q => (
            <button key={q} onClick={() => {
              if (q === 'Nabídnout směnu') { setShowShiftModal(true); return; }
              if (q === 'Pozvat na pohovor') { setShowInterviewModal(true); return; }
              if (q === 'Zaslat pravidla') {
                const rules = ((typeof EPROFILE !== 'undefined' && EPROFILE.chat_rules) || '').trim();
                if (!rules) {
                  window.empToast && window.empToast('Pravidla nejsou nastavená', 'Nastav si vlastní text v Nastavení → Pravidla do chatu a pak ho odešleš jedním klikem.', 'ℹ️', 'info');
                  window.empGoTab && window.empGoTab('settings');
                  return;
                }
                sendQuickText(rules);
                return;
              }
              if (q === 'Bohužel ne') {
                setMsgInput('Děkujeme za váš zájem o tuto pozici! Tentokrát jsme se rozhodli pro jiného kandidáta. Budeme rádi, když se ozvete na naše další nabídky. 🙏');
                return;
              }
              setMsgInput(q);
            }} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{q}</button>
          ))}
        </div>
      </main>

      {/* Right: candidate context — na mobilu skryto (profil dostupný přes tlačítko) */}
      <aside style={{ width: 280, flexShrink: 0, borderLeft: '1px solid ' + T.border, padding: 20, overflowY: 'auto', background: '#ffffff', display: isMobile ? 'none' : 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 24, margin: '0 auto', overflow: 'hidden', background: 'linear-gradient(160deg, rgba(255,255,255,0.30), rgba(255,255,255,0)), ' + thread.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 28, boxShadow: '0 10px 24px rgba(20,22,40,0.14)' }}>{thread.avatarUrl ? <img src={thread.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : thread.avatar}</div>
          <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 18, fontWeight: 800, marginTop: 12 }}>{thread.name}</div>
          <div style={{ color: T.muted, fontSize: 12.5, fontFamily: T.fontUI, marginTop: 3 }}>{[thread.city, thread.role].filter(Boolean).join(' · ') || 'Brigádník'}</div>
          <div style={{ display: 'inline-flex', gap: 6, marginTop: 10 }}>
            <span style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(0,32,246,0.10)', color: T.primary, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 800 }}>Level {thread.level || 1}</span>
            {thread.verified && <span style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(34,160,107,0.14)', color: '#16a34a', fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 800 }}>Ověřený</span>}
          </div>
        </div>

        {/* Stats — jednoduché karty */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 22 }}>
          {[
            { l: 'hodnocení', v: Number(thread.rating) > 0 ? thread.rating : '–', star: Number(thread.rating) > 0 },
            { l: 'brigád', v: thread.jobsDone || 0, star: false },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px 12px', borderRadius: 16, background: T.surfaceAlt, border: '1px solid ' + T.border, textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: T.ink, fontFamily: T.fontHead, fontSize: 21, fontWeight: 800, lineHeight: 1 }}>
                {s.v}{s.star && <Icon name="star-bold" size={15} color="#F5A623" />}
              </div>
              <div style={{ color: T.mutedSoft, fontSize: 11, fontWeight: 600, marginTop: 6, fontFamily: T.fontUI }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Životopis */}
        <div style={{ color: T.mutedSoft, fontSize: 10.5, fontWeight: 800, fontFamily: T.fontUI, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Životopis</div>
        {thread.cvUrl ? (
          <a href={thread.cvUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, background: T.surfaceAlt, border: '1px solid ' + T.border, marginBottom: 20, textDecoration: 'none' }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(0,32,246,0.08)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="document-text-bold" size={16} color={T.primary}/></span>
            <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600 }}>Otevřít životopis</div>
          </a>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, background: 'transparent', border: '1.5px dashed ' + T.border, marginBottom: 20 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(15,18,40,0.04)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="document-text-bold" size={16} color={T.mutedSoft}/></span>
            <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12.5, fontStyle: 'italic' }}>Bez životopisu</div>
          </div>
        )}

        {/* Dovednosti */}
        {Array.isArray(thread.skills) && thread.skills.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: T.mutedSoft, fontSize: 10.5, fontWeight: 800, fontFamily: T.fontUI, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Dovednosti</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {thread.skills.map((sk, i) => (
                <span key={i} style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.border, color: T.ink, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600 }}>{sk}</span>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => window.empOpenProfile && window.empOpenProfile(thread.worker_id, { name: thread.name, address: thread.city, level: thread.level, jobs_done: thread.jobsDone, rating: thread.rating, verified: thread.verified, cv_url: thread.cvUrl, avatar_url: thread.avatarUrl })} style={{ width: '100%', marginTop: 'auto', padding: '13px 12px', borderRadius: 12, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Otevřít plný profil + recenze →</button>
      </aside>

      {/* Shift offer modal */}
      {showShiftModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowShiftModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 200 }}>
          <div style={{ background: '#ffffff', border: '1px solid ' + T.border, borderRadius: 18, padding: 28, width: 380, maxWidth: "calc(100vw - 32px)", position: 'relative' }}>
            <button onClick={() => setShowShiftModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(208,208,255,.08)', border: 'none', borderRadius: 8, padding: 6, color: T.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Nabídnout směnu</div>
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
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(208,208,255,.14)', color: T.ink, fontSize: 13, outline: 'none', fontFamily: T.fontUI, boxSizing: 'border-box' }}
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

      {/* Interview offer modal */}
      {showInterviewModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowInterviewModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 200 }}>
          <div style={{ background: '#ffffff', border: '1px solid ' + T.border, borderRadius: 18, padding: 28, width: 380, maxWidth: "calc(100vw - 32px)", position: 'relative' }}>
            <button onClick={() => setShowInterviewModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(208,208,255,.08)', border: 'none', borderRadius: 8, padding: 6, color: T.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Pozvat na pohovor</div>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 12, marginBottom: 20 }}>Pozvánka se odešle jako zpráva. Je to jen pohovor — inzerát zůstává aktivní.</div>
            {[
              { label: 'Datum', key: 'date', placeholder: 'např. Čt 15.5.', type: 'text' },
              { label: 'Čas', key: 'time', placeholder: 'např. 14:00', type: 'text' },
              { label: 'Místo / online odkaz', key: 'location', placeholder: 'např. Náměstí Míru 3, Praha 2 nebo Google Meet', type: 'text' },
              { label: 'Poznámka (nepovinné)', key: 'note', placeholder: 'např. Vezmi si s sebou OP, potrvá cca 20 min', type: 'text' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{field.label}</div>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={interviewForm[field.key]}
                  onChange={e => setInterviewForm(f => ({ ...f, [field.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(208,208,255,.14)', color: T.ink, fontSize: 13, outline: 'none', fontFamily: T.fontUI, boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <button
              onClick={handleSendInterview}
              disabled={!interviewForm.date || !interviewForm.time}
              style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', fontFamily: T.fontHead, fontSize: 14, fontWeight: 800, cursor: (!interviewForm.date || !interviewForm.time) ? 'not-allowed' : 'pointer', opacity: (!interviewForm.date || !interviewForm.time) ? 0.5 : 1, marginTop: 4 }}>
              Odeslat pozvánku na pohovor
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
        {/* Přepnout účet + Odhlásit se */}
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid ' + T.border }}>
          <button onClick={() => window.location.reload()} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 9, width: '100%', marginBottom: 4,
            background: 'transparent', border: '1px solid transparent',
            color: T.muted, cursor: 'pointer', textAlign: 'left',
            fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,32,246,0.08)'; e.currentTarget.style.color = T.primary; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.muted; }}>
            <Icon name="refresh-square-bold" size={14} color="currentColor"/>
            Přepnout účet / firmu
          </button>
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

const TEAM_ROLES = { admin: 'Admin', recruiter: 'Náborář', accountant: 'Účetní', viewer: 'Jen ke čtení' };

function ETeamTab() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px' }}>
      <div style={{ maxWidth: 760 }}>
        <SettingsTeam />
      </div>
    </div>
  );
}

function SettingsTeam() {
  const entitled = (typeof can !== 'function') || can('teamRoles');
  const [members, setMembers] = useStateE(() => (typeof E_TEAM !== 'undefined' ? [...E_TEAM] : []));
  const [email, setEmail] = useStateE('');
  const [busy,  setBusy]  = useStateE(false);
  const [err,   setErr]   = useStateE('');
  const [newLink, setNewLink] = useStateE('');
  const [copied,  setCopied]  = useStateE('');

  useEffectE(() => {
    if (!entitled) return;
    const id = window._makejActingId;
    if (id) fetchTeamE(id).then(() => setMembers([...E_TEAM]));
  }, []);

  if (!entitled) {
    return (
      <div style={{ padding: '28px 4px' }}>
        <div style={{ maxWidth: 460, padding: 28, borderRadius: 16, background: '#fff', border: '1px solid ' + T.border, boxShadow: '0 6px 20px rgba(15,18,40,0.06)', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(0,32,246,0.08)', border: '1px solid rgba(0,32,246,0.18)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <Icon name="users-group-two-rounded-bold" size={28} color={T.primary} />
          </div>
          <div style={{ fontFamily: T.fontHead, fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 8 }}>Tým je v tarifu Business</div>
          <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>Přizvi kolegy pozvacím odkazem a spravujte nábor společně z jednoho účtu.</div>
          <button onClick={() => window.empGoTab && window.empGoTab('pricing')} style={{ padding: '11px 22px', borderRadius: 11, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', fontFamily: T.fontUI, fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>Zobrazit tarify</button>
        </div>
      </div>
    );
  }

  async function createLink() {
    setBusy(true); setErr(''); setNewLink('');
    const r = await createTeamInviteE(email);
    setBusy(false);
    if (!r.ok) { setErr(r.msg); return; }
    setEmail(''); setMembers([...E_TEAM]); setNewLink(r.link || '');
  }
  async function remove(id) { const ok = await removeTeamMemberE(id); if (ok) setMembers([...E_TEAM]); }
  function copy(text, key) { try { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1800); } catch (e) {} }
  function linkFor(m) { return (typeof _teamInviteLink === 'function') ? _teamInviteLink(m.invite_token) : ''; }

  const copyBtn = (text, key, label) => (
    <button onClick={() => copy(text, key)} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.border, color: T.primary, cursor: 'pointer', fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{copied === key ? '✓ Zkopírováno' : (label || 'Kopírovat odkaz')}</button>
  );

  return (
    <div>
      <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 12.5, marginBottom: 18, lineHeight: 1.6 }}>
        Vytvoř pozvací odkaz a pošli ho kolegovi. Kolega si založí (nebo má) vlastní účet, klikne na odkaz — a účty se spárují. Po přihlášení si pak vybere, jestli jde na svůj účet, nebo do téhle firmy.
      </div>

      {/* Vytvořit odkaz */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: 8, flexWrap: 'wrap' }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="kolega@firma.cz (nepovinné — jen pro tvůj přehled)" type="email"
          style={{ flex: 1, minWidth: 220, padding: '10px 12px', borderRadius: 9, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.ink, fontFamily: T.fontUI, fontSize: 13, outline: 'none' }} />
        <button onClick={createLink} disabled={busy} style={{ padding: '10px 18px', borderRadius: 9, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="link-round-bold" size={14} color="#fff"/>{busy ? 'Vytvářím…' : 'Vytvořit pozvací odkaz'}</button>
      </div>
      {err && <div style={{ color: '#f43f5e', fontFamily: T.fontUI, fontSize: 12, marginBottom: 8 }}>{err}</div>}

      {/* Nově vytvořený odkaz */}
      {newLink && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: 'rgba(34,160,107,0.07)', border: '1px solid rgba(34,160,107,0.3)', marginBottom: 12 }}>
          <Icon name="link-round-bold" size={15} color="#16a34a" />
          <div style={{ flex: 1, minWidth: 0, color: T.ink, fontFamily: T.fontMono, fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{newLink}</div>
          {copyBtn(newLink, 'new', 'Kopírovat')}
        </div>
      )}

      {/* Členové + čekající pozvánky */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.length === 0 ? (
          <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12.5, fontStyle: 'italic', padding: '10px 0' }}>Zatím žádný člen ani pozvánka.</div>
        ) : members.map(m => {
          const active = !!m.member_id;
          const name = (m.member && (m.member.name || m.member.company_name)) || m.email || 'Čekající pozvánka';
          const initial = (name[0] || '?').toUpperCase();
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12, background: '#fff', border: '1px solid ' + T.border }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: active ? _strColorSafe(name) : 'rgba(15,18,40,0.10)', display: 'grid', placeItems: 'center', color: active ? '#fff' : T.mutedSoft, fontFamily: T.fontHead, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{active ? initial : '⏳'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ color: active ? '#16a34a' : T.muted, fontFamily: T.fontUI, fontSize: 11, marginTop: 1 }}>{active ? 'Člen týmu · aktivní' : 'Čeká na přijetí pozvánky'}</div>
              </div>
              {!active && copyBtn(linkFor(m), m.id, 'Kopírovat odkaz')}
              <button onClick={() => remove(m.id)} style={{ padding: '6px 10px', borderRadius: 8, background: 'transparent', border: '1px solid ' + T.border, color: '#f43f5e', cursor: 'pointer', fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 700 }}>{active ? 'Odebrat' : 'Zrušit'}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function _strColorSafe(s) {
  const palette = ['#5B6BFF', '#0020F6', '#8AB4FF', '#5BD68A', '#F5A623', '#9B59D0'];
  let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function FormRow({ label, sub, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, padding: '14px 0', borderBottom: '1px solid ' + T.border, alignItems: 'flex-start' }}>
      <div>
        <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700 }}>{label}</div>
        {sub ? <div style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI, marginTop: 3 }}>{sub}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'rgba(0,0,0,0.3)', border: '1px solid ' + T.border,
  color: T.ink, fontFamily: T.fontUI, fontSize: 13, outline: 'none',
};

// ── Pomocné prvky profilu ──────────────────────────────────────────────────
const INDUSTRIES = ['Gastro / restaurace', 'Kavárna', 'Maloobchod', 'Sklad / logistika', 'Eventy / catering', 'Hotelnictví', 'Výroba', 'Úklid', 'Administrativa', 'Jiné'];
const SOCIAL_FIELDS = [
  { k: 'instagram', icon: 'instagram', ph: 'instagram.com/firma' },
  { k: 'facebook',  icon: 'facebook',  ph: 'facebook.com/firma' },
  { k: 'linkedin',  icon: 'linkedin',  ph: 'linkedin.com/company/firma' },
  { k: 'tiktok',    icon: 'tiktok',    ph: 'tiktok.com/@firma' },
];

function ImageField({ label, sub, value, onChange, onUpload, fallback, color }) {
  const inputRef = React.useRef(null);
  const [up, setUp] = React.useState(false);
  async function pick(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !onUpload) return;
    setUp(true);
    const url = await onUpload(file);
    setUp(false);
    if (url) onChange({ target: { value: url } });
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid ' + T.border }}>
      <div style={{ width: 64, height: 64, borderRadius: 14, flexShrink: 0, overflow: 'hidden', background: (color || T.primary) + '22', border: '1px solid ' + (color || T.primary) + '55', display: 'grid', placeItems: 'center', color: color || T.light, fontFamily: T.fontHead, fontWeight: 800, fontSize: 20 }}>
        {value ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : fallback}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 14.5, fontWeight: 800 }}>{label}</div>
        <div style={{ color: T.muted, fontSize: 11, fontFamily: T.fontUI, margin: '2px 0 8px' }}>{sub}</div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pick} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={up} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.border, color: T.primary, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, cursor: up ? 'default' : 'pointer' }}>
            <Icon name="camera-bold" size={14} color={T.primary} />
            {up ? 'Nahrávám…' : (value ? 'Změnit' : 'Nahrát obrázek')}
          </button>
          {value && <button type="button" onClick={() => onChange({ target: { value: '' } })} style={{ background: 'none', border: 'none', color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12, cursor: 'pointer' }}>Odebrat</button>}
        </div>
      </div>
    </div>
  );
}

function Stars({ n }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => <Icon key={i} name={i <= n ? 'star-bold' : 'star-line-duotone'} size={13} color={i <= n ? T.super : T.mutedSoft} />)}
    </span>
  );
}

function SettingsProfile() {
  const initForm = () => ({
    company_name: EPROFILE.company_name || ECOMPANY.name || '',
    ic:        EPROFILE.ic || '',
    industry:  EPROFILE.industry || '',
    bio:       EPROFILE.bio || '',
    chat_rules: EPROFILE.chat_rules || '',
    website:   EPROFILE.website || '',
    address:   EPROFILE.address || '',
    avatar_url: EPROFILE.avatar_url || '',
    logo_url:  EPROFILE.logo_url || '',
    socials:   Object.assign({ instagram: '', facebook: '', linkedin: '', tiktok: '' }, EPROFILE.socials || {}),
    photos:    Array.isArray(EPROFILE.photos) ? EPROFILE.photos.slice() : [],
    branding:  Object.assign({ color: ECOMPANY.logoColor || T.primary }, EPROFILE.branding || {}),
  });
  const [form, setForm]     = useStateE(initForm);
  const [saving, setSaving] = useStateE(false);
  const [toast, setToast]   = useStateE(null);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setSocial = k => e => setForm(f => ({ ...f, socials: { ...f.socials, [k]: e.target.value } }));
  const setPhoto  = (i, v) => setForm(f => { const p = f.photos.slice(); p[i] = v; return { ...f, photos: p }; });
  const addPhoto  = () => setForm(f => ({ ...f, photos: [...f.photos, ''] }));
  const rmPhoto   = i => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }));
  const [uploadingCompanyPhoto, setUploadingCompanyPhoto] = useStateE(false);
  const companyPhotoRef = useRefE(null);

  async function _uploadImg(prefix, file, maxDim) {
    const { data: { session } } = await sb.auth.getSession();
    const uid = session && session.user ? session.user.id : null;
    if (!uid || typeof uploadImageE !== 'function') return null;
    return uploadImageE(uid, prefix, file, maxDim);
  }
  async function handleCompanyPhotos(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setUploadingCompanyPhoto(true);
    for (const file of files.slice(0, 8)) {
      const url = await _uploadImg('company', file, 1600);
      if (url) setForm(f => ({ ...f, photos: [...f.photos.filter(Boolean), url].slice(0, 8) }));
    }
    setUploadingCompanyPhoto(false);
  }

  async function handleSave() {
    setSaving(true);
    const ok = await updateEmployerProfile({
      company_name: form.company_name,
      ic: form.ic, industry: form.industry, bio: form.bio,
      chat_rules: form.chat_rules,
      website: form.website, address: form.address,
      avatar_url: form.avatar_url, logo_url: form.logo_url,
      socials: form.socials,
      photos: form.photos.filter(u => u && u.trim()),
      branding: form.branding,
    });
    setSaving(false);
    setToast(ok ? 'ok' : 'err');
    setTimeout(() => setToast(null), 2500);
  }

  const verified   = !!EPROFILE.verified;
  const mapsUrl    = form.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(form.address) : null;
  const mapEmbed   = form.address ? 'https://maps.google.com/maps?q=' + encodeURIComponent(form.address) + '&z=14&output=embed' : null;
  const activeJobs = (typeof E_JOBS !== 'undefined' ? E_JOBS : []).filter(j => j.status === 'active' || j.status === 'urgent');
  const reviews    = (typeof E_REVIEWS !== 'undefined' ? E_REVIEWS : []);
  const avgRating  = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <ECard>
        <SectionHeader title="Firemní profil" subtitle="Tyto informace vidí kandidáti na profilu vaší firmy" />
        {toast === 'ok' && (
          <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(91,214,138,0.18)', border: '1px solid rgba(91,214,138,0.35)', color: '#5BD68A', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>✓ Profil uložen</div>
        )}
        {toast === 'err' && (
          <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>Chyba při ukládání</div>
        )}

        {/* Ověřeno */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14, borderBottom: '1px solid ' + T.border }}>
          {verified ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(0,32,246,0.16)', border: '1px solid rgba(91,107,255,0.5)', color: '#8AB4FF', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700 }}>
              <Icon name="verified-check-bold" size={14} color="#5B6BFF" /> Ověřená firma
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.muted, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600 }}>
              <Icon name="shield-warning-bold" size={14} color={T.muted} /> Neověřeno — kontaktuj podporu pro ověření
            </span>
          )}
        </div>

        {/* Logo + profilovka */}
        <ImageField label="Logo firmy" sub="Čtvercové, ideálně 256×256" value={form.logo_url} onChange={set('logo_url')} onUpload={f => _uploadImg('logo', f, 512)} fallback={ECOMPANY.logo} color={form.branding.color} />
        <ImageField label="Profilová fotka" sub="Hlavní fotka profilu (např. provozovna)" value={form.avatar_url} onChange={set('avatar_url')} onUpload={f => _uploadImg('avatar', f, 1200)} fallback={<Icon name="camera-bold" size={22} color={T.muted} />} color={form.branding.color} />

        {/* Základní info */}
        <FormRow label="Název firmy">
          <input style={inputStyle} value={form.company_name} onChange={set('company_name')} />
        </FormRow>
        <FormRow label="IČ" sub="Identifikační číslo firmy">
          <input style={inputStyle} value={form.ic} onChange={set('ic')} placeholder="např. 12345678" inputMode="numeric" />
        </FormRow>
        <FormRow label="Odvětví">
          <select style={{ ...inputStyle, appearance: 'auto' }} value={form.industry} onChange={set('industry')}>
            <option value="">Vyber odvětví…</option>
            {INDUSTRIES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </FormRow>
        <FormRow label="Krátký popis" sub="Max. 280 znaků — vidí se v kartě firmy">
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: T.fontUI }} value={form.bio} onChange={set('bio')} maxLength={280} placeholder="Napiš něco o firmě…" />
        </FormRow>
        <FormRow label="Pravidla do chatu" sub="Tvůj vlastní text — pošleš ho brigádníkovi jedním klikem přes tlačítko Zaslat pravidla v chatu">
          <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical', fontFamily: T.fontUI }} value={form.chat_rules} onChange={set('chat_rules')} placeholder={'Např.:\n• Dochvilnost je základ — přijď 10 min předem.\n• Dress code: černé triko, pohodlná obuv.\n• Vezmi si OP a číslo účtu.\n• Kontakt na místě: Jana, 777 123 456.'} />
        </FormRow>

        {/* Kontakt */}
        <FormRow label="Web">
          <input style={inputStyle} value={form.website} onChange={set('website')} placeholder="https://www.firma.cz" />
        </FormRow>
        <FormRow label="Adresa firmy" sub="Zobrazí se na mapě v profilu">
          <input style={inputStyle} value={form.address} onChange={set('address')} placeholder="Náměstí Míru 3, Praha 2" />
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 7, color: '#8AB4FF', fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600, textDecoration: 'none' }}>
              <Icon name="map-point-bold" size={13} color="#8AB4FF" /> Zobrazit na mapě
            </a>
          )}
          {mapEmbed && (
            <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', border: '1px solid ' + T.border }}>
              <iframe title="mapa" src={mapEmbed} style={{ width: '100%', height: 150, border: 0, display: 'block', filter: 'grayscale(0.3) invert(0.9) hue-rotate(180deg)' }} loading="lazy"></iframe>
            </div>
          )}
        </FormRow>

        {/* Sociální sítě */}
        <FormRow label="Sociální sítě" sub="Odkazy na vaše profily">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SOCIAL_FIELDS.map(s => (
              <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 8, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, display: 'grid', placeItems: 'center' }}>
                  <Icon name={s.icon} size={15} color={T.light} />
                </span>
                <input style={{ ...inputStyle, fontSize: 12 }} value={form.socials[s.k] || ''} onChange={setSocial(s.k)} placeholder={s.ph} />
              </div>
            ))}
          </div>
        </FormRow>

        {/* Bonusové fotky */}
        <FormRow label="Bonusové fotky" sub="Galerie na profilu firmy — nahraj fotky provozovny, týmu…">
          <input ref={companyPhotoRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleCompanyPhotos} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {form.photos.filter(Boolean).map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 84, height: 84, borderRadius: 10, overflow: 'hidden', border: '1px solid ' + T.border }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                <button type="button" onClick={() => rmPhoto(i)} style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 999, background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, lineHeight: 1, display: 'grid', placeItems: 'center' }}>✕</button>
              </div>
            ))}
            {form.photos.filter(Boolean).length < 8 && (
              <button type="button" onClick={() => companyPhotoRef.current && companyPhotoRef.current.click()} disabled={uploadingCompanyPhoto} style={{ width: 84, height: 84, borderRadius: 10, border: '1.5px dashed ' + T.border, background: 'rgba(0,32,246,0.04)', color: T.primary, cursor: uploadingCompanyPhoto ? 'default' : 'pointer', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 300 }}>
                {uploadingCompanyPhoto ? <span style={{ width: 18, height: 18, borderRadius: 999, border: '2.5px solid rgba(0,32,246,0.25)', borderTopColor: T.primary, display: 'inline-block', animation: 'empSpin .7s linear infinite' }} /> : '+'}
              </button>
            )}
          </div>
        </FormRow>

        {/* Branding */}
        <FormRow label="Barva značky" sub="Branding — akcent na profilu firmy">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={form.branding.color} onChange={e => setForm(f => ({ ...f, branding: { ...f.branding, color: e.target.value } }))} style={{ width: 44, height: 36, padding: 0, borderRadius: 8, border: '1px solid ' + T.border, background: 'transparent', cursor: 'pointer' }} />
            <input style={{ ...inputStyle, maxWidth: 130, fontFamily: T.fontMono }} value={form.branding.color} onChange={e => setForm(f => ({ ...f, branding: { ...f.branding, color: e.target.value } }))} />
          </div>
        </FormRow>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16 }}>
          <button onClick={() => setForm(initForm())} disabled={saving} style={{ padding: '9px 16px', borderRadius: 8, background: 'transparent', border: '1px solid ' + T.border, color: T.muted, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>Zrušit</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Ukládám…' : 'Uložit změny'}</button>
        </div>
      </ECard>

      {/* Aktivní inzeráty */}
      <ECard>
        <SectionHeader title="Aktivní inzeráty" subtitle={activeJobs.length + ' aktivních na profilu'} />
        {activeJobs.length === 0 ? (
          <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12.5, padding: '8px 0' }}>Žádné aktivní inzeráty.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activeJobs.map((j, i) => (
              <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < activeJobs.length - 1 ? '1px solid ' + T.border : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: j.status === 'urgent' ? '#f43f5e' : '#5BD68A' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                  <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, marginTop: 2 }}>
                    {j.status === 'urgent' ? 'Spěchá' : 'Aktivní'}{j.location ? ' · ' + j.location : ''}{j.matches ? ' · ' + j.matches + ' kandidátů' : ''}
                  </div>
                </div>
                <div style={{ flexShrink: 0, color: T.light, fontFamily: T.fontMono, fontSize: 13, fontWeight: 700 }}>{j.pay} {j.payUnit || 'Kč/h'}</div>
              </div>
            ))}
          </div>
        )}
      </ECard>

      {/* Recenze */}
      <ECard>
        <SectionHeader title="Recenze" subtitle={avgRating ? avgRating + ' ★ průměr · ' + reviews.length + ' hodnocení' : 'Zatím bez recenzí'} />
        {reviews.length === 0 ? (
          <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12.5, padding: '8px 0' }}>Zatím žádné recenze.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {reviews.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: i < reviews.length - 1 ? '1px solid ' + T.border : 'none' }}>
                <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 999, background: (r.color || T.primary) + '22', border: '1px solid ' + (r.color || T.primary) + '55', display: 'grid', placeItems: 'center', color: r.color || T.light, fontFamily: T.fontHead, fontWeight: 800, fontSize: 13 }}>{r.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{r.author}</span>
                    <span style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 11 }}>{r.when}</span>
                  </div>
                  <div style={{ margin: '3px 0 5px' }}><Stars n={r.rating} /></div>
                  {r.text && <div style={{ color: T.light, fontFamily: T.fontUI, fontSize: 12.5, lineHeight: 1.5 }}>{r.text}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </ECard>
    </div>
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
            <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{r.l}</div>
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
            <span style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, padding: '6px 10px', borderRadius: 7, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border }}>{r.v}</span>
            <button onClick={() => window.empToast && window.empToast('Nastavení soukromí', 'Úpravu těchto pravidel připravujeme.', '🔒', 'info')} style={{ padding: '6px 12px', borderRadius: 7, background: 'transparent', border: '1px solid ' + T.border, color: T.muted, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Změnit</button>
          </div>
        </FormRow>
      ))}
      <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: 'rgba(91,107,255,0.08)', border: '1px solid rgba(91,107,255,0.2)' }}>
        <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700 }}>Export všech dat</div>
        <div style={{ color: T.muted, fontSize: 11.5, fontFamily: T.fontUI, marginTop: 4 }}>Stáhněte JSON se všemi inzeráty, kandidáty a zprávami. Zpracování trvá ~10 minut.</div>
        <button onClick={() => {
          const data = {
            exportoval: ECOMPANY.name, datum: new Date().toISOString(),
            inzeraty: E_JOBS, kandidati: E_CANDIDATES, zpravy: E_THREADS, recenze: E_REVIEWS,
          };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'makej-export-' + new Date().toISOString().slice(0, 10) + '.json';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          if (window.empToast) window.empToast('Export hotový', 'Všechna data stažena jako JSON.', '📦', 'success');
        }} style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.border, color: T.ink, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Vyžádat export</button>
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
            <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{r.l}</div>
            <div style={{ color: T.muted, fontSize: 11.5, fontFamily: T.fontUI, marginTop: 3 }}>{r.s}</div>
          </div>
          <button onClick={async () => {
            if (r.cta === 'Smazat účet') {
              if (!window.confirm('Opravdu trvale smazat účet a všechna data? Tuto akci nelze vrátit.')) return;
              const { error } = await sb.rpc('delete_my_account');
              if (error) { if (window.empToast) window.empToast('Chyba', 'Účet se nepodařilo smazat.', '⚠️', 'error'); return; }
              await sb.auth.signOut();
              location.reload();
            } else {
              if (window.empToast) window.empToast(r.l, 'Tuto akci připravujeme — ozvi se na podpora@makej.eu.', '⚙️', 'info');
            }
          }} style={{ padding: '9px 14px', borderRadius: 8, background: 'transparent', border: '1px solid ' + r.tone + '66', color: r.tone, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{r.cta}</button>
        </div>
      ))}
    </ECard>
  );
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// CENÍK / TARIFY  (design převzat z Yasinova dashboardu; handlePay ukládá do DB)
// ─────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: 0, free: true, period: 'navždy zdarma',
    color: '#8AB4FF', icon: 'hand-shake-bold',
    features: [
      { ok: true,  text: '1 aktivní inzerát' },
      { ok: true,  text: '1 full-time inzerce' },
      { ok: true,  text: 'Oslovování brigádníků (1×/měs)' },
      { ok: true,  text: 'Základní statistiky' },
    ],
    more: [
      { ok: false, text: 'Topování inzerátu' },
      { ok: false, text: 'Ověřená firma' },
      { ok: false, text: 'SMS Urgent' },
      { ok: false, text: 'Pokročilá analytika' },
      { ok: false, text: 'Prémiový badge' },
      { ok: false, text: 'Export dat (CSV)' },
    ],
    cta: 'Začít zdarma', contact: false,
  },
  {
    id: 'standard', name: 'Standard', price: 499, annualPrice: 424, period: 'za měsíc bez DPH',
    color: '#5B6BFF', icon: 'bolt-bold', badge: 'Nejoblíbenější', popular: true,
    features: [
      { ok: true,  text: '2 aktivní inzeráty' },
      { ok: true,  text: 'Topování inzerátu (1×/měs)' },
      { ok: true,  text: 'Ověřená firma + branding' },
      { ok: true,  text: 'Oslovování brigádníků (10×/měs)' },
    ],
    more: [
      { ok: true,  text: 'Plné statistiky + CSV export' },
      { ok: true,  text: 'Šablony inzerátů' },
      { ok: true,  text: 'Video na profilu' },
      { ok: false, text: 'SMS Urgent' },
      { ok: false, text: 'Prémiový badge' },
      { ok: false, text: 'Pokročilá analytika' },
    ],
    cta: 'Vybrat Standard', contact: false,
  },
  {
    id: 'business', name: 'Business', price: 4999, annualPrice: 4249, period: 'za měsíc bez DPH',
    color: '#FFD166', icon: 'crown-star-bold',
    features: [
      { ok: true,  text: '10 aktivních inzerátů' },
      { ok: true,  text: 'Topování inzerátu (5×/měs)' },
      { ok: true,  text: 'SMS Urgent + prémiový badge' },
      { ok: true,  text: 'Oslovování brigádníků (100×/měs)' },
    ],
    more: [
      { ok: true,  text: 'Pokročilá analytika' },
      { ok: true,  text: 'Zmínka na FB + IG Makej' },
      { ok: true,  text: 'Role uživatelů' },
      { ok: true,  text: 'Plánování inzerátu' },
      { ok: true,  text: 'Možnost konzultace' },
    ],
    cta: 'Vybrat Business', contact: false,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 9999, pricePrefix: 'od ', period: 'kalkulace na míru',
    color: '#E0B0FF', icon: 'buildings-2-bold',
    features: [
      { ok: true,  text: 'Vše z Business' },
      { ok: true,  text: 'Custom integrace (HR systémy)' },
      { ok: true,  text: 'Co-marketing s Makej' },
      { ok: true,  text: 'Vlastní reporting na míru' },
    ],
    more: [
      { ok: true,  text: 'Neomezení uživatelé v týmu' },
      { ok: true,  text: 'Onboarding a školení týmu' },
      { ok: true,  text: 'SLA 99,99 % + prioritní podpora' },
      { ok: true,  text: 'Dedikovaný account manager' },
    ],
    cta: 'Nezávazná poptávka', contact: true,
  },
];

// Řádek jedné vlastnosti tarifu (styl z webového ceníku)
function PlanFeat({ f }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, textAlign: 'left' }}>
      <Icon name={f.ok ? 'check-circle-bold' : 'close-circle-bold'} size={15} color={f.ok ? '#5B6BFF' : '#D1D5DB'} />
      <span style={{ color: f.ok ? '#374151' : '#9CA3AF', fontSize: 12.5, fontWeight: 600, fontFamily: T.fontUI, lineHeight: 1.35 }}>{f.text}</span>
    </div>
  );
}

function animatePrice(el, from, to) {
  if (!el) return;
  var start = performance.now(), dur = 480;
  function step(now) {
    var t = Math.min((now - start) / dur, 1);
    var eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (to - from) * eased).toLocaleString('cs-CZ');
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function EPricing({ onTab, onPlanChange }) {
  const [selected, setSelected] = useStateE(null);
  const [success, setSuccess]   = useStateE(false);
  const [hovered, setHovered]   = useStateE(null);
  const [annual, setAnnual]     = useStateE(false);
  const [expanded, setExpanded] = useStateE({});
  const priceRefs               = useRefE({});

  useEffectE(() => {
    PLANS.forEach(plan => {
      if (!plan.annualPrice) return;
      const el = priceRefs.current[plan.id];
      const from = annual ? plan.price : plan.annualPrice;
      const to   = annual ? plan.annualPrice : plan.price;
      animatePrice(el, from, to);
    });
  }, [annual]);

  const currentPlanId = (() => {
    const planName = (ECOMPANY.plan || '').toLowerCase();
    if (planName.includes('enterprise')) return 'enterprise';
    if (planName.includes('business') || planName.includes('premium')) return 'business';
    if (planName.includes('standard')) return 'standard';
    return 'starter';
  })();

  function handleSelect(planId) {
    if (planId === currentPlanId) return;
    setSelected(planId);
  }

  async function handlePay() {
    const plan = PLANS.find(p => p.id === selected);
    if (plan) {
      ECOMPANY.plan = plan.name;
      if (typeof EPROFILE !== 'undefined') EPROFILE.plan = plan.id;
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (session) await sb.from('profiles').update({ plan: plan.id }).eq('id', window._makejActingId || session.user.id);
      } catch (e) { console.error('Uložení tarifu selhalo:', e); }
      if (onPlanChange) onPlanChange(plan.name);
    }
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setSelected(null); }, 3000);
  }

  return (
    <div style={{ padding: '28px 32px 48px', overflowY: 'auto', background: '#fff', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontFamily: T.fontHead, fontSize: 28, fontWeight: 900, color: '#111827', marginBottom: 8 }}>Vyber si svůj plán</div>
        <div style={{ color: '#6B7280', fontFamily: T.fontUI, fontSize: 14, marginBottom: 20 }}>Bez závazků. Zrušení kdykoliv.</div>
        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 99, padding: '6px 16px' }}>
            <span style={{ color: annual ? '#9CA3AF' : '#111827', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, transition: 'color .2s' }}>Měsíčně</span>
            <div
              onClick={() => setAnnual(a => !a)}
              style={{ width: 44, height: 24, borderRadius: 999, background: annual ? '#5BD68A' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 3, left: annual ? 23 : 3, width: 18, height: 18, borderRadius: 999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
            </div>
            <span style={{ color: annual ? '#111827' : '#9CA3AF', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, transition: 'color .2s' }}>Ročně</span>
          </div>
          <div style={{ height: 26, display: 'flex', alignItems: 'center' }}>
            <span style={{ background: 'rgba(0,246,10,0.12)', border: '1px solid rgba(0,246,10,0.3)', color: '#00f60a', fontFamily: T.fontUI, fontSize: 11, fontWeight: 800, borderRadius: 10, padding: '4px 12px', opacity: annual ? 1 : 0, transition: 'opacity .2s' }}>chci šetřit</span>
          </div>
        </div>
      </div>

      {/* Plans grid — vizuál & efekty z webového ceníku */}
      <div style={{ maxWidth: 1180, margin: '0 auto 30px', paddingBottom: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, alignItems: 'stretch', padding: '20px 4px 8px' }}>
          {PLANS.map((plan, i) => {
            const isActive = plan.id === currentPlanId;
            const isPop    = !!plan.popular;
            const isSel    = selected === plan.id;
            const isHov    = hovered === plan.id;
            const isExp    = !!expanded[plan.id];
            const lift     = isSel || isHov;
            return (
              <div key={plan.id}
                onClick={() => !plan.contact && handleSelect(plan.id)}
                onMouseEnter={() => setHovered(plan.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column', textAlign: 'center',
                  borderRadius: 20,
                  border: isPop ? '2px solid #0020F6' : ('1.5px solid ' + (isActive ? plan.color : lift ? plan.color + 'aa' : plan.color + '40')),
                  background: isPop
                    ? 'linear-gradient(165deg, rgba(0,32,246,0.10), rgba(91,107,255,0.035))'
                    : plan.color + '12',
                  boxShadow: isPop
                    ? '0 20px 48px rgba(0,32,246,0.20)'
                    : (lift ? '0 16px 36px ' + plan.color + '3a' : '0 1px 2px rgba(0,0,0,0.04)'),
                  padding: '26px 20px 22px', marginTop: isPop ? 0 : 8,
                  cursor: plan.contact ? 'default' : (isActive ? 'default' : 'pointer'),
                  transform: lift ? 'translateY(-6px)' : 'none',
                  transition: 'transform .25s cubic-bezier(.34,1.3,.5,1), box-shadow .25s, border-color .2s',
                  animation: 'empPop .4s ease both', animationDelay: (i * 0.07) + 's',
                }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'linear-gradient(135deg, #0020F6, #5B6BFF)', color: '#fff',
                    fontFamily: T.fontUI, fontSize: 10.5, fontWeight: 800, padding: '6px 12px',
                    borderRadius: '0 20px 0 14px', whiteSpace: 'nowrap',
                  }}><Icon name="star-bold" size={12} color="#fff" />{plan.badge}</div>
                )}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: plan.color + '22', border: '1px solid ' + plan.color + '66',
                    color: plan.color, fontSize: 9, fontWeight: 800, fontFamily: T.fontUI,
                    borderRadius: 99, padding: '3px 8px', letterSpacing: 0.5,
                  }}>AKTUÁLNÍ</div>
                )}
                <div style={{ marginTop: plan.badge ? 16 : 6 }}>
                  <Icon name={plan.icon} size={22} color={plan.color} />
                </div>
                <div style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1.4, marginTop: 8, marginBottom: 12 }}>{plan.name}</div>

                <div style={{ minHeight: 44, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                  {plan.free ? (
                    <span style={{ fontFamily: T.fontHead, fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1 }}>Zdarma</span>
                  ) : (
                    <>
                      {plan.pricePrefix && <span style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 600, fontFamily: T.fontUI }}>{plan.pricePrefix}</span>}
                      <span ref={el => { if (el) priceRefs.current[plan.id] = el; }}
                        style={{ fontFamily: T.fontHead, fontSize: 38, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                        {(annual && plan.annualPrice ? plan.annualPrice : plan.price).toLocaleString('cs-CZ')}
                      </span>
                      <span style={{ color: '#6B7280', fontSize: 15, fontWeight: 600, fontFamily: T.fontUI }}>Kč</span>
                    </>
                  )}
                </div>
                <div style={{ color: '#9CA3AF', fontSize: 11.5, fontFamily: T.fontUI, marginTop: 4 }}>
                  {plan.free ? plan.period : (annual && plan.annualPrice ? 'za měsíc · placeno ročně' : plan.period)}
                </div>
                <div style={{ minHeight: 24, marginTop: 6, marginBottom: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {plan.annualPrice ? (
                    <span style={{ opacity: annual ? 1 : 0, transition: 'opacity .2s', background: 'rgba(0,246,10,0.12)', border: '1px solid rgba(0,246,10,0.3)', color: '#00f60a', fontFamily: T.fontUI, fontSize: 10.5, fontWeight: 800, borderRadius: 8, padding: '3px 9px' }}>
                      ušetříš {((plan.price - plan.annualPrice) * 12).toLocaleString('cs-CZ')} Kč/rok
                    </span>
                  ) : null}
                </div>

                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '10px 0 16px' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                  {plan.features.map((f, fi) => <PlanFeat key={fi} f={f} />)}
                  {isExp && plan.more.map((f, fi) => <PlanFeat key={'m' + fi} f={f} />)}
                </div>

                {plan.more && plan.more.length > 0 && (
                  <button onClick={e => { e.stopPropagation(); setExpanded(x => ({ ...x, [plan.id]: !x[plan.id] })); }}
                    style={{ width: '100%', padding: 8, borderRadius: 10, border: '1px solid #E5E7EB', background: 'rgba(255,255,255,0.65)', color: '#6B7280', fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 16 }}>
                    {isExp ? 'Zobrazit méně' : 'Zobrazit více'}
                    <span style={{ display: 'inline-flex', transition: 'transform .25s', transform: isExp ? 'rotate(180deg)' : 'none' }}>
                      <Icon name="alt-arrow-down-bold" size={13} color="#6B7280" />
                    </span>
                  </button>
                )}

                <div style={{ marginTop: 'auto' }}>
                  {plan.contact ? (
                    <a href="mailto:hello@makej.eu" onClick={e => e.stopPropagation()} style={{
                      display: 'block', width: '100%', padding: '11px 0', borderRadius: 12, textAlign: 'center',
                      background: '#fff', border: '1px solid ' + plan.color + '77',
                      color: '#374151', fontFamily: T.fontUI, fontSize: 13, fontWeight: 800,
                      textDecoration: 'none', boxSizing: 'border-box',
                    }}>{plan.cta}</a>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); if (!isActive) handleSelect(plan.id); }}
                      style={{
                        width: '100%', padding: '11px 0', borderRadius: 12,
                        background: isActive ? '#F3F4F6' : isPop ? 'linear-gradient(135deg, #0020F6, #3a3a99)' : '#fff',
                        border: isActive ? '1px solid #E5E7EB' : isPop ? 'none' : '1.5px solid ' + plan.color,
                        color: isActive ? '#9CA3AF' : isPop ? '#fff' : '#111827',
                        fontFamily: T.fontUI, fontSize: 13, fontWeight: 800, cursor: isActive ? 'default' : 'pointer',
                      }}>
                      {isActive ? 'Aktuální tarif' : plan.cta}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout strip */}
      {selected && !success && !PLANS.find(x => x.id === selected)?.contact && (
        <div style={{
          maxWidth: 900, margin: '0 auto',
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 16, padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
          flexWrap: 'wrap',
        }}>
          {(() => {
            const p = PLANS.find(x => x.id === selected);
            return (
              <>
                <div>
                  <div style={{ color: '#111827', fontFamily: T.fontHead, fontSize: 16, fontWeight: 800 }}>
                    {p.name} — {(annual && p.annualPrice ? p.annualPrice : p.price).toLocaleString('cs-CZ')} Kč / měsíc
                  </div>
                  <div style={{ color: '#6B7280', fontFamily: T.fontUI, fontSize: 12, marginTop: 3 }}>
                    {annual && p.annualPrice ? 'Placeno ročně · zrušení kdykoliv' : 'Fakturováno měsíčně · zrušení kdykoliv'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setSelected(null)} style={{
                    padding: '10px 18px', borderRadius: 9,
                    background: '#fff', border: '1px solid #E5E7EB',
                    color: '#6B7280', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>Zrušit</button>
                  <button onClick={handlePay} style={{
                    padding: '10px 22px', borderRadius: 9,
                    background: 'linear-gradient(90deg, #FFD166, #FF9F43)',
                    border: 'none', color: '#1a1000',
                    fontFamily: T.fontUI, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                  }}>
                    <Icon name="card-bold" size={14} color="#1a1000" /> Zaplatit kartou
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={{
          maxWidth: 900, margin: '0 auto',
          background: '#F0FDF4', border: '1px solid #BBF7D0',
          borderRadius: 16, padding: '20px 28px', textAlign: 'center',
        }}>
          <Icon name="check-circle-bold" size={32} color="#059669" />
          <div style={{ color: '#059669', fontFamily: T.fontHead, fontSize: 17, fontWeight: 800, marginTop: 10 }}>
            Platba úspěšná! Tarif byl aktivován.
          </div>
        </div>
      )}

      {/* Slevy (z webového ceníku) */}
      <div style={{ maxWidth: 980, margin: '8px auto 26px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { pct: '5%',  title: 'Čtvrtletní platba', text: 'Zaplať 3 měsíce předem a ušetři 5 % z ceny tarifu.' },
          { pct: '15%', title: 'Roční platba',       text: 'Zaplať rok předem a ušetři 15 %. Nejlepší hodnota pro stabilní nábor.' },
          { emoji: '⚡', title: 'Upgrade kdykoliv',    text: 'Upgrade tarifu platí okamžitě. Downgrade k dalšímu fakturačnímu období.' },
        ].map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px 18px' }}>
            {d.pct
              ? <div style={{ fontFamily: T.fontHead, fontSize: 26, fontWeight: 900, color: '#00f60a', flexShrink: 0, lineHeight: 1 }}>{d.pct}</div>
              : <div style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{d.emoji}</div>}
            <div>
              <div style={{ color: '#111827', fontFamily: T.fontUI, fontSize: 13.5, fontWeight: 800, marginBottom: 3 }}>{d.title}</div>
              <div style={{ color: '#6B7280', fontFamily: T.fontUI, fontSize: 12, lineHeight: 1.5 }}>{d.text}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Poznámky a pravidla (z webového ceníku) */}
      <div style={{ maxWidth: 860, margin: '0 auto', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ color: '#111827', fontFamily: T.fontHead, fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Poznámky a pravidla</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Aktivní inzeráty = počet zveřejněných (viditelných brigádníkům) zároveň. Po vyřešení inzerátu firma uvolní slot pro další.',
            'Drafty a neaktivní inzeráty si lze vytvořit libovolně — limit tarifu se vztahuje jen na zveřejněné.',
            'Každý inzerát má cyklus 30 dní. 5 dní před koncem chodí upozornění. Potvrzením relevance běží další cyklus bez omezení.',
            'Enterprise tarif se kalkuluje individuálně. Sleva 5 % do 25 000 Kč/měs, sleva 10 % nad 25 001 Kč/měs.',
            'Všechny ceny jsou bez DPH. Makačky (virtuální měna brigádníků) se firemních tarifů netýkají.',
          ].map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <span style={{ color: '#5B6BFF', flexShrink: 0, lineHeight: 1.55 }}>•</span>
              <span style={{ color: '#6B7280', fontFamily: T.fontUI, fontSize: 12, lineHeight: 1.55 }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { EMessages, ESettings, EPricing });
