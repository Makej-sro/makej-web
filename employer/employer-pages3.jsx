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

// Fotka v bublině. Bucket je neveřejný, takže se adresa musí nejdřív podepsat —
// než se podpis vrátí, drží místo šedý rámeček, ať zpráva neposkakuje.
// PNG ikony přes CSS masku (tint) — stejné ikony jako v appce (icons/…)
function EIkonaPng({ src, size, color }) {
  const s = size || 19;
  return (
    <span style={{
      width: s, height: s, display: 'block', background: color || '#fff',
      WebkitMaskImage: `url(icons/${src})`, maskImage: `url(icons/${src})`,
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center', maskPosition: 'center',
      WebkitMaskSize: 'contain', maskSize: 'contain',
    }} />
  );
}

function EPrilohaFotka({ priloha, onOtevri }) {
  const [url, setUrl]     = useStateE(priloha.nahled || null);
  const [chyba, setChyba] = useStateE(false);
  useEffectE(() => {
    if (priloha.nahled) { setUrl(priloha.nahled); return; }   // lokální náhled (optimistické odeslání)
    if (!priloha.cesta) { setChyba(true); return; }
    let zivy = true;
    eOdkazPrilohy(priloha.cesta).then(u => {
      if (!zivy) return;
      if (u) setUrl(u); else setChyba(true);   // podpis selhal → ať kolečko netočí donekonečna
    });
    return () => { zivy = false; };
  }, [priloha.cesta, priloha.nahled]);
  return (
    <div
      onClick={() => url && onOtevri && onOtevri(url)}
      style={{
        width: 220, maxWidth: '100%', minHeight: url ? 0 : 150,
        borderRadius: 14, overflow: 'hidden', background: 'rgba(0,32,246,0.05)',
        border: '1px solid ' + T.cardBorder, cursor: url ? 'zoom-in' : 'default',
        display: url ? 'block' : 'grid', placeItems: 'center', padding: url ? 0 : 12,
      }}>
      {url
        ? <img src={url} alt={priloha.nazev || 'Fotka'} style={{ display: 'block', width: '100%', height: 'auto' }} />
        : chyba
        ? <span style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>Fotku se nepodařilo načíst</span>
        : <span style={{ width: 24, height: 24, borderRadius: 999, border: '2.5px solid rgba(0,32,246,0.2)', borderTopColor: T.primary, animation: 'empSpin .7s linear infinite' }} />}
    </div>
  );
}

// Ostatní přílohy (dokumenty) — ke stažení přes podepsaný odkaz
function EPrilohaSoubor({ priloha }) {
  async function stahni() {
    const url = await eOdkazPrilohy(priloha.cesta);
    if (url) window.open(url, '_blank', 'noopener');
  }
  return (
    <button onClick={stahni} style={{
      display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
      padding: '10px 13px', borderRadius: 12, cursor: 'pointer', maxWidth: 240,
      background: 'rgba(0,32,246,0.05)', border: '1px solid ' + T.cardBorder,
    }}>
      <Icon name="paperclip-bold" size={16} color={T.primary} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: T.cardText, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{priloha.nazev}</span>
        {priloha.velikost > 0 && <span style={{ display: 'block', color: T.cardMutedSoft, fontFamily: T.fontMono, fontSize: 10.5 }}>{eVelikostPrilohy(priloha.velikost)}</span>}
      </span>
    </button>
  );
}

// Fotka přes celou obrazovku po kliknutí
function ELupa({ url, onClose }) {
  useEffectE(() => {
    const esc = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6,8,20,0.92)',
      display: 'grid', placeItems: 'center', padding: 24, cursor: 'zoom-out',
    }}>
      <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 10 }} />
    </div>
  );
}

function EMessages({ initialThreadId, onNew, period, onPeriod } = {}) {
  // Local thread state — initialized from (possibly mutated) global E_THREADS
  const [threads, setThreads]   = useStateE(() => [...E_THREADS]);
  const [active,  setActive]    = useStateE(() => {
    if (initialThreadId && E_THREADS.some(t => t.id === initialThreadId)) return initialThreadId;
    return E_THREADS[0]?.id || null;
  });
  const [filter,  setFilter]    = useStateE('all');
  const [query,   setQuery]     = useStateE('');
  const [msgInput, setMsgInput] = useStateE('');
  const [sending,  setSending]  = useStateE(false);
  const [showShiftModal, setShowShiftModal] = useStateE(false);
  const [shiftForm, setShiftForm] = useStateE({ role: '', date: '', time: '', pay: '', location: '' });
  const [showInterviewModal, setShowInterviewModal] = useStateE(false);
  const [interviewForm, setInterviewForm] = useStateE({ date: '', time: '', location: '', note: '' });
  const [lupa,    setLupa]      = useStateE(null);   // fotka přes celou obrazovku
  const [userReady, setUserReady] = useStateE(false);
  const userId                  = useRefE(null);
  const souborRef               = useRefE(null);   // skrytý <input type=file> na přílohu
  const scrollRef               = useRefE(null);

  // Grab current user id once
  useEffectE(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      userId.current = session?.user?.id || null;
      setUserReady(true);
    });
  }, []);

  // Sdílej, který thread je právě otevřený — vždy-běžící odběr v employer-main
  // ho pak nechá přečtený, i když přijde nová zpráva zrovna do něj.
  useEffectE(() => {
    window.__empOpenThread = active;
    return () => { if (window.__empOpenThread === active) window.__empOpenThread = null; };
  }, [active]);

  // Otevřená konverzace → zapamatuj „přečteno" (localStorage), vynuluj odznaky, dej signál
  useEffectE(() => {
    if (!userReady || !active) return;
    try { localStorage.setItem('emp-lastread-' + active, Date.now()); } catch (e) {}
    setThreads(prev => prev.map(x => x.id === active && x.unread ? { ...x, unread: 0 } : x));
    if (typeof E_THREADS !== 'undefined') { const g = E_THREADS.find(x => x.id === active); if (g) g.unread = 0; }
    if (userId.current) markThreadReadE(userId.current, active);   // pro tabulku notifications (kdyby ji trigger plnil)
    window.dispatchEvent(new Event('emp-refresh-unread'));                                  // překresli badge v menu
    window.dispatchEvent(new CustomEvent('emp-thread-read', { detail: { matchId: active } }));  // ztlum zvoneček
  }, [active, userReady]);

  // Global subscription: update thread sidebar previews for ALL incoming messages
  // (active thread messages are handled separately by the per-thread subscription)
  useEffectE(() => {
    const chan = sb.channel('e-msgs-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        const preview = msg.file_url ? _ePrilohaNahled(msg) : msg.type === 'shift_offer' ? '📅 Nabídka směny' : msg.type === 'interview_offer' ? '🗓️ Pozvánka na pohovor' : msg.text;
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
        // Skip own messages — already added optimistically in handleSend / handleSendShift
        if (msg.sender_id === userId.current) return;
        setThreads(prev => prev.map(t => {
          if (t.id !== active) return t;
          if (t.msgs.some(m => m.id === msg.id)) return t;
          const from = msg.sender_id === userId.current ? 'me' : 'them';
          const jePriloha = !!msg.file_url;
          const isShift = msg.type === 'shift_offer' && msg.metadata;
          const isInterview = msg.type === 'interview_offer' && msg.metadata;
          const newMsg = jePriloha
            ? { from, kind: 'file', file: _ePrilohaZRadku(msg), t: _fmtTime(msg.created_at), id: msg.id }
            : isShift
            ? { from, kind: 'shift', shift: { role: msg.metadata.role, date: msg.metadata.date, time: msg.metadata.time, pay: msg.metadata.pay }, t: _fmtTime(msg.created_at), id: msg.id }
            : isInterview
            ? { from, kind: 'interview', interview: { date: msg.metadata.date, time: msg.metadata.time, location: msg.metadata.location, note: msg.metadata.note }, t: _fmtTime(msg.created_at), id: msg.id }
            : { from, text: msg.text, t: _fmtTime(msg.created_at), id: msg.id };
          return {
            ...t,
            last: jePriloha ? _ePrilohaNahled(msg) : isShift ? '📅 Nabídka směny' : isInterview ? '🗓️ Pozvánka na pohovor' : msg.text,
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

  async function handleAttach(e) {
    const file = e.target.files && e.target.files[0];
    if (e.target) e.target.value = '';   // reset, ať jde poslat stejný soubor znovu
    if (!file || !active || !userId.current || sending) return;
    setSending(true);

    const tempId = 'tmp-' + Date.now();
    const jeObrazek = /^image\//.test(file.type);
    const nahled = jeObrazek ? URL.createObjectURL(file) : null;
    // Optimistický přírůstek — bublina se ukáže hned
    setThreads(prev => prev.map(t => t.id !== active ? t : {
      ...t, last: jeObrazek ? '📷 Fotka' : '📎 ' + file.name,
      msgs: [...t.msgs, { from: 'me', kind: 'file', file: { cesta: null, typ: jeObrazek ? 'image' : 'file', nazev: file.name, velikost: file.size, nahled }, t: _fmtTime(new Date().toISOString()), id: tempId }],
    }));

    const res = await ePosliPrilohu(active, userId.current, file);
    if (res.ok && res.zprava) {
      const shape = _ePrilohaZRadku(res.zprava);
      setThreads(prev => prev.map(t => t.id !== active ? t : {
        ...t, msgs: t.msgs.map(m => m.id === tempId ? { ...m, id: res.zprava.id, file: shape, t: _fmtTime(res.zprava.created_at) } : m),
      }));
    } else {
      // Selhání → odeber optimistickou bublinu a řekni proč
      setThreads(prev => prev.map(t => t.id !== active ? t : { ...t, msgs: t.msgs.filter(m => m.id !== tempId) }));
      window.empToast && window.empToast('Přílohu se nepodařilo poslat', res.error || 'Zkus to prosím znovu.', '⚠️', 'error');
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
      alert('Nepodařilo se odeslat nabídku. Je potřeba spustit DB migraci: ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT \'text\'; ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;');
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
  const _q = query.trim().toLowerCase();
  const filtered = threads.filter(t => {
    if (filter === 'unread' && !(t.unread > 0)) return false;
    if (filter === 'pinned' && !t.pinned) return false;
    if (_q && !((t.name + ' ' + (t.role || '') + ' ' + (t.last || '')).toLowerCase().includes(_q))) return false;
    return true;
  });
  const _unreadCount  = threads.filter(t => t.unread > 0).length;
  const _waitingCount = threads.filter(t => { const m = t.msgs && t.msgs[t.msgs.length - 1]; return m && m.from === 'them'; }).length;
  const _totalCount   = threads.length;

  if (!thread) return (
    <div style={{ padding: 20 }}>
      <div style={_erS(`background:${_erC.bg};border:1px solid ${_erC.shell};border-radius:22px;overflow:hidden`)}>
        <div style={_erS(`background:${_erC.blue};padding:20px 26px;display:flex;align-items:center;gap:14px`)}>
          <span style={_erS('font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em')}>Zprávy</span>
        </div>
        <div style={{ padding: 64, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <Icon name="chat-round-line-bold" size={44} color="#A6ADCB" />
            <div style={_erS(`margin-top:12px;font-size:14px;color:${_erC.muted}`)}>Zatím žádné zprávy. Začněte komunikovat s kandidáty v aplikaci.</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={_erS(`background:${_erC.bg};border:1px solid ${_erC.shell};border-radius:22px;overflow:hidden`)}>

        {/* Modrá hlavička */}
        <div style={_erS(`background:${_erC.blue};padding:20px 26px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap`)}>
          <div style={_erS('display:flex;align-items:center;gap:14px;min-width:0')}>
            <span style={_erS('font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em')}>Zprávy</span>
            <span style={_erS('width:1px;height:22px;background:rgba(255,255,255,.28)')} />
            <span style={_erS(`font-size:14px;color:${_erC.onBlue2}`)}>Komunikace s kandidáty · {_unreadCount} nepřečtené</span>
          </div>
          <div style={_erS('display:flex;align-items:center;gap:10px')}>
            <button onClick={() => window.empGoTab && window.empGoTab('settings')} style={_erS('font-size:13px;font-weight:700;color:#fff;background:rgba(255,255,255,.14);border:none;padding:9px 14px;border-radius:9px;cursor:pointer')}>Šablony</button>
            <EPeriodPicker value={period} onChange={onPeriod} />
            <button onClick={onNew} style={_erS(`font-size:14px;font-weight:800;color:${_erC.blue};background:#fff;border:none;padding:11px 18px;border-radius:9px;cursor:pointer`)}>+ Nový inzerát</button>
          </div>
        </div>

        {/* Pás metrik */}
        <div style={_erS(`background:${_erC.blue};display:grid;grid-template-columns:repeat(4,1fr);padding-bottom:6px`)}>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Nepřečtené</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{_unreadCount}</span>
              <button onClick={() => setFilter('unread')} style={_erS(`font-size:12px;font-weight:800;color:#0B1233;background:${_erC.amberOnDark};border:none;padding:4px 9px;border-radius:6px;cursor:pointer`)}>Zobrazit</button>
            </div>
          </div>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px;border-left:1px solid rgba(255,255,255,.2)')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Čeká na odpověď</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{_waitingCount}</span>
              <span style={_erS(`font-size:12px;color:${_erC.onBlue2}`)}>od kandidátů</span>
            </div>
          </div>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px;border-left:1px solid rgba(255,255,255,.2)')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Průměrná odezva</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>4 h</span>
              <div style={_erS('display:flex;align-items:flex-end;gap:2px;height:24px')}>{[100, 75, 60, 45, 35].map((h, i) => <span key={i} style={{ width: 5, height: h + '%', background: i > 2 ? '#fff' : 'rgba(255,255,255,.3)', borderRadius: 2 }} />)}</div>
            </div>
          </div>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px;border-left:1px solid rgba(255,255,255,.2)')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Konverzace celkem</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{_totalCount}</span>
              <span style={_erS(`font-size:12px;color:${_erC.onBlue2}`)}>celkem</span>
            </div>
          </div>
        </div>

        {/* Tělo: 3 sloupce */}
        <div style={_erS('padding:22px 24px 26px;display:grid;grid-template-columns:332px 1fr;gap:16px;align-items:start')}>

          {/* Sloupec 1 — seznam konverzací */}
          <div style={_erS('background:#fff;border:1px solid #E6E9F5;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;height:720px')}>
            <div style={_erS('padding:16px;display:flex;flex-direction:column;gap:12px;border-bottom:1px solid #F0F2FA')}>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Hledat v konverzacích…" style={_erS('font-size:13px;color:#0B1233;background:#F6F7FC;border:1px solid #E6E9F5;border-radius:10px;padding:11px 13px;outline:none;width:100%')} />
              <div style={_erS('display:flex;gap:6px')}>
                {[['all', 'Všechny'], ['unread', 'Nepřečtené'], ['pinned', 'Připnuté']].map(([k, l]) => (
                  <button key={k} onClick={() => setFilter(k)} style={_erS(`font-size:12px;font-weight:700;padding:7px 12px;border-radius:999px;cursor:pointer;color:${filter === k ? '#fff' : _erC.ink2};background:${filter === k ? _erC.blue : '#fff'};border:1px solid ${filter === k ? _erC.blue : _erC.line}`)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={_erS('flex:1;overflow-y:auto;display:flex;flex-direction:column')}>
              {filtered.map(t => {
                const sel = t.id === active;
                return (
                  <button key={t.id} onClick={() => setActive(t.id)} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderTop: 'none', borderRight: 'none', borderBottom: '1px solid #F0F2FA', borderLeft: '3px solid ' + (sel ? '#1B34F0' : 'transparent'), cursor: 'pointer', textAlign: 'left', background: sel ? '#F6F7FC' : '#fff', width: '100%' }}>
                    <div style={{ position: 'relative', flex: 'none' }}>
                      <span style={{ width: 38, height: 38, borderRadius: 11, background: t.color, color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.avatar}</span>
                      {t.online ? <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: 999, background: '#0FA968', border: '2px solid #fff' }} /> : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: t.unread > 0 ? 800 : 600, color: '#0B1233', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.pinned ? '📌 ' : ''}{t.name}</span>
                        <span style={{ fontSize: 11, color: '#A6ADCB', flex: 'none' }}>{t.time}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#7A82A6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.role}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 13, color: t.unread > 0 ? '#0B1233' : '#7A82A6', fontWeight: t.unread > 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.last}</span>
                        {t.unread > 0 ? <span style={{ minWidth: 8, width: 8, height: 8, borderRadius: '50%', background: '#1B34F0', flex: 'none' }} /> : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sloupec 2 — vlákno */}
          <div style={_erS('background:#fff;border:1px solid #E6E9F5;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;height:720px')}>
            <div style={_erS('padding:16px 20px;border-bottom:1px solid #F0F2FA;display:flex;align-items:center;justify-content:space-between;gap:16px')}>
              <div style={_erS('display:flex;align-items:center;gap:12px')}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: thread.color, color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{thread.avatar}</span>
                <div style={_erS('display:flex;flex-direction:column;gap:2px')}>
                  <span style={_erS('font-size:16px;font-weight:800;color:#0B1233')}>{thread.name}</span>
                  <div style={_erS('display:flex;align-items:center;gap:7px')}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: thread.online ? '#0FA968' : '#DDE1F0' }} />
                    <span style={_erS('font-size:12px;color:#7A82A6')}>{thread.role} · {thread.online ? 'online' : 'offline'}</span>
                  </div>
                </div>
              </div>
              <div style={_erS('display:flex;align-items:center;gap:8px')}>
                <button onClick={() => window.empOpenProfile && window.empOpenProfile(thread.worker_id, { name: thread.name, address: thread.city, level: thread.level, jobs_done: thread.jobsDone, rating: thread.rating, verified: thread.verified, cv_url: thread.cvUrl })} style={_erS('font-size:13px;font-weight:700;color:#1B34F0;background:#fff;border:1px solid #D5DAF0;padding:9px 14px;border-radius:9px;cursor:pointer')}>Profil</button>
                <button onClick={() => setShowShiftModal(true)} style={_erS('font-size:13px;font-weight:800;color:#fff;background:#1B34F0;border:none;padding:9px 15px;border-radius:9px;cursor:pointer')}>Nabídnout směnu</button>
              </div>
            </div>

            <div ref={scrollRef} style={_erS('flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:10px;background:#FBFCFE')}>
              {thread.msgs.map((m, i) => {
                if (m.kind === 'shift') {
                  return (
                    <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                      <div style={{ padding: 14, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,32,246,0.10), rgba(91,107,255,0.06))', border: '1px solid rgba(0,32,246,0.22)' }}>
                        <div style={{ color: T.primary, fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: T.fontUI }}>Nabídka směny</div>
                        <div style={{ color: T.cardText, fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, marginTop: 4 }}>{m.shift.role}</div>
                        <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div><Icon name="calendar-bold" size={11} color={T.cardMutedSoft}/> {m.shift.date} · {m.shift.time}</div>
                          <div><Icon name="dollar-bold" size={11} color={T.cardMutedSoft}/> Odhad odměny <span style={{ color: T.cardText, fontWeight: 700, fontFamily: T.fontMono }}>{m.shift.pay} Kč</span></div>
                        </div>
                      </div>
                      <div style={{ color: '#A6ADCB', fontSize: 11, marginTop: 4, padding: '0 4px', textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.t}</div>
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
                        <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div><Icon name="calendar-bold" size={11} color={T.cardMutedSoft}/> {m.interview.date}{m.interview.time ? ' · ' + m.interview.time : ''}</div>
                          {m.interview.location ? <div><Icon name="map-point-bold" size={11} color={T.cardMutedSoft}/> {m.interview.location}</div> : null}
                          {m.interview.note ? <div style={{ color: T.cardMutedSoft, marginTop: 2 }}>{m.interview.note}</div> : null}
                        </div>
                      </div>
                      <div style={{ color: '#A6ADCB', fontSize: 11, marginTop: 4, padding: '0 4px', textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.t}</div>
                    </div>
                  );
                }
                if (m.kind === 'file') {
                  return (
                    <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      {m.file.typ === 'image'
                        ? <EPrilohaFotka priloha={m.file} onOtevri={setLupa} />
                        : <EPrilohaSoubor priloha={m.file} />}
                      <div style={{ color: '#A6ADCB', fontSize: 11, marginTop: 4, padding: '0 4px', textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.t}</div>
                    </div>
                  );
                }
                return (
                  <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{ padding: '12px 15px', borderRadius: m.from === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.from === 'me' ? '#1B34F0' : '#fff', border: '1px solid ' + (m.from === 'me' ? '#1B34F0' : '#E6E9F5'), color: m.from === 'me' ? '#fff' : '#0B1233', fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
                    <div style={{ color: '#A6ADCB', fontSize: 11, marginTop: 4, padding: '0 4px', textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.t}</div>
                  </div>
                );
              })}
            </div>

            {/* Composer — naše ikony (sponka + vlaštovka), funkce beze změny */}
            <div style={_erS('border-top:1px solid #F0F2FA;padding:14px 16px;display:flex;flex-direction:column;gap:10px')}>
              <div style={_erS('display:flex;gap:8px;flex-wrap:wrap')}>
                {['Nabídnout směnu', 'Pozvat na pohovor', 'Zaslat pravidla', 'Bohužel ne'].map(qk => (
                  <button key={qk} onClick={() => {
                    if (qk === 'Nabídnout směnu') { setShowShiftModal(true); return; }
                    if (qk === 'Pozvat na pohovor') { setShowInterviewModal(true); return; }
                    if (qk === 'Zaslat pravidla') {
                      const rules = ((typeof EPROFILE !== 'undefined' && EPROFILE.chat_rules) || '').trim();
                      if (!rules) {
                        window.empToast && window.empToast('Pravidla nejsou nastavená', 'Nastav si vlastní text v Nastavení → Pravidla do chatu a pak ho odešleš jedním klikem.', 'ℹ️', 'info');
                        window.empGoTab && window.empGoTab('settings');
                        return;
                      }
                      sendQuickText(rules);
                      return;
                    }
                    if (qk === 'Bohužel ne') { setMsgInput('Děkujeme za váš zájem o tuto pozici! Tentokrát jsme se rozhodli pro jiného kandidáta. Budeme rádi, když se ozvete na naše další nabídky. 🙏'); return; }
                    setMsgInput(qk);
                  }} style={_erS('font-size:12px;font-weight:700;color:#3A4266;background:#F1F3FB;border:none;padding:8px 13px;border-radius:999px;cursor:pointer')}>{qk}</button>
                ))}
              </div>
              <div style={_erS('display:flex;align-items:flex-end;gap:10px')}>
                <input ref={souborRef} type="file" accept="image/*,application/pdf,.doc,.docx,.txt" onChange={handleAttach} style={{ display: 'none' }} />
                <button onClick={() => souborRef.current && souborRef.current.click()} disabled={sending} title="Přiložit soubor nebo fotku" style={{ width: 44, height: 44, flex: 'none', border: '1px solid #E6E9F5', background: '#F6F7FC', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.5 : 1 }}>
                  <EIkonaPng src="attachment.png" size={19} color="#3A4266" />
                </button>
                <textarea value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Napište zprávu…  (Enter odešle, Shift+Enter nový řádek)" style={_erS('flex:1;min-height:44px;max-height:120px;resize:none;font-size:14px;color:#0B1233;line-height:1.5;background:#F6F7FC;border:1px solid #E6E9F5;border-radius:12px;padding:12px 15px;outline:none')} />
                <button onClick={handleSend} disabled={sending || !msgInput.trim()} title="Odeslat" style={{ width: 44, height: 44, flex: 'none', background: msgInput.trim() ? '#1B34F0' : '#A6ADCB', border: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (sending || !msgInput.trim()) ? 'default' : 'pointer' }}>
                  <span style={{ display: 'block', transform: 'translate(-0.8px, 0.9px)' }}><EIkonaPng src="send.png" size={18} color="#fff" /></span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Shift offer modal */}
      {lupa && <ELupa url={lupa} onClose={() => setLupa(null)} />}

      {showShiftModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowShiftModal(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 200 }}>
          <div style={{ background: '#ffffff', border: '1px solid ' + T.cardBorder, borderRadius: 18, padding: 28, width: 380, position: 'relative' }}>
            <button onClick={() => setShowShiftModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(208,208,255,.08)', border: 'none', borderRadius: 8, padding: 6, color: T.cardMuted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            <div style={{ color: T.cardText, fontFamily: T.fontHead, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Nabídnout směnu</div>
            <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12, marginBottom: 20 }}>Nabídka bude odeslána jako zpráva — brigádník ji může přijmout nebo odmítnout.</div>
            {[
              { label: 'Pozice / název směny', key: 'role', placeholder: 'např. Barista, Servírka…', type: 'text' },
              { label: 'Datum', key: 'date', placeholder: 'např. Čt 15.5.', type: 'text' },
              { label: 'Čas (od – do)', key: 'time', placeholder: 'např. 7:00 – 15:00', type: 'text' },
              { label: 'Odměna (Kč)', key: 'pay', placeholder: 'např. 1440', type: 'number' },
              { label: 'Adresa / místo', key: 'location', placeholder: 'např. Náměstí Míru 3, Praha 2', type: 'text' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{field.label}</div>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={shiftForm[field.key]}
                  onChange={e => setShiftForm(f => ({ ...f, [field.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(208,208,255,.14)', color: T.cardText, fontSize: 13, outline: 'none', fontFamily: T.fontUI, boxSizing: 'border-box' }}
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
          <div style={{ background: '#ffffff', border: '1px solid ' + T.cardBorder, borderRadius: 18, padding: 28, width: 380, position: 'relative' }}>
            <button onClick={() => setShowInterviewModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(208,208,255,.08)', border: 'none', borderRadius: 8, padding: 6, color: T.cardMuted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            <div style={{ color: T.cardText, fontFamily: T.fontHead, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Pozvat na pohovor</div>
            <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12, marginBottom: 20 }}>Pozvánka se odešle jako zpráva. Je to jen pohovor — inzerát zůstává aktivní.</div>
            {[
              { label: 'Datum', key: 'date', placeholder: 'např. Čt 15.5.', type: 'text' },
              { label: 'Čas', key: 'time', placeholder: 'např. 14:00', type: 'text' },
              { label: 'Místo / online odkaz', key: 'location', placeholder: 'např. Náměstí Míru 3, Praha 2 nebo Google Meet', type: 'text' },
              { label: 'Poznámka (nepovinné)', key: 'note', placeholder: 'např. Vezmi si s sebou OP, potrvá cca 20 min', type: 'text' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>{field.label}</div>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={interviewForm[field.key]}
                  onChange={e => setInterviewForm(f => ({ ...f, [field.key]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(208,208,255,.14)', color: T.cardText, fontSize: 13, outline: 'none', fontFamily: T.fontUI, boxSizing: 'border-box' }}
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
function ESettingsOld() {
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
            background: seg === s.k ? 'rgba(255,255,255,0.18)' : 'transparent',
            border: '1px solid ' + (seg === s.k ? 'rgba(255,255,255,0.35)' : 'transparent'),
            color: seg === s.k ? T.text : (s.k === 'danger' ? '#f43f5e' : T.muted),
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
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, padding: '14px 0', borderBottom: '1px solid ' + T.cardBorder, alignItems: 'flex-start' }}>
      <div>
        <div style={{ color: T.cardText, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700 }}>{label}</div>
        {sub ? <div style={{ color: T.cardMuted, fontSize: 11, fontFamily: T.fontUI, marginTop: 3 }}>{sub}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(0,32,246,0.15)',
  color: '#0020F6', fontFamily: T.fontUI, fontSize: 13, outline: 'none',
};

// ── Pomocné prvky profilu ──────────────────────────────────────────────────
const INDUSTRIES = ['Gastro / restaurace', 'Kavárna', 'Maloobchod', 'Sklad / logistika', 'Eventy / catering', 'Hotelnictví', 'Výroba', 'Úklid', 'Administrativa', 'Jiné'];
const SOCIAL_FIELDS = [
  { k: 'instagram', icon: 'instagram', ph: 'instagram.com/firma' },
  { k: 'facebook',  icon: 'facebook',  ph: 'facebook.com/firma' },
  { k: 'linkedin',  icon: 'linkedin',  ph: 'linkedin.com/company/firma' },
  { k: 'tiktok',    icon: 'tiktok',    ph: 'tiktok.com/@firma' },
];

function ImageField({ label, sub, value, onChange, fallback, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid ' + T.cardBorder }}>
      <div style={{ width: 64, height: 64, borderRadius: 14, flexShrink: 0, overflow: 'hidden', background: 'rgba(0,32,246,0.08)', border: '1px solid rgba(0,32,246,0.15)', display: 'grid', placeItems: 'center', color: T.cardText, fontFamily: T.fontHead, fontWeight: 800, fontSize: 20 }}>
        {value ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : fallback}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: T.cardText, fontFamily: T.fontHead, fontSize: 14.5, fontWeight: 800 }}>{label}</div>
        <div style={{ color: T.cardMuted, fontSize: 11, fontFamily: T.fontUI, margin: '2px 0 7px' }}>{sub}</div>
        <input style={{ ...inputStyle, fontSize: 12 }} value={value} onChange={onChange} placeholder="Vlož odkaz na obrázek (URL)" />
      </div>
    </div>
  );
}

function Stars({ n }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => <Icon key={i} name={i <= n ? 'star-bold' : 'star-line-duotone'} size={13} color={i <= n ? T.super : T.cardMuted} />)}
    </span>
  );
}

function SettingsProfile() {
  const initForm = () => ({
    company_name: EPROFILE.company_name || ECOMPANY.name || '',
    ic:        EPROFILE.ic || '',
    industry:  EPROFILE.industry || '',
    bio:       EPROFILE.bio || '',
    website:   EPROFILE.website || '',
    address:   EPROFILE.address || '',
    avatar_url: EPROFILE.avatar_url || '',
    logo_url:  EPROFILE.logo_url || '',
    socials:   Object.assign({ instagram: '', facebook: '', linkedin: '', tiktok: '' }, EPROFILE.socials || {}),
    photos:    Array.isArray(EPROFILE.photos) ? EPROFILE.photos.slice() : [],
    branding:  Object.assign({ color: ECOMPANY.logoColor || T.primary }, EPROFILE.branding || {}),
    chat_rules: EPROFILE.chat_rules || '',
  });
  const [form, setForm]     = useStateE(initForm);
  const [saving, setSaving] = useStateE(false);
  const [toast, setToast]   = useStateE(null);
  const [mapaZobrazena, setMapaZobrazena] = useStateE(false);   // mapa Google až po kliknutí

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setSocial = k => e => setForm(f => ({ ...f, socials: { ...f.socials, [k]: e.target.value } }));
  const setPhoto  = (i, v) => setForm(f => { const p = f.photos.slice(); p[i] = v; return { ...f, photos: p }; });
  const addPhoto  = () => setForm(f => ({ ...f, photos: [...f.photos, ''] }));
  const rmPhoto   = i => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }));

  async function handleSave() {
    setSaving(true);
    const ok = await updateEmployerProfile({
      company_name: form.company_name,
      ic: form.ic, industry: form.industry, bio: form.bio,
      website: form.website, address: form.address,
      avatar_url: form.avatar_url, logo_url: form.logo_url,
      socials: form.socials,
      photos: form.photos.filter(u => u && u.trim()),
      branding: form.branding,
      chat_rules: form.chat_rules,
    });
    setSaving(false);
    setToast(ok ? 'ok' : 'err');
    setTimeout(() => setToast(null), 2500);
  }

  const verified   = !!EPROFILE.verified;
  const mapsUrl    = form.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(form.address) : null;
  const mapEmbed   = form.address ? 'https://maps.google.com/maps?q=' + encodeURIComponent(form.address) + '&z=14&output=embed' : null;
  const activeJobs = (typeof E_JOBS !== 'undefined' ? E_JOBS : []).filter(j => j.status === 'active' || j.status === 'urgent');

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14, borderBottom: '1px solid ' + T.cardBorder }}>
          {verified ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(91,214,138,0.12)', border: '1px solid rgba(91,214,138,0.35)', color: '#1a8f52', fontFamily: T.fontUI, fontSize: 12, fontWeight: 700 }}>
              <Icon name="verified-check-bold" size={14} color="#5BD68A" /> Ověřená firma
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.cardBorder, color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600 }}>
              <Icon name="shield-warning-bold" size={14} color={T.cardMuted} /> Neověřeno — kontaktuj podporu pro ověření
            </span>
          )}
        </div>

        {/* Logo + profilovka */}
        <ImageField label="Logo firmy" sub="PNG / SVG, čtvercové, ideálně 256×256" value={form.logo_url} onChange={set('logo_url')} fallback={ECOMPANY.logo} color={form.branding.color} />
        <ImageField label="Profilová fotka" sub="Hlavní fotka profilu (např. provozovna)" value={form.avatar_url} onChange={set('avatar_url')} fallback={<Icon name="camera-bold" size={22} color={T.muted} />} color={form.branding.color} />

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

        <FormRow label="Pravidla do chatu" sub="Odešleš je kandidátovi jedním klikem tlačítkem „Zaslat pravidla“ ve zprávách">
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
          {/* Vložená mapa Google posílá IP na Google a Google si přes ni ukládá vlastní
              cookies — bez výslovné akce uživatele to nesmí (viz /zasady-cookies).
              Proto se načte až po kliknutí. */}
          {mapEmbed && !mapaZobrazena && (
            <button type="button" onClick={() => setMapaZobrazena(true)} style={{ marginTop: 8, width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px dashed ' + T.border, background: 'transparent', color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Zobrazit náhled mapy (načte se z Google Maps)
            </button>
          )}
          {mapEmbed && mapaZobrazena && (
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
                <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 8, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.cardBorder, display: 'grid', placeItems: 'center' }}>
                  <Icon name={s.icon} size={15} color={T.cardLight} />
                </span>
                <input style={{ ...inputStyle, fontSize: 12 }} value={form.socials[s.k] || ''} onChange={setSocial(s.k)} placeholder={s.ph} />
              </div>
            ))}
          </div>
        </FormRow>

        {/* Bonusové fotky */}
        <FormRow label="Bonusové fotky" sub="Galerie na profilu firmy">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.photos.length === 0 && (
              <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12 }}>Zatím žádné fotky.</div>
            )}
            {form.photos.map((url, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.cardBorder, display: 'grid', placeItems: 'center' }}>
                  {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : <Icon name="gallery-bold" size={15} color={T.cardMuted} />}
                </div>
                <input style={{ ...inputStyle, fontSize: 12 }} value={url} onChange={e => setPhoto(i, e.target.value)} placeholder="URL fotky" />
                <button onClick={() => rmPhoto(i)} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.4)', color: '#f43f5e', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <Icon name="trash-bin-trash-bold" size={14} color="#f43f5e" />
                </button>
              </div>
            ))}
            <button onClick={addPhoto} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'rgba(0,32,246,0.05)', border: '1px dashed ' + T.cardBorder, color: T.cardLight, fontFamily: T.fontUI, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Icon name="add-circle-bold" size={14} color={T.cardLight} /> Přidat fotku
            </button>
          </div>
        </FormRow>

        {/* Branding */}
        <FormRow label="Barva značky" sub="Branding — akcent na profilu firmy">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={form.branding.color} onChange={e => setForm(f => ({ ...f, branding: { ...f.branding, color: e.target.value } }))} style={{ width: 44, height: 36, padding: 0, borderRadius: 8, border: '1px solid ' + T.cardBorder, background: 'transparent', cursor: 'pointer' }} />
            <input style={{ ...inputStyle, maxWidth: 130, fontFamily: T.fontMono }} value={form.branding.color} onChange={e => setForm(f => ({ ...f, branding: { ...f.branding, color: e.target.value } }))} />
          </div>
        </FormRow>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16 }}>
          <button onClick={() => setForm(initForm())} disabled={saving} style={{ padding: '9px 16px', borderRadius: 8, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.cardBorder, color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>Zrušit</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #0020F6, #2D2CA7)', border: 'none', color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Ukládám…' : 'Uložit změny'}</button>
        </div>
      </ECard>

      {/* Aktivní inzeráty */}
      <ECard>
        <SectionHeader title="Aktivní inzeráty" subtitle={activeJobs.length + ' aktivních na profilu'} />
        {activeJobs.length === 0 ? (
          <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12.5, padding: '8px 0' }}>Žádné aktivní inzeráty.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activeJobs.map((j, i) => (
              <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < activeJobs.length - 1 ? '1px solid ' + T.cardBorder : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: j.status === 'urgent' ? '#f43f5e' : '#5BD68A' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.cardText, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                  <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 11, marginTop: 2 }}>
                    {j.status === 'urgent' ? 'Spěchá' : 'Aktivní'}{j.location ? ' · ' + j.location : ''}{j.matches ? ' · ' + j.matches + ' kandidátů' : ''}
                  </div>
                </div>
                <div style={{ flexShrink: 0, color: T.cardLight, fontFamily: T.fontMono, fontSize: 13, fontWeight: 700 }}>{j.pay} {j.payUnit || 'Kč/h'}</div>
              </div>
            ))}
          </div>
        )}
      </ECard>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RECENZE — všechna hodnocení od kandidátů
// ─────────────────────────────────────────────────────────────
// ── Recenze (redesign ve stylu Dashboardu 1d) ───────────────────────────────
// CSS řetězec → React style objekt (umožní portovat referenční markup 1:1).
const _erC = { blue:'#1B34F0', blue2:'#5C71FF', blueSoft:'#EEF1FF', onBlue:'#A9B7FF', onBlue2:'#C7D0FF', ink:'#0B1233', ink2:'#3A4266', muted:'#7A82A6', muted2:'#A6ADCB', bg:'#F1F3FB', soft:'#F6F7FC', line:'#E6E9F5', line2:'#F0F2FA', shell:'#DDE1F0', btnLine:'#D5DAF0', green:'#0FA968', greenDark:'#0B7B4B', greenBg:'#E6F7EF', amber:'#F5920B', amberText:'#B96F06', amberBg:'#FFF3E0', amberSoft:'#FFF8EE', amberOnDark:'#FFC46B' };
function _erS(css) {
  const out = {};
  (css || '').split(';').forEach(part => {
    const i = part.indexOf(':'); if (i < 0) return;
    const prop = part.slice(0, i).trim(); const val = part.slice(i + 1).trim();
    if (!prop || !val) return;
    out[prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
  });
  return out;
}
const _ER_SORTS = { new: 'Nejnovější ↓', old: 'Nejstarší ↑', high: 'Nejvyšší ★', low: 'Nejnižší ★' };
const _ER_NEXT  = { new: 'old', old: 'high', high: 'low', low: 'new' };
const _erStars = n => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);

function ERChip({ active, children, onClick }) {
  return <button onClick={onClick} style={_erS(`font-size:13px;font-weight:700;padding:8px 14px;border-radius:999px;cursor:pointer;color:${active ? '#fff' : _erC.ink2};background:${active ? _erC.blue : '#fff'};border:1px solid ${active ? _erC.blue : _erC.line}`)}>{children}</button>;
}
function ERKpi({ label, children, right, first }) {
  return (
    <div style={_erS(`padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px${first ? '' : ';border-left:1px solid rgba(255,255,255,.2)'}`)}>
      <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>{label}</span>
      <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>{children}{right}</div>
    </div>
  );
}
function ERReviewCard({ r, open, draft, onToggle, onDraft, onQuick, onSave }) {
  const answered = !!r.reply;
  const ghost = answered || open;
  return (
    <div style={_erS(`background:#fff;border:1px solid ${answered ? _erC.line : _erC.amber};border-radius:16px;padding:20px 22px;display:flex;flex-direction:column;gap:14px`)}>
      <div style={_erS('display:flex;align-items:flex-start;justify-content:space-between;gap:16px')}>
        <div style={_erS('display:flex;gap:14px;align-items:center')}>
          <span style={_erS(`width:42px;height:42px;border-radius:12px;background:${_erC.blueSoft};color:${_erC.blue};font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none`)}>{(r.name || '?').charAt(0)}</span>
          <div style={_erS('display:flex;flex-direction:column;gap:5px')}>
            <div style={_erS('display:flex;align-items:center;gap:10px')}>
              <span style={_erS(`font-size:15px;font-weight:800;color:${_erC.ink}`)}>{r.name}</span>
              <span style={_erS(`font-size:11px;font-weight:800;color:${answered ? _erC.greenDark : _erC.amberText};background:${answered ? _erC.greenBg : _erC.amberBg};padding:3px 8px;border-radius:6px`)}>{answered ? 'Odpovězeno' : 'Bez reakce'}</span>
            </div>
            <div style={_erS('display:flex;align-items:center;gap:10px')}>
              <span style={_erS(`font-size:14px;color:${_erC.amber};letter-spacing:.08em`)}>{'★★★★★'.slice(0, r.rating)}<span style={_erS(`color:${_erC.shell}`)}>{'★★★★★'.slice(0, 5 - r.rating)}</span></span>
              {r.position && <span style={_erS(`font-size:13px;color:${_erC.muted}`)}>{r.position}</span>}
            </div>
          </div>
        </div>
        <div style={_erS('display:flex;align-items:center;gap:12px')}>
          <span style={_erS(`font-size:13px;color:${_erC.muted2};white-space:nowrap`)}>{r.date}</span>
          <button onClick={onToggle} style={_erS(`font-size:13px;font-weight:800;color:${ghost ? _erC.blue : '#fff'};background:${ghost ? '#fff' : _erC.blue};border:1px solid ${ghost ? _erC.btnLine : _erC.blue};padding:9px 15px;border-radius:9px;cursor:pointer;white-space:nowrap`)}>{open ? 'Zavřít' : answered ? 'Upravit odpověď' : 'Odpovědět'}</button>
        </div>
      </div>

      <span style={_erS(`font-size:16px;color:${_erC.ink};line-height:1.55`)}>{r.text}</span>

      {answered && (
        <div style={_erS(`background:${_erC.soft};border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:6px;border-left:3px solid ${_erC.blue}`)}>
          <div style={_erS('display:flex;align-items:center;gap:8px')}>
            <span style={_erS(`font-size:12px;font-weight:800;color:${_erC.blue}`)}>Vaše odpověď</span>
            <span style={_erS(`font-size:12px;color:${_erC.muted2}`)}>{r.replyDate}</span>
          </div>
          <span style={_erS(`font-size:14px;color:${_erC.ink2};line-height:1.5`)}>{r.reply}</span>
        </div>
      )}

      {open && (
        <div style={_erS('display:flex;flex-direction:column;gap:10px;padding-top:2px')}>
          <textarea value={draft} onChange={onDraft} placeholder="Napište odpověď kandidátovi…" style={_erS(`width:100%;min-height:88px;resize:vertical;font-family:inherit;font-size:14px;color:${_erC.ink};line-height:1.5;background:${_erC.soft};border:1px solid ${_erC.btnLine};border-radius:12px;padding:13px 15px;outline:none`)} />
          <div style={_erS('display:flex;align-items:center;justify-content:space-between;gap:12px')}>
            <div style={_erS('display:flex;gap:8px')}>
              <button onClick={() => onQuick('thanks')} style={_erS(`font-size:12px;font-weight:700;color:${_erC.ink2};background:${_erC.bg};border:none;padding:7px 12px;border-radius:999px;cursor:pointer`)}>Poděkovat</button>
              <button onClick={() => onQuick('invite')} style={_erS(`font-size:12px;font-weight:700;color:${_erC.ink2};background:${_erC.bg};border:none;padding:7px 12px;border-radius:999px;cursor:pointer`)}>Nabídnout směnu</button>
            </div>
            <div style={_erS('display:flex;gap:8px')}>
              <button onClick={onToggle} style={_erS(`font-size:13px;font-weight:700;color:${_erC.muted};background:none;border:none;padding:9px 14px;border-radius:9px;cursor:pointer`)}>Zrušit</button>
              <button onClick={onSave} style={_erS(`font-size:13px;font-weight:800;color:#fff;background:${_erC.blue};border:none;padding:9px 16px;border-radius:9px;cursor:pointer`)}>Odeslat odpověď</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EReviews({ onNew, period, onPeriod }) {
  const mapped = (typeof E_REVIEWS !== 'undefined' ? E_REVIEWS : []).map((r, i, arr) => ({
    id: r.id, name: r.author || 'Anonym', rating: Number(r.rating) || 0, text: r.text || '',
    position: r.position || '', date: r.when || '', ts: arr.length - i, reply: r.reply || null, replyDate: r.replyDate || null,
  }));
  const [reviews, setReviews] = React.useState(mapped);
  const [filter, setFilter] = React.useState('all');
  const [sort, setSort]     = React.useState('new');
  const [query, setQuery]   = React.useState('');
  const [open, setOpen]     = React.useState(null);
  const [drafts, setDrafts] = React.useState({});

  const total = reviews.length;
  const unanswered = reviews.filter(r => !r.reply).length;
  const answered = total - unanswered;
  const avg = total ? (reviews.reduce((a, r) => a + r.rating, 0) / total).toFixed(1).replace('.', ',') : '—';
  const fiveShare = total ? Math.round(reviews.filter(r => r.rating === 5).length / total * 100) + ' %' : '—';

  const q = query.trim().toLowerCase();
  const list = reviews
    .filter(r => {
      if (filter === 'unanswered' && r.reply) return false;
      if (filter === 'answered' && !r.reply) return false;
      if (filter === '5' && r.rating !== 5) return false;
      if (filter === 'low' && r.rating > 3) return false;
      if (q && !(`${r.text} ${r.name} ${r.position}`.toLowerCase().includes(q))) return false;
      return true;
    })
    .sort((a, b) => sort === 'new' ? b.ts - a.ts : sort === 'old' ? a.ts - b.ts : sort === 'high' ? b.rating - a.rating : a.rating - b.rating);

  const counts = [5, 4, 3, 2, 1].map(n => ({ n, count: reviews.filter(r => r.rating === n).length }));
  const maxC = Math.max.apply(null, counts.map(c => c.count).concat(1));
  const trendVals = [4.6, 4.8, 5, 4.7, 5, 5];
  const months = ['bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp'];

  const toggle = r => { setDrafts(d => ({ ...d, [r.id]: d[r.id] !== undefined ? d[r.id] : (r.reply || '') })); setOpen(o => (o === r.id ? null : r.id)); };
  const quick = (r, kind) => setDrafts(d => ({ ...d, [r.id]: kind === 'thanks'
    ? `Děkujeme za hodnocení, ${r.name}! Těší nás, že jste byl(a) spokojen(á).`
    : `Díky za hodnocení! Máme volnou směnu${r.position ? (' na pozici ' + r.position) : ''} — pokud máte zájem, napište nám.` }));
  const save = r => {
    const text = (drafts[r.id] || '').trim(); if (!text) return;
    // TODO: perzistovat do Supabase (chybí sloupec reviews.reply / reply_at) — zatím jen lokálně.
    setReviews(rs => rs.map(x => (x.id === r.id ? { ...x, reply: text, replyDate: 'dnes' } : x)));
    setOpen(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={_erS(`background:${_erC.bg};border:1px solid ${_erC.shell};border-radius:22px;overflow:hidden`)}>

        {/* Modrá hlavička */}
        <div style={_erS(`background:${_erC.blue};padding:20px 26px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap`)}>
          <div style={_erS('display:flex;align-items:center;gap:14px;min-width:0')}>
            <span style={_erS('font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em')}>Recenze</span>
          </div>
          <div style={_erS('display:flex;align-items:center;gap:10px')}>
            <EPeriodPicker value={period} onChange={onPeriod} />
            <button onClick={onNew} style={_erS(`font-size:14px;font-weight:800;color:${_erC.blue};background:#fff;border:none;padding:11px 18px;border-radius:9px;cursor:pointer`)}>+ Nový inzerát</button>
          </div>
        </div>

        {/* Pás metrik */}
        <div style={_erS(`background:${_erC.blue};display:grid;grid-template-columns:repeat(4,1fr);padding-bottom:6px`)}>
          <ERKpi first label="Průměrné hodnocení" right={<span style={_erS(`font-size:12px;color:${_erC.onBlue2}`)}>{total} hodnocení</span>}>
            <div style={_erS('display:flex;align-items:baseline;gap:6px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{avg}</span>
              <span style={_erS(`font-size:14px;color:${_erC.amberOnDark}`)}>★</span>
            </div>
          </ERKpi>
          <ERKpi label="Bez reakce" right={<button onClick={() => setFilter('unanswered')} style={_erS(`font-size:12px;font-weight:800;color:${_erC.ink};background:${_erC.amberOnDark};border:none;padding:4px 9px;border-radius:6px;cursor:pointer`)}>Vyřídit</button>}>
            <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{unanswered}</span>
          </ERKpi>
          <ERKpi label="Podíl 5 ★" right={<div style={_erS('display:flex;align-items:flex-end;gap:2px;height:24px')}>{[45, 60, 55, 85, 100].map((h, i) => <span key={i} style={_erS(`width:5px;height:${h}%;background:${i > 2 ? '#fff' : 'rgba(255,255,255,.3)'};border-radius:2px`)} />)}</div>}>
            <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{fiveShare}</span>
          </ERKpi>
          <ERKpi label="Průměrná reakční doba" right={<span style={_erS(`font-size:12px;color:${_erC.onBlue2}`)}>od zveřejnění</span>}>
            <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>1,4 dne</span>
          </ERKpi>
        </div>

        {/* Tělo */}
        <div style={_erS('padding:22px 24px 26px;display:grid;grid-template-columns:1fr 336px;gap:20px;align-items:start')}>
          <div style={_erS('display:flex;flex-direction:column;gap:16px;min-width:0')}>
            {/* Panel filtrů */}
            <div style={_erS(`background:#fff;border:1px solid ${_erC.line};border-radius:16px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap`)}>
              <div style={_erS('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}>
                <ERChip active={filter === 'all'} onClick={() => setFilter('all')}>Vše {total}</ERChip>
                <ERChip active={filter === 'unanswered'} onClick={() => setFilter('unanswered')}>Bez reakce {unanswered}</ERChip>
                <ERChip active={filter === 'answered'} onClick={() => setFilter('answered')}>Odpovězeno {answered}</ERChip>
                <span style={_erS(`width:1px;height:22px;background:${_erC.line};margin:0 4px`)} />
                <ERChip active={filter === '5'} onClick={() => setFilter('5')}>5 ★</ERChip>
                <ERChip active={filter === 'low'} onClick={() => setFilter('low')}>3 ★ a méně</ERChip>
              </div>
              <div style={_erS('display:flex;align-items:center;gap:10px')}>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Hledat v recenzích…" style={_erS(`font-family:inherit;font-size:13px;color:${_erC.ink};background:${_erC.soft};border:1px solid ${_erC.line};border-radius:9px;padding:9px 12px;width:190px;outline:none`)} />
                <button onClick={() => setSort(_ER_NEXT[sort])} style={_erS(`font-size:13px;font-weight:700;color:${_erC.ink2};background:#fff;border:1px solid ${_erC.line};padding:9px 14px;border-radius:9px;cursor:pointer;white-space:nowrap`)}>{_ER_SORTS[sort]}</button>
              </div>
            </div>

            {list.map(r => (
              <ERReviewCard key={r.id} r={r} open={open === r.id} draft={drafts[r.id] || ''}
                onToggle={() => toggle(r)} onDraft={e => setDrafts(d => ({ ...d, [r.id]: e.target.value }))}
                onQuick={kind => quick(r, kind)} onSave={() => save(r)} />
            ))}

            {list.length === 0 && (
              <div style={_erS(`background:#fff;border:1px solid ${_erC.line};border-radius:16px;padding:56px 22px;display:flex;flex-direction:column;align-items:center;gap:10px`)}>
                <span style={_erS(`font-size:16px;font-weight:800;color:${_erC.ink}`)}>{total === 0 ? 'Zatím žádné recenze' : 'Žádná recenze neodpovídá filtru'}</span>
                <span style={_erS(`font-size:14px;color:${_erC.muted}`)}>{total === 0 ? 'Po skončení směny požádejte kandidáta o hodnocení.' : 'Zkuste jiný filtr nebo delší období.'}</span>
                {total > 0 && <button onClick={() => { setFilter('all'); setQuery(''); }} style={_erS(`font-size:13px;font-weight:800;color:${_erC.blue};background:none;border:1px solid ${_erC.btnLine};padding:9px 15px;border-radius:9px;cursor:pointer;margin-top:6px`)}>Zobrazit vše</button>}
              </div>
            )}
          </div>

          {/* Pravý sloupec */}
          <div style={_erS('display:flex;flex-direction:column;gap:16px')}>
            <div style={_erS(`background:#fff;border:1px solid ${_erC.line};border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:16px`)}>
              <span style={_erS(`font-size:15px;font-weight:800;color:${_erC.ink}`)}>Rozložení hvězd</span>
              <div style={_erS('display:flex;flex-direction:column;gap:9px')}>
                {counts.map(({ n, count }) => (
                  <div key={n} onClick={() => setFilter(n === 5 ? '5' : 'low')} style={_erS('display:flex;align-items:center;gap:10px;cursor:pointer')}>
                    <span style={_erS(`font-size:13px;font-weight:700;color:${_erC.ink2};width:26px;flex:none`)}>{n}</span>
                    <span style={_erS(`font-size:12px;color:${_erC.amber};flex:none`)}>★</span>
                    <span style={_erS(`flex:1;height:8px;border-radius:999px;background:${_erC.bg};display:block`)}><span style={_erS(`display:block;width:${Math.round(count / maxC * 100)}%;height:100%;border-radius:999px;background:${count ? (n === 5 ? _erC.blue : _erC.blue2) : _erC.bg}`)} /></span>
                    <span style={_erS(`font-size:13px;font-weight:700;color:${_erC.ink};width:20px;text-align:right;flex:none`)}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={_erS(`background:#fff;border:1px solid ${_erC.line};border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:14px`)}>
              <div style={_erS('display:flex;align-items:center;justify-content:space-between;gap:12px')}>
                <span style={_erS(`font-size:15px;font-weight:800;color:${_erC.ink}`)}>Vývoj hodnocení</span>
                <span style={_erS(`font-size:12px;color:${_erC.muted}`)}>6 měsíců</span>
              </div>
              <div style={_erS('display:flex;align-items:flex-end;gap:8px;height:96px')}>
                {months.map((m, i) => (
                  <div key={m} style={_erS('flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;height:100%')}>
                    <span style={_erS(`height:${Math.round(trendVals[i] / 5 * 100)}%;border-radius:6px 6px 0 0;background:${i === months.length - 1 ? _erC.blue : _erC.onBlue2}`)} />
                    <span style={_erS(`font-size:11px;color:${_erC.muted2};text-align:center`)}>{m}</span>
                  </div>
                ))}
              </div>
              <span style={_erS(`font-size:13px;color:${_erC.muted};line-height:1.5`)}>Odpověď na recenzi zvyšuje šanci, že kandidát znovu zareaguje.</span>
            </div>

            <div style={_erS(`background:${_erC.ink};border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px`)}>
              <span style={_erS('font-size:15px;font-weight:800;color:#fff')}>Získat víc recenzí</span>
              <span style={_erS('font-size:13px;color:#9AA3CC;line-height:1.5')}>Po skončení směny pošlete kandidátovi žádost o hodnocení. Firmy s 10+ recenzemi mají o 34 % víc swipe right.</span>
              <button style={_erS(`font-size:13px;font-weight:800;color:${_erC.ink};background:#fff;border:none;padding:10px 14px;border-radius:9px;text-align:center;cursor:pointer`)}>Poslat žádost o hodnocení</button>
            </div>
          </div>
        </div>
      </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 0, padding: '6px 22px', color: T.cardMuted, fontSize: 10, fontWeight: 700, fontFamily: T.fontUI, letterSpacing: 0.6, textTransform: 'uppercase', borderBottom: '1px solid ' + T.cardBorder }}>
        <div>Událost</div>
        <div style={{ textAlign: 'center' }}>E-mail</div>
        <div style={{ textAlign: 'center' }}>V appce</div>
        <div style={{ textAlign: 'center' }}>Push</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 0, padding: '14px 22px', alignItems: 'center', borderBottom: i < rows.length - 1 ? '1px solid ' + T.cardBorder : 'none' }}>
          <div>
            <div style={{ color: T.cardText, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{r.l}</div>
            <div style={{ color: T.cardMuted, fontSize: 11, fontFamily: T.fontUI, marginTop: 2 }}>{r.s}</div>
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
      background: on ? T.primary : 'rgba(0,32,246,0.1)',
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
            <span style={{ color: T.cardText, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, padding: '6px 10px', borderRadius: 7, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.cardBorder }}>{r.v}</span>
            <button style={{ padding: '6px 12px', borderRadius: 7, background: 'rgba(0,32,246,0.04)', border: '1px solid ' + T.cardBorder, color: T.cardMuted, fontFamily: T.fontUI, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>Změnit</button>
          </div>
        </FormRow>
      ))}
      <div style={{ marginTop: 18, padding: 14, borderRadius: 10, background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(0,32,246,0.12)' }}>
        <div style={{ color: T.cardText, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700 }}>Export všech dat</div>
        <div style={{ color: T.cardMuted, fontSize: 11.5, fontFamily: T.fontUI, marginTop: 4 }}>Stáhněte JSON se všemi inzeráty, kandidáty a zprávami. Zpracování trvá ~10 minut.</div>
        <button style={{ marginTop: 10, padding: '8px 14px', borderRadius: 8, background: 'rgba(0,32,246,0.06)', border: '1px solid ' + T.cardBorder, color: T.cardText, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Vyžádat export</button>
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
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: i < 2 ? '1px solid ' + T.cardBorder : 'none' }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: T.cardText, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{r.l}</div>
            <div style={{ color: T.cardMuted, fontSize: 11.5, fontFamily: T.fontUI, marginTop: 3 }}>{r.s}</div>
          </div>
          <button style={{ padding: '9px 14px', borderRadius: 8, background: 'transparent', border: '1px solid ' + r.tone + '66', color: r.tone, fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{r.cta}</button>
        </div>
      ))}
    </ECard>
  );
}

// ─────────────────────────────────────────────────────────────
// CENÍK / TARIFY
// ─────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'zakladni', name: 'Základní', price: 0, free: true, period: 'navždy zdarma',
    color: '#8AB4FF', icon: 'hand-shake-bold',
    highlights: [
      { ok: true,  text: '1 aktivní inzerát' },
      { ok: true,  text: 'Oslovování brigádníků 1×/měs' },
      { ok: false, text: 'Topování inzerátu' },
      { ok: false, text: 'Ověřená firma' },
    ],
    cta: 'Začít zdarma', contact: false,
  },
  {
    id: 'vyhodny', name: 'Výhodný', price: 499, annualPrice: 424, period: 'za měsíc bez DPH',
    color: '#5B6BFF', icon: 'bolt-bold', badge: 'Nejoblíbenější', popular: true,
    highlights: [
      { ok: true, text: '2 aktivní inzeráty' },
      { ok: true, text: 'Topování inzerátu 1×/měs' },
      { ok: true, text: 'Ověřená firma + branding' },
      { ok: true, text: 'Oslovování brigádníků 10×/měs' },
    ],
    cta: 'Vybrat Výhodný', contact: false,
  },
  {
    id: 'dynamicky', name: 'Dynamický', price: 2000, period: 'za měsíc bez DPH',
    color: '#5BD68A', icon: 'bolt-bold',
    highlights: [
      { tbd: true, text: 'Funkce doplníme společně' },
    ],
    cta: 'Vybrat Dynamický', contact: false,
  },
  {
    id: 'maximalni', name: 'Maximální', price: 4999, annualPrice: 4249, period: 'za měsíc bez DPH',
    color: '#FFD166', icon: 'crown-star-bold',
    highlights: [
      { ok: true, text: '10 aktivních inzerátů' },
      { ok: true, text: 'Topování inzerátu 5×/měs' },
      { ok: true, text: 'SMS Urgent + prémiový badge' },
      { ok: true, text: 'Pokročilá analytika' },
    ],
    cta: 'Vybrat Maximální', contact: false,
  },
  {
    id: 'vlastni', name: 'Vlastní', price: 9999, pricePrefix: 'od ', period: 'kalkulace na míru',
    color: '#E0B0FF', icon: 'buildings-2-bold',
    highlights: [
      { ok: true, text: 'Vše z Maximální' },
      { ok: true, text: 'Custom integrace (HR)' },
      { ok: true, text: 'Dedikovaný account manager' },
    ],
    cta: 'Nezávazná poptávka', contact: true,
  },
];

// ─────────────────────────────────────────────────────────────
// Srovnávací tabulka funkcí — jeden řádek = jedna funkce napříč všemi tarify.
// Hodnota buňky: true/false (má/nemá), text (konkrétní limit, např. "10×/měs"),
// nebo 'tbd' pro Dynamický — funkce tohoto tarifu ještě nejsou definované,
// takže se u něj nic netvrdí napevno (ani ✓ ani ✗), jen se ukáže "brzy".
// Ostatní tarify jsou kumulativní — vyšší tarif automaticky obsahuje vše z nižšího.
// ─────────────────────────────────────────────────────────────
const FEATURE_ROWS = [
  { section: 'Inzeráty' },
  { label: 'Aktivní inzeráty',             cells: { zakladni: '1',     vyhodny: '2',    dynamicky: 'tbd', maximalni: '10',   vlastni: '10' } },
  { label: 'Full-time inzerce',            cells: { zakladni: '1',     vyhodny: '1',    dynamicky: 'tbd', maximalni: '1',    vlastni: '1' } },
  { label: 'Topování inzerátu',            cells: { zakladni: false,   vyhodny: '1×/měs', dynamicky: 'tbd', maximalni: '5×/měs', vlastni: '5×/měs' } },
  { label: 'Plánování inzerátu předem',    cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: true,   vlastni: true } },
  { label: 'Šablony inzerátů',             cells: { zakladni: false,   vyhodny: true,   dynamicky: 'tbd', maximalni: true,   vlastni: true } },

  { section: 'Nábor a viditelnost' },
  { label: 'Oslovování brigádníků',        cells: { zakladni: '1×/měs', vyhodny: '10×/měs', dynamicky: 'tbd', maximalni: '100×/měs', vlastni: '100×/měs' } },
  { label: 'Ověřená firma + branding',     cells: { zakladni: false,   vyhodny: true,   dynamicky: 'tbd', maximalni: true,   vlastni: true } },
  { label: 'Video na profilu',             cells: { zakladni: false,   vyhodny: true,   dynamicky: 'tbd', maximalni: true,   vlastni: true } },
  { label: 'Prémiový badge',               cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: true,   vlastni: true } },
  { label: 'SMS Urgent',                   cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: true,   vlastni: true } },
  { label: 'Zmínka na FB + IG Makej',      cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: true,   vlastni: true } },

  { section: 'Data a reporting' },
  { label: 'Základní statistiky',          cells: { zakladni: true,    vyhodny: true,   dynamicky: 'tbd', maximalni: true,   vlastni: true } },
  { label: 'Plné statistiky + CSV export', cells: { zakladni: false,   vyhodny: true,   dynamicky: 'tbd', maximalni: true,   vlastni: true } },
  { label: 'Pokročilá analytika',          cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: true,   vlastni: true } },
  { label: 'Custom integrace (HR systémy)', cells: { zakladni: false,  vyhodny: false,  dynamicky: 'tbd', maximalni: false,  vlastni: true } },
  { label: 'Vlastní reporting na míru',    cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: false,  vlastni: true } },
  { label: 'Co-marketing s Makej',         cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: false,  vlastni: true } },

  { section: 'Tým a podpora' },
  { label: 'Možnost konzultace',           cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: true,   vlastni: true } },
  { label: 'Role uživatelů',               cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: true,   vlastni: true } },
  { label: 'Neomezení uživatelé v týmu',   cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: false,  vlastni: true } },
  { label: 'Onboarding a školení týmu',    cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: false,  vlastni: true } },
  { label: 'SLA 99,99 % + prioritní podpora', cells: { zakladni: false, vyhodny: false, dynamicky: 'tbd', maximalni: false,  vlastni: true } },
  { label: 'Dedikovaný account manager',   cells: { zakladni: false,   vyhodny: false,  dynamicky: 'tbd', maximalni: false,  vlastni: true } },
];

function FeatureCell({ value }) {
  if (value === 'tbd') {
    return <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 6, background: '#F3F4F6', color: '#9CA3AF', fontFamily: T.fontUI, fontSize: 10.5, fontWeight: 700 }}>brzy</span>;
  }
  if (value === true)  return <Icon name="check-circle-bold" size={17} color="#00f60a" />;
  if (value === false) return <span style={{ color: '#D1D5DB', fontSize: 15, fontWeight: 700 }}>–</span>;
  return <span style={{ color: '#111827', fontFamily: T.fontMono, fontSize: 12, fontWeight: 700 }}>{value}</span>;
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
  const [showCompare, setShowCompare] = useStateE(false);
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
    // Porovnává se proti starým názvům tarifů, protože ECOMPANY.plan v datech
    // (mock i reálná) stále ukládá staré názvy (Standard, Business, Enterprise…)
    if (planName.includes('enterprise') || planName.includes('vlastní') || planName.includes('vlastni')) return 'vlastni';
    if (planName.includes('business') || planName.includes('premium') || planName.includes('maximální') || planName.includes('maximalni')) return 'maximalni';
    if (planName.includes('dynamick')) return 'dynamicky';
    if (planName.includes('standard') || planName.includes('výhodný') || planName.includes('vyhodny')) return 'vyhodny';
    return 'zakladni';
  })();

  function handleSelect(planId) {
    if (planId === currentPlanId) return;
    setSelected(planId);
  }

  function handlePay() {
    const plan = PLANS.find(p => p.id === selected);
    if (plan) {
      ECOMPANY.plan = plan.name;
      if (onPlanChange) onPlanChange(plan.name);
    }
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setSelected(null); }, 3000);
  }

  return (
    <div style={{ padding: '28px 32px 48px', overflowY: 'auto', background: '#fff', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontFamily: T.fontHead, fontSize: 33, fontWeight: 900, color: '#111827', marginBottom: 10 }}>Vyber si svůj plán</div>
        <div style={{ color: '#6B7280', fontFamily: T.fontUI, fontSize: 17, marginBottom: 26 }}>Bez závazků. Zrušení kdykoliv.</div>
        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 99, padding: '8px 20px' }}>
            <span style={{ color: annual ? '#9CA3AF' : '#111827', fontFamily: T.fontUI, fontSize: 16, fontWeight: 700, transition: 'color .2s' }}>Měsíčně</span>
            <div
              onClick={() => setAnnual(a => !a)}
              style={{ width: 48, height: 26, borderRadius: 999, background: annual ? '#00f60a' : '#D1D5DB', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 3, left: annual ? 25 : 3, width: 20, height: 20, borderRadius: 999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
            </div>
            <span style={{ color: annual ? '#111827' : '#9CA3AF', fontFamily: T.fontUI, fontSize: 16, fontWeight: 700, transition: 'color .2s' }}>Ročně</span>
          </div>
          <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
            <span style={{ background: 'rgba(0,246,10,0.12)', border: '1px solid rgba(0,246,10,0.3)', color: '#00f60a', fontFamily: T.fontUI, fontSize: 15, fontWeight: 800, borderRadius: 12, padding: '8px 20px', opacity: annual ? 1 : 0, transform: annual ? 'scale(1)' : 'scale(0.9)', transition: 'opacity .2s, transform .2s' }}>chci šetřit</span>
          </div>
        </div>
      </div>

      {/* Karty tarifů — čistě cena + CTA, bez seznamu funkcí */}
      <div style={{ maxWidth: 1180, margin: '0 auto 24px', paddingBottom: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 14, alignItems: 'stretch', padding: '20px 4px 8px' }}>
          {PLANS.map((plan, i) => {
            const isActive = plan.id === currentPlanId;
            const isPop    = !!plan.popular;
            const isSel    = selected === plan.id;
            const isHov    = hovered === plan.id;
            const lift     = isSel || isHov;
            return (
              <div key={plan.id}
                onClick={() => !plan.contact && handleSelect(plan.id)}
                onMouseEnter={() => setHovered(plan.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column', textAlign: 'center',
                  borderRadius: 20,
                  border: isSel ? '2px solid #0020F6' : ('1.5px solid ' + (lift ? plan.color + 'aa' : plan.color + '40')),
                  background: isSel
                    ? 'linear-gradient(165deg, rgba(0,32,246,0.10), rgba(91,107,255,0.035))'
                    : plan.color + '12',
                  boxShadow: isSel
                    ? '0 20px 48px rgba(0,32,246,0.20)'
                    : (lift ? '0 16px 36px ' + plan.color + '3a' : '0 1px 2px rgba(0,0,0,0.04)'),
                  padding: '26px 20px 22px', marginTop: 8,
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
                <div style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1.4, marginTop: plan.badge ? 22 : 8, marginBottom: 12 }}>{plan.name}</div>

                <div style={{ minHeight: 44, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                  {plan.free ? (
                    <span style={{ fontFamily: T.fontHead, fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1 }}>Zdarma</span>
                  ) : plan.priceLabel ? (
                    <span style={{ fontFamily: T.fontHead, fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{plan.priceLabel}</span>
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
                  {plan.period}
                </div>
                <div style={{ minHeight: 24, marginTop: 6, marginBottom: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {plan.annualPrice ? (
                    <span style={{ opacity: annual ? 1 : 0, transition: 'opacity .2s', background: 'rgba(0,246,10,0.12)', border: '1px solid rgba(0,246,10,0.3)', color: '#00f60a', fontFamily: T.fontUI, fontSize: 10.5, fontWeight: 800, borderRadius: 8, padding: '3px 9px' }}>
                      ušetříš {((plan.price - plan.annualPrice) * 12).toLocaleString('cs-CZ')} Kč/rok
                    </span>
                  ) : null}
                </div>

                {plan.highlights && plan.highlights.length > 0 && (
                  <>
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', margin: '4px 0 14px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16, textAlign: 'left' }}>
                      {plan.highlights.map((h, hi) => (
                        <div key={hi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          {h.tbd ? (
                            <Icon name="clock-circle-bold" size={15} color="#9CA3AF" />
                          ) : (
                            <Icon name={h.ok ? 'check-circle-bold' : 'close-circle-bold'} size={15} color={h.ok ? '#00f60a' : '#D1D5DB'} />
                          )}
                          <span style={{ color: h.tbd ? '#9CA3AF' : (h.ok ? '#374151' : '#9CA3AF'), fontSize: 12, fontWeight: 600, fontFamily: T.fontUI, lineHeight: 1.3 }}>{h.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
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
                        background: isActive ? '#F3F4F6' : (isSel || isPop) ? 'linear-gradient(135deg, #0020F6, #3a3a99)' : '#fff',
                        border: isActive ? '1px solid #E5E7EB' : (isSel || isPop) ? 'none' : '1.5px solid ' + plan.color,
                        color: isActive ? '#9CA3AF' : (isSel || isPop) ? '#fff' : '#111827',
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

      {/* Proklik na detailní srovnání tarifů */}
      <div style={{ maxWidth: 1180, margin: '0 auto 30px', textAlign: 'center' }}>
        <style>{`
          @keyframes tariffPulse {
            0%, 100% { border-color: #E5E7EB; box-shadow: 0 0 0 0 rgba(0,32,246,0); }
            50% { border-color: rgba(0,32,246,0.5); box-shadow: 0 0 0 4px rgba(0,32,246,0.10); }
          }
          .tariff-compare-btn { animation: tariffPulse 2.4s ease-in-out infinite; }
          .tariff-compare-btn:hover { animation: none; border-color: rgba(0,32,246,0.45) !important; }
        `}</style>
        <button onClick={() => setShowCompare(s => !s)}
          className={showCompare ? '' : 'tariff-compare-btn'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 18,
            padding: '13px 18px', borderRadius: 14,
            background: showCompare ? 'rgba(0,32,246,0.06)' : '#F9FAFB',
            border: '1px solid ' + (showCompare ? 'rgba(0,32,246,0.28)' : '#E5E7EB'),
            color: showCompare ? '#0020F6' : '#374151',
            fontFamily: T.fontUI, fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
            transition: 'all .15s',
          }}>
          <img src="bulb.png" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0, display: 'block' }} />
          Porovnání tarifů přímo pro tebe
          <span style={{ display: 'inline-flex', transition: 'transform .25s', transform: showCompare ? 'rotate(180deg)' : 'none' }}>
            <Icon name="alt-arrow-down-bold" size={15} color={showCompare ? '#0020F6' : '#6B7280'} />
          </span>
        </button>

        {showCompare && (
          <div style={{ marginTop: 18, overflowX: 'auto', textAlign: 'left', animation: 'empPop .3s ease both' }}>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: 18, overflow: 'hidden', minWidth: 900 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(5, minmax(0, 1fr))' }}>

                {/* Hlavička tabulky — jen názvy + ceny tarifů */}
                <div style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }} />
                {PLANS.map(plan => (
                  <div key={plan.id} style={{
                    textAlign: 'center', padding: '14px 10px',
                    borderBottom: '2px solid #E5E7EB', borderLeft: '1px solid #E5E7EB',
                    borderTop: '4px solid ' + plan.color,
                    background: plan.popular ? 'rgba(0,32,246,0.05)' : '#F9FAFB',
                  }}>
                    <div style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.8 }}>{plan.name}</div>
                    <div style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 700, color: '#6B7280', marginTop: 3 }}>
                      {plan.free ? 'Zdarma' : plan.priceLabel ? plan.priceLabel : (plan.pricePrefix || '') + (annual && plan.annualPrice ? plan.annualPrice : plan.price).toLocaleString('cs-CZ') + ' Kč'}
                    </div>
                  </div>
                ))}

                {/* Řádky srovnání funkcí */}
                {FEATURE_ROWS.map((row, ri) => {
                  if (row.section) {
                    return (
                      <div key={'s' + ri} style={{
                        gridColumn: '1 / -1', padding: '9px 16px',
                        background: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
                        color: '#374151', fontFamily: T.fontUI, fontSize: 11, fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: 0.6,
                      }}>{row.section}</div>
                    );
                  }
                  return (
                    <React.Fragment key={ri}>
                      <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', color: '#374151', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600, borderBottom: '1px solid #F3F4F6' }}>
                        {row.label}
                      </div>
                      {PLANS.map(plan => (
                        <div key={plan.id} style={{
                          padding: '11px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: plan.popular ? 'rgba(0,32,246,0.03)' : 'transparent',
                          borderLeft: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6',
                        }}>
                          <FeatureCell value={row.cells[plan.id]} />
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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
      <div style={{ maxWidth: 980, margin: '8px auto 26px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {[
          { pct: '15%', title: 'Roční platba',       text: 'Zaplať rok předem a ušetři 15 %. Nejlepší hodnota pro stabilní nábor.' },
          { icon: 'flash.png', title: 'Upgrade kdykoliv',    text: 'Upgrade tarifu platí okamžitě. Downgrade k dalšímu fakturačnímu období.' },
        ].map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 14, padding: '16px 18px' }}>
            {d.pct
              ? <div style={{ fontFamily: T.fontHead, fontSize: 26, fontWeight: 900, color: '#00f60a', flexShrink: 0, lineHeight: 1 }}>{d.pct}</div>
              : <img src={d.icon} style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />}
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
            'Tarif Vlastní se kalkuluje individuálně. Sleva 5 % do 25 000 Kč/měs, sleva 10 % nad 25 001 Kč/měs.',
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

// ── Plán směn (redesign 1d) — kalendář obsazení. Data zatím UKÁZKOVÁ (tabulka shifts
//    v Supabase ještě není); po jejím vzniku napojit. Kalendář má vlastní navigaci
//    Měsíc/Týden — reportovací roletka (7/30/90 dní) se sem nehodí. ──
const _SH_ROLES = {
  'Uklízečka':     { accent: '#1B34F0', bg: '#EEF1FF', color: '#1B34F0' },
  'Kuchař':        { accent: '#0FA968', bg: '#E6F7EF', color: '#0B7B4B' },
  'Pomocná síla':  { accent: '#6B3FD4', bg: '#F3EDFF', color: '#5A32BC' },
};
const _SH_SHIFTS = [
  { day: 3,  role: 'Uklízečka',    time: '6:00–14:00',  place: 'Provozovna Brno', need: 2, people: [{ name: 'Yasin K.', state: 'potvrzeno' }, { name: 'Adam N.', state: 'potvrzeno' }] },
  { day: 5,  role: 'Kuchař',       time: '10:00–18:00', place: 'Provozovna Brno', need: 1, people: [{ name: 'Petr H.', state: 'potvrzeno' }] },
  { day: 7,  role: 'Uklízečka',    time: '6:00–14:00',  place: 'Provozovna Brno', need: 2, people: [{ name: 'Yasin K.', state: 'potvrzeno' }] },
  { day: 7,  role: 'Kuchař',       time: '14:00–22:00', place: 'Provozovna Brno', need: 1, people: [] },
  { day: 10, role: 'Pomocná síla', time: '11:00–19:00', place: 'Sklad',           need: 1, people: [{ name: 'Lucie V.', state: 'čeká' }] },
  { day: 12, role: 'Uklízečka',    time: '6:00–14:00',  place: 'Provozovna Brno', need: 2, people: [{ name: 'Yasin K.', state: 'potvrzeno' }, { name: 'Markéta S.', state: 'potvrzeno' }] },
  { day: 14, role: 'Kuchař',       time: '10:00–18:00', place: 'Provozovna Brno', need: 2, people: [{ name: 'Petr H.', state: 'potvrzeno' }] },
  { day: 17, role: 'Uklízečka',    time: '6:00–14:00',  place: 'Provozovna Brno', need: 1, people: [{ name: 'Adam N.', state: 'potvrzeno' }] },
  { day: 19, role: 'Pomocná síla', time: '11:00–19:00', place: 'Sklad',           need: 2, people: [] },
  { day: 21, role: 'Kuchař',       time: '14:00–22:00', place: 'Provozovna Brno', need: 1, people: [{ name: 'Petr H.', state: 'čeká' }] },
  { day: 22, role: 'Kuchař',       time: '10:00–18:00', place: 'Provozovna Brno', need: 1, people: [] },
  { day: 24, role: 'Uklízečka',    time: '6:00–14:00',  place: 'Provozovna Brno', need: 2, people: [{ name: 'Yasin K.', state: 'potvrzeno' }, { name: 'Markéta S.', state: 'potvrzeno' }] },
  { day: 26, role: 'Kuchař',       time: '10:00–18:00', place: 'Provozovna Brno', need: 1, people: [{ name: 'Petr H.', state: 'potvrzeno' }] },
  { day: 28, role: 'Uklízečka',    time: '6:00–14:00',  place: 'Provozovna Brno', need: 2, people: [{ name: 'Adam N.', state: 'potvrzeno' }] },
  { day: 31, role: 'Pomocná síla', time: '11:00–19:00', place: 'Sklad',           need: 1, people: [{ name: 'Lucie V.', state: 'potvrzeno' }] },
];
const _SH_WD      = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const _SH_WD_FULL = ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota', 'neděle'];
const _shPlural = (n, one, few, many) => n + ' ' + (n === 1 ? one : n < 5 ? few : many);

function EShifts({ onTab, onNew, period, onPeriod }) {
  const [view, setView]       = React.useState('month');
  const [weekOffset, setWeek] = React.useState(0);
  const [selected, setSel]    = React.useState(8);
  const [role, setRole]       = React.useState('all');
  const [openOnly, setOpen]   = React.useState(false);
  const today = 8, daysInMonth = 31, firstWeekday = 5; // srpen 2026 (1. 8. = sobota)

  const shiftsFor = day => _SH_SHIFTS.filter(s => s.day === day).filter(s => role === 'all' || s.role === role).filter(s => !openOnly || s.people.length < s.need);
  const visible = _SH_SHIFTS.filter(s => role === 'all' || s.role === role).filter(s => !openOnly || s.people.length < s.need);
  const totalShifts = visible.length;
  const openCount = visible.filter(s => s.people.length < s.need).length;
  const slots = visible.reduce((a, s) => a + s.need, 0);
  const filled = visible.reduce((a, s) => a + Math.min(s.people.length, s.need), 0);
  const fillRate = slots ? Math.round(filled / slots * 100) + ' %' : '0 %';
  const peopleSet = new Set(); visible.forEach(s => s.people.forEach(p => peopleSet.add(p.name)));
  const totalHours = visible.reduce((a, s) => a + 8 * s.need, 0);
  const vM = view === 'month', vW = view === 'week';

  const cells = [];
  const totalCells = vM ? Math.ceil((firstWeekday + daysInMonth) / 7) * 7 : 7;
  const weekStart = vW ? 1 + weekOffset * 7 - firstWeekday : 0;
  for (let i = 0; i < totalCells; i++) {
    const dayNum = vM ? i - firstWeekday + 1 : weekStart + i;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const wd = i % 7;
    const dayShifts = inMonth ? shiftsFor(dayNum) : [];
    const openHere = dayShifts.filter(s => s.people.length < s.need).length;
    const sel = inMonth && dayNum === selected;
    const isToday = inMonth && dayNum === today;
    const shown = dayShifts.slice(0, vM ? 2 : 5);
    cells.push({
      key: i, num: inMonth ? String(dayNum) : '', dayNum, inMonth,
      minH: vM ? 112 : 360,
      bg: !inMonth ? '#FBFCFE' : sel ? '#F6F7FC' : wd > 4 ? '#FBFCFE' : '#fff',
      ring: sel ? 'inset 0 0 0 2px #1B34F0' : 'none',
      numWeight: isToday ? 800 : 700,
      numColor: !inMonth ? '#D5DAF0' : isToday ? '#fff' : '#0B1233',
      numBg: isToday ? '#1B34F0' : 'transparent',
      hasOpen: openHere > 0,
      openLabel: _shPlural(openHere, 'volná', 'volné', 'volných'),
      chips: shown.map((s, j) => {
        const r = _SH_ROLES[s.role]; const isOpen = s.people.length < s.need;
        return { key: j, label: s.time.split('–')[0] + ' ' + s.role, bg: isOpen ? '#FFF8EE' : r.bg, accent: isOpen ? '#F5920B' : r.accent, color: isOpen ? '#B96F06' : r.color };
      }),
      more: dayShifts.length > shown.length, moreLabel: '+ ' + (dayShifts.length - shown.length) + ' další',
    });
  }

  const selShifts = shiftsFor(selected).map(s => {
    const r = _SH_ROLES[s.role]; const isOpen = s.people.length < s.need;
    return {
      role: s.role, time: s.time, place: s.place,
      border: isOpen ? '#F5920B' : '#E6E9F5', bg: isOpen ? '#FFF8EE' : '#fff',
      badge: isOpen ? 'Chybí ' + (s.need - s.people.length) : 'Obsazeno',
      badgeColor: isOpen ? '#B96F06' : '#0B7B4B', badgeBg: isOpen ? '#FFF3E0' : '#E6F7EF',
      pct: Math.round(s.people.length / s.need * 100) + '%', accent: isOpen ? '#F5920B' : r.accent,
      filledLabel: s.people.length + '/' + s.need, open: isOpen,
      people: s.people.map(p => ({ name: p.name, initials: p.name.split(' ').map(w => w[0]).join('').slice(0, 2), state: p.state, stateColor: p.state === 'potvrzeno' ? '#0B7B4B' : '#B96F06' })),
    };
  });
  const selWd = _SH_WD_FULL[(firstWeekday + selected - 1) % 7];
  const selOpen = selShifts.filter(s => s.open).length;

  const weeks = [];
  for (let w = 0; w < Math.ceil((firstWeekday + daysInMonth) / 7); w++) {
    const from = w * 7 - firstWeekday + 1, to = from + 6;
    const count = visible.filter(s => s.day >= from && s.day <= to).length;
    const open = visible.filter(s => s.day >= from && s.day <= to && s.people.length < s.need).length;
    weeks.push({ label: (w + 1) + '. t', count, open });
  }
  const maxW = Math.max.apply(null, weeks.map(w => w.count).concat(1));
  const weekLoad = weeks.map(w => ({ label: w.label, count: w.count, pct: Math.round(w.count / maxW * 100) + '%', color: w.open ? '#F5920B' : '#1B34F0' }));
  const busiest = weeks.reduce((a, b) => (b.count > a.count ? b : a), weeks[0]);
  const loadNote = busiest && busiest.open
    ? busiest.label.replace(' t', '. týden') + ' má ' + _shPlural(busiest.open, 'neobsazenou směnu', 'neobsazené směny', 'neobsazených směn') + ' — doplňte ji jako první.'
    : 'Všechny týdny jsou obsazené.';

  const roleFilters = [{ label: 'Vše', key: 'all', dot: '#A6ADCB' }]
    .concat(Object.keys(_SH_ROLES).map(k => ({ label: k, key: k, dot: _SH_ROLES[k].accent })))
    .map(r => { const on = role === r.key; return { label: r.label, key: r.key, dot: on ? '#fff' : r.dot, color: on ? '#fff' : '#3A4266', bg: on ? '#1B34F0' : '#fff', border: on ? '#1B34F0' : '#E6E9F5', pick: () => setRole(r.key) }; });

  const periodLabel = vM ? 'Srpen 2026' : (weekOffset + 1) + '. týden · srpen 2026';
  const goPrev = () => vW ? setWeek(Math.max(0, weekOffset - 1)) : null;
  const goNext = () => vW ? setWeek(Math.min(4, weekOffset + 1)) : null;

  return (
    <div style={{ padding: 20 }}>
      <div style={_erS(`background:${_erC.bg};border:1px solid ${_erC.shell};border-radius:22px;overflow:hidden`)}>

        {/* Modrá hlavička */}
        <div style={_erS(`background:${_erC.blue};padding:20px 26px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap`)}>
          <div style={_erS('display:flex;align-items:center;gap:14px;min-width:0')}>
            <span style={_erS('font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em')}>Plán směn</span>
            <span style={_erS('width:1px;height:22px;background:rgba(255,255,255,.28)')} />
            <span style={_erS(`font-size:14px;color:${_erC.onBlue2}`)}>Kalendář obsazení · {_shPlural(openCount, 'neobsazená směna', 'neobsazené směny', 'neobsazených směn')}</span>
          </div>
          <div style={_erS('display:flex;align-items:center;gap:10px')}>
            <div style={_erS('display:flex;background:rgba(255,255,255,.14);border-radius:9px;padding:3px;gap:2px')}>
              <button onClick={() => setView('month')} style={_erS(`font-size:13px;font-weight:700;padding:6px 13px;border-radius:7px;border:none;cursor:pointer;color:${vM ? _erC.blue : _erC.onBlue2};background:${vM ? '#fff' : 'transparent'}`)}>Měsíc</button>
              <button onClick={() => { setView('week'); setWeek(Math.floor((selected + firstWeekday - 1) / 7)); }} style={_erS(`font-size:13px;font-weight:700;padding:6px 13px;border-radius:7px;border:none;cursor:pointer;color:${vW ? _erC.blue : _erC.onBlue2};background:${vW ? '#fff' : 'transparent'}`)}>Týden</button>
            </div>
            <EPeriodPicker value={period} onChange={onPeriod} />
            <button onClick={onNew} style={_erS(`font-size:14px;font-weight:800;color:${_erC.blue};background:#fff;border:none;padding:11px 18px;border-radius:9px;cursor:pointer`)}>+ Nová směna</button>
          </div>
        </div>

        {/* Pás metrik */}
        <div style={_erS(`background:${_erC.blue};display:grid;grid-template-columns:repeat(4,1fr);padding-bottom:6px`)}>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Směny v srpnu</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{totalShifts}</span>
              <span style={_erS(`font-size:12px;color:${_erC.onBlue2}`)}>{totalHours} hodin</span>
            </div>
          </div>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px;border-left:1px solid rgba(255,255,255,.2)')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Neobsazené</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{openCount}</span>
              <button onClick={() => setOpen(o => !o)} style={_erS(`font-size:12px;font-weight:800;color:#0B1233;background:${_erC.amberOnDark};border:none;padding:4px 9px;border-radius:6px;cursor:pointer`)}>{openOnly ? 'Zrušit filtr' : 'Zobrazit'}</button>
            </div>
          </div>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px;border-left:1px solid rgba(255,255,255,.2)')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Obsazenost</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{fillRate}</span>
              <span style={_erS('width:74px;height:6px;border-radius:999px;background:rgba(255,255,255,.25);display:block')}><span style={{ display: 'block', width: fillRate, height: '100%', borderRadius: 999, background: '#fff' }} /></span>
            </div>
          </div>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px;border-left:1px solid rgba(255,255,255,.2)')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Brigádníci</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{peopleSet.size}</span>
              <span style={_erS(`font-size:12px;color:${_erC.onBlue2}`)}>v tomto měsíci</span>
            </div>
          </div>
        </div>

        {/* Tělo */}
        <div style={_erS('padding:22px 24px 26px;display:grid;grid-template-columns:1fr 324px;gap:20px;align-items:start')}>
          {/* Kalendář */}
          <div style={_erS('background:#fff;border:1px solid #E6E9F5;border-radius:16px;overflow:hidden')}>
            <div style={_erS('padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid #F0F2FA;flex-wrap:wrap')}>
              <div style={_erS('display:flex;align-items:center;gap:12px')}>
                <button onClick={goPrev} style={_erS('width:34px;height:34px;border:1px solid #E6E9F5;background:#fff;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#3A4266;cursor:pointer')}>‹</button>
                <span style={_erS('font-size:18px;font-weight:800;color:#0B1233;letter-spacing:-.01em;min-width:150px;text-align:center')}>{periodLabel}</span>
                <button onClick={goNext} style={_erS('width:34px;height:34px;border:1px solid #E6E9F5;background:#fff;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#3A4266;cursor:pointer')}>›</button>
                <button onClick={() => { setSel(today); setView('month'); }} style={_erS('font-size:13px;font-weight:700;color:#3A4266;background:#fff;border:1px solid #E6E9F5;padding:8px 13px;border-radius:9px;cursor:pointer')}>Dnes</button>
              </div>
              <div style={_erS('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}>
                {roleFilters.map(rf => (
                  <button key={rf.key} onClick={rf.pick} style={{ ...(_erS(`display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;padding:7px 12px;border-radius:999px;cursor:pointer`)), color: rf.color, background: rf.bg, border: '1px solid ' + rf.border }}>
                    <span style={{ width: 8, height: 8, borderRadius: 3, background: rf.dot }} />{rf.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={_erS('display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid #F0F2FA')}>
              {_SH_WD.map((w, i) => <span key={w} style={_erS(`font-size:11px;font-weight:800;letter-spacing:.07em;color:#A6ADCB;text-transform:uppercase;padding:12px 14px;text-align:${i > 4 ? 'center' : 'left'}`)}>{w}</span>)}
            </div>

            <div style={_erS('display:grid;grid-template-columns:repeat(7,1fr)')}>
              {cells.map(d => (
                <div key={d.key} onClick={() => d.inMonth && setSel(d.dayNum)} style={{ minHeight: d.minH, borderRight: '1px solid #F0F2FA', borderBottom: '1px solid #F0F2FA', padding: 10, display: 'flex', flexDirection: 'column', gap: 6, cursor: d.inMonth ? 'pointer' : 'default', background: d.bg, boxShadow: d.ring }}>
                  <div style={_erS('display:flex;align-items:center;justify-content:space-between;gap:6px')}>
                    <span style={{ fontSize: 13, fontWeight: d.numWeight, color: d.numColor, width: 24, height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: d.numBg }}>{d.num}</span>
                    {d.hasOpen && <span style={_erS('font-size:10px;font-weight:800;color:#B96F06;background:#FFF3E0;padding:2px 6px;border-radius:5px')}>{d.openLabel}</span>}
                  </div>
                  {d.chips.map(ch => (
                    <div key={ch.key} style={{ display: 'flex', alignItems: 'center', gap: 6, background: ch.bg, borderLeft: '3px solid ' + ch.accent, borderRadius: 6, padding: '5px 7px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: ch.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.label}</span>
                    </div>
                  ))}
                  {d.more && <span style={_erS('font-size:11px;font-weight:700;color:#A6ADCB;padding-left:2px')}>{d.moreLabel}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Pravý sloupec */}
          <div style={_erS('display:flex;flex-direction:column;gap:16px')}>
            <div style={_erS('background:#fff;border:1px solid #E6E9F5;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:16px')}>
              <div style={_erS('display:flex;align-items:flex-start;justify-content:space-between;gap:12px')}>
                <div style={_erS('display:flex;flex-direction:column;gap:3px')}>
                  <span style={_erS('font-size:16px;font-weight:800;color:#0B1233')}>{selected}. srpna · {selWd}</span>
                  <span style={_erS('font-size:13px;color:#7A82A6')}>{selShifts.length ? (_shPlural(selShifts.length, 'směna', 'směny', 'směn') + ' · ' + (selOpen ? _shPlural(selOpen, 'neobsazená', 'neobsazené', 'neobsazených') : 'vše obsazeno')) : 'volno'}</span>
                </div>
                <button onClick={onNew} style={_erS('font-size:12px;font-weight:800;color:#1B34F0;background:#fff;border:1px solid #D5DAF0;padding:8px 12px;border-radius:9px;cursor:pointer;white-space:nowrap')}>+ Směna</button>
              </div>
              <div style={_erS('display:flex;flex-direction:column;gap:10px')}>
                {selShifts.map((sh, i) => (
                  <div key={i} style={{ border: '1px solid ' + sh.border, background: sh.bg, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={_erS('display:flex;align-items:flex-start;justify-content:space-between;gap:10px')}>
                      <div style={_erS('display:flex;flex-direction:column;gap:3px')}>
                        <span style={_erS('font-size:14px;font-weight:800;color:#0B1233')}>{sh.role}</span>
                        <span style={_erS('font-size:12px;color:#7A82A6')}>{sh.time} · {sh.place}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: sh.badgeColor, background: sh.badgeBg, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{sh.badge}</span>
                    </div>
                    <div style={_erS('display:flex;align-items:center;gap:8px')}>
                      <span style={_erS('flex:1;height:6px;border-radius:999px;background:#EEF1FF;display:block')}><span style={{ display: 'block', width: sh.pct, height: '100%', borderRadius: 999, background: sh.accent }} /></span>
                      <span style={_erS('font-size:12px;font-weight:800;color:#0B1233;flex:none')}>{sh.filledLabel}</span>
                    </div>
                    {sh.people.map((p, j) => (
                      <div key={j} style={_erS('display:flex;align-items:center;gap:9px')}>
                        <span style={_erS('width:26px;height:26px;border-radius:8px;background:#EEF1FF;color:#1B34F0;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none')}>{p.initials}</span>
                        <span style={_erS('font-size:13px;color:#0B1233;flex:1')}>{p.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: p.stateColor }}>{p.state}</span>
                      </div>
                    ))}
                    {sh.open && <button onClick={() => onTab && onTab('candidates')} style={_erS('font-size:12px;font-weight:800;color:#fff;background:#1B34F0;border:none;padding:9px;border-radius:9px;text-align:center;cursor:pointer')}>Najít brigádníka</button>}
                  </div>
                ))}
                {selShifts.length === 0 && (
                  <div style={_erS('border:1px dashed #D5DAF0;border-radius:12px;padding:28px 14px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center')}>
                    <span style={_erS('font-size:13px;color:#A6ADCB')}>Na tento den není naplánovaná žádná směna.</span>
                    <button onClick={onNew} style={_erS('font-size:12px;font-weight:800;color:#1B34F0;background:none;border:none;cursor:pointer')}>Naplánovat směnu</button>
                  </div>
                )}
              </div>
            </div>

            <div style={_erS('background:#fff;border:1px solid #E6E9F5;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:14px')}>
              <div style={_erS('display:flex;align-items:center;justify-content:space-between;gap:12px')}>
                <span style={_erS('font-size:15px;font-weight:800;color:#0B1233')}>Zatížení týdnů</span>
                <span style={_erS('font-size:12px;color:#7A82A6')}>{periodLabel}</span>
              </div>
              <div style={_erS('display:flex;flex-direction:column;gap:9px')}>
                {weekLoad.map((wl, i) => (
                  <div key={i} style={_erS('display:flex;align-items:center;gap:10px')}>
                    <span style={_erS('font-size:12px;font-weight:700;color:#3A4266;width:42px;flex:none')}>{wl.label}</span>
                    <span style={_erS('flex:1;height:8px;border-radius:999px;background:#F1F3FB;display:block')}><span style={{ display: 'block', width: wl.pct, height: '100%', borderRadius: 999, background: wl.color }} /></span>
                    <span style={_erS('font-size:12px;font-weight:700;color:#0B1233;width:34px;text-align:right;flex:none')}>{wl.count}</span>
                  </div>
                ))}
              </div>
              <span style={_erS('font-size:13px;color:#7A82A6;line-height:1.5')}>{loadNote}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { EShifts });

// ── Kandidáti (redesign 1d) — lidé, kteří reagovali na inzeráty. Reálná data z E_CANDIDATES;
//    vhodnost = match % (u reálných dopočítaná), dostupnost/poznámka jsou dopočítané ukázkové.
//    Akce „Napsat zprávu" (onOpenChat) a „Poslat inzerát" si drží funkci i ikonku z původní obrazovky. ──
const _EC_STAGES = {
  new:     { label: 'Nová shoda',   color: '#B96F06', bg: '#FFF3E0', dot: '#F5920B' },
  talking: { label: 'Komunikujeme', color: '#1B34F0', bg: '#EEF1FF', dot: '#1B34F0' },
  known:   { label: 'Už se známe',  color: '#5A32BC', bg: '#F3EDFF', dot: '#6B3FD4' },
  hired:   { label: 'Najato',       color: '#0B7B4B', bg: '#E6F7EF', dot: '#0FA968' },
};
const _EC_STEPS = ['Shoda', 'Zpráva', 'Pohovor', 'Směna'];
const _EC_SORTS = { new: 'Nejnovější', fit: 'Nejvhodnější', rating: 'Nejvyšší hodnocení', shifts: 'Nejvíc směn' };
const _EC_NEXTSORT = { new: 'fit', fit: 'rating', rating: 'shifts', shifts: 'new' };
const _EC_NOTE = {
  new: 'Nový kandidát bez historie. Krátký telefonát ověří dostupnost.',
  talking: 'Už reagoval — navažte konverzaci a nabídněte konkrétní směnu.',
  known: 'Znáte se z dřívějška — vhodný na opakovaný nábor.',
  hired: 'Aktuálně u vás pracuje.',
};
const _ecHash = s => { let h = 0; for (let i = 0; i < (s || '').length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h); };
const _ecShifts = n => n + ' ' + (n === 1 ? 'směna' : (n >= 2 && n <= 4) ? 'směny' : 'směn');

function ECandidates({ onOpenChat, onNew, period, onPeriod } = {}) {
  const [tab, setTab]         = React.useState('all');
  const [query, setQuery]     = React.useState('');
  const [sort, setSort]       = React.useState('new');
  const [open, setOpen]       = React.useState(null);
  const [listing, setListing] = React.useState('all');

  const C = (typeof E_CANDIDATES !== 'undefined' ? E_CANDIDATES : {});
  const flat = []
    .concat((C.new || []).map(c => ({ ...c, stage: 'new' })))
    .concat((C.shortlist || []).map(c => ({ ...c, stage: 'talking' })))
    .concat((C.interview || []).map(c => ({ ...c, stage: 'known' })))
    .concat((C.hired || []).map(c => ({ ...c, stage: 'hired' })));

  const counts = {
    all: flat.length,
    new: flat.filter(p => p.stage === 'new').length,
    talking: flat.filter(p => p.stage === 'talking').length,
    known: flat.filter(p => p.stage === 'known').length,
    rated: flat.filter(p => Number(p.rating) > 0).length,
  };
  const q = query.trim().toLowerCase();
  let list = flat.filter(p => {
    if (tab === 'new' && p.stage !== 'new') return false;
    if (tab === 'talking' && p.stage !== 'talking') return false;
    if (tab === 'known' && p.stage !== 'known') return false;
    if (tab === 'rated' && !(Number(p.rating) > 0)) return false;
    if (listing !== 'all' && (p.jobTitle || '') !== listing) return false;
    if (q && !((p.name + ' ' + (p.jobTitle || '')).toLowerCase().includes(q))) return false;
    return true;
  });
  list = list.slice().sort((a, b) => sort === 'fit' ? _fit(b) - _fit(a) : sort === 'rating' ? (Number(b.rating) || 0) - (Number(a.rating) || 0) : sort === 'shifts' ? (b.jobsDone || 0) - (a.jobsDone || 0) : 0);

  function _fit(c) { return Number(c.match) > 0 ? Number(c.match) : Math.max(40, Math.min(96, 45 + (Number(c.rating) || 0) * 7 + Math.min(15, c.jobsDone || 0))); }
  const fitColor = f => f >= 80 ? '#0FA968' : f >= 60 ? '#1B34F0' : '#F5920B';
  const stepOf = st => ({ new: 1, talking: 2, known: 3, hired: 4 }[st] || 1);

  const positions = [...new Set(flat.map(p => p.jobTitle).filter(Boolean))];
  const maxPos = Math.max.apply(null, [flat.length].concat(positions.map(pos => flat.filter(p => p.jobTitle === pos).length)).concat(1));
  const byListing = [{ label: 'Všechny inzeráty', key: 'all', count: flat.length }].concat(positions.map(pos => ({ label: pos, key: pos, count: flat.filter(p => p.jobTitle === pos).length })));
  const stageStats = Object.keys(_EC_STAGES).map(k => ({ label: _EC_STAGES[k].label, color: _EC_STAGES[k].dot, count: flat.filter(p => p.stage === k).length }));

  const rangeLbl = (period && typeof period === 'object') ? 'vlastní období' : ({ '7d': '7 dní', '30d': '30 dní', '90d': '90 dní', 'rok': 'rok' }[period] || '30 dní');
  const tabs = [['all', 'Vše'], ['new', 'Nové shody'], ['talking', 'Komunikujeme'], ['known', 'Už se známe'], ['rated', 'S hodnocením']];
  const tabCount = { all: counts.all, new: counts.new, talking: counts.talking, known: counts.known, rated: counts.rated };

  return (
    <div style={{ padding: 20 }}>
      <div style={_erS(`background:${_erC.bg};border:1px solid ${_erC.shell};border-radius:22px;overflow:hidden`)}>

        {/* Modrá hlavička */}
        <div style={_erS(`background:${_erC.blue};padding:20px 26px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap`)}>
          <div style={_erS('display:flex;align-items:center;gap:14px;min-width:0')}>
            <span style={_erS('font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em')}>Kandidáti</span>
            <span style={_erS('width:1px;height:22px;background:rgba(255,255,255,.28)')} />
            <span style={_erS(`font-size:14px;color:${_erC.onBlue2}`)}>Lidé, kteří reagovali na vaše inzeráty · {counts.new} nových</span>
          </div>
          <div style={_erS('display:flex;align-items:center;gap:10px')}>
            <EPeriodPicker value={period} onChange={onPeriod} />
            <button onClick={onNew} style={_erS(`font-size:14px;font-weight:800;color:${_erC.blue};background:#fff;border:none;padding:11px 18px;border-radius:9px;cursor:pointer`)}>+ Nový inzerát</button>
          </div>
        </div>

        {/* Pás metrik */}
        <div style={_erS(`background:${_erC.blue};display:grid;grid-template-columns:repeat(4,1fr);padding-bottom:6px`)}>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Kandidáti celkem</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{counts.all}</span>
              <span style={_erS(`font-size:12px;color:${_erC.onBlue2}`)}>za {rangeLbl}</span>
            </div>
          </div>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px;border-left:1px solid rgba(255,255,255,.2)')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Čeká na reakci</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{counts.new}</span>
              <button onClick={() => setTab('new')} style={_erS(`font-size:12px;font-weight:800;color:#0B1233;background:${_erC.amberOnDark};border:none;padding:4px 9px;border-radius:6px;cursor:pointer`)}>Projít</button>
            </div>
          </div>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px;border-left:1px solid rgba(255,255,255,.2)')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>S hodnocením</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{counts.rated}</span>
              <div style={_erS('display:flex;align-items:flex-end;gap:2px;height:24px')}>{[40, 55, 50, 80, 100].map((h, i) => <span key={i} style={_erS(`width:5px;height:${h}%;background:${i > 2 ? '#fff' : 'rgba(255,255,255,.3)'};border-radius:2px`)} />)}</div>
            </div>
          </div>
          <div style={_erS('padding:6px 24px 20px;display:flex;flex-direction:column;gap:8px;border-left:1px solid rgba(255,255,255,.2)')}>
            <span style={_erS(`font-size:11px;font-weight:800;letter-spacing:.09em;color:${_erC.onBlue};text-transform:uppercase`)}>Odbrigádovaných směn</span>
            <div style={_erS('display:flex;align-items:flex-end;justify-content:space-between;gap:12px')}>
              <span style={_erS('font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1')}>{flat.reduce((a, p) => a + (p.jobsDone || 0), 0)}</span>
              <span style={_erS(`font-size:12px;color:${_erC.onBlue2}`)}>u vaší firmy</span>
            </div>
          </div>
        </div>

        {/* Tělo */}
        <div style={_erS('padding:22px 24px 26px;display:grid;grid-template-columns:1fr 324px;gap:20px;align-items:start')}>
          <div style={_erS('display:flex;flex-direction:column;gap:16px;min-width:0')}>
            {/* Filtrační lišta */}
            <div style={_erS(`background:#fff;border:1px solid ${_erC.line};border-radius:16px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap`)}>
              <div style={_erS('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}>
                {tabs.map(([k, l]) => {
                  const on = tab === k;
                  return (
                    <button key={k} onClick={() => setTab(k)} style={{ ...(_erS('display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;padding:8px 14px;border-radius:999px;cursor:pointer;white-space:nowrap')), color: on ? '#fff' : '#3A4266', background: on ? '#1B34F0' : '#fff', border: '1px solid ' + (on ? '#1B34F0' : '#E6E9F5') }}>
                      {l}<span style={{ fontSize: 12, fontWeight: 800, color: on ? '#A9B7FF' : '#A6ADCB' }}>{tabCount[k]}</span>
                    </button>
                  );
                })}
              </div>
              <div style={_erS('display:flex;align-items:center;gap:10px')}>
                <button onClick={() => setSort(_EC_NEXTSORT[sort])} style={_erS('font-size:13px;font-weight:700;color:#3A4266;background:#fff;border:1px solid #E6E9F5;padding:9px 14px;border-radius:9px;cursor:pointer;white-space:nowrap')}>{_EC_SORTS[sort]} ↓</button>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Hledat kandidáta, pozici…" style={_erS('font-family:inherit;font-size:13px;color:#0B1233;background:#F6F7FC;border:1px solid #E6E9F5;border-radius:9px;padding:9px 12px;width:196px;outline:none')} />
              </div>
            </div>

            {list.map((p, idx) => {
              const st = _EC_STAGES[p.stage];
              const av = _EC_AV_C[idx % 4];
              const fit = _fit(p);
              const fc = fitColor(fit);
              const rated = Number(p.rating) > 0;
              const step = stepOf(p.stage);
              const isOpen = open === p.id;
              return (
                <div key={p.id} style={_erS(`background:#fff;border:1px solid ${p.stage === 'new' ? _erC.amber : _erC.line};border-radius:16px;overflow:hidden`)}>
                  <div style={_erS('padding:18px 22px;display:flex;align-items:center;gap:18px;flex-wrap:wrap')}>
                    <span style={{ width: 56, height: 56, flex: 'none', borderRadius: 16, background: av.bg, color: av.color, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                    <div style={_erS('flex:1;min-width:0;display:flex;flex-direction:column;gap:8px')}>
                      <div style={_erS('display:flex;align-items:center;gap:10px;flex-wrap:wrap')}>
                        <span style={_erS('font-size:17px;font-weight:800;color:#0B1233;letter-spacing:-.01em')}>{p.name}</span>
                        <span style={_erS('font-size:13px;color:#7A82A6')}>{p.jobTitle || ''}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: st.color, background: st.bg, padding: '3px 9px', borderRadius: 6 }}>{st.label}</span>
                      </div>
                      <div style={_erS('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: rated ? '#B96F06' : '#A6ADCB', background: rated ? '#FFF8EE' : '#F6F7FC', padding: '5px 10px', borderRadius: 7 }}><span style={{ color: rated ? '#F5920B' : '#DDE1F0' }}>★</span>{rated ? String(p.rating).replace('.', ',') : 'bez hodnocení'}</span>
                        <span style={_erS('display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#3A4266;background:#F1F3FB;padding:5px 10px;border-radius:7px')}><span style={_erS('color:#7A82A6')}>◔</span>{_ecShifts(p.jobsDone || 0)}</span>
                        <span style={_erS('font-size:12px;font-weight:700;color:#1B34F0;background:#EEF1FF;padding:5px 10px;border-radius:7px')}>Level {p.level || 1}</span>
                        {p.lastSeen && <span style={_erS('font-size:12px;color:#A6ADCB')}>{p.lastSeen}</span>}
                      </div>
                    </div>
                    <div style={_erS('display:flex;flex-direction:column;gap:9px;width:206px;flex:none')}>
                      <div style={_erS('display:flex;align-items:center;justify-content:space-between;gap:8px')}>
                        <span style={_erS('font-size:11px;font-weight:800;letter-spacing:.07em;color:#A6ADCB;text-transform:uppercase')}>Vhodnost</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: fc }}>{fit} %</span>
                      </div>
                      <span style={_erS('height:6px;border-radius:999px;background:#F1F3FB;display:block;overflow:hidden')}><span style={{ display: 'block', width: fit + '%', height: '100%', borderRadius: 999, background: fc }} /></span>
                      <span style={_erS('font-size:11px;color:#7A82A6;line-height:1.4')}>{rated ? 'Hodnocení a odpracované směny' : 'Odpovídá pozici, chybí historie směn'}</span>
                    </div>
                    <div style={_erS('display:flex;flex-direction:column;gap:8px;width:172px;flex:none')}>
                      <button onClick={() => onOpenChat && onOpenChat(p.match_id)} style={_erS('display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:800;color:#fff;background:#1B34F0;border:none;padding:10px 14px;border-radius:9px;cursor:pointer')}>
                        <img src="messages-icon.png" style={{ width: 15, height: 15, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />Napsat zprávu
                      </button>
                      <button style={_erS('display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:700;color:#1B34F0;background:#fff;border:1px solid #D5DAF0;padding:10px 14px;border-radius:9px;cursor:pointer')}>
                        <img src="send.png" style={{ width: 15, height: 15, objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(26%) sepia(98%) saturate(1200%) hue-rotate(228deg) brightness(90%)' }} />Poslat inzerát
                      </button>
                    </div>
                    <button onClick={() => setOpen(o => o === p.id ? null : p.id)} style={{ width: 36, height: 36, flex: 'none', border: '1px solid #E6E9F5', background: '#fff', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#7A82A6', cursor: 'pointer' }}>{isOpen ? '▲' : '▼'}</button>
                  </div>

                  {isOpen && (
                    <div style={_erS('border-top:1px solid #F0F2FA;background:#FBFCFE;padding:20px 22px;display:grid;grid-template-columns:1.25fr 1fr;gap:26px')}>
                      <div style={_erS('display:flex;flex-direction:column;gap:14px')}>
                        <span style={_erS('font-size:11px;font-weight:800;letter-spacing:.09em;color:#A6ADCB;text-transform:uppercase')}>Průběh</span>
                        <div style={_erS('display:flex;align-items:flex-start;gap:0')}>
                          {_EC_STEPS.map((label, i) => {
                            const done = i < step - 1, cur = i === step - 1;
                            return (
                              <div key={i} style={_erS('flex:1;display:flex;flex-direction:column;gap:9px;min-width:0')}>
                                <div style={_erS('display:flex;align-items:center;gap:0')}>
                                  <span style={{ height: 3, flex: 1, background: i === 0 ? 'transparent' : (i <= step - 1 ? '#1B34F0' : '#EEF1FF'), borderRadius: 999 }} />
                                  <span style={{ width: 24, height: 24, flex: 'none', borderRadius: 8, background: done ? '#1B34F0' : cur ? '#fff' : '#F1F3FB', border: '2px solid ' + (done || cur ? '#1B34F0' : '#E6E9F5'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: done ? '#fff' : cur ? '#1B34F0' : '#A6ADCB' }}>{done ? '✓' : String(i + 1)}</span>
                                  <span style={{ height: 3, flex: 1, background: i === _EC_STEPS.length - 1 ? 'transparent' : (i < step - 1 ? '#1B34F0' : '#EEF1FF'), borderRadius: 999 }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: cur ? 800 : 700, color: i <= step - 1 ? '#0B1233' : '#A6ADCB', whiteSpace: 'nowrap', textAlign: 'center' }}>{label}</span>
                              </div>
                            );
                          })}
                        </div>
                        <span style={_erS('font-size:11px;font-weight:800;letter-spacing:.09em;color:#A6ADCB;text-transform:uppercase')}>Dostupnost</span>
                        <div style={_erS('display:grid;grid-template-columns:repeat(7,1fr);gap:5px')}>
                          {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((d, i) => {
                            const on = ((_ecHash(p.name || '') >> i) & 1) === 1;
                            return <div key={i} style={_erS('display:flex;flex-direction:column;gap:5px;align-items:center')}><span style={_erS('font-size:10px;font-weight:700;color:#A6ADCB')}>{d}</span><span style={{ width: '100%', height: 26, borderRadius: 7, background: on ? '#EEF1FF' : '#F6F7FC' }} /></div>;
                          })}
                        </div>
                      </div>
                      <div style={_erS('display:flex;flex-direction:column;gap:14px')}>
                        <div style={_erS('display:flex;flex-direction:column;gap:8px')}>
                          <span style={_erS('font-size:11px;font-weight:800;letter-spacing:.09em;color:#A6ADCB;text-transform:uppercase')}>Zkušenost</span>
                          <div style={_erS('display:flex;gap:7px;flex-wrap:wrap')}>
                            {(Array.isArray(p.tags) && p.tags.length ? p.tags : ['Bez zkušenosti']).map((sk, i) => <span key={i} style={_erS('font-size:12px;font-weight:700;color:#3A4266;background:#F1F3FB;padding:6px 11px;border-radius:999px')}>{sk}</span>)}
                          </div>
                        </div>
                        <div style={_erS('display:flex;flex-direction:column;gap:8px')}>
                          <span style={_erS('font-size:11px;font-weight:800;letter-spacing:.09em;color:#A6ADCB;text-transform:uppercase')}>Poznámka</span>
                          <span style={_erS('font-size:13px;color:#3A4266;line-height:1.5')}>{_EC_NOTE[p.stage]}</span>
                        </div>
                        <div style={_erS('display:flex;gap:8px;padding-top:2px')}>
                          <button onClick={() => onOpenChat && onOpenChat(p.match_id)} style={_erS('font-size:12px;font-weight:800;color:#fff;background:#0B1233;border:none;padding:9px 13px;border-radius:9px;cursor:pointer')}>Nabídnout směnu</button>
                          <button onClick={() => window.empOpenProfile && window.empOpenProfile(p.worker_id, { name: p.name, level: p.level, jobs_done: p.jobsDone, rating: p.rating })} style={_erS('font-size:12px;font-weight:700;color:#1B34F0;background:#fff;border:1px solid #D5DAF0;padding:9px 13px;border-radius:9px;cursor:pointer')}>Plný profil</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {list.length === 0 && (
              <div style={_erS(`background:#fff;border:1px solid ${_erC.line};border-radius:16px;padding:56px 22px;display:flex;flex-direction:column;align-items:center;gap:10px`)}>
                <span style={_erS('font-size:16px;font-weight:800;color:#0B1233')}>Žádný kandidát neodpovídá filtru</span>
                <span style={_erS('font-size:14px;color:#7A82A6')}>Zkuste jiný filtr nebo delší období.</span>
                <button onClick={() => { setTab('all'); setQuery(''); setListing('all'); }} style={_erS('font-size:13px;font-weight:800;color:#1B34F0;background:none;border:1px solid #D5DAF0;padding:9px 15px;border-radius:9px;cursor:pointer;margin-top:6px')}>Zrušit filtry</button>
              </div>
            )}
          </div>

          {/* Pravý sloupec */}
          <div style={_erS('display:flex;flex-direction:column;gap:16px')}>
            <div style={_erS(`background:#fff;border:1px solid ${_erC.line};border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:14px`)}>
              <span style={_erS('font-size:15px;font-weight:800;color:#0B1233')}>Podle inzerátu</span>
              <div style={_erS('display:flex;flex-direction:column;gap:9px')}>
                {byListing.map(b => (
                  <div key={b.key} onClick={() => setListing(b.key)} style={_erS('display:flex;align-items:center;gap:10px;cursor:pointer')}>
                    <span style={{ fontSize: 13, fontWeight: listing === b.key ? 800 : 600, color: listing === b.key ? '#0B1233' : '#3A4266', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</span>
                    <span style={_erS('width:70px;height:8px;border-radius:999px;background:#F1F3FB;display:block;flex:none;overflow:hidden')}><span style={{ display: 'block', width: Math.round(b.count / maxPos * 100) + '%', height: '100%', borderRadius: 999, background: listing === b.key ? '#1B34F0' : '#C7D0FF' }} /></span>
                    <span style={_erS('font-size:13px;font-weight:700;color:#0B1233;width:16px;text-align:right;flex:none')}>{b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={_erS(`background:#fff;border:1px solid ${_erC.line};border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:14px`)}>
              <span style={_erS('font-size:15px;font-weight:800;color:#0B1233')}>Rozdělení podle fáze</span>
              <div style={_erS('display:flex;flex-direction:column;gap:0')}>
                {stageStats.map((s, i) => (
                  <div key={i} style={_erS('display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid #F0F2FA')}>
                    <div style={_erS('display:flex;align-items:center;gap:9px')}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />
                      <span style={_erS('font-size:13px;color:#3A4266')}>{s.label}</span>
                    </div>
                    <span style={_erS('font-size:14px;font-weight:800;color:#0B1233')}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={_erS('background:#0B1233;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px')}>
              <span style={_erS('font-size:15px;font-weight:800;color:#fff')}>Rozšířit hledání</span>
              <span style={_erS('font-size:13px;color:#9AA3CC;line-height:1.5')}>Pošlete inzerát kandidátům, kteří u vás už pracovali. Opakovaný nábor je o 60 % rychlejší než nový.</span>
              <button onClick={onNew} style={_erS('font-size:13px;font-weight:800;color:#0B1233;background:#fff;border:none;padding:10px 14px;border-radius:9px;text-align:center;cursor:pointer')}>Poslat inzerát známým</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const _EC_AV_C = [{ bg: '#E6F7EF', color: '#0B7B4B' }, { bg: '#F3EDFF', color: '#5A32BC' }, { bg: '#EEF1FF', color: '#1B34F0' }, { bg: '#FFF3E0', color: '#B96F06' }];
Object.assign(window, { ECandidates });


/* ============================================================
   INZERÁTY (EJobs) — redesign 1d: modrá hlavička + jednotná
   roletka období + pás metrik (tečky tarifu) + karty s
   čtyřkrokovým pásem fáze náboru. Zachovává akce:
   Kandidáti → onTab('candidates'), Statistiky → JobStatsDrawer,
   Boostnout, Upravit, Vypnout/Zapnout, + Nový inzerát → onNew.
   ============================================================ */
const _JB_STATES = {
  active:   { label: 'Aktivní',   color: '#0B7B4B', bg: '#E6F7EF', dot: '#0FA968' },
  asap:     { label: 'ASAP',      color: '#B96F06', bg: '#FFF3E0', dot: '#F5920B' },
  inactive: { label: 'Neaktivní', color: '#7A82A6', bg: '#F1F3FB', dot: '#DDE1F0' },
  filled:   { label: 'Naplněno',  color: '#1B34F0', bg: '#EEF1FF', dot: '#1B34F0' },
};
const _JB_PHASES = ['Zveřejněno', 'Má zájemce', 'Nabírá', 'Obsazeno'];
const _JB_SORTS = { new: 'Nejnovější', views: 'Nejvíc zhlédnutí', rate: 'Nejvyšší sazba', interest: 'Nejvíc zájemců' };
const _JB_NEXTSORT = { new: 'views', views: 'rate', rate: 'interest', interest: 'new' };
const _jbStatusMap = s => s === 'urgent' ? 'asap' : s === 'paused' ? 'inactive' : s === 'filled' ? 'filled' : 'active';
const _jbPlural = (n, one, few, many) => n + ' ' + (n === 1 ? one : (n >= 2 && n <= 4) ? few : many);
const _jbAge = v => { const d = new Date(v); return isNaN(d) ? 1 : Math.max(1, Math.round((Date.now() - d.getTime()) / 86400000)); };
const _jbShort = v => { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }); };
const _jbEnd = days => new Date(Date.now() + (days || 0) * 86400000).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });

function EJobs({ onTab, onNew, period, onPeriod } = {}) {
  const [tab, setTab] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [sort, setSort] = React.useState('new');
  const [overrides, setOverrides] = React.useState({});
  const [statsJob, setStatsJob] = React.useState(null);

  const raw = (typeof E_JOBS !== 'undefined' ? E_JOBS : []);
  const jobs = raw.map(j => ({ ...j, _state: _jbStatusMap(overrides[j.id] || j.status) }));
  const cand = (typeof E_CANDIDATES !== 'undefined' ? E_CANDIDATES : {});
  const waitingFor = title => (cand.new || []).filter(c => (c.jobTitle || '') === title).length;
  const phaseIdx = l => {
    if (l._state === 'filled') return 3;
    if ((l.hired || 0) > 0 || waitingFor(l.title) > 0) return 2;
    if ((l.matches || 0) > 0) return 1;
    return 0;
  };

  const counts = {
    all: jobs.length,
    active: jobs.filter(j => j._state === 'active').length,
    asap: jobs.filter(j => j._state === 'asap').length,
    inactive: jobs.filter(j => j._state === 'inactive').length,
    filled: jobs.filter(j => j._state === 'filled').length,
  };
  const activeCount = jobs.filter(j => j._state === 'active' || j._state === 'asap').length;

  const q = query.trim().toLowerCase();
  let list = jobs.filter(j => {
    if (tab !== 'all' && j._state !== tab) return false;
    if (q && !(j.title || '').toLowerCase().includes(q)) return false;
    if (from && Number(j.pay) < Number(from)) return false;
    if (to && Number(j.pay) > Number(to)) return false;
    return true;
  });
  list = list.slice().sort((a, b) =>
    sort === 'views' ? (b.views || 0) - (a.views || 0) :
    sort === 'rate' ? (b.pay || 0) - (a.pay || 0) :
    sort === 'interest' ? (b.matches || 0) - (a.matches || 0) : 0);

  const planTier = (typeof _employerPlanTier !== 'undefined') ? _employerPlanTier() : 'zakladni';
  const limit = (typeof EMPLOYER_MAX_ACTIVE !== 'undefined' && EMPLOYER_MAX_ACTIVE[planTier] != null) ? EMPLOYER_MAX_ACTIVE[planTier] : Infinity;
  const showDots = limit !== Infinity && limit <= 10;
  const overLimit = activeCount > limit;
  const maxViews = Math.max.apply(null, jobs.map(j => j.views || 0).concat([1]));
  const maxPerDay = Math.max.apply(null, jobs.map(j => (j.views || 0) / _jbAge(j.created_at)).concat([1]));
  const totalViews = jobs.reduce((a, j) => a + (j.views || 0), 0);
  const avgCtr = jobs.length ? (jobs.reduce((a, j) => a + (j.ctr || 0), 0) / jobs.length) : 0;
  const hiredTotal = jobs.reduce((a, j) => a + (j.hired || 0), 0);

  const toggle = l => setOverrides(o => ({ ...o, [l.id]: (l._state === 'active' || l._state === 'asap') ? 'paused' : 'active' }));

  const cellLabel = { fontSize: 11, fontWeight: 800, letterSpacing: '.09em', color: '#A9B7FF', textTransform: 'uppercase' };
  const cellVal = { fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', lineHeight: 1 };
  const chip = on => on
    ? { color: '#fff', bg: '#1B34F0', border: '#1B34F0', cc: '#A9B7FF' }
    : { color: '#3A4266', bg: '#fff', border: '#E6E9F5', cc: '#A6ADCB' };
  const tabs = [
    { k: 'all', l: 'Vše' }, { k: 'active', l: 'Aktivní' }, { k: 'asap', l: 'ASAP' },
    { k: 'inactive', l: 'Neaktivní' }, { k: 'filled', l: 'Naplněno' },
  ];
  const inputSt = { fontSize: 13, color: '#0B1233', background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 9, padding: '9px 12px', outline: 'none' };

  return (
    <div style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '18px 20px 40px' }}>
      <div style={{ background: '#F1F3FB', border: '1px solid #DDE1F0', borderRadius: 22, overflow: 'hidden' }}>

        {/* Modrá hlavička */}
        <div style={{ background: '#1B34F0', padding: '22px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>Inzeráty</span>
            <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,.28)' }} />
            <span style={{ fontSize: 14, color: '#C7D0FF' }}>Správa a výkon vašich brigád · {_jbPlural(counts.active, 'aktivní inzerát', 'aktivní inzeráty', 'aktivních inzerátů')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <EPeriodPicker value={period} onChange={onPeriod} />
            <button onClick={() => onNew && onNew()} style={{ fontSize: 14, fontWeight: 800, color: '#1B34F0', background: '#fff', padding: '11px 18px', borderRadius: 9, border: 'none', cursor: 'pointer' }}>+ Nový inzerát</button>
          </div>
        </div>

        {/* Modrý pás metrik */}
        <div style={{ background: '#1B34F0', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', paddingBottom: 6 }}>
          <div style={{ padding: '6px 24px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={cellLabel}>Aktivních</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ ...cellVal, color: overLimit ? '#FFC46B' : '#fff' }}>{activeCount}</span>
                {showDots && <span style={{ fontSize: 14, fontWeight: 700, color: '#A9B7FF' }}>z {limit} v tarifu</span>}
              </div>
              {showDots && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, paddingRight: 2 }}>
                  {Array.from({ length: Math.max(limit, activeCount) }, (_, i) => {
                    const on = i < activeCount;
                    return <span key={i} style={{ width: 13, height: 13, borderRadius: '50%', flex: 'none', background: on ? '#5CF0A8' : 'transparent', border: on ? 'none' : '1.5px solid rgba(255,255,255,.35)', animation: on ? 'dotSonar 4.2s ease-out infinite' : 'none' }} />;
                  })}
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '6px 24px 20px', display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '1px solid rgba(255,255,255,.2)' }}>
            <span style={cellLabel}>Celkem zhlédnutí</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <span style={cellVal}>{totalViews.toLocaleString('cs-CZ')}</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 24 }}>
                {[35, 55, 45, 75, 100].map((h, i) => <span key={i} style={{ width: 5, height: h + '%', background: i >= 3 ? '#fff' : 'rgba(255,255,255,.3)', borderRadius: 2 }} />)}
              </div>
            </div>
          </div>
          <div style={{ padding: '6px 24px 20px', display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '1px solid rgba(255,255,255,.2)' }}>
            <span style={cellLabel}>Průměrný CTR</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <span style={cellVal}>{avgCtr.toFixed(1).replace('.', ',')} %</span>
              <span style={{ fontSize: 12, color: '#C7D0FF' }}>swajp → match</span>
            </div>
          </div>
          <div style={{ padding: '6px 24px 20px', display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '1px solid rgba(255,255,255,.2)' }}>
            <span style={cellLabel}>Najato celkem</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <span style={cellVal}>{hiredTotal}</span>
              <span style={{ fontSize: 12, color: '#C7D0FF' }}>za celou historii</span>
            </div>
          </div>
        </div>

        {/* Tělo */}
        <div style={{ padding: '22px 24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Filtrační lišta */}
          <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {tabs.map(t => {
                const c = chip(tab === t.k);
                return (
                  <span key={t.k} onClick={() => setTab(t.k)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', color: c.color, background: c.bg, border: '1px solid ' + c.border }}>
                    {t.l}<span style={{ fontSize: 12, fontWeight: 800, color: c.cc }}>{counts[t.k]}</span>
                  </span>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 9, padding: '0 11px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#7A82A6' }}>Kč/h</span>
                <input value={from} onChange={e => setFrom(e.target.value)} placeholder="od" style={{ width: 46, fontSize: 13, color: '#0B1233', background: 'transparent', border: 'none', padding: '9px 0', outline: 'none' }} />
                <span style={{ fontSize: 12, color: '#A6ADCB' }}>–</span>
                <input value={to} onChange={e => setTo(e.target.value)} placeholder="do" style={{ width: 46, fontSize: 13, color: '#0B1233', background: 'transparent', border: 'none', padding: '9px 0', outline: 'none' }} />
              </div>
              <span onClick={() => setSort(_JB_NEXTSORT[sort])} style={{ fontSize: 13, fontWeight: 700, color: '#3A4266', border: '1px solid #E6E9F5', padding: '9px 14px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>{_JB_SORTS[sort]} ↓</span>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Hledat inzerát…" style={{ ...inputSt, width: 180 }} />
            </div>
          </div>

          {/* Karty inzerátů */}
          {list.map(l => {
            const st = _JB_STATES[l._state];
            const idx = phaseIdx(l);
            const waiting = waitingFor(l.title);
            const live = l._state === 'active' || l._state === 'asap';
            const viewsPct = Math.round((l.views || 0) / maxViews * 100) + '%';
            const perDay = Math.round((l.views || 0) / _jbAge(l.created_at));
            const perDayPct = Math.round(Math.min(1, ((l.views || 0) / _jbAge(l.created_at)) / maxPerDay) * 100) + '%';
            const soon = live && l.daysLeft > 0 && l.daysLeft <= 7;
            const remPct = Math.round(Math.min(1, (l.daysLeft || 0) / 30) * 100) + '%';
            const remColor = !live || !l.daysLeft ? '#DDE1F0' : soon ? '#F5920B' : '#1B34F0';
            const notes = [_jbShort(l.created_at), (l.matches || 0) + ' zájemců', (l.hired || 0) + ' najato', l._state === 'filled' ? 'hotovo' : '—'];
            const phNote = idx === 3 ? 'Pozice je obsazená — inzerát můžete vypnout nebo prodloužit.'
              : idx === 2 ? 'Kandidáti jsou ve hře. Rychlá odpověď rozhoduje o nástupu.'
              : idx === 1 ? 'Máte zájemce. Ozvěte se jim, dokud jsou aktivní.'
              : 'Inzerát zatím nemá zájemce. Boost zvýší dosah.';
            return (
              <div key={l.id} style={{ background: '#fff', border: '1px solid ' + (waiting > 0 ? '#F5920B' : '#E6E9F5'), borderRadius: 16, overflow: 'hidden' }}>

                {/* 1 — hlavička karty */}
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, borderBottom: '1px solid #F0F2FA', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: st.dot, flex: 'none' }} />
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#0B1233', letterSpacing: '-.01em' }}>{l.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: st.color, background: st.bg, padding: '4px 9px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{st.label}</span>
                    <span style={{ fontSize: 13, color: '#7A82A6' }}>{l.pay} {l.payUnit} · zveřejněno {_jbShort(l.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {soon && <span style={{ fontSize: 11, fontWeight: 800, color: '#B96F06', background: '#FFF3E0', padding: '4px 9px', borderRadius: 6 }}>zbývá {l.daysLeft} d</span>}
                    <span style={{ fontSize: 13, color: '#A6ADCB' }}>{live ? ('Aktivní do ' + _jbEnd(l.daysLeft)) : l._state === 'filled' ? 'Uzavřeno' : 'Vypnuto'}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0B7B4B', background: '#E6F7EF', padding: '8px 14px', borderRadius: 9, whiteSpace: 'nowrap' }}>{l.pay} {l.payUnit}</span>
                  </div>
                </div>

                {/* 2 — obsah */}
                <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr' }}>
                  <div style={{ padding: '20px 22px', borderRight: '1px solid #F0F2FA', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.09em', color: '#A6ADCB', textTransform: 'uppercase' }}>Výkon inzerátu</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.55fr 1fr', gap: 14, alignItems: 'start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <span style={{ fontSize: 12, color: '#7A82A6' }}>Zhlédnutí</span>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1 }}>{(l.views || 0).toLocaleString('cs-CZ')}</span>
                        <span style={{ height: 4, borderRadius: 999, background: '#EEF1FF', display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', width: viewsPct, height: '100%', borderRadius: 999, background: '#1B34F0' }} /></span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <span style={{ fontSize: 12, color: '#7A82A6' }}>Expirace</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: 22, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1 }}>{live && l.daysLeft ? l.daysLeft + ' d' : '—'}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: soon ? '#B96F06' : '#A6ADCB' }}>{live ? (l.daysLeft ? '' : 'dnes') : 'neběží'}</span>
                        </div>
                        <span style={{ height: 4, borderRadius: 999, background: '#EEF1FF', display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', width: remPct, height: '100%', borderRadius: 999, background: remColor }} /></span>
                        <span style={{ fontSize: 11, color: '#A6ADCB', whiteSpace: 'nowrap' }}>{live && l.daysLeft ? 'do ' + _jbEnd(l.daysLeft) : 'inzerát neběží'}</span>
                        {live && l.daysLeft > 0 && (
                          <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 800, color: '#1B34F0', border: '1px solid #D5DAF0', padding: '5px 10px', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap', marginTop: 3 }}>Prodloužit</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <span style={{ fontSize: 12, color: '#7A82A6' }}>Denně</span>
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1 }}>{perDay.toLocaleString('cs-CZ')}</span>
                        <span style={{ height: 4, borderRadius: 999, background: '#EEF1FF', display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', width: perDayPct, height: '100%', borderRadius: 999, background: '#5C71FF' }} /></span>
                      </div>
                    </div>
                    {waiting > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#FFF8EE', borderRadius: 10, padding: '11px 14px' }}>
                        <span style={{ fontSize: 13, color: '#0B1233' }}>{_jbPlural(waiting, 'kandidát čeká', 'kandidáti čekají', 'kandidátů čeká')} na odpověď</span>
                        <span onClick={() => onTab && onTab('candidates')} style={{ fontSize: 12, fontWeight: 800, color: '#B96F06', cursor: 'pointer', whiteSpace: 'nowrap' }}>Odpovědět</span>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.09em', color: '#A6ADCB', textTransform: 'uppercase' }}>Fáze náboru</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: idx === 3 ? '#0B7B4B' : idx === 0 ? '#B96F06' : '#1B34F0', background: idx === 3 ? '#E6F7EF' : idx === 0 ? '#FFF3E0' : '#EEF1FF', padding: '4px 10px', borderRadius: 999 }}>{_JB_PHASES[idx]}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#A6ADCB' }}>Fáze {idx + 1} ze 4</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {_JB_PHASES.map((_, i) => {
                        const reached = i <= idx;
                        const bg = reached ? (idx === 3 ? '#0FA968' : i === idx ? '#1B34F0' : '#5C71FF') : '#EEF1FF';
                        return <span key={i} style={{ flex: 1, height: 8, borderRadius: 999, background: '#EEF1FF', overflow: 'hidden' }}><span style={{ display: 'block', width: '100%', height: '100%', borderRadius: 999, background: bg, transformOrigin: 'left center', animation: reached ? 'segFill .5s cubic-bezier(.4,0,.2,1) ' + (i * 0.08).toFixed(2) + 's both' : 'none' }} /></span>;
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {_JB_PHASES.map((label, i) => {
                        const reached = i <= idx, cur = i === idx;
                        return (
                          <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: cur ? 800 : 600, color: reached ? (cur ? '#0B1233' : '#3A4266') : '#A6ADCB', whiteSpace: 'nowrap' }}>{label}</span>
                            <span style={{ fontSize: 11, color: reached ? '#7A82A6' : '#C7CCE3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{notes[i]}</span>
                          </div>
                        );
                      })}
                    </div>
                    <span style={{ fontSize: 13, color: '#7A82A6', lineHeight: 1.5, paddingTop: 4 }}>{phNote}</span>
                  </div>
                </div>

                {/* 3 — patička (zachované akce) */}
                <div style={{ padding: '14px 22px', background: '#FBFCFE', borderTop: '1px solid #F0F2FA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => onTab && onTab('candidates')} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#3A4266', background: '#fff', border: '1px solid #E6E9F5', padding: '9px 14px', borderRadius: 9, cursor: 'pointer' }}><Icon name="users-group-rounded-bold" size={14} color="#3A4266" />Kandidáti ({l.matches || 0})</button>
                    <button onClick={() => setStatsJob(l)} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#3A4266', background: '#fff', border: '1px solid #E6E9F5', padding: '9px 14px', borderRadius: 9, cursor: 'pointer' }}><Icon name="graph-up-bold" size={14} color="#3A4266" />Zobrazit statistiky</button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#B96F06', background: '#FFF3E0', border: '1px solid #FFE2B8', padding: '9px 14px', borderRadius: 9, cursor: 'pointer' }}><Icon name="rocket-2-bold" size={14} color="#B96F06" />Boostnout</button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggle(l)} style={{ fontSize: 13, fontWeight: 700, color: live ? '#7A82A6' : '#0B7B4B', background: '#fff', border: '1px solid #E6E9F5', padding: '9px 14px', borderRadius: 9, cursor: 'pointer' }}>{live ? 'Vypnout' : 'Zapnout'}</button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#1B34F0', background: '#fff', border: '1px solid #D5DAF0', padding: '9px 16px', borderRadius: 9, cursor: 'pointer' }}><Icon name="pen-2-linear" size={13} color="#1B34F0" />Upravit</button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Prázdný stav */}
          {list.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: '56px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0B1233' }}>Žádný inzerát neodpovídá filtru</span>
              <span style={{ fontSize: 14, color: '#7A82A6' }}>Zkuste jiný stav, rozsah sazby nebo hledaný výraz.</span>
              <span onClick={() => { setTab('all'); setQuery(''); setFrom(''); setTo(''); }} style={{ fontSize: 13, fontWeight: 800, color: '#1B34F0', border: '1px solid #D5DAF0', padding: '9px 15px', borderRadius: 9, cursor: 'pointer', marginTop: 6 }}>Zrušit filtry</span>
            </div>
          )}
        </div>
      </div>

      {statsJob && <JobStatsDrawer job={statsJob} onClose={() => setStatsJob(null)} />}
    </div>
  );
}
Object.assign(window, { EJobs });


/* ============================================================
   NASTAVENÍ (ESettings) — redesign 1d dle designu:
   modrá hlavička + pás kompletnosti profilu (prstenec + chybějící
   chipy + ověření), levá navigace sekcí + karta tarifu + odhlášení,
   sekce Firemní profil (formulářové karty + živý náhled), Notifikace,
   Soukromí+GDPR, Nebezpečná zóna, a lišta neuložených změn.
   Reálné napojení: uložení profilu → updateEmployerProfile (Supabase),
   odhlášení → onSignOut/sb, tarif → onTab('pricing'), + Nový inzerát → onNew.
   ============================================================ */
const _ST_NAV = [
  { k: 'profile', l: 'Firemní profil', i: 'buildings-3-bold' },
  { k: 'notif',   l: 'Notifikace',      i: 'bell-bold' },
  { k: 'gdpr',    l: 'Soukromí + GDPR',  i: 'shield-keyhole-bold' },
  { k: 'danger',  l: 'Nebezpečná zóna',  i: 'shield-warning-bold' },
];
const _ST_INDUSTRIES = ['Gastro', 'Kavárna', 'Maloobchod', 'Sklad / logistika', 'Eventy / catering', 'Hotelnictví', 'Výroba', 'Úklid', 'Administrativa', 'Jiné'];
const _ST_SWATCHES = ['#1B34F0', '#0FA968', '#6B3FD4', '#F5920B', '#E0B0FF', '#0B1233'];
const _ST_SOCIALS = [
  { k: 'ig', short: 'IG', ph: 'instagram.com/firma', c: '#C13584', bg: '#FDEEF6' },
  { k: 'fb', short: 'FB', ph: 'facebook.com/firma', c: '#1877F2', bg: '#EEF1FF' },
  { k: 'li', short: 'IN', ph: 'linkedin.com/company/firma', c: '#0A66C2', bg: '#E9F3FA' },
  { k: 'tt', short: 'TT', ph: 'tiktok.com/@firma', c: '#0B1233', bg: '#F1F3FB' },
];
const _ST_NOTIFS0 = [
  { key: 'match',  label: 'Nová shoda',                 note: 'kdykoli kandidát swajpne vpravo', on: true },
  { key: 'msg',    label: 'Nová zpráva',                note: 'okamžitě, i push do telefonu',    on: true },
  { key: 'review', label: 'Nová recenze',               note: 'včetně těch bez reakce',          on: true },
  { key: 'expiry', label: 'Inzerát se blíží expiraci',  note: '3 dny předem',                    on: false },
  { key: 'shift',  label: 'Neobsazená směna',           note: 'ráno v den směny',                on: true },
  { key: 'digest', label: 'Týdenní souhrn',             note: 'v pondělí ráno e-mailem',         on: false },
];

function ESettings({ onTab, onNew, onSignOut } = {}) {
  const P = (typeof EPROFILE !== 'undefined' ? EPROFILE : {});
  const C = (typeof ECOMPANY !== 'undefined' ? ECOMPANY : {});
  const init = () => ({
    name: P.company_name || C.name || '',
    ico: P.ic || '',
    industry: P.industry || '',
    desc: P.bio || '',
    rules: P.chat_rules || '',
    web: P.website || '',
    addr: P.address || '',
    brand: (P.branding && P.branding.color) || C.logoColor || '#1B34F0',
    logo_url: P.logo_url || '',
    avatar_url: P.avatar_url || '',
    ig: (P.socials && P.socials.instagram) || '',
    fb: (P.socials && P.socials.facebook) || '',
    li: (P.socials && P.socials.linkedin) || '',
    tt: (P.socials && P.socials.tiktok) || '',
    photos: Array.isArray(P.photos) ? P.photos.slice() : [],
  });
  const [seg, setSeg] = React.useState('profile');
  const [form, setForm] = React.useState(init);
  const [notifs, setNotifs] = React.useState(_ST_NOTIFS0);
  const [dirty, setDirty] = React.useState(false);
  const [flash, setFlash] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [delOpen, setDelOpen] = React.useState(false);
  const [delPw, setDelPw] = React.useState('');
  const [delErr, setDelErr] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);
  const refs = React.useRef({});
  const flashT = React.useRef(null);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setDirty(true); };
  const setRef = k => el => { if (el) refs.current[k] = el; };
  const verified = !!P.verified;
  const nameOr = (form.name || '').trim() || 'Vaše firma';
  const initial = nameOr.charAt(0).toUpperCase();

  const checks = [
    { key: 'name',     label: 'název firmy',       done: !!form.name.trim() },
    { key: 'ico',      label: 'IČ',                done: !!form.ico },
    { key: 'industry', label: 'odvětví',           done: !!form.industry },
    { key: 'desc',     label: 'popis firmy',       done: form.desc.trim().length > 20 },
    { key: 'rules',    label: 'pravidla do chatu', done: !!form.rules.trim() },
    { key: 'web',      label: 'web',               done: !!form.web },
    { key: 'addr',     label: 'adresu',            done: !!form.addr },
    { key: 'logo',     label: 'logo',              done: !!form.logo_url },
    { key: 'photo',    label: 'fotku provozovny',  done: !!form.avatar_url },
  ];
  const doneCount = checks.filter(c => c.done).length;
  const pct = Math.round(doneCount / checks.length * 100);
  const missing = checks.filter(c => !c.done);

  const jumpTo = key => {
    setSeg('profile'); setFlash(key);
    setTimeout(() => { const el = refs.current[key]; if (el) { if (el.focus) el.focus(); if (el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }, 40);
    clearTimeout(flashT.current);
    flashT.current = setTimeout(() => setFlash(null), 1600);
  };

  const planTier = (typeof _employerPlanTier !== 'undefined') ? _employerPlanTier() : 'vyhodny';
  const planName = ((typeof PLANS !== 'undefined' ? PLANS : []).find(p => p.id === planTier) || {}).name || 'Tarif';
  const planLimit = (typeof EMPLOYER_MAX_ACTIVE !== 'undefined' && EMPLOYER_MAX_ACTIVE[planTier] != null) ? EMPLOYER_MAX_ACTIVE[planTier] : 5;
  const jobs = (typeof E_JOBS !== 'undefined' ? E_JOBS : []);
  const activeJobs = jobs.filter(j => j.status === 'active' || j.status === 'urgent');
  const planUsed = activeJobs.length;
  const planPct = planLimit === Infinity ? 100 : Math.min(100, Math.round(planUsed / Math.max(1, planLimit) * 100));

  async function doSave() {
    setSaving(true);
    let ok = true;
    if (typeof updateEmployerProfile !== 'undefined') {
      ok = await updateEmployerProfile({
        company_name: form.name, ic: form.ico, industry: form.industry, bio: form.desc,
        website: form.web, address: form.addr, chat_rules: form.rules,
        avatar_url: form.avatar_url, logo_url: form.logo_url,
        socials: { instagram: form.ig, facebook: form.fb, linkedin: form.li, tiktok: form.tt },
        photos: form.photos.filter(u => u && u.trim()),
        branding: { color: form.brand },
      });
    }
    setSaving(false);
    if (ok) setDirty(false);
    setToast(ok ? 'ok' : 'err');
    setTimeout(() => setToast(null), 2600);
  }
  const doReset = () => { setForm(init()); setNotifs(_ST_NOTIFS0); setDirty(false); };
  const closeDel = () => { if (!deleting) { setDelOpen(false); setDelPw(''); setDelErr(''); } };
  async function doDelete() {
    if (deleting) return;
    const pw = (delPw || '').trim();
    if (!pw) { setDelErr('Pro potvrzení zadejte heslo.'); return; }
    if (typeof sb === 'undefined') { setDelErr('Nelze ověřit — chybí připojení.'); return; }
    setDeleting(true); setDelErr('');
    // 1) Ověření hesla re-přihlášením stejným účtem — špatné heslo = konec.
    const { data: { session } } = await sb.auth.getSession();
    const email = session?.user?.email || P.email || '';
    const { error: pwErr } = await sb.auth.signInWithPassword({ email, password: pw });
    if (pwErr) { setDeleting(false); setDelErr('Nesprávné heslo. Zkuste to znovu.'); return; }
    // 2) Heslo sedí → smazání účtu (stejná RPC jako u brigádníků) + odhlášení.
    const { error } = await sb.rpc('delete_my_account');
    if (error) { setDeleting(false); setDelErr('Účet se nepodařilo smazat. Zkuste to prosím znovu.'); return; }
    await sb.auth.signOut();
    window.location.href = '/';
  }
  const toggleNotif = key => { setNotifs(ns => ns.map(n => n.key === key ? { ...n, on: !n.on } : n)); setDirty(true); };
  const logout = () => { if (onSignOut) onSignOut(); else if (typeof sb !== 'undefined') { sb.auth.signOut().then(() => { window.location.href = '/'; }); } };
  const promptUrl = (k, msg) => { const v = window.prompt(msg, form[k] || ''); if (v != null) set(k, v.trim()); };
  const addPhoto = () => { const v = window.prompt('Vlož odkaz na fotku (URL):', ''); if (v && v.trim()) { setForm(f => ({ ...f, photos: [...f.photos, v.trim()] })); setDirty(true); } };
  const rmPhoto = i => { setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) })); setDirty(true); };

  const fBorder = key => flash === key ? '#F5920B' : '#E6E9F5';
  const label = t => <span style={{ fontSize: 12, fontWeight: 700, color: '#3A4266' }}>{t}</span>;
  const inp = { fontSize: 14, fontWeight: 600, color: '#0B1233', background: '#F6F7FC', borderRadius: 10, padding: '12px 14px', outline: 'none', width: '100%' };
  const cardBase = { background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 18 };
  const secLabel = { fontSize: 16, fontWeight: 800, color: '#0B1233' };
  const brandGrad = 'linear-gradient(120deg, ' + form.brand + ' 0%, ' + form.brand + '99 60%, #F6F7FC 100%)';

  return (
    <div style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '18px 20px 40px' }}>
      <div style={{ background: '#F1F3FB', border: '1px solid #DDE1F0', borderRadius: 22, overflow: 'hidden' }}>

        {/* Modrá hlavička */}
        <div style={{ background: '#1B34F0', padding: '20px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>Nastavení</span>
            <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,.28)' }} />
            <span style={{ fontSize: 14, color: '#C7D0FF' }}>Firemní profil, notifikace a soukromí</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSeg('profile')} style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.14)', padding: '9px 14px', borderRadius: 9, border: 'none', cursor: 'pointer' }}>Zobrazit profil</button>
            <button onClick={() => setSeg('notif')} title="Notifikace" style={{ width: 38, height: 38, flex: 'none', background: 'rgba(255,255,255,.14)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}><Icon name="bell-bold" size={16} color="#fff" /></button>
            <button onClick={() => onNew && onNew()} style={{ fontSize: 14, fontWeight: 800, color: '#1B34F0', background: '#fff', padding: '11px 18px', borderRadius: 9, border: 'none', cursor: 'pointer' }}>+ Nový inzerát</button>
          </div>
        </div>

        {/* Modrý pás — kompletnost profilu */}
        <div style={{ background: '#1B34F0', padding: '4px 30px 26px', display: 'flex', alignItems: 'center', gap: 34, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 'none' }}>
            <div style={{ position: 'relative', width: 104, height: 104, flex: 'none' }}>
              <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="52" cy="52" r="46" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="9" />
                <circle cx="52" cy="52" r="46" fill="none" stroke="#5CF0A8" strokeWidth="9" strokeLinecap="round" strokeDasharray="289" strokeDashoffset={(289 * (1 - pct / 100)).toFixed(1)} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.03em', lineHeight: 1 }}>{pct} %</span>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#A9B7FF', textTransform: 'uppercase' }}>hotovo</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.09em', color: '#A9B7FF', textTransform: 'uppercase' }}>Firemní profil</span>
              <span style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>{pct === 100 ? 'Profil máte kompletní' : pct >= 60 ? 'Ještě pár detailů' : 'Doplňte základní údaje'}</span>
              <span style={{ fontSize: 13, color: '#C7D0FF' }}>Vyplněný profil vidí kandidáti při každém swajpu.</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, minWidth: 220 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.09em', color: '#A9B7FF', textTransform: 'uppercase' }}>Ještě chybí</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {missing.map(m => (
                <span key={m.key} onClick={() => jumpTo(m.key)} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)', padding: '7px 12px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ {m.label}</span>
              ))}
              {missing.length === 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#0B1233', background: '#5CF0A8', padding: '7px 12px', borderRadius: 999 }}>Profil je kompletní</span>}
            </div>
          </div>

          <div style={{ width: 296, flex: 'none', background: verified ? 'rgba(92,240,168,.14)' : 'rgba(255,196,107,.16)', border: '1px solid ' + (verified ? 'rgba(92,240,168,.4)' : 'rgba(255,196,107,.45)'), borderRadius: 14, padding: '15px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: verified ? '#5CF0A8' : '#FFC46B' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{verified ? 'Firma je ověřená' : 'Firma není ověřená'}</span>
            </div>
            <span style={{ fontSize: 12, color: '#C7D0FF', lineHeight: 1.5 }}>{verified ? 'Kandidáti u vašich inzerátů vidí odznak ověřené firmy.' : 'Ověřené firmy mají o 40 % víc swajpů vpravo. Ověření zabere jeden e-mail.'}</span>
            <span onClick={() => setToast('verify')} style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 800, color: '#1B34F0', background: '#fff', padding: '8px 13px', borderRadius: 8, cursor: 'pointer' }}>{verified ? 'Zobrazit detail' : 'Požádat o ověření'}</span>
          </div>
        </div>

        {/* Tělo */}
        <div style={{ padding: '22px 24px 26px', display: 'grid', gridTemplateColumns: '262px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Levá navigace */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 22 }}>
            <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {_ST_NAV.map(t => {
                const on = seg === t.k, danger = t.k === 'danger';
                return (
                  <div key={t.k} onClick={() => setSeg(t.k)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 11, cursor: 'pointer', background: on ? (danger ? '#FEF3F3' : '#F1F3FB') : 'transparent' }}>
                    <span style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: on ? (danger ? '#FBE0E0' : '#EEF1FF') : '#F6F7FC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={t.i} size={15} color={danger ? '#B3261E' : (on ? '#1B34F0' : '#A6ADCB')} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: on ? 800 : 700, color: danger ? '#B3261E' : '#0B1233' }}>{t.l}</span>
                      <span style={{ fontSize: 11, color: on ? '#7A82A6' : '#A6ADCB' }}>{t.k === 'profile' ? (pct + ' % vyplněno') : t.k === 'notif' ? (notifs.filter(n => n.on).length + ' z ' + notifs.length + ' zapnuto') : t.k === 'gdpr' ? 'uchování 12 měsíců' : 'pozastavení, smazání'}</span>
                    </div>
                    {t.k === 'profile' && pct < 100 && <span style={{ fontSize: 11, fontWeight: 800, color: '#B96F06', background: '#FFF3E0', padding: '3px 8px', borderRadius: 6, flex: 'none' }}>{missing.length}</span>}
                  </div>
                );
              })}
            </div>

            <div style={{ background: '#0B1233', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.09em', color: '#7C8AC4', textTransform: 'uppercase' }}>Tarif</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0B1233', background: '#5CF0A8', padding: '3px 9px', borderRadius: 6 }}>{planName}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#9AA3CC' }}>Aktivní inzeráty</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{planUsed} / {planLimit === Infinity ? '∞' : planLimit}</span>
                </div>
                <span style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.14)', display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', width: planPct + '%', height: '100%', borderRadius: 999, background: '#5CF0A8' }} /></span>
              </div>
              <span onClick={() => onTab && onTab('pricing')} style={{ fontSize: 13, fontWeight: 800, color: '#0B1233', background: '#fff', padding: '10px 14px', borderRadius: 9, textAlign: 'center', cursor: 'pointer' }}>Spravovat tarif</span>
            </div>

            <span onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#7A82A6', background: '#fff', border: '1px solid #E6E9F5', padding: 11, borderRadius: 11, cursor: 'pointer' }}><Icon name="logout-2-bold" size={14} color="#7A82A6" />Odhlásit se</span>
          </div>

          {/* Obsah sekce */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {seg === 'profile' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>

                {/* Formulářové karty */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

                  {/* Identita firmy */}
                  <div style={cardBase}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={secLabel}>Identita firmy</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#7A82A6', background: '#F1F3FB', padding: '4px 9px', borderRadius: 6 }}>Vidí kandidáti</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {label('Název firmy')}
                        <input ref={setRef('name')} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Např. Bistro Na Rohu" style={{ ...inp, border: '1px solid ' + fBorder('name') }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {label('IČ')}
                        <input ref={setRef('ico')} value={form.ico} onChange={e => set('ico', e.target.value)} placeholder="12345678" inputMode="numeric" style={{ ...inp, border: '1px solid ' + fBorder('ico') }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {label('Odvětví')}
                      <div ref={setRef('industry')} style={{ display: 'flex', gap: 7, flexWrap: 'wrap', borderRadius: 999, boxShadow: flash === 'industry' ? '0 0 0 3px rgba(245,146,11,.28)' : 'none' }}>
                        {_ST_INDUSTRIES.map(o => {
                          const on = form.industry === o;
                          return <span key={o} onClick={() => set('industry', on ? '' : o)} style={{ fontSize: 13, fontWeight: 700, padding: '8px 13px', borderRadius: 999, cursor: 'pointer', color: on ? '#fff' : '#3A4266', background: on ? '#1B34F0' : '#fff', border: '1px solid ' + (on ? '#1B34F0' : '#E6E9F5'), whiteSpace: 'nowrap' }}>{o}</span>;
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                        {label('Krátký popis')}
                        <span style={{ fontSize: 11, fontWeight: 700, color: form.desc.length > 250 ? '#B96F06' : '#A6ADCB' }}>{form.desc.length} / 280</span>
                      </div>
                      <textarea ref={setRef('desc')} value={form.desc} onChange={e => set('desc', e.target.value.slice(0, 280))} placeholder="Čím je práce u vás jiná? Dvě věty stačí." style={{ ...inp, minHeight: 84, resize: 'vertical', fontWeight: 400, lineHeight: 1.55, border: '1px solid ' + fBorder('desc') }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        {label('Pravidla do chatu')}
                        <span style={{ fontSize: 11, color: '#A6ADCB' }}>pošlete kandidátovi jedním klikem ve Zprávách</span>
                      </div>
                      <textarea ref={setRef('rules')} value={form.rules} onChange={e => set('rules', e.target.value)} placeholder="Např. přijď 10 minut předem, vezmi si pracovní obuv…" style={{ ...inp, minHeight: 72, resize: 'vertical', fontWeight: 400, lineHeight: 1.55, border: '1px solid ' + fBorder('rules') }} />
                    </div>
                  </div>

                  {/* Vizuál a branding */}
                  <div style={cardBase}>
                    <span style={secLabel}>Vizuál a branding</span>
                    <div ref={setRef('logo')} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, borderRadius: 14, boxShadow: (flash === 'logo' || flash === 'photo') ? '0 0 0 3px rgba(245,146,11,.28)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#FBFCFE', border: '1px dashed #D5DAF0', borderRadius: 14, padding: 14 }}>
                        <span style={{ width: 52, height: 52, flex: 'none', borderRadius: 14, background: form.brand, color: '#fff', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{form.logo_url ? <img src={form.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : initial}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0B1233' }}>Logo firmy</span>
                          <span style={{ fontSize: 11, color: '#A6ADCB' }}>PNG / SVG, 256×256</span>
                          <span onClick={() => promptUrl('logo_url', 'Vlož odkaz na logo (URL):')} style={{ fontSize: 12, fontWeight: 800, color: '#1B34F0', cursor: 'pointer' }}>Nahrát nebo vložit odkaz</span>
                        </div>
                      </div>
                      <div ref={setRef('photo')} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#FBFCFE', border: '1px dashed #D5DAF0', borderRadius: 14, padding: 14 }}>
                        <span style={{ width: 52, height: 52, flex: 'none', borderRadius: 14, background: '#F1F3FB', color: '#A6ADCB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{form.avatar_url ? <img src={form.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : <Icon name="camera-bold" size={20} color="#A6ADCB" />}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0B1233' }}>Profilová fotka</span>
                          <span style={{ fontSize: 11, color: '#A6ADCB' }}>provozovna nebo tým</span>
                          <span onClick={() => promptUrl('avatar_url', 'Vlož odkaz na profilovou fotku (URL):')} style={{ fontSize: 12, fontWeight: 800, color: '#1B34F0', cursor: 'pointer' }}>Nahrát nebo vložit odkaz</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {label('Barva značky')}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                        {_ST_SWATCHES.map(c => (
                          <span key={c} onClick={() => set('brand', c)} style={{ width: 34, height: 34, borderRadius: 11, background: c, cursor: 'pointer', boxShadow: form.brand === c ? '0 0 0 2px #fff, 0 0 0 4px ' + c : 'inset 0 0 0 1px rgba(11,18,51,.08)' }} />
                        ))}
                        <span style={{ width: 1, height: 26, background: '#E6E9F5', margin: '0 3px' }} />
                        <input value={form.brand} onChange={e => set('brand', e.target.value)} style={{ fontSize: 13, fontWeight: 700, color: '#0B1233', background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 9, padding: '9px 13px', letterSpacing: '.04em', width: 110, outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        {label('Bonusové fotky')}
                        <span style={{ fontSize: 11, color: '#A6ADCB' }}>galerie na profilu</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 9 }}>
                        <span onClick={addPhoto} style={{ height: 78, border: '1px dashed #D5DAF0', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', background: '#FBFCFE' }}>
                          <span style={{ fontSize: 16, color: '#1B34F0' }}>+</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1B34F0' }}>Přidat</span>
                        </span>
                        {form.photos.slice(0, 7).map((url, i) => (
                          <span key={i} onClick={() => rmPhoto(i)} title="Odebrat fotku" style={{ height: 78, borderRadius: 12, background: '#F1F3FB', overflow: 'hidden', cursor: 'pointer', display: 'block', position: 'relative' }}>
                            {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />}
                          </span>
                        ))}
                        {form.photos.length === 0 && [0, 1, 2].map(i => <span key={i} style={{ height: 78, borderRadius: 12, background: i === 0 ? '#F1F3FB' : i === 1 ? '#F6F7FC' : '#FBFCFE' }} />)}
                      </div>
                    </div>
                  </div>

                  {/* Kontakt a odkazy */}
                  <div style={cardBase}>
                    <span style={secLabel}>Kontakt a odkazy</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {label('Web')}
                        <input ref={setRef('web')} value={form.web} onChange={e => set('web', e.target.value)} placeholder="https://www.firma.cz" style={{ ...inp, fontWeight: 400, border: '1px solid ' + fBorder('web') }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {label('Adresa')}
                        <input ref={setRef('addr')} value={form.addr} onChange={e => set('addr', e.target.value)} placeholder="Náměstí Míru 3, Praha 2" style={{ ...inp, fontWeight: 400, border: '1px solid ' + fBorder('addr') }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {label('Sociální sítě')}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {_ST_SOCIALS.map(s => (
                          <div key={s.k} style={{ display: 'flex', alignItems: 'center', background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 10, overflow: 'hidden' }}>
                            <span style={{ width: 38, height: 42, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: s.c, background: s.bg }}>{s.short}</span>
                            <input value={form[s.k]} onChange={e => set(s.k, e.target.value)} placeholder={s.ph} style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#0B1233', background: 'transparent', border: 'none', padding: '12px', outline: 'none' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Živý náhled */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 22 }}>
                  <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0B1233' }}>Náhled pro kandidáty</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0FA968' }}>živě</span>
                    </div>
                    <div style={{ border: '1px solid #E6E9F5', borderRadius: 16, overflow: 'hidden' }}>
                      <div style={{ height: 74, background: brandGrad }} />
                      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 11, marginTop: -26 }}>
                        <span style={{ width: 54, height: 54, borderRadius: 16, background: form.brand, border: '3px solid #fff', color: '#fff', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{form.avatar_url ? <img src={form.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : initial}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#0B1233' }}>{nameOr}</span>
                            {verified && <span style={{ fontSize: 11, fontWeight: 800, color: '#0B7B4B', background: '#E6F7EF', padding: '2px 7px', borderRadius: 5 }}>ověřeno</span>}
                          </div>
                          <span style={{ fontSize: 12, color: '#7A82A6' }}>{(form.industry || 'Odvětví neuvedeno') + ' · ' + (form.addr.trim() || 'Adresa neuvedena')}</span>
                        </div>
                        <span style={{ fontSize: 13, color: '#3A4266', lineHeight: 1.5 }}>{form.desc.trim() || 'Krátký popis se zobrazí tady — kandidáti si podle něj vybírají.'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: form.brand, padding: '8px 13px', borderRadius: 8 }}>Zobrazit brigády</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#7A82A6', border: '1px solid #E6E9F5', padding: '8px 13px', borderRadius: 8 }}>Sledovat</span>
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: '#A6ADCB', lineHeight: 1.5 }}>Takto se firma zobrazí v aplikaci. Změny se propíšou hned.</span>
                  </div>

                  <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0B1233' }}>Aktivní inzeráty</span>
                    {activeJobs.length === 0 && <span style={{ fontSize: 12, color: '#A6ADCB' }}>Žádné aktivní inzeráty.</span>}
                    {activeJobs.slice(0, 3).map(j => (
                      <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: j.status === 'urgent' ? '#F5920B' : '#0FA968' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1233', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</span>
                            <span style={{ fontSize: 11, color: '#7A82A6' }}>{(j.matches || 0) + ' kandidátů'}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0B7B4B', background: '#E6F7EF', padding: '5px 10px', borderRadius: 7, whiteSpace: 'nowrap' }}>{j.pay} {j.payUnit || 'Kč/h'}</span>
                      </div>
                    ))}
                    <span onClick={() => onTab && onTab('jobs')} style={{ fontSize: 12, fontWeight: 700, color: '#1B34F0', cursor: 'pointer' }}>Všechny inzeráty →</span>
                  </div>
                </div>
              </div>
            )}

            {seg === 'notif' && (
              <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingBottom: 12 }}>
                  <span style={secLabel}>Notifikace</span>
                  <span style={{ fontSize: 13, color: '#7A82A6' }}>Vyberte, o čem chcete vědět hned.</span>
                </div>
                {notifs.map(n => (
                  <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '15px 0', borderTop: '1px solid #F0F2FA' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0B1233' }}>{n.label}</span>
                      <span style={{ fontSize: 12, color: '#7A82A6' }}>{n.note}</span>
                    </div>
                    <span onClick={() => toggleNotif(n.key)} style={{ width: 46, height: 26, flex: 'none', borderRadius: 999, background: n.on ? '#1B34F0' : '#DDE1F0', padding: 3, display: 'flex', justifyContent: n.on ? 'flex-end' : 'flex-start', cursor: 'pointer', transition: 'background-color .18s ease' }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
                    </span>
                  </div>
                ))}
              </div>
            )}

            {seg === 'gdpr' && (
              <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={secLabel}>Soukromí a GDPR</span>
                  <span style={{ fontSize: 13, color: '#7A82A6' }}>Jak nakládáme s údaji kandidátů.</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: '#F6F7FC', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7A82A6' }}>Doba uchování dat</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#0B1233' }}>12 měsíců</span>
                    <span style={{ fontSize: 11, color: '#A6ADCB' }}>od poslední komunikace</span>
                  </div>
                  <div style={{ background: '#F6F7FC', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7A82A6' }}>Souhlasy kandidátů</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#0B1233' }}>{(typeof E_CANDIDATES !== 'undefined' ? ((E_CANDIDATES.new || []).length + (E_CANDIDATES.shortlist || []).length + (E_CANDIDATES.interview || []).length + (E_CANDIDATES.hired || []).length) : 0)} platných</span>
                    <span style={{ fontSize: 11, color: '#A6ADCB' }}>aktivní souhlasy</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  <span onClick={() => setToast('export')} style={{ fontSize: 13, fontWeight: 800, color: '#1B34F0', border: '1px solid #D5DAF0', padding: '10px 15px', borderRadius: 9, cursor: 'pointer' }}>Exportovat data</span>
                  <span onClick={() => setToast('dpa')} style={{ fontSize: 13, fontWeight: 700, color: '#3A4266', border: '1px solid #E6E9F5', padding: '10px 15px', borderRadius: 9, cursor: 'pointer' }}>Zpracovatelská smlouva</span>
                </div>
              </div>
            )}

            {seg === 'danger' && (
              <div style={{ background: '#fff', border: '1px solid #F3B3B5', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={secLabel}>Nebezpečná zóna</span>
                  <span style={{ fontSize: 13, color: '#7A82A6' }}>Tyto kroky nelze vzít zpět.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#FEF3F3', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0B1233' }}>Pozastavit profil firmy</span>
                    <span style={{ fontSize: 12, color: '#7A82A6' }}>Inzeráty se skryjí, data zůstanou.</span>
                  </div>
                  <span onClick={() => { if (window.confirm('Opravdu pozastavit profil firmy? Inzeráty se skryjí.')) setToast('pause'); }} style={{ fontSize: 13, fontWeight: 800, color: '#B3261E', background: '#fff', border: '1px solid #F3B3B5', padding: '10px 15px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>Pozastavit</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#FEF3F3', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0B1233' }}>Smazat firemní účet</span>
                    <span style={{ fontSize: 12, color: '#7A82A6' }}>Odstraní profil, inzeráty i historii zpráv.</span>
                  </div>
                  <span onClick={() => { setDelOpen(true); setDelPw(''); setDelErr(''); }} style={{ fontSize: 13, fontWeight: 800, color: '#fff', background: '#B3261E', padding: '10px 15px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>Smazat účet</span>
                </div>
              </div>
            )}

            {/* Lišta neuložených změn */}
            {dirty && (
              <div style={{ position: 'sticky', bottom: 0, background: '#0B1233', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, boxShadow: '0 14px 34px -12px rgba(11,18,51,.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFC46B' }} />
                  <span style={{ fontSize: 13, color: '#fff' }}>{saving ? 'Ukládám…' : 'Máte neuložené změny'}</span>
                </div>
                <div style={{ display: 'flex', gap: 9 }}>
                  <span onClick={doReset} style={{ fontSize: 13, fontWeight: 700, color: '#9AA3CC', padding: '9px 14px', borderRadius: 9, cursor: 'pointer' }}>Zrušit</span>
                  <span onClick={() => !saving && doSave()} style={{ fontSize: 13, fontWeight: 800, color: '#0B1233', background: '#5CF0A8', padding: '9px 16px', borderRadius: 9, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>Uložit změny</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Smazání firemního účtu — potvrzení heslem (stejně jako u brigádníků) */}
      {delOpen && (
        <div onClick={closeDel} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(11,18,51,.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20, border: '1px solid #E6E9F5', padding: 26, boxShadow: '0 24px 60px rgba(20,22,40,.28)' }}>
            <div style={{ width: 60, height: 60, borderRadius: 17, background: '#FEECEC', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Icon name="trash-bin-trash-bold" size={26} color="#B3261E" />
            </div>
            <div style={{ textAlign: 'center', fontSize: 21, fontWeight: 800, color: '#0B1233', letterSpacing: '-.01em' }}>Opravdu smazat firemní účet?</div>
            <div style={{ textAlign: 'center', fontSize: 14, color: '#7A82A6', marginTop: 8, lineHeight: 1.5 }}>Trvale se odstraní profil, inzeráty, kandidáti i historie zpráv. Tuhle akci nelze vrátit.</div>
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0B1233', marginBottom: 6 }}>Pro potvrzení zadejte heslo</div>
              <input type="password" value={delPw} onChange={e => { setDelPw(e.target.value); if (delErr) setDelErr(''); }} onKeyDown={e => { if (e.key === 'Enter' && !deleting && delPw.trim()) doDelete(); }} placeholder="Vaše heslo" autoComplete="current-password" disabled={deleting} style={{ width: '100%', height: 46, padding: '0 14px', borderRadius: 12, boxSizing: 'border-box', background: '#F6F7FC', border: '1px solid ' + (delErr ? '#B3261E' : '#E6E9F5'), color: '#0B1233', fontSize: 15, outline: 'none' }} />
              {delErr && <div style={{ color: '#B3261E', fontSize: 12.5, marginTop: 6 }}>{delErr}</div>}
            </div>
            <button onClick={doDelete} disabled={deleting || !delPw.trim()} style={{ width: '100%', marginTop: 18, padding: 14, borderRadius: 14, background: '#B3261E', border: 'none', color: '#fff', fontSize: 15, fontWeight: 800, cursor: (deleting || !delPw.trim()) ? 'default' : 'pointer', opacity: (deleting || !delPw.trim()) ? 0.5 : 1 }}>{deleting ? 'Mažu…' : 'Ano, smazat účet'}</button>
            <button onClick={closeDel} disabled={deleting} style={{ width: '100%', marginTop: 10, padding: 13, borderRadius: 14, background: '#F6F7FC', border: '1px solid #E6E9F5', color: '#7A82A6', fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }}>Zpět</button>
          </div>
        </div>
      )}

      {/* Toasty */}
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 80, background: toast === 'err' ? '#B3261E' : '#0B1233', color: '#fff', fontSize: 13, fontWeight: 700, padding: '12px 18px', borderRadius: 11, boxShadow: '0 14px 34px -10px rgba(11,18,51,.5)' }}>
          {toast === 'ok' ? 'Profil uložen' : toast === 'err' ? 'Uložení se nezdařilo, zkuste to znovu' : toast === 'verify' ? 'Žádost o ověření odeslána — ozveme se e-mailem.' : toast === 'export' ? 'Export se připravuje, přijde e-mailem.' : toast === 'dpa' ? 'Zpracovatelská smlouva odeslána e-mailem.' : toast === 'pause' ? 'Profil byl pozastaven.' : toast === 'deleted' ? 'Žádost o smazání přijata — účet odstraníme do 24 h.' : ''}
        </div>
      )}
    </div>
  );
}
Object.assign(window, { ESettings });


/* ============================================================
   NOVÝ INZERÁT (ENewJobModal) — redesign: 3-krokový průvodce
   (Typ a pozice → Kdy a kde → Detaily) + live náhled swipe karty.
   Reálné napojení: Zveřejnit → onPublish(fields) → createJobE (Supabase),
   Uložit rozpracované → localStorage, Vyplnit podle → z E_JOBS, Zavřít → onClose.
   ============================================================ */
const _NJ_TYPES = [
  { key: 'once', label: 'Výpomoc', note: 'jednorázová akce' },
  { key: 'brigada', label: 'Brigáda', note: 'krátkodobá práce' },
  { key: 'part', label: 'Part-time', note: 'částečný úvazek', soon: true },
  { key: 'full', label: 'Full-time', note: 'plný úvazek', soon: true },
];
const _NJ_UNITS = ['Kč/h', 'Kč/den', 'Kč/měs'];
const _NJ_TITLE_HINTS = ['Barista', 'Skladník', 'Hosteska', 'Kuchař', 'Uklízečka', 'Pomocná síla'];
const _NJ_REGIONS = ['Praha', 'Středočeský', 'Jihomoravský', 'Moravskoslezský', 'Olomoucký', 'Zlínský', 'Jihočeský', 'Plzeňský', 'Ústecký', 'Královéhradecký', 'Pardubický', 'Vysočina', 'Liberecký', 'Karlovarský'];
const _NJ_TAGS = ['Gastro', 'Ranní směna', 'Odpolední směna', 'Bez zkušeností', 'Víkendy', 'Fyzická práce', 'Práce s lidmi', 'Vhodné pro studenty'];
const _NJ_LANGS = ['Čeština', 'Slovenština', 'Angličtina', 'Ukrajinština', 'Není potřeba'];
const _NJ_LANG_LEVELS = ['Základy', 'Domluví se', 'Plynule', 'Rodilý mluvčí'];
const _NJ_CONTRACTS = ['DPP', 'DPČ', 'HPP', 'IČO / faktura', 'Dohoda o výpomoci'];
const _NJ_NSP_FIELDS = [
  'Bankovnictví, finance a pojišťovnictví', 'Chemie a farmaceutický průmysl', 'Doprava a logistika',
  'Dřevařská výroba a nábytkářství', 'Ekonomika, administrativa a personalistika',
  'Elektrotechnika, energetika a telekomunikační technika', 'Hutnictví, slévárenství a zpracování kovů',
  'Informační technologie (IT)', 'Kultura, umění a design', 'Management',
  'Média, vydavatelství a žurnalistika', 'Nemovitosti, pronájem a správa majetku', 'Obchod a marketing',
  'Obrana, bezpečnost a ochrana osob a majetku', 'Osobní služby', 'Ostatní zpracovatelský průmysl',
  'Pohostinství, gastronomie a cestovní ruch', 'Polygrafie, zpracování papíru a filmu',
  'Poradenství a konzultační služby', 'Potravinářství a krmivářství', 'Poštovní a doručovatelské služby',
  'Právo, legislativa a justice', 'Provozní služby', 'Překladatelství, tlumočení a jazykové služby',
  'Rybolov, chovatelství a myslivost', 'Sklo, keramika, minerály a zpracování kamene',
  'Sociální péče a ochrana', 'Stavebnictví', 'Státní správa a územní samospráva', 'Strojírenství',
  'Technické testování, analýzy a certifikace', 'Textilní, oděvní a kožedělná výroba',
  'Těžba a zpracování surovin', 'Věda, výzkum a vývoj', 'Veterinární činnosti',
  'Vodní hospodářství a vodárenství', 'Vzdělávání, výchova a sport',
  'Výroba stavebních hmot a stavebních výrobků', 'Zdravotnictví a farmacie',
  'Zemědělství, zahradnictví a lesnictví',
];
const _NJ_FIELDS = [
  'Pohostinství, gastronomie a cestovní ruch', 'Obchod a marketing', 'Doprava a logistika',
  'Provozní služby', 'Ekonomika, administrativa a personalistika', 'Ostatní zpracovatelský průmysl',
  'Stavebnictví', 'Osobní služby', 'Vzdělávání, výchova a sport', 'Zemědělství, zahradnictví a lesnictví',
];
const _NJ_MODES = ['Na místě', 'Z domova', 'Kombinace'];
const _NJ_VALIDITY = ['7 dní', '14 dní', '30 dní', 'Do obsazení'];
const _NJ_SUITABLE = ['Studenti', 'Rodiče na MD/RD', 'Důchodci', 'OZP', 'Cizinci', 'Absolventi', 'Od 15 let'];
const _NJ_MORE_LANGS = ['Němčina', 'Polština', 'Ruština', 'Vietnamština', 'Rumunština', 'Maďarština', 'Bulharština', 'Španělština', 'Italština', 'Francouzština', 'Mongolština'];
const _NJ_PERKS = ['Káva zdarma', 'Nástup ihned', 'Jídlo na směně', 'Výplata do 3 dnů', 'Zaučíme', 'Doprava zdarma'];
const _NJ_TIME_PRESETS = [
  { label: '6:00–14:00', from: '06:00', to: '14:00' }, { label: '10:00–18:00', from: '10:00', to: '18:00' },
  { label: '14:00–22:00', from: '14:00', to: '22:00' }, { label: '18:00–02:00', from: '18:00', to: '02:00' },
];
const _NJ_DAYS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const _NJ_DESC_TEMPLATES = {
  default: 'Postaráte se o hladký průběh směny — příprava, obsluha a úklid pracoviště. Zaučíme vás na místě, stačí chuť pracovat a přijít včas.',
  Barista: 'Připravíte espresso a filtrovanou kávu, obsloužíte hosty u baru a udržíte pracoviště v čistotě. Zkušenost s pákovým strojem oceníme, ale zaučíme i začátečníka.',
  'Skladník': 'Naskladníte a vychystáte zboží, zkontrolujete objednávky a udržíte pořádek ve skladu. Práce ve dvojici, součástí je i manipulace s paletovým vozíkem.',
  'Kuchař': 'Připravíte pokrmy podle receptur, ohlídáte teploty a čistotu pracoviště. Vaříme z čerstvých surovin, na směně jsou vždy dva kuchaři.',
};
const _njMins = t => { const m = /^(\d{1,2}):(\d{2})$/.exec((t || '').trim()); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const _njCustomISO = s => { const m = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{2,4})/.exec(s || ''); if (!m) return ''; let y = m[3]; if (y.length === 2) y = '20' + y; return y + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0'); };
const _njChip = on => on ? { color: '#fff', bg: '#1B34F0', border: '#1B34F0' } : { color: '#3A4266', bg: '#fff', border: '#E6E9F5' };

function ENewJobModal({ onClose, onPublish } = {}) {
  const DRAFT_KEY = 'makej-emp-jobdraft';
  const [step, setStep] = React.useState(1);
  const [preview, setPreview] = React.useState(false);
  const [tried, setTried] = React.useState(false);
  const [shake, setShake] = React.useState(0);
  const [type, setType] = React.useState('brigada');
  const [title, setTitle] = React.useState('');
  const [pay, setPay] = React.useState('');
  const [payTo, setPayTo] = React.useState('');
  const [payRange, setPayRange] = React.useState(false);
  const [unit, setUnit] = React.useState('Kč/h');
  const [people, setPeople] = React.useState(1);
  const [contract, setContract] = React.useState(null);
  const [field, setField] = React.useState([]);
  const [fieldOpen, setFieldOpen] = React.useState(false);
  const [fieldSearch, setFieldSearch] = React.useState('');
  const [mode, setMode] = React.useState('Na místě');
  const [validity, setValidity] = React.useState('30 dní');
  const [datePreset, setDatePreset] = React.useState(null);
  const [dateISO, setDateISO] = React.useState('');
  const [dateCustom, setDateCustom] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [place, setPlace] = React.useState('');
  const [region, setRegion] = React.useState(null);
  const [desc, setDesc] = React.useState('');
  const [duties, setDuties] = React.useState([]);
  const [dutyInput, setDutyInput] = React.useState('');
  const [tags, setTags] = React.useState([]);
  const [suitable, setSuitable] = React.useState([]);
  const [langs, setLangs] = React.useState(['Čeština']);
  const [langLevels, setLangLevels] = React.useState({});
  const [langMore, setLangMore] = React.useState(false);
  const [langInput, setLangInput] = React.useState('');
  const [perks, setPerks] = React.useState([]);
  const [contactName, setContactName] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [rules, setRules] = React.useState(true);
  const [tw, setTw] = React.useState({ idx: 0, len: 0, back: false, hold: 0, caret: true });
  const [busy, setBusy] = React.useState(false);

  // Typewriter placeholder názvu pozice — běží jen dokud pole není vyplněné.
  React.useEffect(() => {
    if (title.trim()) return;
    const tick = setInterval(() => setTw(s => {
      const word = _NJ_TITLE_HINTS[s.idx];
      if (!s.back) { if (s.len < word.length) return { ...s, len: s.len + 1 }; if (s.hold < 14) return { ...s, hold: s.hold + 1 }; return { ...s, back: true, hold: 0 }; }
      if (s.len > 0) return { ...s, len: s.len - 1 };
      return { ...s, back: false, idx: (s.idx + 1) % _NJ_TITLE_HINTS.length };
    }), 55);
    const blink = setInterval(() => setTw(s => ({ ...s, caret: !s.caret })), 530);
    return () => { clearInterval(tick); clearInterval(blink); };
  }, [title]);

  // Načtení rozpracovaného konceptu při otevření.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d && typeof d === 'object') {
        if (d.type) setType(d.type); if (d.title) setTitle(d.title); if (d.pay) setPay(d.pay);
        if (d.payTo) setPayTo(d.payTo); if (d.payRange) setPayRange(true); if (d.unit) setUnit(d.unit);
        if (d.people) setPeople(d.people); if (d.contract) setContract(d.contract); if (Array.isArray(d.field)) setField(d.field);
        if (d.mode) setMode(d.mode); if (d.validity) setValidity(d.validity); if (d.dateISO) setDateISO(d.dateISO);
        if (d.datePreset) setDatePreset(d.datePreset); if (d.dateCustom) setDateCustom(d.dateCustom);
        if (d.from) setFrom(d.from); if (d.to) setTo(d.to); if (d.place) setPlace(d.place); if (d.region) setRegion(d.region);
        if (d.desc) setDesc(d.desc); if (Array.isArray(d.duties)) setDuties(d.duties); if (Array.isArray(d.tags)) setTags(d.tags);
        if (Array.isArray(d.suitable)) setSuitable(d.suitable); if (Array.isArray(d.langs)) setLangs(d.langs);
        if (d.langLevels) setLangLevels(d.langLevels); if (Array.isArray(d.perks)) setPerks(d.perks);
        if (d.contactName) setContactName(d.contactName); if (d.contactPhone) setContactPhone(d.contactPhone);
        if (typeof d.rules === 'boolean') setRules(d.rules);
      }
    } catch (e) {}
  }, []);

  const typeObj = _NJ_TYPES.find(t => t.key === type) || _NJ_TYPES[1];
  const shiftLike = type === 'once' || type === 'brigada';
  const fromM = _njMins(from), toM = _njMins(to);
  const hours = (fromM !== null && toM !== null) ? ((toM - fromM + 1440) % 1440) / 60 : null;
  const payNum = Number(String(pay).replace(/\s/g, '')) || 0;
  const payToNum = Number(String(payTo).replace(/\s/g, '')) || 0;
  const nf = n => n.toLocaleString('cs-CZ');
  const payText = payNum ? ((payRange && payToNum > payNum ? nf(payNum) + '–' + nf(payToNum) : nf(payNum)) + ' ' + unit) : null;
  const total = hours && unit === 'Kč/h' ? Math.round(payNum * hours) : null;
  const dateLabel = datePreset || (dateCustom.trim() || null);

  const presets = (() => {
    const out = []; const base = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const iso = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
      out.push({ label: i === 0 ? 'Dnes' : i === 1 ? 'Zítra' : (_NJ_DAYS[d.getDay()] + ' ' + d.getDate() + '. ' + (d.getMonth() + 1) + '.'), iso });
    }
    return out;
  })();

  const checks = [
    { key: 'title', done: !!title.trim(), step: 1 },
    { key: 'pay', done: payNum > 0, step: 1 },
    { key: 'field', done: field.length > 0, step: 1 },
    { key: 'contract', done: !!contract, step: 1 },
    { key: 'when', done: shiftLike ? !!(dateLabel && hours) : !!dateLabel, step: 2 },
    { key: 'place', done: (mode === 'Z domova' ? true : !!place.trim()) && !!region, step: 2 },
    { key: 'desc', done: desc.trim().length >= 40, step: 3 },
    { key: 'tags', done: tags.length >= 2, step: 3 },
  ];
  const bad = k => tried && !(checks.find(c => c.key === k) || {}).done;
  const anyErr = tried && checks.some(c => !c.done);
  const doneCount = checks.filter(c => c.done).length;
  const ERR = '#E5484D';

  const stepMeta = [1, 2, 3].map(n => {
    const own = checks.filter(c => c.step === n);
    const ownDone = own.filter(c => c.done).length;
    const sums = {
      1: [title.trim(), payText, contract].filter(Boolean).join(' · ') || 'pozice a mzda',
      2: [dateLabel, hours ? hours.toFixed(hours % 1 ? 1 : 0) + ' h' : null, place.trim()].filter(Boolean).join(' · ') || 'termín a místo',
      3: [desc.trim() ? 'popis' : null, tags.length ? tags.length + ' tagů' : null, perks.length ? perks.length + ' výhod' : null].filter(Boolean).join(' · ') || 'popis, tagy, výhody',
    };
    return { n, label: ['Typ a pozice', 'Kdy a kde', 'Detaily'][n - 1], note: sums[n], done: ownDone === own.length };
  });

  const draftObj = () => ({ type, title, pay, payTo, payRange, unit, people, contract, field, mode, validity, datePreset, dateISO, dateCustom, from, to, place, region, desc, duties, tags, suitable, langs, langLevels, perks, contactName, contactPhone, rules });
  const saveDraft = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draftObj())); } catch (e) {} if (window.empToast) window.empToast('Uloženo', 'Rozpracovaný inzerát je uložený, můžete se k němu vrátit.', '', 'ok'); };

  const pickField = lbl => setField(f => f.includes(lbl) ? f.filter(x => x !== lbl) : (f.length >= 3 ? f : f.concat(lbl)));
  const pickLang = name => setLangs(ls => {
    if (name === 'Není potřeba') return ls.includes(name) ? [] : [name];
    const rest = ls.filter(x => x !== 'Není potřeba');
    return rest.includes(name) ? rest.filter(x => x !== name) : rest.concat(name);
  });
  const addLang = () => { const raw = langInput.trim(); if (!raw) return; const name = raw[0].toUpperCase() + raw.slice(1); setLangs(ls => { const rest = ls.filter(x => x !== 'Není potřeba'); return rest.includes(name) ? ls : rest.concat(name); }); setLangInput(''); };
  const addDuty = () => { const t = dutyInput.trim(); if (!t) return; setDuties(d => d.concat(t)); setDutyInput(''); };
  const toggleIn = (setter, v) => setter(a => a.includes(v) ? a.filter(x => x !== v) : a.concat(v));

  const useTemplate = () => setDesc(_NJ_DESC_TEMPLATES[title.trim()] || _NJ_DESC_TEMPLATES.default);

  const duplicate = () => {
    const j = (typeof E_JOBS !== 'undefined' ? E_JOBS : [])[0];
    if (!j) return;
    setTitle(j.title || ''); setPay(String(j.pay || '')); setUnit(j.payUnit || 'Kč/h');
    setPlace(j.location || ''); if (j.kraj) setRegion(j.kraj);
    if (Array.isArray(j.tags)) setTags(j.tags.slice(0, 6));
    if (j.description) setDesc(j.description);
    if (window.empToast) window.empToast('Předvyplněno', 'Formulář jsem vyplnil podle inzerátu „' + (j.title || '') + '".', '', 'ok');
  };
  const dupLabel = (() => { const j = (typeof E_JOBS !== 'undefined' ? E_JOBS : [])[0]; return j ? j.title : null; })();

  const publish = () => {
    if (busy) return;
    if (step !== 3) { setStep(Math.min(3, step + 1)); return; }
    if (!checks.every(c => c.done)) {
      const first = checks.find(c => !c.done);
      setTried(true); setShake(x => x + 1); setStep(first.step);
      return;
    }
    setBusy(true);
    const jt = type === 'once' ? 'jednrazova_vypomoc' : 'brigada';
    let descFull = desc.trim();
    if (duties.length) descFull += (descFull ? '\n\n' : '') + 'Náplň práce:\n' + duties.map(d => '• ' + d).join('\n');
    if (perks.length) descFull += (descFull ? '\n\n' : '') + 'Co nabízíme: ' + perks.join(' · ');
    const reqs = []
      .concat(contract ? ['Smluvní vztah: ' + contract] : [])
      .concat(langs.filter(l => l !== 'Není potřeba').map(n => 'Jazyk: ' + n + (langLevels[n] ? ' (' + langLevels[n] + ')' : '')))
      .concat(suitable.map(x => 'Vhodné pro: ' + x))
      .concat(people > 1 ? ['Hledáme ' + people + ' lidí na směnu'] : []);
    const kraj = region || (typeof _krajZAdresy !== 'undefined' ? _krajZAdresy(place) : '') || '';
    const pubDate = dateISO || _njCustomISO(dateCustom) || '';
    const fields = {
      title: title.trim(),
      company: (typeof ECOMPANY !== 'undefined' ? ECOMPANY.name : '') || '',
      description: descFull,
      pay: payNum, pay_unit: unit,
      location: place.trim() || (mode === 'Z domova' ? 'Z domova' : ''),
      kraj,
      date: pubDate,
      time_start: from, time_end: to,
      tags, requirements: reqs,
      job_type: jt,
    };
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    if (onPublish) onPublish(fields); else if (onClose) onClose();
  };

  // ── styly ──
  const modalW = preview ? 1064 : 760;
  const gridCols = preview ? '1fr 372px' : '1fr';
  const inp = (border) => ({ fontSize: 15, color: '#0B1233', background: '#F6F7FC', border: '1px solid ' + border, borderRadius: 11, padding: '13px 15px', outline: 'none', width: '100%', boxSizing: 'border-box' });
  const lab = t => <span style={{ fontSize: 12, fontWeight: 700, color: '#3A4266' }}>{t}</span>;
  const hint = t => <span style={{ fontSize: 11, color: '#A6ADCB' }}>{t}</span>;
  const groupBox = errColor => ({ display: 'flex', gap: 6, flexWrap: 'wrap', border: '1.5px solid ' + (errColor || 'transparent'), borderRadius: 12, padding: 6, margin: -6 });
  const chipEl = (label, on, onClick, extra) => <span key={label} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 999, cursor: 'pointer', color: extra && extra.color || (on ? '#fff' : '#3A4266'), background: on ? '#1B34F0' : '#fff', border: '1px solid ' + (on ? '#1B34F0' : '#E6E9F5'), whiteSpace: 'nowrap' }}>{extra && extra.mark || ''}{label}</span>;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,18,51,.62)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: modalW, maxWidth: '100%', maxHeight: '92vh', background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 32px 80px rgba(11,18,51,.35)', display: 'flex', flexDirection: 'column', animation: 'njModalIn .32s cubic-bezier(.4,0,.2,1) both' }}>

        {/* Hlavička + kroky */}
        <div style={{ padding: '22px 26px 0', display: 'flex', flexDirection: 'column', gap: 18, flex: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em' }}>Nový inzerát</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {dupLabel && <span onClick={duplicate} style={{ fontSize: 12, fontWeight: 700, color: '#3A4266', background: '#F6F7FC', border: '1px solid #E6E9F5', padding: '8px 12px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>Vyplnit podle: {dupLabel.length > 16 ? dupLabel.slice(0, 16) + '…' : dupLabel}</span>}
              <span onClick={() => setPreview(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 800, color: preview ? '#fff' : '#3A4266', background: preview ? '#1B34F0' : '#F6F7FC', border: '1px solid ' + (preview ? '#1B34F0' : '#E6E9F5'), padding: '8px 12px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <span style={{ position: 'relative', width: 14, height: 14, flex: 'none', borderRadius: '50%', border: '1.5px solid ' + (preview ? '#fff' : '#3A4266'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ position: 'absolute', inset: -1.5, borderRadius: '50%', border: '1.5px solid ' + (preview ? '#fff' : '#3A4266'), animation: 'njLiveRing 1.8s ease-out infinite' }} />
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: preview ? '#fff' : '#3A4266', animation: 'njLivePulse 1.8s ease-in-out infinite' }} />
                </span>{preview ? 'Skrýt live náhled' : 'Live náhled'}
              </span>
              <span onClick={onClose} style={{ width: 34, height: 34, flex: 'none', borderRadius: 10, background: '#F6F7FC', color: '#3A4266', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 12, padding: 5 }}>
            {stepMeta.map((m, i) => {
              const cur = m.n === step, done = m.done, isBad = anyErr && !done;
              return (
                <span key={m.n} onClick={() => setStep(m.n)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', padding: '9px 12px', borderRadius: 9, background: done ? '#0FA968' : isBad ? '#FDECEC' : cur ? '#fff' : 'transparent', border: '1.5px solid ' + (done ? '#0FA968' : isBad ? '#E5484D' : 'transparent'), boxShadow: (done || cur) ? '0 1px 2px rgba(11,18,51,.1)' : 'none', whiteSpace: 'nowrap', animation: isBad ? 'njShake .5s ease-in-out ' + (i * 0.06).toFixed(2) + 's 1 both' : 'none', transition: 'background .2s, border-color .2s, color .2s' }}>
                  {done && <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>✓</span>}
                  <span style={{ fontSize: 13, fontWeight: 800, color: done ? '#fff' : isBad ? '#C42B30' : cur ? '#0B1233' : '#7A82A6' }}>{m.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Tělo (formulář + náhled) — scrolluje uvnitř */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', gridTemplateColumns: gridCols }}>
          <div style={{ padding: '22px 26px 26px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 452, minWidth: 0 }}>

            {step === 1 && (<>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.07em', color: '#A6ADCB', textTransform: 'uppercase' }}>Typ inzerátu</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {_NJ_TYPES.map(t => {
                    const on = t.key === type, soon = !!t.soon;
                    return (
                      <div key={t.key} onClick={() => { if (!soon) setType(t.key); }} style={{ border: '1.5px solid ' + (on ? '#1B34F0' : '#E6E9F5'), background: on ? '#EEF1FF' : soon ? '#FBFCFF' : '#fff', borderRadius: 13, padding: '13px 12px', display: 'flex', flexDirection: 'column', gap: 2, cursor: soon ? 'default' : 'pointer' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: on ? '#1B34F0' : soon ? '#A6ADCB' : '#0B1233', whiteSpace: 'nowrap' }}>{t.label}</span>
                        <span style={{ fontSize: 11, color: soon ? '#B9C0D9' : '#7A82A6', lineHeight: 1.35 }}>{t.note}</span>
                        {soon && <span style={{ alignSelf: 'flex-start', marginTop: 5, fontSize: 10, fontWeight: 800, letterSpacing: '.04em', color: '#7A82A6', background: '#EEF1FF', borderRadius: 999, padding: '3px 8px' }}>Připravujeme</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Smluvní vztah')}{hint('kandidát podle toho filtruje')}</div>
                <div style={groupBox(bad('contract') ? ERR : null)}>
                  {_NJ_CONTRACTS.map(c => chipEl(c, contract === c, () => setContract(contract === c ? null : c)))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Název pozice')}{title.length >= 50 && <span style={{ fontSize: 11, fontWeight: 700, color: '#F5920B' }}>50 / 50 — delší název se nevejde</span>}</div>
                <input value={title} onChange={e => setTitle(e.target.value.slice(0, 50))} placeholder={'např. ' + _NJ_TITLE_HINTS[tw.idx].slice(0, tw.len) + (title.trim() ? '' : (tw.caret ? '|' : ''))} style={{ ...inp(bad('title') ? ERR : title.trim() ? '#E6E9F5' : '#D5DAF0'), fontWeight: 600 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Obor')}{hint(field.length ? field.length + ' ze 3 vybráno' : 'vyberte až 3 obory')}</div>
                <div style={groupBox(bad('field') ? ERR : null)}>
                  {_NJ_FIELDS.concat(field.filter(f => !_NJ_FIELDS.includes(f))).map(f => {
                    const on = field.includes(f), full = !on && field.length >= 3;
                    return <span key={f} onClick={() => pickField(f)} style={{ fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 999, cursor: 'pointer', color: on ? '#fff' : full ? '#B9C0D9' : '#3A4266', background: on ? '#1B34F0' : '#fff', border: '1px solid ' + (on ? '#1B34F0' : '#E6E9F5'), whiteSpace: 'nowrap' }}>{f.split(',')[0].split(' a ')[0]}</span>;
                  })}
                  <span onClick={() => { setFieldOpen(o => !o); setFieldSearch(''); }} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 999, cursor: 'pointer', color: fieldOpen ? '#1B34F0' : '#3A4266', background: fieldOpen ? '#EEF1FF' : '#fff', border: '1px solid ' + (fieldOpen ? '#1B34F0' : '#E6E9F5'), whiteSpace: 'nowrap' }}>Další obory<span style={{ fontSize: 9 }}>▾</span></span>
                </div>
                {fieldOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 12, padding: '10px 11px', animation: 'njFadeUp .2s ease both' }}>
                    <input value={fieldSearch} onChange={e => setFieldSearch(e.target.value)} placeholder="Hledat obor podle NSP…" style={{ fontSize: 13, color: '#0B1233', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 9, padding: '10px 12px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 186, overflowY: 'auto' }}>
                      {_NJ_NSP_FIELDS.filter(f => { const q = fieldSearch.trim().toLowerCase(); return !q || f.toLowerCase().includes(q); }).map(f => {
                        const on = field.includes(f), full = !on && field.length >= 3;
                        return <span key={f} onClick={() => pickField(f)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12, fontWeight: on ? 800 : 600, color: on ? '#1B34F0' : full ? '#B9C0D9' : '#3A4266', background: on ? '#EEF1FF' : '#fff', borderRadius: 8, padding: '9px 11px', cursor: 'pointer' }}>{f}<span style={{ fontSize: 11, fontWeight: 800, color: '#0FA968' }}>{on ? '✓' : ''}</span></span>;
                      })}
                    </div>
                    <span style={{ fontSize: 11, color: '#A6ADCB' }}>{field.length >= 3 ? 'Vybrané 3 obory jsou maximum — nejdřív jeden odeberte' : 'Klasifikace podle Národní soustavy povolání — 40 oborů'}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Mzda')}<span onClick={() => { setPayRange(r => !r); setPayTo(''); }} style={{ fontSize: 11, fontWeight: 800, color: '#1B34F0', cursor: 'pointer', whiteSpace: 'nowrap' }}>{payRange ? '– zrušit rozpětí' : '+ rozpětí od–do'}</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#F6F7FC', border: '1px solid ' + (bad('pay') ? ERR : payNum > 0 ? '#E6E9F5' : '#D5DAF0'), borderRadius: 11, overflow: 'hidden' }}>
                    <input value={pay} onChange={e => setPay(e.target.value.replace(/[^\d]/g, ''))} placeholder="180" style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800, color: '#0B1233', background: 'transparent', border: 'none', padding: '13px 15px', outline: 'none' }} />
                    {payRange && <>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#A6ADCB', flex: 'none' }}>–</span>
                      <input value={payTo} onChange={e => setPayTo(e.target.value.replace(/[^\d]/g, ''))} placeholder="220" style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800, color: '#0B1233', background: 'transparent', border: 'none', padding: '13px 15px', outline: 'none' }} />
                    </>}
                    <div style={{ display: 'flex', gap: 2, padding: 4, flex: 'none' }}>
                      {_NJ_UNITS.map(u => <span key={u} onClick={() => setUnit(u)} style={{ fontSize: 12, fontWeight: 800, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', color: u === unit ? '#fff' : '#7A82A6', background: u === unit ? '#1B34F0' : 'transparent', whiteSpace: 'nowrap' }}>{u}</span>)}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: payNum && payNum < 150 ? '#B96F06' : payNum ? '#0B7B4B' : '#A6ADCB' }}>{payNum ? (payNum < 150 ? 'Nízká sazba — v okolí se platí od 160 Kč/h' : 'Sazba je nad průměrem v okolí') : 'Kandidáti filtrují podle mzdy, vyplňte ji vždy'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lab('Kolik lidí hledáte')}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span onClick={() => setPeople(p => Math.max(1, p - 1))} style={{ width: 44, height: 46, flex: 'none', borderRadius: 11, background: '#F6F7FC', border: '1px solid #E6E9F5', color: '#3A4266', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>–</span>
                    <span style={{ flex: 1, height: 46, borderRadius: 11, background: '#F6F7FC', border: '1px solid #E6E9F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#0B1233' }}>{people}</span>
                    <span onClick={() => setPeople(p => Math.min(20, p + 1))} style={{ width: 44, height: 46, flex: 'none', borderRadius: 11, background: '#F6F7FC', border: '1px solid #E6E9F5', color: '#3A4266', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#A6ADCB' }}>na jednu směnu</span>
                </div>
              </div>
            </>)}

            {step === 2 && (<>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {lab('Kde se pracuje')}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{_NJ_MODES.map(m => chipEl(m, mode === m, () => setMode(m)))}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {lab('Datum směny')}
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {presets.map(p => { const on = datePreset === p.label; const c = _njChip(on); return <span key={p.label} onClick={() => { setDatePreset(p.label); setDateISO(p.iso); setDateCustom(''); }} style={{ fontSize: 13, fontWeight: 700, padding: '9px 14px', borderRadius: 999, cursor: 'pointer', color: c.color, background: c.bg, border: '1px solid ' + c.border, whiteSpace: 'nowrap' }}>{p.label}</span>; })}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F6F7FC', border: '1px solid ' + (bad('when') ? ERR : '#E6E9F5'), borderRadius: 999, padding: '0 14px' }}>
                    <span style={{ fontSize: 12, color: '#A6ADCB' }}>nebo</span>
                    <input value={dateCustom} onChange={e => { setDateCustom(e.target.value); setDatePreset(null); setDateISO(''); }} placeholder="dd. mm. rrrr" style={{ width: 96, fontSize: 13, fontWeight: 700, color: '#0B1233', background: 'transparent', border: 'none', padding: '9px 0', outline: 'none' }} />
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Čas směny')}<span style={{ fontSize: 11, fontWeight: 700, color: hours ? '#0B7B4B' : '#A6ADCB' }}>{hours ? (hours.toFixed(hours % 1 ? 1 : 0) + ' h směna' + (total ? ' · ' + total.toLocaleString('cs-CZ') + ' Kč' : '')) : 'délku dopočítáme'}</span></div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{_NJ_TIME_PRESETS.map(p => { const on = from === p.from && to === p.to; const c = _njChip(on); return <span key={p.label} onClick={() => { setFrom(p.from); setTo(p.to); }} style={{ fontSize: 13, fontWeight: 700, padding: '9px 14px', borderRadius: 999, cursor: 'pointer', color: c.color, background: c.bg, border: '1px solid ' + c.border, whiteSpace: 'nowrap' }}>{p.label}</span>; })}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 2 }}>
                  {[['Od', from, setFrom, '06:00'], ['Do', to, setTo, '14:00']].map(([l, v, setv, ph]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F6F7FC', border: '1px solid ' + (bad('when') ? ERR : '#E6E9F5'), borderRadius: 11, padding: '0 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#A6ADCB', letterSpacing: '.06em', textTransform: 'uppercase' }}>{l}</span>
                      <input value={v} onChange={e => setv(e.target.value)} placeholder={ph} style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: '#0B1233', background: 'transparent', border: 'none', padding: '13px 0', outline: 'none' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lab(mode === 'Z domova' ? 'Místo (nepovinné)' : 'Adresa pracoviště')}
                <input value={place} onChange={e => setPlace(e.target.value)} placeholder={mode === 'Z domova' ? 'např. celá ČR' : 'např. Dolnice 314/2, Brno – Řečkovice'} style={inp(bad('place') && !place.trim() ? ERR : place.trim() ? '#E6E9F5' : '#D5DAF0')} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {lab('Kraj')}
                <div style={groupBox(bad('place') && !region ? ERR : null)}>{_NJ_REGIONS.map(r => chipEl(r, region === r, () => setRegion(region === r ? null : r)))}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Inzerát běží')}{hint(validity === 'Do obsazení' ? 'skryje se po obsazení' : 'pak se automaticky skryje')}</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{_NJ_VALIDITY.map(v => chipEl(v, validity === v, () => setValidity(v)))}</div>
              </div>
            </>)}

            {step === 3 && (<>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Popis práce')}<span style={{ fontSize: 11, fontWeight: 700, color: desc.length >= 40 ? '#0B7B4B' : '#A6ADCB' }}>{desc.length} / 600</span></div>
                <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 600))} placeholder="Co bude náplní směny? Dvě tři věty stačí." style={{ ...inp(bad('desc') ? ERR : '#E6E9F5'), minHeight: 104, resize: 'vertical', fontSize: 14, lineHeight: 1.55 }} />
                <span onClick={useTemplate} style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 800, color: '#1B34F0', cursor: 'pointer' }}>Vložit vzorový popis pro tuto pozici</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Náplň práce v bodech')}{hint('nepovinné, ale čte se nejlépe')}</div>
                {duties.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 10, padding: '9px 12px' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#1B34F0', flex: 'none' }} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#0B1233' }}>{d}</span>
                    <span onClick={() => setDuties(ds => ds.filter((_, j) => j !== i))} style={{ fontSize: 12, fontWeight: 800, color: '#A6ADCB', cursor: 'pointer', flex: 'none' }}>✕</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <input value={dutyInput} onChange={e => setDutyInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDuty(); } }} placeholder="např. příprava nápojů a obsluha u baru" style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#0B1233', background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 10, padding: '11px 13px', outline: 'none' }} />
                  <span onClick={addDuty} style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: dutyInput.trim() ? '#1B34F0' : '#A6ADCB', padding: '11px 16px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>Přidat bod</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Tagy')}{hint('pomáhají kandidátům inzerát najít')}</div>
                <div style={groupBox(bad('tags') ? ERR : null)}>{_NJ_TAGS.map(t => { const on = tags.includes(t); return chipEl(t, on, () => toggleIn(setTags, t), { mark: on ? '✓ ' : '+ ' }); })}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Vhodné i pro')}{hint('rozšíří dosah inzerátu')}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{_NJ_SUITABLE.map(o => { const on = suitable.includes(o); return chipEl(o, on, () => toggleIn(setSuitable, o), { mark: on ? '✓ ' : '+ ' }); })}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Jazyk')}{hint('co musí kandidát umět')}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {_NJ_LANGS.concat(langs.filter(l => !_NJ_LANGS.includes(l))).map(name => { const on = langs.includes(name); const lvl = langLevels[name]; return chipEl(on && lvl ? name + ' (' + lvl + ')' : name, on, () => pickLang(name), { mark: on ? '✓ ' : '+ ' }); })}
                  <span onClick={() => setLangMore(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 999, cursor: 'pointer', color: langMore ? '#1B34F0' : '#3A4266', background: langMore ? '#EEF1FF' : '#fff', border: '1px solid ' + (langMore ? '#1B34F0' : '#E6E9F5'), whiteSpace: 'nowrap' }}>{langMore ? '– Méně' : '+ Více jazyků'}</span>
                </div>
                {langMore && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 12, padding: '11px 12px', animation: 'njFadeUp .22s ease both' }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{_NJ_MORE_LANGS.map(name => { const on = langs.includes(name); return <span key={name} onClick={() => pickLang(name)} style={{ fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 999, cursor: 'pointer', color: on ? '#fff' : '#3A4266', background: on ? '#1B34F0' : '#fff', border: '1px solid ' + (on ? '#1B34F0' : '#E6E9F5'), whiteSpace: 'nowrap' }}>{on ? '✓ ' : '+ '}{name}</span>; })}</div>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                      <input value={langInput} onChange={e => setLangInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLang(); } }} placeholder="Napište jiný jazyk" style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: '#0B1233', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 9, padding: '9px 11px', outline: 'none' }} />
                      <span onClick={addLang} style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: langInput.trim() ? '#1B34F0' : '#A6ADCB', padding: '9px 14px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>Přidat</span>
                    </div>
                  </div>
                )}
                {langs.filter(l => l !== 'Není potřeba').map(name => {
                  const lvl = langLevels[name] || null;
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#F6F7FC', border: '1px solid ' + (!lvl && tried ? '#E5484D' : '#E6E9F5'), borderRadius: 12, padding: '9px 12px' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#0B1233', whiteSpace: 'nowrap' }}>{name}</span>
                      <span style={{ fontSize: 11, color: !lvl && tried ? '#C42B30' : '#7A82A6', whiteSpace: 'nowrap' }}>{lvl ? 'úroveň nastavena' : 'vyberte úroveň'}</span>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginLeft: 'auto' }}>
                        {_NJ_LANG_LEVELS.map(l => { const on = lvl === l; return <span key={l} onClick={() => setLangLevels(m => ({ ...m, [name]: m[name] === l ? null : l }))} style={{ fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 999, cursor: 'pointer', color: on ? '#fff' : '#3A4266', background: on ? '#1B34F0' : '#fff', border: '1px solid ' + (on ? '#1B34F0' : '#E6E9F5'), whiteSpace: 'nowrap' }}>{l}</span>; })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {lab('Co nabízíte')}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{_NJ_PERKS.map(p => { const on = perks.includes(p); return chipEl(p, on, () => toggleIn(setPerks, p), { mark: on ? '✓ ' : '+ ' }); })}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{lab('Kontaktní osoba')}{hint('uvidí ji jen přijatý kandidát')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jméno a příjmení" style={{ ...inp('#E6E9F5'), fontSize: 13 }} />
                  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Telefon nebo e-mail" style={{ ...inp('#E6E9F5'), fontSize: 13 }} />
                </div>
              </div>
              <div onClick={() => setRules(r => !r)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 12, padding: '14px 15px', cursor: 'pointer' }}>
                <span style={{ width: 22, height: 22, flex: 'none', borderRadius: 7, background: rules ? '#1B34F0' : '#fff', border: '1.5px solid ' + (rules ? '#1B34F0' : '#D5DAF0'), color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{rules ? '✓' : ''}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1233' }}>Poslat pravidla z profilu při shodě</span>
                  <span style={{ fontSize: 11, color: '#7A82A6' }}>Kandidát je dostane do chatu automaticky.</span>
                </div>
              </div>
            </>)}
          </div>

          {preview && (
            <div style={{ background: '#F6F7FC', borderLeft: '1px solid #E6E9F5', padding: '22px 22px 26px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'njFadeUp .28s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.07em', color: '#A6ADCB', textTransform: 'uppercase' }}>Náhled pro kandidáta</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0FA968' }}>živě</span>
              </div>
              <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ height: 96, background: 'linear-gradient(120deg,#1B34F0 0%,#5C71FF 62%,#EEF1FF 100%)', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: 14, fontSize: 11, fontWeight: 800, color: '#0B1233', background: '#fff', padding: '4px 9px', borderRadius: 7 }}>{typeObj.label}</span>
                  <span style={{ position: 'absolute', right: 14, top: 14, fontSize: 11, fontWeight: 800, color: '#fff', background: 'rgba(11,18,51,.35)', padding: '4px 9px', borderRadius: 7 }}>{region || 'Kraj'}</span>
                </div>
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 11, marginTop: -24 }}>
                  <span style={{ width: 48, height: 48, borderRadius: 14, background: (typeof ECOMPANY !== 'undefined' && ECOMPANY.logoColor) || '#1B34F0', border: '3px solid #fff', color: '#fff', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{((typeof ECOMPANY !== 'undefined' && ECOMPANY.name) || 'F').charAt(0)}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 17, fontWeight: 800, color: '#0B1233', letterSpacing: '-.01em' }}>{title.trim() || 'Název pozice'}</span>
                    <span style={{ fontSize: 12, color: '#7A82A6' }}>{((typeof ECOMPANY !== 'undefined' && ECOMPANY.name) || 'Firma') + ' · ' + (mode === 'Z domova' ? 'Z domova' : (place.trim() || 'místo neuvedeno'))}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, background: '#F6F7FC', borderRadius: 12, padding: '12px 13px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7A82A6' }}>Odměna</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1 }}>{payText || ('— ' + unit)}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0B7B4B', background: '#E6F7EF', padding: '5px 9px', borderRadius: 7, whiteSpace: 'nowrap' }}>{total ? total.toLocaleString('cs-CZ') + ' Kč za směnu' : 'délka neuvedena'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#1B34F0', flex: 'none' }} /><span style={{ fontSize: 13, color: '#3A4266' }}>{dateLabel ? (dateLabel + (from && to ? ' · ' + from + '–' + to : '')) : 'termín neuvedený'}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#1B34F0', flex: 'none' }} /><span style={{ fontSize: 13, color: '#3A4266' }}>{people === 1 ? 'Hledáme 1 člověka' : 'Hledáme ' + people + ' lidi'}</span></div>
                  </div>
                  <span style={{ fontSize: 13, color: '#7A82A6', lineHeight: 1.5 }}>{desc.trim() || 'Popis se zobrazí tady — podle něj se kandidát rozhoduje, jestli swajpne vpravo.'}</span>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{tags.concat(perks).slice(0, 6).map((t, i) => <span key={i} style={{ fontSize: 11, fontWeight: 700, color: '#1B34F0', background: '#EEF1FF', padding: '5px 9px', borderRadius: 999 }}>{t}</span>)}</div>
                  <div style={{ display: 'flex', gap: 8, paddingTop: 2 }}>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 800, color: '#7A82A6', background: '#F1F3FB', padding: 9, borderRadius: 9, textAlign: 'center' }}>Přeskočit</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 800, color: '#fff', background: '#1B34F0', padding: 9, borderRadius: 9, textAlign: 'center' }}>Mám zájem</span>
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#A6ADCB', lineHeight: 1.5 }}>Takto se inzerát objeví kandidátům v aplikaci. Změny se propíšou hned.</span>
            </div>
          )}
        </div>

        {/* Patička */}
        <div style={{ borderTop: '1px solid #E6E9F5', background: '#fff', padding: '16px 26px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9, flex: 'none' }}>
          {step > 1 && <span onClick={() => setStep(s => Math.max(1, s - 1))} style={{ fontSize: 13, fontWeight: 700, color: '#3A4266', border: '1px solid #E6E9F5', padding: '11px 16px', borderRadius: 10, cursor: 'pointer' }}>Zpět</span>}
          <span onClick={saveDraft} style={{ fontSize: 13, fontWeight: 700, color: '#7A82A6', padding: '11px 14px', borderRadius: 10, cursor: 'pointer' }}>Uložit rozpracované</span>
          <span onClick={publish} style={{ fontSize: 14, fontWeight: 800, color: '#fff', background: '#1B34F0', padding: '12px 22px', borderRadius: 10, cursor: busy ? 'wait' : 'pointer', whiteSpace: 'nowrap', opacity: busy ? 0.7 : 1 }}>{step === 3 ? (busy ? 'Zveřejňuji…' : 'Zveřejnit inzerát') : 'Pokračovat'}</span>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ENewJobModal });
