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
    <div className="e-ram" style={{ padding: 20 }}>
      <div style={_erS(`background:${_erC.bg};border:1px solid ${_erC.shell};border-radius:22px;overflow:hidden`)}>
        <ETabHlava title="Zprávy" />
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
    <div className="e-ram" style={{ padding: 20 }}>
      <div style={_erS(`background:${_erC.bg};border:1px solid ${_erC.shell};border-radius:22px;overflow:hidden`)}>

        <ETabHlava title="Zprávy">
          <EBtnSek onClick={() => window.empGoTab && window.empGoTab('settings')}>Šablony zpráv</EBtnSek>
          <EBtnHl onClick={onNew}>+ Nový inzerát</EBtnHl>
        </ETabHlava>

        {/* Pás čísel — jen skutečná (dřív tu byla vymyšlená „Průměrná odezva 4 h") */}
        <EMetriky items={[
          { l: 'Nepřečtené', v: _unreadCount, s: 'konverzace', kam: _unreadCount ? 'Ukázat' : null, onClick: _unreadCount ? () => setFilter('unread') : undefined, varovani: _unreadCount > 0 },
          { l: 'Čeká na vaši odpověď', v: _waitingCount, s: 'poslední zpráva je od kandidáta' },
          { l: 'Konverzace celkem', v: _totalCount, s: 'se všemi kandidáty' },
        ]} />

        {/* Tělo: 3 sloupce */}
        <div style={_erS('padding:22px 24px 22px;display:grid;grid-template-columns:332px 1fr;grid-template-rows:minmax(420px,1fr);gap:16px')}>

          {/* Sloupec 1 — seznam konverzací */}
          <div style={{ ..._erS('background:#fff;border:1px solid #E6E9F5;border-radius:16px;display:flex;flex-direction:column;overflow:hidden'), minHeight: 0 }}>
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
          <div style={{ ..._erS('background:#fff;border:1px solid #E6E9F5;border-radius:16px;display:flex;flex-direction:column;overflow:hidden'), minHeight: 0 }}>
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
                <button onClick={() => window.empOpenProfile && window.empOpenProfile(thread.worker_id, { name: thread.name, address: thread.city, rating: thread.rating, verified: thread.verified, cv_url: thread.cvUrl, trust: thread.trust })} style={_erS('font-size:13px;font-weight:700;color:#1B34F0;background:#fff;border:1px solid #D5DAF0;padding:9px 14px;border-radius:9px;cursor:pointer')}>Profil</button>
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
                if (m.kind === 'job') {
                  // Nabídka brigády z karty kandidáta — brigádník ji v appce otevře a dá „Mám zájem"
                  const jb = m.job || {};
                  return (
                    <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                      <div style={{ padding: 14, borderRadius: 14, background: '#fff', border: '1px solid #D5DAF0', minWidth: 240 }}>
                        <div style={{ color: '#1B34F0', fontSize: 10, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>Nabídka brigády</div>
                        <div style={{ color: '#0B1233', fontSize: 16, fontWeight: 800, marginTop: 4 }}>{jb.title}</div>
                        <div style={{ color: '#7A82A6', fontSize: 12.5, marginTop: 5 }}>{[jb.pay ? jb.pay + ' ' + (jb.pay_unit || 'Kč/h') : null, jb.location, typeof _eDatumKratce === 'function' ? _eDatumKratce(jb.date) : jb.date].filter(Boolean).join(' · ')}</div>
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
                <div style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: j.status === 'urgent' ? '#8B3DFF' : '#5BD68A' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.cardText, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                  <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 11, marginTop: 2 }}>
                    {j.status === 'urgent' ? 'Urgentní' : 'Aktivní'}{j.location ? ' · ' + j.location : ''}{j.matches ? ' · ' + j.matches + ' kandidátů' : ''}
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
const _ER_SORTS = { new: 'Nejnovější', old: 'Nejstarší', high: 'Nejlepší hodnocení', low: 'Nejhorší hodnocení' };
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
    <div style={_erS(`background:#fff;border:1px solid ${_erC.line};border-radius:16px;padding:20px 22px;display:flex;flex-direction:column;gap:14px`)}>
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
    <div className="e-ram" style={{ padding: 20 }}>
      <div style={_erS(`background:${_erC.bg};border:1px solid ${_erC.shell};border-radius:22px;overflow:hidden`)}>

        <ETabHlava title="Recenze" />

        {/* Pás čísel — jen skutečná (dřív tu byla vymyšlená „reakční doba 1,4 dne") */}
        <EMetriky items={[
          { l: 'Průměrné hodnocení', v: avg === '—' ? '—' : avg + ' ★', s: total + ' hodnocení' },
          { l: 'Bez vaší odpovědi', v: unanswered, s: 'recenze', kam: unanswered ? 'Odpovědět' : null, onClick: unanswered ? () => setFilter('unanswered') : undefined, varovani: unanswered > 0 },
          { l: 'Podíl 5 ★', v: fiveShare, s: 'ze všech hodnocení' },
        ]} />

        {/* Pevná obrazovka (28. 9.): lišta nahoře stojí, posouvá se jen seznam;
            pravý sloupec má vlastní posuvník, jen když se nevejde. */}
        <div style={_erS('padding:22px 24px 22px;display:grid;grid-template-columns:1fr 336px;grid-template-rows:minmax(360px,1fr);gap:20px')}>
          <div style={_erS('display:flex;flex-direction:column;gap:16px;min-width:0;min-height:0')}>
            {/* Filtrační lišta — společná komponenta (employer-shell.jsx) */}
            <EFiltrLista>
              <EFiltrPrepinac value={filter} onChange={setFilter} options={[
                { k: 'all', l: 'Vše', n: total }, { k: 'unanswered', l: 'Bez reakce', n: unanswered }, { k: 'answered', l: 'Odpovězeno', n: answered },
                { k: '5', l: '5 ★' }, { k: 'low', l: '3 ★ a méně' },
              ]} />
              <EFiltrVpravo>
                <EFiltrRazeni value={sort} options={_ER_SORTS} onChange={setSort} />
                <EFiltrHledat value={query} onChange={setQuery} placeholder="Hledat v recenzích" />
              </EFiltrVpravo>
            </EFiltrLista>

            <div style={_erS('flex:1;min-height:0;overflow-y:auto;display:grid;align-content:start;grid-auto-rows:max-content;gap:16px')}>
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
          </div>

          {/* Pravý sloupec */}
          <div style={_erS('display:grid;align-content:start;grid-auto-rows:max-content;gap:16px;min-height:0;overflow-y:auto')}>
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

// Ceny bez dovětku „bez DPH“ (Yasin 27. 9.): Makej není plátce DPH, cena je konečná.
// Samův web má zatím „za měsíc bez DPH“.
// Tarify, funkce i vzhled 1:1 podle Samova ceníku na webu
// (pro-zamestnavatele.html, sekce #pricing — třídy .yp-*). Když se změní web,
// změnit i tady: karty (PLANS), srovnání (FEATURE_ROWS), kalkulačku Vlastní.
const PLANS = [
  {
    id: 'zakladni', name: 'Základní', free: true, period: 'navždy zdarma',
    kdo: 'Pro začátek', popis: 'Vyzkoušejte si nábor bez rizika a bez platby.', uvod: 'Obsahuje:',
    color: '#8AB4FF', rgb: '138,180,255',
    feats: [['1 aktivní inzerát', true], ['Oslovování kandidátů 1×/měs', true], ['Topování inzerátu', false], ['Ověřená firma', false]],
    cta: 'Začít zdarma',
  },
  {
    id: 'vyhodny', name: 'Výhodný', price: 499, annualPrice: 424, save: 900, period: 'za měsíc',
    kdo: 'Občasný nábor', popis: 'Když jednou za čas hledáte nového kolegu.', uvod: 'Vše ze Základní, a navíc:',
    color: '#5B6BFF', rgb: '91,107,255',
    feats: [['2 aktivní inzeráty', true], ['Topování inzerátu 1×/měs', true], ['Oslovování kandidátů 3×/měs', true], ['Ověřená firma', true]],
    cta: 'Vybrat Výhodný',
  },
  {
    id: 'dynamicky', name: 'Dynamický', price: 2000, annualPrice: 1700, save: 3600, period: 'za měsíc',
    kdo: 'Aktivně hledám', popis: 'Pro firmy, které nabírají průběžně na více pozic.', uvod: 'Vše z Výhodný, a navíc:',
    color: '#5BD68A', rgb: '91,214,138', popular: true,
    feats: [['5 aktivních inzerátů', true], ['Topování inzerátu 3×/měs', true], ['Plné statistiky + CSV export', true], ['Prioritní řešení podpory', true]],
    cta: 'Vybrat Dynamický',
  },
  {
    id: 'maximalni', name: 'Maximální', price: 4999, annualPrice: 4249, save: 9000, period: 'za měsíc',
    kdo: 'Rostoucí tým', popis: 'Když potřebujete obsadit hodně míst rychle.', uvod: 'Vše z Dynamický, a navíc:',
    color: '#FFD166', rgb: '255,209,102',
    feats: [['10 aktivních inzerátů', true], ['Topování inzerátu 5×/měs', true], ['Prémiový badge + Urgent 2×', true]],
    cta: 'Vybrat Maximální',
  },
  {
    id: 'vlastni', name: 'Vlastní', calc: true, period: 'za měsíc',
    kdo: 'Pro velké firmy', popis: 'Desítky až tisíce pozic a podmínky na míru. Vše z Maximální.',
    color: '#E0B0FF', rgb: '224,176,255',
    feats: [['Vše z Maximální', true]],
    cta: 'Nezávazná poptávka', contact: true,
  },
];

// Srovnání funkcí — řádky přesně jako tabulka na webu.
// Hodnota buňky: true/false (má/nemá) nebo text (konkrétní limit).
const FEATURE_ROWS = [
  { section: 'Inzeráty' },
  { label: 'Aktivní inzeráty',                 cells: { zakladni: '1',      vyhodny: '2',      dynamicky: '5',       maximalni: '10',      vlastni: '20–5 000' } },
  { label: 'Topování inzerátu',                cells: { zakladni: false,    vyhodny: '1×/měs', dynamicky: '3×/měs',  maximalni: '5×/měs',  vlastni: '5×/měs' } },
  { label: 'Plánování inzerátu',               cells: { zakladni: false,    vyhodny: false,    dynamicky: true,      maximalni: true,      vlastni: true } },
  { label: 'Custom šablona inzerátů (pozadí)', cells: { zakladni: false,    vyhodny: false,    dynamicky: true,      maximalni: true,      vlastni: true } },
  { section: 'Nábor a viditelnost' },
  { label: 'Oslovování kandidátů',             cells: { zakladni: '1×/měs', vyhodny: '3×/měs', dynamicky: '10×/měs', maximalni: '20×/měs', vlastni: '20×/měs+' } },
  { label: 'Ověřená firma',                    cells: { zakladni: false,    vyhodny: true,     dynamicky: true,      maximalni: true,      vlastni: true } },
  { label: 'Video na profilu',                 cells: { zakladni: false,    vyhodny: true,     dynamicky: true,      maximalni: true,      vlastni: true } },
  { label: 'Prémiový badge',                   cells: { zakladni: false,    vyhodny: false,    dynamicky: true,      maximalni: true,      vlastni: true } },
  { label: 'Notifikace Urgent',                cells: { zakladni: false,    vyhodny: false,    dynamicky: '1×',      maximalni: '2×',      vlastni: '3×' } },
  { label: 'Zmínka na FB + IG Makej',          cells: { zakladni: false,    vyhodny: false,    dynamicky: true,      maximalni: true,      vlastni: true } },
  { label: 'Branding',                         cells: { zakladni: false,    vyhodny: false,    dynamicky: true,      maximalni: true,      vlastni: true } },
  { section: 'Data a reporting' },
  { label: 'Základní statistiky',              cells: { zakladni: true,     vyhodny: true,     dynamicky: true,      maximalni: true,      vlastni: true } },
  { label: 'Plné statistiky + CSV export',     cells: { zakladni: false,    vyhodny: false,    dynamicky: true,      maximalni: true,      vlastni: true } },
  { section: 'Tým a podpora' },
  { label: 'Rozdělení rolí uživatelů v týmu',  cells: { zakladni: false,    vyhodny: false,    dynamicky: false,     maximalni: true,      vlastni: true } },
  { label: 'Prioritní řešení podpory',         cells: { zakladni: false,    vyhodny: false,    dynamicky: true,      maximalni: true,      vlastni: true } },
];

// Styly převzaté z webu (#pricing .yp-*), jen pod třídou .e-cenik.
const _CENIK_CSS = `
.e-cenik .yp-head{text-align:center;}
.e-cenik .yp-h2{font-size:26px;font-weight:800;color:#111827;margin:0 0 4px;letter-spacing:-.02em;}
.e-cenik .yp-sub{color:#6b7280;font-size:14px;margin:0 0 14px;}
.e-cenik .yp-toggle{display:inline-flex;align-items:center;gap:10px;}
.e-cenik .yp-trow{display:inline-flex;align-items:center;gap:12px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:99px;padding:6px 16px;}
.e-cenik .yp-trow span{font-weight:700;font-size:14px;color:#9ca3af;transition:color .2s;}
.e-cenik .yp-trow span.on{color:#111827;}
.e-cenik .yp-sw{width:48px;height:26px;border-radius:999px;background:#d1d5db;position:relative;cursor:pointer;transition:background .2s;flex:0 0 auto;border:none;padding:0;}
.e-cenik .yp-sw.on{background:#00c637;}
.e-cenik .yp-sw i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:999px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.25);transition:left .2s;}
.e-cenik .yp-sw.on i{left:25px;}
.e-cenik .yp-save{background:rgba(0,198,55,.12);border:1px solid rgba(0,198,55,.3);color:#00a82f;font-size:13px;font-weight:800;border-radius:12px;padding:6px 14px;opacity:0;transform:scale(.9);transition:opacity .2s,transform .2s;}
.e-cenik .yp-save.on{opacity:1;transform:scale(1);}
.e-cenik .yp-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;align-items:stretch;margin-top:20px;}
.e-cenik .yp-card{position:relative;display:flex;flex-direction:column;text-align:center;border-radius:20px;padding:24px 18px 18px;transition:transform .25s cubic-bezier(.34,1.3,.5,1),box-shadow .25s;}
.e-cenik .yp-card:hover{transform:translateY(-6px);box-shadow:0 16px 36px rgba(16,24,64,.14);}
.e-cenik .yp-card.akt{box-shadow:0 0 0 2px #0020F6;}
.e-cenik .yp-badge{position:absolute;top:0;right:0;display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#0020F6,#5B6BFF);color:#fff;font-size:10.5px;font-weight:800;padding:6px 12px;border-radius:0 20px 0 14px;}
.e-cenik .yp-akt{position:absolute;top:0;left:0;background:#0020F6;color:#fff;font-size:10.5px;font-weight:800;padding:6px 12px;border-radius:20px 0 14px 0;}
.e-cenik .yp-name{font-size:12px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:1.4px;margin:6px 0 10px;}
.e-cenik .yp-price{min-height:42px;display:flex;align-items:baseline;justify-content:center;gap:4px;flex-wrap:wrap;}
.e-cenik .yp-price .free{font-size:34px;font-weight:800;color:#111827;line-height:1;}
.e-cenik .yp-price .yp-num{font-size:36px;font-weight:800;color:#111827;line-height:1;white-space:nowrap;}
.e-cenik .yp-price .kc{color:#6b7280;font-size:17px;font-weight:600;}
.e-cenik .yp-period{color:#9ca3af;font-size:12.5px;margin-top:5px;}
.e-cenik .yp-savew{min-height:22px;margin:4px 0 2px;display:flex;justify-content:center;align-items:center;}
.e-cenik .yp-savew span{opacity:0;transition:opacity .2s;background:rgba(0,198,55,.12);border:1px solid rgba(0,198,55,.3);color:#00a82f;font-size:10.5px;font-weight:800;border-radius:8px;padding:3px 9px;}
.e-cenik .yp-savew.on span{opacity:1;}
.e-cenik .yp-savew span.yp-kalk-sleva{opacity:1;background:rgba(139,92,246,.12);border-color:rgba(139,92,246,.32);color:#6D3FD1;}
.e-cenik .yp-hr{border-top:1px solid rgba(0,0,0,.07);margin:4px 0 12px;}
.e-cenik .yp-kalk{display:flex;flex-direction:column;gap:9px;margin:-4px 0 14px;text-align:left;}
.e-cenik .yp-kalk-radek{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;color:#374151;cursor:pointer;}
.e-cenik .yp-kalk-cislo{width:74px;height:32px;box-sizing:border-box;border:1.5px solid rgba(139,92,246,.35);border-radius:10px;background:#fff;font-size:14px;font-weight:800;color:#111827;text-align:center;outline:none;padding:0 4px;-moz-appearance:textfield;}
.e-cenik .yp-kalk-cislo::-webkit-outer-spin-button,.e-cenik .yp-kalk-cislo::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.e-cenik .yp-kalk-cislo:focus{border-color:#8B5CF6;box-shadow:0 0 0 3px rgba(139,92,246,.15);}
.e-cenik .yp-kalk-drah{position:relative;height:24px;}
.e-cenik .yp-kalk-znacky{position:absolute;inset:0;pointer-events:none;}
.e-cenik .yp-kalk-znacky i{position:absolute;top:9px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:#C9B8E6;transition:background .2s;}
.e-cenik .yp-kalk-znacky i.je{background:rgba(255,255,255,.92);}
.e-cenik .yp-posuvnik{-webkit-appearance:none;appearance:none;position:absolute;left:0;top:6px;width:100%;height:12px;border-radius:99px;outline:none;margin:0;cursor:pointer;background:#E9E0F6;}
.e-cenik .yp-posuvnik::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid #8B5CF6;box-sizing:border-box;box-shadow:0 2px 8px rgba(139,92,246,.35);cursor:grab;}
.e-cenik .yp-posuvnik::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid #8B5CF6;box-sizing:border-box;box-shadow:0 2px 8px rgba(139,92,246,.35);cursor:grab;}
.e-cenik .yp-posuvnik:focus-visible{box-shadow:0 0 0 3px rgba(139,92,246,.25);}
.e-cenik .yp-kalk-meze{display:flex;justify-content:space-between;font-size:10.5px;color:#9ca3af;margin-top:-3px;}
.e-cenik .yp-feats{display:flex;flex-direction:column;gap:7px;margin-bottom:12px;text-align:left;}
.e-cenik .yp-feat{display:flex;align-items:flex-start;gap:9px;font-size:13px;font-weight:600;line-height:1.35;}
.e-cenik .yp-feat > :first-child{flex:0 0 auto;margin-top:1px;}
.e-cenik .yp-cta{margin-top:auto;padding-top:6px;}
.e-cenik .yp-btn{display:block;width:100%;padding:11px 0;border-radius:12px;font-size:14px;font-weight:800;text-align:center;text-decoration:none;cursor:pointer;box-sizing:border-box;background:#fff;transition:filter .15s;}
.e-cenik .yp-btn:hover{filter:brightness(.97);}
.e-cenik .yp-btn.pop{background:linear-gradient(135deg,#0020F6,#3a3a99);color:#fff;border:none;}
.e-cenik .yp-btn.akt{background:#f3f4f6;border:1px solid #e5e7eb;color:#9ca3af;cursor:default;}
.e-cenik .yp-comparebtn{display:block;margin:10px auto 0;background:none;border:none;color:#0020f6;font-weight:700;font-size:14px;cursor:pointer;padding:12px;}
.e-cenik .yp-table-wrap{margin:14px auto 0;overflow-x:auto;}
.e-cenik .yp-table{width:100%;border-collapse:collapse;min-width:840px;}
.e-cenik .yp-table th,.e-cenik .yp-table td{padding:12px 14px;text-align:center;font-size:12.5px;border-bottom:1px solid #eef0f6;}
.e-cenik .yp-table th:first-child,.e-cenik .yp-table td:first-child{text-align:left;color:#374151;font-weight:600;}
.e-cenik .yp-table thead th{font-weight:800;color:#111827;font-size:14px;border-bottom:2px solid #e5e7eb;position:sticky;top:0;background:#fff;z-index:1;}
.e-cenik .yp-sec td{background:#f7f8fc;font-weight:800;color:#111827;text-align:left !important;font-size:11.5px;text-transform:uppercase;letter-spacing:.5px;}
.e-cenik .yp-cell-no{color:#d1d5db;font-weight:700;}
.e-cenik .yp-cell-txt{font-weight:700;color:#111827;font-size:12px;font-variant-numeric:tabular-nums;}
`;

// Kalkulačka tarifu Vlastní — stejný sazebník jako na webu (kalkulackaVlastni()).
// Základ 10 000 Kč za 20 inzerátů, každý další podle pásma; výsledek se
// zaokrouhlí na tisíce a sníží o korunu (ceny končí na 999).
const _KALK_ZAKLAD = 10000, _KALK_OD = 20;
const _KALK_PASMA = [[50,450],[100,350],[250,250],[500,180],[1000,120],[2500,80],[5000,50]];
const _KALK_KROKY = (() => {
  const k = []; let v;
  for (v = 20;  v <= 100;  v += 10)  k.push(v);
  for (v = 150; v <= 500;  v += 50)  k.push(v);
  for (v = 600; v <= 5000; v += 100) k.push(v);
  return k;
})();
function _kalkCena(n) {
  let p = _KALK_ZAKLAD, spodek = _KALK_OD;
  for (const [do_, sazba] of _KALK_PASMA) {
    if (n <= spodek) break;
    p += (Math.min(n, do_) - spodek) * sazba;
    spodek = do_;
  }
  return Math.round(p / 1000) * 1000 - 1;
}

// Číslo ceny se k nové hodnotě dopočítá (jako na webu), neskočí.
function CenikCislo({ value, style, className = 'yp-num' }) {
  const ref = useRefE(null);
  const predtim = useRefE(value);
  useEffectE(() => {
    const el = ref.current; if (!el) return;
    const z = predtim.current, na = value;
    predtim.current = value;
    if (z === na) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = na.toLocaleString('cs-CZ'); return; }
    const start = performance.now(), dur = 480; let raf;
    const krok = (ted) => {
      const t = Math.min(Math.max((ted - start) / dur, 0), 1);
      const e = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(z + (na - z) * e).toLocaleString('cs-CZ');
      if (t < 1) raf = requestAnimationFrame(krok);
    };
    raf = requestAnimationFrame(krok);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span ref={ref} className={className} style={style}>{value.toLocaleString('cs-CZ')}</span>;
}

// ── Ceník v2 (27. 9., návrh „Cenik-v2" od Yasina) ──
// 4 bílé karty (pro koho · název · popis · cena · tlačítko · funkce) + tmavý
// pruh Vlastní s posuvníkem. Vzhled a texty z návrhu, písmo a modrá naše;
// zůstává dopočítávání cen při přepnutí Měsíčně/Ročně (CenikCislo) a
// kalkulačka ceny Vlastního (stejný sazebník jako Samův web).
const _CENIK2_CSS = `
.e-c2{display:flex;flex-direction:column;gap:14px;padding:14px 24px 14px;color:#0B1033;}
.e-c2-hlava{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;}
.e-c2-h1{margin:0 0 4px;font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-.02em;}
.e-c2-sub{margin:0;font-size:15px;color:#5B6178;}
.e-c2-prep{display:flex;align-items:center;gap:4px;padding:4px;background:#fff;border:1px solid #E3E6EE;border-radius:999px;}
.e-c2-prep button{border:0;cursor:pointer;font:inherit;font-size:14px;font-weight:600;padding:8px 18px;border-radius:999px;background:transparent;color:#5B6178;display:flex;align-items:center;gap:8px;transition:background .18s,color .18s;}
.e-c2-prep button.on{background:#0B1033;color:#fff;}
.e-c2-prep .e-c2-sleva{font-size:11.5px;font-weight:700;padding:3px 8px;border-radius:999px;background:#DCFCE7;color:#15803D;}
.e-c2-karty{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding-top:10px;align-items:stretch;}
.e-c2-karta{position:relative;background:#fff;border:1px solid #E3E6EE;border-radius:18px;padding:18px 20px;display:flex;flex-direction:column;gap:12px;transition:border-color .28s ease,box-shadow .28s ease,transform .28s cubic-bezier(.2,.8,.2,1);}
/* Najetí: rámeček v barvě tarifu (jako kovový název) — plynule, zesílený
   vnitřní linkou (žádné poskočení obsahu) a jemná záře ve stejné barvě.
   Nejoblíbenější už nemá trvalý modrý rámeček — stačí štítek nad kartou. */
.e-c2-karta:hover{border-color:var(--tier);box-shadow:inset 0 0 0 1px var(--tier),0 14px 34px -14px var(--tier-a);transform:translateY(-2px);}
.e-c2-stitek-dop{position:absolute;top:-12px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;background:#0020F6;color:#fff;}
.e-c2-stitek-vas{position:absolute;top:-12px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;background:#EEF1FF;border:1px solid #D6DCFF;color:#0020F6;}
.e-c2-kdo{font-size:13px;font-weight:500;color:#8A90A6;}
.e-c2-nazev{font-size:19px;font-weight:700;}
.e-c2-popis{font-size:13px;line-height:1.4;color:#5B6178;text-wrap:pretty;min-height:36px;}
.e-c2-cena{display:flex;align-items:baseline;gap:6px;height:36px;}
.e-c2-num{font-size:34px;line-height:1;font-weight:800;letter-spacing:-.02em;white-space:nowrap;font-variant-numeric:tabular-nums;}
.e-c2-kc{font-size:17px;font-weight:700;color:#5B6178;}
.e-c2-obd{font-size:13.5px;color:#5B6178;}
.e-c2-uspora{font-size:12.5px;font-weight:600;height:17px;transition:color .2s;}
.e-c2-btn{cursor:pointer;font:inherit;font-size:14.5px;font-weight:700;height:40px;border-radius:11px;border:1px solid #CDD2DF;background:#fff;color:#0B1033;width:100%;transition:border-color .15s,background .15s;}
.e-c2-btn:hover{border-color:#0B1033;}
.e-c2-btn.prim{border:0;background:#0020F6;color:#fff;}
.e-c2-btn.prim:hover{background:#0019C4;}
.e-c2-btn:disabled{background:#F3F4F8;border:1px solid #EEF0F5;color:#8A90A6;cursor:default;}
.e-c2-funkce{border-top:1px solid #EEF0F5;padding-top:12px;display:flex;flex-direction:column;gap:7px;}
.e-c2-uvod{font-size:12.5px;font-weight:600;color:#5B6178;}
.e-c2-f{display:flex;gap:8px;font-size:13.5px;line-height:1.35;}
.e-c2-f.ne{color:#A0A5B8;}
.e-c2-f svg{flex:none;margin-top:1px;}
.e-c2-vl{background:#0B1033;border-radius:18px;padding:16px 26px;display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) auto;gap:36px;align-items:center;color:#fff;}
.e-c2-vl .e-c2-kdo,.e-c2-vl .e-c2-popis{color:#B7BCD0;}
.e-c2-vl .e-c2-popis{min-height:0;font-size:14px;}
.e-c2-vl input[type=range]{width:100%;margin:0;accent-color:#0020F6;cursor:pointer;}
.e-c2-vl-btn{cursor:pointer;font:inherit;font-size:14.5px;font-weight:700;height:40px;padding:0 20px;border-radius:11px;border:0;background:#fff;color:#0B1033;white-space:nowrap;display:inline-flex;align-items:center;text-decoration:none;}
.e-c2-vl-btn:hover{background:#E6E9F5;text-decoration:none;}
.e-c2-pata{display:flex;align-items:baseline;justify-content:center;gap:12px;text-align:center;}
.e-c2-pata button{background:none;border:0;cursor:pointer;font:inherit;font-size:14.5px;font-weight:700;color:#0020F6;padding:2px;}
.e-c2-pata button:hover{color:#0019C4;text-decoration:underline;}
.e-c2-pata p{margin:0;font-size:12.5px;color:#8A90A6;}
.e-c2-akt{display:inline-flex;align-items:center;justify-content:center;height:38px;padding:0 18px;border-radius:999px;background:#EEF1FF;border:1px solid #D6DCFF;color:#0020F6;font-size:14px;font-weight:700;white-space:nowrap;box-sizing:border-box;cursor:default;}
.e-c2-prep-mini button{font-size:13px;padding:7px 13px;}
.e-c2-prep-mini .e-c2-sleva{font-size:11px;padding:2px 7px;}
.e-obj-karta{background:#fff;border-radius:20px;box-shadow:0 24px 64px -16px rgba(11,16,51,.35);padding:24px 26px 20px;display:flex;flex-direction:column;gap:18px;color:#0B1033;}
.e-obj-box{background:#F6F7FA;border:1px solid #EEF0F5;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
.e-obj-kdy{font-size:13px;color:#5B6178;background:#F6F7FA;border-radius:10px;padding:10px 12px;}
.e-obj-pravni{font-size:12px;line-height:1.5;color:#8A90A6;text-align:center;margin-top:-6px;text-wrap:pretty;}
.e-obj-pravni a{color:#5B6178;text-decoration:underline;text-underline-offset:2px;}
.e-obj-pravni a:hover{color:#0020F6;}
.e-obj-ok{width:52px;height:52px;border-radius:50%;background:#16A34A;display:grid;place-items:center;box-shadow:0 10px 24px -8px rgba(22,163,74,.55);}
.e-c2-x{cursor:pointer;width:40px;height:40px;flex:none;border-radius:10px;border:1px solid #E3E6EE;background:#fff;display:flex;align-items:center;justify-content:center;transition:border-color .15s;}
.e-c2-x:hover{border-color:#0B1033;}
.e-c2-tl-prim{cursor:pointer;border:0;background:#0020F6;color:#fff;transition:background .15s;}
.e-c2-tl-prim:hover{background:#0019C4;}
.e-c2-tl-out{cursor:pointer;border:1px solid #CDD2DF;background:#fff;color:#0B1033;transition:border-color .15s;}
.e-c2-tl-out:hover{border-color:#0B1033;text-decoration:none;}
.e-c2-srow:hover{background:#FAFBFD;}
`;
// Barvy tarifů = hlavní barva kovového názvu (_MK_TIER.hex v employer-shell.jsx)
const _C2_BARVA = { zakladni: '#B7C1D6', vyhodny: '#2E33F0', dynamicky: '#229B54', maximalni: '#BE5518', vlastni: '#7A41C8' };
const _C2_ANO = <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9.5l3 3 7-7" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const _C2_NE  = <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M5 9h8" fill="none" stroke="#C3C7D4" strokeWidth="2" strokeLinecap="round" /></svg>;

// Pruh Vlastní: posuvník počtu inzerátů → cena ze sazebníku (dopočítá se).
function CenikVlastni({ plan, onPocet }) {
  const [i, setI] = useStateE(0);
  const n = _KALK_KROKY[i], c = _kalkCena(n);
  useEffectE(() => { onPocet && onPocet(n); }, [n]);
  return (
    <div className="e-c2-vl">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div className="e-c2-kdo">{plan.kdo}</div>
        <div className="e-c2-nazev" style={{ minHeight: 23 }}><TierMetalText tier="vlastni" size={19} weight={700} naSvetlem={false} /></div>
        <div className="e-c2-popis">{plan.popis}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#B7BCD0' }}>Aktivních inzerátů</span>
          <span style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{n.toLocaleString('cs-CZ')}</span>
        </div>
        <input type="range" min="0" max={_KALK_KROKY.length - 1} step="1" value={i} onChange={e => setI(+e.target.value)} aria-label="Počet aktivních inzerátů" />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8990AD' }}><span>20</span><span>5 000</span></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#B7BCD0' }}>od</span>
            <CenikCislo value={c} className="e-c2-num" style={{ fontSize: 30 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#B7BCD0' }}>Kč</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#B7BCD0', whiteSpace: 'nowrap' }}>za měsíc</div>
        </div>
        <a className="e-c2-vl-btn" href={'mailto:podpora@makej.eu?subject=' + encodeURIComponent('Poptávka tarifu Vlastní — ' + n.toLocaleString('cs-CZ') + ' inzerátů')}>Nezávazná poptávka</a>
      </div>
    </div>
  );
}

function EPricing({ onTab, onPlanChange }) {
  const [selected, setSelected] = useStateE(null);
  const [success, setSuccess]   = useStateE(false);
  const [annual, setAnnual]     = useStateE(true);      // návrh: výchozí Ročně
  const [showCompare, setShowCompare] = useStateE(false);
  const [kalkPocet, setKalkPocet] = useStateE(20);

  const currentPlanId = (() => {
    const planName = (ECOMPANY.plan || '').toLowerCase();
    // ECOMPANY.plan může nést i staré názvy tarifů (Standard, Business, Enterprise…)
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
    // směr změny si zapamatovat dřív, než se přepne aktuální tarif
    const PORADI = ['zakladni', 'vyhodny', 'dynamicky', 'maximalni', 'vlastni'];
    const vyssi = PORADI.indexOf(selected) > PORADI.indexOf(currentPlanId);
    if (plan) {
      ECOMPANY.plan = plan.name;
      if (onPlanChange) onPlanChange(plan.name);
    }
    setSuccess({ vyssi });
    setTimeout(() => { setSuccess(false); setSelected(null); }, 3000);
  }

  useEffectE(() => {
    if (!showCompare) return;
    const esc = e => { if (e.key === 'Escape') setShowCompare(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [showCompare]);
  const karty = PLANS.filter(p => !p.calc);
  const vlastni = PLANS.find(p => p.calc);

  return (
    // Stejný rám jako ostatní záložky (e-ram + hlavička ETabHlava).
    <div className="e-ram" style={{ padding: 20 }}>
    <div style={{ background: '#fff', border: '1px solid #DDE1F0', borderRadius: 22, overflow: 'hidden' }}>
    {/* Bez hlavičky „Tarify" (Yasin 27. 9.) — nadpis stránky je „Vyber si svůj plán" */}
    <style>{_CENIK_CSS}</style>
    <style>{_CENIK2_CSS}</style>
    <div className="e-c2">

      <div className="e-c2-hlava">
        <div>
          <h2 className="e-c2-h1">Vyber si svůj plán</h2>
        </div>
        <div className="e-c2-prep" role="group" aria-label="Fakturace">
          <button type="button" className={annual ? '' : 'on'} onClick={() => setAnnual(false)}>Měsíčně</button>
          <button type="button" className={annual ? 'on' : ''} onClick={() => setAnnual(true)}>Ušetřit s ročním<span className="e-c2-sleva">−15 %</span></button>
        </div>
      </div>

      <div className="e-c2-karty">
        {karty.map(plan => {
          const jeVas = plan.id === currentPlanId;
          const dop = !!plan.popular;
          return (
            <div key={plan.id} className="e-c2-karta" style={{ '--tier': _C2_BARVA[plan.id], '--tier-a': _C2_BARVA[plan.id] + '59' }}>
              {/* Štítky nad kartou na střed; když je nejoblíbenější zároveň tarif firmy, jen „Váš tarif" */}
              {dop && !jeVas && <div className="e-c2-stitek-dop">Nejoblíbenější</div>}
              {jeVas && <div className="e-c2-stitek-vas">Váš tarif</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div className="e-c2-kdo">{plan.kdo}</div>
                {/* Název tarifu jako tekutý kov v barvě tarifu (návrh 27. 9.) */}
                <div className="e-c2-nazev" style={{ minHeight: 23 }}><TierMetalText tier={plan.id} size={19} weight={700} /></div>
                <div className="e-c2-popis">{plan.popis}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div className="e-c2-cena">
                  {plan.free
                    ? <span className="e-c2-num">Zdarma</span>
                    : <><CenikCislo value={annual ? plan.annualPrice : plan.price} className="e-c2-num" /><span className="e-c2-kc">Kč</span></>}
                </div>
                <div className="e-c2-obd">{plan.period}</div>
                {/* Úspora jen při roční platbě; řádek drží místo, ať karta při přepnutí neposkočí */}
                <div className="e-c2-uspora" style={{ color: '#15803D' }}>
                  {plan.save && annual ? 'Ušetříte ' + plan.save.toLocaleString('cs-CZ') + ' Kč ročně' : ''}
                </div>
              </div>
              {jeVas
                // „Aktuální tarif" ve stylu štítku „Váš tarif" (světle modrá pilulka), ne šedé tlačítko
                ? <div style={{ display: 'flex', justifyContent: 'center' }}><span className="e-c2-akt">Aktuální tarif</span></div>
                // Kovové tlačítko přesně jako v návrhu (pilulka podle textu, na střed) —
                // roztažené přes celou šířku se kov natahoval a vypadal jako pozadí za tlačítkem.
                : <div style={{ display: 'flex', justifyContent: 'center' }}><TierMetalButton tier={plan.id} onClick={() => handleSelect(plan.id)}>{plan.cta}</TierMetalButton></div>}
              <div className="e-c2-funkce">
                <div className="e-c2-uvod">{plan.uvod}</div>
                {plan.feats.map(([text, ok]) => (
                  <div key={text} className={'e-c2-f' + (ok ? '' : ' ne')}>{ok ? _C2_ANO : _C2_NE}<span>{text}</span></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <CenikVlastni plan={vlastni} onPocet={setKalkPocet} />

      <div className="e-c2-pata">
        <button type="button" onClick={() => setShowCompare(true)}>Zobrazit srovnání funkcí</button>
        <p>Tarif můžete kdykoli změnit.</p>
      </div>

      {/* Volba tarifu → okno nad stránkou. Návrh 27. 9.: shrnutí objednávky —
          kovový název tarifu, přepínač měsíčně/ročně, cena a kolik se platí,
          co firma získá (nebo o co přijde při přechodu na nižší), kdy změna
          platí; dole Zrušit / Pokračovat k platbě. Po potvrzení stav „aktivní".
          POZOR: platba zatím není napojená (Stripe) — handlePay tarif jen přepne. */}
      {(selected || success) && ReactDOM.createPortal(
        <div onClick={() => { if (!success) setSelected(null); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(11,16,51,.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'eDotazIn .18s ease-out' }}>
        <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Změna tarifu" className="e-obj" style={{ width: 480, maxWidth: '100%' }}>
          {(() => {
            const PORADI = ['zakladni', 'vyhodny', 'dynamicky', 'maximalni', 'vlastni'];
            const p = PLANS.find(x => x.id === (selected || currentPlanId)) || PLANS[0];
            const ted = PLANS.find(x => x.id === currentPlanId) || PLANS[0];
            const vyssi = PORADI.indexOf(p.id) > PORADI.indexOf(ted.id);
            const mes = p.free ? 0 : (annual ? p.annualPrice : p.price);
            const f = n => n.toLocaleString('cs-CZ');
            const plus = p.feats.filter(([, ok]) => ok).map(([t]) => t);
            const minus = ted.feats.filter(([, ok]) => ok).map(([t]) => t);

            if (success) return (
              <div className="e-obj-karta" style={{ alignItems: 'center', textAlign: 'center', padding: '34px 30px 28px' }}>
                <div className="e-obj-ok"><svg width="26" height="26" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9.5l3 3 7-7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                <div style={{ fontSize: 14, color: '#5B6178', marginTop: 16 }}>Váš tarif je teď</div>
                <div style={{ marginTop: 4 }}><TierMetalText tier={p.id} size={28} weight={800} /></div>
                <div style={{ fontSize: 14, color: '#5B6178', marginTop: 10, lineHeight: 1.5 }}>{success.vyssi ? 'Nové možnosti můžete používat hned.' : 'Změna se projeví od dalšího fakturačního období.'}</div>
              </div>
            );

            return (
              <div className="e-obj-karta">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* „Tarif" + název jako kov (TierMetalText z makej-tier-effects, šedé „Tarif" chytá odlesk) */}
                    <TierMetalText tier={p.id} prefix="Tarif" size={26} weight={600} />
                  </div>
                  <button type="button" className="e-c2-x" onClick={() => setSelected(null)} aria-label="Zavřít" style={{ width: 36, height: 36 }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="#0B1033" strokeWidth="1.8" strokeLinecap="round" /></svg>
                  </button>
                </div>

                {!p.free && (
                  <div className="e-obj-box">
                    <div className="e-c2-prep e-c2-prep-mini" role="group" aria-label="Fakturace" style={{ alignSelf: 'flex-start' }}>
                      <button type="button" className={annual ? '' : 'on'} onClick={() => setAnnual(false)}>Měsíčně</button>
                      <button type="button" className={annual ? 'on' : ''} onClick={() => setAnnual(true)}>Ročně<span className="e-c2-sleva">−15 %</span></button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <CenikCislo value={mes} className="e-c2-num" style={{ fontSize: 34 }} />
                      <span className="e-c2-kc">Kč</span>
                      <span style={{ fontSize: 14, color: '#5B6178', marginLeft: 2 }}>za měsíc</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: '#5B6178', lineHeight: 1.5 }}>
                      {annual
                        ? <>Zaplatíte <b style={{ color: '#0B1033' }}>{f(mes * 12)} Kč</b> jednou za rok · <span style={{ color: '#15803D', fontWeight: 600 }}>ušetříte {f(p.save)} Kč</span></>
                        : <>Platí se každý měsíc, zrušit jde kdykoli.</>}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="e-c2-uvod">{vyssi ? 'Co získáte:' : 'O co přijdete:'}</span>
                  {(vyssi ? plus : minus).map(t => (
                    <div key={t} className={'e-c2-f' + (vyssi ? '' : ' ne')}>{vyssi ? _C2_ANO : _C2_NE}<span>{t}</span></div>
                  ))}
                </div>

                {/* U vyššího tarifu se nic nevysvětluje (platí hned, jak se čeká);
                    u nižšího ano — firma by čekala okamžitou změnu */}
                {!vyssi && <div className="e-obj-kdy">Změna platí od dalšího fakturačního období, do té doby vám zůstane {ted.name}.</div>}

                {/* Jen hlavní tlačítko přes celou šířku — zavřít jde křížkem nahoře */}
                <div style={{ display: 'flex' }}>
                  <button type="button" className="e-c2-tl-prim" onClick={handlePay} style={{ height: 46, padding: '0 22px', borderRadius: 12, font: 'inherit', fontSize: 15, fontWeight: 700, flex: 1 }}>
                    {p.free ? 'Přejít na Základní' : 'Pokračovat k platbě'}
                  </button>
                </div>
                {/* Právní dovětek — jeden text pro všechny tarify i měsíčně/ročně: souhlas
                    s obchodními podmínkami (čl. 6–7: platby, předplatné, automatické obnovení,
                    odstoupení — proto obnovení tu zvlášť nepíšeme) + zásady ochrany os. údajů */}
                <div className="e-obj-pravni">
                  Pokračováním souhlasíte s <a href="/terms" target="_blank" rel="noopener">obchodními podmínkami</a> a berete na vědomí <a href="/privacy" target="_blank" rel="noopener">zásady ochrany osobních údajů</a>.
                </div>
              </div>
            );
          })()}
        </div>
        </div>,
        document.body
      )}

      {/* Srovnání funkcí — okno podle návrhu Cenik-v2: nahoře přilepené sloupce
          tarifů (štítek, název, cena podle přepínače, tlačítko), zvýrazněný
          sloupec Dynamický, sekce bez šedého pruhu. Řádky = naše FEATURE_ROWS
          (Samův web), ne odhad z návrhu. Zavírá ✕, klik vedle, Esc. */}
      {showCompare && ReactDOM.createPortal(
        <div onClick={() => setShowCompare(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(11,16,51,.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'eDotazIn .18s ease-out' }}>
        <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Srovnání funkcí" style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 1200, maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px -16px rgba(11,16,51,.35)', color: '#0B1033' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '22px 30px', borderBottom: '1px solid #EEF0F5' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>Srovnání funkcí</div>
              <div style={{ fontSize: 14, color: '#5B6178' }}>{annual ? 'Ceny při ročním placení' : 'Ceny při měsíčním placení'}</div>
            </div>
            <button type="button" className="e-c2-x" onClick={() => setShowCompare(false)} aria-label="Zavřít">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="#0B1033" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div style={{ overflow: 'auto', padding: '0 30px 30px' }}>
            <div style={{ minWidth: 880 }}>
              {(() => {
                // Sloupec Dynamický dřív podbarvený (#F5F7FF) — Yasin 27. 9.: pryč.
                const bgOf = () => 'transparent';
                const radek = { display: 'grid', gridTemplateColumns: 'minmax(220px,1.6fr) repeat(5,minmax(120px,1fr))' };
                const cena = p => p.free ? 'Zdarma' : p.calc ? 'od ' + _kalkCena(20).toLocaleString('cs-CZ') + ' Kč / měs' : (annual ? p.annualPrice : p.price).toLocaleString('cs-CZ') + ' Kč / měs';
                const tlacitko = p => {
                  const zakl = { font: 'inherit', fontSize: 13, fontWeight: 700, height: 36, borderRadius: 10, padding: '0 14px', width: '100%', boxSizing: 'border-box' };
                  if (p.id === currentPlanId) return <span className="e-c2-akt" style={{ height: 36, fontSize: 13 }}>Aktuální tarif</span>;
                  if (p.contact) return <a className="e-c2-tl-out" href={'mailto:podpora@makej.eu?subject=' + encodeURIComponent('Poptávka tarifu Vlastní — ' + kalkPocet.toLocaleString('cs-CZ') + ' inzerátů')} style={{ ...zakl, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Poptávka</a>;
                  const vyber = () => { setShowCompare(false); handleSelect(p.id); };
                  if (p.popular) return <button type="button" className="e-c2-tl-prim" onClick={vyber} style={zakl}>Vybrat</button>;
                  return <button type="button" className="e-c2-tl-out" onClick={vyber} style={zakl}>{p.free ? 'Začít zdarma' : 'Vybrat'}</button>;
                };
                return (
                  <>
                    <div style={{ ...radek, position: 'sticky', top: 0, zIndex: 1, background: '#fff', borderBottom: '1px solid #E3E6EE' }}>
                      {/* Vlevo nahoře stejný přepínač jako na stránce — ceny ve sloupcích se přepnou hned */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 18 }}>
                        <div className="e-c2-prep e-c2-prep-mini" role="group" aria-label="Fakturace">
                          <button type="button" className={annual ? '' : 'on'} onClick={() => setAnnual(false)}>Měsíčně</button>
                          <button type="button" className={annual ? 'on' : ''} onClick={() => setAnnual(true)}>Ročně<span className="e-c2-sleva">−15 %</span></button>
                        </div>
                      </div>
                      {PLANS.map(p => {
                        const stitek = p.id === currentPlanId ? ['Váš tarif', '#EEF1FF', '#0020F6'] : p.popular ? ['Nejoblíbenější', '#0020F6', '#fff'] : null;
                        return (
                          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '18px 12px 14px', textAlign: 'center', background: bgOf(p.id), borderRadius: '12px 12px 0 0' }}>
                            <div style={{ height: 20, display: 'flex', justifyContent: 'center' }}>
                              {stitek && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: stitek[1], color: stitek[2] }}>{stitek[0]}</span>}
                            </div>
                            {/* Název tarifu jako tekutý kov v barvě tarifu (stejně jako v kartách) */}
                            <div style={{ minHeight: 20, display: 'flex', justifyContent: 'center' }}><TierMetalText tier={p.id} size={16} weight={700} /></div>
                            <div style={{ fontSize: 13, color: '#5B6178', marginBottom: 6 }}>{cena(p)}</div>
                            {tlacitko(p)}
                          </div>
                        );
                      })}
                    </div>
                    {FEATURE_ROWS.map((row, ri) => row.section ? (
                      <div key={ri} style={radek}>
                        <div style={{ padding: '26px 0 10px', fontSize: 13, fontWeight: 700, letterSpacing: '.02em', borderBottom: '1px solid #E3E6EE' }}>{row.section}</div>
                        {PLANS.map(p => <div key={p.id} style={{ background: bgOf(p.id), borderBottom: '1px solid #E3E6EE' }} />)}
                      </div>
                    ) : (
                      <div key={ri} className="e-c2-srow" style={{ ...radek, borderBottom: '1px solid #EEF0F5' }}>
                        <div style={{ padding: '13px 16px 13px 0', fontSize: 14.5, fontWeight: 500, lineHeight: 1.4, display: 'flex', alignItems: 'center' }}>{row.label}</div>
                        {PLANS.map(p => {
                          const v = row.cells[p.id];
                          return (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '13px 8px', background: bgOf(p.id), fontSize: 14, fontWeight: 600, textAlign: 'center' }}>
                              {v === true
                                ? <svg width="20" height="20" viewBox="0 0 18 18" aria-label="ano"><path d="M4 9.5l3 3 7-7" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                : v === false
                                  ? <svg width="14" height="14" viewBox="0 0 14 14" aria-label="ne"><path d="M3 7h8" stroke="#C3C7D4" strokeWidth="1.8" strokeLinecap="round" /></svg>
                                  : <span>{v}</span>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        </div>,
        document.body
      )}
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
    <div className="e-ram" style={{ padding: 20 }}>
      <div style={_erS(`background:${_erC.bg};border:1px solid ${_erC.shell};border-radius:22px;overflow:hidden`)}>

        <ETabHlava title="Plán směn">
          <ESegment value={vM ? 'month' : 'week'} options={[['month', 'Měsíc'], ['week', 'Týden']]}
            onChange={k => { if (k === 'month') setView('month'); else { setView('week'); setWeek(Math.floor((selected + firstWeekday - 1) / 7)); } }} />
          <EBtnHl onClick={onNew}>+ Nová směna</EBtnHl>
        </ETabHlava>

        <EMetriky items={[
          { l: 'Směny v srpnu', v: totalShifts, s: totalHours + ' hodin' },
          { l: 'Neobsazené', v: openCount, s: openOnly ? 'filtr zapnutý' : 'směny bez lidí', kam: openCount ? (openOnly ? 'Zrušit filtr' : 'Ukázat') : null, onClick: openCount ? () => setOpen(o => !o) : undefined, varovani: openCount > 0 },
          { l: 'Obsazenost', v: fillRate, s: 'obsazených směn' },
          { l: 'Brigádníci', v: peopleSet.size, s: 'v tomto měsíci' },
        ]} />

        {/* Pevná obrazovka (28. 9.): ovládání kalendáře a dny v týdnu stojí,
            posouvá se jen mřížka dnů; pravý sloupec zvlášť. */}
        <div style={_erS('padding:22px 24px 22px;display:grid;grid-template-columns:1fr 324px;grid-template-rows:minmax(360px,1fr);gap:20px')}>
          {/* Kalendář */}
          <div style={_erS('background:#fff;border:1px solid #E6E9F5;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;min-height:0')}>
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

            <div style={_erS('display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:max-content;flex:1;min-height:0;overflow-y:auto')}>
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
          <div style={_erS('display:grid;align-content:start;grid-auto-rows:max-content;gap:16px;min-height:0;overflow-y:auto')}>
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

// ── Mini profil kandidáta (Yasin 29. 9.: místo nudného seznamu) ──
// Profilovka, jméno a věk, hodnocení a odkud je, pár vět „o mně", na co reagoval.
// Klik na kartu = celý profil. Karty jsou v řádcích, které se posouvají do strany.
function _EcKarta({ p, onZprava, onNabidka, sirka }) {
  const st = _EC_STAGES[p.stage] || _EC_STAGES.new;
  const hodn = Number(p.rating) || 0;
  const inic = (p.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const profil = () => window.empOpenProfile && window.empOpenProfile(p.worker_id, { name: p.name, rating: p.rating, trust: p.trust, avatar_url: p.photo, bio: p.bio, address: [p.city, p.age ? p.age + ' let' : null].filter(Boolean).join(' · ') });
  const tl = { flex: 'none', fontSize: 12.5, fontWeight: 800, padding: '9px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
  return (
    <div className="e-jb-karta" role="button" tabIndex={0} onClick={profil} onKeyDown={e => { if (e.key === 'Enter') profil(); }}
      style={{ flex: '0 0 ' + (sirka || _EC_KARTA_MIN) + 'px', scrollSnapAlign: 'start', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
      {/* Profilovka — bez fotky modrý podklad s iniciálami jako u karty inzerátu */}
      <div style={{ position: 'relative', height: 172, flex: 'none', background: 'linear-gradient(135deg,#1B34F0,#5C71FF)' }}>
        {p.photo
          ? <img src={p.photo} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', display: 'block' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 84, fontWeight: 800, color: 'rgba(255,255,255,.18)', letterSpacing: -3 }}>{inic}</div>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,18,51,.30) 0%, rgba(11,18,51,0) 34%, rgba(11,18,51,0) 62%, rgba(11,18,51,.50) 100%)' }} />
        <span style={{ position: 'absolute', top: 11, left: 11, fontSize: 11.5, fontWeight: 800, padding: '5px 10px', borderRadius: 999, color: st.color, background: '#fff' }}>{st.label}</span>
        {p.trust && <span style={{ position: 'absolute', left: 11, bottom: 11 }}><ETrustBadge stats={p.trust} sm /></span>}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, padding: '13px 15px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
          <span className="e-kand-jmeno" style={{ fontSize: 16.5, fontWeight: 800, color: '#0B1233', letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{p.name}</span>
          {p.age && <span style={{ flex: 'none', fontSize: 14, fontWeight: 600, color: '#7A82A6' }}>{p.age}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#7A82A6', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {hodn > 0
            ? <span style={{ fontWeight: 800, color: '#0B1233' }}><span style={{ color: '#F5920B' }}>★</span> {hodn.toFixed(1).replace('.', ',')}</span>
            : <span>Zatím bez hodnocení</span>}
          {p.city && <><span style={{ color: '#C9CEDD' }}>·</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.city}</span></>}
        </div>
        <div style={{ fontSize: 13, color: p.bio ? '#3A4266' : '#A6ADCB', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 56 }}>{p.bio || 'Bez popisu v profilu.'}</div>
        <div style={{ fontSize: 12, color: '#7A82A6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Zájem o <b style={{ color: '#3A4266', fontWeight: 700 }}>{p.jobTitle || 'inzerát'}</b>{p.lastSeen ? ' · ' + p.lastSeen : ''}
        </div>
        {/* Užší karta (5 v řadě): „Napsat" a „Nabídnout směnu" se vedle sebe nevejdou → pod sebou na celou šířku */}
        <div style={{ display: 'flex', flexDirection: (sirka || _EC_KARTA_MIN) < 250 ? 'column' : 'row', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
          <button type="button" onClick={e => { e.stopPropagation(); onZprava(p); }} style={{ ...tl, color: '#fff', background: '#1B34F0', border: '1px solid #1B34F0' }}>Napsat</button>
          <button type="button" className="e-det-tl" onClick={e => { e.stopPropagation(); onNabidka(p); }} style={{ ...tl, flex: 1, color: '#1B34F0', background: '#fff', border: '1px solid #D5DAF0' }}>Nabídnout směnu</button>
        </div>
      </div>
    </div>
  );
}

// Filtry schované v ikonce vlevo nahoře (Yasin 29. 9.). Klik ikonku rozbalí lištu
// zleva doprava přes seznam — průsvitná, rozmazaná („glossy", bílá na 60 %), takže
// je pod ní vidět, co je za ní. Po výběru (nebo Enter v hledání, Esc, klik mimo)
// lišta zase plynule zajede zprava doleva zpátky do ikonky. Ikonka je trychtýř
// z appky (WIcoFilter ve www/worker-main.jsx); modrá = nějaký filtr je zapnutý.
// Animace přes clip-path (Web Animations); otevřená lišta clip-path nemá, jinak by
// ořízla rozbalenou roletku „Inzerát".
const _EC_IKONA = 44;
const _EC_OKRAJ = 44;   // obsah od levého/pravého kraje (dřív 20 px rám + 24 px karta)
const _EC_UCHYT = 24;   // vlevo nechat volno pro čárku (úchyt) levého menu — karty končí až za ní
const _EC_PRESAH = _EC_OKRAJ - _EC_UCHYT;   // o kolik pás karet přečnívá obsah na obou stranách (20)
const _EC_MEZERA = 24;  // mezera mezi kartami — větší než přesah, takže vedlejší karta u kraje nevykoukne
const _EC_KARTA_MIN = 190;   // nejužší karta — při rozbaleném menu na 1470px displeji vyjde 5 karet
const _EC_MENU_SIROKE = 256;  // šířka rozbaleného levého menu (SIROKE v employer-shell.jsx)
function _EcFiltr({ otevreno, onPrepni, onZavri, aktivnich, children }) {
  const ref = React.useRef(null), obsah = React.useRef(null);
  const [faze, setFaze] = React.useState(otevreno ? 'open' : 'closed');   // open | closing | closed
  const ZAV = 'inset(0 calc(100% - ' + _EC_IKONA + 'px) 0 0 round 14px)', OTV = 'inset(0 0 0 0 round 14px)';
  const zacatek = React.useRef(true);
  React.useEffect(() => {
    if (zacatek.current) { zacatek.current = false; return; }
    const el = ref.current; if (!el) return;
    const bezAnimace = !el.animate || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (otevreno) {
      setFaze('open');
      if (!bezAnimace) el.animate([{ clipPath: ZAV }, { clipPath: OTV }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
    } else if (bezAnimace) setFaze('closed');
    else {
      setFaze('closing');
      const a = el.animate([{ clipPath: OTV }, { clipPath: ZAV }], { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      a.onfinish = () => { setFaze('closed'); a.cancel(); };
    }
  }, [otevreno]);
  // Zavřená lišta: ovládací prvky pod clip-path nejdou vybrat ani Tabem
  React.useEffect(() => { if (obsah.current) obsah.current.inert = faze === 'closed'; }, [faze]);
  React.useEffect(() => {
    if (!otevreno) return;
    const venku = e => { if (ref.current && !ref.current.contains(e.target)) onZavri(); };
    document.addEventListener('mousedown', venku, true);
    return () => document.removeEventListener('mousedown', venku, true);
  }, [otevreno]);
  const videt = faze !== 'closed';
  return (
    <div ref={ref} onKeyDown={e => { if (e.key === 'Escape' || (e.key === 'Enter' && e.target.tagName === 'INPUT')) onZavri(); }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6, pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12, height: _EC_IKONA, paddingRight: 4, boxSizing: 'border-box', borderRadius: 14,
        background: videt ? 'rgba(255,255,255,.6)' : 'transparent',
        backdropFilter: videt ? 'blur(18px) saturate(1.6)' : 'none', WebkitBackdropFilter: videt ? 'blur(18px) saturate(1.6)' : 'none',
        boxShadow: videt ? 'inset 0 0 0 1px rgba(214,219,240,.8), 0 18px 40px -22px rgba(11,18,51,.45)' : 'none',
        clipPath: faze === 'closed' ? ZAV : 'none' }}>
      <button type="button" onClick={onPrepni} title={otevreno ? 'Schovat filtry' : 'Filtry'} aria-label={otevreno ? 'Schovat filtry' : 'Filtry'} aria-expanded={otevreno}
        style={{ position: 'relative', width: _EC_IKONA, height: _EC_IKONA, flex: 'none', borderRadius: 14, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0,
          background: aktivnich ? '#1B34F0' : '#fff', border: '1px solid ' + (aktivnich ? '#1B34F0' : '#E6E9F5'), boxShadow: '0 4px 14px -8px rgba(11,18,51,.35)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><g transform="translate(2,2)" fill={aktivnich ? '#fff' : '#0B1233'} fillRule="evenodd"><path d="M6.7734,9.5987 C6.7914,9.6147 6.8084,9.6297 6.8254,9.6477 C7.9044,10.7537 8.4994,12.2187 8.4994,13.7737 L8.4994,17.7577 L10.7354,16.5397 C10.9114,16.4437 11.0204,16.2557 11.0204,16.0487 L11.0204,13.7617 C11.0204,12.2127 11.6094,10.7527 12.6784,9.6527 L17.5154,4.5077 C17.8284,4.1747 18.0004,3.7377 18.0004,3.2767 L18.0004,2.3407 C18.0004,1.8767 17.6344,1.4997 17.1864,1.4997 L2.3154,1.4997 C1.8664,1.4997 1.5004,1.8767 1.5004,2.3407 L1.5004,3.2767 C1.5004,3.7377 1.6724,4.1747 1.9854,4.5067 L6.7734,9.5987 Z M8.1464,19.5007 C7.9444,19.5007 7.7444,19.4467 7.5624,19.3387 C7.2104,19.1287 6.9994,18.7577 6.9994,18.3457 L6.9994,13.7737 C6.9994,12.6387 6.5764,11.5697 5.8054,10.7507 C5.7824,10.7317 5.7594,10.7107 5.7394,10.6887 L0.8934,5.5357 C0.3174,4.9237 0.0004,4.1207 0.0004,3.2767 L0.0004,2.3407 C0.0004,1.0497 1.0394,-0.0003 2.3154,-0.0003 L17.1864,-0.0003 C18.4614,-0.0003 19.5004,1.0497 19.5004,2.3407 L19.5004,3.2767 C19.5004,4.1197 19.1834,4.9217 18.6094,5.5347 L13.7624,10.6887 C12.9594,11.5167 12.5204,12.6057 12.5204,13.7617 L12.5204,16.0487 C12.5204,16.8047 12.1114,17.4967 11.4534,17.8567 L8.6924,19.3607 C8.5204,19.4537 8.3334,19.5007 8.1464,19.5007 L8.1464,19.5007 Z" /></g></svg>
        {aktivnich > 0 && <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 15, height: 15, padding: '0 4px', boxSizing: 'border-box', borderRadius: 999, background: '#fff', color: '#1B34F0', fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center', lineHeight: 1 }}>{aktivnich}</span>}
      </button>
      <div ref={obsah} style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

// Jeden řádek kandidátů — nadpis a karty, které se posouvají do strany (trackpadem
// nebo Shift + kolečkem; šipky ‹ › v nadpisu pryč — Yasin 29. 9.: zbytečné).
// Celá stránka se posouvá dolů.
// Jako u Airbnb (Yasin 29. 9.): do šířky obsahu se vejde přesně N celých karet
// (šířka karty se dopočítá) a posun se vždycky dorovná na začátek karty — nikde
// nezůstane půlka nebo třetina karty. N se počítá z šířky, jakou by pás měl při
// rozbaleném menu — sbalení menu tak počet nezmění, karty se jen rozšíří
// (Yasin 29. 9.: „5 a to zůstane, i když rozbalím boční"). Pás přečnívá obsah o _EC_PRESAH na každé
// straně (vlevo až k čárce menu), mezera mezi kartami je větší, takže v klidu je
// přečnívající okraj prázdný a karty jím jen projíždějí.
// Posuvný pás má dole 40 px volného místa (a stejně velký záporný okraj): posuvník
// do strany ořízne všechno, co z něj přečnívá, a stín karty při najetí se pak
// useknul o bílou hranu (Yasin 29. 9.: „ta bílá bariéra dole").
function _EcRadek({ nazev, pozn, lide, onZprava, onNabidka, vedleIkony }) {
  const pasRef = React.useRef(null);
  const [sirka, setSirka] = React.useState(_EC_KARTA_MIN);
  React.useLayoutEffect(() => {
    const el = pasRef.current; if (!el) return;
    const spocti = () => {
      const w = el.clientWidth - 2 * _EC_PRESAH;
      if (w <= 0) return;
      // Pás + menu mají dohromady pořád stejnou šířku (i během animace sbalování)
      const menu = document.querySelector('.e-uchyt');
      const wRozbal = menu ? w + menu.parentElement.getBoundingClientRect().width - _EC_MENU_SIROKE : w;
      const n = Math.max(1, Math.floor((wRozbal + _EC_MEZERA) / (_EC_KARTA_MIN + _EC_MEZERA)));
      setSirka(Math.floor(((w - (n - 1) * _EC_MEZERA) / n) * 100) / 100);
    };
    spocti();
    if (!window.ResizeObserver) return;
    const ro = new ResizeObserver(spocti); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, ...(vedleIkony ? { paddingLeft: _EC_IKONA + 14, minHeight: _EC_IKONA } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, minWidth: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#0B1233', letterSpacing: '-.01em', whiteSpace: 'nowrap' }}>{nazev}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#A6ADCB' }}>{lide.length}</span>
          {pozn && <span style={{ fontSize: 12.5, color: '#7A82A6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pozn}</span>}
        </div>
      </div>
      <div ref={pasRef} className="e-kand-radek" style={{ display: 'flex', gap: _EC_MEZERA, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingLeft: _EC_PRESAH, scrollPaddingRight: _EC_PRESAH, scrollbarWidth: 'none',
        padding: '8px ' + _EC_PRESAH + 'px 40px', margin: '-8px -' + _EC_PRESAH + 'px -40px' }}>
        {lide.map(p => <_EcKarta key={p.id} p={p} sirka={sirka} onZprava={onZprava} onNabidka={onNabidka} />)}
      </div>
    </section>
  );
}

function ECandidates({ onOpenChat, onNew, period, onPeriod } = {}) {
  const [tab, setTab]         = React.useState('all');
  const [query, setQuery]     = React.useState('');
  const [nabidka, setNabidka] = React.useState(null);   // kandidát, kterému se vybírá inzerát
  const [filtrOtevren, setFiltrOtevren] = React.useState(false);
  const zavriFiltr = () => setFiltrOtevren(false);
  const seznamRef = React.useRef(null);
  // Filtr „jen kandidáti jednoho inzerátu" podle job_id (dřív podle názvu —
  // dva inzeráty se stejným názvem se slily). Přichází i z karty inzerátu
  // (tlačítko Kandidáti) přes window.__empCandJob; drží se tam, aby ho
  // nezrušil realtime refresh, a main ho smaže při odchodu ze záložky.
  const [listing, setListingS] = React.useState(() => window.__empCandJob || 'all');
  const setListing = k => { window.__empCandJob = k === 'all' ? null : k; setListingS(k); };

  const C = (typeof E_CANDIDATES !== 'undefined' ? E_CANDIDATES : {});
  const flatVse = []
    .concat((C.new || []).map(c => ({ ...c, stage: 'new' })))
    .concat((C.shortlist || []).map(c => ({ ...c, stage: 'talking' })))
    .concat((C.interview || []).map(c => ({ ...c, stage: 'known' })))
    .concat((C.hired || []).map(c => ({ ...c, stage: 'hired' })))
    // Ukázkoví kandidáti (employer-demo.jsx) — zprávu ani nabídku jim poslat nejde
    .concat(typeof eDemoKandidati === 'function' ? eDemoKandidati() : []);
  const flat = listing === 'all' ? flatVse : flatVse.filter(p => p.job_id === listing);

  const counts = {
    all: flat.length,
    new: flat.filter(p => p.stage === 'new').length,
    talking: flat.filter(p => p.stage === 'talking').length,
    known: flat.filter(p => p.stage === 'known').length,
    hired: flat.filter(p => p.stage === 'hired').length,
    rated: flat.filter(p => Number(p.rating) > 0).length,
  };
  const q = query.trim().toLowerCase();
  let list = flat.filter(p => {
    if (tab === 'new' && p.stage !== 'new') return false;
    if (tab === 'talking' && p.stage !== 'talking') return false;
    if (tab === 'known' && p.stage !== 'known') return false;
    if (tab === 'hired' && p.stage !== 'hired') return false;
    if (tab === 'rated' && !(Number(p.rating) > 0)) return false;
    if (q && !((p.name + ' ' + (p.jobTitle || '')).toLowerCase().includes(q))) return false;
    return true;
  });
  // Řádky (Yasin 29. 9.): nahoře nejlépe hodnocení, pod tím kdo čeká na odpověď, pak
  // kdo už u firmy pracoval. Prázdný řádek se nekreslí. Jeden člověk může být ve víc řádcích.
  const kdy = p => new Date(p.createdAt || 0).getTime();
  const radky = [
    { k: 'top', nazev: 'Nejlépe hodnocení', pozn: 'hodnocení od firem z předchozích brigád', lide: list.filter(p => Number(p.rating) > 0).sort((a, b) => (Number(b.rating) - Number(a.rating)) || ((b.trust ? b.trust.dokoncene : 0) - (a.trust ? a.trust.dokoncene : 0))) },
    { k: 'ceka', nazev: 'Čekají na vaši odpověď', pozn: 'nejnovější zájemci první', lide: list.filter(p => p.stage === 'new').sort((a, b) => kdy(b) - kdy(a)) },
    { k: 'najati', nazev: 'Už pro vás pracovali', pozn: 'můžete je oslovit znovu', lide: list.filter(p => p.stage === 'hired').sort((a, b) => kdy(b) - kdy(a)) },
  ].filter(r => r.lide.length);
  if (!radky.length && list.length) radky.push({ k: 'vse', nazev: 'Kandidáti', pozn: '', lide: list });
  // Po změně filtru seznam nahoru (lišta teď není nad seznamem, ale přes něj)
  React.useEffect(() => { const el = seznamRef.current; if (el && el.scrollTop > 0) el.scrollTo({ top: 0, behavior: 'smooth' }); }, [tab, listing, query]);
  const aktivnichFiltru = (tab !== 'all' ? 1 : 0) + (listing !== 'all' ? 1 : 0) + (query.trim() ? 1 : 0);
  const demoToast = () => window.empToast && window.empToast('Ukázkový kandidát', 'Zprávy a nabídky směn fungují u skutečných zájemců — tohle je jen ukázka.', 'ℹ️', 'info');
  const napsat = p => p._demo ? demoToast() : (onOpenChat && onOpenChat(p.match_id));
  const nabidnout = p => p._demo ? demoToast() : setNabidka(p);


  // Inzeráty, na které někdo reagoval — klíč je id inzerátu; u shodných názvů
  // se připíše datum zveřejnění, ať jdou rozlišit.
  const _jobyK = (typeof E_JOBS !== 'undefined' ? E_JOBS : []).concat(typeof eDemoInzeraty === 'function' ? eDemoInzeraty() : []).filter(j => flatVse.some(p => p.job_id === j.id));
  const _dvojNazvy = _jobyK.filter((j, i, a) => a.findIndex(x => x.title === j.title) !== i).map(j => j.title);
  const _nazevJobu = j => j.title + (_dvojNazvy.includes(j.title) && j.created_at ? ' (' + new Date(j.created_at).getDate() + '. ' + (new Date(j.created_at).getMonth() + 1) + '.)' : '');
  const byListing = [{ label: 'Všechny inzeráty', key: 'all', count: flatVse.length }].concat(_jobyK.map(j => ({ label: _nazevJobu(j), key: j.id, count: flatVse.filter(p => p.job_id === j.id).length })));
  // Přišli jsme z karty inzerátu, na který ještě nikdo nereagoval → ať je ve výběru taky
  if (listing !== 'all' && !byListing.some(b => b.key === listing)) {
    const j = (typeof E_JOBS !== 'undefined' ? E_JOBS : []).find(x => x.id === listing);
    if (j) byListing.push({ label: j.title, key: j.id, count: 0 });
  }

  // Jen fáze, které data opravdu rozlišují: zájem (pending) a najatí (accepted).
  // „Komunikujeme" a „Už se známe" byly vždy 0 — loader je nikdy neplní.
  const tabs = [['all', 'Vše'], ['new', 'Nové shody'], ['hired', 'Najatí'], ['rated', 'S hodnocením']];
  const tabCount = { all: counts.all, new: counts.new, hired: counts.hired, rated: counts.rated };

  return (
    <div className="e-ram e-ram-dolu" style={{ padding: 20 }}>
      <div style={_erS(`background:${_erC.bg};border:1px solid ${_erC.shell};border-radius:22px;overflow:hidden`)}>

        {/* Bez hlavičky a pásu čísel (Yasin 29. 9.): „na co tady budu filtrovat dny nebo
            měsíce nebo zadávat nový inzerát" — nahoře jen lišta filtrů, zbytek patří lidem.
            Čekající kandidáty ukazuje odznak u Kandidátů v levém menu. */}
        {/* Tělo: seznam až dolů, filtry v ikonce vlevo nahoře (přes seznam) */}
        <div style={_erS('padding:20px 0 0;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(360px,1fr)')}>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: _EC_OKRAJ, right: _EC_OKRAJ, height: _EC_IKONA, zIndex: 6, pointerEvents: 'none' }}>
            <_EcFiltr otevreno={filtrOtevren} onPrepni={() => setFiltrOtevren(o => !o)} onZavri={zavriFiltr} aktivnich={aktivnichFiltru}>
              {/* Filtrační lišta — společná komponenta (employer-shell.jsx). Výběr lištu zase schová. */}
              <EFiltrLista vzdyKompakt>
                <EFiltrPrepinac value={tab} onChange={k => { setTab(k); setTimeout(zavriFiltr, 180); }} options={tabs.map(([k, l]) => ({ k, l, n: tabCount[k] }))} />
                <EFiltrVpravo>
                  <EFiltrVyber popisek="Inzerát:" value={listing} onChange={k => { setListing(k); setTimeout(zavriFiltr, 180); }}
                    options={byListing.map(b => ({ k: b.key, l: b.key === 'all' ? 'Všechny' : b.label, n: b.count }))} />
                  <EFiltrHledat value={query} onChange={setQuery} placeholder="Hledat kandidáta nebo pozici" width={240} />
                </EFiltrVpravo>
              </EFiltrLista>
            </_EcFiltr>
            </div>

            {/* Řádky mini profilů — každý se posouvá do strany, celé se posouvá dolů,
                až ke spodnímu okraji okna (bez bílého pruhu a bez zeslabení — Yasin 29. 9.). */}
            <div ref={seznamRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'none', display: 'flex', flexDirection: 'column', gap: 26, padding: '0 ' + _EC_OKRAJ + 'px 28px' }}>
            {radky.map((r, i) => <_EcRadek key={r.k} nazev={r.nazev} pozn={r.pozn} lide={r.lide} onZprava={napsat} onNabidka={nabidnout} vedleIkony={i === 0} />)}

            {list.length === 0 && (
              <div style={_erS(`background:#fff;border:1px solid ${_erC.line};border-radius:16px;padding:56px 22px;display:flex;flex-direction:column;align-items:center;gap:10px`)}>
                <span style={_erS('font-size:16px;font-weight:800;color:#0B1233')}>Žádný kandidát neodpovídá filtru</span>
                <span style={_erS('font-size:14px;color:#7A82A6')}>Zkuste jiný filtr nebo delší období.</span>
                <button onClick={() => { setTab('all'); setQuery(''); setListing('all'); }} style={_erS('font-size:13px;font-weight:800;color:#1B34F0;background:none;border:1px solid #D5DAF0;padding:9px 15px;border-radius:9px;cursor:pointer;margin-top:6px')}>Zrušit filtry</button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      {nabidka && <ENabidkaInzeratu kandidat={nabidka} vsichni={flatVse} onClose={() => setNabidka(null)} onNew={onNew} onOpenChat={onOpenChat} />}
    </div>
  );
}

// ── Nabídnout směnu: výběr aktivního inzerátu → karta do zpráv kandidáta ──
// Firma nemusí nic vyplňovat ani kandidáta hledat ve feedu: vybere hotový
// aktivní inzerát, ten mu přijde do chatu jako karta a v appce na ni může
// rovnou dát „Mám zájem". Inzeráty, o které už zájem má, jsou vidět, ale
// vybrat nejdou.
const _eDatumKratce = d => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? (+m[3]) + '. ' + (+m[2]) + '.' : (d || ''); };
function ENabidkaInzeratu({ kandidat, vsichni, onClose, onNew, onOpenChat }) {
  const [vybrany, setVybrany] = React.useState(null);
  const [posilam, setPosilam] = React.useState(false);
  const [hotovo, setHotovo] = React.useState(null);
  const aktivni = (typeof E_JOBS !== 'undefined' ? E_JOBS : []).filter(j => j.status === 'active' || j.status === 'urgent');
  const maZajem = id => (vsichni || []).some(c => c.worker_id === kandidat.worker_id && c.job_id === id);
  const krestni = (kandidat.name || 'Kandidát').split(' ')[0];
  React.useEffect(() => {
    const esc = e => { if (e.key === 'Escape' && !posilam) onClose(); };
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc);
  }, [posilam]);
  const posli = async () => {
    const job = aktivni.find(j => j.id === vybrany); if (!job) return;
    setPosilam(true);
    const ok = typeof sendJobOfferE === 'function' ? await sendJobOfferE(kandidat.match_id, job) : null;
    setPosilam(false);
    if (ok) setHotovo(job);
    else window.empToast && window.empToast('Nepodařilo se odeslat', 'Zkuste to prosím znovu.', '⚠️', 'error');
  };
  return ReactDOM.createPortal(
    <div onClick={() => !posilam && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(11,18,51,.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{ width: 480, maxWidth: '100%', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 18, boxShadow: '0 30px 80px -20px rgba(11,18,51,.45)', padding: '26px 26px 22px' }}>
        {hotovo ? (
          <>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: '#E6F7EF', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0FA968" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', marginBottom: 8 }}>Odesláno</div>
            <div style={{ fontSize: 14, color: '#3A4266', lineHeight: 1.55, marginBottom: 22 }}>{krestni} má ve zprávách kartu <b>{hotovo.title}</b>. Jakmile na ni dá „Mám zájem", uvidíte ho mezi kandidáty tohoto inzerátu.</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <EBtnSek onClick={onClose}>Zavřít</EBtnSek>
              <EBtnHl onClick={() => { onClose(); onOpenChat && onOpenChat(kandidat.match_id); }}>Otevřít zprávy</EBtnHl>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', marginBottom: 6 }}>Nabídnout směnu</div>
            <div style={{ fontSize: 14, color: '#3A4266', lineHeight: 1.55, marginBottom: 16 }}>Vyberte inzerát. {krestni} ho dostane do zpráv jako kartu a může na něj rovnou dát „Mám zájem".</div>
            {aktivni.length === 0 ? (
              <div style={{ padding: '22px 16px', borderRadius: 12, background: '#F6F7FC', textAlign: 'center', fontSize: 14, color: '#3A4266', marginBottom: 20 }}>Nemáte žádný aktivní inzerát.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 0, marginBottom: 20 }}>
                {aktivni.map(j => {
                  const uz = maZajem(j.id), on = vybrany === j.id;
                  return (
                    <button key={j.id} type="button" disabled={uz} onClick={() => setVybrany(j.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12, cursor: uz ? 'default' : 'pointer', background: on ? '#EEF1FF' : '#fff', border: '1.5px solid ' + (on ? '#1B34F0' : '#E6E9F5'), opacity: uz ? .55 : 1, fontFamily: 'inherit' }}>
                      <span style={{ width: 18, height: 18, flex: 'none', borderRadius: 999, border: '2px solid ' + (on ? '#1B34F0' : '#C9CEDD'), display: 'grid', placeItems: 'center' }}>{on && <span style={{ width: 8, height: 8, borderRadius: 999, background: '#1B34F0' }} />}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: '#0B1233', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</span>
                        <span style={{ display: 'block', fontSize: 12.5, color: '#7A82A6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[j.pay ? j.pay + ' ' + (j.payUnit || 'Kč/h') : null, j.location, _eDatumKratce(j.date)].filter(Boolean).join(' · ')}</span>
                      </span>
                      {uz && <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0B7B4B', background: '#E6F7EF', padding: '4px 8px', borderRadius: 6, flex: 'none' }}>Už má zájem</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <EBtnSek onClick={onClose} disabled={posilam}>Zrušit</EBtnSek>
              {aktivni.length === 0
                ? <EBtnHl onClick={() => { onClose(); onNew && onNew(); }}>+ Nový inzerát</EBtnHl>
                : <EBtnHl onClick={posli} disabled={!vybrany || posilam}>{posilam ? 'Posílám…' : 'Poslat nabídku'}</EBtnHl>}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
Object.assign(window, { ECandidates, ENabidkaInzeratu });


/* ============================================================
   INZERÁTY (EJobs) — redesign 1d: modrá hlavička + jednotná
   roletka období + pás metrik (tečky tarifu) + karty s
   čtyřkrokovým pásem fáze náboru. Zachovává akce:
   Kandidáti → onTab('candidates'), Statistiky → JobStatsDrawer,
   Topovat, Upravit, Vypnout/Zapnout, + Nový inzerát → onNew.
   ============================================================ */
const _JB_STATES = {
  active:   { label: 'Aktivní',   color: '#0B7B4B', bg: '#E6F7EF', dot: '#0FA968' },
  // „asap" = aktivní inzerát se směnou do 2 dnů (status 'urgent' z employer-supabase.jsx).
  // Firmě se ukazuje jako „Urgentní" (Yasin 29. 9.: místo „ASAP"), výrazně fialově —
  // červená by vypadala jako chyba a zlatá patří topování.
  asap:     { label: 'Urgentní',  color: '#6A1FD1', bg: '#F1E8FF', dot: '#8B3DFF' },
  inactive: { label: 'Neaktivní', color: '#7A82A6', bg: '#F1F3FB', dot: '#DDE1F0' },
  filled:   { label: 'Naplněno',  color: '#1B34F0', bg: '#EEF1FF', dot: '#1B34F0' },
};
// Průběh náboru v detailu inzerátu (28. 9. přepsáno — „Nabírá 3" nikomu nic neřeklo):
// Zveřejněno → Má zájem (kolik lidí dalo v appce „Mám zájem") → Přijato (kolik z nich
// firma přijala, ideálně „3 z 5 míst") → Obsazeno. (Bublina „X zájemců čeká na
// odpověď" vedle nadpisu pryč — Yasin 28. 9.; počet čekajících je u tlačítka Kandidáti.)
const _JB_KROKY = ['Zveřejněno', 'Má zájem', 'Přijato', 'Obsazeno'];
const _jbLidi = n => n + ' ' + (n === 1 ? 'člověk' : n >= 2 && n <= 4 ? 'lidé' : 'lidí');
const _jbMist = n => n + ' ' + (n === 1 ? 'místa' : 'míst');                 // „3 z 5 míst", „1 z 1 místa"
const _jbMista = n => n + ' ' + (n === 1 ? 'místo' : n >= 2 && n <= 4 ? 'místa' : 'míst');   // „zbývá 2 místa"
function _jbNabor(l) {
  const zajem = l.matches || 0, prijato = l.hired || 0, mist = l.positions > 0 ? l.positions : 0;
  const obsazeno = l._state === 'filled' || (mist > 0 && prijato >= mist);
  const krok = obsazeno ? 3 : prijato > 0 ? 2 : zajem > 0 ? 1 : 0;
  const pod = [
    _jbShort(l.created_at),
    zajem ? _jbLidi(zajem) : 'zatím nikdo',
    mist ? prijato + ' z ' + _jbMist(mist) : prijato ? _jbLidi(prijato) : 'zatím nikdo',
    obsazeno ? 'hotovo' : mist && prijato ? 'zbývá ' + _jbMista(mist - prijato) : '—',
  ];
  // Pruh „Přijato" se plní podle obsazených míst (když je počet známý)
  const plneni = [1, zajem > 0 ? 1 : 0, obsazeno ? 1 : mist ? Math.min(1, prijato / mist) : (prijato > 0 ? 1 : 0), obsazeno ? 1 : 0];
  return { krok, pod, plneni, obsazeno };
}
// Řazení seznamu inzerátů — roletka „Řadit" (28. 9.; dřív tlačítko, které
// při každém kliknutí přeskočilo na další řazení, nešlo poznat, co přijde).
const _JB_SORTS = { new: 'Nejnovější', views: 'Nejvíc zobrazení', interest: 'Nejvíc zájemců', rate: 'Nejvyšší sazba' };
const _jbStatusMap = s => s === 'urgent' ? 'asap' : s === 'paused' ? 'inactive' : s === 'filled' ? 'filled' : 'active';
const _jbPlural = (n, one, few, many) => n + ' ' + (n === 1 ? one : (n >= 2 && n <= 4) ? few : many);
const _jbAge = v => { const d = new Date(v); return isNaN(d) ? 1 : Math.max(1, Math.round((Date.now() - d.getTime()) / 86400000)); };
const _jbShort = v => { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }); };
// „pá 2. 10. v 14:30" — do kdy je inzerát topovaný
const _jbKdyDo = iso => { const d = new Date(iso); return isNaN(d) ? '' : ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'][d.getDay()] + ' ' + d.getDate() + '. ' + (d.getMonth() + 1) + '. v ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };
const _jbTopZbyva = iso => { const h = Math.ceil((new Date(iso) - Date.now()) / 3600000); return h <= 0 ? '' : h < 24 ? 'ještě ' + h + ' h' : 'ještě ' + Math.floor(h / 24) + ' d' + (h % 24 ? ' ' + (h % 24) + ' h' : ''); };
const _jbEnd = days => new Date(Date.now() + (days || 0) * 86400000).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });

// ── Karta inzerátu ve stejné podobě jako swipovací karta v appce (28. 9.) ──
// Předloha: WJobCard ve www/worker-swipe.jsx (fotka nahoře, logo + název firmy,
// titulek, místo, odměna v modrém rámečku, fakta, štítky). Firma tak vidí, jak
// inzerát uvidí brigádníci. Pod kartou navíc čísla pro firmu.
// Všechno se počítá STEJNĚ jako v appce (jobToCard ve www/worker-supabase.jsx,
// makej-badge.jsx) — když se tam něco změní, upravit i tady.
const _JB_DNY = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const _jbDatumKarta = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); if (!m) return v || ''; const d = new Date(+m[1], +m[2] - 1, +m[3]); return _JB_DNY[d.getDay()] + ' ' + d.getDate() + '. ' + (d.getMonth() + 1) + '.'; };
const _jbPred = v => { const n = Math.floor((Date.now() - new Date(v).getTime()) / 86400000); return isNaN(n) ? '' : n <= 0 ? 'dnes' : n === 1 ? 'včera' : 'před ' + n + ' dny'; };
const _jbHodin = t => { const m = /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/.exec(t || ''); if (!m) return 0; let h = (+m[3] * 60 + +m[4] - (+m[1] * 60 + +m[2])) / 60; if (h <= 0) h += 24; return Math.round(h * 10) / 10; };
const _jbHodinTxt = h => String(h).replace('.', ',') + ' ' + (h === 1 ? 'hodina' : h >= 2 && h <= 4 ? 'hodiny' : 'hodin');
// Smlouva (jobs.contract) → kód jako normalizeContractTypes v appce
const _jbSmlouvaKod = c => { const x = String(c || '').toUpperCase().trim(); return x === 'DPP' ? 'DPP' : (x === 'DPC' || x === 'DPČ') ? 'DPC' : (x === 'HPP' || x === 'PRACOVNÍ SMLOUVA') ? 'HPP' : (x === 'IČO' || x === 'ICO' || x === 'OSVČ' || x === 'OSVC') ? 'ICO' : ''; };
const _JB_SMLOUVA_TXT = { DPP: 'DPP', DPC: 'DPČ', HPP: 'Pracovní smlouva', ICO: 'IČO' };
const _jbSmlouvaTxt = c => _JB_SMLOUVA_TXT[_jbSmlouvaKod(c)] || c || '';
// Štítek na fotce = úvazek odvozený ze smlouvy a hodin týdně (deriveBadge v makej-badge.jsx).
// Firma ho nevybírá — appka ho vždycky spočítá sama.
const _jbStitek = (c, hodinTydne) => {
  const k = _jbSmlouvaKod(c);
  if (k === 'DPP' || k === 'DPC') return 'Brigáda';
  if (k === 'ICO') return 'Na IČO';
  if (k === 'HPP') { const h = Number(hodinTydne) || 40; return h >= 36 ? 'Plný úvazek' : h >= 20 ? 'Zkrácený úvazek' : 'Částečný úvazek'; }
  return 'Dle domluvy';
};
// Odměna jako v appce: hlavní číslo = celkem za směnu (jen u Kč/h a známých hodin)
const _jbOdmena = l => {
  const hod = _jbHodin(l.timeText);
  const naHod = /(\/\s*h|hod)/i.test(l.payUnit || 'Kč/h');
  const zaSmenu = naHod && hod ? Math.round((l.pay || 0) * hod) : 0;
  const per = naHod ? '/h' : ((l.payUnit || '').replace(/\s*Kč\s*/i, '') || '');
  return { hod, zaSmenu, hlavni: zaSmenu ? zaSmenu.toLocaleString('cs-CZ') + ' Kč' : (l.pay || '—') + ' Kč' + per, sazba: l.pay ? l.pay + ' Kč' + (per || '/h') : '' };
};
// Firma tak, jak ji appka dostane z DB (feed bere z profilu jen název, hodnocení a ověření;
// logo appka neukazuje — vždycky iniciály)
const _jbFirma = () => {
  const P = typeof EPROFILE !== 'undefined' ? EPROFILE : {};
  const jmeno = P.company_name || P.name || (typeof ECOMPANY !== 'undefined' && ECOMPANY.name) || 'Vaše firma';
  const rec = typeof E_REVIEWS !== 'undefined' ? E_REVIEWS : [];
  const prumer = rec.length ? rec.reduce((a, r) => a + (r.rating || 0), 0) / rec.length : 0;
  return { jmeno, inicialy: jmeno.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??', hodnoceni: P.rating != null ? Number(P.rating) || 0 : prumer, overena: !!P.verified };
};
const _JbIko = ({ d }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B34F0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>{d}</svg>;
const _JbOvereno = ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" style={{ flex: 'none' }}><path fill="#3B82F6" d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3-1-3 2.6-1.9 1-3 3.2.1z"/><path d="M8 12.3l2.6 2.6L16.2 9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
// Pilulka „TOP" u topovaného inzerátu — zlatý kov s leskem (.e-zlato v index.html,
// jako odznáček „Byl jsem u toho" z waitlistu). 1:1 s WTopBadge v appce (www/worker-swipe.jsx).
const _JbTop = () => (
  <span className="e-zlato" style={{ display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 800, letterSpacing: '.04em', padding: '5px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>
    TOP<span className="e-zlato__lesk" aria-hidden="true" />
  </span>
);
const _JbPartner = () => <span style={{ fontSize: 10.5, fontWeight: 700, color: '#E9D9A6', padding: '3px 9px', borderRadius: 999, border: '1px solid #2A3E52', background: 'linear-gradient(105deg,#060A12,#2E4759 45%,#101A26)', whiteSpace: 'nowrap' }}>Zakládající partner</span>;

// Výška náhledu karty — stejnou má i panel s čísly vedle ní v detailu inzerátu.
const _JB_NAHLED_VYSKA = 'min(440px, calc(100vh - 345px))';
// nahled = v detailu inzerátu a v okně Upravit: jen karta jako v appce, bez čísel pro firmu.
function EJobKartaApp({ l, onOpen, nahled }) {
  const F = _jbFirma();
  const foto = l.image || (Array.isArray(l.photos) && l.photos[0]) || null;
  const o = _jbOdmena(l);
  const tagy = (Array.isArray(l.tags) ? l.tags : []).slice(0, nahled ? 4 : 3);
  const smlouva = _jbSmlouvaTxt(l.contract);
  const ceka = l.pending || 0;
  return (
    <div className={nahled ? undefined : 'e-jb-karta'} data-stav={nahled ? undefined : l._state} role={nahled ? undefined : 'button'} tabIndex={nahled ? undefined : 0} onClick={nahled ? undefined : onOpen} onKeyDown={nahled ? undefined : (e => { if (e.key === 'Enter') onOpen(); })}
      style={{ position: 'relative', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: nahled ? 'default' : 'pointer', height: nahled ? _JB_NAHLED_VYSKA : 500 }}>
      {/* Fotka provozu */}
      <div style={{ position: 'relative', height: 196, flex: 'none', background: 'linear-gradient(135deg,#1B34F0,#5C71FF)' }}>
        {foto
          ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 110, fontWeight: 800, color: 'rgba(255,255,255,.14)', letterSpacing: -3 }}>{F.inicialy}</div>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,18,51,.42) 0%, rgba(11,18,51,0) 38%, rgba(11,18,51,.55) 100%)' }} />
        {/* Vlevo nahoře úvazek (ze smlouvy) a u topovaného inzerátu TOP — jako v appce.
            Stav, značka ukázky ani Uložit sem nepatří. */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, padding: '6px 11px', borderRadius: 999, color: '#0B1233', background: '#fff' }}>{_jbStitek(l.contract, l.hoursPerWeek)}</span>
          {l.boosted && <_JbTop />}
        </div>
        <div style={{ position: 'absolute', left: 14, bottom: 13, right: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 40, height: 40, flex: 'none', borderRadius: 13, background: '#fff', color: '#1B34F0', fontSize: 15, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{F.inicialy}</span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#fff', minWidth: 0 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{F.jmeno}</span>
              {F.overena && <_JbOvereno />}
            </span>
            {(F.hodnoceni > 0 || l.boosted) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#fff' }}>
                {F.hodnoceni > 0 && <span><span style={{ color: '#FFC83D' }}>★</span> {F.hodnoceni.toFixed(1).replace('.', ',')}</span>}
                {l.boosted && <_JbPartner />}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Tělo karty — jako v appce */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 11, padding: '15px 17px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, color: '#7A82A6' }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{l.location}</span>
            {l.created_at && <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9AA1BD' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="#9AA1BD" strokeWidth="1.8" /><path d="M12 7.5V12l3 1.8" stroke="#9AA1BD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Přidáno {_jbPred(l.created_at)}</span>}
          </div>
        </div>
        <div style={{ background: '#EEF1FC', borderRadius: 14, padding: '11px 14px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 23, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1 }}>{o.hlavni}</span>
          {o.zaSmenu > 0 && <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7A82A6', whiteSpace: 'nowrap' }}>{o.sazba} · {String(o.hod).replace('.', ',')} h</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(l.date || l.timeText) && <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 700, color: '#0B1233' }}><_JbIko d={<><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></>} />{[_jbDatumKarta(l.date), l.timeText].filter(Boolean).join(' · ')}</div>}
          {l.recurrence && <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 700, color: '#0B1233' }}><_JbIko d={<><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></>} />{l.recurrence}</div>}
          {smlouva && <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 700, color: '#0B1233' }}><_JbIko d={<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></>} /><span>{smlouva}{l.hoursPerWeek ? <span style={{ fontWeight: 600, color: '#7A82A6' }}> · {l.hoursPerWeek} h/týden</span> : null}</span></div>}
        </div>
        {tagy.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tagy.map(t => <span key={t} style={{ fontSize: 11.5, fontWeight: 700, color: '#3A4266', background: '#F1F3FB', padding: '6px 10px', borderRadius: 999 }}>{t}</span>)}
          </div>
        )}
      </div>

      {/* Čísla pro firmu (tohle brigádník nevidí) — v náhledu ne, čísla jsou vedle.
          Jeden řádek i na úzké kartě (4 vedle sebe), klikací je celá karta. */}
      {!nahled && <div style={{ flex: 'none', borderTop: '1px solid #EEF0F6', background: '#FBFCFE', padding: '11px 17px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, color: '#7A82A6', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        <span><b style={{ color: '#0B1233', fontWeight: 800 }}>{(l.views || 0).toLocaleString('cs-CZ')}</b> zobrazení</span>
        <span><b style={{ color: '#0B1233', fontWeight: 800 }}>{l.matches || 0}</b> {(l.matches || 0) === 1 ? 'zájemce' : (l.matches >= 2 && l.matches <= 4) ? 'zájemci' : 'zájemců'}</span>
        {ceka > 0 && <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#B96F06', background: '#FFF3E0', padding: '3px 8px', borderRadius: 999 }}>{ceka} čeká</span>}
      </div>}
    </div>
  );
}

// ── Celý inzerát tak, jak ho brigádník uvidí po otevření karty (28. 9.) ──
// Předloha: WJobDetailModal ve www/worker-swipe.jsx — stejné pořadí sekcí, nadpisy
// a ikonky. Jen se nic nedá kliknout. sekce = klíč části, kterou firma právě
// vyplňuje; náhled na ni sám doroluje (data-sekce).
const _JB_SEKCE = {
  napln:     { t: 'Náplň tvojí práce', bg: '#EDE9FE', ico: <><rect x="3" y="7" width="18" height="13" rx="2.5" stroke="#7C3AED" strokeWidth="2" /><path d="M8.5 7V5.8C8.5 4.8 9.3 4 10.3 4H13.7C14.7 4 15.5 4.8 15.5 5.8V7" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" /><path d="M3 12.5H21" stroke="#7C3AED" strokeWidth="2" /></> },
  cekame:    { t: 'Co od tebe čekáme', bg: '#E1F0FE', ico: <text x="11.6" y="13" textAnchor="middle" dominantBaseline="central" fontSize="21" fontWeight="900" fill="#2196F3">?</text> },
  ocenime:   { t: 'Co oceníme', bg: '#FFF4D6', ico: <path d="M12 5 V19 M5 12 H19" stroke="#F5A700" strokeWidth="3.2" strokeLinecap="round" /> },
  nabidneme: { t: 'Co ti nabídneme', bg: '#DFF3E3', ico: <><path d="M4 17 L10 11 L14 14 L20 7" stroke="#2FA84F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 7 L20 7 L20 12" stroke="#2FA84F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></> },
  benefity:  { t: 'Benefity', bg: '#FCE7F3', ico: <><rect x="3.5" y="9" width="17" height="11.5" rx="2" stroke="#EC4899" strokeWidth="2" /><path d="M2.5 9h19M12 9v11.5" stroke="#EC4899" strokeWidth="2" /><path d="M12 9c-1.5-3.5-5.5-4-5.5-1.5S10 9 12 9zm0 0c1.5-3.5 5.5-4 5.5-1.5S14 9 12 9z" stroke="#EC4899" strokeWidth="1.8" strokeLinejoin="round" /></> },
};
function EJobDetailApp({ l, sekce }) {
  const F = _jbFirma();
  const ref = React.useRef(null);
  // sekce = { k: klíč části, hned: true při přepnutí kroku (skok bez animace) }
  React.useEffect(() => {
    const box = ref.current; if (!box || !sekce || !sekce.k) return;
    const behavior = sekce.hned ? 'auto' : 'smooth';
    if (sekce.k === 'zaklad') { box.scrollTo({ top: 0, behavior }); return; }
    const el = box.querySelector('[data-sekce="' + sekce.k + '"]');
    if (!el) return;
    let y = 0; for (let n = el; n && n !== box; n = n.offsetParent) y += n.offsetTop;   // pozice uvnitř rolovacího boxu
    box.scrollTo({ top: Math.max(0, y - 16), behavior });
  }, [sekce]);
  const o = _jbOdmena(l);
  const fotky = (Array.isArray(l.photos) && l.photos.length) ? l.photos : (l.image ? [l.image] : []);
  const A = x => (Array.isArray(x) ? x : []).filter(s => String(s).trim());
  const pozadavky = A(l.requirements).filter(r => !/^smluvní vztah/i.test(r) && !/^hledáme/i.test(r)).map(r => r.replace(/^(jazyk|vhodné pro):\s*/i, ''));
  const payout = l.payout ? 'Výplata ' + String(l.payout).toLowerCase() : '';
  const nadpis = k => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 26, height: 26, flex: 'none', borderRadius: 999, background: _JB_SEKCE[k].bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">{_JB_SEKCE[k].ico}</svg></span>
      <span style={{ fontSize: 15, fontWeight: 800, color: '#0B1233' }}>{_JB_SEKCE[k].t}</span>
    </span>
  );
  const body = items => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 35 }}>
      {items.map((r, i) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#3A3F5C', fontSize: 13.5, lineHeight: 1.55 }}><span style={{ flexShrink: 0, width: 4, height: 4, borderRadius: 999, background: '#C4CADD', marginTop: 8 }} /><span>{r}</span></div>)}
    </div>
  );
  const chipy = items => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{items.map((c, i) => <span key={i} style={{ fontSize: 12, fontWeight: 700, color: '#3A4266', background: '#F1F3FB', padding: '7px 11px', borderRadius: 999 }}>{c}</span>)}</div>;
  const napln = String(l.duties || l.description || '').trim();
  const dlazdice = [
    { l: 'Odměna', v: (l.pay || '—') + ' ' + (l.payUnit || 'Kč/h'), s: o.zaSmenu ? o.zaSmenu.toLocaleString('cs-CZ') + ' Kč za směnu' : '' },
    { l: 'Kdy', v: _jbDatumKarta(l.date) || '—', h: ([l.timeText, o.hod ? String(o.hod).replace('.', ',') + ' h' : ''].filter(Boolean).join(' · ')) || 'Rozpis směny' },
    { l: 'Kde', v: l.location || '—', h: l.location ? 'Ukázat na mapě' : '', wrap: true },
    { l: 'Smlouva', v: _jbSmlouvaTxt(l.contract) || 'Brigáda', s: payout },
  ];
  return (
    <div ref={ref} style={{ position: 'relative', height: '100%', overflowY: 'auto', overscrollBehavior: 'contain', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Fotky provozu */}
      <div style={{ position: 'relative', height: 190, flex: 'none', background: 'linear-gradient(135deg,#1B34F0,#5C71FF)' }}>
        {fotky.length
          ? <img src={fotky[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 120, fontWeight: 800, color: 'rgba(255,255,255,.12)', letterSpacing: -3 }}>{F.inicialy}</div>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,18,51,.4) 0%, rgba(11,18,51,0) 45%)' }} />
        {fotky.length > 1 && <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>{fotky.map((_, i) => <span key={i} style={{ width: i === 0 ? 18 : 6, height: 6, borderRadius: 999, background: i === 0 ? '#fff' : 'rgba(255,255,255,.55)' }} />)}</div>}
        <div style={{ position: 'absolute', top: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between' }}>
          {[<path key="z" d="M9 1L2 9l7 8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" transform="translate(7 3)" />, <g key="t" fill="#fff"><circle cx="6" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="18" cy="12" r="1.8" /></g>].map((ico, i) => (
            <span key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,.36)', display: 'grid', placeItems: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24">{ico}</svg></span>
          ))}
        </div>
      </div>

      {/* Obsah */}
      <div style={{ position: 'relative', marginTop: -22, background: '#fff', borderRadius: '22px 22px 0 0', padding: '18px 17px 20px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        <div data-sekce="zaklad" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(l.positions > 1 || l.boosted) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {l.boosted && <_JbTop />}
              {l.positions > 1 && <span style={{ fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 999, color: '#B96F06', background: '#FFF3E0' }}>{l.positions} volných míst</span>}
            </span>
          )}
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1.15 }}>{l.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ width: 34, height: 34, flex: 'none', borderRadius: 11, background: '#1B34F0', color: '#fff', fontSize: 14, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{F.inicialy}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: '#0B1233', minWidth: 0 }}><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{F.jmeno}</span>{F.overena && <_JbOvereno s={14} />}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                {F.hodnoceni > 0
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ color: '#FFC83D' }}>★</span><b style={{ color: '#0B1233' }}>{F.hodnoceni.toFixed(1).replace('.', ',')}</b><span style={{ color: '#1B34F0', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2 }}>recenze</span></span>
                  : <span style={{ color: '#7A82A6' }}>Nová firma na Makej</span>}
                {l.boosted && <_JbPartner />}
              </span>
            </span>
          </div>
        </div>

        <div data-sekce="fakta" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'start' }}>
          {dlazdice.map(f => (
            <div key={f.l} style={{ background: f.h ? '#E9EDFF' : '#F6F7FC', borderRadius: 13, padding: '10px 11px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#A6ADCB' }}>{f.l}</span>
              <span style={{ fontSize: 15.5, fontWeight: 800, color: '#0B1233', lineHeight: 1.2, ...(f.wrap ? { overflowWrap: 'break-word' } : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>{f.v}</span>
              {f.h ? <span style={{ fontSize: 11, fontWeight: 700, color: '#5B6488', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.h} ›</span>
                : f.s ? <span style={{ fontSize: 10.5, color: '#7A82A6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.s}</span> : null}
            </div>
          ))}
        </div>

        {napln && <div data-sekce="napln" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{nadpis('napln')}<p style={{ margin: 0, paddingLeft: 35, fontSize: 13.5, color: '#3A4266', lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{napln}</p></div>}
        {A(l.expectations).length > 0 && <div data-sekce="cekame" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{nadpis('cekame')}{body(A(l.expectations))}</div>}
        {A(l.bonuses).length > 0 && <div data-sekce="ocenime" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{nadpis('ocenime')}{body(A(l.bonuses))}</div>}
        {A(l.offer).length > 0 && <div data-sekce="nabidneme" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{nadpis('nabidneme')}{body(A(l.offer))}</div>}
        {A(l.perks).length > 0 && <div data-sekce="benefity" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{nadpis('benefity')}{body(A(l.perks))}</div>}
        {pozadavky.length > 0 && <div data-sekce="potrebujes" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><span style={{ fontSize: 15, fontWeight: 800, color: '#0B1233' }}>Co potřebuješ</span>{chipy(pozadavky)}</div>}
        {A(l.tags).length > 0 && <div data-sekce="vlastnosti" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><span style={{ fontSize: 15, fontWeight: 800, color: '#0B1233' }}>Vlastnosti brigády</span>{chipy(A(l.tags))}</div>}
        <span style={{ fontSize: 11, color: '#A6ADCB', lineHeight: 1.5 }}>Pravidla směny a přesnou adresu dostaneš do chatu, jakmile firma potvrdí zájem.</span>
      </div>

      {/* Spodní lišta z appky (jen na ukázku) */}
      <div style={{ position: 'sticky', bottom: 0, flex: 'none', borderTop: '1px solid #E6E9F5', background: '#fff', padding: '10px 14px', display: 'flex', gap: 9 }}>
        <span style={{ width: 46, height: 46, flex: 'none', borderRadius: 15, border: '1px solid #E6E9F5', display: 'grid', placeItems: 'center' }}><svg width="15" height="15" viewBox="0 0 18 18"><path d="M2 2l14 14M16 2L2 16" stroke="#5B6488" strokeWidth="2.4" strokeLinecap="round" /></svg></span>
        <span style={{ flex: 1, height: 46, borderRadius: 15, background: '#1B34F0', color: '#fff', fontSize: 15, fontWeight: 800, display: 'grid', placeItems: 'center' }}>Mám zájem</span>
      </div>
    </div>
  );
}

// ── Zhlédnutí po dnech (detail inzerátu, 28. 9.) ──
// Klasický čárový graf (předloha od Yasina: rovné úseky, vodorovné mřížky s čísly
// vlevo, data dole po pár dnech, světlá výplň pod čárou, bez teček).
// Období = od dne zveřejnění do dneška, nejvýš posledních 30 dní — nikdy dny před zveřejněním.
// Graf má pevnou výšku a šířku panelu — s přibývajícími dny se jen zhušťují body,
// nic neroste; po 30 dnech se okno posouvá (nejstarší den vypadne).
// Data: l.viewsByDay { 'RRRR-MM-DD': počet } z job_views.created_at (employer-supabase.jsx).
const _zgKlic = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
// „Hezký" krok mřížky: 1, 2, 5 × 10^n tak, aby vyšly asi 3 dílky
const _zgKrok = max => { const hrube = Math.max(1, max) / 3; const r = Math.pow(10, Math.floor(Math.log10(hrube))); return [1, 2, 5, 10].find(k => k * r >= hrube) * r; };
function EZhlednutiGraf({ l }) {
  const [nad, setNad] = React.useState(null);
  const dny = React.useMemo(() => {
    const dnes = new Date(); dnes.setHours(0, 0, 0, 0);
    const pub = l.created_at ? new Date(l.created_at) : null; if (pub) pub.setHours(0, 0, 0, 0);
    const odPub = pub ? Math.round((dnes - pub) / 86400000) + 1 : 30;
    // Jen dny, kdy inzerát běží (Yasin 28. 9.: žádné dny před zveřejněním)
    const n = Math.max(1, Math.min(30, odPub));
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(dnes); d.setDate(dnes.getDate() - (n - 1 - i));
      const pred = !!(pub && d < pub);
      return { d, pred, v: pred ? 0 : ((l.viewsByDay || {})[_zgKlic(d)] || 0) };
    });
  }, [l.id, l.viewsByDay, l.created_at]);
  const N = dny.length;
  const krok = _zgKrok(Math.max(...dny.map(x => x.v)));
  const strop = Math.max(krok, Math.ceil(Math.max(...dny.map(x => x.v)) / krok) * krok);
  const mrizka = []; for (let v = 0; v <= strop + 1e-9; v += krok) mrizka.push(v);
  const X = i => N === 1 ? 50 : i / (N - 1) * 100;
  const Y = v => 100 - v / strop * 100;
  const cara = dny.map((x, i) => (i ? 'L ' : 'M ') + X(i) + ' ' + Y(x.v)).join(' ');
  const krokPopisku = N <= 5 ? 1 : N <= 10 ? 2 : 5;
  const dnes = dny[N - 1].v;
  const cislo = v => v.toLocaleString('cs-CZ');
  const popis = x => _JB_DNY[x.d.getDay()] + ' ' + x.d.getDate() + '. ' + (x.d.getMonth() + 1) + '.';
  const OSA = 34;   // šířka svislé osy s čísly
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#7A82A6' }}>Zhlédnutí</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1 }}>{cislo(l.views || 0)}</span>
        {dnes > 0 && <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0B7B4B' }}>+{cislo(dnes)} dnes</span>}
        {nad !== null && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#3A4266' }}>{popis(dny[nad])}: {dny[nad].pred ? 'ještě nezveřejněno' : cislo(dny[nad].v) + ' zhlédnutí'}</span>}
      </div>
      <div style={{ position: 'relative', height: 72, marginTop: 4 }} onMouseLeave={() => setNad(null)}>
        {/* Mřížka + čísla vlevo */}
        {mrizka.map(v => (
          <React.Fragment key={v}>
            <span style={{ position: 'absolute', left: OSA, right: 0, top: Y(v) + '%', borderTop: '1px solid ' + (v === 0 ? '#D5DAE6' : '#ECEEF4') }} />
            <span style={{ position: 'absolute', left: 0, width: OSA - 8, top: Y(v) + '%', transform: 'translateY(-50%)', textAlign: 'right', fontSize: 11, color: '#8A90A8', fontVariantNumeric: 'tabular-nums' }}>{cislo(v)}</span>
          </React.Fragment>
        ))}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: OSA, right: 4 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} aria-hidden="true">
            <path d={cara + ' L 100 100 L 0 100 Z'} fill="#3B6FE8" fillOpacity=".1" />
            <path d={cara} fill="none" stroke="#3B6FE8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {nad !== null && <line x1={X(nad)} x2={X(nad)} y1="0" y2="100" stroke="#C9D0E4" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
          </svg>
          {N === 1 && nad === null && <span style={{ position: 'absolute', left: '50%', top: Y(dny[0].v) + '%', width: 8, height: 8, borderRadius: '50%', background: '#3B6FE8', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />}
          {nad !== null && <span style={{ position: 'absolute', left: X(nad) + '%', top: Y(dny[nad].v) + '%', width: 8, height: 8, borderRadius: '50%', background: '#3B6FE8', border: '2px solid #fff', boxShadow: '0 0 0 1px #3B6FE8', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />}
          {/* Pásy na najetí myší — jeden na den, se středem na bodu */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: (-50 / Math.max(1, N - 1)) + '%', right: (-50 / Math.max(1, N - 1)) + '%', display: 'flex' }}>
            {dny.map((x, i) => <div key={i} onMouseEnter={() => setNad(i)} style={{ flex: 1 }} />)}
          </div>
        </div>
      </div>
      {/* Data dole po 5 dnech (u krátkého období po 2) */}
      <div style={{ position: 'relative', height: 14, marginLeft: OSA, marginRight: 4, fontSize: 11, color: '#8A90A8', fontVariantNumeric: 'tabular-nums' }}>
        {dny.map((x, i) => i % krokPopisku === 0 ? <span key={i} style={{ position: 'absolute', left: X(i) + '%', transform: 'translateX(' + (i === 0 ? '-10%' : '-50%') + ')', whiteSpace: 'nowrap' }}>{x.d.getDate()}. {x.d.getMonth() + 1}.</span> : null)}
      </div>
    </div>
  );
}

// ── Základní statistiky jednoho inzerátu (28. 9.) ──
// Po kliknutí na „Statistiky" v detailu se panel vpravo přepne sem (karta vlevo
// zůstává). Stejné základní statistiky jako záložka Statistiky pro levnější
// tarify (Věk, Vzdělání, Kdy lidé reagují), jen z lidí, kteří dali „Mám zájem"
// na TENHLE inzerát. Data: l.candidates (birth_date, education, matched_at).
const _JS_DNY = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const _JS_DNY_V = { Po: 'v pondělí', Út: 'v úterý', St: 've středu', Čt: 've čtvrtek', Pá: 'v pátek', So: 'v sobotu', Ne: 'v neděli' };
function _JsSloupce({ data, vyska }) {
  const max = Math.max(1, ...data.map(d => d[1]));
  return data.map(([l, v, c]) => (
    <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5, height: '100%', minWidth: 0 }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0B1233' }}>{v}</span>
      <span style={{ width: '100%', height: Math.max(3, v / max * vyska), background: c, borderRadius: '6px 6px 3px 3px' }} />
      <span style={{ fontSize: 10.5, color: '#7A82A6', whiteSpace: 'nowrap' }}>{l}</span>
    </div>
  ));
}
function EJobStatistiky({ l, onZpet }) {
  const kand = Array.isArray(l.candidates) ? l.candidates : [];
  const lide = Object.values(kand.reduce((m, k) => { if (k.worker_id) m[k.worker_id] = k; return m; }, {}));
  const vek = d => { const b = new Date(d); if (!d || isNaN(b)) return null; const n = new Date(); let v = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) v--; return v; };
  const vekBars = [['15–17', 15, 18], ['18–21', 18, 22], ['22–25', 22, 26], ['26–30', 26, 31], ['30+', 31, 200]]
    .map(([t, a, b], i) => [t, lide.filter(k => { const v = vek(k.birth_date); return v != null && v >= a && v < b; }).length, i === 1 || i === 2 ? '#1B34F0' : '#5C71FF']);
  const vekZnamy = vekBars.reduce((a, b) => a + b[1], 0);
  const stupen = e => { const t = String(e || '').split(' — ')[0]; return /^Základní/.test(t) ? 'Základní' : /výuční/.test(t) ? 'Vyučen/a' : /maturitou/.test(t) ? 'Maturita' : /VOŠ/.test(t) ? 'Vyšší odborné' : /^Vysokoškolské/.test(t) ? 'Vysoká škola' : null; };
  const PAL = ['#1B34F0', '#5C71FF', '#0FA968', '#F5920B', '#8B5CF6'];
  const vzd = ['Základní', 'Vyučen/a', 'Maturita', 'Vyšší odborné', 'Vysoká škola'].map((t, i) => [t, lide.filter(k => stupen(k.education) === t).length, PAL[i]]);
  const vzdZnamo = vzd.reduce((a, b) => a + b[1], 0);
  const casy = kand.map(k => new Date(k.matched_at)).filter(d => !isNaN(d));
  const dny = _JS_DNY.map(t => [t, 0]); casy.forEach(d => { dny[(d.getDay() + 6) % 7][1]++; });
  const maxDen = Math.max(...dny.map(d => d[1]));
  const dnyBars = dny.map(([t, v]) => [t, v, v && v === maxDen ? '#0FA968' : '#5C71FF']);
  const doby = [[6, 9], [9, 12], [12, 15], [15, 18], [18, 21], [21, 24], [0, 6]].map(([a, b]) => [a, b, casy.filter(d => d.getHours() >= a && d.getHours() < b).length]);
  const maxDoba = Math.max(1, ...doby.map(d => d[2]));
  const H = { fontSize: 13.5, fontWeight: 800, color: '#0B1233' };
  const SUB = { fontSize: 11.5, color: '#7A82A6' };
  const BOX = { border: '1px solid #EEF0F6', borderRadius: 13, padding: '10px 14px 11px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 };
  const prazdne = t => <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 80, fontSize: 12.5, color: '#A6ADCB', textAlign: 'center' }}>{t}</div>;
  // Nadpis boxu: vlevo název, vpravo drobná poznámka (bez druhého řádku — ať se vše vejde bez posouvání)
  const hlava = (t, pozn) => <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}><span style={H}>{t}</span>{pozn && <span style={{ ...SUB, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pozn}</span>}</span>;
  return (
    <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: _JB_NAHLED_VYSKA, boxSizing: 'border-box' }}>
      {/* Hlavička: zpět na přehled inzerátu */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F0F2FA', flex: 'none' }}>
        <button type="button" className="e-det-tl" onClick={onZpet} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#3A4266', background: '#fff', border: '1px solid #E6E9F5', padding: '7px 11px', borderRadius: 9, cursor: 'pointer' }}>← Přehled</button>
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 15.5, fontWeight: 800, color: '#0B1233', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Statistiky inzerátu</span>
          <span style={{ fontSize: 12, color: '#7A82A6' }}>{lide.length ? (lide.length === 1 ? '1 člověk dal' : lide.length < 5 ? lide.length + ' lidé dali' : lide.length + ' lidí dalo') + ' „Mám zájem"' : 'Zatím nikdo nedal „Mám zájem"'}</span>
        </span>
      </div>

      {/* Obsah — když se nevejde, roluje uvnitř panelu */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: '12px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 'max-content', gap: 10 }}>
        <div style={BOX}>
          {hlava('Věk', 'lidé se zájmem')}
          {vekZnamy ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, height: 90 }}><_JsSloupce data={vekBars} vyska={50} /></div> : prazdne('Zatím bez údajů')}
        </div>
        <div style={BOX}>
          {hlava('Vzdělání', 'nejvyšší dosažené')}
          {vzdZnamo
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {vzd.map(([t, v, c]) => (
                  <div key={t} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 34px', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#3A4266', whiteSpace: 'nowrap' }}>{t}</span>
                    <span style={{ height: 6, borderRadius: 999, background: '#F1F3FB', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: (v / vzdZnamo * 100) + '%', background: c, borderRadius: 999 }} /></span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0B1233', textAlign: 'right' }}>{Math.round(v / vzdZnamo * 100)} %</span>
                  </div>
                ))}
              </div>
            : prazdne('Zatím to nikdo nevyplnil')}
        </div>
        <div style={{ ...BOX, gridColumn: '1 / -1' }}>
          {hlava('Kdy lidé reagují', maxDen ? 'nejvíc zájmu ' + _JS_DNY_V[dny.find(d => d[1] === maxDen)[0]] + ' — tehdy se vyplatí topovat' : null)}
          {casy.length
            ? <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 22, alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, height: 100 }}><_JsSloupce data={dnyBars} vyska={60} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderLeft: '1px solid #F0F2FA', paddingLeft: 18 }}>
                  {doby.map(([od, doo, v]) => (
                    <div key={od} style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: '14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#3A4266', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flex: 'none' }}>{String(od).padStart(2, '0')}:00–{String(doo).padStart(2, '0')}:00</span>
                      <span style={{ flex: 1, height: 6, borderRadius: 999, background: '#F1F3FB', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: (v / maxDoba * 100) + '%', background: v === maxDoba && v ? '#F5920B' : '#C7D0FF', borderRadius: 999 }} /></span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#0B1233', width: 20, textAlign: 'right', flex: 'none' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            : prazdne('Ukáže se s prvními zájemci')}
        </div>
      </div>

      {/* Odkaz na plné statistiky (od tarifu Dynamický) */}
      <div style={{ flex: 'none', borderTop: '1px solid #F0F2FA', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12, color: '#7A82A6' }}>
        <span>Základní statistiky · podrobné přehledy a export má tarif Dynamický</span>
        <span className="nj-odkaz" onClick={() => window.empGoTab && window.empGoTab('analytics')} style={{ fontWeight: 800, color: '#1B34F0', cursor: 'pointer', whiteSpace: 'nowrap' }}>Všechny statistiky ›</span>
      </div>
    </div>
  );
}

function EJobs({ onTab, onNew, period, onPeriod } = {}) {
  const [tab, setTab] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('new');
  const [overrides, setOverrides] = React.useState({});
  const [statsJob, setStatsJob] = React.useState(null);
  const [detailStat, setDetailStat] = React.useState(false);   // panel vpravo: přehled ↔ statistiky
  // Otevřený detail si pamatujeme mimo komponentu: po uložení stavu přijde
  // realtime změna, main zvýší tick a EJobs se znovu připojí — bez toho by
  // detail zavřel a firma skončila zpátky v seznamu.
  // Detail je i v adrese (#inzeraty/<id>): šipka Zpět v prohlížeči ho zavře,
  // refresh ho nechá otevřený.
  const _hashDetail = () => { const p = location.hash.slice(1).split('/'); return p[0] === 'inzeraty' && p[1] ? decodeURIComponent(p[1]) : null; };
  const [detailId, setDetailIdS] = React.useState(() => _hashDetail() || window.__empJobDetail || null);
  const setDetailId = id => {
    window.__empJobDetail = id; setDetailIdS(id);
    if (id) { if (_hashDetail() !== id) history.pushState({ empDetail: true }, '', '#inzeraty/' + encodeURIComponent(id)); }
    else if (_hashDetail()) {
      // Otevřeli jsme ho my → vrátit se o krok (jako šipka Zpět); jinak jen přepsat adresu.
      if (history.state && history.state.empDetail) history.back(); else history.replaceState(null, '', '#inzeraty');
    }
  };
  React.useEffect(() => {
    const onPop = () => { const d = _hashDetail(); window.__empJobDetail = d; setDetailIdS(d); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const [stavMenu, setStavMenu] = React.useState(null);   // id inzerátu s otevřenou nabídkou stavu
  const [dotaz, setDotaz] = React.useState(null);         // { job, druh: 'pauza' | 'limit' | 'top' }
  const [topy, setTopy] = React.useState({});             // id → do kdy je topovaný (topnuto v této relaci)
  const [ukladam, setUkladam] = React.useState(false);
  const [upravuji, setUpravuji] = React.useState(null);   // inzerát otevřený v okně úprav
  const ulozUpravu = async fields => {
    const l = upravuji;
    if (l._demo) { window.empToast && window.empToast('Ukázkový inzerát', 'Náhled funguje, ale ukázka se neukládá.', 'ℹ️', 'info'); setUpravuji(null); return; }
    const ok = typeof updateJobE === 'function' ? await updateJobE(l.id, fields) : false;
    if (!ok) { window.empToast && window.empToast('Nepovedlo se', 'Změny se nepodařilo uložit. Zkuste to prosím znovu.', '⚠️', 'error'); return; }
    setUpravuji(null);
    window.empToast && window.empToast('Uloženo', l.title + ' — změny uvidí brigádníci hned.', '✅', 'info');
    if (window.empObnovData) window.empObnovData();
  };

  // Ukázkové inzeráty (employer-demo.jsx) jen do seznamu — do limitu tarifu a čísel ne
  const raw = (typeof E_JOBS !== 'undefined' ? E_JOBS : []).concat(typeof eDemoInzeraty === 'function' ? eDemoInzeraty() : []);
  const jobs = raw.map(j => {
    const topDo = topy[j.id] || j.topUntil || null;
    return { ...j, _state: _jbStatusMap(overrides[j.id] || j.status), topUntil: topDo, boosted: !!j.boosted || !!(topDo && new Date(topDo) > new Date()) };
  });
  const skutecne = jobs.filter(j => !j._demo);
  const cand = (typeof E_CANDIDATES !== 'undefined' ? E_CANDIDATES : {});

  // Filtry = stejné skupiny jako v seznamu (Aktivní / Neaktivní / Naplněné) a stejná slova jako štítek stavu.
  // Urgentní je jen příznak běžícího inzerátu, vlastní filtr nepotřebuje (v seznamu má svou skupinu).
  const _vSkupine = { bezi: j => j._state === 'active' || j._state === 'asap', vyp: j => j._state === 'inactive', napl: j => j._state === 'filled' };
  const counts = {
    all: jobs.length,
    bezi: jobs.filter(_vSkupine.bezi).length,
    vyp: jobs.filter(_vSkupine.vyp).length,
    napl: jobs.filter(_vSkupine.napl).length,
  };
  const activeCount = skutecne.filter(j => j._state === 'active' || j._state === 'asap').length;

  const q = query.trim().toLowerCase();
  let list = jobs.filter(j => {
    if (tab !== 'all' && !_vSkupine[tab](j)) return false;
    if (q && !(j.title || '').toLowerCase().includes(q)) return false;
    return true;
  });
  list = list.slice().sort((a, b) =>
    sort === 'rate' ? (b.pay || 0) - (a.pay || 0) :
    sort === 'views' ? (b.views || 0) - (a.views || 0) :
    sort === 'interest' ? (b.matches || 0) - (a.matches || 0) :
    new Date(b.created_at || 0) - new Date(a.created_at || 0));
  // Skupiny (Yasin 29. 9.): Aktivní → Neaktivní → Naplněné, každá s barevným štítkem.
  // Urgentní (směna do 2 dnů) jsou první karty v Aktivních, ne vlastní řádek — samotná
  // karta v řádku nechávala vedle sebe prázdno. Poznají se podle fialového rámečku
  // a u štítku Aktivní je „● 1 urgentní · směna do 2 dnů". Neaktivní a naplněné karty
  // jsou ztlumené (CSS .e-jb-karta[data-stav] v index.html).
  list = list.slice().sort((a, b) => (b._state === 'asap' ? 1 : 0) - (a._state === 'asap' ? 1 : 0));
  const urgentnich = list.filter(j => j._state === 'asap').length;
  const _SKUP = [
    { k: 'bezi', l: 'Aktivní',   m: j => j._state === 'active' || j._state === 'asap', b: { c: '#0B7B4B', bg: '#E6F7EF', dot: '#0FA968' } },
    { k: 'vyp',  l: 'Neaktivní', m: j => j._state === 'inactive', b: { c: '#5B6488', bg: '#F1F3FB', dot: '#A6ADCB' } },
    { k: 'napl', l: 'Naplněné',  m: j => j._state === 'filled',   b: { c: '#1B34F0', bg: '#EEF1FF', dot: '#1B34F0' } },
  ];
  const skupiny = (tab === 'all' ? _SKUP : _SKUP.filter(g => g.k === tab))
    .map(g => ({ g, polozky: list.filter(g.m) })).filter(x => x.polozky.length);
  // Ve „Vše" štítky skupin; ve vybrané záložce jen když je co říct o urgentních
  const nadpisySkupin = tab === 'all' || (tab === 'bezi' && urgentnich > 0);
  const detail = detailId ? jobs.find(j => j.id === detailId) : null;
  // Otevření / zavření detailu začne nahoře, ne uprostřed dlouhého seznamu.
  // Nahoru: na počítači se posouvá obsah karty (pevná obrazovka), na mobilu <main>
  React.useEffect(() => { document.querySelectorAll('main, .e-ram > div > :last-child').forEach(m => { m.scrollTop = 0; }); setDetailStat(false); }, [detailId]);

  const planTier = (typeof _employerPlanTier !== 'undefined') ? _employerPlanTier() : 'zakladni';
  const limit = (typeof EMPLOYER_MAX_ACTIVE !== 'undefined' && EMPLOYER_MAX_ACTIVE[planTier] != null) ? EMPLOYER_MAX_ACTIVE[planTier] : Infinity;
  const showDots = limit !== Infinity && limit <= 10;
  const overLimit = activeCount > limit;
  const maxViews = Math.max.apply(null, jobs.map(j => j.views || 0).concat([1]));
  const maxPerDay = Math.max.apply(null, jobs.map(j => (j.views || 0) / _jbAge(j.created_at)).concat([1]));
  const totalViews = jobs.reduce((a, j) => a + (j.views || 0), 0);
  const avgCtr = jobs.length ? (jobs.reduce((a, j) => a + (j.ctr || 0), 0) / jobs.length) : 0;
  const hiredTotal = skutecne.reduce((a, j) => a + (j.hired || 0), 0);

  // Zapnutí / pozastavení inzerátu — uloží se do DB (setJobActiveE), ne jen na obrazovku.
  // Pozastavení se nejdřív zeptá (inzerát zmizí lidem z appky), zapnutí hlídá limit tarifu.
  const zmenStav = async (l, zapnout) => {
    setUkladam(true);
    const ok = typeof setJobActiveE === 'function' ? await setJobActiveE(l.id, zapnout) : false;
    setUkladam(false); setDotaz(null);
    if (ok) {
      setOverrides(o => ({ ...o, [l.id]: zapnout ? 'active' : 'paused' }));
      window.empToast && window.empToast(zapnout ? 'Inzerát je aktivní' : 'Inzerát je pozastavený', zapnout ? l.title + ' — lidé ho znovu uvidí v aplikaci.' : l.title + ' — v aplikaci už ho nikdo neuvidí.', zapnout ? '✅' : '⏸️', 'info');
    } else {
      window.empToast && window.empToast('Nepovedlo se', 'Stav inzerátu se nepodařilo uložit. Zkuste to prosím znovu.', '⚠️', 'error');
    }
  };
  const vyberStav = (l, zapnout) => {
    setStavMenu(null);
    if (l._demo) { window.empToast && window.empToast('Ukázkový inzerát', 'Tohle je jen ukázka, stav se u ní nemění.', 'ℹ️', 'info'); return; }
    const bezi = l._state === 'active' || l._state === 'asap';
    if (zapnout === bezi) return;
    if (!zapnout) return setDotaz({ job: l, druh: 'pauza' });
    if (limit !== Infinity && activeCount >= limit) return setDotaz({ job: l, druh: 'limit' });
    zmenStav(l, true);
  };

  // Topování (Yasin 29. 9.): inzerát je E_TOP_HODIN hodin v appce mezi prvními kartami
  // (v každém filtru, kam spadá) a má zlatou pilulku TOP. Kolikrát za měsíc, určuje tarif.
  const topHodin = typeof E_TOP_HODIN !== 'undefined' ? E_TOP_HODIN : 72;
  const topLimit = typeof EMPLOYER_TOP_MESICNE !== 'undefined' ? (EMPLOYER_TOP_MESICNE[planTier] || 0) : 0;
  const topPouzito = (typeof E_TOPOVANI !== 'undefined' ? E_TOPOVANI : []).length;
  const topZbyva = Math.max(0, topLimit - topPouzito);
  const tarifNazev = (typeof EMPLOYER_TARIF_NAZEV !== 'undefined' && EMPLOYER_TARIF_NAZEV[planTier]) || '';
  const dalsiMesic = (() => { const d = new Date(); return '1. ' + (d.getMonth() === 11 ? 1 : d.getMonth() + 2) + '.'; })();
  const vyberTop = l => {
    if (!(l._state === 'active' || l._state === 'asap')) {
      window.empToast && window.empToast('Inzerát je vypnutý', 'Topovat jde jen aktivní inzerát — nejdřív ho zapněte.', 'ℹ️', 'info');
      return;
    }
    setDotaz({ job: l, druh: 'top' });
  };
  const potvrdTop = async l => {
    if (l._demo) { setDotaz(null); window.empToast && window.empToast('Ukázkový inzerát', 'Topování si vyzkoušíte na vlastním inzerátu — ukázka se netopuje.', 'ℹ️', 'info'); return; }
    setUkladam(true);
    const doKdy = typeof topovatJobE === 'function' ? await topovatJobE(l.id) : null;
    setUkladam(false); setDotaz(null);
    if (doKdy) {
      setTopy(t => ({ ...t, [l.id]: doKdy }));
      window.empToast && window.empToast('Inzerát je topovaný', l.title + ' — do ' + _jbKdyDo(doKdy) + ' ho brigádníci uvidí mezi prvními kartami.', '✅', 'info');
    } else {
      window.empToast && window.empToast('Nepovedlo se', 'Topování se nepodařilo uložit. Zkuste to prosím znovu.', '⚠️', 'error');
    }
  };

  const cellLabel = { fontSize: 11, fontWeight: 800, letterSpacing: '.09em', color: '#A9B7FF', textTransform: 'uppercase' };
  const cellVal = { fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-.02em', lineHeight: 1 };
  const chip = on => on
    ? { color: '#fff', bg: '#1B34F0', border: '#1B34F0', cc: '#A9B7FF' }
    : { color: '#3A4266', bg: '#fff', border: '#E6E9F5', cc: '#A6ADCB' };
  const tabs = [
    { k: 'all', l: 'Vše' }, { k: 'bezi', l: 'Aktivní' }, { k: 'vyp', l: 'Neaktivní' }, { k: 'napl', l: 'Naplněné' },
  ];
  const inputSt = { fontSize: 13, color: '#0B1233', background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 9, padding: '9px 12px', outline: 'none' };

  // Plná karta inzerátu — otevře se po kliknutí na řádek v seznamu.
  const karta = l => {
            const st = _JB_STATES[l._state];
            const N = _jbNabor(l);
            const waiting = l.pending || 0;
            const live = l._state === 'active' || l._state === 'asap';
            const viewsPct = Math.round((l.views || 0) / maxViews * 100) + '%';
            const soon = live && l.daysLeft > 0 && l.daysLeft <= 7;
            const remPct = Math.round(Math.min(1, (l.daysLeft || 0) / 30) * 100) + '%';
            const remColor = !live || !l.daysLeft ? '#DDE1F0' : soon ? '#F5920B' : '#1B34F0';
            return (
              // Stejně vysoký jako náhled karty vlevo (Yasin 28. 9.); když se obsah nevejde, naroste
              <div key={l.id} style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: _JB_NAHLED_VYSKA, boxSizing: 'border-box' }}>

                {/* 1 — hlavička karty */}
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, borderBottom: '1px solid #F0F2FA', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: st.dot, flex: 'none' }} />
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#0B1233', letterSpacing: '-.01em' }}>{l.title}</span>
                    {/* Stav jen jako štítek — přepíná se dole v patičce („Stav: Aktivní | Neaktivní") */}
                    <span style={{ fontSize: 11, fontWeight: 800, color: st.color, background: st.bg, padding: '4px 9px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{st.label}</span>
                    {/* Sazba a datum zveřejnění pryč (Yasin 28. 9.) — sazba je na kartě vlevo, datum v Průběhu náboru */}
                  </div>
                  {/* Vpravo Upravit (dřív v patičce — tam je teď přepínač stavu a nevešlo by se to) */}
                  <button className="e-det-tl" onClick={() => setUpravuji(l)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#1B34F0', background: '#fff', border: '1px solid #D5DAF0', padding: '9px 16px', borderRadius: 9, cursor: 'pointer' }}><Icon name="pen-2-linear" size={13} color="#1B34F0" />Upravit</button>
                </div>

                {/* 2 — obsah */}
                {/* Pod sebou (vedle je náhled karty, na dva sloupce by fáze byly namačkané) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, padding: '14px 22px', borderBottom: '1px solid #F0F2FA', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
                    {/* Nadpis + expirace v jednom řádku, ať má graf celou šířku */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.09em', color: '#A6ADCB', textTransform: 'uppercase' }}>Výkon inzerátu</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#7A82A6' }}>
                        Expirace
                        <b style={{ fontSize: 13.5, color: live && l.daysLeft ? (soon ? '#B96F06' : '#0B1233') : '#A6ADCB' }}>{live && l.daysLeft ? l.daysLeft + (l.daysLeft === 1 ? ' den' : l.daysLeft < 5 ? ' dny' : ' dní') : live ? 'dnes' : 'neběží'}</b>
                        {live && l.daysLeft > 0 && <span style={{ color: '#A6ADCB' }}>· do {_jbEnd(l.daysLeft)}</span>}
                        {live && l.daysLeft > 0 && <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1B34F0', border: '1px solid #D5DAF0', padding: '3px 9px', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}>Prodloužit</span>}
                      </span>
                    </div>
                    {/* Zhlédnutí = kolik různých brigádníků vidělo kartu v appce (job_views,
                        1× na člověka), ať dali zájem nebo ne. */}
                    {l.viewsByDay
                      ? <EZhlednutiGraf l={l} />
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <span style={{ fontSize: 12, color: '#7A82A6' }}>Zhlédnutí</span>
                          <span style={{ fontSize: 22, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', lineHeight: 1 }}>{(l.views || 0).toLocaleString('cs-CZ')}</span>
                          <span style={{ height: 4, borderRadius: 999, background: '#EEF1FF', display: 'block', overflow: 'hidden' }}><span style={{ display: 'block', width: viewsPct, height: '100%', borderRadius: 999, background: '#1B34F0' }} /></span>
                        </div>}
                  </div>

                  <div style={{ flex: 1, padding: '14px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.09em', color: '#A6ADCB', textTransform: 'uppercase' }}>Průběh náboru</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {_JB_KROKY.map((_, i) => {
                        const bg = N.obsazeno ? '#0FA968' : i === N.krok ? '#1B34F0' : '#5C71FF';
                        return <span key={i} style={{ flex: 1, height: 8, borderRadius: 999, background: '#EEF1FF', overflow: 'hidden' }}><span style={{ display: 'block', width: (N.plneni[i] * 100) + '%', height: '100%', borderRadius: 999, background: bg, transformOrigin: 'left center', animation: N.plneni[i] ? 'segFill .5s cubic-bezier(.4,0,.2,1) ' + (i * 0.08).toFixed(2) + 's both' : 'none' }} /></span>;
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {_JB_KROKY.map((label, i) => {
                        const reached = i <= N.krok, cur = i === N.krok;
                        return (
                          <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: cur ? 800 : 600, color: reached ? (cur ? '#0B1233' : '#3A4266') : '#A6ADCB', whiteSpace: 'nowrap' }}>{label}</span>
                            <span style={{ fontSize: 11, color: reached ? '#7A82A6' : '#C7CCE3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{N.pod[i]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3 — patička (zachované akce) */}
                <div style={{ padding: '14px 22px', background: '#fff', borderTop: '1px solid #F0F2FA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Stav: přepínač Aktivní / Neaktivní (Yasin 28. 9.) — pozastavení se ještě potvrzuje (dotaz) */}
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#7A82A6' }}>Stav:</span>
                    {l._state === 'filled'
                      ? <span style={{ fontSize: 12.5, fontWeight: 800, color: st.color, background: st.bg, padding: '8px 12px', borderRadius: 9, marginRight: 6 }}>{st.label}</span>
                      : <span style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F3F4F8', borderRadius: 10, padding: 3, marginRight: 6 }}>
                          {/* Jezdec: zelený u Aktivní, červený u Neaktivní (bez teček — Yasin 28. 9.) */}
                          <span aria-hidden="true" style={{ position: 'absolute', top: 3, bottom: 3, left: 3, width: 'calc((100% - 6px) / 2)', borderRadius: 8, background: live ? '#0FA968' : '#E5484D', boxShadow: '0 1px 3px rgba(11,18,51,.15)', transform: live ? 'none' : 'translateX(100%)', transition: 'transform .3s cubic-bezier(.2,.8,.2,1), background-color .3s ease' }} />
                          {[[true, 'Aktivní'], [false, 'Neaktivní']].map(([zap, t]) => {
                            const on = zap === live;
                            return (
                              <button key={t} type="button" onClick={() => vyberStav(l, zap)} style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800, color: on ? '#fff' : '#7A82A6', background: 'transparent', border: 'none', padding: '6px 13px', cursor: on ? 'default' : 'pointer', whiteSpace: 'nowrap', transition: 'color .2s' }}>
                                {t}
                              </button>
                            );
                          })}
                        </span>}
                    <button className="e-det-tl" onClick={() => { window.__empCandJob = l.id; onTab && onTab('candidates'); }} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#3A4266', background: '#fff', border: '1px solid #E6E9F5', padding: '9px 12px', borderRadius: 9, cursor: 'pointer' }}><EIkona src="kandidati.svg" size={16} />Kandidáti{waiting > 0 && <span title="Čekají na vaši odpověď" style={{ fontSize: 11.5, fontWeight: 700, color: '#B96F06', background: '#FFF3E0', padding: '2px 8px', borderRadius: 999, marginLeft: 2 }}>{waiting} čeká</span>}</button>
                    <button className="e-det-tl" onClick={() => setDetailStat(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#3A4266', background: '#fff', border: '1px solid #E6E9F5', padding: '9px 12px', borderRadius: 9, cursor: 'pointer' }}><EIkona src="analytika.svg" size={16} />Statistiky</button>
                    {/* Topovat (dřív „Boostnout" — Yasin 29. 9.) zlatě jako pilulka TOP, kterou topovaný inzerát dostane.
                        Už topovaný ukáže místo tlačítka, jak dlouho ještě. */}
                    {l.boosted && l.topUntil && _jbTopZbyva(l.topUntil)
                      ? <span title={'Topováno do ' + _jbKdyDo(l.topUntil)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#6B4E00', background: '#FFF6D6', border: '1px solid #F6DF8F', padding: '9px 13px', borderRadius: 9, whiteSpace: 'nowrap' }}>TOP · {_jbTopZbyva(l.topUntil)}</span>
                      : <button className="e-zlato" onClick={() => vyberTop(l)} style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 800, padding: '9px 16px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Topovat<span className="e-zlato__lesk" aria-hidden="true" /></button>}
                  </div>

                </div>
              </div>
            );
  };

  return (
    <div className="e-ram" style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '18px 20px 40px' }}>
      <div style={{ background: '#F1F3FB', border: '1px solid #DDE1F0', borderRadius: 22, overflow: 'hidden' }}>

        <ETabHlava title="Inzeráty">
          <EBtnHl onClick={() => onNew && onNew()}>+ Nový inzerát</EBtnHl>
        </ETabHlava>

        {/* Pás čísel — skutečná data z matches. Dřív tu byly „zhlédnutí" a „CTR",
            které DB neměří (vždy 0). */}
        <EMetriky items={[
          // Odkaz na tarify jen když je limit plný — jinak nemá firma důvod
          // tam chodit a nebylo jasné, proč tu je.
          (() => {
            const plno = limit !== Infinity && activeCount >= limit;
            return { l: 'Aktivní inzeráty', v: activeCount + (limit === Infinity ? '' : ' / ' + limit),
              s: overLimit ? 'nad limitem tarifu' : plno ? 'limit tarifu je plný' : limit === Infinity ? 'bez limitu' : 'můžete zapnout ještě ' + (limit - activeCount),
              varovani: overLimit, kam: plno ? 'Navýšit limit' : null, onClick: plno ? () => onTab && onTab('pricing') : undefined };
          })(),
          { l: 'Zájemci', v: skutecne.reduce((a, j) => a + (j.matches || 0), 0), s: 'o všechny inzeráty', kam: 'Kandidáti', onClick: () => onTab && onTab('candidates') },
          { l: 'Čeká na vaši reakci', v: skutecne.reduce((a, j) => a + (j.pending || 0), 0), s: 'noví zájemci', kam: 'Kandidáti', onClick: () => onTab && onTab('candidates') },
          { l: 'Najato', v: hiredTotal, s: 'za celou historii' },
        ]} />

        {detail ? (
          <div style={{ padding: '18px 24px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button type="button" onClick={() => setDetailId(null)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#1B34F0', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer' }}>← Všechny inzeráty</button>
            {/* Vlevo karta tak, jak ji vidí brigádník v appce; vpravo výkon a fáze náboru */}
            <div style={{ display: 'grid', gridTemplateColumns: '330px minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <EJobKartaApp l={detail} nahled />
                <span style={{ fontSize: 12, color: '#A6ADCB', textAlign: 'center' }}>Náhled inzerátu v aplikaci</span>
              </div>
              {detailStat ? <EJobStatistiky l={detail} onZpet={() => setDetailStat(false)} /> : karta(detail)}
            </div>
          </div>
        ) : (
        // Tělo: filtry + seznam
        <div style={{ padding: '22px 24px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Filtrační lišta (28. 9.) — společná komponenta (employer-shell.jsx):
              vlevo skupiny jako v seznamu, vpravo řazení a hledání. */}
          <EFiltrLista vzdyKompakt>
            <EFiltrPrepinac value={tab} onChange={setTab} options={tabs.map(t => ({ k: t.k, l: t.l, n: counts[t.k] }))} />
            <EFiltrVpravo>
              <EFiltrRazeni value={sort} options={_JB_SORTS} onChange={setSort} />
              <EFiltrHledat value={query} onChange={setQuery} placeholder="Hledat inzerát" />
            </EFiltrVpravo>
          </EFiltrLista>

          {/* Inzeráty jako karty z appky (Yasin 28. 9.): firma vidí, jak inzerát
              vypadá u brigádníků; klik otevře detail s fází náboru a čísly. */}
          {list.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="e-jb-scroll" style={{ display: 'grid', gridAutoRows: 'max-content', gap: 14, paddingBottom: 4 }}>
              {skupiny.map(({ g, polozky }, i) => {
                return (
                  <React.Fragment key={g.k}>
                    {nadpisySkupin && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: i ? 12 : 0 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: g.b.c, background: g.b.bg, padding: '5px 12px 5px 10px', borderRadius: 999 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.b.dot, flex: 'none' }} />
                          {g.l}<span style={{ fontWeight: 700, opacity: .65 }}>{polozky.length}</span>
                        </span>
                        {g.k === 'bezi' && urgentnich > 0 && (
                          <>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: _JB_STATES.asap.color, background: _JB_STATES.asap.bg, padding: '5px 12px 5px 10px', borderRadius: 999 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: _JB_STATES.asap.dot, flex: 'none' }} />
                              {urgentnich} urgentní
                            </span>
                            <span style={{ fontSize: 12.5, color: '#7A82A6' }}>směna do 2 dnů</span>
                          </>
                        )}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                      {polozky.map(l => <EJobKartaApp key={l.id} l={l} onOpen={() => setDetailId(l.id)} />)}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            </div>
          )}

          {/* Prázdný stav */}
          {list.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: '56px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0B1233' }}>Žádný inzerát neodpovídá filtru</span>
              <span style={{ fontSize: 14, color: '#7A82A6' }}>Zkuste jiný stav nebo hledaný výraz.</span>
              <span onClick={() => { setTab('all'); setQuery(''); }} style={{ fontSize: 13, fontWeight: 800, color: '#1B34F0', border: '1px solid #D5DAF0', padding: '9px 15px', borderRadius: 9, cursor: 'pointer', marginTop: 6 }}>Zrušit filtry</span>
            </div>
          )}
        </div>
        )}
      </div>

      {statsJob && <JobStatsDrawer job={statsJob} onClose={() => setStatsJob(null)} />}
      {upravuji && <ENewJobModal job={upravuji} onClose={() => setUpravuji(null)} onPublish={ulozUpravu} />}

      {/* Okno jde přes portál rovnou do <body> — uvnitř záložky by ho animace
          rámu (transform) svázala s rámem a pozadí by nepřekrylo celou stránku.
          Stránka pod ním zůstává vidět, jen rozmazaná. */}
      {dotaz && ReactDOM.createPortal(
        <div onClick={() => !ukladam && setDotaz(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(11,18,51,.18)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'eDotazIn .18s ease-out' }}>
          <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{ width: 440, maxWidth: '100%', background: '#fff', borderRadius: 18, boxShadow: '0 30px 80px -20px rgba(11,18,51,.45)', padding: '26px 26px 22px' }}>
            {dotaz.druh === 'top' ? (
              // Topování (Yasin 29. 9.): zeptat se, vysvětlit, co to udělá, a kolik jich zbývá
              topLimit === 0 || topZbyva === 0 ? (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', marginBottom: 10 }}>{topLimit === 0 ? 'Topování není ve vašem tarifu' : 'Topování na tento měsíc došla'}</div>
                  <div style={{ fontSize: 14, color: '#3A4266', lineHeight: 1.55, marginBottom: 22 }}>
                    {topLimit === 0
                      ? 'Topovaný inzerát je ' + topHodin + ' hodin v aplikaci mezi prvními kartami. Topování máte od tarifu Výhodný (1× měsíčně).'
                      : 'Tarif ' + tarifNazev + ' má ' + topLimit + '× topování měsíčně a tento měsíc jste je už využili. Nová přibudou ' + dalsiMesic + ', víc jich mají vyšší tarify.'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <EBtnSek onClick={() => setDotaz(null)}>Zavřít</EBtnSek>
                    <EBtnHl onClick={() => { setDotaz(null); onTab && onTab('pricing'); }}>Navýšit tarif</EBtnHl>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', marginBottom: 4 }}>Opravdu chcete inzerát topovat?</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#7A82A6', marginBottom: 14 }}>{dotaz.job.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {[
                      'Na ' + topHodin + ' hodin ho brigádníci uvidí mezi prvními kartami — v každém filtru, do kterého inzerát spadá.',
                      'Dostane zlatou pilulku TOP, takže se odliší i od ostatních karet.',
                      'Po ' + topHodin + ' hodinách se sám vrátí mezi ostatní inzeráty.',
                    ].map(t => (
                      <div key={t} style={{ display: 'grid', gridTemplateColumns: '8px 1fr', columnGap: 12, alignItems: 'start' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F2B418', marginTop: 8 }} />
                        <span style={{ fontSize: 14, color: '#3A4266', lineHeight: 1.55 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#FFF8E1', border: '1px solid #F6E3A1', borderRadius: 12, padding: '11px 14px', marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, color: '#3A4266' }}>Tento měsíc vám zbývá <b style={{ color: '#0B1233' }}>{topZbyva} z {topLimit}</b> topování{topZbyva === 1 ? ' — tohle bude poslední' : ''}</span>
                    <span style={{ fontSize: 12.5, color: '#7A82A6' }}>{tarifNazev ? 'Tarif ' + tarifNazev + ' · ' : ''}nová přibudou {dalsiMesic}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <EBtnSek onClick={() => setDotaz(null)} disabled={ukladam}>Zrušit</EBtnSek>
                    <button className="e-zlato" onClick={() => potvrdTop(dotaz.job)} disabled={ukladam} style={{ display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 800, padding: '10px 18px', borderRadius: 10, cursor: ukladam ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{ukladam ? 'Topuji…' : 'Topovat na ' + topHodin + ' h'}<span className="e-zlato__lesk" aria-hidden="true" /></button>
                  </div>
                </>
              )
            ) : dotaz.druh === 'pauza' ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', marginBottom: 10 }}>Pozastavit inzerát?</div>
                {/* Body: modrá tečka vlevo, text zarovnaný ve sloupci i na druhém řádku */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  {[
                    'Inzerát bude pozastaven a nebude možné o něj projevit zájem.',
                    'Všechna nasbíraná data a informace spojené s inzerátem zůstanou uložené.',
                    'Kdykoli ho můžete znovu zapnout, stejně jako teď.',
                  ].map(t => (
                    <div key={t} style={{ display: 'grid', gridTemplateColumns: '8px 1fr', columnGap: 12, alignItems: 'start' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1B34F0', marginTop: 8 }} />
                      <span style={{ fontSize: 14, color: '#3A4266', lineHeight: 1.55 }}>{t}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <EBtnSek onClick={() => setDotaz(null)} disabled={ukladam}>Nechat aktivní</EBtnSek>
                  <EBtnHl onClick={() => zmenStav(dotaz.job, false)} disabled={ukladam}>{ukladam ? 'Ukládám…' : 'Pozastavit inzerát'}</EBtnHl>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em', marginBottom: 10 }}>Limit aktivních inzerátů je plný</div>
                <div style={{ fontSize: 14, color: '#3A4266', lineHeight: 1.55, marginBottom: 22 }}>
                  Váš tarif dovoluje {limit} {limit === 1 ? 'aktivní inzerát' : limit <= 4 ? 'aktivní inzeráty' : 'aktivních inzerátů'} najednou a všechny jsou obsazené. Pozastavte jiný inzerát, nebo si zvyšte tarif.
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <EBtnSek onClick={() => setDotaz(null)}>Zavřít</EBtnSek>
                  <EBtnHl onClick={() => { setDotaz(null); onTab && onTab('pricing'); }}>Navýšit limit</EBtnHl>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
Object.assign(window, { EJobKartaApp, EJobDetailApp, EJobs });


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
    cover_url: P.cover_url || '',
    ig: (P.socials && P.socials.instagram) || '',
    fb: (P.socials && P.socials.facebook) || '',
    li: (P.socials && P.socials.linkedin) || '',
    tt: (P.socials && P.socials.tiktok) || '',
    photos: Array.isArray(P.photos) ? P.photos.slice() : [],
  });
  // Profil firmy má od 26. 9. vlastní záložku (employer-firma.jsx) — tady už jen nastavení.
  const [seg, setSeg] = React.useState('notif');
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
    { key: 'cover',    label: 'fotku pozadí',      done: !!form.cover_url },
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
      const zaklad = {
        company_name: form.name, ic: form.ico, industry: form.industry, bio: form.desc,
        website: form.web, address: form.addr, chat_rules: form.rules,
        avatar_url: form.avatar_url, logo_url: form.logo_url,
        socials: { instagram: form.ig, facebook: form.fb, linkedin: form.li, tiktok: form.tt },
        photos: form.photos.filter(u => u && u.trim()),
        branding: { color: form.brand },
      };
      ok = await updateEmployerProfile({ ...zaklad, cover_url: form.cover_url });
      // Sloupec profiles.cover_url zatím nemusí v databázi být (migrace
      // supabase/migration_cover_firmy.sql čeká na Sama). Pak se uloží
      // aspoň všechno ostatní a firma se to dozví.
      if (!ok && form.cover_url) {
        ok = await updateEmployerProfile(zaklad);
        if (ok) { setSaving(false); setDirty(false); setToast('cover-db'); setTimeout(() => setToast(null), 4200); return; }
      }
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
  const rmPhoto = i => { setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) })); setDirty(true); };

  const fBorder = key => flash === key ? '#F5920B' : '#E6E9F5';
  const label = t => <span style={{ fontSize: 12, fontWeight: 700, color: '#3A4266' }}>{t}</span>;
  const inp = { fontSize: 14, fontWeight: 600, color: '#0B1233', background: '#F6F7FC', borderRadius: 10, padding: '12px 14px', outline: 'none', width: '100%' };
  const cardBase = { background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 18 };
  const secLabel = { fontSize: 16, fontWeight: 800, color: '#0B1233' };
  const brandGrad = 'linear-gradient(120deg, ' + form.brand + ' 0%, ' + form.brand + '99 60%, #F6F7FC 100%)';

  return (
    <div className="e-ram" style={{ width: '100%', maxWidth: 1180, margin: '0 auto', padding: '18px 20px 40px' }}>
      <div style={{ background: '#F1F3FB', border: '1px solid #DDE1F0', borderRadius: 22, overflow: 'hidden' }}>

        <ETabHlava title="Nastavení">
          <EBtnSek onClick={() => onTab && onTab('company')}>Upravit profil firmy</EBtnSek>
        </ETabHlava>

        {/* Tělo */}
        <div style={{ padding: '22px 24px 26px', display: 'grid', gridTemplateColumns: '262px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Levá navigace */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 22 }}>
            <div style={{ background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {_ST_NAV.filter(t => t.k !== 'profile').map(t => {
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

          </div>

          {/* Obsah sekce */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
        <div style={{ position: 'fixed', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 80, background: (toast === 'err' || toast === 'upload-err') ? '#B3261E' : '#0B1233', color: '#fff', fontSize: 13, fontWeight: 700, padding: '12px 18px', borderRadius: 11, boxShadow: '0 14px 34px -10px rgba(11,18,51,.5)' }}>
          {toast === 'ok' ? 'Profil uložen' : toast === 'err' ? 'Uložení se nezdařilo, zkuste to znovu' : toast === 'verify' ? 'Žádost o ověření odeslána — ozveme se e-mailem.' : toast === 'export' ? 'Export se připravuje, přijde e-mailem.' : toast === 'dpa' ? 'Zpracovatelská smlouva odeslána e-mailem.' : toast === 'pause' ? 'Profil byl pozastaven.' : toast === 'deleted' ? 'Žádost o smazání přijata — účet odstraníme do 24 h.' : toast === 'upload-err' ? 'Fotku se nepodařilo nahrát, zkuste to znovu' : toast === 'cover-db' ? 'Profil uložen. Fotka pozadí se začne ukládat po úpravě databáze.' : ''}
        </div>
      )}
    </div>
  );
}
Object.assign(window, { ESettings });


/* ============================================================
   NOVÝ / UPRAVIT INZERÁT (ENewJobModal) — 28. 9. přestavěno podle appky
   ------------------------------------------------------------
   Formulář má PŘESNĚ ta pole, která appka brigádníka ukáže nebo podle
   nich filtruje (WJobCard + WJobDetailModal ve www/worker-swipe.jsx,
   jobToCard ve www/worker-supabase.jsx). Nic navíc — dřív tu byly obory,
   „Kde se pracuje", platnost, kontaktní osoba… které se nikam neukládaly.
   Kroky kopírují pořadí detailu v appce:
     1 Pozice a odměna  → titulek, smlouva (→ štítek úvazku), pravidelnost,
                          odměna, výplata, počet míst
     2 Kdy a kde        → datum, čas, adresa, kraj (filtr v appce)
     3 Náplň práce      → description, expectations, bonuses, offer
     4 Benefity a štítky→ perks, requirements („Co potřebuješ"), tags
   Vlevo náhled: Karta ↔ Celý inzerát (EJobKartaApp / EJobDetailApp).
   Uložení: onPublish(fields) → createJobE / updateJobE (employer-supabase.jsx).
   ============================================================ */
// „Dohodou" = firma smlouvu neuvádí: do jobs.contract jde text „Dohodou", appka ho
// nezná jako typ smlouvy → na kartě „Dle domluvy", ve filtru smlouvy se neukáže
// a v detailu je na dlaždici Smlouva doslova „Dohodou" (29. 9.)
const _NJ_SMLOUVY = [
  { k: 'DPP', l: 'DPP', n: 'dohoda o provedení práce' },
  { k: 'DPČ', l: 'DPČ', n: 'dohoda o pracovní činnosti' },
  { k: 'HPP', l: 'Pracovní smlouva', n: 'plný nebo kratší úvazek' },
  { k: 'IČO', l: 'IČO', n: 'na živnostenský list' },
  { k: 'Dohodou', l: 'Dohodou', n: 'neuvádět — na kartě „Dle domluvy"', oddel: true },
];
// Hodnoty se musí shodovat s filtrem v appce (W_FILTERS ve worker-swipe.jsx)
const _NJ_PRAVIDELNOST = ['Jednorázová', 'Pravidelná'];
const _NJ_VYPLATA = ['Hned po akci', 'Týdně', 'Do 14 dní', 'Měsíčně'];
const _NJ_UNITS = ['Kč/h', 'Kč/den', 'Kč/měs'];
const _NJ_ZOOM = 348 / 375;   // celý inzerát: šířka telefonu → šířka panelu náhledu
const _NJ_TITLE_HINTS = ['Barista', 'Skladník', 'Hosteska', 'Kuchař', 'Uklízečka', 'Pomocná síla'];
const _NJ_KRAJE = typeof KRAJE_E !== 'undefined' ? KRAJE_E : [
  { id: 'praha', name: 'Praha' }, { id: 'stredocesky', name: 'Středočeský' }, { id: 'jihocesky', name: 'Jihočeský' },
  { id: 'plzensky', name: 'Plzeňský' }, { id: 'karlovarsky', name: 'Karlovarský' }, { id: 'ustecky', name: 'Ústecký' },
  { id: 'liberecky', name: 'Liberecký' }, { id: 'kralovehradecky', name: 'Královéhradecký' }, { id: 'pardubicky', name: 'Pardubický' },
  { id: 'vysocina', name: 'Vysočina' }, { id: 'jihomoravsky', name: 'Jihomoravský' }, { id: 'olomoucky', name: 'Olomoucký' },
  { id: 'zlinsky', name: 'Zlínský' }, { id: 'moravskoslezsky', name: 'Moravskoslezský' },
];
// Rychlé návrhy — texty ve stylu ukázkových inzerátů v appce (www/app.jsx)
const _NJ_NAVRHY = {
  cekame: ['Spolehlivost a dochvilnost', 'Příjemné vystupování', 'Zvládneš celý den na nohou', 'Věk 18+'],
  ocenime: ['Zkušenost z oboru', 'Angličtina', 'Řidičák sk. B'],
  nabidneme: ['Zaučíme tě', 'Férový přístup a pohodový tým', 'Flexibilní domluva směn', 'Možnost dlouhodobé spolupráce'],
  benefity: ['Káva zdarma', 'Jídlo na směně', 'Doprava zdarma', 'Nástup ihned', 'Sleva na zboží', 'Týmovka'],
  potrebujes: ['Čeština', 'Angličtina', 'Řidičák sk. B', 'Zdravotní průkaz', 'Vlastní auto', 'Pracovní obuv'],
  // Vlastnosti se ukazují i na kartě (první 4). „Bez zkušeností", „Pro studenty",
  // „Od 15 let" a „Zaučíme" chytá i filtr Pro koho v appce.
  vlastnosti: ['Ranní směna', 'Odpolední směna', 'Noční směna', 'Víkendy', 'Bez zkušeností', 'Pro studenty', 'Od 15 let', 'Zaučíme', 'Práce s lidmi', 'Fyzická práce', 'Venku'],
};
const _NJ_TIME_PRESETS = [
  { label: '6:00–14:00', from: '06:00', to: '14:00' }, { label: '10:00–18:00', from: '10:00', to: '18:00' },
  { label: '14:00–22:00', from: '14:00', to: '22:00' }, { label: '18:00–02:00', from: '18:00', to: '02:00' },
];
const _NJ_DAYS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];
const _NJ_DESC_TEMPLATES = {
  default: 'Postaráš se o hladký průběh směny — příprava, obsluha a úklid pracoviště. Zaučíme tě na místě, stačí chuť pracovat a přijít včas.',
  Barista: 'Připravíš espresso a filtrovanou kávu, obsloužíš hosty u baru a udržíš pracoviště v čistotě. Zkušenost s pákovým strojem oceníme, ale zaučíme i začátečníka.',
  'Skladník': 'Naskladníš a vychystáš zboží, zkontroluješ objednávky a udržíš pořádek ve skladu. Práce ve dvojici, součástí je i manipulace s paletovým vozíkem.',
  'Kuchař': 'Připravíš pokrmy podle receptur, ohlídáš teploty a čistotu pracoviště. Vaříme z čerstvých surovin, na směně jsou vždy dva kuchaři.',
};
const _njMins = t => { const m = /^(\d{1,2}):(\d{2})$/.exec((t || '').trim()); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const _njCustomISO = s => { const m = /(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{2,4})/.exec(s || ''); if (!m) return ''; let y = m[3]; if (y.length === 2) y = '20' + y; return y + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0'); };
const _njChip = on => on ? { color: '#fff', bg: '#1B34F0', border: '#1B34F0' } : { color: '#3A4266', bg: '#fff', border: '#E6E9F5' };
// Starší inzeráty měly smlouvu jen v requirements („Smluvní vztah: …") a kraj jako název
const _njSmlouvaZ = v => { if (/^\s*(dohodou|dle domluvy)\s*$/i.test(v || '')) return 'Dohodou'; const k = _jbSmlouvaKod(v); return k === 'DPC' ? 'DPČ' : k === 'ICO' ? 'IČO' : k; };
const _njKrajId = v => { if (!v) return null; const k = _NJ_KRAJE.find(x => x.id === v || x.name === v); return k ? k.id : null; };

// Seznam řádků (Co od tebe čekáme / Co oceníme / Co ti nabídneme) — v appce odrážky.
// V okně jako řádek „bublin" (přidané modře, návrhy čárkovaně), ať se vejdou tři vedle sebe.
function _NjSeznam({ items, setItems, navrhy, placeholder, onFocus }) {
  const [txt, setTxt] = React.useState('');
  const pridej = t => { const v = String(t || '').trim(); if (!v || items.includes(v)) return; setItems(items.concat(v)); };
  // Návrhy jen dokud je seznam skoro prázdný — pak by jen zabíraly místo
  const volne = items.length >= 3 ? [] : (navrhy || []).filter(n => !items.includes(n)).slice(0, items.length ? 2 : 3);
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }} onFocus={onFocus}>
      {items.map((d, i) => (
        <span key={d + i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, maxWidth: '100%', fontSize: 12.5, fontWeight: 600, color: '#0B1233', background: '#EEF1FF', border: '1px solid #D9DEFA', borderRadius: 9, padding: '4px 4px 4px 10px' }}>
          <span style={{ minWidth: 0, overflowWrap: 'break-word' }}>{d}</span>
          <span className="nj-x" role="button" aria-label="Odebrat" onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ width: 20, height: 20, borderRadius: 6, fontSize: 10, fontWeight: 800, color: '#7A82A6', cursor: 'pointer', flex: 'none', display: 'grid', placeItems: 'center' }}>✕</span>
        </span>
      ))}
      {volne.map(n => <span key={n} className="nj-chip" onClick={() => pridej(n)} style={{ fontSize: 12, fontWeight: 700, color: '#5B6488', background: '#fff', border: '1px dashed #C9D0EE', padding: '5px 10px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ {n}</span>)}
      <span className="nj-inp" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 9, padding: '0 3px 0 10px' }}>
        <input value={txt} onChange={e => setTxt(e.target.value.slice(0, 120))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); pridej(txt); setTxt(''); } }} placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: '#0B1233', background: 'transparent', border: 'none', padding: '7px 0', outline: 'none' }} />
        <span className={txt.trim() ? 'nj-hl' : undefined} onClick={() => { pridej(txt); setTxt(''); }} style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: txt.trim() ? '#1B34F0' : '#C3C9E0', padding: '4px 9px', borderRadius: 7, cursor: txt.trim() ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>Přidat</span>
      </span>
    </div>
  );
}

// Štítky (Benefity / Co potřebuješ / Vlastnosti) — návrhy k zakliknutí + vlastní
function _NjStitky({ items, setItems, navrhy, onFocus, placeholder }) {
  const [txt, setTxt] = React.useState('');
  const vsechny = navrhy.concat(items.filter(x => !navrhy.includes(x)));
  const prepni = v => setItems(items.includes(v) ? items.filter(x => x !== v) : items.concat(v));
  const pridej = () => { const v = txt.trim(); if (v && !items.includes(v)) setItems(items.concat(v)); setTxt(''); };
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }} onFocus={onFocus} onClick={onFocus}>
      {vsechny.map(v => { const on = items.includes(v); return <span key={v} className="nj-chip" data-on={on || undefined} onClick={() => prepni(v)} style={{ fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', color: on ? '#fff' : '#3A4266', background: on ? '#1B34F0' : '#fff', border: '1px solid ' + (on ? '#1B34F0' : '#E6E9F5'), whiteSpace: 'nowrap' }}>{on ? '✓ ' : '+ '}{v}</span>; })}
      <span className="nj-inp" style={{ display: 'inline-flex', alignItems: 'center', background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 999, padding: '0 4px 0 12px' }}>
        <input value={txt} onChange={e => setTxt(e.target.value.slice(0, 40))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); pridej(); } }} placeholder={placeholder || 'Vlastní…'} style={{ width: 110, fontSize: 12, fontWeight: 600, color: '#0B1233', background: 'transparent', border: 'none', padding: '7px 0', outline: 'none' }} />
        <span className={txt.trim() ? 'nj-hl' : undefined} onClick={pridej} style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: txt.trim() ? '#1B34F0' : '#C3C9E0', padding: '4px 9px', borderRadius: 999, cursor: txt.trim() ? 'pointer' : 'default' }}>Přidat</span>
      </span>
    </div>
  );
}

// Fotky provozu (jobs.photos) — v appce galerie v detailu, PRVNÍ fotka je i na kartě.
// Nahrání: zmenšit → bucket `uploads` (uploadImageE) → URL. Pořadí: přetažení myší
// nebo šipkami ‹ ›. Fotky jde vzít i z profilu firmy. Soubory jde pustit i přímo sem.
const _NJ_MAX_FOTEK = 8;
function _NjFotky({ fotky, setFotky, onFocus }) {
  const [nahravam, setNahravam] = React.useState(0);
  const [tahnu, setTahnu] = React.useState(null);
  const [nad, setNad] = React.useState(null);
  const vstup = React.useRef(null);
  const P = typeof EPROFILE !== 'undefined' ? EPROFILE : {};
  const zProfilu = [P.cover_url].concat(Array.isArray(P.photos) ? P.photos : []).filter(u => u && !fotky.includes(u));
  const volno = _NJ_MAX_FOTEK - fotky.length;
  async function nahraj(seznam) {
    const files = Array.from(seznam || []).filter(f => /^image\//.test(f.type)).slice(0, volno);
    if (!files.length || typeof uploadImageE !== 'function' || typeof sb === 'undefined') return;
    if (onFocus) onFocus();
    setNahravam(files.length);
    const { data } = await sb.auth.getSession();
    const uid = data && data.session && data.session.user && data.session.user.id;
    let ok = 0;
    for (const f of files) {
      const u = await uploadImageE(uid, 'inzerat-foto', f, 1600);
      if (u) { ok++; setFotky(fs => fs.includes(u) ? fs : fs.concat(u).slice(0, _NJ_MAX_FOTEK)); }
      setNahravam(n => Math.max(0, n - 1));
    }
    setNahravam(0);
    if (ok < files.length && window.empToast) window.empToast('Nepovedlo se', 'Některou fotku se nepodařilo nahrát, zkuste to prosím znovu.', '⚠️', 'error');
  }
  const presun = (z, na) => { if (z === na || na < 0 || na >= fotky.length) return; setFotky(fs => { const a = fs.slice(); const [x] = a.splice(z, 1); a.splice(na, 0, x); return a; }); if (onFocus) onFocus(); };
  const sipka = (znak, kam, i) => <span className="nj-foto-akce nj-x" role="button" aria-label={znak === '‹' ? 'Posunout dopředu' : 'Posunout dozadu'} onClick={e => { e.stopPropagation(); presun(i, kam); }} style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,.92)', color: '#0B1233', fontSize: 14, fontWeight: 800, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>{znak}</span>;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'stretch' }}
      onDragOver={e => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) e.preventDefault(); }}
      onDrop={e => { if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { e.preventDefault(); nahraj(e.dataTransfer.files); } }}>
      <input ref={vstup} type="file" accept="image/*" multiple hidden onChange={e => { nahraj(e.target.files); e.target.value = ''; }} />
      {fotky.map((u, i) => (
        <div key={u} className="nj-foto" draggable
          onDragStart={e => { setTahnu(i); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (x) {} }}
          onDragEnter={() => tahnu !== null && setNad(i)}
          onDragOver={e => { if (tahnu !== null) e.preventDefault(); }}
          onDrop={e => { if (tahnu !== null) { e.preventDefault(); e.stopPropagation(); presun(tahnu, i); } setTahnu(null); setNad(null); }}
          onDragEnd={() => { setTahnu(null); setNad(null); }}
          style={{ position: 'relative', width: 104, height: 78, flex: 'none', borderRadius: 11, overflow: 'hidden', background: '#EEF1FF', cursor: 'grab', opacity: tahnu === i ? .45 : 1, outline: nad === i && tahnu !== i ? '2px solid #1B34F0' : 'none', outlineOffset: 2 }}>
          <img src={u} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
          {i === 0 && <span style={{ position: 'absolute', left: 6, bottom: 6, fontSize: 10, fontWeight: 800, color: '#fff', background: '#1B34F0', padding: '3px 7px', borderRadius: 999 }}>Na kartě</span>}
          <span className="nj-foto-akce nj-x" role="button" aria-label="Odebrat fotku" onClick={e => { e.stopPropagation(); setFotky(fs => fs.filter(x => x !== u)); }} style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 7, background: 'rgba(255,255,255,.92)', color: '#3A4266', fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>✕</span>
          <span style={{ position: 'absolute', right: 5, bottom: 5, display: 'flex', gap: 3 }}>
            {i > 0 && sipka('‹', i - 1, i)}
            {i < fotky.length - 1 && sipka('›', i + 1, i)}
          </span>
        </div>
      ))}
      {Array.from({ length: nahravam }).map((_, i) => <div key={'n' + i} style={{ width: 104, height: 78, flex: 'none', borderRadius: 11, background: '#F3F4F8', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: '#7A82A6' }}>Nahrávám…</div>)}
      {volno - nahravam > 0 && (
        <div className="nj-typ" onClick={() => vstup.current && vstup.current.click()} style={{ width: 104, height: 78, flex: 'none', borderRadius: 11, border: '1.5px dashed #C9D0EE', background: '#FBFCFE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}>
          <span style={{ fontSize: 20, lineHeight: 1, color: '#1B34F0', fontWeight: 700 }}>+</span>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#1B34F0' }}>Přidat fotky</span>
          <span style={{ fontSize: 10, color: '#A6ADCB' }}>{fotky.length} / {_NJ_MAX_FOTEK}</span>
        </div>
      )}
      {zProfilu.length > 0 && volno > 0 && (
        <span className="nj-chip" onClick={() => { setFotky(fs => fs.concat(zProfilu.filter(u => !fs.includes(u))).slice(0, _NJ_MAX_FOTEK)); if (onFocus) onFocus(); }} style={{ alignSelf: 'center', fontSize: 12, fontWeight: 700, color: '#5B6488', background: '#fff', border: '1px dashed #C9D0EE', padding: '7px 11px', borderRadius: 9, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Z profilu firmy ({zProfilu.length})</span>
      )}
    </div>
  );
}

// Roletka (29. 9.) — místo velkých dlaždic a řad čipů u polí s víc možnostmi
// (Smlouva, Výplata, Kraj). Seznam se kreslí do body (position: fixed), ať ho
// neořízne posouvatelné tělo okna; když se dolů nevejde, otevře se nahoru.
// moznosti: [{ k, l, n?, oddel? }] — n = šedý popis pod názvem, oddel = čára nad
// položkou (odděluje „Dohodou" / „Neuvádět" od skutečných voleb).
function _NjRoletka({ value, onChange, moznosti, placeholder, chyba, onOpen, maxVyska = 300 }) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState(null);
  const [hl, setHl] = React.useState(-1);
  const btn = React.useRef(null), list = React.useRef(null);
  const vybrana = moznosti.find(m => m.k === value);
  const zavri = () => { setOpen(false); setHl(-1); };
  const otevri = () => {
    const r = btn.current.getBoundingClientRect();
    const odhad = Math.min(maxVyska, moznosti.reduce((s, m) => s + (m.n ? 50 : 37) + (m.oddel ? 9 : 0), 12));
    const dolu = window.innerHeight - r.bottom - 12 >= odhad || r.top < odhad + 12;
    setPos({ left: r.left, width: Math.max(r.width, 220), dolu, ...(dolu ? { top: r.bottom + 6 } : { bottom: window.innerHeight - r.top + 6 }) });
    setHl(Math.max(0, moznosti.findIndex(m => m.k === value)));
    setOpen(true);
    if (onOpen) onOpen();
  };
  const vyber = m => { onChange(m.k); zavri(); if (btn.current) btn.current.focus(); };
  React.useEffect(() => {
    if (!open) return;
    const venku = e => { if (!btn.current.contains(e.target) && !(list.current && list.current.contains(e.target))) zavri(); };
    const posun = e => { if (!(list.current && list.current.contains(e.target))) zavri(); };
    document.addEventListener('mousedown', venku, true);
    window.addEventListener('scroll', posun, true);
    window.addEventListener('resize', zavri);
    // U dlouhého seznamu (Kraj) je vybraná položka hned na očích
    const sel = list.current && list.current.querySelector('[data-on]');
    if (sel) list.current.scrollTop = sel.offsetTop - list.current.clientHeight / 2 + sel.offsetHeight / 2;
    return () => { document.removeEventListener('mousedown', venku, true); window.removeEventListener('scroll', posun, true); window.removeEventListener('resize', zavri); };
  }, [open]);
  const klavesa = e => {
    if (!open) { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); otevri(); } return; }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); zavri(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setHl(i => Math.min(moznosti.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHl(i => Math.max(0, i - 1)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (moznosti[hl]) vyber(moznosti[hl]); }
    else if (e.key === 'Tab') zavri();
  };
  const plna = vybrana && vybrana.k;
  return (
    <>
      <button ref={btn} type="button" className="nj-inp" aria-haspopup="listbox" aria-expanded={open} onClick={() => open ? zavri() : otevri()} onKeyDown={klavesa}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', background: open ? '#fff' : '#F6F7FC', border: '1px solid ' + (open ? '#1B34F0' : chyba || (plna ? '#E6E9F5' : '#D5DAF0')), boxShadow: open ? '0 0 0 3px rgba(27,52,240,.12)' : 'none', borderRadius: 11, padding: '10px 12px 10px 14px' }}>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 15, fontWeight: plna ? 700 : 500, color: plna ? '#0B1233' : '#8A91B0' }}>{vybrana ? vybrana.l : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flex: 'none', color: open ? '#1B34F0' : '#7A82A6', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s cubic-bezier(.2,.8,.2,1), color .16s' }}><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && pos && ReactDOM.createPortal(
        <div ref={list} role="listbox" style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, zIndex: 260, maxHeight: maxVyska, overflowY: 'auto', boxSizing: 'border-box', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 12, boxShadow: '0 18px 40px -14px rgba(20,22,40,.3)', padding: 5, transformOrigin: pos.dolu ? 'top center' : 'bottom center', animation: 'njRolIn .16s cubic-bezier(.2,.8,.2,1) both' }}>
          {moznosti.map((m, i) => {
            const on = m.k === value, nad = i === hl;
            return (
              <React.Fragment key={m.k || '-'}>
                {m.oddel && <div style={{ height: 1, background: '#EEF0F6', margin: '4px 6px' }} />}
                <div role="option" aria-selected={on} data-on={on || undefined} onMouseEnter={() => setHl(i)} onClick={() => vyber(m)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: on ? (nad ? '#E2E7FF' : '#EEF1FF') : nad ? '#F4F6FB' : 'transparent', transition: 'background-color .12s ease' }}>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: on ? '#1B34F0' : '#0B1233' }}>{m.l}</span>
                    {m.n && <span style={{ fontSize: 11.5, color: '#7A82A6', lineHeight: 1.35 }}>{m.n}</span>}
                  </span>
                  {on && <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ flex: 'none', color: '#1B34F0' }}><path d="M3 7.5l2.6 2.5L11 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
              </React.Fragment>
            );
          })}
        </div>, document.body)}
    </>
  );
}

function ENewJobModal({ onClose, onPublish, job } = {}) {
  const DRAFT_KEY = 'makej-emp-jobdraft2';
  const upravit = !!job;
  const J = job || {};
  const _jTimes = (J.timeText ? J.timeText.split(/\s*[–-]\s*/) : []);
  // Starší inzeráty: smlouva a počet lidí jen v requirements
  const _reqStare = Array.isArray(J.requirements) ? J.requirements : [];
  const _smlZReq = (_reqStare.find(r => /^smluvní vztah/i.test(r)) || '').replace(/^smluvní vztah:\s*/i, '').replace(/\s*\/\s*faktura/i, '');
  const _lidiZReq = Number(((_reqStare.find(r => /^hledáme/i.test(r)) || '').match(/\d+/) || [])[0]) || 0;

  const [step, setStep] = React.useState(1);
  const [tried, setTried] = React.useState(false);
  const [shake, setShake] = React.useState(0);
  const [title, setTitle] = React.useState(J.title || '');
  const [contract, setContract] = React.useState(_njSmlouvaZ(J.contract || _smlZReq) || (upravit ? '' : 'DPP'));
  const [hodinTydne, setHodinTydne] = React.useState(J.hoursPerWeek ? String(J.hoursPerWeek) : '40');
  const [recurrence, setRecurrence] = React.useState(J.recurrence || (J.jobType === 'jednrazova_vypomoc' ? 'Jednorázová' : upravit ? '' : 'Jednorázová'));
  const [pay, setPay] = React.useState(J.pay ? String(J.pay) : '');
  const [unit, setUnit] = React.useState(J.payUnit || 'Kč/h');
  const [payout, setPayout] = React.useState(J.payout || '');
  const [people, setPeople] = React.useState(J.positions || _lidiZReq || 1);
  const [datePreset, setDatePreset] = React.useState(null);
  const [dateISO, setDateISO] = React.useState(/^\d{4}-\d{2}-\d{2}$/.test(J.date || '') ? J.date : '');
  // U úpravy: datum mimo nejbližší 4 dny se ukáže v poli „nebo" (jinak se rozsvítí předvolba)
  const [dateCustom, setDateCustom] = React.useState(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(J.date || ''); if (!m) return '';
    const dny = Math.round((new Date(+m[1], +m[2] - 1, +m[3]) - new Date(new Date().toDateString())) / 86400000);
    return dny >= 0 && dny < 4 ? '' : (+m[3]) + '. ' + (+m[2]) + '. ' + m[1];
  });
  const [from, setFrom] = React.useState(_jTimes[0] || '');
  const [to, setTo] = React.useState(_jTimes[1] || '');
  const [place, setPlace] = React.useState(J.location || '');
  const [region, setRegion] = React.useState(_njKrajId(J.kraj));
  const [desc, setDesc] = React.useState(J.duties || J.description || '');
  const [expectations, setExpectations] = React.useState(Array.isArray(J.expectations) ? J.expectations : []);
  const [bonuses, setBonuses] = React.useState(Array.isArray(J.bonuses) ? J.bonuses : []);
  const [offer, setOffer] = React.useState(Array.isArray(J.offer) ? J.offer : []);
  const [perks, setPerks] = React.useState(Array.isArray(J.perks) ? J.perks : []);
  const [requirements, setRequirements] = React.useState(_reqStare.filter(r => !/^smluvní vztah/i.test(r) && !/^hledáme/i.test(r)).map(r => r.replace(/^(jazyk|vhodné pro):\s*/i, '')));
  const [tags, setTags] = React.useState(Array.isArray(J.tags) ? J.tags.slice(0, 12) : []);
  // Fotky: galerie inzerátu; starší inzerát mohl mít jen jednu fotku v image_url
  const [photos, setPhotos] = React.useState(() => { const f = (Array.isArray(J.photos) ? J.photos : []).filter(Boolean); return f.length ? f : (J.image ? [J.image] : []); });
  const [sekce, setSekce] = React.useState(null);          // co firma právě vyplňuje → náhled tam doroluje
  const [pohledRucne, setPohledRucne] = React.useState(null);
  const [tw, setTw] = React.useState({ idx: 0, len: 0, back: false, hold: 0, caret: true });
  const [busy, setBusy] = React.useState(false);
  // Import z odkazu / textu (Edge Function import-inzerat)
  const [imp, setImp] = React.useState({ otevreno: false, druh: 'odkaz', url: '', text: '', styl: 'makej', nacitam: false, chyba: '' });
  const [impInfo, setImpInfo] = React.useState(null);   // { odkud, upozorneni[] } — pruh v 1. kroku

  // Náhled sleduje krok (1–2 karta, 3–4 celý inzerát), dokud ho firma nepřepne sama
  React.useEffect(() => { setPohledRucne(null); setSekce({ k: ['zaklad', 'fakta', 'napln', 'benefity'][step - 1], hned: true }); }, [step]);
  const pohled = pohledRucne || (step >= 3 ? 'cely' : 'karta');

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

  // Rozpracovaný koncept (jen u nového inzerátu)
  const draftObj = () => ({ title, contract, hodinTydne, recurrence, pay, unit, payout, people, datePreset, dateISO, dateCustom, from, to, place, region, desc, expectations, bonuses, offer, perks, requirements, tags, photos });
  React.useEffect(() => {
    if (upravit) return;
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!d || typeof d !== 'object') return;
      const set = { title: setTitle, contract: setContract, hodinTydne: setHodinTydne, recurrence: setRecurrence, pay: setPay, unit: setUnit, payout: setPayout, people: setPeople, datePreset: setDatePreset, dateISO: setDateISO, dateCustom: setDateCustom, from: setFrom, to: setTo, place: setPlace, region: setRegion, desc: setDesc, expectations: setExpectations, bonuses: setBonuses, offer: setOffer, perks: setPerks, requirements: setRequirements, tags: setTags, photos: setPhotos };
      Object.keys(set).forEach(k => { if (d[k] != null && d[k] !== '') set[k](d[k]); });
    } catch (e) {}
  }, []);
  const saveDraft = () => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draftObj())); } catch (e) {} if (window.empToast) window.empToast('Uloženo', 'Rozpracovaný inzerát je uložený, můžete se k němu vrátit.', '', 'ok'); };

  const hpp = _jbSmlouvaKod(contract) === 'HPP';
  const hodinNum = Math.max(1, Math.min(40, Number(hodinTydne) || 40));
  const fromM = _njMins(from), toM = _njMins(to);
  const hours = (fromM !== null && toM !== null) ? ((toM - fromM + 1440) % 1440) / 60 : null;
  const payNum = Number(String(pay).replace(/\s/g, '')) || 0;
  const total = hours && unit === 'Kč/h' ? Math.round(payNum * hours) : null;
  const dateLabel = datePreset || (dateCustom.trim() || null) || (dateISO ? _jbDatumKarta(dateISO) : null);

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
    { key: 'contract', done: !!contract, step: 1 },
    { key: 'recurrence', done: !!recurrence, step: 1 },
    { key: 'pay', done: payNum > 0, step: 1 },
    { key: 'when', done: !!(dateLabel && hours), step: 2 },
    { key: 'place', done: !!place.trim() && !!region, step: 2 },
    { key: 'desc', done: desc.trim().length >= 40, step: 3 },
  ];
  // U úpravy je povinný jen název a mzda — ostatní pole starší inzeráty nemají
  const bad = k => tried && (!upravit || k === 'title' || k === 'pay') && !(checks.find(c => c.key === k) || {}).done;
  const anyErr = tried && checks.some(c => !c.done);
  const ERR = '#E5484D';
  const KROKY = ['Pozice a odměna', 'Kdy a kde', 'Náplň práce', 'Benefity a štítky'];
  const stepMeta = KROKY.map((label, i) => {
    const n = i + 1, own = checks.filter(c => c.step === n);
    const done = own.length ? own.every(c => c.done) : (perks.length + requirements.length + tags.length > 0);
    const chyba = upravit ? (n === 1 && (bad('title') || bad('pay'))) : (anyErr && own.length > 0 && !done);
    return { n, label, done, chyba };
  });

  // ── Import cizího inzerátu: vyplní jen to, co se z něj podařilo vyčíst ──
  const krajZNazvu = n => { const t = String(n || '').replace(/hlavní město|kraj/gi, '').trim(); return _njKrajId(t) || (_NJ_KRAJE.find(k => t && k.name.toLowerCase().startsWith(t.toLowerCase().slice(0, 5))) || {}).id || null; };
  const pouzijImport = z => {
    const A = x => Array.isArray(x) ? x.map(v => String(v).trim()).filter(Boolean) : [];
    if (z.title) setTitle(String(z.title).slice(0, 50));
    if (z.contract) setContract(_njSmlouvaZ(z.contract) || '');
    if (z.hours_per_week) setHodinTydne(String(Math.min(40, Number(z.hours_per_week) || 40)));
    if (_NJ_PRAVIDELNOST.includes(z.recurrence)) setRecurrence(z.recurrence);
    if (Number(z.pay) > 0) setPay(String(Math.round(Number(z.pay))));
    if (_NJ_UNITS.includes(z.pay_unit)) setUnit(z.pay_unit);
    if (_NJ_VYPLATA.includes(z.payout)) setPayout(z.payout);
    if (Number(z.positions) > 1) setPeople(Math.min(50, Number(z.positions)));
    if (z.location) setPlace(String(z.location));
    const kraj = krajZNazvu(z.region) || (typeof _krajZAdresy !== 'undefined' ? _krajZAdresy(z.location || '') : '') || null;
    if (kraj) setRegion(kraj);
    if (/^\d{4}-\d{2}-\d{2}$/.test(z.date || '')) { const [y, m, d] = z.date.split('-'); setDateISO(z.date); setDatePreset(null); setDateCustom((+d) + '. ' + (+m) + '. ' + y); }
    if (_njMins(z.time_start) !== null && _njMins(z.time_end) !== null) { setFrom(z.time_start); setTo(z.time_end); }
    if (z.description) setDesc(String(z.description).slice(0, 1500));
    [[z.expectations, setExpectations], [z.bonuses, setBonuses], [z.offer, setOffer], [z.perks, setPerks], [z.requirements, setRequirements], [z.tags, setTags]].forEach(([v, set]) => { if (A(v).length) set(A(v)); });
  };
  const nactiImport = async () => {
    if (imp.nacitam) return;
    const zOdkazu = imp.druh === 'odkaz';
    if (zOdkazu ? !/^https?:\/\/\S+\.\S+/i.test(imp.url.trim()) : imp.text.trim().length < 40) {
      setImp(x => ({ ...x, chyba: zOdkazu ? 'Vložte celý odkaz, třeba https://www.prace.cz/nabidka/…' : 'Vložte celý text inzerátu (aspoň pár vět).' })); return;
    }
    setImp(x => ({ ...x, nacitam: true, chyba: '' }));
    try {
      if (typeof sb === 'undefined' || !sb.functions) throw new Error('Načítání inzerátů teď nejde spustit.');
      const { data, error } = await sb.functions.invoke('import-inzerat', { body: { ...(zOdkazu ? { url: imp.url.trim() } : { text: imp.text }), styl: imp.styl } });
      if (error) {
        let zprava = null; const st = error.context && error.context.status;
        try { const j = await error.context.json(); zprava = j && j.chyba; } catch (e) {}
        throw new Error(zprava || (st === 404 ? 'Načítání inzerátů ještě není na serveru zapnuté (čeká na nasazení).' : 'Inzerát se nepodařilo načíst. Zkuste to znovu, nebo vložte jeho text.'));
      }
      if (!data || !data.ok || !data.inzerat) throw new Error((data && data.chyba) || 'Inzerát se nepodařilo načíst.');
      pouzijImport(data.inzerat);
      let odkud = 'vloženého textu';
      if (zOdkazu) { try { odkud = new URL(imp.url.trim()).hostname.replace(/^www\./, ''); } catch (e) {} }
      setImpInfo({ odkud, doslovne: imp.styl === 'doslovne', upozorneni: Array.isArray(data.upozorneni) ? data.upozorneni.slice(0, 3) : [] });
      setImp(x => ({ ...x, otevreno: false, nacitam: false, url: '', text: '' }));
      setStep(1); setTried(false);
    } catch (e) {
      setImp(x => ({ ...x, nacitam: false, chyba: (e && e.message) || 'Inzerát se nepodařilo načíst.' }));
    }
  };

  const duplicate = () => {
    const j = (typeof E_JOBS !== 'undefined' ? E_JOBS : [])[0];
    if (!j) return;
    setTitle(j.title || ''); setPay(String(j.pay || '')); setUnit(j.payUnit || 'Kč/h');
    if (j.contract) setContract(_njSmlouvaZ(j.contract)); if (j.recurrence) setRecurrence(j.recurrence); if (j.payout) setPayout(j.payout);
    setPlace(j.location || ''); if (_njKrajId(j.kraj)) setRegion(_njKrajId(j.kraj));
    if (j.description) setDesc(j.description);
    ['expectations', 'bonuses', 'offer', 'perks', 'tags'].forEach(k => { if (Array.isArray(j[k]) && j[k].length) ({ expectations: setExpectations, bonuses: setBonuses, offer: setOffer, perks: setPerks, tags: setTags })[k](j[k]); });
    if (window.empToast) window.empToast('Předvyplněno', 'Formulář jsem vyplnil podle inzerátu „' + (j.title || '') + '".', '', 'ok');
  };
  const dupLabel = (() => { const j = (typeof E_JOBS !== 'undefined' ? E_JOBS : [])[0]; return j ? j.title : null; })();

  const publish = () => {
    if (busy) return;
    // Úprava: uložit jde z kteréhokoli kroku; povinný je jen název a odměna
    if (upravit) {
      if (!title.trim() || !payNum) { setTried(true); setShake(x => x + 1); setStep(1); return; }
    } else {
      if (step < 4) { setStep(step + 1); return; }
      if (!checks.every(c => c.done)) {
        const first = checks.find(c => !c.done);
        setTried(true); setShake(x => x + 1); setStep(first.step);
        return;
      }
    }
    setBusy(true);
    // job_type appka na kartě neukazuje (štítek počítá ze smlouvy), ale sloupec je
    // povinný — odvodí se sám, ať si nikdy neodporuje se smlouvou.
    const jt = hpp ? (hodinNum >= 36 ? 'full_time' : 'part_time') : recurrence === 'Jednorázová' ? 'jednrazova_vypomoc' : 'brigada';
    const kraj = region || (typeof _krajZAdresy !== 'undefined' ? _krajZAdresy(place) : '') || '';
    const cisti = a => a.map(x => String(x).trim()).filter(Boolean);
    const fields = {
      title: title.trim(),
      company: (typeof ECOMPANY !== 'undefined' ? ECOMPANY.name : '') || '',
      description: desc.trim(),
      pay: payNum, pay_unit: unit,
      location: place.trim(), kraj,
      date: dateISO || _njCustomISO(dateCustom) || '',
      time_start: from, time_end: to,
      contract: contract || null, recurrence: recurrence || null, payout: payout || null,
      expectations: cisti(expectations), bonuses: cisti(bonuses), offer: cisti(offer), perks: cisti(perks),
      requirements: cisti(requirements), tags: cisti(tags),
      // První fotka i do image_url — appka ho u karty bere přednostně před photos[0]
      photos: photos.slice(0, _NJ_MAX_FOTEK), image_url: photos[0] || '',
      job_type: jt,
      // Nové sloupce (appka je umí ukázat) — dokud je Sam nepřidá, zápis je vynechá
      positions: people, hours_per_week: hpp ? hodinNum : null,
    };
    // Appka ukáže duties přednostně před description — když je inzerát měl, drž je stejné
    if (J.duties) fields.duties = fields.description;
    if (!upravit) { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
    if (onPublish) Promise.resolve(onPublish(fields)).finally(() => setBusy(false)); else if (onClose) onClose();
  };

  // Živý náhled — stejná data, jaká appka dostane z DB
  const nahledJob = {
    id: 'nahled', title: title.trim() || 'Název pozice',
    pay: payNum, payUnit: unit,
    location: place.trim() || 'Místo práce',
    date: dateISO || _njCustomISO(dateCustom) || '',
    timeText: from && to ? from + ' – ' + to : '',
    contract, hoursPerWeek: hpp ? hodinNum : null, recurrence, payout,
    description: desc, expectations, bonuses, offer, perks, requirements, tags, positions: people,
    photos, image: null,
    created_at: J.created_at || new Date().toISOString(), boosted: !!J.boosted,
  };

  // ── styly ──
  // Třídy nj-* (index.html): odezva na najetí a stisk jako jinde v dashboardu
  const inp = (border) => ({ fontSize: 15, color: '#0B1233', background: '#F6F7FC', border: '1px solid ' + border, borderRadius: 11, padding: '10px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' });
  const lab = t => <span style={{ fontSize: 12, fontWeight: 700, color: '#3A4266' }}>{t}</span>;
  const hint = t => <span style={{ fontSize: 11, color: '#A6ADCB' }}>{t}</span>;
  // Nápověda vedle popisku v úzkém sloupci: radši zkrátit „…" než zalomit pod popisek
  const hintRadek = { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  const radek = (l, h) => <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>{l}{h}</div>;
  const pole = { display: 'flex', flexDirection: 'column', gap: 8 };
  const groupBox = errColor => ({ display: 'flex', gap: 6, flexWrap: 'wrap', border: '1.5px solid ' + (errColor || 'transparent'), borderRadius: 12, padding: 6, margin: -6 });
  const chipEl = (label, on, onClick, key) => <span key={key || label} className="nj-chip" data-on={on || undefined} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '7px 12px', borderRadius: 999, cursor: 'pointer', color: on ? '#fff' : '#3A4266', background: on ? '#1B34F0' : '#fff', border: '1px solid ' + (on ? '#1B34F0' : '#E6E9F5'), whiteSpace: 'nowrap' }}>{label}</span>;
  // Náhled celého inzerátu doroluje na část, kterou firma právě vyplňuje (plynule)
  const jdiNa = k => setSekce(x => x && x.k === k ? x : { k });
  const fokus = k => () => jdiNa(k);

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,18,51,.62)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', padding: 20, animation: 'eDotazIn .2s ease both' }}>
      {/* Pevná výška: všechny kroky se vejdou bez posouvání a okno mezi kroky neskáče.
          Šířka max. obrazovka − okraje: v mřížce overlaye by maxWidth 100 % znamenalo
          šířku obsahu a okno by na užším notebooku přeteklo doprava. */}
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: 1200, maxWidth: 'calc(100vw - 40px)', height: 'min(calc(100vh - 32px), 820px)', background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 32px 80px rgba(11,18,51,.35)', display: 'flex', flexDirection: 'column', animation: 'njModalIn .32s cubic-bezier(.4,0,.2,1) both' }}>

        {/* Import z odkazu / textu — rozbalí se pod tlačítkem v hlavičce */}
        {imp.otevreno && (
          <div style={{ position: 'absolute', top: 62, right: 24, zIndex: 20, width: 470, background: '#fff', border: '1px solid #E6E9F5', borderRadius: 16, boxShadow: '0 22px 50px -18px rgba(11,18,51,.35)', padding: 16, display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0B1233' }}>Vložit inzerát, který už máte jinde</span>
              <span style={{ fontSize: 12, color: '#7A82A6', lineHeight: 1.5 }}>Z odkazu (prace.cz, jobs.cz, váš web…) nebo z textu vyplním formulář. Pak ho jen zkontrolujete.</span>
            </div>
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F3F4F8', borderRadius: 10, padding: 3 }}>
              <span aria-hidden="true" style={{ position: 'absolute', top: 3, bottom: 3, left: 3, width: 'calc((100% - 6px) / 2)', borderRadius: 8, background: '#fff', boxShadow: '0 1px 3px rgba(11,18,51,.12)', transform: imp.druh === 'text' ? 'translateX(100%)' : 'none', transition: 'transform .3s cubic-bezier(.2,.8,.2,1)' }} />
              {[['odkaz', 'Odkaz'], ['text', 'Text inzerátu']].map(([k, t]) => (
                <span key={k} className="nj-krok" data-on={imp.druh === k || undefined} onClick={() => setImp(x => ({ ...x, druh: k, chyba: '' }))} style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '6px 8px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: imp.druh === k ? '#0B1233' : '#7A82A6', transition: 'color .2s' }}>{t}</span>
                </span>
              ))}
            </div>
            {imp.druh === 'odkaz'
              ? <input className="nj-inp" autoFocus value={imp.url} onChange={e => setImp(x => ({ ...x, url: e.target.value, chyba: '' }))} onKeyDown={e => { if (e.key === 'Enter') nactiImport(); }} placeholder="https://www.prace.cz/nabidka/…" style={inp(imp.chyba ? ERR : '#E6E9F5')} />
              : <textarea className="nj-inp" autoFocus value={imp.text} onChange={e => setImp(x => ({ ...x, text: e.target.value.slice(0, 20000), chyba: '' }))} placeholder="Sem vložte celý text inzerátu — název, popis, požadavky, co nabízíte, mzdu…" style={{ ...inp(imp.chyba ? ERR : '#E6E9F5'), height: 130, resize: 'none', fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit' }} />}
            {imp.chyba && <span style={{ fontSize: 12, fontWeight: 600, color: '#C42B30', lineHeight: 1.45 }}>{imp.chyba}</span>}
            {/* Jak převzít text — někomu by vadilo, že se jeho inzerát přepíše */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3A4266' }}>Jak chcete text převzít?</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['makej', 'Do stylu Makej', 'Přepíšu ho krátce a s tykáním, jako ostatní inzeráty v appce'], ['doslovne', 'Doslovně', 'Vaše věty beze změny, jen je roztřídím do sekcí']].map(([k, t, n]) => {
                  const on = imp.styl === k;
                  return (
                    <div key={k} className="nj-typ" data-on={on || undefined} onClick={() => setImp(x => ({ ...x, styl: k }))} style={{ border: '1.5px solid ' + (on ? '#1B34F0' : '#E6E9F5'), background: on ? '#EEF1FF' : '#fff', borderRadius: 11, padding: '8px 11px', display: 'flex', flexDirection: 'column', gap: 2, cursor: 'pointer' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: on ? '#1B34F0' : '#0B1233' }}>{t}</span>
                      <span style={{ fontSize: 11, color: '#7A82A6', lineHeight: 1.4 }}>{n}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#A6ADCB', lineHeight: 1.5 }}>Vkládejte jen vlastní inzeráty — za obsah odpovídá vaše firma. Fotky se nepřebírají, nahrajte vlastní.</span>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <span className="nj-ghost" onClick={() => setImp(x => ({ ...x, otevreno: false, chyba: '' }))} style={{ fontSize: 13, fontWeight: 700, color: '#7A82A6', padding: '9px 13px', borderRadius: 9, cursor: 'pointer' }}>Zrušit</span>
              <span className="nj-hl" onClick={nactiImport} style={{ fontSize: 13, fontWeight: 800, color: '#fff', background: '#1B34F0', padding: '9px 16px', borderRadius: 9, cursor: imp.nacitam ? 'wait' : 'pointer', opacity: imp.nacitam ? .7 : 1, whiteSpace: 'nowrap' }}>{imp.nacitam ? 'Načítám inzerát…' : 'Načíst a vyplnit'}</span>
            </div>
          </div>
        )}

        {/* Hlavička: název okna + zavřít, pod tím kroky */}
        <div style={{ padding: '16px 24px 0', display: 'flex', flexDirection: 'column', gap: 12, flex: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0B1233', letterSpacing: '-.02em' }}>{upravit ? 'Upravit inzerát' : 'Nový inzerát'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {!upravit && <span className="nj-sek" data-on={imp.otevreno || undefined} onClick={() => setImp(x => ({ ...x, otevreno: !x.otevreno, chyba: '' }))} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: imp.otevreno ? '#1B34F0' : '#3A4266', background: imp.otevreno ? '#EEF1FF' : '#fff', border: '1px solid ' + (imp.otevreno ? '#C9D0F5' : '#E6E9F5'), padding: '8px 12px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4L12 18.4" /></svg>
                Vložit z odkazu
              </span>}
              {dupLabel && !upravit && <span className="nj-sek" onClick={duplicate} style={{ fontSize: 12.5, fontWeight: 700, color: '#3A4266', background: '#fff', border: '1px solid #E6E9F5', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>Vyplnit podle: {dupLabel.length > 16 ? dupLabel.slice(0, 16) + '…' : dupLabel}</span>}
              <span className="nj-x" onClick={onClose} role="button" aria-label="Zavřít" style={{ width: 34, height: 34, flex: 'none', borderRadius: 10, background: '#F6F7FC', color: '#3A4266', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </span>
            </div>
          </div>
          {/* Kroky jako přepínač: bílý jezdec se přesune na vybraný krok. Bez čísel
              a fajfek (Yasin 28. 9.) — chybějící údaj zčervená a zatřese se. */}
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(' + KROKY.length + ',1fr)', background: '#F3F4F8', borderRadius: 12, padding: 4 }}>
            <span aria-hidden="true" style={{ position: 'absolute', top: 4, bottom: 4, left: 4, width: 'calc((100% - 8px) / ' + KROKY.length + ')', borderRadius: 9, background: '#fff', boxShadow: '0 1px 3px rgba(11,18,51,.12), 0 1px 1px rgba(11,18,51,.04)', transform: 'translateX(' + (step - 1) * 100 + '%)', transition: 'transform .34s cubic-bezier(.2,.8,.2,1)' }} />
            {stepMeta.map((m, i) => {
              const cur = m.n === step;
              return (
                <span key={m.n + '-' + shake} className="nj-krok" data-on={cur || undefined} onClick={() => setStep(m.n)} style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', padding: '8px 12px', whiteSpace: 'nowrap', animation: m.chyba ? 'njShake .5s ease-in-out ' + (i * 0.06).toFixed(2) + 's 1 both' : 'none' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: m.chyba ? '#C42B30' : cur ? '#0B1233' : '#7A82A6', transition: 'color .2s' }}>{m.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Tělo: vlevo náhled (karta / celý inzerát), vpravo formulář */}
        <div className="nj-telo" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'grid', gridTemplateColumns: '390px minmax(0,1fr)', marginTop: 12, borderTop: '1px solid #EEF0F6' }}>
          <div className="nj-nahled" style={{ borderRight: '1px solid #EEF0F6', padding: '12px 20px 12px', display: 'flex', flexDirection: 'column', gap: 9, minHeight: 0 }}>
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F3F4F8', borderRadius: 10, padding: 3, flex: 'none' }}>
              <span aria-hidden="true" style={{ position: 'absolute', top: 3, bottom: 3, left: 3, width: 'calc((100% - 6px) / 2)', borderRadius: 8, background: '#fff', boxShadow: '0 1px 3px rgba(11,18,51,.12)', transform: pohled === 'cely' ? 'translateX(100%)' : 'none', transition: 'transform .3s cubic-bezier(.2,.8,.2,1)' }} />
              {[['karta', 'Karta'], ['cely', 'Celý inzerát']].map(([k, t]) => (
                <span key={k} className="nj-krok" data-on={pohled === k || undefined} onClick={() => setPohledRucne(k)} style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '6px 8px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: pohled === k ? '#0B1233' : '#7A82A6', transition: 'color .2s' }}>{t}</span>
                </span>
              ))}
            </div>
            {pohled === 'karta'
              ? <EJobKartaApp l={nahledJob} nahled />
              : <div style={{ height: _JB_NAHLED_VYSKA, flex: 'none', border: '1px solid #E6E9F5', borderRadius: 22, overflow: 'hidden' }}>
                  {/* Vykreslené v šířce telefonu (375 px) a zmenšené do panelu — texty se lámou jako v appce */}
                  <div style={{ width: 375, height: 'calc(' + _JB_NAHLED_VYSKA + ' / ' + _NJ_ZOOM + ')', zoom: _NJ_ZOOM }}><EJobDetailApp l={nahledJob} sekce={sekce} /></div>
                </div>}
            <span style={{ fontSize: 12, color: '#A6ADCB', textAlign: 'center', flex: 'none' }}>Náhled inzerátu v aplikaci</span>
          </div>

          {/* Formulář — krok se přepne hned, bez animace (Yasin 28. 9.: probliknutí a posun rušily) */}
          <div style={{ padding: '14px 24px 12px', display: 'flex', flexDirection: 'column', gap: 13, minWidth: 0 }}>

            {step === 1 && (<>
              {impInfo && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#EEF1FF', border: '1px solid #D9DEFA', borderRadius: 12, padding: '8px 10px 8px 12px' }}>
                  <span style={{ width: 20, height: 20, flex: 'none', borderRadius: '50%', background: '#1B34F0', color: '#fff', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', marginTop: 1 }}>✓</span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0B1233', lineHeight: 1.7 }}>
                      Vyplněno z {impInfo.odkud}{impInfo.doslovne ? ' (text doslovně)' : ' (ve stylu Makej)'}. Projděte všechny 4 kroky.
                      {impInfo.upozorneni.length > 0 && <span className="nj-odkaz" onClick={() => setImpInfo(x => ({ ...x, rozbaleno: !x.rozbaleno }))} style={{ marginLeft: 8, fontSize: 12, fontWeight: 800, color: '#1B34F0', cursor: 'pointer' }}>{impInfo.rozbaleno ? 'Skrýt upozornění' : 'Na co si dát pozor (' + impInfo.upozorneni.length + ')'}</span>}
                    </span>
                    {impInfo.rozbaleno && impInfo.upozorneni.map((u, i) => <span key={i} style={{ fontSize: 11.5, color: '#5B6488', lineHeight: 1.45 }}>• {u}</span>)}
                  </div>
                  <span className="nj-x" role="button" aria-label="Skrýt" onClick={() => setImpInfo(null)} style={{ width: 22, height: 22, flex: 'none', borderRadius: 6, fontSize: 10, fontWeight: 800, color: '#7A82A6', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>✕</span>
                </div>
              )}
              <div style={pole}>
                {radek(lab('Název pozice'), title.length >= 50 ? <span style={{ fontSize: 11, fontWeight: 700, color: '#F5920B' }}>50 / 50 — delší název se nevejde</span> : null)}
                <input className="nj-inp" value={title} onFocus={fokus('zaklad')} onChange={e => setTitle(e.target.value.slice(0, 50))} placeholder={'např. ' + _NJ_TITLE_HINTS[tw.idx].slice(0, tw.len) + (title.trim() ? '' : (tw.caret ? '|' : ''))} style={{ ...inp(bad('title') ? ERR : title.trim() ? '#E6E9F5' : '#D5DAF0'), fontWeight: 600 }} />
              </div>

              {/* Smlouva · Pravidelnost · Výplata v jedné řadě — víc možností = roletka,
                  dvě možnosti = přepínač (Yasin 29. 9.: dlaždice smluv byly složité) */}
              <div style={pole}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
                  <div style={pole}>
                    {radek(lab('Smlouva'), <span style={{ ...hintRadek, fontSize: 11, color: '#A6ADCB' }}>na kartě <b style={{ color: '#1B34F0' }}>{_jbStitek(contract, hpp ? hodinNum : null)}</b></span>)}
                    <_NjRoletka value={contract} onChange={v => { setContract(v); jdiNa('fakta'); }} moznosti={_NJ_SMLOUVY} placeholder="Vyberte smlouvu" chyba={bad('contract') ? ERR : null} onOpen={fokus('fakta')} />
                  </div>
                  <div style={pole}>
                    {radek(lab('Pravidelnost'), <span style={{ ...hintRadek, fontSize: 11 }}>{'\u00a0'}</span>)}
                    <div style={{ display: 'flex', gap: 2, background: '#F6F7FC', border: '1px solid ' + (bad('recurrence') ? ERR : '#E6E9F5'), borderRadius: 11, padding: 3 }}>
                      {_NJ_PRAVIDELNOST.map(v => { const on = recurrence === v; return <span key={v} className="nj-chip" data-on={on || undefined} onClick={() => { setRecurrence(v); jdiNa('zaklad'); }} style={{ fontSize: 13, fontWeight: 800, padding: '7.5px 13px', borderRadius: 8, cursor: 'pointer', color: on ? '#fff' : '#7A82A6', background: on ? '#1B34F0' : 'transparent', border: '1px solid ' + (on ? '#1B34F0' : 'transparent'), whiteSpace: 'nowrap' }}>{v}</span>; })}
                    </div>
                  </div>
                  <div style={pole}>
                    {radek(lab('Výplata'), <span style={{ ...hintRadek, fontSize: 11, color: '#A6ADCB' }}>podle ní se filtruje</span>)}
                    <_NjRoletka value={payout || ''} onChange={v => { setPayout(v); jdiNa('fakta'); }} moznosti={_NJ_VYPLATA.map(v => ({ k: v, l: v })).concat({ k: '', l: 'Neuvádět', n: 'v inzerátu se výplata neukáže', oddel: true })} placeholder="Neuvádět" onOpen={fokus('fakta')} />
                  </div>
                </div>
                {hpp && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 11, padding: '6px 6px 6px 13px' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#3A4266' }}>Úvazek</span>
                    <div style={{ display: 'flex', gap: 5 }}>{[[40, 'Plný'], [30, 'Zkrácený'], [15, 'Částečný']].map(([h, t]) => chipEl(t + ' · ' + h + ' h', hodinNum === h, () => setHodinTydne(String(h)), 'u' + h))}</div>
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7A82A6' }}>
                      <input className="nj-inp" value={hodinTydne} onChange={e => setHodinTydne(e.target.value.replace(/[^\d]/g, '').slice(0, 2))} style={{ width: 46, textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#0B1233', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 8, padding: '6px 4px', outline: 'none' }} />h týdně
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={pole}>
                  {lab('Odměna')}
                  <div className="nj-inp" onFocus={fokus('fakta')} style={{ display: 'flex', alignItems: 'center', background: '#F6F7FC', border: '1px solid ' + (bad('pay') ? ERR : payNum > 0 ? '#E6E9F5' : '#D5DAF0'), borderRadius: 11, overflow: 'hidden' }}>
                    <input value={pay} onChange={e => setPay(e.target.value.replace(/[^\d]/g, '').slice(0, 6))} placeholder="180" style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800, color: '#0B1233', background: 'transparent', border: 'none', padding: '12px 15px', outline: 'none' }} />
                    <div style={{ display: 'flex', gap: 2, padding: 4, flex: 'none' }}>
                      {_NJ_UNITS.map(u => <span key={u} className="nj-chip" data-on={u === unit || undefined} onClick={() => setUnit(u)} style={{ fontSize: 12, fontWeight: 800, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', color: u === unit ? '#fff' : '#7A82A6', background: u === unit ? '#1B34F0' : 'transparent', whiteSpace: 'nowrap' }}>{u}</span>)}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: payNum && payNum < 125 && unit === 'Kč/h' ? '#B96F06' : '#A6ADCB' }}>{payNum && payNum < 125 && unit === 'Kč/h' ? 'Pod minimální mzdou — platí i pro DPP a DPČ' : total ? 'Na kartě hlavně ' + total.toLocaleString('cs-CZ') + ' Kč za směnu' : 'U Kč/h appka ukáže i částku za celou směnu'}</span>
                </div>
                <div style={pole}>
                  {lab('Kolik lidí hledáte')}
                  <div style={{ display: 'flex', alignItems: 'center', background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 11, padding: 4 }}>
                    <span className="nj-plus" role="button" aria-label="Méně" onClick={() => { setPeople(p => Math.max(1, p - 1)); jdiNa('zaklad'); }} style={{ width: 40, height: 40, flex: 'none', borderRadius: 8, background: '#fff', border: '1px solid #E6E9F5', color: people > 1 ? '#0B1233' : '#B9C0D9', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center', cursor: people > 1 ? 'pointer' : 'default' }}>−</span>
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 800, color: '#0B1233' }}>{people} {people === 1 ? 'člověk' : people < 5 ? 'lidé' : 'lidí'}</span>
                    <span className="nj-plus" role="button" aria-label="Více" onClick={() => { setPeople(p => Math.min(50, p + 1)); jdiNa('zaklad'); }} style={{ width: 40, height: 40, flex: 'none', borderRadius: 8, background: '#fff', border: '1px solid #E6E9F5', color: '#0B1233', fontSize: 18, fontWeight: 700, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>+</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#A6ADCB' }}>{people > 1 ? 'V inzerátu: „' + people + ' volných míst"' : 'Víc lidí = v inzerátu „X volných míst"'}</span>
                </div>
              </div>

              <div style={pole}>
                {radek(lab('Fotky provozu'), hint(photos.length > 1 ? 'první je na kartě · pořadí změníte přetažením' : 'první fotka je na kartě, ostatní v galerii'))}
                <_NjFotky fotky={photos} setFotky={setPhotos} onFocus={fokus('zaklad')} />
              </div>
            </>)}

            {step === 2 && (<>
              <div style={pole} onFocus={fokus('fakta')}>
                {lab(recurrence === 'Pravidelná' ? 'První směna' : 'Datum směny')}
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {presets.map(p => { const on = datePreset === p.label || (!datePreset && !dateCustom && dateISO === p.iso); const c = _njChip(on); return <span key={p.label} className="nj-chip" data-on={on || undefined} onClick={() => { setDatePreset(p.label); setDateISO(p.iso); setDateCustom(''); jdiNa('fakta'); }} style={{ fontSize: 13, fontWeight: 700, padding: '9px 14px', borderRadius: 999, cursor: 'pointer', color: c.color, background: c.bg, border: '1px solid ' + c.border, whiteSpace: 'nowrap' }}>{p.label}</span>; })}
                  <span className="nj-inp" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F6F7FC', border: '1px solid ' + (bad('when') && !dateLabel ? ERR : '#E6E9F5'), borderRadius: 999, padding: '0 14px' }}>
                    <span style={{ fontSize: 12, color: '#A6ADCB' }}>nebo</span>
                    <input value={dateCustom} onChange={e => { setDateCustom(e.target.value); setDatePreset(null); setDateISO(''); }} placeholder="dd. mm. rrrr" style={{ width: 96, fontSize: 13, fontWeight: 700, color: '#0B1233', background: 'transparent', border: 'none', padding: '9px 0', outline: 'none' }} />
                  </span>
                </div>
              </div>
              <div style={pole} onFocus={fokus('fakta')}>
                {radek(lab('Čas směny'), <span style={{ fontSize: 11, fontWeight: 700, color: hours ? '#0B7B4B' : '#A6ADCB' }}>{hours ? (String(hours % 1 ? hours.toFixed(1) : hours).replace('.', ',') + ' h směna' + (total ? ' · ' + total.toLocaleString('cs-CZ') + ' Kč' : '')) : 'délku dopočítáme'}</span>)}
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{_NJ_TIME_PRESETS.map(p => { const on = fromM === _njMins(p.from) && toM === _njMins(p.to); const c = _njChip(on); return <span key={p.label} className="nj-chip" data-on={on || undefined} onClick={() => { setFrom(p.from); setTo(p.to); jdiNa('fakta'); }} style={{ fontSize: 13, fontWeight: 700, padding: '9px 14px', borderRadius: 999, cursor: 'pointer', color: c.color, background: c.bg, border: '1px solid ' + c.border, whiteSpace: 'nowrap' }}>{p.label}</span>; })}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 2 }}>
                  {[['Od', from, setFrom, '06:00'], ['Do', to, setTo, '14:00']].map(([l, v, setv, ph]) => (
                    <div key={l} className="nj-inp" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F6F7FC', border: '1px solid ' + (bad('when') && !hours ? ERR : '#E6E9F5'), borderRadius: 11, padding: '0 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#A6ADCB', letterSpacing: '.06em', textTransform: 'uppercase' }}>{l}</span>
                      <input value={v} onChange={e => setv(e.target.value)} placeholder={ph} style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: '#0B1233', background: 'transparent', border: 'none', padding: '12px 0', outline: 'none' }} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Místo a kraj vedle sebe — kraj je roletka (14 čipů zabíralo tři řádky) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 16, alignItems: 'end' }}>
                <div style={pole}>
                  {radek(lab('Místo práce'), <span style={{ ...hintRadek, fontSize: 11, color: '#A6ADCB' }}>v appce jde otevřít na mapě</span>)}
                  <input className="nj-inp" value={place} onFocus={fokus('fakta')} onChange={e => { const v = e.target.value; setPlace(v); if (!region && typeof _krajZAdresy !== 'undefined') { const k = _krajZAdresy(v); if (k) setRegion(k); } }} placeholder="např. Brno — Veveří" style={inp(bad('place') && !place.trim() ? ERR : place.trim() ? '#E6E9F5' : '#D5DAF0')} />
                </div>
                <div style={pole}>
                  {radek(lab('Kraj'), <span style={{ ...hintRadek, fontSize: 11, color: '#A6ADCB' }}>podle něj se hledá</span>)}
                  <_NjRoletka value={region || ''} onChange={v => setRegion(v || null)} moznosti={_NJ_KRAJE.map(r => ({ k: r.id, l: r.name }))} placeholder="Vyberte kraj" chyba={bad('place') && !region ? ERR : null} onOpen={fokus('fakta')} maxVyska={320} />
                </div>
              </div>
            </>)}

            {step === 3 && (
              <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 22 }}>
                <div style={{ ...pole, minHeight: 0 }}>
                  {radek(lab('Náplň práce'), <span style={{ fontSize: 11, fontWeight: 700, color: desc.trim().length >= 40 ? '#0B7B4B' : '#A6ADCB' }}>{desc.length} / 1500</span>)}
                  <textarea className="nj-inp" value={desc} onFocus={fokus('napln')} onChange={e => setDesc(e.target.value.slice(0, 1500))} placeholder={'Popiš, co brigádník na směně dělá — od příchodu po konec. Piš mu rovnou („připravíš", „obsloužíš").'} style={{ ...inp(bad('desc') ? ERR : '#E6E9F5'), flex: 1, minHeight: 150, resize: 'none', fontSize: 14, lineHeight: 1.55, fontFamily: 'inherit' }} />
                  <span className="nj-odkaz" onClick={() => { setDesc(_NJ_DESC_TEMPLATES[title.trim()] || _NJ_DESC_TEMPLATES.default); jdiNa('napln'); }} style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 800, color: '#1B34F0', cursor: 'pointer' }}>Vložit vzorový popis</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                  <div style={pole}>{radek(lab('Co od tebe čekáme'), hint('povinné věci'))}<_NjSeznam items={expectations} setItems={v => { setExpectations(v); jdiNa('cekame'); }} navrhy={_NJ_NAVRHY.cekame} placeholder="např. Spolehlivost a dochvilnost" onFocus={fokus('cekame')} /></div>
                  <div style={pole}>{radek(lab('Co oceníme'), hint('výhoda, ne podmínka'))}<_NjSeznam items={bonuses} setItems={v => { setBonuses(v); jdiNa('ocenime'); }} navrhy={_NJ_NAVRHY.ocenime} placeholder="např. Zkušenost z kavárny" onFocus={fokus('ocenime')} /></div>
                  <div style={pole}>{radek(lab('Co ti nabídneme'), hint('co od vás dostane'))}<_NjSeznam items={offer} setItems={v => { setOffer(v); jdiNa('nabidneme'); }} navrhy={_NJ_NAVRHY.nabidneme} placeholder="např. Zaučíme tě do všeho" onFocus={fokus('nabidneme')} /></div>
                </div>
              </div>
            )}

            {step === 4 && (<>
              <div style={pole}>{radek(lab('Benefity'), hint('v inzerátu jako seznam'))}<_NjStitky items={perks} setItems={v => { setPerks(v); jdiNa('benefity'); }} navrhy={_NJ_NAVRHY.benefity} onFocus={fokus('benefity')} /></div>
              <div style={pole}>{radek(lab('Co potřebuješ'), hint('jazyk, řidičák, průkazy…'))}<_NjStitky items={requirements} setItems={v => { setRequirements(v); jdiNa('potrebujes'); }} navrhy={_NJ_NAVRHY.potrebujes} onFocus={fokus('potrebujes')} /></div>
              <div style={pole}>{radek(lab('Vlastnosti brigády'), hint(tags.length > 4 ? 'na kartě se ukážou první 4' : 'první 4 se ukážou i na kartě'))}<_NjStitky items={tags} setItems={v => { setTags(v); jdiNa('vlastnosti'); }} navrhy={_NJ_NAVRHY.vlastnosti} onFocus={fokus('vlastnosti')} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F6F7FC', border: '1px solid #E6E9F5', borderRadius: 12, padding: '11px 14px', fontSize: 12, color: '#5B6488', lineHeight: 1.5 }}>
                <span style={{ width: 22, height: 22, flex: 'none', borderRadius: '50%', background: '#EEF1FF', color: '#1B34F0', fontSize: 12, fontWeight: 800, display: 'grid', placeItems: 'center' }}>i</span>
                Přesnou adresu a pravidla směny dostane brigádník do chatu, až potvrdíte jeho zájem — v inzerátu je to tak i napsané.
              </div>
            </>)}
          </div>
        </div>

        {/* Patička — vlevo Zpět (jen nový inzerát), vpravo hlavní akce */}
        <div style={{ borderTop: '1px solid #EEF0F6', background: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 9, flex: 'none' }}>
          {!upravit && step > 1 && <span className="nj-sek" onClick={() => setStep(s => Math.max(1, s - 1))} style={{ fontSize: 13.5, fontWeight: 700, color: '#3A4266', background: '#fff', border: '1px solid #E6E9F5', padding: '11px 16px', borderRadius: 10, cursor: 'pointer' }}>← Zpět</span>}
          <span style={{ flex: 1 }} />
          {upravit
            ? <span className="nj-sek" onClick={onClose} style={{ fontSize: 13.5, fontWeight: 700, color: '#3A4266', background: '#fff', border: '1px solid #E6E9F5', padding: '11px 18px', borderRadius: 10, cursor: 'pointer' }}>Zrušit</span>
            : <span className="nj-ghost" onClick={saveDraft} style={{ fontSize: 13.5, fontWeight: 700, color: '#7A82A6', padding: '11px 14px', borderRadius: 10, cursor: 'pointer' }}>Uložit rozpracované</span>}
          <span className="nj-hl" onClick={publish} style={{ fontSize: 14, fontWeight: 800, color: '#fff', background: '#1B34F0', padding: '12px 22px', borderRadius: 10, cursor: busy ? 'wait' : 'pointer', whiteSpace: 'nowrap', opacity: busy ? 0.7 : 1 }}>{upravit ? (busy ? 'Ukládám…' : 'Uložit změny') : step === 4 ? (busy ? 'Zveřejňuji…' : 'Zveřejnit inzerát') : 'Pokračovat →'}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
Object.assign(window, { ENewJobModal });
