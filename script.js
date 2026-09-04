// ═══════════ NAVBAR SCROLL + SCROLLSPY ═══════════
const navbar    = document.getElementById('navbar');
const navActions = document.getElementById('nav-actions') || document.querySelector('.nav-actions');
const navLinks  = document.querySelectorAll('.nav-links a[href^="#"]');
const spySections = ['how-it-works', 'features', 'employers', 'about', 'download']
  .map(id => document.getElementById(id)).filter(Boolean);
// Na podstránkách (např. /pro-zamestnavatele) je aktivní odkaz aktuální stránky
// nastaven natvrdo — scrollspy pak nesmí rozsvěcet sekční kotvy (#download apod.).
const hasStaticActive = !!document.querySelector('.nav-links a.nav-active:not([href^="#"])');

function updateNav() {
  const scrollY = window.scrollY;
  navbar.classList.toggle('scrolled', scrollY > 50);

  if (navActions) {
    const hero = document.getElementById('hero');
    navActions.classList.toggle('nav-actions-visible', hero ? scrollY > hero.offsetHeight * 0.8 : true);
  }

  // Navbar nad světlou (bílou) sekcí → ztmavit text
  let overLight = false;
  document.querySelectorAll('.nav-light').forEach(sec => {
    const r = sec.getBoundingClientRect();
    if (r.top <= 70 && r.bottom >= 10) overLight = true;
  });
  navbar.classList.toggle('nav-over-light', overLight);

  // Světlá stránka (blog, články): nad modrou patičkou přepnout navbar zpátky do bílé
  if (navbar.classList.contains('nav-light-page')) {
    let overBlue = false;
    document.querySelectorAll('[data-nav-blue]').forEach(sec => {
      const r = sec.getBoundingClientRect();
      if (r.top <= 70 && r.bottom >= 10) overBlue = true;
    });
    navbar.classList.toggle('nav-over-blue', overBlue);
  }

  if (hasStaticActive) return; // aktivní je jen odkaz aktuální stránky

  const mid = window.innerHeight * 0.35;
  let active = null;
  spySections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= mid) active = sec;
  });
  navLinks.forEach(a => {
    const matches = active && a.getAttribute('href') === '#' + active.id;
    a.classList.toggle('nav-active', matches);
  });
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// ═══════════ NAVBAR DROPDOWNS ═══════════
function setupNavDropdowns() {
  const menus = {
    'pro-zamestnavatele': [
      ['Jak to funguje', '/pro-zamestnavatele#jak-to-funguje'],
      ['Dashboard',      '/pro-zamestnavatele#dashboard'],
      ['Ceník',          '/pro-zamestnavatele#pricing'],
      ['Časté dotazy',   '/pro-zamestnavatele#faq'],
    ],
    'hledam-si-praci': [
      ['Jak to funguje', '/hledam-si-praci#how-it-works'],
      ['Vyzkoušej appku','/hledam-si-praci#features'],
      ['Stáhnout',       '/hledam-si-praci#download'],
    ],
  };
  document.querySelectorAll('.nav-links > a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const key = Object.keys(menus).find(k => href.indexOf(k) !== -1);
    if (!key) return;
    const wrap = document.createElement('div');
    wrap.className = 'nav-dropdown';
    a.parentNode.insertBefore(wrap, a);
    wrap.appendChild(a);
    const menu = document.createElement('div');
    menu.className = 'nav-dropdown-menu';
    menus[key].forEach(([label, url]) => {
      const link = document.createElement('a');
      link.href = url;
      link.textContent = label;
      menu.appendChild(link);
    });
    wrap.appendChild(menu);
  });
}
// Vypnuto: rozbalovací podmenu v navbaru při najetí myší.
// Funkce i CSS (.nav-dropdown*) zůstávají — stačí odkomentovat řádek níž.
// setupNavDropdowns();

// Po načtení (vč. obrázků) doskroluj přesně na kotvu z URL — opraví posun z lazy-load
window.addEventListener('load', function () {
  if (!location.hash) return;
  var el = null;
  try { el = document.querySelector(location.hash); } catch (e) { return; }
  if (!el) return;
  requestAnimationFrame(function () {
    var y = el.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo(0, y);
  });
});

// ═══════════ MOBILE MENU ═══════════
// Tlačítek může být na stránce víc — .vx-nav (Lidé / Hledám práci / Pro zaměstnavatele)
// má vlastní hamburger, ale sdílí jeden panel #mobile-menu.
const menuBtns = document.querySelectorAll('.mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (mobileMenu && menuBtns.length) {
  const setMenu = (open) => {
    mobileMenu.classList.toggle('active', open);
    menuBtns.forEach(b => {
      b.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtns.forEach(btn => {
    btn.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('active')));
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenu(false));
  });
  // klik mimo panel a Esc menu zavřou
  document.addEventListener('click', (e) => {
    if (!mobileMenu.classList.contains('active')) return;
    if (mobileMenu.contains(e.target) || e.target.closest('.mobile-menu-btn')) return;
    setMenu(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
}

// ═══════════ SMOOTH SCROLL FOR NAV LINKS ═══════════
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const sel = anchor.getAttribute('href');
    if (!sel || sel === '#') return; // bare hash — nechat auth handlery pracovat
    try {
      const target = document.querySelector(sel);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (_) { /* invalid selector — skip */ }
  });
});

// ═══════════ COUNTER ANIMATION ═══════════
function animateCounters() {
  const counters = document.querySelectorAll('.hero-stat-number');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      counter.textContent = target >= 1000 ? current.toLocaleString('cs-CZ') : current;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

// ═══════════ SCROLL REVEAL ═══════════
function setupReveal() {
  // Bezpečné obsahové bloky napříč stránkami. POZOR: nezahrnovat prvky s vlastním
  // transformem (.dl-card rotate) ani kroky u „jak to funguje" (.bolt-row — konflikt
  // s kreslenou spojnicí), aby se transform nepřebil.
  const SEL = [
    '.step-card', '.feature-card', '.testimonial-card', '.download-card',
    '.section-header', '.cn-plan', '.yp-head',
    '.ref-grid', '.bolt-head', '.bolt-text',
    '.ab-lead', '.ab-col', '.ab-team-block', '.ab-person', '.ab-quote', '.ab-cta',
    '.emp-faq-item', '.faq-item',
  ].join(', ');
  const revealElements = document.querySelectorAll(SEL);

  revealElements.forEach(el => {
    el.classList.add('reveal');
    // Stagger: prvek dostane zpoždění podle pořadí mezi reveal-sourozenci ve stejném
    // rodiči → skupiny karet naskakují kaskádovitě, samostatné bloky bez zpoždění.
    let i = 0, s = el.previousElementSibling;
    while (s) { if (s.classList && s.classList.contains('reveal')) i++; s = s.previousElementSibling; }
    if (i > 0) el.style.transitionDelay = (Math.min(i, 5) * 0.08).toFixed(2) + 's';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => observer.observe(el));
}

// ═══════════ HERO COUNTER TRIGGER ═══════════
const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      heroObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

// ═══════════ HERO LINE SCROLL UNDERLINE ═══════════
function setupHeroUnderline() {
  const heroLines = document.querySelectorAll('.hero-line');
  if (!heroLines.length) return;

  // Trigger underlines sequentially when hero heading enters the viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        heroLines.forEach((line, i) => {
          setTimeout(() => line.classList.add('hero-line--active'), i * 300);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  const heroH1 = document.querySelector('#hero h1');
  if (heroH1) observer.observe(heroH1);
}

// ═══════════ DATUMOVÝ „REVOLVER" PICKER (den·měsíc·rok) ═══════════
// Vanilla verze Yasinova WDatumPicker — nahrazuje nativní <input type="date">
// hezkým rolovacím výběrem (den · měsíc · rok, roluješ do středu).
function initDatePicker(input, opts) {
  if (!input || input.dataset.dp) return;
  input.dataset.dp = '1';
  input.type = 'hidden';
  opts = opts || {};
  const MES = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
  const letos = new Date().getFullYear();
  const yFrom = opts.yearFrom != null ? opts.yearFrom : letos;
  const yTo   = opts.yearTo   != null ? opts.yearTo   : 1920;
  const ROKY = [];
  if (yFrom >= yTo) { for (let r = yFrom; r >= yTo; r--) ROKY.push(r); }
  else { for (let r = yFrom; r <= yTo; r++) ROKY.push(r); }
  const placeholder = opts.placeholder || 'Vyber datum';
  const parse = v => { const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||''); return m?{y:+m[1],mo:+m[2]-1,d:+m[3]}:{y:(opts.defYear||2005),mo:0,d:1}; };
  const fmt = v => { const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||''); return m?(+m[3]+'. '+(+m[2])+'. '+m[1]):''; };
  const daysIn = (y,mo) => new Date(y, mo+1, 0).getDate();

  let cur = parse(input.value);

  const wrap = document.createElement('div'); wrap.className = 'mdp';
  wrap.innerHTML =
    '<button type="button" class="mdp-btn"><iconify-icon icon="solar:calendar-bold"></iconify-icon><span class="mdp-label"></span></button>' +
    '<div class="mdp-pop"></div>';
  input.parentNode.insertBefore(wrap, input.nextSibling);
  const btn = wrap.querySelector('.mdp-btn');
  const pop = wrap.querySelector('.mdp-pop');
  const labelEl = wrap.querySelector('.mdp-label');

  function syncLabel() {
    labelEl.textContent = input.value ? fmt(input.value) : placeholder;
    wrap.classList.toggle('mdp-empty', !input.value);
  }
  function commit() {
    input.value = cur.y + '-' + String(cur.mo+1).padStart(2,'0') + '-' + String(cur.d).padStart(2,'0');
    syncLabel();
    try { input.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  }
  function divEl(){ const d=document.createElement('div'); d.className='mdp-div'; return d; }

  function makeWheel(items, index, itemW, onIndex) {
    const w = document.createElement('div'); w.className = 'mdp-wheel-wrap';
    const hl = document.createElement('div'); hl.className='mdp-hl'; hl.style.width=(itemW-10)+'px';
    const fl = document.createElement('div'); fl.className='mdp-fade mdp-fade-l';
    const fr = document.createElement('div'); fr.className='mdp-fade mdp-fade-r';
    const track = document.createElement('div'); track.className='w-wheel mdp-track';
    const pad1 = document.createElement('div'); pad1.style.flex='0 0 calc(50% - '+(itemW/2)+'px)'; track.appendChild(pad1);
    const btns = items.map((it,i)=>{
      const b=document.createElement('button'); b.type='button'; b.className='mdp-item'+(i===index?' is-active':'');
      b.style.flex='0 0 '+itemW+'px'; b.textContent=it;
      b.addEventListener('click',()=>{
        track.scrollTo({left:i*itemW,behavior:'smooth'});
        btns.forEach((bb,bi)=>bb.classList.toggle('is-active',bi===i));
        onIndex(i);
      });
      track.appendChild(b); return b;
    });
    const pad2 = document.createElement('div'); pad2.style.flex='0 0 calc(50% - '+(itemW/2)+'px)'; track.appendChild(pad2);
    w.appendChild(hl); w.appendChild(fl); w.appendChild(fr); w.appendChild(track);
    requestAnimationFrame(()=>{ track.scrollLeft = index*itemW; });
    let tim;
    track.addEventListener('scroll',()=>{
      clearTimeout(tim);
      tim=setTimeout(()=>{
        const i=Math.max(0,Math.min(items.length-1,Math.round(track.scrollLeft/itemW)));
        btns.forEach((b,bi)=>b.classList.toggle('is-active',bi===i));
        onIndex(i);
      },90);
    },{passive:true});
    return w;
  }

  let dayHolder;
  function buildDayWheel() {
    const cnt = daysIn(cur.y, cur.mo);
    if (cur.d > cnt) cur.d = cnt;
    const DNY=[]; for(let d=1; d<=cnt; d++) DNY.push(d);
    return makeWheel(DNY, cur.d-1, 62, i=>{ cur.d=i+1; commit(); });
  }
  function refreshDay() { const nw = buildDayWheel(); pop.replaceChild(nw, dayHolder); dayHolder = nw; }
  function renderPop() {
    pop.innerHTML='';
    dayHolder = buildDayWheel();
    pop.appendChild(dayHolder);
    pop.appendChild(divEl());
    pop.appendChild(makeWheel(MES, cur.mo, 116, i=>{ cur.mo=i; refreshDay(); commit(); }));
    pop.appendChild(divEl());
    pop.appendChild(makeWheel(ROKY, Math.max(0,ROKY.indexOf(cur.y)), 86, i=>{ cur.y=ROKY[i]; refreshDay(); commit(); }));
  }

  btn.addEventListener('click', e=>{
    e.preventDefault();
    const opening = !wrap.classList.contains('is-open');
    if (opening) { cur = parse(input.value); renderPop(); }
    wrap.classList.toggle('is-open');
  });
  document.addEventListener('click', e=>{ if(!wrap.contains(e.target)) wrap.classList.remove('is-open'); }, true);
  syncLabel();
}

// ═══════════ INIT ═══════════
document.addEventListener('DOMContentLoaded', () => {
  setupReveal();
  initAuth();
  // Datum narození v registraci → „revolver" picker (1920 … letos)
  initDatePicker(document.getElementById('reg-birth'), { placeholder: 'Vyber datum narození', defYear: 2005 });
});

// ═══════════ AUTH / SUPABASE ═══════════
const SUPABASE_URL = 'https://cxegfwfbgcgpwerfbvra.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_N_BIwMCTD6ZOTrtBl3juyw_CGIQ_lvh';

function initAuth() {
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, storageKey: 'makej-auth' }
  });

  const overlay      = document.getElementById('modal-overlay');
  const loginModal   = document.getElementById('login-modal');
  const registerModal = document.getElementById('register-modal');
  let selectedRole = 'worker';
  // true = registrace otevřena z waitlistu → „Zpět" vede zpět na waitlist,
  // ne na rozcestník. Resetuje se při každém otevření modálu (wlGoRegister ho pak nastaví).
  let regFromWaitlist = false;
  // true = po signUp NEpřesměrovávat (když je v Supabase vypnuté potvrzování e-mailu,
  // signUp uživatele rovnou přihlásí — nechceme ho hodit do dashboardu). Viz register-form.
  let skipAutoRedirect = false;

  // ── PŘÍSTUPOVÝ KLÍČ ──────────────────────────────────────────────────────
  // Web je před spuštěním: registrace běží pro všechny, ale PŘIHLÁSIT se (a jít
  // do dashboardu) může jen ten, kdo v přihlašovacím formuláři zadá platný klíč.
  //   ⇒ ZMĚNIT KLÍČ = uprav ACCESS_KEY.  ⇒ NAOSTRO = dej ACCESS_KEY na '' (pustí všechny).
  const ACCESS_KEY = '8939';
  const ACCESS_LOCKED_MSG =
    'Spouštíme 1. 10. — zrovna na tom makáme. 💪 Jakmile bude hotovo, dáme ti vědět e-mailem.';
  function accessKeyOk() {
    if (!ACCESS_KEY) return true;
    const el = document.getElementById('login-key');
    return !!el && el.value.trim() === ACCESS_KEY;
  }

  // ─── Modal open/close ───
  function openModal(type, role) {
    regFromWaitlist = false;
    overlay.classList.add('active');
    if (type === 'login') {
      loginModal.classList.add('active');
      registerModal.classList.remove('active');
      // Restart peeker animation
      const p = document.getElementById('main-peeker');
      if (p) { p.style.animation = 'none'; requestAnimationFrame(() => { p.style.animation = 'peekerIn 0.45s cubic-bezier(.2,.8,.2,1) both'; }); }
    } else {
      registerModal.classList.add('active');
      loginModal.classList.remove('active');
      const backBtn = document.getElementById('reg-back');
      if (role) {
        // Role je předvybraná (worker-cta / employer-cta) → přeskoč rozcestník
        // a skryj „Zpět", aby se na rozcestník nedalo vrátit.
        applyRole(role);
        showRegStep(2);
        if (backBtn) backBtn.style.display = 'none';
      } else {
        // Bez role (tlačítko v navbaru) → ukaž rozcestník a nech „Zpět" dostupné.
        showRegStep(1);
        if (backBtn) backBtn.style.display = '';
      }
    }
    document.body.style.overflow = 'hidden';
  }

  function closeModals() {
    overlay.classList.remove('active');
    loginModal.classList.remove('active');
    registerModal.classList.remove('active');
    document.body.style.overflow = '';
    clearErrors();
  }

  function clearErrors() {
    ['login-error', 'register-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.style.display = 'none'; }
    });
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = 'block';
  }

  // ─── Register steps ───
  function showRegStep(n) {
    document.getElementById('reg-step-1').style.display = n === 1 ? 'block' : 'none';
    document.getElementById('reg-step-2').style.display = n === 2 ? 'block' : 'none';
  }

  function applyRole(role) {
    selectedRole = role;
    // Null-safe: některé stránky mají zjednodušený registrační modal (bez
    // birth/gender/kraj polí). Kdyby applyRole spadl na null, nepřeskočil by se
    // rozcestník rolí u worker-cta / employer-cta tlačítek.
    const setText  = (id, txt)  => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    const setDisp  = (id, disp) => { const el = document.getElementById(id); if (el) el.style.display = disp; };
    setText('reg-role-subtitle', role === 'worker' ? 'Brigádník' : 'Zaměstnavatel');
    setDisp('reg-company-group', role === 'employer' ? 'block' : 'none');
    setDisp('reg-birth-group',   role === 'worker' ? 'block' : 'none');
    setDisp('reg-gender-group',  role === 'worker' ? 'block' : 'none');
    setText('reg-kraj-label',    role === 'worker' ? 'Z jakého jsi kraje?' : 'Kraj firmy');
  }

  // ─── Nav update ───
  // Voláno z onAuthStateChange — jednoduše vymění obsah nav a přidá listenery na nové prvky
  function updateNavAuth(user) {
    const navActions    = document.querySelector('.nav-actions');
    const mobileActions = document.querySelector('.mobile-menu-actions');

    // ─── Update hero CTA section ───
    const heroCTAAuth     = document.getElementById('hero-cta-auth');
    const heroCTALoggedin = document.getElementById('hero-cta-loggedin');
    const heroDashBtn     = document.getElementById('hero-dashboard-btn');
    const heroWorkerBtn   = document.getElementById('hero-worker-btn');

    if (user) {
      navActions.classList.add('nav-actions-visible'); // always show when logged in
      const name = user.user_metadata?.name || user.email.split('@')[0];
      const role = user.user_metadata?.role;
      const dashBtn = role === 'employer'
        ? `<a href="/employer/" class="btn-primary" id="dashboard-btn">
             <iconify-icon icon="solar:chart-square-bold" width="16"></iconify-icon>
             Dashboard
           </a>`
        : `<a href="/worker/" class="btn-primary" id="worker-btn">
             <iconify-icon icon="solar:case-round-bold" width="16"></iconify-icon>
             Moje brigády
           </a>`;
      navActions.innerHTML = `
        ${dashBtn}
        <button class="btn-ghost" id="logout-btn">Odhlásit se</button>
      `;
      mobileActions.innerHTML = `
        ${role === 'employer'
          ? `<a href="/employer/" class="btn-primary">Dashboard</a>`
          : `<a href="/worker/" class="btn-primary">Moje brigády</a>`}
        <span class="nav-user-greeting">Ahoj, ${name}!</span>
        <button class="btn-ghost" id="logout-btn-mobile">Odhlásit se</button>
      `;
      document.getElementById('logout-btn').addEventListener('click', () => sb.auth.signOut());
      document.getElementById('logout-btn-mobile').addEventListener('click', () => sb.auth.signOut());

      // Hero CTA: hide auth buttons, show the right dashboard/worker button
      if (heroCTAAuth)     heroCTAAuth.style.display     = 'none';
      if (heroCTALoggedin) heroCTALoggedin.style.display = 'flex';
      if (heroDashBtn)   heroDashBtn.style.display   = role === 'employer' ? 'inline-flex' : 'none';
      if (heroWorkerBtn) heroWorkerBtn.style.display = role !== 'employer' ? 'inline-flex' : 'none';
    } else {
      // Lišta s jedinou akcí (hlavní stránka) registraci nemá — tu tam obstarává
      // „Vytvořit profil" v heru. Bez téhle větve by ji tenhle přepis vrátil zpět.
      const soloLogin = !!document.querySelector('#navbar.nav-single-action');
      navActions.innerHTML = `
        <a href="javascript:void(0)" class="btn-ghost" id="nav-login-btn">Přihlásit se</a>
        ${soloLogin ? '' : '<a href="javascript:void(0)" class="btn-primary" id="nav-register-btn">Vytvořit účet</a>'}
      `;
      mobileActions.innerHTML = `
        <a href="javascript:void(0)" class="btn-ghost" id="mobile-login-btn">Přihlásit se</a>
        <a href="javascript:void(0)" class="btn-primary" id="mobile-register-btn">Vytvořit účet</a>
      `;
      // Bind jen čerstvě vytvořené nav prvky (employer btn se binduje zvlášť, jen jednou)
      [
        ['nav-login-btn',      'login'],
        ['nav-register-btn',   'register'],
        ['mobile-login-btn',   'login'],
        ['mobile-register-btn','register'],
      ].forEach(([id, type]) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', e => { e.preventDefault(); type === 'register' ? goWaitlist() : openModal(type); });
      });

      // Hero CTA: show auth buttons, hide dashboard/worker
      if (heroCTAAuth)     heroCTAAuth.style.display     = 'flex';
      if (heroCTALoggedin) heroCTALoggedin.style.display = 'none';
    }
  }

  // „Registrovat se / Vytvořit účet" → nejdřív na čekací list (předregistrace).
  // Na index.html (kde je overlay) otevře čekací list rovnou; z ostatních stránek
  // přesměruje na /?wl (index čekací list po načtení sám otevře).
  function goWaitlist(role) {
    if (document.getElementById('wl-overlay') && typeof openWaitlist === 'function') {
      openWaitlist();
      if (role && window.wlSetTab) window.wlSetTab(role);
    } else {
      window.location.href = '/?wl=1' + (role ? '&role=' + role : '');
    }
  }

  // ─── Statická tlačítka (nejsou nikdy přepisována) — bindujeme jen jednou ───
  document.querySelectorAll('.employer-cta-register').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); goWaitlist('employer'); });
  });
  document.querySelectorAll('.worker-cta-register').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); goWaitlist('worker'); });
  });

  // Hero CTA buttons (Vytvořit účet zdarma / Přihlásit se)
  const heroRegisterBtn = document.getElementById('hero-register-btn');
  const heroLoginBtn    = document.getElementById('hero-login-btn');
  if (heroRegisterBtn) heroRegisterBtn.addEventListener('click', e => { e.preventDefault(); goWaitlist(); });
  if (heroLoginBtn)    heroLoginBtn.addEventListener('click',    e => { e.preventDefault(); openModal('login'); });

  // Escape key zavře modál
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModals();
  });

  // ─── Modal UI events ───
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModals(); });
  document.getElementById('login-close').addEventListener('click', closeModals);
  document.getElementById('register-close').addEventListener('click', closeModals);
  document.getElementById('switch-to-register').addEventListener('click', e => { e.preventDefault(); openModal('register'); });
  document.getElementById('switch-to-login').addEventListener('click', e => { e.preventDefault(); openModal('login'); });
  const regBackBtn = document.getElementById('reg-back');
  if (regBackBtn) regBackBtn.addEventListener('click', () => {
    if (regFromWaitlist) { closeModals(); openWaitlist(); }   // přišel z waitlistu → zpět na waitlist
    else showRegStep(1);
  });

  document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
      applyRole(card.dataset.role);
      showRegStep(2);
    });
  });

  // ─── Login form — stejná logika jako makej/src/app/(auth)/login/page.tsx ───
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();
    // Přístupový klíč — bez něj se dovnitř nedostaneš (viz komentář výš).
    if (!accessKeyOk()) {
      showError('login-error', ACCESS_LOCKED_MSG);
      return;
    }
    // Klíč prošel → poznač do session, ať /worker/ po přesměrování ví, že brána byla ověřena.
    try { sessionStorage.setItem('makej-gate-ok', ACCESS_KEY); } catch (e) {}

    const btn = document.getElementById('login-submit');
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    btn.disabled = true;
    btn.textContent = 'Přihlašování...';

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      showError('login-error',
        error.message === 'Invalid login credentials'
          ? 'Nesprávný email nebo heslo'
          : translateAuthError(error.message)
      );
      btn.disabled = false;
      btn.textContent = 'Přihlásit se';
    } else {
      closeModals();
    }
  });

  // ─── Zobrazit / skrýt heslo ───
  // Null-safe: některé stránky mají jednodušší modal bez všech pw-toggle tlačítek.
  function setupPwToggle(toggleId, inputId, iconId) {
    const toggle = document.getElementById(toggleId);
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const input = document.getElementById(inputId);
      const icon  = document.getElementById(iconId);
      if (!input) return;
      const show  = input.type === 'password';
      input.type  = show ? 'text' : 'password';
      if (icon) icon.setAttribute('icon', show ? 'solar:eye-closed-bold' : 'solar:eye-bold');
    });
  }
  setupPwToggle('reg-pw-toggle',  'reg-password',  'reg-pw-icon');
  setupPwToggle('reg-pw2-toggle', 'reg-password2', 'reg-pw2-icon');

  // ─── Register form — stejná logika jako makej/src/app/(auth)/register/page.tsx ───
  document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();
    const btn      = document.getElementById('register-submit');
    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;
    const company  = document.getElementById('reg-company').value.trim();
    const birth    = document.getElementById('reg-birth').value;  // 'YYYY-MM-DD'
    const gender   = document.getElementById('reg-gender').value; // 'zena'|'muz'|'jine'|''
    const kraj     = document.getElementById('reg-kraj').value;   // 'praha'|…

    if (!name) {
      showError('register-error', 'Zadejte své jméno.');
      return;
    }
    if (selectedRole === 'worker') {
      if (!birth) { showError('register-error', 'Zadej datum narození.'); return; }
      const bd = new Date(birth);
      const age = (Date.now() - bd.getTime()) / (365.25 * 24 * 3600 * 1000);
      if (isNaN(bd.getTime()) || bd > new Date() || age < 15 || age > 100) {
        showError('register-error', 'Zadej platné datum narození (min. 15 let).');
        return;
      }
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('register-error', 'Zadejte platný email.');
      return;
    }
    if (password.length < 6) {
      showError('register-error', 'Heslo musí mít alespoň 6 znaků.');
      return;
    }
    if (password !== password2) {
      showError('register-error', 'Hesla se neshodují. Zkontroluj je a zkus to znovu.');
      return;
    }
    if (!kraj) {
      showError('register-error', 'Vyber kraj.');
      return;
    }

    // Nepovinný marketingový souhlas (opt-in) — uloží se k účtu.
    const marketing = !!document.getElementById('reg-marketing')?.checked;

    btn.disabled = true;
    btn.textContent = 'Registrace...';

    // Registrace nesmí po signUp přesměrovat: když je v Supabase VYPNUTÉ potvrzování
    // e-mailu, signUp uživatele rovnou přihlásí → hodilo by ho to do (nedodělaného)
    // dashboardu. Proto redirect potlačíme a hned se odhlásíme.
    skipAutoRedirect = true;

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name,
          role: selectedRole,
          company_name: selectedRole === 'employer' ? company : null,
          birth_date: selectedRole === 'worker' ? birth : null,
          gender: selectedRole === 'worker' ? (gender || null) : null,
          kraj: kraj || null,
          marketing_consent: marketing,
        }
      }
    });

    if (error) {
      skipAutoRedirect = false;
      showError('register-error', translateAuthError(error.message));
      btn.disabled = false;
      btn.textContent = 'Vytvořit účet';
      return;
    }

    // Účet je v DB. Když je potvrzování e-mailu vypnuté, signUp nás rovnou přihlásil →
    // hned se odhlásíme, ať nikdo nespadne do nedodělaného dashboardu.
    let msg;
    if (data && data.session) {
      try { await sb.auth.signOut(); } catch (e) {}
      msg = 'Účet byl úspěšně založen! 🎉 Spouštíme 1. 10. — dáme ti vědět, jakmile bude hotovo.';
    } else {
      msg = 'Účet byl úspěšně založen! Zkontroluj e-mail pro potvrzení.';
    }
    skipAutoRedirect = false;

    closeModals();
    showToast(msg);
    btn.disabled = false;
    btn.textContent = 'Vytvořit účet';
  });

  // ─── Google OAuth — stejný provider jako v makej ───
  document.getElementById('login-google').addEventListener('click', async () => {
    // Přístupový klíč platí i pro Google login — ať není zadní vrátka.
    if (!accessKeyOk()) {
      showError('login-error', ACCESS_LOCKED_MSG);
      return;
    }
    // Klíč prošel → poznač do session i pro Google (redirect na /worker/ ho pak nechce znovu).
    try { sessionStorage.setItem('makej-gate-ok', ACCESS_KEY); } catch (e) {}
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    });
  });

  // ─── Auth state — Supabase v2 posílá INITIAL_SESSION při startu, getSession není potřeba ───
  sb.auth.onAuthStateChange((event, session) => {
    updateNavAuth(session?.user || null);

    // INITIAL_SESSION = obnova existující session při načtení stránky → nepřesměrovávat
    // SIGNED_IN = aktivní přihlášení (formulář / Google OAuth callback) → přesměrovat
    if (event === 'SIGNED_IN' && session?.user) {
      if (skipAutoRedirect) { skipAutoRedirect = false; return; }   // registrace se odhlásí sama
      const role = session.user.user_metadata?.role;
      window.location.href = role === 'employer' ? '/employer/' : '/worker/';
    }
  });

  // ═══════════ ČEKACÍ LIST (WAITLIST) — přeneseno z Makej-sro/Yasin ═══════════
  // Běží jen na stránce s overlayem (index.html); jinak se přeskočí.
  if (document.getElementById('wl-overlay')) {
  const wlOverlay   = document.getElementById('wl-overlay');
  const wlPanel     = document.getElementById('wl-panel');
  const wlCompanyGr = document.getElementById('wl-company-group');
  const wlPhoneGr   = document.getElementById('wl-phone-group');
  let   wlRole      = 'worker';
  let   wlDotBg     = null;   // canvasové tečkované pozadí (nastaví se níž)

  function openWaitlist() {
    if (!wlOverlay) return;
    document.body.style.overflow = 'hidden';
    wlOverlay.classList.add('active');
    wlOverlay.setAttribute('aria-hidden', 'false');
    if (wlDotBg) wlDotBg.start();
  }
  function closeWaitlist(dismissed) {
    if (!wlOverlay) return;
    wlOverlay.classList.remove('active');
    wlPanel.classList.remove('active');
    wlOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (wlDotBg) wlDotBg.stop();
    if (dismissed) { try { sessionStorage.setItem('wl-dismissed', '1'); } catch (e) {} }
  }
  function openWlForm(role) {
    wlRole = role;
    wlCompanyGr.style.display = role === 'employer' ? 'block' : 'none';
    wlPhoneGr.style.display   = role === 'employer' ? 'block' : 'none';
    document.getElementById('wl-form-title').textContent = 'Zapiš se na čekací list';
    document.getElementById('wl-form-sub').textContent =
      role === 'employer'
        ? 'Ozveme se vám na e-mail, jakmile 1. 10. spustíme.'
        : 'Ozveme se ti na e-mail, jakmile 1. 10. spustíme.';
    document.getElementById('wl-error').style.display = 'none';
    document.getElementById('wl-form-wrap').style.display = 'block';
    document.getElementById('wl-done').style.display = 'none';
    wlPanel.classList.add('active');
    setTimeout(() => { const n = document.getElementById('wl-name'); if (n) n.focus(); }, 60);
  }

  document.getElementById('wl-close').addEventListener('click', () => closeWaitlist(true));
  document.getElementById('wl-done-close').addEventListener('click', () => closeWaitlist(false));
  // Plovoucí tlačítko „Startujeme" (.wl-fab) — otevře čekací list i po zavření křížkem
  const wlFab = document.querySelector('.wl-fab');
  if (wlFab) {
    wlFab.addEventListener('click', () => openWaitlist());
    if (window.matchMedia('(max-width: 640px)').matches) {
      setTimeout(() => wlFab.classList.add('is-open'), 2000);
      setTimeout(() => wlFab.classList.remove('is-open'), 6000);
    }
  }
  document.getElementById('wl-back').addEventListener('click', () => wlPanel.classList.remove('active'));
  wlPanel.addEventListener('click', e => { if (e.target === wlPanel) wlPanel.classList.remove('active'); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (wlPanel.classList.contains('active')) wlPanel.classList.remove('active');
    else if (wlOverlay.classList.contains('active')) closeWaitlist(true);
  });

  // CTA na každé straně → zavři čekací list a otevři NORMÁLNÍ registraci
  // s danou rolí (brigádník / zaměstnavatel). Žádná separátní waitlist tabulka —
  // rovnou se zakládá reálný účet přes sb.auth.signUp (viz register-form výš).
  function wlGoRegister(role) {
    // Klikl na CTA → bereme to jako „viděl waitlist", ať ho popup příště neotravuje.
    try { localStorage.setItem('wl-joined', '1'); } catch (e) {}
    closeWaitlist(false);                      // zavři čekací list (bez „dismissed")
    openModal('register', role || 'worker');   // otevři registraci rovnou na kroku 2 s rolí
    regFromWaitlist = true;                     // „Zpět" pak vede na waitlist, ne na rozcestník
  }
  document.querySelectorAll('.wl-cta, .wl-cta-flip').forEach(btn => {
    btn.addEventListener('click', () => wlGoRegister(btn.dataset.wlRole));
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wlGoRegister(btn.dataset.wlRole); }
    });
  });

  // Tečkované pozadí (flow field) — PŘESNĚ podle staženého standalone exportu
  // z Claude designu (flow-field-background.html). Neviditelný proud ohýbá mřížku,
  // tečky modrají tam, kde běží nejrychleji; kurzor rozsvítí tečky ve svém kruhu.
  // Spouští se jen když je waitlist otevřený (šetří výkon), jinak 1:1.
  // Repel efekt kurzoru (dodaný kód) — tečky u kurzoru se plynule odsunou pryč a vrátí.
  var repel = (function () {
    var CFG = { radius: 50, maxOffset: 14, ease: 0.16 };
    var ox = new Float32Array(0), oy = new Float32Array(0);
    var mx = -9999, my = -9999, out = { dx: 0, dy: 0, heat: 0 };

    function resize(count) { ox = new Float32Array(count); oy = new Float32Array(count); }

    function attach() {
      window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
      window.addEventListener('mouseleave', function () { mx = -9999; my = -9999; });
    }

    // idx = index tečky, x/y = její domácí pozice
    function sample(idx, x, y) {
      var R = CFG.radius * 1.35, tx = 0, ty = 0, push = 0;
      if (mx > -9000) {
        var ddx = x - mx, ddy = y - my;
        var d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < R) {
          var f = 1 - d / R;
          f = f * f * (3 - 2 * f);            // smoothstep — plynulé, neodskočí
          push = f;
          var inv = d > 1 ? 1 / d : 1;
          tx = ddx * inv * f * CFG.maxOffset;
          ty = ddy * inv * f * CFG.maxOffset;
        }
      }
      ox[idx] += (tx - ox[idx]) * CFG.ease;   // odjede
      oy[idx] += (ty - oy[idx]) * CFG.ease;   // a stejně plynule zpět
      var off = Math.sqrt(ox[idx] * ox[idx] + oy[idx] * oy[idx]);
      out.dx = ox[idx]; out.dy = oy[idx];
      out.heat = Math.max(push, Math.min(1, off / CFG.maxOffset));
      return out;
    }

    return { config: CFG, resize: resize, attach: attach, sample: sample };
  })();

  wlDotBg = (function () {
    var canvas = document.getElementById('wl-dotbg');
    if (!canvas || !wlOverlay) return null;
    var CONFIG = {
      dotColor:    '#FFFFFF',
      accentColor: '#FFFFFF',
      spacing:     14,   // px mezi tečkami
      dotSize:     1.1,  // základní poloměr tečky v px
      speed:       1     // ambient flow: 1 = normál
    };

    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dots = [], t0 = performance.now();
    var raf = null, running = false;

    function hexToRgb(h) {
      var v = parseInt(String(h).replace('#', ''), 16);
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    }
    var DOT = hexToRgb(CONFIG.dotColor), ACC = hexToRgb(CONFIG.accentColor);

    var LEV = 10, COLORS = [];
    for (var l = 0; l < LEV; l++) {
      var k = l / (LEV - 1);
      COLORS.push('rgb(' + Math.round(DOT[0] + (ACC[0] - DOT[0]) * k) + ',' +
                           Math.round(DOT[1] + (ACC[1] - DOT[1]) * k) + ',' +
                           Math.round(DOT[2] + (ACC[2] - DOT[2]) * k) + ')');
    }

    function drawBuckets(bk, cols, aBoost) {
      aBoost = aBoost || 1;
      for (var lv = 0; lv < LEV; lv++) {
        var b = bk[lv];
        if (!b.length) continue;
        var kk = lv / (LEV - 1);
        var r = CONFIG.dotSize * (1 + kk * 0.7);
        ctx.fillStyle = cols[lv];
        ctx.globalAlpha = Math.min(1, (0.55 + kk * 0.45) * aBoost);
        ctx.beginPath();
        for (var n = 0; n < b.length; n += 2) {
          ctx.moveTo(b[n] + r, b[n + 1]);
          ctx.arc(b[n], b[n + 1], r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }

    function buildGrid() {
      var s = CONFIG.spacing;
      var cols = Math.ceil(W / s) + 1, rows = Math.ceil(H / s) + 1;
      var ox = (W - (cols - 1) * s) / 2, oy = (H - (rows - 1) * s) / 2;
      dots = [];
      for (var j = 0; j < rows; j++)
        for (var i = 0; i < cols; i++) dots.push(ox + i * s, oy + j * s);
      repel.resize(dots.length / 2);   // jeden offset na tečku
    }

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
    }

    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

    function draw() {
      var t = ((performance.now() - t0) / 1000) * CONFIG.speed;
      ctx.clearRect(0, 0, W, H);

      var buckets = [];
      for (var l = 0; l < LEV; l++) buckets.push([]);

      for (var i = 0; i < dots.length; i += 2) {
        var x = dots[i], y = dots[i + 1];

        // jemný ambient flow field (šum pozadí)
        var ang = Math.sin(x * 0.0048 + t * 0.28) * 1.7 + Math.cos(y * 0.0056 - t * 0.22) * 1.7;
        var mag = 7 + 6 * Math.sin(x * 0.003 + y * 0.0038 + t * 0.55);
        var e = clamp(0.5 + 0.5 * Math.sin(ang * 1.6 + t * 0.4) - 0.12);
        e = e * e;

        // repel u kurzoru — tečka uhne a heat ji zvýrazní
        var rp = repel.sample(i >> 1, x, y);

        var px = x + Math.cos(ang) * mag + rp.dx;
        var py = y + Math.sin(ang) * mag + rp.dy;

        buckets[Math.round(clamp(Math.max(e, rp.heat)) * (LEV - 1))].push(px, py);
      }

      drawBuckets(buckets, COLORS, 1.2);
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    repel.attach();   // myš sleduje repel modul (jednou)

    return {
      start: function () {
        if (running) return;
        running = true;
        t0 = performance.now();
        resize();
        window.addEventListener('resize', resize);
        raf = requestAnimationFrame(draw);
      },
      stop: function () {
        if (!running) return;
        running = false;
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        window.removeEventListener('resize', resize);
      }
    };
  })();

  // Přepínač brigádník / zaměstnavatel (jedna karta, segmented switch)
  (function () {
    const toggle = document.querySelector('.wl-toggle');
    if (!toggle) return;
    const opts = toggle.querySelectorAll('.wl-toggle-opt');
    const panels = document.querySelectorAll('[data-wl-panel]');
    function setTab(tab) {
      opts.forEach(o => o.classList.toggle('is-active', o.dataset.wlTab === tab));
      panels.forEach(p => { p.classList.toggle('is-off', p.dataset.wlPanel !== tab); });
      toggle.classList.toggle('is-employer', tab === 'employer');
      if (window.wlSetSocialRole) window.wlSetSocialRole(tab);
    }
    opts.forEach(o => o.addEventListener('click', () => setTab(o.dataset.wlTab)));
    window.wlSetTab = setTab;   // ať jde předvybrat roli při otevření z registračních tlačítek
  })();

  // Odpočet do spuštění (1. 10. 2026) — modrý pás s ubývajícími linkami
  (function () {
    const cdD = document.getElementById('wl-cd-d');
    if (!cdD) return;
    const TARGET = new Date('2026-10-01T09:00:00+02:00').getTime();
    const TOTAL_DAYS = 61;   // délka odpočtu ve dnech (jak plná je první linka)
    const pad = n => String(n).padStart(2, '0');
    const num = { h: document.getElementById('wl-cd-h'), m: document.getElementById('wl-cd-m'), s: document.getElementById('wl-cd-s') };
    const bar = { d: document.getElementById('wl-cd-bar-d'), h: document.getElementById('wl-cd-bar-h'), m: document.getElementById('wl-cd-bar-m'), s: document.getElementById('wl-cd-bar-s') };
    function tick() {
      const t = Math.max(0, Math.floor((TARGET - Date.now()) / 1000));
      const d = Math.floor(t / 86400);
      const h = Math.floor(t / 3600) % 24;
      const m = Math.floor(t / 60) % 60;
      const s = t % 60;
      cdD.textContent = d;
      num.h.textContent = pad(h);
      num.m.textContent = pad(m);
      num.s.textContent = pad(s);
      // linky: žádná transition — plynulost dělá častý přepočet (250 ms)
      if (bar.d) bar.d.style.width = (100 * d) / Math.max(1, TOTAL_DAYS) + '%';
      if (bar.h) bar.h.style.width = (100 * h) / 24 + '%';
      if (bar.m) bar.m.style.width = (100 * m) / 60 + '%';
      if (bar.s) bar.s.style.width = (100 * s) / 60 + '%';
    }
    tick();
    setInterval(tick, 250);
  })();

  // Sociální důkaz „Už se přihlásilo XX brigádníků / zaměstnavatelů".
  // POCTIVĚ: reálný počet účtů z DB podle role (žádný fejk). Řádka se ukáže,
  // až je registrací aspoň WL_SOCIAL_PRAH — do té doby se nechlubíme (schová se).
  (function () {
    const WL_SOCIAL_PRAH = 20;   // od kolika registrací řádku ukázat
    const wrapEl = document.querySelector('.wl-social');
    const numEl  = document.getElementById('wl-social-num');
    const nounEl = document.getElementById('wl-social-noun');
    if (!numEl || !wrapEl) return;

    const cache = {};            // role → počet (dotaz jen jednou za návštěvu)
    let current = 'worker';

    async function pocet(role) {
      if (cache[role] != null) return cache[role];
      try {
        const { count, error } = await sb
          .from('profiles').select('id', { count: 'exact', head: true }).eq('role', role);
        cache[role] = error ? 0 : (count || 0);
      } catch (e) { cache[role] = 0; }
      return cache[role];
    }

    async function render() {
      const role = current;
      const n = await pocet(role);
      if (role !== current) return;          // mezitím přepnul roli
      if (n >= WL_SOCIAL_PRAH) {
        numEl.textContent = n;
        if (nounEl) nounEl.textContent = role === 'employer' ? 'zaměstnavatelů' : 'brigádníků';
        wrapEl.style.display = '';
      } else {
        wrapEl.style.display = 'none';        // málo → radši nic než chabé číslo
      }
    }

    window.wlSetSocialRole = function (r) { current = r; render(); };
    wrapEl.style.display = 'none';            // schovej, než dojede dotaz (žádné bliknutí)
    render();
  })();

  // POZN.: Starý „čekací list" formulář (jméno + e-mail → tabulka `waitlist`) je
  // zrušený. CTA „Chci být u toho" teď vede rovnou na normální registraci
  // (viz wlGoRegister výš) → zakládá se reálný účet, žádná separátní waitlist
  // tabulka. Pojistka: kdyby se ten formulář v markupu přece jen odeslal,
  // přesměruj na registraci místo zápisu do DB.
  const _wlFormEl = document.getElementById('wl-form');
  if (_wlFormEl) {
    _wlFormEl.addEventListener('submit', e => {
      e.preventDefault();
      wlGoRegister(wlRole);
    });
  }

  // PRODUKCE: popup vyskočí reálným uživatelům jen jednou (viz větev níž).
  //   Na testování se dá vynutit vždy přes ?wl v adrese (…/index.html?wl).
  //   Na vývoj se dá dočasně přepnout na true (popup po každém refreshi).
  const WL_DEV_ALWAYS = false;

  // Auto-otevření po načtení — ne když už je zapsán/zavřel to, nebo je přihlášený
  const wlForce  = (() => { try { return new URLSearchParams(location.search).has('wl'); } catch (e) { return false; } })();
  const wlSeen   = (() => { try { return localStorage.getItem('wl-joined') || sessionStorage.getItem('wl-dismissed'); } catch (e) { return null; } })();
  const wlLogged = (() => { try { return !!localStorage.getItem('makej-auth'); } catch (e) { return false; } })();
  if (WL_DEV_ALWAYS || wlForce) {
    setTimeout(() => {                          // dev / ?wl v adrese = vždy ukázat
      openWaitlist();
      try { const r = new URLSearchParams(location.search).get('role'); if (r && window.wlSetTab) window.wlSetTab(r); } catch (e) {}
    }, 300);
  } else if (!wlSeen && !wlLogged) {
    // Nevyskakovat hned po načtení — ať si návštěvník stránku nejdřív prohlédne.
    // Popup přijde, až projeví zájem: doscrolluje pod hero, nebo po 25 s na stránce.
    // Pořád platí, že se ukáže jen jednou (wl-joined / wl-dismissed výš).
    let wlFired = false;
    const wlOpenOnce = () => {
      if (wlFired) return;
      wlFired = true;
      window.removeEventListener('scroll', wlOnScroll);
      clearTimeout(wlTimer);
      openWaitlist();
    };
    const wlOnScroll = () => { if (window.scrollY > window.innerHeight * 0.6) wlOpenOnce(); };
    const wlTimer = setTimeout(wlOpenOnce, 25000);
    window.addEventListener('scroll', wlOnScroll, { passive: true });
  }
  }
}

function translateAuthError(msg) {
  if (msg.includes('Invalid login credentials'))   return 'Nesprávný email nebo heslo.';
  if (msg.includes('missing') && (msg.includes('email') || msg.includes('phone'))) return 'Zadejte email a heslo.';
  if (msg.includes('Email not confirmed'))          return 'Nejdřív potvrď svůj email.';
  if (msg.includes('User already registered'))      return 'Tento email je již zaregistrovaný.';
  if (msg.includes('already been registered'))      return 'Tento email je již zaregistrovaný.';
  if (msg.includes('Password should be at least'))  return 'Heslo musí mít alespoň 6 znaků.';
  if (msg.includes('rate limit'))                   return 'Příliš mnoho pokusů, zkus to za chvíli.';
  if (msg.includes('invalid') && msg.includes('email')) return 'Zadejte platný email.';
  if (msg.includes('Email address') && msg.includes('invalid')) return 'Zadejte platný email.';
  if (msg.includes('Signup is disabled'))           return 'Registrace je momentálně nedostupná.';
  if (msg.includes('over_email_send_rate_limit'))   return 'Příliš mnoho emailů, zkus to za chvíli.';
  return msg;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'auth-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 4500);
}

// ═══════════ COOKIE CONSENT BANNER ═══════════
(function () {
  const COOKIE_KEY = 'makej-cookie-consent';
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  // Pokud uživatel už rozhodl, nezobrazuj banner
  if (localStorage.getItem(COOKIE_KEY)) return;

  // Zobraz banner s malým zpožděním (po načtení stránky)
  setTimeout(() => banner.classList.add('visible'), 800);

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    if (window.gtag) gtag('consent', 'update', { analytics_storage: 'granted' });
    banner.classList.remove('visible');
  });

  document.getElementById('cookie-reject').addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'rejected');
    if (window.gtag) gtag('consent', 'update', { analytics_storage: 'denied' });
    banner.classList.remove('visible');
  });
})();

// ═══════════ PEEKER (cursor-tracking face in login modal) ═══════════
(function() {
  var peeker = document.getElementById('main-peeker');
  var eyeL   = document.getElementById('main-eyeL');
  var eyeR   = document.getElementById('main-eyeR');
  var pupilL = document.getElementById('main-pupilL');
  var pupilR = document.getElementById('main-pupilR');
  var browL  = document.getElementById('main-browL');
  var browR  = document.getElementById('main-browR');
  var lidL   = document.getElementById('main-lidL');
  var lidR   = document.getElementById('main-lidR');
  if (!peeker) return;

  var isPwd = false;
  var blinkTimer = null;
  var peekTimers = [];

  function movePupil(pupilEl, eyeEl, mx, my) {
    var rect = eyeEl.getBoundingClientRect();
    if (!rect.width) return;
    var cx = rect.left + rect.width  / 2;
    var cy = rect.top  + rect.height / 2;
    var dx = mx - cx, dy = my - cy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var r = 4.5;
    var s = Math.min(dist, r) / Math.max(dist, 0.001);
    pupilEl.style.transform = 'translate(' + (dx * s).toFixed(2) + 'px,' + (dy * s).toFixed(2) + 'px)';
  }

  document.addEventListener('mousemove', function(e) {
    if (!peeker || peeker.offsetParent === null) return;
    movePupil(pupilL, eyeL, e.clientX, e.clientY);
    movePupil(pupilR, eyeR, e.clientX, e.clientY);
  });

  function setLid(speed) {
    if (!lidL || !lidR) return;
    lidL.style.transition = 'height ' + speed + ' ease';
    lidR.style.transition = 'height ' + speed + ' ease';
  }

  function scheduleBlink() {
    blinkTimer = setTimeout(function() {
      if (isPwd) return;
      setLid('0.08s');
      lidL.style.height = '21px'; lidR.style.height = '21px';
      setTimeout(function() {
        lidL.style.height = '0'; lidR.style.height = '0';
        setTimeout(function() { setLid('0.28s'); scheduleBlink(); }, 120);
      }, 100);
    }, 5000);
  }

  function clearPeekTimers() { peekTimers.forEach(clearTimeout); peekTimers = []; }

  function schedulePeek() {
    peekTimers.push(setTimeout(function() {
      lidR.style.height = '11px';
      peekTimers.push(setTimeout(function() {
        lidR.style.height = '21px';
        peekTimers.push(setTimeout(schedulePeek, 5000));
      }, 1000));
    }, 3000));
  }

  function peekAtPassword() {
    isPwd = true;
    peeker.style.animation = 'none';
    clearTimeout(blinkTimer);
    clearPeekTimers();
    peeker.style.transform = 'translateX(-50%)';
    setLid('0.28s');
    lidL.style.height = '21px'; lidR.style.height = '21px';
    browL.style.transform = 'translateY(5px)';
    browR.style.transform = 'translateY(5px)';
    schedulePeek();
  }

  function stopPeeking() {
    isPwd = false;
    clearPeekTimers();
    peeker.style.animation = 'none';
    peeker.style.transform = 'translateX(-50%)';
    setLid('0.28s');
    lidL.style.height = '0'; lidR.style.height = '0';
    browL.style.transform = ''; browR.style.transform = '';
    scheduleBlink();
  }

  var pwdField = document.getElementById('login-password');
  if (pwdField) {
    pwdField.addEventListener('focus', peekAtPassword);
    pwdField.addEventListener('blur',  stopPeeking);
  }

  scheduleBlink();
})();

/* ── Showcase toggle: switch between the interactive phone and the feature grid ── */
(function () {
  var toggle = document.getElementById('showcase-toggle');
  var stage  = document.querySelector('.showcase-stage');
  if (!toggle || !stage) return;

  var btns  = toggle.querySelectorAll('.sct-btn');
  var views = stage.querySelectorAll('.showcase-view');

  function setView(view) {
    toggle.setAttribute('data-active', view);
    btns.forEach(function (b) {
      var on = b.getAttribute('data-view') === view;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    views.forEach(function (v) {
      v.classList.toggle('is-active', v.getAttribute('data-view') === view);
    });
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () { setView(b.getAttribute('data-view')); });
  });
})();


/* ═══════════ MAKÁČI CAROUSEL ═══════════ */
(function () {
  var N = 8;
  var center = 2; // Makač basic starts in center
  var wrappers = Array.from(document.querySelectorAll('.makac-wrap[data-makac]'));
  var dots = Array.from(document.querySelectorAll('.makaci-dot[data-dot]'));
  var timer;

  if (!wrappers.length) return;

  function getPos(i) {
    var diff = ((i - center) % N + N) % N;
    if (diff > 2) diff -= N;
    return diff;
  }

  function update() {
    wrappers.forEach(function (el, i) {
      var oldPos = parseInt(el.getAttribute('data-pos') || '99');
      var newPos = getPos(i);

      // Both off-screen — teleport instantly to avoid cross-screen animation
      if (Math.abs(oldPos) >= 2 && Math.abs(newPos) >= 2 && oldPos !== newPos) {
        el.classList.add('no-transition');
        el.setAttribute('data-pos', newPos);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            el.classList.remove('no-transition');
          });
        });
      } else {
        el.setAttribute('data-pos', newPos);
      }
    });

    dots.forEach(function (d) {
      d.classList.toggle('active', parseInt(d.getAttribute('data-dot')) === center);
    });
  }

  function rotate() {
    center = (center + 1) % N;
    update();
  }

  function startTimer() {
    clearInterval(timer);
    timer = setInterval(rotate, 5000);
  }

  // Click dot to jump to character
  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      center = parseInt(d.getAttribute('data-dot'));
      update();
      startTimer();
    });
  });

  // Click side characters to bring them to center
  wrappers.forEach(function (el) {
    el.addEventListener('click', function () {
      var pos = parseInt(el.getAttribute('data-pos') || '0');
      if (pos !== 0) {
        center = (center + pos + N) % N;
        update();
        startTimer();
      }
    });
  });

  update();
  startTimer();
})();


/* ═══════════ REFERENCE — kroužkový sešit s listováním (z Yasin/recenze) ═══════════ */
(function () {
  var reviews = [
    { text: 'Těším se, až to vyjde!', name: 'Šimon V.', role: '', date: '29. 7. 2026', photo: '' },
    { text: 'Moc se těším, až si na Makej najdu brigádu.', name: 'David V.', role: '', date: '27. 7. 2026', photo: '' },
    { text: 'Vypadá to suprově!', name: 'Samuel P.', role: '', date: '24. 7. 2026', photo: '' },
    { text: 'Posílám nezaměstnaným kamarádům.', name: 'Jan W.', role: '', date: '21. 7. 2026', photo: '' },
    { text: 'Budu konečně makat ve stylu!', name: 'Yasin B.', role: '', date: '18. 7. 2026', photo: '' },
  ];

  var stack = document.getElementById('ref-stack');
  if (!stack) return;

  function fill(cardEl, r) {
    cardEl.querySelector('.ref-name').textContent = r.name;
    cardEl.querySelector('.ref-meta').textContent = r.role ? r.role + ' · ' + r.date : r.date;
    cardEl.querySelector('.ref-text').textContent = r.text;
  }

  var VISIBLE = Math.min(3, reviews.length);
  var nodes = [];
  for (var k = 0; k < VISIBLE; k++) {
    var c = document.createElement('div');
    c.className = 'rs-card';
    c.dataset.slot = k;
    c.innerHTML = '<div class="ref-name"></div><div class="ref-meta"></div><p class="ref-text"></p>';
    fill(c, reviews[k]);
    nodes.push(c);
    stack.appendChild(c);
  }

  var nextRev = VISIBLE % reviews.length;
  var busy = false, timer, paused = false;

  function nodeAtSlot(s) {
    for (var n = 0; n < nodes.length; n++) if (+nodes[n].dataset.slot === s) return nodes[n];
    return null;
  }

  function advance() {
    if (busy || reviews.length <= 1) return;
    busy = true;
    clearInterval(timer);

    var leaving = nodeAtSlot(0);
    for (var s = 1; s < VISIBLE; s++) {
      var nd = nodeAtSlot(s);
      if (nd) nd.dataset.slot = s - 1;
    }
    leaving.classList.add('leaving');

    setTimeout(function () {
      fill(leaving, reviews[nextRev]);
      nextRev = (nextRev + 1) % reviews.length;
      leaving.dataset.slot = VISIBLE - 1;
      leaving.classList.remove('leaving');
      setTimeout(function () { busy = false; startTimer(); }, 720);
    }, 540);
  }

  function startTimer() { clearInterval(timer); if (!paused) timer = setInterval(advance, 3500); }

  // Najetí myší (bez kliku) pozastaví listování, odjetí ho zase spustí.
  stack.addEventListener('mouseenter', function () { paused = true; clearInterval(timer); });
  stack.addEventListener('mouseleave', function () { paused = false; startTimer(); });
  // Klik = posun na další + pokračuj dál (i když na kartě zůstane kurzor).
  stack.addEventListener('click', function () { if (!busy) { paused = false; advance(); } });

  startTimer();
})();

/* ═══════════ Scroll-driven kreslení spojnice „jak to funguje" (bolt-path) ═══════════ */
/* Čára se postupně prodlužuje podle toho, jak uživatel scrolluje sekcí — jde s ním
   a dovede ho až k „Vytvořit účet". Funguje na /hledam-si-praci i /pro-zamestnavatele. */
(function () {
  var svg = document.querySelector('.bolt-path');
  if (!svg) return;
  var path = svg.querySelector('path');
  var journey = svg.closest('.bolt-journey');
  if (!path || !journey) return;

  // Plná (nepřerušovaná) čára, která se s posunem odkrývá: jeden dash o délce
  // celé dráhy + offset. Délku bereme z getTotalLength (kvůli non-scaling-stroke
  // se čárkování měří v reálné délce dráhy, ne v normalizované).
  var L = path.getTotalLength();
  path.style.strokeDasharray = L;
  path.style.strokeDashoffset = L;
  // Bez transition: update běží na rAF (frame-synced se scrollem), takže čára sleduje
  // posun přesně. Dřívější .12s transition dobíhala scroll → u tlačítka dole to poskakovalo.

  var ticking = false;
  function update() {
    ticking = false;
    var rect = journey.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    // Kreslit začne, když vršek sekce projde ~88 % výšky okna, a dokreslí se,
    // než spodek sekce vyjede nad ~40 % okna.
    var start = vh * 0.88;
    var span = rect.height + vh * 0.48;
    var p = (start - rect.top) / span;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    path.style.strokeDashoffset = L * (1 - p);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
