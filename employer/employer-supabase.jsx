// Makej Employer — Supabase real data layer
// Fetches real data and mutates existing global arrays/objects in place
// so all existing components pick up live data without needing to change their read paths.
// Must be loaded AFTER employer-data.jsx and employer-pages3.jsx (which define the globals),
// but BEFORE employer-main.jsx (which calls fetchEmployerData).

function _strColor(str) {
  const cols = ['#F4A261','#8AB4FF','#5BD68A','#E0B0FF','#FF6B35','#FFD166','#5B6BFF','#f43f5e'];
  let h = 0;
  for (let i = 0; i < (str||'').length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return cols[Math.abs(h) % cols.length];
}

function _relTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  const t = new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  if (s < 60)     return `právě teď · ${t}`;
  if (s < 3600)   return `před ${Math.floor(s/60)} min · ${t}`;
  if (s < 86400)  return `před ${Math.floor(s/3600)} h · ${t}`;
  if (s < 172800) return `včera · ${t}`;
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }) + ` · ${t}`;
}

function _relTimeCoarse(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days <= 0)   return 'dnes';
  if (days === 1)  return 'včera';
  if (days < 7)    return `před ${days} dny`;
  if (days < 30)   { const w = Math.floor(days / 7);  return `před ${w} ${w === 1 ? 'týdnem' : 'týdny'}`; }
  if (days < 365)  { const m = Math.floor(days / 30); return `před ${m} ${m === 1 ? 'měsícem' : 'měsíci'}`; }
  const y = Math.floor(days / 365); return `před ${y} ${y === 1 ? 'rokem' : 'lety'}`;
}

function _fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

// ── Přílohy v chatu ────────────────────────────────────────────
// Brigádník je posílá z appky do neveřejného bucketu `chat-prilohy`.
// Neveřejný = prostá adresa obrázek nenačte, ke každému se musí vyžádat
// podepsaný odkaz s omezenou platností. Mezipaměť níž brání tomu, aby se
// pro jednu fotku podepisovalo při každém překreslení chatu.
const E_BUCKET_PRILOHY   = 'chat-prilohy';
const E_PRILOHA_PLATNOST = 3600;   // sekund

const _E_PODPISY = new Map();      // cesta → { url, doKdy }

async function eOdkazPrilohy(cesta) {
  if (!cesta) return null;
  const ted = Date.now();
  const drzeny = _E_PODPISY.get(cesta);
  if (drzeny && drzeny.doKdy > ted + 60000) return drzeny.url;   // minutová rezerva
  const { data, error } = await sb.storage
    .from(E_BUCKET_PRILOHY).createSignedUrl(cesta, E_PRILOHA_PLATNOST);
  if (error || !data) { console.error('eOdkazPrilohy:', error); return null; }
  _E_PODPISY.set(cesta, { url: data.signedUrl, doKdy: ted + E_PRILOHA_PLATNOST * 1000 });
  return data.signedUrl;
}

// Řádek zprávy s přílohou → tvar pro vykreslení bubliny
function _ePrilohaZRadku(msg) {
  return {
    cesta:    msg.file_url,
    typ:      msg.file_type || 'file',
    nazev:    msg.file_name || 'Příloha',
    velikost: msg.file_size || 0,
  };
}

// Náhled do seznamu konverzací místo prázdného textu
function _ePrilohaNahled(msg) {
  if (msg.file_type === 'image') return '📷 Fotka';
  if (msg.file_type === 'audio') return '🎤 Hlasová zpráva';
  return '📎 ' + (msg.file_name || 'Příloha');
}

function eVelikostPrilohy(b) {
  if (!b) return '';
  return b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' kB'
                         : (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
}

// ── Posílání přílohy z dashboardu (zrcadlí wPosliPrilohu z appky) ──
const E_PRILOHA_MAX = 10 * 1024 * 1024;   // 10 MB
function _eBezpecnyNazev(name) {
  return (name || 'soubor').normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').slice(0, 60) || 'soubor';
}
function _eChybaUlozeni(e) {
  const s = ((e && (e.message || e.error)) || '').toLowerCase();
  if (s.includes('row-level security') || s.includes('unauthorized') || s.includes('policy') || s.includes('violates'))
    return 'Úložiště nahrání odmítlo — chybí oprávnění zapisovat.';
  if (s.includes('bucket not found')) return 'Úložiště na přílohy nebylo nalezeno.';
  if (s.includes('exceeded') || s.includes('payload') || s.includes('too large')) return 'Soubor je moc velký.';
  return 'Nahrání se nepovedlo. Zkus to prosím znovu.';
}
// Nahraje přílohu do úložiště a teprve pak založí zprávu. Vrací { ok, error, zprava }.
async function ePosliPrilohu(matchId, userId, file) {
  if (!matchId || !userId || !file) return { ok: false, error: 'Chybí konverzace nebo soubor.' };
  if (file.size > E_PRILOHA_MAX) return { ok: false, error: 'Soubor je moc velký (max 10 MB).' };
  const jeObrazek = /^image\//.test(file.type);
  const pripona = ((file.name || '').split('.').pop() || 'dat').toLowerCase();
  const zaklad = _eBezpecnyNazev((file.name || 'soubor').replace(/\.[^.]+$/, ''));
  const cesta = `${matchId}/${userId}-${Date.now()}-${zaklad}.${pripona}`;

  const { error: chybaUlozeni } = await sb.storage.from(E_BUCKET_PRILOHY).upload(cesta, file, {
    contentType: file.type || 'application/octet-stream', upsert: false,
  });
  if (chybaUlozeni) { console.error('ePosliPrilohu (úložiště):', chybaUlozeni); return { ok: false, error: _eChybaUlozeni(chybaUlozeni) }; }

  const { data, error } = await sb.from('messages').insert({
    match_id: matchId, sender_id: userId, text: '',
    file_url: cesta, file_type: jeObrazek ? 'image' : 'file',
    file_name: file.name || 'příloha', file_size: file.size,
  }).select().single();
  if (error) {
    console.error('ePosliPrilohu (messages):', error);
    try { await sb.storage.from(E_BUCKET_PRILOHY).remove([cesta]); } catch (e) {}
    return { ok: false, error: 'Zprávu s přílohou se nepodařilo uložit.' };
  }
  return { ok: true, zprava: data };
}

// ── Upozornění (tabulka notifications) — zrcadlí strukturu z appky ──
// Sloupce: id, user_id, type, title, body, read, match_id, created_at
function _eNotifZRadku(r) {
  return {
    id: r.id,
    ts: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    read: !!r.read,
    type: r.type || 'info',
    title: r.title || '',
    text: r.body || '',
    matchId: r.match_id || null,
  };
}
async function fetchNotifsE(userId) {
  const { data, error } = await sb.from('notifications')
    .select('*').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(40);
  if (error) { console.error('fetchNotifsE:', error); return []; }
  return (data || []).map(_eNotifZRadku);
}
async function markNotifsReadE(userId) {
  const { error } = await sb.from('notifications')
    .update({ read: true }).eq('user_id', userId).eq('read', false);
  if (error) console.error('markNotifsReadE:', error);
  return !error;
}
async function clearNotifsE(userId) {
  const { error } = await sb.from('notifications').delete().eq('user_id', userId);
  if (error) console.error('clearNotifsE:', error);
  return !error;
}
// Počty nepřečtených podle konverzace (match_id) — pro odznak u „Zprávy" a threadů.
async function fetchUnreadByMatchE(userId) {
  const { data, error } = await sb.from('notifications')
    .select('match_id').eq('user_id', userId).eq('read', false);
  if (error) { console.error('fetchUnreadByMatchE:', error); return {}; }
  const map = {};
  (data || []).forEach(r => { if (r.match_id) map[r.match_id] = (map[r.match_id] || 0) + 1; });
  return map;
}
// Označí konverzaci jako přečtenou (na serveru) — po otevření threadu.
async function markThreadReadE(userId, matchId) {
  if (!userId || !matchId) return;
  const { error } = await sb.from('notifications')
    .update({ read: true }).eq('user_id', userId).eq('match_id', matchId).eq('read', false);
  if (error) console.error('markThreadReadE:', error);
}

async function fetchEmployerData(employerId) {
  try {
    const [profileRes, jobsRes] = await Promise.all([
      sb.from('profiles').select('*').eq('id', employerId).single(),
      sb.from('jobs').select('*').eq('employer_id', employerId).order('created_at', { ascending: false }),
    ]);

    const profile = profileRes.data;
    const jobs    = jobsRes.data || [];
    const jobIds  = jobs.map(j => j.id);

    let matches = [], messages = [], reviews = [];

    if (jobIds.length > 0) {
      const [matchRes, reviewRes] = await Promise.all([
        sb.from('matches')
          .select('*, worker:profiles!matches_worker_id_fkey(*), job:jobs(*)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false }),
        sb.from('reviews')
          .select('*, reviewer:profiles!reviews_reviewer_id_fkey(name)')
          .eq('reviewed_id', employerId)
          .order('created_at', { ascending: false }),
      ]);
      matches = matchRes.data || [];
      reviews = reviewRes.data || [];

      const matchIds = matches.map(m => m.id);
      if (matchIds.length > 0) {
        const msgRes = await sb.from('messages')
          .select('*')
          .in('match_id', matchIds)
          .order('created_at', { ascending: false })
          .limit(500);
        messages = msgRes.data || [];
      }
    }

    const today       = new Date();
    const companyName = (profile?.company_name || profile?.name || 'Moje firma').trim();

    // ── EPROFILE ─────────────────────────────────────────────────────────────
    Object.keys(EPROFILE).forEach(k => delete EPROFILE[k]);
    Object.assign(EPROFILE, profile || {});

    // ── ECOMPANY ─────────────────────────────────────────────────────────────
    const logo = companyName.split(/\s+/).map(w => w[0] || '').join('').slice(0,2).toUpperCase() || '??';
    Object.keys(ECOMPANY).forEach(k => delete ECOMPANY[k]);
    Object.assign(ECOMPANY, {
      name: companyName, logo,
      logoColor: _strColor(companyName),
      plan: 'Standard', city: 'Česká republika', team: '',
    });

    // ── E_JOBS ───────────────────────────────────────────────────────────────
    const newJobs = jobs.map(job => {
      const jm      = matches.filter(m => m.job_id === job.id);
      const hired   = jm.filter(m => m.status === 'accepted').length;
      const pending = jm.filter(m => m.status === 'pending').length;
      let daysLeft = 0;
      if (job.date) {
        let d = new Date(job.date);
        if (isNaN(d.getTime())) {
          const parts = job.date.split('.');
          if (parts.length >= 2) {
            const day = parseInt(parts[0], 10);
            const mon = parseInt(parts[1], 10) - 1;
            const yr  = parts[2] ? parseInt(parts[2], 10) : today.getFullYear();
            d = new Date(yr, mon, day);
          }
        }
        if (!isNaN(d.getTime())) daysLeft = Math.max(0, Math.ceil((d - today) / 86400000));
      }
      let status = job.status === 'filled' ? 'filled' : (job.status === 'expired' ? 'paused' : 'active');
      if (status === 'active' && daysLeft > 0 && daysLeft <= 2) status = 'urgent';

      return {
        id: job.id, title: job.title,
        company: job.company || companyName,
        status, plan: 'Standard',
        views: 0, swipes: jm.length, matches: jm.length, hired, pending, ctr: 0,
        daysLeft, pay: job.pay, payUnit: job.pay_unit || 'Kč/h',
        accent: _strColor(job.id),
        location: job.location, date: job.date,
        description: job.description,
        tags: Array.isArray(job.tags) ? job.tags : [],
        created_at: job.created_at,
        // Kandidáti, kteří na tento inzerát swipli (bez ohledu na pozdější rozhodnutí firmy) —
        // reálná data pro statistiky inzerátu (unikátní/noví kandidáti, rychlost swipnutí po zveřejnění)
        candidates: jm.map(m => ({ worker_id: m.worker_id, matched_at: m.created_at, status: m.status })),
      };
    });
    E_JOBS.length = 0;
    newJobs.forEach(j => E_JOBS.push(j));

    // ── E_CANDIDATES ─────────────────────────────────────────────────────────
    const toCandidate = m => {
      const w    = m.worker || {};
      const name = w.name || 'Kandidát';
      return {
        id: m.id, match_id: m.id, job_id: m.job_id, worker_id: m.worker_id,
        name,
        avatar: name.split(' ').map(p => p[0] || '').join('').slice(0,2).toUpperCase() || '??',
        color: _strColor(m.worker_id || m.id),
        age: null, rating: Number(w.rating || 0).toFixed(1),
        jobsDone: w.jobs_done || 0, distance: null, level: w.level || 1, match: 0,
        tags: Array.isArray(w.skills) ? w.skills : [],
        lastSeen: _relTime(m.created_at), jobTitle: m.job?.title || '',
        status: m.status,
      };
    };
    const pending  = matches.filter(m => m.status === 'pending');
    const accepted = matches.filter(m => m.status === 'accepted');
    E_CANDIDATES.new       = pending.map(toCandidate);
    E_CANDIDATES.shortlist = [];
    E_CANDIDATES.interview = [];
    E_CANDIDATES.hired     = accepted.map(toCandidate);

    // ── E_ACTIVITY ───────────────────────────────────────────────────────────
    const acts = [
      ...matches.slice(0, 5).map(m => ({
        type: 'match', who: m.worker?.name || 'Kandidát',
        what: `matchoval/a na: ${m.job?.title || ''}`,
        when: _relTime(m.created_at), icon: 'heart-bold', color: '#0020F6', _ts: m.created_at,
      })),
      ...messages.slice(0, 4).map(msg => {
        const match = matches.find(m => m.id === msg.match_id);
        return {
          type: 'msg', who: match?.worker?.name || 'Kandidát',
          what: 'poslal/a zprávu',
          when: _relTime(msg.created_at), icon: 'chat-round-line-bold', color: '#5BD68A', _ts: msg.created_at,
        };
      }),
    ].sort((a, b) => new Date(b._ts) - new Date(a._ts)).slice(0, 6);
    E_ACTIVITY.length = 0;
    acts.forEach(a => E_ACTIVITY.push(a));

    // ── E_THREADS ─────────────────────────────────────────────────────────────
    const newThreads = matches.map(match => {
      const threadMsgs = messages
        .filter(msg => msg.match_id === match.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(msg => {
          const from = msg.sender_id === employerId ? 'me' : 'them';
          if (msg.file_url) return {
            from, kind: 'file', file: _ePrilohaZRadku(msg),
            t: _fmtTime(msg.created_at), id: msg.id,
          };
          if (msg.type === 'shift_offer' && msg.metadata) return {
            from, kind: 'shift',
            shift: { role: msg.metadata.role, date: msg.metadata.date, time: msg.metadata.time, pay: msg.metadata.pay },
            t: _fmtTime(msg.created_at), id: msg.id,
          };
          if (msg.type === 'interview_offer' && msg.metadata) return {
            from, kind: 'interview',
            interview: { date: msg.metadata.date, time: msg.metadata.time, location: msg.metadata.location, note: msg.metadata.note },
            t: _fmtTime(msg.created_at), id: msg.id,
          };
          return { from, text: msg.text, t: _fmtTime(msg.created_at), id: msg.id };
        });
      const lastMsg = threadMsgs[threadMsgs.length - 1];
      const w       = match.worker || {};
      const wName   = w.name || 'Kandidát';
      // Nepřečtené = zprávy od druhé strany novější než poslední přečtení (localStorage)
      const lastRead = Number((typeof localStorage !== 'undefined' && localStorage.getItem('emp-lastread-' + match.id)) || 0);
      const unread = messages.filter(m => m.match_id === match.id && m.sender_id !== employerId && new Date(m.created_at).getTime() > lastRead).length;
      return {
        id: match.id, match_id: match.id, worker_id: match.worker_id,
        name: wName,
        avatar: wName.split(' ').map(p => p[0] || '').join('').slice(0,2).toUpperCase() || '??',
        color: _strColor(match.worker_id || match.id),
        role: match.job?.title || '',
        city: w.address || '', rating: Number(w.rating || 0).toFixed(1),
        jobsDone: w.jobs_done || 0, level: w.level || 1, cvUrl: w.cv_url || '',
        verified: !!w.verified,
        skills: Array.isArray(w.skills) ? w.skills : [],
        last: lastMsg ? (lastMsg.kind === 'shift' ? '📅 Nabídka směny' : lastMsg.kind === 'interview' ? '🗓️ Pozvánka na pohovor' : lastMsg.kind === 'file' ? (lastMsg.file.typ === 'image' ? '📷 Fotka' : '📎 ' + lastMsg.file.nazev) : lastMsg.text) || 'Nová shoda' : 'Nová shoda',
        time: _relTime(match.created_at),
        unread, online: false, msgs: threadMsgs,
      };
    });
    E_THREADS.length = 0;
    newThreads.forEach(t => E_THREADS.push(t));

    // ── E_KPIS ───────────────────────────────────────────────────────────────
    const totalM = matches.length;
    const totalH = accepted.length;
    const avgR   = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '–';
    const lastReview = reviews[0] ? {
      text: reviews[0].text, rating: reviews[0].rating,
      reviewer: reviews[0].reviewer?.name || 'Kandidát',
      when: _relTimeCoarse(reviews[0].created_at),
    } : null;
    const spark  = n => Array.from({ length: 12 }, (_, i) => n === 0 ? 0 : Math.max(0, Math.round(n * (0.15 + i * 0.07))));
    const activeJobs = E_JOBS.filter(j => j.status === 'active' || j.status === 'urgent').length;
    const totalJobs  = E_JOBS.length;
    const newKpis = [
      { id: 'jobs',    label: 'Aktivní inzeráty', value: activeJobs, max: totalJobs, delta: 0, spark: spark(activeJobs), unit: '',  icon: 'document-text-bold' },
      { id: 'matches', label: 'Celkem matchů',    value: totalM,    delta: 0, spark: spark(totalM),     unit: '',  icon: 'heart-bold' },
      { id: 'hired',   label: 'Najato',           value: totalH,    delta: 0, spark: spark(totalH),     unit: '',  icon: 'check-circle-bold' },
      { id: 'rating',  label: 'Hodnocení firmy',  value: avgR,      delta: 0, spark: spark(5),          unit: '★', icon: 'star-bold', count: reviews.length, lastReview },
    ];
    E_KPIS.length = 0;
    newKpis.forEach(k => E_KPIS.push(k));

    // ── E_FUNNEL ─────────────────────────────────────────────────────────────
    const newFunnel = [
      { stage: 'Aktivní inzeráty', count: activeJobs, pct: 100, color: '#5B6BFF' },
      { stage: 'Kandidáti celkem', count: totalM, pct: activeJobs ? Math.round(totalM / activeJobs * 10) : 0, color: '#0020F6' },
      { stage: 'Najato',           count: totalH, pct: totalM ? Math.round(totalH / totalM * 100) : 0, color: '#5BD68A' },
    ];
    // E_FUNNEL definuje jen _premium/dashboard-advanced.jsx, který se běžně nenačítá →
    // bez téhle pojistky tu fetchEmployerData spadl na „E_FUNNEL is not defined"
    // a přeskočil E_REVIEWS + vrátil false.
    if (typeof E_FUNNEL !== 'undefined') {
      E_FUNNEL.length = 0;
      newFunnel.forEach(f => E_FUNNEL.push(f));
    }

    // ── E_REVIEWS ──────────────────────────────────────────────────────────────
    const newReviews = reviews.map(r => {
      const author = r.reviewer?.name || 'Anonym';
      return {
        id: r.id,
        author,
        avatar: author.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??',
        color: _strColor(r.reviewer_id || r.id),
        rating: Number(r.rating) || 0,
        text: r.text || '',
        when: _relTime(r.created_at),
      };
    });
    E_REVIEWS.length = 0;
    newReviews.forEach(r => E_REVIEWS.push(r));

    return true;
  } catch (err) {
    console.error('[employer-supabase] fetchEmployerData error:', err);
    return false;
  }
}

// Accept a candidate: mark match as accepted + mark job as filled
async function acceptCandidate(matchId, jobId) {
  const { error: mErr } = await sb.from('matches').update({ status: 'accepted' }).eq('id', matchId);
  if (mErr) { console.error('acceptCandidate match error:', mErr); return false; }

  const { error: jErr } = await sb.from('jobs').update({ status: 'filled' }).eq('id', jobId);
  if (jErr) { console.error('acceptCandidate job error:', jErr); return false; }

  return true;
}

// Reject a candidate: mark match as rejected (job stays active)
async function rejectCandidate(matchId) {
  const { error } = await sb.from('matches').update({ status: 'rejected' }).eq('id', matchId);
  if (error) { console.error('rejectCandidate error:', error); return false; }
  return true;
}

async function updateEmployerProfile(updates) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user) return false;
  const { error } = await sb.from('profiles').update(updates).eq('id', session.user.id);
  if (error) { console.error('updateEmployerProfile error:', error); return false; }
  Object.assign(EPROFILE, updates);
  if (updates.company_name) {
    const newName = updates.company_name.trim();
    const newLogo = newName.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??';
    Object.assign(ECOMPANY, { name: newName, logo: newLogo, logoColor: _strColor(newName) });
  }
  return true;
}

async function createJobE(employerId, fields) {
  const ts = fields.time_start || '00:00';
  const te = fields.time_end   || '00:00';
  let duration = 0;
  try {
    const [sh, sm] = ts.split(':').map(Number);
    const [eh, em] = te.split(':').map(Number);
    duration = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  } catch (_) {}

  const payload = {
    employer_id: employerId,
    title:       fields.title,
    company:     fields.company || ECOMPANY.name || '',
    description: fields.description || '',
    pay:         parseInt(fields.pay) || 0,
    pay_unit:    fields.pay_unit || 'Kč/h',
    location:    fields.location || '',
    kraj:        fields.kraj || null,   // podle něj filtruje brigádník ve worker appce
    date:        fields.date || new Date().toISOString().slice(0, 10),
    time_start:  ts,
    time_end:    te,
    duration,
    tags:        Array.isArray(fields.tags) ? fields.tags : [],
    requirements: Array.isArray(fields.requirements) ? fields.requirements : [],
    job_type:    fields.job_type || 'brigada',
    status:      'active',
  };
  const { data, error } = await sb.from('jobs').insert(payload).select().single();
  if (error) { console.error('createJobE error:', error); return null; }
  return data;
}

Object.assign(window, { fetchEmployerData, acceptCandidate, rejectCandidate, updateEmployerProfile, createJobE, _strColor, _relTime, _fmtTime });


// ═══════════════════════════════════════════════════════════════
// Doplněno zpět z původního dashboardu — funkce, které Yasinova verze neměla.
// Zatím je nic z UI nevolá (komponenty, které je používaly, byly nahrazeny);
// jsou tu připravené k napojení: boost/úprava/smazání inzerátu, recenze,
// poznámky, tým a pozvánky, upload obrázků a příloh, podklady pro analytiku.
// ═══════════════════════════════════════════════════════════════

function _buildKrajeStats(all, hired) {
  const ids = Object.keys(KRAJ_CITIES);
  const stats = {};
  ids.forEach(k => { stats[k] = { workers: 0, companies: 0 }; });
  const hiredSet = new Set((hired || []).map(h => h.id));
  (all || []).forEach(c => {
    const k = (c.kraj && stats[c.kraj]) ? c.kraj : _cityToKraj(c.city);  // primárně kraj z profilu
    if (!k) return;
    stats[k].workers += 1;
    if (hiredSet.has(c.id)) stats[k].companies += 1;  // „z toho najato"
  });
  window.E_KRAJE_STATS = stats;
}

function _buildResponseStats(messages, matches, employerId) {
  const byMatch = {};
  (messages || []).forEach(m => { (byMatch[m.match_id] = byMatch[m.match_id] || []).push(m); });
  const deltas = [];
  (matches || []).forEach(mt => {
    const msgs = (byMatch[mt.id] || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const fw = msgs.find(x => x.sender_id === mt.worker_id);
    if (!fw) return;
    const w0 = new Date(fw.created_at).getTime();
    const fe = msgs.find(x => x.sender_id === employerId && new Date(x.created_at).getTime() >= w0);
    if (!fe) return;
    deltas.push((new Date(fe.created_at).getTime() - w0) / 60000);  // minuty
  });
  const buckets = [
    { l: '<5 min', max: 5,        color: '#5BD68A' },
    { l: '5-30m',  max: 30,       color: '#5BD68A' },
    { l: '30-1h',  max: 60,       color: '#FFD166' },
    { l: '1-3h',   max: 180,      color: '#FFD166' },
    { l: '3-12h',  max: 720,      color: '#f43f5e' },
    { l: '>12h',   max: Infinity, color: '#f43f5e' },
  ];
  const data = buckets.map(b => ({ l: b.l, v: 0, color: b.color }));
  deltas.forEach(d => { let i = buckets.findIndex(b => d < b.max); if (i < 0) i = buckets.length - 1; data[i].v += 1; });
  const avg = deltas.length ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : null;
  window.E_RESPONSE = { data, avg, count: deltas.length };
}

function _buildWageDistro(jobs) {
  const rates = (jobs || []).map(j => Number(j.pay)).filter(p => p > 0);
  const buckets = [
    { l: '<130',    lo: 0,   hi: 130 },
    { l: '130-150', lo: 130, hi: 150 },
    { l: '150-170', lo: 150, hi: 170 },
    { l: '170-200', lo: 170, hi: 200 },
    { l: '200-250', lo: 200, hi: 250 },
    { l: '250+',    lo: 250, hi: Infinity },
  ];
  window.E_WAGE_DISTRO = buckets.map(b => ({ l: b.l, v: rates.filter(r => r >= b.lo && r < b.hi).length }));
}

function _cityToKraj(city) {
  const s = (city || '').toLowerCase();
  if (!s) return null;
  for (const k in KRAJ_CITIES) {
    if (KRAJ_CITIES[k].split('|').some(kw => s.includes(kw))) return k;
  }
  return null;
}

function _eJobPassed(eventDate) {
  if (!eventDate) return false;
  const d = new Date(eventDate + 'T23:59:59');
  return !isNaN(d) && d < new Date();
}

function _eResizeImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      if (Math.max(w, h) > maxDim) { const s = maxDim / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob(b => b ? resolve(b) : reject(new Error('toBlob')), 'image/jpeg', quality || 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load')); };
    img.src = url;
  });
}

function _eResolveEventDate(job, matchCreatedAt) {
  if (!job) return null;
  if (job.event_date) return job.event_date;
  const raw = (job.date || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/(\d{1,2})\s*\.\s*(\d{1,2})/);
  if (!m) return null;
  const day = parseInt(m[1], 10), mon = parseInt(m[2], 10);
  if (!(day >= 1 && day <= 31 && mon >= 1 && mon <= 12)) return null;
  const anchor = matchCreatedAt ? new Date(matchCreatedAt) : new Date();
  const ay = anchor.getFullYear();
  let best = null, bestDiff = Infinity;
  for (const y of [ay - 1, ay, ay + 1]) {
    const d = new Date(y, mon - 1, day);
    const diff = Math.abs(d - anchor);
    if (diff < bestDiff) { bestDiff = diff; best = d; }
  }
  if (!best) return null;
  const mm = String(best.getMonth() + 1).padStart(2, '0');
  const dd = String(best.getDate()).padStart(2, '0');
  return `${best.getFullYear()}-${mm}-${dd}`;
}

function _isoDate(v) {
  return (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) ? v : null;
}

function _teamInviteLink(token) {
  return window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + '?join=' + token;
}

async function boostJobE(jobId, hours) {
  const until = new Date(Date.now() + (hours || 48) * 3600000).toISOString();
  const { error } = await sb.from('jobs').update({ top_until: until }).eq('id', jobId);
  if (error) { console.error('boostJobE error:', error); return false; }
  const j = E_JOBS.find(x => x.id === jobId);
  if (j) { j.boosted = true; j.boostedUntil = until; }
  return true;
}

async function chatSignedUrlE(path) {
  if (!path) return null;
  const { data, error } = await sb.storage.from('chat-prilohy').createSignedUrl(path, 3600);
  if (error) { console.error('chatSignedUrlE:', error); return null; }
  return data && data.signedUrl ? data.signedUrl : null;
}

async function createTeamInviteE(email) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user) return { ok: false, msg: 'Nejsi přihlášený.' };
  const ownerId = window._makejActingId || session.user.id;
  const clean = (email || '').trim().toLowerCase() || null;
  const { data, error } = await sb.from('team_members')
    .insert({ owner_id: ownerId, email: clean, role: 'member', status: 'invited' })
    .select().single();
  if (error) {
    if (error.code === '23505') return { ok: false, msg: 'Na tento e-mail už pozvánka existuje.' };
    console.error('createTeamInviteE:', error);
    return { ok: false, msg: 'Pozvánku se nepodařilo vytvořit.' };
  }
  E_TEAM.push(data);
  return { ok: true, invite: data, link: _teamInviteLink(data.invite_token) };
}

async function deleteJobE(jobId) {
  const { error } = await sb.from('jobs').delete().eq('id', jobId);
  if (error) { console.error('deleteJobE error:', error); return false; }
  // odeber lokálně, ať zmizí hned bez refetchu
  const i = E_JOBS.findIndex(j => j.id === jobId);
  if (i !== -1) E_JOBS.splice(i, 1);
  return true;
}

async function dismissCancelE(matchId) {
  const { error } = await sb.from('matches').update({ cancel_handled: true }).eq('id', matchId);
  if (error) { console.error('dismissCancelE error:', error); return false; }
  const i = E_CANCELLED.findIndex(c => c.match_id === matchId);
  if (i >= 0) E_CANCELLED.splice(i, 1);
  return true;
}

async function fetchNotesE(employerId) {
  const { data, error } = await sb.from('candidate_notes')
    .select('worker_id, note').eq('employer_id', employerId);
  if (error) { console.error('fetchNotesE:', error); return E_NOTES; }
  Object.keys(E_NOTES).forEach(k => delete E_NOTES[k]);
  (data || []).forEach(r => { E_NOTES[r.worker_id] = r.note || ''; });
  return E_NOTES;
}

async function fetchTeamE(ownerId) {
  const { data, error } = await sb.from('team_members')
    .select('*, member:profiles!team_members_member_id_fkey(name, company_name)')
    .eq('owner_id', ownerId).order('created_at', { ascending: true });
  if (error) { console.error('fetchTeamE:', error); return E_TEAM; }
  E_TEAM.length = 0;
  (data || []).forEach(m => E_TEAM.push(m));
  return E_TEAM;
}

async function removeTeamMemberE(id) {
  const { error } = await sb.from('team_members').delete().eq('id', id);
  if (error) { console.error('removeTeamMemberE:', error); return false; }
  const i = E_TEAM.findIndex(m => m.id === id);
  if (i !== -1) E_TEAM.splice(i, 1);
  return true;
}

async function reopenJobE(matchId, jobId) {
  const { error: jErr } = await sb.from('jobs').update({ status: 'active' }).eq('id', jobId);
  if (jErr) { console.error('reopenJobE job error:', jErr); return false; }
  await sb.from('matches').update({ cancel_handled: true }).eq('id', matchId);
  const i = E_CANCELLED.findIndex(c => c.match_id === matchId);
  if (i >= 0) E_CANCELLED.splice(i, 1);
  return true;
}

async function saveNoteE(workerId, note) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user) return false;
  const empId = window._makejActingId || session.user.id;
  const txt = (note || '').trim();
  if (!txt) {
    // prázdná poznámka → smaž řádek
    const { error } = await sb.from('candidate_notes').delete()
      .eq('employer_id', empId).eq('worker_id', workerId);
    if (error) { console.error('saveNoteE(delete):', error); return false; }
    delete E_NOTES[workerId];
    return true;
  }
  const { error } = await sb.from('candidate_notes').upsert(
    { employer_id: empId, worker_id: workerId, note: txt, updated_at: new Date().toISOString() },
    { onConflict: 'employer_id,worker_id' }
  );
  if (error) { console.error('saveNoteE:', error); return false; }
  E_NOTES[workerId] = txt;
  return true;
}

async function submitReviewE(matchId, workerId, rating, text) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user) return false;
  const { error } = await sb.from('reviews').insert({
    reviewer_id: session.user.id,
    reviewed_id: workerId,
    match_id: matchId,
    rating: Math.max(1, Math.min(5, parseInt(rating) || 0)),
    text: (text || '').trim(),
  });
  if (error) { console.error('submitReviewE:', error); return false; }
  const i = E_REVIEW_QUEUE.findIndex(r => r.match_id === matchId);
  if (i >= 0) E_REVIEW_QUEUE.splice(i, 1);
  return true;
}

async function updateJobE(jobId, fields) {
  const ts = fields.time_start || '00:00';
  const te = fields.time_end   || '00:00';
  let duration = 0;
  try {
    const [sh, sm] = ts.split(':').map(Number);
    const [eh, em] = te.split(':').map(Number);
    duration = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  } catch (_) {}

  const dateVal = fields.date || new Date().toISOString().slice(0, 10);
  const payload = {
    title:       fields.title,
    description: fields.description || '',
    pay:         parseInt(fields.pay) || 0,
    pay_unit:    fields.pay_unit || 'Kč/h',
    location:    fields.location || '',
    date:        dateVal,
    event_date:  _isoDate(dateVal),
    time_start:  ts,
    time_end:    te,
    duration,
    tags:        Array.isArray(fields.tags) ? fields.tags : [],
    requirements: Array.isArray(fields.requirements) ? fields.requirements : [],
    benefits:    Array.isArray(fields.benefits) ? fields.benefits : [],
    positions:   parseInt(fields.positions) || 1,
    dress_code:  fields.dress_code || null,
    contact_note: fields.contact_note || null,
    job_type:    fields.job_type || 'brigada',
    kraj:        fields.kraj || null,
    lat:         fields.lat != null ? fields.lat : null,
    lng:         fields.lng != null ? fields.lng : null,
    photos:      Array.isArray(fields.photos) ? fields.photos : [],
  };
  const { data, error } = await sb.from('jobs').update(payload).eq('id', jobId).select().single();
  if (error) { console.error('updateJobE error:', error); return null; }
  return data;
}

async function uploadChatFileE(matchId, file, fileType) {
  if (!matchId || !file) return null;
  try {
    let blob = file, ext = 'bin', contentType = file.type || 'application/octet-stream';
    if (fileType === 'image') { blob = await _eResizeImage(file, 1600, 0.85); ext = 'jpg'; contentType = 'image/jpeg'; }
    else { const m = (file.name || '').match(/\.([a-z0-9]+)$/i); ext = m ? m[1].toLowerCase() : (fileType === 'audio' ? 'webm' : 'bin'); }
    const path = `${matchId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await sb.storage.from('chat-prilohy').upload(path, blob, { contentType, upsert: false });
    if (error) { console.error('uploadChatFileE:', error); return null; }
    return { path, name: file.name || (fileType === 'audio' ? 'Hlasová zpráva' : 'soubor'), size: (blob.size || file.size || 0) };
  } catch (e) { console.error('uploadChatFileE:', e); return null; }
}

async function uploadImageE(userId, prefix, file, maxDim) {
  if (!userId || !file) return null;
  try {
    const blob = await _eResizeImage(file, maxDim || 1400, 0.85);
    const path = `${userId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error } = await sb.storage.from('uploads').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.error('uploadImageE:', error); return null; }
    const { data } = sb.storage.from('uploads').getPublicUrl(path);
    return data && data.publicUrl ? data.publicUrl : null;
  } catch (e) { console.error('uploadImageE:', e); return null; }
}
