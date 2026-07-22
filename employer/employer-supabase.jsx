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
  if (s < 60)     return 'právě teď';
  if (s < 3600)   return `před ${Math.floor(s/60)} min`;
  if (s < 86400)  return `před ${Math.floor(s/3600)} h`;
  if (s < 172800) return 'včera';
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
}

function _fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

// Fronta brigád k ohodnocení (dokončené, ještě neohodnocené firmou)
const E_REVIEW_QUEUE = [];

// Fronta zrušených směn — firma rozhodne, zda inzerát znovu zveřejnit
const E_CANCELLED = [];

// Vrátí ISO datum (YYYY-MM-DD) pokud je vstup validní ISO, jinak null
function _isoDate(v) {
  return (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) ? v : null;
}

// Je datum brigády už minulé? (ISO 'YYYY-MM-DD')
function _eJobPassed(eventDate) {
  if (!eventDate) return false;
  const d = new Date(eventDate + 'T23:59:59');
  return !isNaN(d) && d < new Date();
}

// Zjistí ISO datum brigády; u starých dat bez roku odhadne rok podle vzniku matche
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

// ── Mapování měst na kraje (pro mapu v Analytice) ────────────────────────────
const KRAJ_CITIES = {
  praha: 'praha',
  stredocesky: 'kladno|mladá boleslav|boleslav|příbram|kolín|kutná hora|benešov|beroun|mělník|nymburk|rakovník|brandýs|říčany|slaný',
  jihocesky: 'budějovic|tábor|písek|strakonic|jindřichův hradec|krumlov|prachatic',
  plzensky: 'plzeň|klatov|rokycan|domažlic|tachov',
  karlovarsky: 'karlovy vary|karlovarsk|cheb|sokolov|ostrov',
  ustecky: 'ústí nad labem|most|teplic|děčín|chomutov|litoměřic|louny|litvínov|kadaň',
  liberecky: 'liberec|jablonec|česká lípa|turnov',
  kralovehradecky: 'hradec králov|náchod|trutnov|jičín|rychnov|dvůr králov',
  pardubicky: 'pardubic|chrudim|svitav|ústí nad orlicí|česká třebová',
  vysocina: 'jihlav|třebíč|žďár|havlíčkův brod|pelhřimov',
  jihomoravsky: 'brno|brně|znojmo|hodonín|břeclav|vyškov|blansko|kyjov|slavkov',
  olomoucky: 'olomouc|přerov|prostějov|šumperk|hranic|zábřeh',
  zlinsky: 'zlín|zlíně|kroměříž|uherské hradiště|vsetín|valašské meziříčí|otrokovic',
  moravskoslezsky: 'ostrav|opav|karvin|frýdek|místek|havířov|třinec|nový jičín|bruntál|krnov',
};
function _cityToKraj(city) {
  const s = (city || '').toLowerCase();
  if (!s) return null;
  for (const k in KRAJ_CITIES) {
    if (KRAJ_CITIES[k].split('|').some(kw => s.includes(kw))) return k;
  }
  return null;
}
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

// Doba odezvy firmy — čas mezi první zprávou brigádníka a první odpovědí firmy
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

// Distribuce hodinovky napříč tvými inzeráty
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

// ── Nahrávání obrázků (Supabase Storage bucket 'uploads') ──────
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
// Nahraje obrázek do 'uploads/{userId}/{prefix}-{rand}.jpg' → vrátí veřejnou URL.
// userId = přihlášený auth uživatel (kvůli storage RLS na vlastní složku).
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

// ── Chat přílohy (private bucket 'chat-prilohy', cesta {matchId}/...) ──
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
async function chatSignedUrlE(path) {
  if (!path) return null;
  const { data, error } = await sb.storage.from('chat-prilohy').createSignedUrl(path, 3600);
  if (error) { console.error('chatSignedUrlE:', error); return null; }
  return data && data.signedUrl ? data.signedUrl : null;
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
    let reviewedMatchIds = new Set();
    const viewsByJob = {};

    if (jobIds.length > 0) {
      const [matchRes, reviewRes, viewsRes] = await Promise.all([
        sb.from('matches')
          .select('*, worker:profiles!matches_worker_id_fkey(*), job:jobs(*)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false }),
        sb.from('reviews')
          .select('*, reviewer:profiles!reviews_reviewer_id_fkey(name)')
          .eq('reviewed_id', employerId)
          .order('created_at', { ascending: false }),
        sb.from('job_views').select('job_id').in('job_id', jobIds),
      ]);
      matches = matchRes.data || [];
      reviews = reviewRes.data || [];
      (viewsRes.data || []).forEach(v => { viewsByJob[v.job_id] = (viewsByJob[v.job_id] || 0) + 1; });

      // Recenze, které firma sama napsala (abych podruhé nevyzýval)
      const myRevRes = await sb.from('reviews').select('match_id').eq('reviewer_id', employerId);
      reviewedMatchIds = new Set((myRevRes.data || []).map(r => r.match_id));

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

    // soukromé poznámky ke kandidátům
    await fetchNotesE(employerId);

    const today       = new Date();
    const companyName = (profile?.company_name || profile?.name || 'Moje firma').trim();

    // ── EPROFILE ─────────────────────────────────────────────────────────────
    Object.keys(EPROFILE).forEach(k => delete EPROFILE[k]);
    Object.assign(EPROFILE, profile || {});

    // ── ECOMPANY ─────────────────────────────────────────────────────────────
    const logo = companyName.split(/\s+/).map(w => w[0] || '').join('').slice(0,2).toUpperCase() || '??';
    // Tarif z DB (+ kontrola expirace → padá na starter)
    let planVal = (profile?.plan || 'starter');
    const planExp = profile?.plan_expires_at;
    if (planExp && new Date(planExp) < new Date()) planVal = 'starter';
    Object.keys(ECOMPANY).forEach(k => delete ECOMPANY[k]);
    Object.assign(ECOMPANY, {
      name: companyName, logo,
      logoColor: _strColor(companyName),
      plan: planVal, city: 'Česká republika', team: '',
    });

    // ── E_JOBS ───────────────────────────────────────────────────────────────
    const newJobs = jobs.map(job => {
      const jm     = matches.filter(m => m.job_id === job.id);
      const hired  = jm.filter(m => m.status === 'accepted').length;
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

      const views = viewsByJob[job.id] || 0;
      const ctr   = views > 0 ? (jm.length / views) * 100 : 0;
      const boosted   = job.top_until && new Date(job.top_until) > today;
      const scheduled = job.publish_at && new Date(job.publish_at) > today;
      if (scheduled && status === 'active') status = 'scheduled';
      return {
        id: job.id, title: job.title,
        company: job.company || companyName,
        status, plan: 'Standard',
        views, swipes: jm.length, matches: jm.length, hired, ctr,
        daysLeft, pay: job.pay, payUnit: job.pay_unit || 'Kč/h',
        accent: _strColor(job.id),
        location: job.location, date: job.date,
        description: job.description,
        tags: Array.isArray(job.tags) ? job.tags : [],
        created_at: job.created_at,
        boosted, boostedUntil: job.top_until || null,
        scheduled, publishAt: job.publish_at || null,
        kraj: job.kraj || null,
      };
    });
    // boostnuté nahoru, pak podle data vytvoření
    newJobs.sort((a, b) => (b.boosted ? 1 : 0) - (a.boosted ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at));
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
        rating: Number(w.rating || 0).toFixed(1),
        jobsDone: w.jobs_done || 0, level: w.level || 1,
        hoursLogged: w.hours_logged || 0, totalEarned: Number(w.total_earned || 0),
        punctuality: w.punctuality != null ? w.punctuality : null,
        tags: Array.isArray(w.skills) ? w.skills : [],
        bio: w.bio || '', education: w.education || '',
        city: w.address || '', cvUrl: w.cv_url || '', verified: !!w.verified,
        avatarUrl: w.avatar_url || '',
        lastSeen: _relTime(m.created_at), jobTitle: m.job?.title || '',
        createdAt: m.created_at,
        age: w.birth_date ? Math.floor((Date.now() - new Date(w.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000)) : null,
        gender: w.gender || null,
        kraj: w.kraj || null,
        status: m.status, super: !!m.super,
      };
    };
    const pending   = matches.filter(m => m.status === 'pending');
    const accepted  = matches.filter(m => m.status === 'accepted');   // domlouvá se v chatu
    const confirmed = matches.filter(m => m.status === 'confirmed');  // potvrzená směna
    const hired     = [...confirmed, ...accepted];
    // Super zájemci přednostně navrch
    E_CANDIDATES.new       = pending.map(toCandidate).sort((a, b) => (b.super ? 1 : 0) - (a.super ? 1 : 0));
    E_CANDIDATES.shortlist = [];
    E_CANDIDATES.interview = [];
    E_CANDIDATES.hired     = hired.map(toCandidate);

    // Agregace pro Analytiku (reálná data)
    _buildKrajeStats([...E_CANDIDATES.new, ...E_CANDIDATES.hired], E_CANDIDATES.hired);
    _buildResponseStats(messages, matches, employerId);
    _buildWageDistro(E_JOBS);

    // ── E_REVIEW_QUEUE (brigády k ohodnocení firmou) ─────────────────────────
    // jen skutečně potvrzené směny, které už proběhly
    const reviewQueue = confirmed
      .filter(m => _eJobPassed(_eResolveEventDate(m.job, m.created_at)) && !reviewedMatchIds.has(m.id))
      .map(m => {
        const w = m.worker || {};
        const nm = w.name || 'Brigádník';
        return {
          match_id: m.id, worker_id: m.worker_id, workerName: nm,
          avatar: nm.split(/\s+/).map(x => x[0] || '').join('').slice(0, 2).toUpperCase() || '??',
          avatarUrl: w.avatar_url || '',
          color: _strColor(m.worker_id || m.id),
          jobTitle: m.job?.title || 'Brigáda',
          dateText: m.job?.date || '',
        };
      });
    E_REVIEW_QUEUE.length = 0;
    reviewQueue.forEach(r => E_REVIEW_QUEUE.push(r));

    // ── E_CANCELLED (zrušené směny čekající na rozhodnutí firmy) ──────────────
    const cancelledQueue = matches
      .filter(m => m.status === 'cancelled' && !m.cancel_handled)
      .map(m => {
        const w = m.worker || {};
        const nm = w.name || 'Brigádník';
        return {
          match_id: m.id, job_id: m.job_id, workerName: nm,
          avatar: nm.split(/\s+/).map(x => x[0] || '').join('').slice(0, 2).toUpperCase() || '??',
          avatarUrl: w.avatar_url || '',
          color: _strColor(m.worker_id || m.id),
          jobTitle: m.job?.title || 'Brigáda',
          dateText: m.job?.date || '',
          jobFilled: m.job?.status === 'filled',
        };
      });
    E_CANCELLED.length = 0;
    cancelledQueue.forEach(c => E_CANCELLED.push(c));

    // ── E_ACTIVITY ───────────────────────────────────────────────────────────
    // Do aktivity jen PŘÍCHOZÍ zprávy (ne moje vlastní) a max 1 na konverzaci
    // (messages jsou seřazené created_at desc → první výskyt match_id = nejnovější).
    const _seenMsgMatch = new Set();
    const msgActs = messages
      .filter(msg => msg.sender_id !== employerId)
      .filter(msg => { if (_seenMsgMatch.has(msg.match_id)) return false; _seenMsgMatch.add(msg.match_id); return true; })
      .slice(0, 4)
      .map(msg => {
        const match = matches.find(m => m.id === msg.match_id);
        return {
          type: 'msg', who: match?.worker?.name || 'Kandidát',
          what: 'poslal/a zprávu',
          when: _relTime(msg.created_at), icon: 'chat-round-line-bold', color: '#5BD68A', _ts: msg.created_at,
        };
      });
    const acts = [
      ...matches.slice(0, 5).map(m => ({
        type: 'match', who: m.worker?.name || 'Kandidát',
        what: `matchoval/a na: ${m.job?.title || ''}`,
        when: _relTime(m.created_at), icon: 'heart-bold', color: '#0020F6', _ts: m.created_at,
      })),
      ...msgActs,
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
          if (msg.file_url) return { from, kind: 'file', fileUrl: msg.file_url, fileType: msg.file_type, fileName: msg.file_name, fileSize: msg.file_size, duration: msg.duration, text: msg.text || '', t: _fmtTime(msg.created_at), id: msg.id };
          return { from, text: msg.text, t: _fmtTime(msg.created_at), id: msg.id };
        });
      const lastMsg = threadMsgs[threadMsgs.length - 1];
      const w       = match.worker || {};
      const wName   = w.name || 'Kandidát';
      return {
        id: match.id, match_id: match.id, worker_id: match.worker_id,
        name: wName,
        avatar: wName.split(' ').map(p => p[0] || '').join('').slice(0,2).toUpperCase() || '??',
        avatarUrl: w.avatar_url || '',
        color: _strColor(match.worker_id || match.id),
        role: match.job?.title || '',
        city: w.address || '', rating: Number(w.rating || 0).toFixed(1),
        jobsDone: w.jobs_done || 0, level: w.level || 1, cvUrl: w.cv_url || '',
        verified: !!w.verified,
        skills: Array.isArray(w.skills) ? w.skills : [],
        last: lastMsg ? (lastMsg.kind === 'shift' ? '📅 Nabídka směny' : lastMsg.kind === 'interview' ? '🗓️ Pozvánka na pohovor' : lastMsg.text) || 'Nová shoda' : 'Nová shoda',
        time: _relTime(match.created_at),
        unread: 0, online: false, msgs: threadMsgs,
      };
    });
    E_THREADS.length = 0;
    newThreads.forEach(t => E_THREADS.push(t));

    // ── E_KPIS ───────────────────────────────────────────────────────────────
    const totalM = matches.length;
    const totalH = hired.length;
    const avgR   = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '–';
    const spark  = n => Array.from({ length: 12 }, (_, i) => n === 0 ? 0 : Math.max(0, Math.round(n * (0.15 + i * 0.07))));
    const activeJobs = E_JOBS.filter(j => j.status === 'active' || j.status === 'urgent').length;
    const newKpis = [
      { id: 'jobs',    label: 'Aktivní inzeráty', value: activeJobs, delta: 0, spark: spark(activeJobs), unit: '',  icon: 'document-text-bold' },
      { id: 'matches', label: 'Celkem matchů',    value: totalM,    delta: 0, spark: spark(totalM),     unit: '',  icon: 'heart-bold' },
      { id: 'hired',   label: 'Najato',           value: totalH,    delta: 0, spark: spark(totalH),     unit: '',  icon: 'check-circle-bold' },
      { id: 'rating',  label: 'Hodnocení firmy',  value: avgR,      delta: 0, spark: spark(5),          unit: '★', icon: 'star-bold' },
    ];
    E_KPIS.length = 0;
    newKpis.forEach(k => E_KPIS.push(k));

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

// Accept a candidate: pouze otevře chat (match 'accepted').
// Inzerát se NENAPLNÍ — zůstává aktivní pro ostatní, dokud brigádník
// nepotvrdí nabídku směny v chatu (match -> 'confirmed', job -> filled přes trigger).
async function acceptCandidate(matchId, jobId) {
  const { error: mErr } = await sb.from('matches').update({ status: 'accepted' }).eq('id', matchId);
  if (mErr) { console.error('acceptCandidate match error:', mErr); return false; }
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
  const empId = window._makejActingId || session.user.id;
  const { error } = await sb.from('profiles').update(updates).eq('id', empId);
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

  const dateVal = fields.date || new Date().toISOString().slice(0, 10);
  const payload = {
    employer_id: employerId,
    title:       fields.title,
    company:     fields.company || ECOMPANY.name || '',
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
    status:      'active',
    publish_at:  fields.publish_at || null,
    kraj:        fields.kraj || null,
    lat:         fields.lat != null ? fields.lat : null,
    lng:         fields.lng != null ? fields.lng : null,
    photos:      Array.isArray(fields.photos) ? fields.photos : [],
  };
  const { data, error } = await sb.from('jobs').insert(payload).select().single();
  if (error) { console.error('createJobE error:', error); return null; }
  return data;
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

// Smazat inzerát (natvrdo — díky FK CASCADE zmizí i matche/zhlédnutí k němu)
async function deleteJobE(jobId) {
  const { error } = await sb.from('jobs').delete().eq('id', jobId);
  if (error) { console.error('deleteJobE error:', error); return false; }
  // odeber lokálně, ať zmizí hned bez refetchu
  const i = E_JOBS.findIndex(j => j.id === jobId);
  if (i !== -1) E_JOBS.splice(i, 1);
  return true;
}

// Boost / topování inzerátu — nastaví top_until na now + hours (výchozí 48 h)
async function boostJobE(jobId, hours) {
  const until = new Date(Date.now() + (hours || 48) * 3600000).toISOString();
  const { error } = await sb.from('jobs').update({ top_until: until }).eq('id', jobId);
  if (error) { console.error('boostJobE error:', error); return false; }
  const j = E_JOBS.find(x => x.id === jobId);
  if (j) { j.boosted = true; j.boostedUntil = until; }
  return true;
}

// ── TÝM ──────────────────────────────────────────────────────────────────────
const E_TEAM = [];
async function fetchTeamE(ownerId) {
  const { data, error } = await sb.from('team_members')
    .select('*, member:profiles!team_members_member_id_fkey(name, company_name)')
    .eq('owner_id', ownerId).order('created_at', { ascending: true });
  if (error) { console.error('fetchTeamE:', error); return E_TEAM; }
  E_TEAM.length = 0;
  (data || []).forEach(m => E_TEAM.push(m));
  return E_TEAM;
}
// Vytvoří pozvánku s tokenem → vrátí i odkaz k rozeslání (e-mail je nepovinná poznámka)
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
function _teamInviteLink(token) {
  return window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + '?join=' + token;
}
async function removeTeamMemberE(id) {
  const { error } = await sb.from('team_members').delete().eq('id', id);
  if (error) { console.error('removeTeamMemberE:', error); return false; }
  const i = E_TEAM.findIndex(m => m.id === id);
  if (i !== -1) E_TEAM.splice(i, 1);
  return true;
}

// ── SOUKROMÉ POZNÁMKY KE KANDIDÁTŮM (vidí jen daný zaměstnavatel) ─────────────
const E_NOTES = {};  // worker_id -> text poznámky
async function fetchNotesE(employerId) {
  const { data, error } = await sb.from('candidate_notes')
    .select('worker_id, note').eq('employer_id', employerId);
  if (error) { console.error('fetchNotesE:', error); return E_NOTES; }
  Object.keys(E_NOTES).forEach(k => delete E_NOTES[k]);
  (data || []).forEach(r => { E_NOTES[r.worker_id] = r.note || ''; });
  return E_NOTES;
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

// Firma hodnotí brigádníka po dokončené brigádě
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

// Zrušená směna: firma znovu zveřejní inzerát (job -> active) a označí jako vyřízené
async function reopenJobE(matchId, jobId) {
  const { error: jErr } = await sb.from('jobs').update({ status: 'active' }).eq('id', jobId);
  if (jErr) { console.error('reopenJobE job error:', jErr); return false; }
  await sb.from('matches').update({ cancel_handled: true }).eq('id', matchId);
  const i = E_CANCELLED.findIndex(c => c.match_id === matchId);
  if (i >= 0) E_CANCELLED.splice(i, 1);
  return true;
}

// Zrušená směna: firma nechá inzerát zavřený, jen označí jako vyřízené
async function dismissCancelE(matchId) {
  const { error } = await sb.from('matches').update({ cancel_handled: true }).eq('id', matchId);
  if (error) { console.error('dismissCancelE error:', error); return false; }
  const i = E_CANCELLED.findIndex(c => c.match_id === matchId);
  if (i >= 0) E_CANCELLED.splice(i, 1);
  return true;
}

Object.assign(window, { fetchEmployerData, acceptCandidate, rejectCandidate, updateEmployerProfile, createJobE, updateJobE, deleteJobE, boostJobE, fetchTeamE, createTeamInviteE, removeTeamMemberE, E_TEAM, _teamInviteLink, fetchNotesE, saveNoteE, E_NOTES, submitReviewE, reopenJobE, dismissCancelE, E_REVIEW_QUEUE, E_CANCELLED, _strColor, _relTime, _fmtTime, uploadImageE, uploadChatFileE, chatSignedUrlE });
