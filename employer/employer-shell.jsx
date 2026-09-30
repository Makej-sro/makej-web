// Makej Employer — shell, charts, primitives
// Reuses T, Icon, fmtKc from app.jsx; ECOMPANY etc from employer-data.jsx

const { useState: useStateE, useEffect: useEffectE, useRef: useRefE, useMemo: useMemoE } = React;

// ─────────────────────────────────────────────────────────────
// ODZNÁČEK TARIFU — efekt roste s cenou (CSS .tier-badge v index.html).
// Mapuje název plánu (starý „Premium/Standard" i nový „Výhodný…") na tier + název.
// ─────────────────────────────────────────────────────────────
function _planToTier(plan) {
  const p = (plan || '').toLowerCase();
  if (p.includes('enterprise') || p.includes('vlastní') || p.includes('vlastni'))                 return { tier: 'custom',  label: 'Vlastní' };
  if (p.includes('business') || p.includes('premium') || p.includes('maximáln') || p.includes('maximalni')) return { tier: 'max', label: 'Maximální' };
  if (p.includes('dynamick'))                                                                       return { tier: 'dynamic', label: 'Dynamický' };
  if (p.includes('standard') || p.includes('výhodn') || p.includes('vyhodn'))                       return { tier: 'value',   label: 'Výhodný' };
  return { tier: 'free', label: 'Základní' };
}

function TierBadge({ plan }) {
  const { tier, label } = _planToTier(plan);
  const hasAura   = tier === 'max' || tier === 'custom';
  const hasSparks = tier === 'custom';
  return (
    <span className="tier-badge" data-tier={tier}>
      {hasAura && <span className="tier-badge__aura" aria-hidden="true" />}
      <span className="tier-badge__pill">
        {label}
        <span className="tier-badge__sheen" aria-hidden="true" />
      </span>
      {hasSparks && (
        <span className="tier-badge__sparks" aria-hidden="true">
          <i style={{ top: 0, left: '14%', width: 7, height: 7 }} />
          <i style={{ bottom: 2, right: '20%', width: 6, height: 6, animationDelay: '-1.3s' }} />
          <i style={{ top: '30%', right: 2, width: 5, height: 5, animationDelay: '-.7s' }} />
        </span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGO + COMPANY BADGE
// ─────────────────────────────────────────────────────────────
function ELogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div>
        {/* Logo v League Spartan 900 jako na webu (.nav-logo) a v appce — třída
            e-logo, protože #root * jinak všechno přepíná na Inter (index.html). */}
        <div className="e-logo" style={{ fontWeight: 900, fontSize: 28, color: '#0020F6', lineHeight: 1 }}>
          Makej
        </div>
        <div style={{ fontFamily: T.fontUI, fontSize: 9, color: '#6B7280', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 3, fontWeight: 700 }}>
          pro firmy
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KOVOVÝ ODZNÁČEK TARIFU (návrh Yasin 26. 9., MakejTierEffects.tsx → metal badge)
// Tekutý kov kreslí knihovna metal-fx (MIT, WebGL2) z /vendor/metal-fx/ —
// načítá ji <script type="module"> v index.html → window.MetalFxLib.
// Dokud není načtená, nebo když prohlížeč neumí WebGL2, kreslí se CSS verze
// z návrhu (.mk-rim v index.html). Barva kovu = CSS filtr na plátně podle
// data-tier (metal-fx má jeden preset na celou stránku).
// ─────────────────────────────────────────────────────────────
const _MK_ID = { free: 'zakladni', value: 'vyhodny', dynamic: 'dynamicky', max: 'maximalni', custom: 'vlastni' };
// Tarify z nové verze návrhu (27. 9., MakejTierEffects.tsx → TIERS).
// hex = hlavní barva, label = světlý odstín (na tmavé), sheen = kov v CSS náhradě.
const _mkSh = (hi, a, main, b, lo) => `linear-gradient(180deg, ${hi} 0%, ${a} 36%, ${b} 49%, ${a} 60%, ${b} 100%)`;
const _MK_TIER = {
  zakladni:  { id: 'zakladni',  name: 'Základní',  hex: '#B7C1D6', label: '#B7C1D6', sheen: _mkSh('#F4F6FA', '#D5DBE7', '#8E98AE', '#B7C1D6', '#EEF1F7'), pillBg: '#B7C1D6', pillText: '#1F2430', core: 0.6 },
  vyhodny:   { id: 'vyhodny',   name: 'Výhodný',   hex: '#2E33F0', label: '#9FA2FF', sheen: _mkSh('#E0E1FF', '#9FA2FF', '#2E33F0', '#6B70FF', '#D6D8FF'), pillBg: '#2E33F0', pillText: '#FFFFFF', core: 0.18 },
  dynamicky: { id: 'dynamicky', name: 'Dynamický', hex: '#229B54', label: '#6FD69A', sheen: _mkSh('#DDF7E6', '#8FE3B1', '#229B54', '#5FD18D', '#C8F0D6'), pillBg: '#229B54', pillText: '#FFFFFF', core: 0.18 },
  maximalni: { id: 'maximalni', name: 'Maximální', hex: '#BE5518', label: '#F5A06C', sheen: _mkSh('#FFE6D6', '#F5A06C', '#BE5518', '#E27A3C', '#FFD9C2'), pillBg: '#BE5518', pillText: '#FFFFFF', core: 0.18 },
  vlastni:   { id: 'vlastni',   name: 'Vlastní',   hex: '#7A41C8', label: '#B994EE', sheen: _mkSh('#EFE5FC', '#B994EE', '#7A41C8', '#A77BE8', '#E3D3FA'), pillBg: '#7A41C8', pillText: '#FFFFFF', core: 0.18 },
};

// Knihovna, jakmile je načtená a prohlížeč umí WebGL2; jinak null.
function useMetalFx() {
  const [lib, setLib] = useStateE(() => window.MetalFxLib || null);
  useEffectE(() => {
    if (lib) return;
    const hotovo = () => setLib(window.MetalFxLib || null);
    window.addEventListener('metalfx-ready', hotovo);
    return () => window.removeEventListener('metalfx-ready', hotovo);
  }, [lib]);
  if (!lib) return null;
  try { return lib.isMetalFxSupported() ? lib : null; } catch (e) { return null; }
}

// Klon MetalBadge z metal-fx (originál má pevnou šířku 45 px) — šířka podle textu.
// Hodnoty 1:1 z návrhu. mask/glowMode jsou vnitřní props metal-fx 2.0.11.
function MkAutoBadge({ lib, t, name, id, reflectionTargets }) {
  const D = lib.METAL_BADGE_DEFAULTS;
  const rad = 55.556, H = 25, glow = D.glow, core = D.core;
  const mask = React.useCallback((g, w, hh, b) => { g.beginPath(); g.roundRect(0, 0, w, hh, rad * b); g.fill(); }, []);
  const abs = { position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: rad };
  const shadow = `inset 0px 0px 8.333px 0px rgba(255,255,255,${glow}), inset 0px 0px 8.333px 0px rgba(255,255,255,${glow}), inset 0px 0px 0px 0.833px rgba(255,255,255,0.5), inset 0px 0.833px 0px 0px rgba(255,255,255,0.78)`;
  const MetalFx = lib.MetalFx;
  return (
    <MetalFx preset="silver" strength={id === 'zakladni' ? D.metalOpacity : 0.45} shaderScale={D.shaderScale}
      mask={mask} glowMode="ring" disableGlow reflectionTargets={reflectionTargets} borderRadius={rad}
      style={{ background: t.pillBg, borderRadius: rad }}>
      <div style={{ position: 'relative', height: H, minWidth: 45, borderRadius: rad }}>
        <div aria-hidden="true" style={{ ...abs, opacity: t.core, background: `radial-gradient(ellipse ${core.size}% ${core.size}% at 50% 50%, rgba(255,255,255,1) ${core.r}%, rgba(255,255,255,0) ${Math.min(100, core.r + core.blur)}%)` }} />
        <div aria-hidden="true" style={{ ...abs, background: `linear-gradient(to bottom, rgba(255,255,255,${D.gradient}), rgba(255,255,255,0))`, boxShadow: shadow }} />
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', minWidth: 45, height: H, padding: '0 10px', fontSize: 12.222, fontWeight: 600, lineHeight: 1.4, color: t.pillText, whiteSpace: 'nowrap' }}>{name}</span>
      </div>
    </MetalFx>
  );
}

function TierMetalBadge({ plan, label = 'Tarif', onClick }) {
  const { tier, label: name } = _planToTier(plan);
  const id = _MK_ID[tier] || 'zakladni';
  const ref = useRefE(null);
  const lib = useMetalFx();
  return (
    <span data-tier={id} onClick={onClick} title={onClick ? 'Změnit tarif' : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 9, cursor: onClick ? 'pointer' : 'default' }}>
      {label && <span ref={ref} style={{ fontSize: 13, fontWeight: 500, color: '#8a8a8a' }}>{label}</span>}
      <span data-cell="badge" style={{ display: 'inline-flex' }}>
        {lib
          ? <MkAutoBadge lib={lib} t={_MK_TIER[id]} name={name} id={id} reflectionTargets={label ? [{ ref, strength: 0.5 }] : undefined} />
          : <span className="mk-rim"><span className="mk-rim-fill">{name}</span></span>}
      </span>
    </span>
  );
}


// ── Kovový název tarifu (TierMetalText z návrhu) ──
// Název tarifu jako tekutý kov (metal-fx MetalText). Návrh je na tmavé pozadí
// se světlým odstínem (label); na bílém ceníku bereme hlavní barvu (hex),
// jinak by byl třeba Základní skoro neviditelný. Bez WebGL2 CSS náhrada.
function _MkMetalTextGL({ lib, t, prefix, font, color }) {
  const ref = useRefE(null);
  lib.useMetalTextReflection(ref);
  const MetalText = lib.MetalText;
  return (
    <span data-tier={t.id}>
      <span data-cell="text" style={{ display: 'inline-flex', gap: '0.25em', alignItems: 'baseline' }}>
        {prefix && <span ref={ref} style={{ font, color: '#6b6b6b' }}>{prefix}</span>}
        <MetalText font={font} color={color} strength={0.9} reflectionTargets={prefix ? [{ ref, strength: 0.64 }] : undefined}>{t.name}</MetalText>
      </span>
    </span>
  );
}
function TierMetalText({ tier, prefix = null, size = 19, weight = 700, naSvetlem = true }) {
  const t = _MK_TIER[tier] || _MK_TIER.zakladni;
  const lib = useMetalFx();
  const font = weight + ' ' + size + 'px/1.2 Inter, sans-serif';
  const color = naSvetlem ? t.hex : t.label;
  if (lib) return <_MkMetalTextGL lib={lib} t={t} prefix={prefix} font={font} color={color} />;
  return (
    <span data-tier={t.id} style={{ display: 'inline-flex', gap: '0.25em', alignItems: 'baseline', font }}>
      {prefix && <span className="mk-sheen" style={{ backgroundImage: 'linear-gradient(100deg, transparent 38%, rgba(255,255,255,0.32) 50%, transparent 62%), linear-gradient(#6b6b6b, #6b6b6b)' }}>{prefix}</span>}
      <span className="mk-sheen mk-liquid" style={{ backgroundImage: `linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.95) 50%, transparent 60%), linear-gradient(165deg, transparent 35%, rgba(255,255,255,0.35) 48%, transparent 58%), ${naSvetlem ? 'linear-gradient(' + t.hex + ',' + t.hex + ')' : t.sheen}`, filter: `drop-shadow(0 0 6px ${t.label}40)`, animationDelay: '0.25s' }}>{t.name}</span>
    </span>
  );
}

// ── Přelévavý barevný text (TierGradientText, čisté CSS) ──
function TierGradientText({ tier, children, style }) {
  const t = _MK_TIER[tier] || _MK_TIER.zakladni;
  return <span data-tier={t.id}><span className="mk-grad" style={style}>{children != null ? children : t.name}</span></span>;
}

// ── Kovové tlačítko (TierMetalButton z návrhu, bez vnější záře) ──
// plna = přes celou šířku (tlačítka v kartách ceníku).
function _MkMetalButtonGL({ lib, t, children, onClick, plna }) {
  const D = lib.METAL_BADGE_DEFAULTS;
  const rad = 999, glow = D.glow, core = D.core;
  const mask = React.useCallback((g, w, hh, b) => { g.beginPath(); g.roundRect(0, 0, w, hh, Math.min(hh / 2, rad * b)); g.fill(); }, []);
  const abs = { position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: rad };
  const shadow = `inset 0px 0px 8.333px 0px rgba(255,255,255,${glow}), inset 0px 0px 8.333px 0px rgba(255,255,255,${glow}), inset 0px 0px 0px 0.833px rgba(255,255,255,0.5), inset 0px 0.833px 0px 0px rgba(255,255,255,0.78)`;
  const MetalFx = lib.MetalFx;
  return (
    <MetalFx preset="silver" strength={t.id === 'zakladni' ? D.metalOpacity : 0.45} shaderScale={D.shaderScale}
      mask={mask} glowMode="ring" disableGlow borderRadius={rad}
      style={{ background: t.pillBg, borderRadius: rad, width: plna ? '100%' : undefined, display: plna ? 'block' : undefined }}>
      <div style={{ position: 'relative', borderRadius: rad }}>
        <div aria-hidden="true" style={{ ...abs, opacity: t.core, background: `radial-gradient(ellipse ${core.size}% ${core.size}% at 50% 50%, rgba(255,255,255,1) ${core.r}%, rgba(255,255,255,0) ${Math.min(100, core.r + core.blur)}%)` }} />
        <div aria-hidden="true" style={{ ...abs, background: `linear-gradient(to bottom, rgba(255,255,255,${D.gradient}), rgba(255,255,255,0))`, boxShadow: shadow }} />
        <button type="button" onClick={onClick} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: plna ? '100%' : undefined, border: 0, borderRadius: rad, padding: '10px 20px', background: 'transparent', color: t.pillText, fontSize: 15, fontWeight: 600, lineHeight: 1.2, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {children}
        </button>
      </div>
    </MetalFx>
  );
}
function TierMetalButton({ tier, children, onClick, plna = false }) {
  const t = _MK_TIER[tier] || _MK_TIER.zakladni;
  const lib = useMetalFx();
  return (
    <div data-tier={t.id} style={{ display: plna ? 'block' : 'inline-flex', width: plna ? '100%' : undefined }}>
      <div data-cell="btn" style={{ display: plna ? 'block' : 'inline-flex', width: plna ? '100%' : undefined }}>
        {lib
          ? <_MkMetalButtonGL lib={lib} t={t} onClick={onClick} plna={plna}>{children}</_MkMetalButtonGL>
          : <span className="mk-rim mk-rim--btn" style={plna ? { display: 'flex', width: '100%' } : undefined}>
              <button type="button" className="mk-rim-fill" onClick={onClick} style={plna ? { width: '100%' } : undefined}>{children}</button>
            </span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────
// Ikony levého menu ve stylu mobilní appky (Iconly Light-Outline, jako spodní
// lišta). Inzeráty, Kandidáti, Zprávy, Plán směn jsou přímo z www/icons appky;
// Dashboard (Home), Analytika (Chart), Recenze (Star), Nastavení (Setting)
// dodal Yasin z Iconly Pro. Staré PNG (dashboard-icon.png…) už nepoužité.
const _IKONY_APP = {
  dash:       'ikony/dashboard.svg?v=1',   // Iconly Light-Outline / Home
  analytics:  'ikony/analytika.svg?v=1',   // Iconly Light-Outline / Chart
  jobs:       'ikony/inzeraty.svg?v=1',
  candidates: 'ikony/kandidati.svg?v=1',
  chat:       'ikony/zpravy.svg?v=1',
  calendar:   'ikony/plan-smen.svg?v=1',
  reviews:    'ikony/recenze.svg?v=1',     // Iconly Light-Outline / Star
  settings:   'ikony/nastaveni.svg?v=1',   // Iconly Light-Outline / Setting
};

function ESidebar({ tab, onTab, onSignOut, mobile = false, open = false, onClose }) {
  // Reálné počty z živých globálů (0 → badge se skryje)
  const jobsBadge = (typeof E_JOBS !== 'undefined' ? E_JOBS.filter(j => j.status === 'active' || j.status === 'urgent').length : 0) || null;
  const candBadge = (typeof E_CANDIDATES !== 'undefined' ? (E_CANDIDATES.new || []).length : 0) || null;
  const chatBadge = (typeof E_THREADS !== 'undefined' ? E_THREADS.reduce((s, t) => s + (t.unread || 0), 0) : 0) || null;
  const reviewsBadge = (typeof E_REVIEWS !== 'undefined' ? E_REVIEWS.length : 0) || null;

  const sections = [
    {
      label: 'Přehled',
      items: [
        { k: 'dash',      label: 'Dashboard', icon: 'chart-square-bold',  iconLine: 'chart-square-linear' },
        // Statistiky jsou pro všechny (základní); plné se odemknou od Dynamického přímo v záložce
        { k: 'analytics', label: 'Statistiky', icon: 'graph-up-bold',      iconLine: 'graph-up-linear' },
      ],
    },
    {
      label: 'Nábor',
      items: [
        { k: 'jobs', label: 'Inzeráty', icon: 'document-text-bold', iconLine: 'document-text-linear', badge: jobsBadge },
        { k: 'candidates', label: 'Kandidáti', icon: 'users-group-rounded-bold', iconLine: 'users-group-rounded-linear', badge: candBadge },
        { k: 'chat', label: 'Zprávy', icon: 'chat-round-line-bold', iconLine: 'chat-round-line-linear', badge: chatBadge },
        { k: 'calendar', label: 'Plán směn', icon: 'calendar-bold', iconLine: 'calendar-linear' },
      ],
    },
    {
      label: 'Firma',
      items: [
        { k: 'reviews', label: 'Recenze', badge: reviewsBadge },
        { k: 'settings', label: 'Nastavení', icon: 'settings-bold', iconLine: 'settings-linear' },
      ],
    },
  ];

  // ── Menu: natrvalo otevřené, sbalit jde úchytem (27. 9.) ──
  // Dřív se úzký pruh rozbaloval najetím myší a šel připnout — Yasin: „bude
  // se to sekat / někomu to bude vadit". Teď je menu normálně otevřené
  // (jako Stripe). Vedle něj uprostřed výšky je malá svislá čárka; při najetí
  // se plynule zlomí do šipky a kousek „zatlačí" — kliknutím se menu sbalí do
  // úzkého pruhu s ikonami, v pruhu šipka zase rozbalí. Volba se pamatuje
  // v prohlížeči (stejný klíč jako dřív připnutí). Mobil má dál vysouvací panel.
  const [otevrene, setOtevrene] = useStateE(() => {
    try { const v = localStorage.getItem('emp-menu-pripnute'); return v === null ? true : v === '1'; } catch (e) { return true; }
  });
  const prepniMenu = () => {
    const v = !otevrene; setOtevrene(v);
    try { localStorage.setItem('emp-menu-pripnute', v ? '1' : '0'); } catch (e) {}
  };

  const UZKE = 72, SIROKE = 256;
  const rozbaleno = mobile || otevrene;
  const sbal = !rozbaleno;              // úzký pruh — jen ikony

  // Text naskočí až s kouskem zpoždění, když už je menu dost široké; při
  // zavírání zmizí hned, ať se neořezává o zužující se okraj.
  const pismo = { opacity: sbal ? 0 : 1, transition: sbal ? 'opacity .1s ease' : 'opacity .2s ease .08s', whiteSpace: 'nowrap' };

  const [kartaOtevrena, setKartaOtevrena] = useStateE(false);
  const kartaRef = useRefE(null);
  const kartaMenuRef = useRefE(null);                 // nabídka v úzkém pruhu je v portálu mimo kartu
  const [kartaPoz, setKartaPoz] = useStateE(null);    // kde nabídku v úzkém pruhu ukázat (vedle loga)
  useEffectE(() => {
    if (!kartaOtevrena) return;
    const mimo = e => {
      if (kartaRef.current && kartaRef.current.contains(e.target)) return;
      if (kartaMenuRef.current && kartaMenuRef.current.contains(e.target)) return;
      setKartaOtevrena(false);
    };
    const esc = e => { if (e.key === 'Escape') setKartaOtevrena(false); };
    document.addEventListener('mousedown', mimo); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', mimo); document.removeEventListener('keydown', esc); };
  }, [kartaOtevrena]);
  useEffectE(() => { if (sbal) setKartaOtevrena(false); }, [sbal]);
  const P = (typeof EPROFILE !== 'undefined' ? EPROFILE : {});
  const logoUrl = P.logo_url || '';
  // Bez vyplněného názvu firmy bral dashboard jméno člověka („Samuel") —
  // radši to říct na rovinu. P.id = data jsou opravdu načtená z databáze.
  const bezNazvu = !!P.id && !P.company_name;
  const firmaNazev = bezNazvu ? 'Doplňte název firmy' : ECOMPANY.name;

  // Položky nabídky karty firmy (stejné v rozbaleném menu i v úzkém pruhu)
  const kartaPolozky = (
    <>
      {[
        { l: 'Profil firmy', ic: 'buildings-2-linear', go: () => onTab('company') },
        { l: 'Tarif a platby', ic: 'card-linear', go: () => onTab('pricing') },
      ].map(x => (
        <button key={x.l} role="menuitem" onClick={() => { setKartaOtevrena(false); x.go(); if (mobile && onClose) onClose(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#1F2433', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <Icon name={x.ic} size={17} color="#6B7280" />{x.l}
        </button>
      ))}
      <div style={{ height: 1, background: '#F0F2FA', margin: '4px 6px' }} />
      <button role="menuitem" onClick={() => { setKartaOtevrena(false); onSignOut && onSignOut(); }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#6B7280', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
        <Icon name="logout-2-linear" size={17} color="#9CA3AF" />Odhlásit se
      </button>
    </>
  );

  const menu = (
    <aside className="e-menu"
      style={{
      width: mobile ? 256 : (rozbaleno ? SIROKE : UZKE), flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      padding: '20px 14px',
      // Bez svislé čáry vpravo (Yasin 26. 9.: „musí tam být ty 2 čáry?") —
      // menu i obsah jsou bílé, oddělí je mezera.
      background: '#ffffff',
      overflowY: 'auto', overflowX: 'hidden',
      // Desktop = pruh / vysunutý panel. Mobil = drawer vysunutý přes obsah.
      ...(mobile ? {
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 60,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .28s cubic-bezier(.2,.8,.2,1)',
        boxShadow: open ? '0 0 60px rgba(10,13,46,.35)' : 'none',
      } : {
        position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 40,
        transition: 'width .22s cubic-bezier(.2,.8,.2,1)',
      }),
    }}>
      <div style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, boxSizing: 'content-box' }}>
        {/* Při vysouvání se nic neposouvá: „M" stojí na místě, zbytek loga,
            texty i připínáček se jen odkryjí (dřív se logo měnilo z „M" na
            „Makej" a všechno poskočilo). */}
        <div style={{ whiteSpace: 'nowrap' }}>
          <div className="e-logo" style={{ fontWeight: 900, fontSize: 28, color: '#0020F6', lineHeight: 1 }}>M<span style={pismo}>akej</span></div>
          <div style={{ fontFamily: T.fontUI, fontSize: 9, color: '#6B7280', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 3, fontWeight: 700, ...pismo }}>pro firmy</div>
        </div>
        {/* Přepínač světlý/tmavý režim tu byl — schovaný, dokud se tmavý režim
            nedodělá (Yasin 25. 9.). Logika zůstává: window.toggleMakejTheme v app.jsx. */}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        {sections.map((sec, i) => (
          <div key={i}>
            <div style={{
              padding: '0 12px 6px', height: 18, boxSizing: 'border-box', position: 'relative',
              fontSize: 10, color: '#9CA3AF', fontFamily: T.fontUI,
              fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
            }}>
              <span style={pismo}>{sec.label}</span>
              {/* V úzkém pruhu dřív místo nadpisu krátká šedá linka — pryč
                  (Yasin 27. 9.), skupiny odděluje jen mezera. */}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {sec.items.map(it => {
                const active = tab === it.k;
                return (
                  <button key={it.k} title={sbal ? it.label : undefined} onClick={() => { if (it.disabled) return; onTab(it.k); if (mobile && onClose) onClose(); }} style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '9px 12px', borderRadius: 10,
                    background: active ? 'rgba(0,32,246,0.08)' : 'transparent',
                    border: 'none',
                    color: active ? '#0020F6' : it.disabled ? '#D1D5DB' : '#374151',
                    cursor: it.disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
                    fontFamily: T.fontUI, fontWeight: active ? 700 : 500, fontSize: 13.5,
                    transition: 'background .15s',
                    opacity: it.disabled ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!active && !it.disabled) e.currentTarget.style.background = '#F3F4F6'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                    {_IKONY_APP[it.k]
                      // Ikony z mobilní appky (Iconly Light-Outline, jako spodní lišta).
                      // Maska místo <img>, aby šly obarvit: aktivní modrá, jinak šedá.
                      ? <span aria-hidden="true" style={{ display: 'block', width: 20, height: 20, flexShrink: 0, background: active ? '#0020F6' : '#6B7280', WebkitMaskImage: 'url(' + _IKONY_APP[it.k] + ')', maskImage: 'url(' + _IKONY_APP[it.k] + ')', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center', WebkitMaskSize: 'contain', maskSize: 'contain', transition: 'background .2s' }} />
                      : ['dash', 'analytics', 'jobs', 'candidates', 'chat', 'calendar', 'reviews', 'settings'].includes(it.k)
                      ? (() => { const iconMap = { dash: 'dashboard-icon.png', analytics: 'analytics-icon.png', jobs: 'jobs-icon.png', candidates: 'candidates-icon.png', chat: 'messages-icon.png', calendar: 'calendar-icon.png', reviews: 'reviews-icon.png?v=2', settings: 'settings-icon.png' }; return <img src={iconMap[it.k]} style={{ width: 18, height: 18, flexShrink: 0, objectFit: 'contain', filter: active ? 'brightness(0) saturate(100%) invert(13%) sepia(100%) saturate(4000%) hue-rotate(228deg) brightness(103%)' : 'opacity(0.4)' }} />; })()
                      : <Icon name={active ? it.icon : it.iconLine} size={18} color={active ? '#0020F6' : it.disabled ? '#D1D5DB' : '#6B7280'} />
                    }
                    <span style={{ flex: 1, ...pismo }}>{it.label}</span>
                    {it.disabled && <span style={{ fontSize: 9, fontWeight: 700, fontFamily: T.fontUI, color: '#D1D5DB', letterSpacing: 0.5, textTransform: 'uppercase' }}>Brzy</span>}
                    {it.badge != null ? (
                      typeof it.badge === 'string' ? (
                        <span style={{
                          padding: '2px 6px', borderRadius: 4,
                          background: 'rgba(251,191,36,0.2)', color: '#92400E',
                          fontSize: 9, fontWeight: 800, fontFamily: T.fontUI, letterSpacing: 0.5, ...pismo,
                        }}>{it.badge}</span>
                      ) : (
                        // Dvě čísla, každé na svém pevném místě: vpravo (rozbaleno)
                        // a malé v rohu ikony (pruh). Jen se prolnou, nic neskáče.
                        <>
                          <span style={{
                            minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
                            background: '#0020F6', color: '#fff',
                            fontSize: 10, fontWeight: 800, fontFamily: T.fontUI,
                            display: 'grid', placeItems: 'center', boxSizing: 'border-box', ...pismo,
                          }}>{it.badge}</span>
                          <span style={{
                            position: 'absolute', left: 25, top: 3, minWidth: 15, height: 15, padding: '0 4px', borderRadius: 999,
                            background: '#0020F6', color: '#fff', fontSize: 9, fontWeight: 800, fontFamily: T.fontUI,
                            display: 'grid', placeItems: 'center', boxSizing: 'border-box', boxShadow: '0 0 0 2px #fff',
                            opacity: sbal ? 1 : 0, transition: 'opacity .16s ease', pointerEvents: 'none',
                          }}>{it.badge}</span>
                        </>
                      )
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Karta firmy (26. 9.) ──
          Dřív tu byly tři nesouvisející kousky: odznáček tarifu, velké tlačítko
          „Spravovat tarif" a firma s červenou ikonou odhlášení, na kterou se
          nedalo kliknout. Teď jedna karta: logo, název, tarif. Klik otevře menu
          Profil firmy / Tarif a platby / Odhlásit se. */}
      <div ref={kartaRef} style={{ position: 'relative', marginTop: 10, paddingTop: 10, borderTop: '1px solid #E5E7EB' }}>
        {kartaOtevrena && !sbal && (
          <div role="menu" style={{
            position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 6px)', zIndex: 5,
            background: '#fff', border: '1px solid #E6E9F5', borderRadius: 12, padding: 6,
            boxShadow: '0 18px 40px -14px rgba(20,22,40,.3)', animation: 'eKartaIn .16s cubic-bezier(.2,.8,.2,1) both',
          }}>
            {kartaPolozky}
          </div>
        )}
        {/* Úzký pruh: menu se nerozbaluje — nabídka vyskočí vedle loga přes obsah
            (portál do <body>, v pruhu by ji ořízl okraj). Zavře se výběrem
            položky, klikem mimo nebo Esc. Nahoře název firmy a tarif, které
            pruh neukazuje. */}
        {kartaOtevrena && sbal && kartaPoz && ReactDOM.createPortal(
          <div ref={kartaMenuRef} role="menu" style={{
            position: 'fixed', left: kartaPoz.left, bottom: kartaPoz.bottom, zIndex: 300, width: 230,
            background: '#fff', border: '1px solid #E6E9F5', borderRadius: 12, padding: 6,
            boxShadow: '0 18px 40px -14px rgba(20,22,40,.3)', animation: 'eKartaIn .16s cubic-bezier(.2,.8,.2,1) both',
          }}>
            <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, borderBottom: '1px solid #F0F2FA', marginBottom: 4 }}>
              <div style={{ maxWidth: '100%', fontSize: 13.5, fontWeight: 700, color: bezNazvu ? '#9CA3AF' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firmaNazev}</div>
              <TierMetalBadge plan={ECOMPANY.plan} label={null} />
            </div>
            {kartaPolozky}
          </div>,
          document.body
        )}
        <button onClick={e => { if (sbal) { const r = e.currentTarget.getBoundingClientRect(); setKartaPoz({ left: r.right + 10, bottom: window.innerHeight - r.bottom }); } setKartaOtevrena(o => !o); }} aria-haspopup="menu" aria-expanded={kartaOtevrena}
          title={sbal ? firmaNazev : undefined}
          // V úzkém pruhu jen logo přesně na středu, bez podkladu — dřív zabíral
          // místo i neviditelný text, logo ujelo doleva a podklad za ním
          // vypadal jako rozmazaný stín. Aktivní záložku tam ukazuje modrý rámeček.
          // Logo sedí 3 px od okraje → v pruhu (72 px) je přesně na středu
          // a při rozbalení zůstane na stejném místě; text vedle se jen odkryje.
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '6px 8px 6px 3px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap',
            background: sbal ? 'transparent' : ((kartaOtevrena || tab === 'company') ? (tab === 'company' ? 'rgba(0,32,246,0.08)' : '#F3F4F6') : 'transparent'), transition: 'background .15s' }}
          onMouseEnter={e => { if (!sbal) e.currentTarget.style.background = '#F3F4F6'; }}
          onMouseLeave={e => { if (!sbal && !kartaOtevrena) e.currentTarget.style.background = tab === 'company' ? 'rgba(0,32,246,0.08)' : 'transparent'; }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
            background: logoUrl ? '#fff' : '#0020F6', border: logoUrl ? '1px solid #E5E7EB' : 'none',
            boxShadow: (sbal && tab === 'company') ? '0 0 0 2px #fff, 0 0 0 4px #0020F6' : 'none',
            display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 13.5,
          }}>{logoUrl ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ECOMPANY.logo}</div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5, ...pismo }}>
            <div style={{ maxWidth: '100%', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              color: bezNazvu ? '#9CA3AF' : '#111827', fontWeight: bezNazvu ? 600 : 700 }}>{firmaNazev}</div>
            <TierMetalBadge plan={ECOMPANY.plan} label={null} />
          </div>
          <span style={{ ...pismo, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="alt-arrow-up-linear" size={15} color="#9CA3AF" />
          </span>
        </button>
      </div>
    </aside>
  );

  if (mobile) return menu;
  // Místo v řádku roste spolu s menu — obsah se při sbalení/rozbalení plynule odsune.
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: rozbaleno ? SIROKE : UZKE, transition: 'width .22s cubic-bezier(.2,.8,.2,1)', zIndex: 40 }}>
      {menu}
      {/* Úchyt: dvě krátké čárky nad sebou = svislá linka; při najetí se
          natočí do šipky (‹ sbalit / › rozbalit) a posunou o kousek. */}
      <button type="button" className={'e-uchyt' + (rozbaleno ? '' : ' zavreno')} onClick={prepniMenu}
        aria-label={rozbaleno ? 'Skrýt menu' : 'Vysunout menu'} aria-expanded={rozbaleno}>
        <span className="e-uchyt-h" /><span className="e-uchyt-d" />
        {/* Vlastní bublina místo title — ukáže se hned vedle šipky (jako Stripe) */}
        <em className="e-uchyt-tip">{rozbaleno ? 'Skrýt' : 'Vysunout'}</em>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────
// Ikona podle typu oznámení + relativní čas (jako v appce)
const _E_NOTIF_ICON = {
  message: 'chat-round-line-bold', match: 'users-group-rounded-bold',
  shift: 'calendar-bold', review: 'star-bold', success: 'check-circle-bold', info: 'bell-bold',
};
function _eAgo(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'teď';
  const m = Math.floor(s / 60); if (m < 60) return 'před ' + m + ' min';
  const h = Math.floor(m / 60); if (h < 24) return 'před ' + h + ' h';
  const d = Math.floor(h / 24); return 'před ' + d + (d === 1 ? ' dnem' : ' dny');
}

// Zvoneček s panelem oznámení — čte tabulku notifications, realtime, označí přečteno.
function ENotifBell() {
  const [notifs, setNotifs] = useStateE([]);
  const [open, setOpen]     = useStateE(false);
  const [ring, setRing]     = useStateE(false);
  const [confirmClear, setConfirmClear] = useStateE(false);
  const uid = useRefE(null);
  const wrapRef = useRefE(null);

  useEffectE(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      uid.current = session.user.id;
      fetchNotifsE(uid.current).then(setNotifs);   // persistovaná (pokud je trigger plní)
    });
    // Živá oznámení jedou z příchozích zpráv (realtime messages k firmě funguje).
    const onNewMsg = (e) => {
      const d = e.detail || {};
      setNotifs(prev => (prev.some(x => x.id === 'm-' + d.id) ? prev
        : [{ id: 'm-' + d.id, ts: d.ts || Date.now(), read: !!d.read, type: 'message', title: d.title || 'Nová zpráva', text: d.text || '', matchId: d.matchId || null }, ...prev].slice(0, 40)));
      if (!d.read) { setRing(true); setTimeout(() => setRing(false), 750); }
    };
    const onThreadRead = (e) => {
      const mid = e.detail && e.detail.matchId;
      if (mid) setNotifs(prev => prev.map(n => n.matchId === mid ? { ...n, read: true } : n));
    };
    window.addEventListener('emp-new-message', onNewMsg);
    window.addEventListener('emp-thread-read', onThreadRead);
    return () => { window.removeEventListener('emp-new-message', onNewMsg); window.removeEventListener('emp-thread-read', onThreadRead); };
  }, []);

  // Klik kamkoli mimo panel ho zavře (fixní překryv nefunguje kvůli backdrop-filter v topbaru)
  useEffectE(() => {
    if (!open) return;
    const onDoc = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setConfirmClear(false); } };
    document.addEventListener('click', onDoc, true);
    return () => document.removeEventListener('click', onDoc, true);
  }, [open]);

  const unread = notifs.filter(n => !n.read).length;

  function toggle() {
    const wasOpen = open;
    setOpen(o => !o);
    if (wasOpen) setConfirmClear(false);
    if (!wasOpen && unread > 0) {
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      if (uid.current) markNotifsReadE(uid.current);
    }
  }
  function clearAll() {
    setNotifs([]);
    if (uid.current) clearNotifsE(uid.current);
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button onClick={toggle} title="Upozornění" style={{
        width: 38, height: 38, borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border,
        color: T.muted, cursor: 'pointer', display: 'grid', placeItems: 'center', position: 'relative',
      }}>
        <span style={{ display: 'grid', placeItems: 'center', animation: ring ? 'wBellRing .75s cubic-bezier(.36,.07,.19,.97)' : 'none', transformOrigin: 'top center' }}>
          <Icon name="bell-bold" size={18} color={T.light} />
        </span>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 999, background: T.destructive, color: '#fff', fontSize: 10, fontWeight: 800, fontFamily: T.fontUI, display: 'grid', placeItems: 'center', border: '2px solid #07071a' }}>{unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0, zIndex: 201,
          width: 'min(360px, calc(100vw - 32px))', maxHeight: '70vh', overflowY: 'auto',
          background: T.card, border: '1px solid ' + T.border, borderRadius: 16,
          boxShadow: '0 24px 50px rgba(4,4,20,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid ' + T.border, position: 'sticky', top: 0, background: T.card, zIndex: 1 }}>
            <span style={{ color: T.cardText, fontFamily: T.fontHead, fontSize: 15, fontWeight: 800 }}>Upozornění</span>
            {notifs.length > 0 && !confirmClear && <button onClick={() => setConfirmClear(true)} style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)', color: T.destructive, borderRadius: 999, padding: '5px 12px', fontFamily: T.fontUI, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Vymazat</button>}
          </div>
          {confirmClear && (
            <div style={{ padding: '13px 16px', borderBottom: '1px solid ' + T.border, background: 'rgba(244,63,94,0.06)' }}>
              <div style={{ color: T.cardText, fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Opravdu smazat všechna oznámení?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, background: 'transparent', border: '1px solid ' + T.border, color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>Zrušit</button>
                <button onClick={() => { clearAll(); setConfirmClear(false); }} style={{ flex: 1, padding: '8px 0', borderRadius: 10, background: T.destructive, border: 'none', color: '#fff', fontFamily: T.fontUI, fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>Smazat</button>
              </div>
            </div>
          )}
          {notifs.length === 0 ? (
            <div style={{ padding: '34px 20px', textAlign: 'center', color: T.cardMuted, fontFamily: T.fontUI, fontSize: 13 }}>Zatím žádná upozornění.</div>
          ) : notifs.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '12px 16px', borderBottom: '1px solid ' + T.border, background: n.read ? 'transparent' : 'rgba(0,32,246,0.06)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,32,246,0.10)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={_E_NOTIF_ICON[n.type] || 'bell-bold'} size={17} color={T.primary} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {n.title ? <div style={{ color: T.cardText, fontFamily: T.fontHead, fontSize: 13.5, fontWeight: n.read ? 700 : 800 }}>{n.title}</div> : null}
                <div style={{ color: T.cardMuted, fontFamily: T.fontUI, fontSize: 12.5, marginTop: 1, lineHeight: 1.4, fontWeight: n.read ? 400 : 600 }}>{n.text}</div>
                <div style={{ color: T.cardMutedSoft, fontFamily: T.fontUI, fontSize: 11, marginTop: 3 }}>{_eAgo(n.ts)}</div>
              </div>
              {!n.read ? <span style={{ width: 8, height: 8, borderRadius: 999, background: T.primary, flexShrink: 0, marginTop: 6 }} /> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ETopbar({ title, subtitle, onNew, onSignOut, period = '30d', onPeriod }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 28px',
      borderBottom: '1px solid ' + T.border,
      background: T.navBg,
      backdropFilter: 'blur(16px)',
      boxShadow: '0 1px 0 ' + T.border,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ margin: 0, fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: -0.4 }}>{title}</h1>
          {subtitle ? <><span style={{ width: 4, height: 4, borderRadius: 999, background: T.mutedSoft }} /><span style={{ fontFamily: T.fontUI, fontSize: 13, color: T.muted, fontWeight: 500 }}>{subtitle}</span></> : null}
        </div>
      </div>

      {/* Period selector */}
      <div style={{
        display: 'flex', gap: 2, padding: 3, borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid ' + T.border,
      }}>
        {['7d', '30d', '90d', 'rok'].map((p) => (
          <button key={p} onClick={() => onPeriod && onPeriod(p)} style={{
            padding: '6px 12px', borderRadius: 7,
            background: p === period ? 'rgba(255,255,255,0.18)' : 'transparent',
            border: 'none',
            color: p === period ? T.text : T.muted,
            fontFamily: T.fontMono, fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}>{p}</button>
        ))}
      </div>

      <ENotifBell />

      <button
        onClick={onSignOut}
        title="Odhlásit se"
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.22)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.6)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; }}
        style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
          color: '#f87171', cursor: 'pointer',
          display: 'grid', placeItems: 'center',
          transition: 'background .15s, border-color .15s',
        }}>
        <Icon name="logout-2-bold" size={18} color="#f87171" />
      </button>

      <button onClick={onNew} style={{
        padding: '10px 16px', borderRadius: 10,
        background: 'rgba(255,255,255,0.95)',
        border: 'none', color: '#0020F6', cursor: 'pointer',
        fontFamily: T.fontUI, fontSize: 13, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 7,
        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
      }}>
        <Icon name="add-circle-bold" size={16} color="#0020F6" />
        Nový inzerát
      </button>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// CHARTS — pure SVG, no deps
// ─────────────────────────────────────────────────────────────

// Sparkline — tiny line for KPI cards
function Sparkline({ data, color = T.primary, width = 100, height = 32 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * height]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;
  const id = useMemoE(() => 'sg-' + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// Big area chart
function AreaChart({ series, width = 600, height = 220, labels = [] }) {
  const all = series.flatMap(s => s.data);
  const max = Math.max(...all) * 1.15;
  const min = 0;
  const range = max - min || 1;
  const padL = 36, padB = 24, padT = 8, padR = 8;
  const W = width - padL - padR, H = height - padT - padB;
  const stepX = W / (series[0].data.length - 1);

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => min + (range * i / ticks));

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={`ac-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {/* grid */}
      {yTicks.map((v, i) => {
        const y = padT + H - ((v - min) / range) * H;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(0,32,246,0.06)" strokeWidth="1" />
            <text x={padL - 8} y={y + 3} textAnchor="end" fill="#111111" fontFamily={T.fontMono} fontSize="9.5" fontWeight="700">
              {Math.round(v).toLocaleString('cs-CZ')}
            </text>
          </g>
        );
      })}
      {/* x-axis labels */}
      {labels.map((l, i) => {
        if (i % Math.ceil(labels.length / 6) !== 0) return null;
        const x = padL + i * stepX;
        return <text key={i} x={x} y={height - 6} textAnchor="middle" fill="#111111" fontFamily={T.fontMono} fontSize="9.5" fontWeight="700">{l}</text>;
      })}
      {/* series */}
      {series.map((s, idx) => {
        const pts = s.data.map((v, i) => [padL + i * stepX, padT + H - ((v - min) / range) * H]);
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
        const area = `${path} L${padL + W},${padT + H} L${padL},${padT + H} Z`;
        return (
          <g key={idx}>
            <path d={area} fill={`url(#ac-${idx})`} />
            <path d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => i === pts.length - 1 ? (
              <g key={i}>
                <circle cx={p[0]} cy={p[1]} r="6" fill={s.color} opacity="0.18" />
                <circle cx={p[0]} cy={p[1]} r="3.2" fill={s.color} />
                <circle cx={p[0]} cy={p[1]} r="3.2" fill="none" stroke="#fff" strokeWidth="1.2" />
              </g>
            ) : null)}
          </g>
        );
      })}
    </svg>
  );
}

// Bars
function BarChart({ data, width = 360, height = 180, color = T.primary }) {
  const max = Math.max(...data.map(d => d.v)) * 1.1;
  const padL = 32, padB = 22, padT = 4, padR = 4;
  const W = width - padL - padR, H = height - padT - padB;
  const bw = (W / data.length) * 0.6;
  const gap = (W / data.length) * 0.4;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {[0, 0.5, 1].map((t, i) => {
        const y = padT + H - t * H;
        return <line key={i} x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(0,32,246,0.06)" />;
      })}
      {data.map((d, i) => {
        const h = (d.v / max) * H;
        const x = padL + i * (bw + gap) + gap / 2;
        const y = padT + H - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} rx="3" fill={d.color || color} opacity="0.85" />
            <text x={x + bw / 2} y={y - 4} textAnchor="middle" fill="#111111" fontFamily={T.fontMono} fontSize="9.5" fontWeight="700">{d.v}</text>
            <text x={x + bw / 2} y={height - 6} textAnchor="middle" fill="#111111" fontFamily={T.fontUI} fontSize="9.5" fontWeight="600">{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Donut
function Donut({ data, size = 140, thickness = 18 }) {
  const total = data.reduce((a, b) => a + b.v, 0);
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,32,246,0.08)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const dash = (d.v / total) * c;
        const off = -acc;
        acc += dash;
        return (
          <circle key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${c}`}
            strokeDashoffset={off}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// COMMON — Card + KPI + Section
// ─────────────────────────────────────────────────────────────
function ECard({ children, style, padding = 22, onClick }) {
  return (
    <div onClick={onClick} style={{
      borderRadius: 18,
      background: T.card,
      border: '1px solid ' + T.cardBorder,
      padding,
      backdropFilter: 'blur(8px)',
      color: T.cardText,
      ...style,
    }}>{children}</div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
      <div>
        <div style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 800, color: '#111111', letterSpacing: -0.2 }}>{title}</div>
        {subtitle ? <div style={{ fontFamily: T.fontUI, fontSize: 12, color: '#555555', marginTop: 2 }}>{subtitle}</div> : null}
      </div>
      {action || null}
    </div>
  );
}

// ── Hlavička záložky a pás čísel (26. 9.) ──
// Yasin: „pryč s modrým rámečkem, jen název záložky, profesionální dashboard,
// hlavně jednoznačný". Proto všechny záložky kreslí hlavičku i čísla přes tyhle
// komponenty — jeden vzhled, žádná modrá plocha. Modrá zůstává jen pro hlavní
// akci (tlačítko) a odkazy. Číslo, které někam vede, je celé klikací a při
// najetí zešedne (bez modrého odkazu).
const _EH = { ink: '#0B1233', ink2: '#3A4266', muted: '#7A82A6', line: '#E6E9F5', line2: '#EEF0F6', blue: '#1B34F0' };

function ETabHlava({ title, children }) {
  return (
    <div className="e-hlav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: _EH.ink, letterSpacing: '-.025em', lineHeight: 1.15 }}>{title}</h1>
      {children ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{children}</div> : null}
    </div>
  );
}

// Hlavní akce záložky (modrá) a vedlejší akce (bílá s linkou).
function EBtnHl({ onClick, children, disabled }) {
  return <button type="button" className="e-btn-hl" onClick={onClick} disabled={disabled}
    style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: _EH.blue, border: '1px solid ' + _EH.blue, padding: '9px 16px', borderRadius: 10, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? .7 : 1, whiteSpace: 'nowrap' }}>{children}</button>;
}
function EBtnSek({ onClick, children, disabled }) {
  return <button type="button" className="e-btn-sek" onClick={onClick} disabled={disabled}
    style={{ fontSize: 13.5, fontWeight: 600, color: _EH.ink, background: '#fff', border: '1px solid ' + _EH.line, padding: '9px 14px', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7 }}>{children}</button>;
}
// Přepínač (Měsíc / Týden …)
function ESegment({ value, options, onChange }) {
  return (
    <div style={{ display: 'inline-flex', background: '#F3F4F8', borderRadius: 10, padding: 3, gap: 2 }}>
      {options.map(([k, l]) => (
        <button key={k} type="button" onClick={() => onChange(k)} style={{ fontSize: 13, fontWeight: 600, padding: '6px 13px', borderRadius: 8, border: 'none', cursor: 'pointer', color: value === k ? _EH.ink : _EH.muted, background: value === k ? '#fff' : 'transparent', boxShadow: value === k ? '0 1px 2px rgba(16,24,64,.12)' : 'none' }}>{l}</button>
      ))}
    </div>
  );
}

// Ikona z mobilní appky (employer/ikony/*.svg, Iconly Light-Outline) jako maska,
// aby šla obarvit. Jedna sada všude — tlačítka i menu vypadají stejně.
function EIkona({ src, size = 16, color = 'currentColor' }) {
  const u = 'url(ikony/' + src + '?v=1)';
  return <span aria-hidden="true" style={{ display: 'inline-block', width: size, height: size, flex: 'none', background: color, WebkitMaskImage: u, maskImage: u, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center', WebkitMaskSize: 'contain', maskSize: 'contain' }} />;
}

// ── Stupeň důvěry brigádníka — STEJNÝ jako v aplikaci (28. 9.) ──
// Kopie W_TIERS + makejTrust z www/worker-supabase.jsx (repo appky). Když se
// tam změní hranice, změnit i tady. Dřív tu byl „Level N" ze sloupce
// profiles.level, který appka nikdy nezapisuje — u všech bylo „Level 1".
const _E_TRUST_TIERS = [
  { nazev: 'Nový',       blevel: 'new',      brigady: 0,  spolehlivost: 0,  hodnoceni: 0   },
  { nazev: 'Spolehlivý', blevel: 'reliable', brigady: 3,  spolehlivost: 90, hodnoceni: 0   },
  { nazev: 'Ověřený',    blevel: 'verified', brigady: 10, spolehlivost: 95, hodnoceni: 4.5 },
  { nazev: 'Top',        blevel: 'top',      brigady: 30, spolehlivost: 98, hodnoceni: 4.8 },
];
// stats = { dokoncene, zrusene, hodnoceni } → { tier, spolehlivost }; null = nevíme
function eTrust(stats) {
  if (!stats) return null;
  const dok = Math.max(0, Number(stats.dokoncene) || 0), zru = Math.max(0, Number(stats.zrusene) || 0);
  const hod = Math.max(0, Number(stats.hodnoceni) || 0);
  const spol = dok + zru === 0 ? null : Math.round(dok / (dok + zru) * 100);
  let tier = _E_TRUST_TIERS[0];
  _E_TRUST_TIERS.forEach(t => {
    if (dok >= t.brigady && (t.spolehlivost === 0 || spol === null || spol >= t.spolehlivost) && (t.hodnoceni === 0 || hod >= t.hodnoceni)) tier = t;
  });
  return { tier, spolehlivost: spol, dokoncene: dok, zrusene: zru };
}
// Kovová pilulka stupně — styl .wlvl je v index.html (kopie z appky)
function ETrustBadge({ stats, sm }) {
  const t = eTrust(stats);
  if (!t) return null;
  return (
    <span className={'wlvl' + (sm ? ' wlvl--sm' : '')} data-level={t.tier.blevel}
      title={'Stupeň důvěry v aplikaci · dokončené směny: ' + t.dokoncene + (t.spolehlivost === null ? '' : ' · spolehlivost ' + t.spolehlivost + ' %')}>
      {t.tier.blevel === 'top' && <span className="wlvl__aura" aria-hidden="true" />}
      <span className="wlvl__pill">{t.tier.nazev}<span className="wlvl__sheen" aria-hidden="true" /></span>
    </span>
  );
}

// ── Filtrační lišta seznamů (28. 9.) — stejná na Inzerátech, Kandidátech
// a Recenzích: vlevo přepínač skupin s počty, vpravo roletka řazení a hledání.
// Lišta nemá vlastní rámeček, stojí přímo nad seznamem.
// Když se celá lišta na jeden řádek nevejde (Kandidáti, Recenze — vedle je
// boční panel), přepne se do úsporného režimu (třída „kompakt"): řazení
// i hledání se zmenší na ikonky a hledání se rozbalí až po kliknutí.
// Lišta tak zůstane na jednom řádku, nic nevisí samotné pod ní.
// vzdyKompakt: ikonky i tam, kde by se plná podoba vešla (Inzeráty — Yasin 28. 9.)
// Po změně skupiny, řazení nebo hledání skočí seznam na začátek (Yasin 29. 9.: „vždycky
// to musí přesunout toho člověka podle toho, kam vybere"). Dřív zůstal posunutý tam, kde byl
// v předchozím výběru — u kratšího seznamu tak člověk viděl jen jeho konec.
// Posouvaný seznam pod lištou (cokoli za ní, co je odscrollované) nahoru; a když lišta
// sama odjela z pohledu (posouvá se celá karta / <main> na mobilu), vrátí ji do pohledu.
// Boční panel vedle seznamu (Kandidáti) za lištou není, ten zůstane, jak je.
function _eSeznamNaZacatek(el, plynule = true) {
  const lista = el && el.closest && el.closest('.e-filtr');
  if (!lista) return;
  requestAnimationFrame(() => {
    const jak = plynule ? 'smooth' : 'auto';
    for (let sb = lista.nextElementSibling; sb; sb = sb.nextElementSibling) {
      [sb, ...sb.querySelectorAll('*')].forEach(m => {
        if (m.scrollTop > 0 && /(auto|scroll)/.test(getComputedStyle(m).overflowY)) m.scrollTo({ top: 0, behavior: jak });
      });
    }
    for (let m = lista.parentElement; m && m !== document.body; m = m.parentElement) {
      if (!/(auto|scroll)/.test(getComputedStyle(m).overflowY)) continue;
      const o = m.getBoundingClientRect().top, t = lista.getBoundingClientRect().top;
      if (t < o) m.scrollBy({ top: t - o - 8, behavior: jak });
    }
  });
}
function EFiltrLista({ children, vzdyKompakt }) {
  const ref = useRefE(null);
  const plna = useRefE(0);              // šířka pravé části v plné podobě
  const [kompakt, setKompakt] = useStateE(false);
  useEffectE(() => {
    const el = ref.current; if (!el) return;
    const zmer = () => {
      const [levy, pravy] = el.children; if (!levy || !pravy) return;
      if (!el.classList.contains('kompakt')) plna.current = [...pravy.children].reduce((w, c) => w + c.offsetWidth, 0) + 10 * (pravy.children.length - 1);
      setKompakt(levy.offsetWidth + 16 + plna.current > el.clientWidth);
    };
    zmer();
    const ro = new ResizeObserver(zmer); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className={'e-filtr' + (kompakt || vzdyKompakt ? ' kompakt' : '')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>{children}</div>;
}
// Pravá část lišty (řazení + hledání). Kdyby se lišta i tak zalomila,
// zůstane i na druhém řádku vpravo, ne nalepená vlevo.
function EFiltrVpravo({ children }) {
  return <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>{children}</div>;
}
// options: [{ k, l, n }] — n = počet (nepovinný)
function EFiltrPrepinac({ value, options, onChange }) {
  return (
    <div style={{ display: 'inline-flex', flexWrap: 'wrap', background: '#F3F4F8', borderRadius: 11, padding: 3, gap: 2 }}>
      {options.map(o => {
        const on = value === o.k;
        return (
          <button key={o.k} type="button" onClick={e => { onChange(o.k); _eSeznamNaZacatek(e.currentTarget); }} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: on ? 700 : 600, padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', color: on ? '#0B1233' : '#6B7280', background: on ? '#fff' : 'transparent', boxShadow: on ? '0 1px 2px rgba(16,24,64,.12)' : 'none' }}>
            {o.l}{o.n != null && <span style={{ fontSize: 12, fontWeight: 700, color: on ? '#1B34F0' : '#A6ADCB' }}>{o.n}</span>}
          </button>
        );
      })}
    </div>
  );
}
// Výběr jedné položky z delšího seznamu (např. inzerát u Kandidátů).
// options: [{ k, l, n }] — l = název, n = počet (nepovinný). Zůstává textový
// i v úsporném režimu lišty, jen se víc zkrátí.
function EFiltrVyber({ value, options, onChange, popisek, maxSirka = 190 }) {
  const [otevreno, setOtevreno] = React.useState(false);
  const vybrana = options.find(o => o.k === value) || options[0] || { l: '' };
  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <button type="button" title={popisek + ' ' + vybrana.l} onClick={() => setOtevreno(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3A4266', background: value !== options[0]?.k ? '#EEF1FF' : '#fff', border: '1px solid ' + (otevreno || value !== options[0]?.k ? '#1B34F0' : '#E6E9F5'), padding: '0 12px', height: 38, borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap', maxWidth: maxSirka }}>
        <span style={{ color: '#7A82A6' }}>{popisek}</span>
        <b style={{ fontWeight: 700, color: '#0B1233', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{vybrana.l}</b>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7A82A6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', transform: otevreno ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {otevreno && (
        <>
          <div onClick={() => setOtevreno(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 41, minWidth: 260, maxWidth: 340, maxHeight: 320, overflowY: 'auto', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 12, boxShadow: '0 14px 34px -12px rgba(16,24,64,.25)', padding: 5 }}>
            {options.map(o => (
              <button key={o.k} type="button" className="e-stav-vol" onClick={e => { onChange(o.k); setOtevreno(false); _eSeznamNaZacatek(e.currentTarget); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', fontSize: 13.5, fontWeight: value === o.k ? 700 : 500, color: '#0B1233', background: 'transparent', border: 'none', borderRadius: 8, padding: '9px 11px', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.l}</span>
                {o.n != null && <span style={{ fontSize: 12, fontWeight: 600, color: '#A6ADCB', flex: 'none' }}>{o.n}</span>}
                <span style={{ width: 14, flex: 'none', display: 'flex' }}>{value === o.k && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B34F0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
// options: { klic: 'Popisek' }
function EFiltrRazeni({ value, options, onChange }) {
  const [otevreno, setOtevreno] = React.useState(false);
  return (
    <div className="e-filtr-razeni" style={{ position: 'relative' }}>
      <button type="button" title={'Řadit: ' + options[value]} onClick={() => setOtevreno(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3A4266', background: '#fff', border: '1px solid ' + (otevreno ? '#1B34F0' : '#E6E9F5'), padding: '0 12px', height: 38, borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap', position: 'relative' }}>
        <span className="e-filtr-txt" style={{ color: '#7A82A6' }}>Řadit:</span><b className="e-filtr-txt" style={{ fontWeight: 700, color: '#0B1233' }}>{options[value]}</b>
        <svg className="e-filtr-txt" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7A82A6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: otevreno ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6"/></svg>
        {/* úsporný režim: jen ikonka řazení; modrá tečka = není výchozí řazení */}
        <svg className="e-filtr-ikona" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A4266" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/></svg>
        {value !== Object.keys(options)[0] && <span className="e-filtr-ikona" style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 9, background: '#1B34F0' }} />}
      </button>
      {otevreno && (
        <>
          <div onClick={() => setOtevreno(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div className="e-filtr-menu" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 41, minWidth: 'max(100%, 210px)', background: '#fff', border: '1px solid #E6E9F5', borderRadius: 12, boxShadow: '0 14px 34px -12px rgba(16,24,64,.25)', padding: 5 }}>
            {Object.keys(options).map(k => (
              <button key={k} type="button" className="e-stav-vol" onClick={e => { onChange(k); setOtevreno(false); _eSeznamNaZacatek(e.currentTarget); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', fontSize: 13.5, fontWeight: value === k ? 700 : 500, color: '#0B1233', background: 'transparent', border: 'none', borderRadius: 8, padding: '9px 11px', cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap' }}>
                {options[k]}
                {value === k && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B34F0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
function EFiltrHledat({ value, onChange, placeholder, width = 220 }) {
  return (
    <div className="e-filtr-hledat" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A6ADCB" strokeWidth="2.2" strokeLinecap="round" style={{ position: 'absolute', left: 11, pointerEvents: 'none', zIndex: 4 }}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input title={placeholder} value={value} onChange={e => { onChange(e.target.value); _eSeznamNaZacatek(e.currentTarget, false); }} placeholder={placeholder} style={{ fontFamily: 'inherit', fontSize: 13, color: '#0B1233', background: '#F6F7FC', border: '1px solid #E6E9F5', outline: 'none', width, height: 38, boxSizing: 'border-box', padding: '0 12px 0 33px', borderRadius: 10 }} />
    </div>
  );
}

// Pás čísel: [{ l: 'Popisek', v: hodnota, s: 'podtext', kam: 'Text odkazu', onClick, varovani }]
// Pás jde schovat (Yasin 29. 9.: „ta horní lajna mi zavazela") úchytem pod ním —
// stejným jako u levého menu, jen naležato: v klidu šedá čárka, při najetí šipka
// ^ (skrýt) / v (ukázat). Volba platí pro všechny záložky a pamatuje se v prohlížeči.
// Čekající kandidáti se neztratí — počet má i položka Kandidáti v menu.
function EMetriky({ items }) {
  const [skryte, setSkryte] = useStateE(() => { try { return localStorage.getItem('emp-cisla-skryte') === '1'; } catch (e) { return false; } });
  const prepni = () => { const v = !skryte; setSkryte(v); try { localStorage.setItem('emp-cisla-skryte', v ? '1' : '0'); } catch (e) {} };
  return (
    <div className="e-pruh-ram" style={{ padding: '0 24px', position: 'relative' }}>
    <div style={{ display: 'grid', gridTemplateRows: skryte ? '0fr' : '1fr', opacity: skryte ? 0 : 1, transition: 'grid-template-rows .24s cubic-bezier(.2,.8,.2,1), opacity .18s ease' }}>
    <div style={{ minHeight: 0, overflow: 'hidden' }}>
    <div className="e-pruh" style={{ display: 'grid', gridTemplateColumns: 'repeat(' + items.length + ', minmax(0,1fr))', background: '#fff', border: '1px solid ' + _EH.line, borderRadius: 14, overflow: 'hidden' }}>
      {items.map((m, i) => (
        // Klikací políčko nemá modrý odkaz (Yasin 27. 9.) — pozná se podle toho,
        // že při najetí zešedne; kam vede, řekne bublina (title).
        <div key={i} className={m.onClick ? 'e-pruh-klik' : undefined} onClick={m.onClick} title={m.onClick && m.kam ? m.kam : undefined}
          role={m.onClick ? 'button' : undefined} tabIndex={m.onClick ? 0 : undefined}
          onKeyDown={m.onClick ? (e => { if (e.key === 'Enter') m.onClick(); }) : undefined}
          style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 3, borderLeft: i ? '1px solid ' + _EH.line2 : 'none', cursor: m.onClick ? 'pointer' : 'default', minWidth: 0 }}>
          {/* Decentnější pás (28. 9.): číslo 20 px místo 28 a podtext vedle
              něj na jednom řádku — pás je o třetinu nižší a malá čísla
              (0, 1, 2) na začátku nepůsobí prázdně. */}
          <span style={{ fontSize: 12.5, fontWeight: 600, color: _EH.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.l}</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span className="e-pruh-v" style={{ fontSize: 20, fontWeight: 700, color: m.varovani ? '#C2410C' : _EH.ink, letterSpacing: '-.01em', lineHeight: 1.2, whiteSpace: 'nowrap', flex: 'none' }}>{m.v}</span>
            <span style={{ fontSize: 12.5, color: _EH.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{m.s}</span>
          </span>
        </div>
      ))}
    </div>
    </div>
    </div>
    <button type="button" className={'e-uchyt-v' + (skryte ? ' zavreno' : '')} onClick={prepni}
      aria-label={skryte ? 'Ukázat čísla' : 'Skrýt čísla'} aria-expanded={!skryte}>
      <span className="e-uchyt-l" /><span className="e-uchyt-p" />
      <em className="e-uchyt-tip">{skryte ? 'Ukázat čísla' : 'Skrýt čísla'}</em>
    </button>
    </div>
  );
}

Object.assign(window, { TierMetalBadge, TierMetalText, TierGradientText, TierMetalButton, ELogo, ESidebar, ETopbar, Sparkline, AreaChart, BarChart, Donut, ECard, SectionHeader, ETabHlava, EBtnHl, EBtnSek, ESegment, EMetriky, EIkona, eTrust, ETrustBadge, EFiltrLista, EFiltrVpravo, EFiltrVyber, EFiltrPrepinac, EFiltrRazeni, EFiltrHledat });
