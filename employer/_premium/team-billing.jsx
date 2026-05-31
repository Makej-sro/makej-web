// ─────────────────────────────────────────────────────────────
//  Makej — Employer Premium: Tým + Fakturace
//  Tarif: Business / Pro
//
//  Jak zapojit zpět — viz _premium/README.md
//
//  Exportuje:  ETeam, EBilling
// ─────────────────────────────────────────────────────────────

// ── DATA ──────────────────────────────────────────────────────

const E_TEAM = [
  { id: 'u1', name: 'Anna Křížková',   avatar: 'AK', color: '#F4A261', role: 'Owner',    email: 'anna@kafepunkt.cz',   lastActive: 'právě teď',  perms: ['jobs','candidates','billing','settings','team'] },
  { id: 'u2', name: 'Petr Novák',      avatar: 'PN', color: '#8AB4FF', role: 'Manažer',  email: 'petr@kafepunkt.cz',   lastActive: 'před 2 h',   perms: ['jobs','candidates','settings'] },
  { id: 'u3', name: 'Michal Dvořák',   avatar: 'MD', color: '#5BD68A', role: 'Recruiter', email: 'michal@kafepunkt.cz', lastActive: 'včera',      perms: ['jobs','candidates'] },
  { id: 'u4', name: 'Eva Horáčková',   avatar: 'EH', color: '#FFD166', role: 'Účetní',   email: 'eva@kafepunkt.cz',    lastActive: 'před 3 dny', perms: ['billing'] },
  { id: 'u5', name: 'Pozvánka čeká…', avatar: '?',  color: '#555580', role: 'Recruiter', email: 'novy@kafepunkt.cz',   lastActive: 'neaktivní',  perms: ['jobs','candidates'], pending: true },
];

const E_AUDIT = [
  { who: 'Anna Křížková',  action: 'Přidala inzerát „Barista do specialty kavárny"',    when: 'před 2 h' },
  { who: 'Michal Dvořák',  action: 'Přesunul Tomáše Marka do fáze Pohovor',              when: 'před 5 h' },
  { who: 'Petr Novák',     action: 'Změnil nastavení notifikací',                         when: 'včera 18:42' },
  { who: 'Anna Křížková',  action: 'Obnovila tarif Premium',                              when: 'před 2 dny' },
  { who: 'Eva Horáčková',  action: 'Stáhla fakturu INV-2025-04',                          when: 'před 4 dny' },
  { who: 'Michal Dvořák',  action: 'Archivoval inzerát „Cateringový tým — 14.5."',        when: 'před 5 dny' },
];

const PERM_LABELS = {
  jobs:       'Inzeráty',
  candidates: 'Kandidáti',
  billing:    'Fakturace',
  settings:   'Nastavení',
  team:       'Tým',
};

// ── TEAM ──────────────────────────────────────────────────────

function ETeam() {
  const [members]    = React.useState(E_TEAM);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [invEmail,   setInvEmail]   = React.useState('');

  const roleColor = r => ({
    Owner: '#F4A261', Manažer: '#8AB4FF', Recruiter: '#5BD68A',
    Účetní: '#FFD166',
  }[r] || '#9999cc');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#d0d0ff' }}>Členové týmu</div>
          <div style={{ color: '#9999cc', fontSize: 13, marginTop: 2 }}>
            {members.filter(m => !m.pending).length} aktivní · 1 čekající pozvánka
          </div>
        </div>
        <button
          onClick={() => setInviteOpen(v => !v)}
          style={{
            background: 'linear-gradient(135deg,#292978,#3a3a99)',
            border: 'none', borderRadius: 10, padding: '9px 18px',
            color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Icon name="add-circle-bold" size={16} />
          Pozvat člena
        </button>
      </div>

      {/* Invite form */}
      {inviteOpen && (
        <div style={{
          background: 'rgba(41,41,120,0.3)', border: '1px solid rgba(208,208,255,0.12)',
          borderRadius: 14, padding: 20, display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <input
            value={invEmail}
            onChange={e => setInvEmail(e.target.value)}
            placeholder="email@firma.cz"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(208,208,255,0.14)', borderRadius: 10,
              padding: '9px 14px', color: '#fff', fontFamily: 'inherit', fontSize: 14,
              outline: 'none',
            }}
          />
          <select style={{
            background: '#16163b', border: '1px solid rgba(208,208,255,0.14)',
            borderRadius: 10, padding: '9px 12px', color: '#d0d0ff',
            fontFamily: 'inherit', fontSize: 13, outline: 'none',
          }}>
            <option>Recruiter</option>
            <option>Manažer</option>
            <option>Účetní</option>
          </select>
          <button style={{
            background: 'linear-gradient(135deg,#292978,#3a3a99)',
            border: 'none', borderRadius: 10, padding: '9px 16px',
            color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            Odeslat pozvánku
          </button>
        </div>
      )}

      {/* Member table */}
      <ECard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {members.map((m, i) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 20px',
              borderBottom: i < members.length - 1 ? '1px solid rgba(208,208,255,0.07)' : 'none',
              opacity: m.pending ? 0.55 : 1,
            }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: m.color + '22',
                border: `2px solid ${m.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, color: m.color, flexShrink: 0,
              }}>
                {m.avatar}
              </div>

              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {m.name}
                  {m.pending && (
                    <span style={{ background: 'rgba(255,209,102,0.15)', color: '#FFD166', borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                      čeká
                    </span>
                  )}
                </div>
                <div style={{ color: '#9999cc', fontSize: 12, marginTop: 1 }}>{m.email}</div>
              </div>

              {/* Role */}
              <div style={{
                background: roleColor(m.role) + '22',
                border: `1px solid ${roleColor(m.role)}44`,
                color: roleColor(m.role),
                borderRadius: 8, padding: '3px 12px',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {m.role}
              </div>

              {/* Permissions */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 280 }}>
                {m.perms.map(p => (
                  <span key={p} style={{
                    background: 'rgba(208,208,255,0.07)',
                    border: '1px solid rgba(208,208,255,0.12)',
                    color: '#9999cc', borderRadius: 6, padding: '2px 8px', fontSize: 11,
                  }}>
                    {PERM_LABELS[p]}
                  </span>
                ))}
              </div>

              {/* Last active */}
              <div style={{ color: '#9999cc', fontSize: 12, minWidth: 90, textAlign: 'right' }}>
                {m.lastActive}
              </div>

              {/* Actions */}
              {m.role !== 'Owner' && (
                <button style={{
                  background: 'transparent', border: '1px solid rgba(244,63,94,0.25)',
                  borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                  color: '#f43f5e', fontSize: 12, fontFamily: 'inherit',
                }}>
                  {m.pending ? 'Zrušit' : 'Odebrat'}
                </button>
              )}
            </div>
          ))}
        </div>
      </ECard>

      {/* Audit log */}
      <SectionHeader title="Historie aktivit" subtitle="Kdo co dělal a kdy" />
      <ECard>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {E_AUDIT.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
              borderBottom: i < E_AUDIT.length - 1 ? '1px solid rgba(208,208,255,0.07)' : 'none',
            }}>
              <Icon name="history-bold" size={16} color="#9999cc" />
              <div style={{ flex: 1, fontSize: 13, color: '#d0d0ff' }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>{a.who}</span>
                {' '}
                {a.action}
              </div>
              <div style={{ color: '#9999cc', fontSize: 12, flexShrink: 0 }}>{a.when}</div>
            </div>
          ))}
        </div>
      </ECard>
    </div>
  );
}

// ── BILLING ────────────────────────────────────────────────────

const E_INVOICES = [
  { id: 'INV-2025-05', date: '1. 5. 2025',  amount: 2_490, status: 'zaplaceno', plan: 'Premium měsíčně' },
  { id: 'INV-2025-04', date: '1. 4. 2025',  amount: 2_490, status: 'zaplaceno', plan: 'Premium měsíčně' },
  { id: 'INV-2025-03', date: '1. 3. 2025',  amount: 2_490, status: 'zaplaceno', plan: 'Premium měsíčně' },
  { id: 'INV-2025-02', date: '1. 2. 2025',  amount: 1_990, status: 'zaplaceno', plan: 'Standard měsíčně' },
  { id: 'INV-2025-01', date: '1. 1. 2025',  amount: 1_990, status: 'zaplaceno', plan: 'Standard měsíčně' },
  { id: 'INV-2024-12', date: '1. 12. 2024', amount: 1_990, status: 'zaplaceno', plan: 'Standard měsíčně' },
];

const E_PLANS = [
  {
    id: 'standard', name: 'Standard', price: 1_990, unit: 'Kč/měs',
    features: ['3 aktivní inzeráty', '50 swajpů/měs', 'Základní analytika', 'Email podpora'],
    current: false,
  },
  {
    id: 'premium', name: 'Premium', price: 2_490, unit: 'Kč/měs',
    features: ['10 aktivních inzerátů', 'Neomezené swajpy', 'Pokročilá analytika', 'Plán směn', 'ASAP boost', 'Prioritní podpora'],
    current: true,
  },
  {
    id: 'business', name: 'Business', price: 4_990, unit: 'Kč/měs',
    features: ['Neomezené inzeráty', 'Tým 5 členů', 'Plná analytika + API', 'Fakturační integrace', 'SLA podpora 24/7'],
    current: false,
  },
];

function EBilling() {
  const [tab, setTab] = React.useState('overview');

  const usageData = [
    { label: 'Aktivní inzeráty', used: 3, total: 10, color: '#8AB4FF' },
    { label: 'Kandidáti v pipeline', used: 14, total: 50, color: '#5BD68A' },
    { label: 'ASAP boosty', used: 1, total: 3, color: '#FFD166' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { k: 'overview', l: 'Přehled' },
          { k: 'plans', l: 'Tarify' },
          { k: 'invoices', l: 'Faktury' },
          { k: 'payment', l: 'Platební metoda' },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              background: tab === t.k ? 'rgba(91,107,255,0.25)' : 'rgba(255,255,255,0.04)',
              border: tab === t.k ? '1px solid rgba(91,107,255,0.5)' : '1px solid rgba(208,208,255,0.1)',
              borderRadius: 10, padding: '8px 16px',
              color: tab === t.k ? '#d0d0ff' : '#9999cc',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <>
          {/* Active plan card */}
          <ECard accent="#5B6BFF">
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#9999cc', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                    Aktivní tarif
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>Premium</div>
                  <div style={{ color: '#9999cc', fontSize: 13, marginTop: 4 }}>
                    Obnovení: <span style={{ color: '#FFD166', fontWeight: 700 }}>1. 6. 2025</span> · 2 490 Kč
                  </div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg,rgba(91,107,255,0.3),rgba(91,107,255,0.1))',
                  border: '1px solid rgba(91,107,255,0.4)',
                  borderRadius: 14, padding: '10px 20px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#d0d0ff' }}>2 490</div>
                  <div style={{ color: '#9999cc', fontSize: 12 }}>Kč / měs</div>
                </div>
              </div>

              {/* Usage meters */}
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {usageData.map(u => (
                  <div key={u.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: '#d0d0ff' }}>{u.label}</span>
                      <span style={{ fontSize: 13, color: '#9999cc' }}>{u.used} / {u.total}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(208,208,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${(u.used / u.total) * 100}%`,
                        background: u.color, borderRadius: 4,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button style={{
                  background: 'linear-gradient(135deg,#292978,#3a3a99)',
                  border: 'none', borderRadius: 10, padding: '9px 18px',
                  color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                  Upgradovat na Business
                </button>
                <button style={{
                  background: 'transparent',
                  border: '1px solid rgba(208,208,255,0.2)',
                  borderRadius: 10, padding: '9px 18px',
                  color: '#9999cc', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
                }}>
                  Zrušit předplatné
                </button>
              </div>
            </div>
          </ECard>
        </>
      )}

      {/* Plans comparison */}
      {tab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {E_PLANS.map(p => (
            <div key={p.id} style={{
              background: p.current
                ? 'linear-gradient(160deg, rgba(91,107,255,0.2), rgba(91,107,255,0.05))'
                : 'rgba(255,255,255,0.03)',
              border: p.current ? '2px solid rgba(91,107,255,0.5)' : '1px solid rgba(208,208,255,0.1)',
              borderRadius: 18, padding: 24, position: 'relative',
            }}>
              {p.current && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg,#5B6BFF,#8AB4FF)',
                  borderRadius: 20, padding: '3px 14px',
                  fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: 0.5,
                }}>
                  AKTIVNÍ
                </div>
              )}
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: p.current ? '#8AB4FF' : '#d0d0ff' }}>
                {p.price.toLocaleString('cs-CZ')}
                <span style={{ fontSize: 14, fontWeight: 500, color: '#9999cc' }}> Kč/měs</span>
              </div>
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#d0d0ff' }}>
                    <Icon name="check-circle-bold" size={14} color="#5BD68A" />
                    {f}
                  </div>
                ))}
              </div>
              {!p.current && (
                <button style={{
                  marginTop: 20, width: '100%',
                  background: 'linear-gradient(135deg,#292978,#3a3a99)',
                  border: 'none', borderRadius: 10, padding: '10px',
                  color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                  {p.price > 2490 ? 'Upgradovat' : 'Downgradovat'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invoices */}
      {tab === 'invoices' && (
        <ECard>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 140px 120px 100px 80px',
              padding: '10px 20px', borderBottom: '1px solid rgba(208,208,255,0.1)',
            }}>
              {['Faktura', 'Datum', 'Tarif', 'Částka', ''].map(h => (
                <div key={h} style={{ color: '#9999cc', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {h}
                </div>
              ))}
            </div>
            {E_INVOICES.map((inv, i) => (
              <div key={inv.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 120px 100px 80px',
                alignItems: 'center', padding: '14px 20px',
                borderBottom: i < E_INVOICES.length - 1 ? '1px solid rgba(208,208,255,0.07)' : 'none',
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#d0d0ff', fontFamily: 'JetBrains Mono, monospace' }}>
                  {inv.id}
                </div>
                <div style={{ color: '#9999cc', fontSize: 13 }}>{inv.date}</div>
                <div style={{ color: '#9999cc', fontSize: 13 }}>{inv.plan}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
                  {inv.amount.toLocaleString('cs-CZ')} Kč
                </div>
                <button style={{
                  background: 'transparent', border: '1px solid rgba(208,208,255,0.15)',
                  borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                  color: '#9999cc', fontSize: 12, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Icon name="download-minimalistic-bold" size={12} />
                  PDF
                </button>
              </div>
            ))}
          </div>
        </ECard>
      )}

      {/* Payment method */}
      {tab === 'payment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ECard>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#d0d0ff' }}>Platební metoda</div>
                <button style={{
                  background: 'transparent', border: '1px solid rgba(208,208,255,0.2)',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  color: '#9999cc', fontSize: 12, fontFamily: 'inherit',
                }}>
                  Změnit
                </button>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #1a1a4a, #2a2a60)',
                borderRadius: 14, padding: '20px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                maxWidth: 360,
              }}>
                <div>
                  <div style={{ color: '#9999cc', fontSize: 12, marginBottom: 12 }}>•••• •••• •••• 4242</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Anna Křížková</div>
                  <div style={{ color: '#9999cc', fontSize: 12, marginTop: 2 }}>Platnost: 09/27</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#8AB4FF', fontFamily: 'Inter, sans-serif', letterSpacing: -1 }}>
                  VISA
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Icon name="shield-check-bold" size={14} color="#5BD68A" />
                <span style={{ color: '#9999cc', fontSize: 12 }}>Bezpečná platba — Stripe · PCI DSS Level 1</span>
              </div>
            </div>
          </ECard>
        </div>
      )}

    </div>
  );
}

// ── EXPORT ─────────────────────────────────────────────────────

Object.assign(window, { ETeam, EBilling });
