// Makej Worker — Supabase data layer
// Must load before worker-swipe/messages/profile/main

const useStateW = React.useState;
const useEffectW = React.useEffect;
const useRefW    = React.useRef;

// ── Globals (mutated in-place, React reads via tick) ───────────
const W_PROFILE  = {};
const W_JOBS     = [];   // active jobs not yet swiped
const W_THREADS  = [];   // one per accepted match

// ── Helpers ────────────────────────────────────────────────────
function _wColor(str) {
  const cols = ['#F4A261','#8AB4FF','#5BD68A','#E0B0FF','#FF6B35','#FFD166','#5B6BFF','#f43f5e'];
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return cols[Math.abs(h) % cols.length];
}

function _wFmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const days = ['Ne','Po','Út','St','Čt','Pá','So'];
  const months = ['1.','2.','3.','4.','5.','6.','7.','8.','9.','10.','11.','12.'];
  return `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]}`;
}

function _wFmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

// Adapts a Supabase job row to the shape expected by JobCard (from app.jsx)
function jobToCard(job) {
  const name   = job.company || 'Firma';
  const logo   = name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??';
  const accent = _wColor(job.id);
  return {
    ...job,
    logo,
    logoColor: accent,
    payUnit:   job.pay_unit || 'Kč/h',
    total:     job.pay * 8,
    when:      _wFmtDate(job.date),
    time:      [job.time_start, job.time_end].filter(Boolean).join(' – '),
    rating:    4.5,
    reviews:   100,
    tags:      Array.isArray(job.tags) ? job.tags : [],
    accent,
    distance:  job.distance || null,
    desc:      job.description || '',
    perks:     Array.isArray(job.requirements) ? job.requirements : [],
  };
}

// ── Main fetch ─────────────────────────────────────────────────
async function fetchWorkerData(workerId) {
  try {
    // Profile
    const { data: profile } = await sb.from('profiles').select('*').eq('id', workerId).single();
    Object.keys(W_PROFILE).forEach(k => delete W_PROFILE[k]);
    Object.assign(W_PROFILE, profile || {});

    // IDs to exclude (already swiped)
    const [rejRes, matchRes] = await Promise.all([
      sb.from('rejections').select('job_id').eq('worker_id', workerId),
      sb.from('matches').select('job_id').eq('worker_id', workerId),
    ]);
    const excludeIds = [
      ...(rejRes.data  || []).map(r => r.job_id),
      ...(matchRes.data || []).map(m => m.job_id),
    ];

    // Active jobs
    let q = sb.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (excludeIds.length > 0) q = q.not('id', 'in', `(${excludeIds.join(',')})`);
    const { data: jobs } = await q;
    W_JOBS.length = 0;
    (jobs || []).forEach(j => W_JOBS.push(j));

    // All matches → threads (accepted + pending that may have messages)
    const { data: matches } = await sb.from('matches')
      .select('*, job:jobs(*, employer:profiles!jobs_employer_id_fkey(*))')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false });

    const allMatches = matches || [];
    const matchIds   = allMatches.map(m => m.id);
    let   messages  = [];

    if (matchIds.length > 0) {
      const { data: msgs } = await sb.from('messages')
        .select('*')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false })
        .limit(400);
      messages = msgs || [];
    }

    // Only show threads that are accepted OR have at least one message
    const messageMatchIds = new Set(messages.map(m => m.match_id));
    const threadMatches = allMatches.filter(m => m.status === 'accepted' || messageMatchIds.has(m.id));

    const newThreads = threadMatches.map(match => {
      const job        = match.job || {};
      const employer   = job.employer || {};
      const company    = employer.company_name || employer.name || job.company || 'Zaměstnavatel';
      const logo       = company.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??';

      const threadMsgs = messages
        .filter(msg => msg.match_id === match.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(msg => {
          const isMe    = msg.sender_id === workerId;
          const isShift = msg.type === 'shift_offer' && msg.metadata;
          if (isShift) return { from: isMe ? 'me' : 'them', kind: 'shift', shift: msg.metadata, t: _wFmtTime(msg.created_at), id: msg.id };
          return { from: isMe ? 'me' : 'them', text: msg.text, t: _wFmtTime(msg.created_at), id: msg.id };
        });

      const lastMsg = threadMsgs[threadMsgs.length - 1];
      const lastPreview = lastMsg
        ? (lastMsg.kind === 'shift' ? '📅 Nabídka směny' : lastMsg.text)
        : 'Nová shoda!';
      const lastTime = lastMsg
        ? _wFmtTime(messages.find(m => m.id === lastMsg.id)?.created_at || '')
        : _wFmtTime(match.created_at);

      return {
        id: match.id, match_id: match.id,
        name: company, avatar: logo,
        color: _wColor(match.id),
        role: job.title || '',
        last: lastPreview, time: lastTime,
        unread: 0, online: false,
        msgs: threadMsgs,
      };
    });

    W_THREADS.length = 0;
    newThreads.forEach(t => W_THREADS.push(t));

    return true;
  } catch (err) {
    console.error('[worker-supabase] fetchWorkerData error:', err);
    return false;
  }
}

async function createMatchW(workerId, jobId) {
  const { data, error } = await sb.from('matches')
    .insert({ worker_id: workerId, job_id: jobId, status: 'pending' })
    .select().single();
  if (error && error.code !== '23505') console.error('createMatchW:', error);
  return data;
}

async function createRejectionW(workerId, jobId) {
  const { error } = await sb.from('rejections').insert({ worker_id: workerId, job_id: jobId });
  if (error && error.code !== '23505') console.error('createRejectionW:', error);
}

async function sendMessageW(matchId, senderId, text, type, metadata) {
  const payload = { match_id: matchId, sender_id: senderId, text };
  if (type && type !== 'text') payload.type = type;
  if (metadata) payload.metadata = metadata;
  const { data, error } = await sb.from('messages').insert(payload).select().single();
  if (error) console.error('sendMessageW:', error);
  return data;
}

async function updateProfileW(workerId, updates) {
  const { error } = await sb.from('profiles').update(updates).eq('id', workerId);
  if (error) { console.error('updateProfileW:', error); return false; }
  Object.assign(W_PROFILE, updates);
  return true;
}

Object.assign(window, {
  W_PROFILE, W_JOBS, W_THREADS,
  fetchWorkerData, createMatchW, createRejectionW, sendMessageW, updateProfileW,
  jobToCard, _wColor, _wFmtTime, _wFmtDate,
});
