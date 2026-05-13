// Makej Worker — Profile

function WProfile({ tick, onSignOut }) {
  const [editing, setEditing] = useStateW(false);
  const [saving,  setSaving]  = useStateW(false);
  const [form,    setForm]    = useStateW({ name: '', bio: '' });
  const [userId,  setUserId]  = useStateW(null);

  useEffectW(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  useEffectW(() => {
    setForm({
      name: W_PROFILE.name || W_PROFILE.full_name || '',
      bio:  W_PROFILE.bio  || '',
    });
  }, [tick]);

  async function handleSave() {
    if (!userId || saving) return;
    setSaving(true);
    await updateProfileW(userId, { name: form.name, bio: form.bio });
    setSaving(false);
    setEditing(false);
  }

  const name    = W_PROFILE.name || W_PROFILE.full_name || 'Brigádník';
  const email   = W_PROFILE.email || '';
  const bio     = W_PROFILE.bio   || '';
  const initials = name.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '?';

  const skills  = Array.isArray(W_PROFILE.skills) ? W_PROFILE.skills : [];
  const rating  = W_PROFILE.rating  || 0;
  const jobs    = W_PROFILE.jobs_done || 0;
  const hours   = W_PROFILE.hours_total || 0;
  const earned  = W_PROFILE.earned_total || 0;

  const STATS = [
    { label: 'Hodnocení', value: rating > 0 ? rating.toFixed(1) + ' ★' : '—', icon: 'star-bold', color: T.super },
    { label: 'Brigády',   value: jobs  != null ? jobs  : '—', icon: 'case-round-bold',   color: '#8AB4FF' },
    { label: 'Odprac. h', value: hours != null ? hours : '—', icon: 'clock-circle-bold', color: '#5BD68A' },
    { label: 'Vydělal/a', value: earned > 0 ? Math.round(earned / 1000) + ' tis Kč' : '—', icon: 'dollar-bold', color: '#F4A261' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 24px' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Profil</div>
        <button
          onClick={() => setEditing(e => !e)}
          style={{
            padding: '7px 14px', borderRadius: 8,
            background: editing ? 'rgba(244,63,94,0.1)' : 'rgba(91,107,255,0.18)',
            border: '1px solid ' + (editing ? 'rgba(244,63,94,0.3)' : 'rgba(91,107,255,0.35)'),
            color: editing ? '#f43f5e' : '#fff',
            fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
          <Icon name={editing ? 'close-circle-bold' : 'pen-2-bold'} size={13} color={editing ? '#f43f5e' : '#fff'} />
          {editing ? 'Zrušit' : 'Upravit'}
        </button>
      </div>

      {/* Avatar + name */}
      <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 999,
          background: 'linear-gradient(135deg, #0020F6, #5B6BFF)',
          display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 26,
          boxShadow: '0 8px 24px rgba(0,32,246,0.35)',
          flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(91,107,255,0.4)',
                color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 18,
                outline: 'none', marginBottom: 6,
              }}
            />
          ) : (
            <div style={{ color: '#fff', fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, letterSpacing: -0.3, marginBottom: 3 }}>{name}</div>
          )}
          <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 12 }}>{email}</div>
          <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, background: 'rgba(91,107,255,0.14)', border: '1px solid rgba(91,107,255,0.25)' }}>
            <Icon name="verified-check-bold" size={11} color="#5B6BFF" />
            <span style={{ color: T.light, fontFamily: T.fontUI, fontSize: 10, fontWeight: 700 }}>Brigádník</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {STATS.map(s => (
            <div key={s.label} style={{
              padding: '14px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: s.color + '1a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={s.icon} size={16} color={s.color} />
              </div>
              <div>
                <div style={{ color: '#fff', fontFamily: T.fontHead, fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>{s.value}</div>
                <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 10, marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>O mně</div>
        {editing ? (
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Napiš pár vět o sobě, zkušenostech nebo dostupnosti…"
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(91,107,255,0.4)',
              color: '#fff', fontFamily: T.fontUI, fontSize: 13, outline: 'none', resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        ) : (
          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)', border: '1px solid ' + T.border,
            color: bio ? '#fff' : T.mutedSoft,
            fontFamily: T.fontUI, fontSize: 13, lineHeight: 1.6,
          }}>
            {bio || 'Zatím žádný popis. Klikni „Upravit" a přidej ho.'}
          </div>
        )}
      </div>

      {/* Skills */}
      {(skills.length > 0 || editing) && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ color: T.muted, fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Dovednosti</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {skills.map((sk, i) => (
              <span key={i} style={{
                padding: '5px 11px', borderRadius: 999,
                background: 'rgba(91,107,255,0.12)', border: '1px solid rgba(91,107,255,0.25)',
                color: T.light, fontFamily: T.fontUI, fontSize: 11, fontWeight: 600,
              }}>{sk}</span>
            ))}
            {skills.length === 0 && (
              <span style={{ color: T.mutedSoft, fontFamily: T.fontUI, fontSize: 12 }}>Žádné dovednosti zatím</span>
            )}
          </div>
        </div>
      )}

      {/* Save button (only in edit mode) */}
      {editing && (
        <div style={{ padding: '4px 20px 16px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: 'linear-gradient(135deg, #0020F6, #3a3a99)',
              border: 'none', color: '#fff',
              fontFamily: T.fontHead, fontSize: 15, fontWeight: 800,
              cursor: 'pointer', opacity: saving ? 0.6 : 1,
            }}>
            {saving ? 'Ukládám…' : 'Uložit profil'}
          </button>
        </div>
      )}

      {/* Sign out */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ height: 1, background: T.border, marginBottom: 16 }} />
        <button
          onClick={onSignOut}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)',
            color: '#f43f5e', fontFamily: T.fontUI, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <Icon name="logout-2-bold" size={16} color="#f43f5e" />
          Odhlásit se
        </button>
      </div>
    </div>
  );
}
