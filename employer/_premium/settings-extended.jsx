// ─────────────────────────────────────────────────────────────
//  Makej — Employer Premium: Rozšířené nastavení
//  Tarif: Premium / Business
//
//  Jak zapojit zpět — viz _premium/README.md
//
//  Exportuje:  SettingsPublic, SettingsIntegrations
//
//  Použití v employer-pages3.jsx → ESettings:
//    Nav:      { k: 'public', l: 'Veřejný profil', i: 'eye-bold' }
//              { k: 'integ',  l: 'Integrace',      i: 'plug-circle-bold' }
//    Render:   {seg === 'public' && <SettingsPublic />}
//              {seg === 'integ'  && <SettingsIntegrations />}
// ─────────────────────────────────────────────────────────────

// ── VEŘEJNÝ PROFIL ────────────────────────────────────────────

function SettingsPublic() {
  const [slogan,  setSlogan]  = React.useState('Přijď si k nám dát nejlepší espresso v Brně!');
  const [benefit1, setBenefit1] = React.useState('Přátelský tým a skvělá parta');
  const [benefit2, setBenefit2] = React.useState('Flexibilní směny dle domluvy');
  const [benefit3, setBenefit3] = React.useState('Odměny a bonusy za výkon');
  const [saved, setSaved] = React.useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  const fieldStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(208,208,255,0.14)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: 14,
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Profile preview */}
      <ECard>
        <div style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#d0d0ff', marginBottom: 16 }}>
            Náhled veřejného profilu
          </div>
          <div style={{
            background: 'rgba(41,41,120,0.2)', border: '1px solid rgba(208,208,255,0.1)',
            borderRadius: 14, padding: 20,
          }}>
            {/* Company header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: ECOMPANY.logoColor + '33',
                border: `2px solid ${ECOMPANY.logoColor}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 18, color: ECOMPANY.logoColor,
              }}>
                {ECOMPANY.logo}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>{ECOMPANY.name}</div>
                <div style={{ color: '#9999cc', fontSize: 13, marginTop: 2 }}>
                  <Icon name="map-point-bold" size={12} /> {ECOMPANY.city}
                  &nbsp;·&nbsp;
                  <span style={{ color: '#FFD166', fontWeight: 700 }}>4.8 ★</span>
                </div>
              </div>
            </div>

            {/* Slogan */}
            <div style={{
              fontSize: 14, color: '#d0d0ff', fontStyle: 'italic',
              borderLeft: '3px solid rgba(91,107,255,0.5)',
              paddingLeft: 12, marginBottom: 14,
            }}>
              "{slogan}"
            </div>

            {/* Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[benefit1, benefit2, benefit3].filter(Boolean).map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#d0d0ff' }}>
                  <Icon name="check-circle-bold" size={14} color="#5BD68A" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ECard>

      {/* Edit form */}
      <ECard>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#d0d0ff' }}>Upravit veřejný profil</div>

          {/* Slogan */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9999cc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Slogan firmy
            </label>
            <textarea
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
              rows={2}
              maxLength={120}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: '#9999cc', marginTop: 3 }}>
              {slogan.length} / 120
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9999cc', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Benefity (zobrazí se brigádníkům)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                [benefit1, setBenefit1],
                [benefit2, setBenefit2],
                [benefit3, setBenefit3],
              ].map(([val, setter], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: 'rgba(91,187,255,0.15)', border: '1px solid rgba(91,187,255,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#8AB4FF', flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <input
                    value={val}
                    onChange={e => setter(e.target.value)}
                    placeholder={`Benefit ${i + 1}…`}
                    style={{ ...fieldStyle, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Gallery placeholder */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9999cc', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Fotogalerie firmy
            </label>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10,
            }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  aspectRatio: '1',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(208,208,255,0.2)',
                  borderRadius: 10,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  cursor: 'pointer', transition: 'border-color .2s',
                }}>
                  <Icon name="gallery-add-bold" size={22} color="#555580" />
                  <span style={{ fontSize: 11, color: '#555580' }}>Přidat</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: '#9999cc', marginTop: 8 }}>
              Max. 8 fotek · formát JPG, PNG · do 5 MB každá
            </div>
          </div>

          {/* Save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={save}
              style={{
                background: 'linear-gradient(135deg,#292978,#3a3a99)',
                border: 'none', borderRadius: 10, padding: '10px 24px',
                color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Uložit profil
            </button>
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#5BD68A', fontSize: 13 }}>
                <Icon name="check-circle-bold" size={16} color="#5BD68A" />
                Uloženo
              </div>
            )}
          </div>
        </div>
      </ECard>
    </div>
  );
}

// ── INTEGRACE ─────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    id: 'gcal', name: 'Google Calendar', icon: 'calendar-bold',
    color: '#4285F4', desc: 'Synchronizuj pohovory a směny přímo do Kalendáře.',
    connected: true, connectedAs: 'anna@kafepunkt.cz',
  },
  {
    id: 'slack', name: 'Slack', icon: 'chat-round-line-bold',
    color: '#4A154B', desc: 'Dostávej notifikace o nových kandidátech do Slacku.',
    connected: true, connectedAs: '#nabor-kanal',
  },
  {
    id: 'pohoda', name: 'POHODA', icon: 'document-text-bold',
    color: '#E85D04', desc: 'Export odpracovaných hodin přímo do mzdové agendy.',
    connected: false,
  },
  {
    id: 'make', name: 'Make (Integromat)', icon: 'settings-bold',
    color: '#6E3FF3', desc: 'Propoj Makej s tisíci dalšími aplikacemi přes Make.',
    connected: false,
  },
  {
    id: 'zapier', name: 'Zapier', icon: 'bolt-circle-bold',
    color: '#FF4A00', desc: 'Automatizuj workflow bez kódu přes Zapier.',
    connected: false,
  },
  {
    id: 'api', name: 'REST API + Webhook', icon: 'code-bold',
    color: '#5BD68A', desc: 'Přímý přístup přes API klíč. Nastav webhook URL pro real-time events.',
    connected: false, isApi: true,
  },
];

function SettingsIntegrations() {
  const [items, setItems] = React.useState(INTEGRATIONS);
  const [apiKey] = React.useState('mk_live_8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c');
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [apiKeyCopied, setApiKeyCopied] = React.useState(false);
  const [apiKeyVisible, setApiKeyVisible] = React.useState(false);

  function toggle(id) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, connected: !it.connected } : it));
  }

  function copyApiKey() {
    navigator.clipboard?.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {items.filter(it => !it.isApi).map(it => (
        <ECard key={it.id}>
          <div style={{
            padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: it.color + '22',
              border: `1px solid ${it.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon name={it.icon} size={20} color={it.color} />
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{it.name}</span>
                {it.connected && (
                  <span style={{
                    background: 'rgba(91,214,138,0.15)', border: '1px solid rgba(91,214,138,0.3)',
                    color: '#5BD68A', borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700,
                  }}>
                    Připojeno
                  </span>
                )}
              </div>
              <div style={{ color: '#9999cc', fontSize: 12, marginTop: 2 }}>{it.desc}</div>
              {it.connected && it.connectedAs && (
                <div style={{ color: it.color, fontSize: 12, marginTop: 3, fontWeight: 600 }}>
                  {it.connectedAs}
                </div>
              )}
            </div>

            {/* Toggle */}
            <button
              onClick={() => toggle(it.id)}
              style={{
                background: it.connected
                  ? 'rgba(244,63,94,0.1)'
                  : 'linear-gradient(135deg,#292978,#3a3a99)',
                border: it.connected ? '1px solid rgba(244,63,94,0.3)' : 'none',
                borderRadius: 10, padding: '8px 16px',
                color: it.connected ? '#f43f5e' : '#fff',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {it.connected ? 'Odpojit' : 'Připojit'}
            </button>
          </div>
        </ECard>
      ))}

      {/* API section */}
      {items.filter(it => it.isApi).map(it => (
        <ECard key={it.id}>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: it.color + '22', border: `1px solid ${it.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={it.icon} size={20} color={it.color} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{it.name}</div>
                <div style={{ color: '#9999cc', fontSize: 12 }}>{it.desc}</div>
              </div>
            </div>

            {/* API key */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9999cc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                API klíč
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(208,208,255,0.14)', borderRadius: 10,
                  padding: '10px 14px', fontSize: 13, color: '#d0d0ff',
                  fontFamily: 'JetBrains Mono, monospace',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {apiKeyVisible ? apiKey : apiKey.replace(/./g, '•')}
                </div>
                <button
                  onClick={() => setApiKeyVisible(v => !v)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(208,208,255,0.14)',
                    borderRadius: 10, padding: '0 14px',
                    color: '#9999cc', cursor: 'pointer',
                  }}
                >
                  <Icon name={apiKeyVisible ? 'eye-closed-bold' : 'eye-bold'} size={16} color="#9999cc" />
                </button>
                <button
                  onClick={copyApiKey}
                  style={{
                    background: apiKeyCopied ? 'rgba(91,214,138,0.15)' : 'rgba(255,255,255,0.05)',
                    border: apiKeyCopied ? '1px solid rgba(91,214,138,0.3)' : '1px solid rgba(208,208,255,0.14)',
                    borderRadius: 10, padding: '0 14px',
                    color: apiKeyCopied ? '#5BD68A' : '#9999cc', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                >
                  <Icon name={apiKeyCopied ? 'check-circle-bold' : 'copy-bold'} size={14} color={apiKeyCopied ? '#5BD68A' : '#9999cc'} />
                  {apiKeyCopied ? 'Zkopírováno' : 'Kopírovat'}
                </button>
              </div>
            </div>

            {/* Webhook URL */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9999cc', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Webhook URL
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://tvuj-server.cz/webhook/makej"
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(208,208,255,0.14)', borderRadius: 10,
                    padding: '10px 14px', color: '#fff',
                    fontFamily: 'inherit', fontSize: 13, outline: 'none',
                  }}
                />
                <button style={{
                  background: 'linear-gradient(135deg,#292978,#3a3a99)',
                  border: 'none', borderRadius: 10, padding: '0 16px',
                  color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                }}>
                  Uložit
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#9999cc', marginTop: 6 }}>
                Události: <code style={{ color: '#8AB4FF' }}>match.new</code>
                {' · '}
                <code style={{ color: '#8AB4FF' }}>match.accepted</code>
                {' · '}
                <code style={{ color: '#8AB4FF' }}>job.filled</code>
              </div>
            </div>

            {/* Docs link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8AB4FF', fontSize: 13, cursor: 'pointer' }}>
              <Icon name="link-bold" size={13} color="#8AB4FF" />
              Dokumentace API → docs.makej.eu/api
            </div>
          </div>
        </ECard>
      ))}
    </div>
  );
}

// ── EXPORT ─────────────────────────────────────────────────────

Object.assign(window, { SettingsPublic, SettingsIntegrations });
