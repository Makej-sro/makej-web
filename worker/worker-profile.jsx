// Makej Worker — Profile

function WProfile({ tick, onSignOut }) {
  const [editing, setEditing] = useStateW(false);
  const [saving,  setSaving]  = useStateW(false);
  const [form,    setForm]    = useStateW({ name: '', bio: '', skills: [], education: '', cv_url: '' });
  const [skillInput, setSkillInput] = useStateW('');
  const [userId,  setUserId]  = useStateW(null);
  const [showAllReviews, setShowAllReviews] = useStateW(false);
  const [notifsOn, setNotifsOn] = useStateW(() => (typeof localStorage === 'undefined' || localStorage.getItem('makej-notifs') !== 'off'));
  const [confirmDel, setConfirmDel] = useStateW(false);
  const [deleting, setDeleting] = useStateW(false);
  const [delPassword, setDelPassword] = useStateW('');   // heslo pro potvrzení smazání
  const [delErr, setDelErr] = useStateW('');

  function toggleNotifs() {
    setNotifsOn(v => {
      const nv = !v;
      try { localStorage.setItem('makej-notifs', nv ? 'on' : 'off'); } catch (e) {}
      return nv;
    });
  }
  async function handleDeleteAccount() {
    if (deleting) return;
    const pw = (delPassword || '').trim();
    if (!pw) { setDelErr('Pro potvrzení zadej svoje heslo.'); return; }
    setDeleting(true);
    setDelErr('');
    // 1) Ověř heslo — re-přihlášení stejným účtem. Špatné heslo = konec.
    const { data: { session } } = await sb.auth.getSession();
    const email = session?.user?.email || '';
    const { error: pwErr } = await sb.auth.signInWithPassword({ email, password: pw });
    if (pwErr) { setDeleting(false); setDelErr('Nesprávné heslo. Zkus to znovu.'); return; }
    // 2) Heslo sedí → smaž účet (RPC delete_my_account) a odhlas.
    const { error } = await sb.rpc('delete_my_account');
    if (error) { setDeleting(false); setDelErr('Účet se nepodařilo smazat. Zkus to prosím znovu.'); return; }
    await sb.auth.signOut();
    window.location.href = '/';
  }
  function closeDelModal() { if (deleting) return; setConfirmDel(false); setDelPassword(''); setDelErr(''); }

  useEffectW(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  useEffectW(() => {
    setForm({
      name: W_PROFILE.name || W_PROFILE.full_name || '',
      bio:  W_PROFILE.bio  || '',
      skills: Array.isArray(W_PROFILE.skills) ? [...W_PROFILE.skills] : [],
      education: W_PROFILE.education || '',
      cv_url: W_PROFILE.cv_url || '',
    });
  }, [tick]);

  function addSkill() {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s)) { setSkillInput(''); return; }
    setForm(f => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput('');
  }
  function removeSkill(idx) {
    setForm(f => ({ ...f, skills: f.skills.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    if (!userId || saving) return;
    setSaving(true);
    await updateProfileW(userId, {
      name: form.name, bio: form.bio,
      skills: form.skills, education: form.education.trim(),
      cv_url: form.cv_url.trim(),
    });
    setSaving(false);
    setEditing(false);
  }

  const name    = W_PROFILE.name || W_PROFILE.full_name || 'Brigádník';
  const email   = W_PROFILE.email || '';
  const bio     = W_PROFILE.bio   || '';
  const initials = name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '?';

  const skills    = Array.isArray(W_PROFILE.skills) ? W_PROFILE.skills : [];
  const education = W_PROFILE.education || '';
  const cvUrl     = W_PROFILE.cv_url || '';
  const rating  = Number(W_PROFILE.rating)  || 0;
  const jobs    = W_PROFILE.jobs_done || 0;
  const hours   = W_PROFILE.hours_logged || 0;
  const earned  = W_PROFILE.total_earned || 0;
  const lvl     = makejLevel(W_PROFILE.xp);
  const reviews = Array.isArray(W_REVIEWS) ? W_REVIEWS : [];
  const shownReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const STATS = [
    { label: 'Hodnocení', value: rating > 0 ? rating.toFixed(1) + ' ★' : '—', icon: 'star-bold', color: T.super },
    { label: 'Brigády',   value: jobs  != null ? jobs  : '—', icon: 'case-round-bold',   color: '#8AB4FF' },
    { label: 'Odprac. h', value: hours != null ? hours : '—', icon: 'clock-circle-bold', color: '#5BD68A' },
    { label: 'Vydělal/a', value: earned > 0 ? Math.round(earned / 1000) + ' tis Kč' : '—', icon: 'dollar-bold', color: '#F4A261' },
  ];

  const cardShadow = '0 6px 16px rgba(20,22,40,0.06)';
  const STAT_CARDS = [
    { value: rating > 0 ? rating.toFixed(1).replace('.', ',') : '—', label: 'Hodnocení', icon: 'star-bold', color: '#F5A623', bg: 'rgba(245,166,35,0.14)' },
    { value: jobs, label: 'Brigády', icon: 'case-round-bold', color: T.primary, bg: 'rgba(0,32,246,0.1)' },
    { value: `${hours} h`, label: 'Odpracováno', icon: 'clock-circle-bold', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
    { value: earned > 0 ? earned.toLocaleString('cs-CZ').replace(/,/g, ' ') : '0', label: 'Vyděláno Kč', dark: true, kc: true },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', width: '100%', padding: '28px 24px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 92, height: 92, borderRadius: 24,
            background: 'linear-gradient(135deg, #0020F6, #5B6BFF)',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 34,
            boxShadow: '0 12px 30px rgba(0,32,246,0.35)', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            {editing ? (
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', maxWidth: 360, padding: '8px 12px', borderRadius: 10, background: '#fff', border: '1px solid ' + T.border, color: T.ink, fontFamily: T.fontHead, fontWeight: 800, fontSize: 26, outline: 'none', marginBottom: 6 }} />
            ) : (
              <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 32, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 }}>{name}</div>
            )}
            {email && <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 15, marginTop: 6 }}>{email}</div>}
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(22,163,74,0.12)' }}>
              <Icon name="verified-check-bold" size={14} color="#16a34a" />
              <span style={{ color: '#16a34a', fontFamily: T.fontUI, fontSize: 13, fontWeight: 700 }}>{W_PROFILE.verified ? 'Ověřený brigádník' : 'Brigádník'}</span>
            </div>
          </div>
          <button
            onClick={() => setEditing(e => !e)}
            style={{
              padding: '11px 20px', borderRadius: 999, flexShrink: 0, marginRight: 46,
              background: editing ? '#fff' : '#141414',
              border: '1px solid ' + (editing ? T.border : '#141414'),
              color: editing ? T.ink : '#fff',
              fontFamily: T.fontHead, fontSize: 14, fontWeight: 800, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 7,
              boxShadow: editing ? 'none' : '0 6px 16px rgba(20,20,30,0.2)',
            }}>
            <Icon name={editing ? 'close-circle-bold' : 'pen-2-bold'} size={15} color={editing ? T.ink : '#fff'} />
            {editing ? 'Zrušit' : 'Upravit'}
          </button>
        </div>

        {/* Level karta */}
        <div style={{ padding: '20px 22px', borderRadius: 20, background: '#fff', border: '1px solid ' + T.border, boxShadow: cardShadow, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18, flexShrink: 0,
              background: 'linear-gradient(135deg, #0020F6, #5B6BFF)',
              display: 'grid', placeItems: 'center',
              color: '#fff', fontFamily: T.fontHead, fontWeight: 900, fontSize: 26,
              boxShadow: '0 8px 20px rgba(0,32,246,0.4)',
            }}>{lvl.level}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 9 }}>
                  <span style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{lvl.title}</span>
                  <span style={{ color: T.primary, fontFamily: T.fontUI, fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>LEVEL {lvl.level}</span>
                </div>
                <span style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13.5 }}>{jobs} {_wPlural(jobs, 'brigáda', 'brigády', 'brigád')} dokončeno</span>
              </div>
              <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 13.5, marginTop: 4 }}>
                {lvl.isMax ? 'Maximální level — jsi legenda! 👑'
                  : <>Ještě {lvl.toNext} XP do levelu {lvl.level + 1}{lvl.nextTitle ? <> · <b style={{ color: T.ink }}>{lvl.nextTitle}</b></> : null}</>}
              </div>
              <div style={{ marginTop: 12, height: 10, borderRadius: 999, background: 'rgba(18,18,26,0.08)', overflow: 'hidden' }}>
                <div style={{ width: (lvl.progress * 100).toFixed(0) + '%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #0020F6, #5B6BFF)', transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
          {STAT_CARDS.map(s => (
            <div key={s.label} style={{
              padding: '20px 22px', borderRadius: 18,
              background: s.dark ? '#141414' : '#fff',
              border: '1px solid ' + (s.dark ? '#141414' : T.border),
              boxShadow: cardShadow, display: 'flex', alignItems: 'center', gap: 15,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: s.dark ? 'rgba(255,255,255,0.1)' : s.bg, display: 'grid', placeItems: 'center', flexShrink: 0, color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 15 }}>
                {s.kc ? 'Kč' : <Icon name={s.icon} size={22} color={s.color} />}
              </div>
              <div>
                <div style={{ color: s.dark ? '#6E8BFF' : T.ink, fontFamily: T.fontHead, fontWeight: 800, fontSize: 26, letterSpacing: -0.5 }}>{s.value}</div>
                <div style={{ color: s.dark ? 'rgba(255,255,255,0.6)' : T.muted, fontFamily: T.fontUI, fontSize: 13, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── EDIT MODE ── */}
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={labelStyle}>O mně</div>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Napiš pár vět o sobě, zkušenostech nebo dostupnosti…" rows={3}
                style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
            <div>
              <div style={labelStyle}>Dovednosti</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {form.skills.map((sk, i) => (
                  <span key={i} style={{ ...pillStyle, display: 'inline-flex', alignItems: 'center', gap: 7 }}>{sk}
                    <span onClick={() => removeSkill(i)} style={{ cursor: 'pointer', color: '#f43f5e', fontWeight: 800, lineHeight: 1 }}>×</span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="Např. Pokladna, Latte art…" style={{ ...fieldStyle, flex: 1 }} />
                <button onClick={addSkill} style={{ padding: '0 20px', borderRadius: 12, background: 'rgba(0,32,246,0.1)', border: '1px solid rgba(0,32,246,0.2)', color: T.primary, fontFamily: T.fontHead, fontSize: 14, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Přidat</button>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Vzdělání</div>
              <input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} placeholder="Např. SŠ / VŠ — obor, ročník…" style={fieldStyle} />
            </div>
            <div>
              <div style={labelStyle}>Životopis <span style={{ color: T.mutedSoft, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>· nepovinné</span></div>
              <input value={form.cv_url} onChange={e => setForm(f => ({ ...f, cv_url: e.target.value }))} placeholder="Odkaz na životopis (PDF / Disk / LinkedIn)…" style={fieldStyle} />
              <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>Vlož veřejný odkaz na svůj životopis. Je to dobrovolné — zaměstnavatel ho uvidí u tvého profilu.</div>
            </div>
            <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '15px', borderRadius: 14, background: T.primary, border: 'none', color: '#fff', fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1, boxShadow: '0 8px 18px rgba(0,32,246,0.28)' }}>
              {saving ? 'Ukládám…' : 'Uložit profil'}
            </button>
          </div>
        ) : (
          <>
            {/* Recenze na mě */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Recenze na mě{reviews.length > 0 ? ` · ${reviews.length}` : ''}
                </div>
                {rating > 0 && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="star-bold" size={15} color={T.super} />
                    <span style={{ color: T.ink, fontFamily: T.fontHead, fontWeight: 800, fontSize: 15 }}>{rating.toFixed(1).replace('.', ',')}</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div style={{ padding: '18px 20px', borderRadius: 16, background: '#fff', border: '1px solid ' + T.border, boxShadow: cardShadow, color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 13.5, lineHeight: 1.5, textAlign: 'center' }}>
                  Zatím nemáš žádné recenze. Po dokončené brigádě tě zaměstnavatel ohodnotí a recenze se objeví tady.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
                  {shownReviews.map(r => (
                    <div key={r.id} style={{ padding: '16px 18px', borderRadius: 18, background: '#fff', border: '1px solid ' + T.border, boxShadow: cardShadow }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: r.text ? 12 : 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 13, background: r.color, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{r.avatar}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.author}</span>
                            {r.verified && <Icon name="verified-check-bold" size={13} color="#16a34a" />}
                          </div>
                          <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12.5, marginTop: 2 }}>{[r.jobTitle, r.when].filter(Boolean).join(' · ')}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Icon key={n} name="star-bold" size={15} color={n <= r.rating ? T.super : 'rgba(18,18,26,0.14)'} />
                          ))}
                        </div>
                      </div>
                      {r.text && <div style={{ color: T.inkSoft, fontFamily: T.fontUI, fontSize: 14, lineHeight: 1.55 }}>„{r.text}"</div>}
                    </div>
                  ))}
                  {reviews.length > 3 && (
                    <button onClick={() => setShowAllReviews(v => !v)} style={{ gridColumn: '1 / -1', padding: '11px', borderRadius: 12, background: 'rgba(0,32,246,0.08)', border: '1px solid rgba(0,32,246,0.16)', color: T.primary, fontFamily: T.fontHead, fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>
                      {showAllReviews ? 'Zobrazit méně' : `Zobrazit všech ${reviews.length} recenzí`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* O mně + Dovednosti */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
              <div>
                <div style={labelStyle}>O mně</div>
                <div style={{ color: bio ? T.ink : T.mutedSoft, fontFamily: T.fontUI, fontSize: 14.5, lineHeight: 1.6 }}>
                  {bio || 'Zatím žádný popis. Klikni „Upravit" a přidej ho.'}
                </div>
                {education && (<>
                  <div style={{ ...labelStyle, marginTop: 18 }}>Vzdělání</div>
                  <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 14.5 }}>{education}</div>
                </>)}
                {cvUrl && (
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, background: '#fff', border: '1px solid ' + T.border, boxShadow: cardShadow, color: T.ink, fontFamily: T.fontHead, fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                    <Icon name="document-text-bold" size={16} color={T.primary} />Můj životopis
                  </a>
                )}
              </div>
              <div>
                <div style={labelStyle}>Dovednosti</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {skills.length === 0
                    ? <span style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 13.5 }}>Zatím žádné dovednosti. Klikni „Upravit" a přidej je.</span>
                    : skills.map((sk, i) => <span key={i} style={pillStyle}>{sk}</span>)}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Nastavení */}
        {!editing && (
          <div style={{ marginTop: 8, maxWidth: 520 }}>
            <div style={labelStyle}>Nastavení</div>
            <div style={{ background: '#fff', border: '1px solid ' + T.border, borderRadius: 16, boxShadow: cardShadow, overflow: 'hidden' }}>
              {/* Notifikace */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(0,32,246,0.08)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="bell-bold" size={17} color={T.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 14, fontWeight: 800 }}>Upozornění</div>
                  <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 12.5 }}>Zprávy a nabídky směn</div>
                </div>
                <button onClick={toggleNotifs} title="Zapnout/vypnout upozornění" style={{
                  width: 48, height: 28, borderRadius: 999, flexShrink: 0, cursor: 'pointer', position: 'relative',
                  background: notifsOn ? T.primary : 'rgba(18,18,26,0.18)', border: 'none', transition: 'background .2s',
                }}>
                  <span style={{ position: 'absolute', top: 3, left: notifsOn ? 23 : 3, width: 22, height: 22, borderRadius: 999, background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'left .2s' }} />
                </button>
              </div>

              <div style={{ height: 1, background: T.border }} />

              {/* Odhlásit se */}
              <button onClick={onSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(18,18,26,0.05)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="logout-2-bold" size={17} color={T.ink} />
                </div>
                <span style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 14, fontWeight: 800 }}>Odhlásit se</span>
              </button>

              <div style={{ height: 1, background: T.border }} />

              {/* Smazat účet */}
              <button onClick={() => setConfirmDel(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(244,63,94,0.1)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name="trash-bin-trash-bold" size={17} color="#f43f5e" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#f43f5e', fontFamily: T.fontHead, fontSize: 14, fontWeight: 800 }}>Smazat účet</div>
                  <div style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12.5 }}>Trvale odstraní tvůj profil a data</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Potvrzení smazání účtu */}
      {confirmDel && (
        <div onClick={closeDelModal} style={{
          position: 'fixed', inset: 0, zIndex: 150,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)',
          display: 'grid', placeItems: 'center', padding: 20,
          animation: 'wPop .28s cubic-bezier(.2,.8,.2,1)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 380, background: T.card,
            borderRadius: 24, border: '1px solid ' + T.border, padding: 26, textAlign: 'center',
            boxShadow: '0 24px 60px rgba(20,22,40,0.28)',
          }}>
            <div style={{ width: 60, height: 60, borderRadius: 17, background: 'rgba(244,63,94,0.12)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Icon name="trash-bin-trash-bold" size={28} color="#f43f5e" />
            </div>
            <div style={{ color: T.ink, fontFamily: T.fontHead, fontSize: 21, fontWeight: 800, letterSpacing: -0.4 }}>Opravdu smazat všechna data?</div>
            <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
              Trvale se odstraní tvůj profil, brigády, zprávy i recenze. Tuhle akci nelze vrátit.
            </div>
            <div style={{ textAlign: 'left', marginTop: 18 }}>
              <div style={{ color: T.ink, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Pro potvrzení zadej svoje heslo</div>
              <input
                type="password"
                value={delPassword}
                onChange={e => { setDelPassword(e.target.value); if (delErr) setDelErr(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleDeleteAccount(); }}
                placeholder="Tvoje heslo"
                autoComplete="current-password"
                disabled={deleting}
                style={{ ...fieldStyle }}
              />
              {delErr && <div style={{ color: '#f43f5e', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 600, marginTop: 7 }}>{delErr}</div>}
            </div>
            <button onClick={handleDeleteAccount} disabled={deleting} style={{
              width: '100%', marginTop: 18, padding: '14px', borderRadius: 14,
              background: '#f43f5e', border: 'none', color: '#fff',
              fontFamily: T.fontHead, fontSize: 15, fontWeight: 800, cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.6 : 1,
            }}>{deleting ? 'Mažu…' : 'Ano, smazat účet'}</button>
            <button onClick={closeDelModal} style={{
              width: '100%', marginTop: 10, padding: '13px', borderRadius: 14,
              background: T.surfaceAlt, border: '1px solid ' + T.border, color: T.muted,
              fontFamily: T.fontHead, fontSize: 14.5, fontWeight: 800, cursor: 'pointer',
            }}>Zpět</button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 };
const fieldStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, background: '#fff', border: '1px solid ' + T.border, color: T.ink, fontFamily: T.fontUI, fontSize: 14, outline: 'none' };
const pillStyle = { padding: '9px 16px', borderRadius: 999, background: '#fff', border: '1px solid ' + T.border, boxShadow: '0 2px 6px rgba(20,22,40,0.05)', color: T.ink, fontFamily: T.fontHead, fontSize: 14, fontWeight: 700 };
