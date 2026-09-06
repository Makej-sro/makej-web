// Makej Employer — Onboarding (dokončení profilu firmy)
//
// Protějšek brigádnického `wOnboardingNeeded`. Firma, která přišla z čekacího
// listu, má vyplněný jen název, IČO a e-mail — sídlo a obor jí chybí. Dokud je
// nedoplní, nepustíme ji do dashboardu; jinak by inzerovala jako firma, o které
// brigádník neví, kde sídlí ani co dělá.
//
// POZOR na názvy: sloupec v `profiles` je `ic` (ne `ico`) — `ico` je jen klíč
// v metadatech, pod kterým ho posílá čekací list. Most mezi obojím dělá DB
// trigger handle_new_user.

// Povinné údaje po firmě. Vrátí true, když ještě chybí.
function eOnboardingNeeded(p) {
  if (!p || !p.id) return false;            // profil ještě není načtený → negatuj
  if (p.role !== 'employer') return false;  // brigádníky hlídá appka, ne dashboard
  const has = v => v != null && String(v).trim() !== '';
  return !(has(p.company_name) && has(p.address) && has(p.industry));
}

function EOnboarding({ onDone, onSignOut }) {
  const [form, setForm] = useStateE(() => ({
    company_name: EPROFILE.company_name || '',
    ic:           EPROFILE.ic || '',
    address:      EPROFILE.address || '',
    industry:     EPROFILE.industry || '',
  }));
  const [err,     setErr]     = useStateE('');
  const [saving,  setSaving]  = useStateE(false);

  const set = (k, v) => { setForm(f => Object.assign({}, f, { [k]: v })); setErr(''); };

  async function ulozit(e) {
    e.preventDefault();
    const nazev  = form.company_name.trim();
    const sidlo  = form.address.trim();
    const obor   = form.industry.trim();
    const ic     = form.ic.trim();

    if (nazev.length < 2) return setErr('Doplňte název firmy.');
    if (sidlo.length < 4) return setErr('Doplňte sídlo — ulici, číslo a město.');
    if (!obor)            return setErr('Vyberte obor.');

    setSaving(true);
    // `ic` posíláme jen když ho firma vyplnila — prázdný řetězec by v DB
    // konkuroval unikátnímu indexu s ostatními prázdnými.
    const zmeny = { company_name: nazev, address: sidlo, industry: obor };
    if (ic) zmeny.ic = ic;

    const ok = await updateEmployerProfile(zmeny);
    setSaving(false);
    if (!ok) return setErr('Uložení se nepovedlo. Zkuste to prosím znovu.');
    onDone && onDone();
  }

  const pole = {
    width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
    background: 'rgba(0,32,246,0.05)', border: '1px solid rgba(0,32,246,0.15)',
    color: '#0a0a1a', fontFamily: T.fontUI, fontSize: 14, outline: 'none',
  };
  const popisek = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: T.cardMuted, fontFamily: T.fontUI };

  return (
    <div style={{
      width: '100%', height: '100%', background: T.bg, overflowY: 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box',
    }}>
      <form onSubmit={ulozit} style={{
        width: '100%', maxWidth: 520, background: T.card, borderRadius: 20,
        padding: 'clamp(24px, 5vw, 40px)', boxSizing: 'border-box',
        boxShadow: '0 30px 80px rgba(5,7,26,0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Icon name="buildings-2-bold" size={22} color={T.primary} />
          <span style={{ fontFamily: T.fontHead, fontWeight: 800, fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: T.primary }}>
            Ještě než začnete
          </span>
        </div>

        <h1 style={{ margin: 0, fontFamily: T.fontHead, fontWeight: 800, fontSize: 'clamp(22px, 4vw, 28px)', lineHeight: 1.15, color: T.cardText }}>
          Doplňte údaje o firmě
        </h1>
        <p style={{ margin: '10px 0 24px', fontSize: 14, lineHeight: 1.55, color: T.cardMuted, fontFamily: T.fontUI }}>
          Brigádník u nabídky vidí, kdo ji vypsal. Bez sídla a oboru vaše inzeráty nedávají smysl — je to na minutu a víckrát už to řešit nebudete.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={popisek}>Název firmy</label>
            <input style={pole} value={form.company_name} onChange={e => set('company_name', e.target.value)}
                   placeholder="Např. Kavárna Zrnko s.r.o." autoComplete="organization" />
          </div>

          <div>
            <label style={popisek}>IČO <span style={{ fontWeight: 400 }}>— nepovinné</span></label>
            <input style={pole} value={form.ic} onChange={e => set('ic', e.target.value.replace(/\D/g, '').slice(0, 8))}
                   placeholder="12345678" inputMode="numeric" />
          </div>

          <div>
            <label style={popisek}>Sídlo</label>
            <input style={pole} value={form.address} onChange={e => set('address', e.target.value)}
                   placeholder="Ulice a číslo, město" autoComplete="street-address" />
          </div>

          <div>
            <label style={popisek}>Obor</label>
            <select style={pole} value={form.industry} onChange={e => set('industry', e.target.value)}>
              <option value="">Vyberte obor…</option>
              {INDUSTRIES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {err && (
          <div style={{
            marginTop: 16, padding: '10px 13px', borderRadius: 9, fontSize: 13, fontFamily: T.fontUI,
            background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.30)', color: '#b91c3c',
          }}>{err}</div>
        )}

        <button type="submit" disabled={saving} style={{
          width: '100%', marginTop: 22, padding: '14px 20px', borderRadius: 999, border: 0,
          background: saving ? 'rgba(0,32,246,0.5)' : T.primary, color: '#fff',
          fontFamily: T.fontUI, fontSize: 15, fontWeight: 700,
          cursor: saving ? 'default' : 'pointer',
        }}>
          {saving ? 'Ukládám…' : 'Uložit a pokračovat'}
        </button>

        <button type="button" onClick={() => onSignOut && onSignOut()} style={{
          display: 'block', margin: '14px auto 0', padding: 6, background: 'none', border: 0,
          color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
        }}>
          Odhlásit se
        </button>
      </form>
    </div>
  );
}

Object.assign(window, { EOnboarding, eOnboardingNeeded });
