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
    '.section-header', '.cn-plan', '.yp-head', '.soon-card',
    '.bolt-head', '.bolt-text',
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
        if (el) el.addEventListener('click', e => {
          e.preventDefault();
          type === 'register' ? goToEmailSignup() : openModal(type);
        });
      });

      // Hero CTA: show auth buttons, hide dashboard/worker
      if (heroCTAAuth)     heroCTAAuth.style.display     = 'flex';
      if (heroCTALoggedin) heroCTALoggedin.style.display = 'none';
    }
  }

  // Appka ještě neběží, takže „Vytvořit účet" nevede na registraci, ale na sběr
  // e-mailů v sekci #brzy. Na hlavní stránce doscrolluje a zaostří pole,
  // odjinud přesměruje na /#brzy (sekce je jen na homepage).
  function goToEmailSignup() {
    closeModals();
    const sec = document.getElementById('brzy');
    if (!sec) { window.location.href = '/#brzy'; return; }
    sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = sec.querySelector('.soon-input');
    if (input) setTimeout(() => input.focus({ preventScroll: true }), 650);
  }

  // ─── Statická tlačítka (nejsou nikdy přepisována) — bindujeme jen jednou ───
  document.querySelectorAll('.employer-cta-register').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); goToEmailSignup(); });
  });
  document.querySelectorAll('.worker-cta-register').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); goToEmailSignup(); });
  });

  // Hero CTA buttons (Vytvořit účet zdarma / Přihlásit se)
  const heroRegisterBtn = document.getElementById('hero-register-btn');
  const heroLoginBtn    = document.getElementById('hero-login-btn');
  if (heroRegisterBtn) heroRegisterBtn.addEventListener('click', e => { e.preventDefault(); goToEmailSignup(); });
  if (heroLoginBtn)    heroLoginBtn.addEventListener('click',    e => { e.preventDefault(); openModal('login'); });

  // Escape key zavře modál
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModals();
  });

  // ─── Modal UI events ───
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModals(); });
  document.getElementById('login-close').addEventListener('click', closeModals);
  document.getElementById('register-close').addEventListener('click', closeModals);
  document.getElementById('switch-to-register').addEventListener('click', e => { e.preventDefault(); goToEmailSignup(); });
  document.getElementById('switch-to-login').addEventListener('click', e => { e.preventDefault(); openModal('login'); });
  const regBackBtn = document.getElementById('reg-back');
  if (regBackBtn) regBackBtn.addEventListener('click', () => {
    showRegStep(1);
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


/* ═══════════ REFERENCE — galerie recenzí (styl sekce Lidé) ═══════════ */
(function () {
  var wrap = document.getElementById('ref-cards');
  if (!wrap) return;

  var reviews = [
    { text: 'Těším se, až to vyjde!', name: 'Šimon V.', date: '29. 7. 2026', stars: 5 },
    { text: 'Moc se těším, až si na Makej najdu brigádu.', name: 'David V.', date: '27. 7. 2026', stars: 5 },
    { text: 'Vypadá to suprově!', name: 'Samuel P.', date: '24. 7. 2026', stars: 5 },
    { text: 'Posílám nezaměstnaným kamarádům.', name: 'Jan W.', date: '21. 7. 2026', stars: 5 },
    { text: 'Budu konečně makat ve stylu!', name: 'Yasin B.', date: '18. 7. 2026', stars: 5 },
  ];

  var cards = Array.prototype.slice.call(wrap.querySelectorAll('.ref-card'));
  if (!cards.length || reviews.length <= cards.length) return;

  function fill(card, r) {
    var st = card.querySelector('.ref-stars');
    st.innerHTML = new Array(r.stars + 1).join('<i></i>');
    st.setAttribute('aria-label', 'Hodnocení ' + r.stars + ' z 5');
    card.querySelector('.ref-text').textContent = r.text;
    card.querySelector('.ref-name').textContent = r.name;
    card.querySelector('.ref-meta').textContent = r.date;
  }

  // V HTML jsou napevno první tři recenze (kvůli SEO a běhu bez JS). `shown` drží,
  // která recenze je v které kartě — odvodí se z DOM, takže to sedí i po přepsání HTML.
  var shown = cards.map(function (card, i) {
    var t = (card.querySelector('.ref-text').textContent || '').trim();
    for (var k = 0; k < reviews.length; k++) if (reviews[k].text === t) return k;
    return i % reviews.length;
  });

  var next = 0, turn = 0, timer = null, visible = false, hovered = null;

  // Vybere první nezobrazenou recenzi od `next` dál → nikdy nemůžou být dvě stejné
  // vedle sebe (ani ta samá znovu v té stejné kartě). Recenzí je víc než karet,
  // takže se vždycky nějaká volná najde.
  function pickReview() {
    for (var step = 0; step < reviews.length; step++) {
      var idx = (next + step) % reviews.length;
      if (shown.indexOf(idx) === -1) { next = (idx + 1) % reviews.length; return idx; }
    }
    return -1;
  }

  // Karta odletí nahoru (jako odswajpnutá), nová recenze přiletí zespoda.
  function swap() {
    // Přeskoč kartu, na které zrovna leží kurzor — ať se text nemění pod rukama.
    var ci = -1;
    for (var i = 0; i < cards.length; i++) {
      var c = turn++ % cards.length;
      if (cards[c] !== hovered) { ci = c; break; }
    }
    if (ci < 0) return;

    var idx = pickReview();
    if (idx < 0) return;

    var card = cards[ci], r = reviews[idx];
    shown[ci] = idx;

    card.classList.add('swapping');
    setTimeout(function () {
      fill(card, r);
      card.classList.remove('swapping');
      card.classList.add('swap-in');
      setTimeout(function () { card.classList.remove('swap-in'); }, 620);
    }, 340);
  }

  function start() {
    if (timer || !visible) return;
    // První výměna přijde brzy po najetí sekce — ať je hned vidět, že se recenze střídají.
    timer = setTimeout(function () {
      swap();
      timer = setInterval(swap, 3000);
    }, 1500);
  }
  function stop() { clearTimeout(timer); clearInterval(timer); timer = null; }

  cards.forEach(function (c) {
    c.addEventListener('mouseenter', function () { hovered = c; });
    c.addEventListener('mouseleave', function () { if (hovered === c) hovered = null; });
  });

  // Střídá se jen když je sekce na obrazovce.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0.15 }).observe(wrap);
  } else {
    visible = true; start();
  }
})();

/* Scroll-reveal galerie recenzí — boční karty přijedou zespoda, prostřední „popne" */
(function () {
  var els = document.querySelectorAll('.js-ref-up, .js-ref-pop, .js-ref-word');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(els, function (e) { e.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  Array.prototype.forEach.call(els, function (e) { io.observe(e); });
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

/* ═══════════════════════════════════════════════════════════════════════════
   HERO — poslední slovo se přepisuje (swajp → klik → dotek)

   Přepis nejde po písmenech jako psaní na stroji, ale výměnou: stará písmena
   po řadě vyblednou a odletí nahoru, nová přiletí zdola. Kontejner k tomu
   plynule přejíždí na šířku nového slova — tu měříme neviditelnou kopií
   dopředu, protože při výměně už v DOM žádné celé slovo není. Tečka sedí až
   za kontejnerem, takže se veze na jeho šířce a jen se posune za slovem.

   Slovo se nikdy nesmí rozlomit ani spadnout pod řádek: proto nowrap a proto
   měříme až po `document.fonts.ready` (v náhradním fontu vyjdou jiná čísla).
   ═══════════════════════════════════════════════════════════════════════════ */
(function heroTyper() {
  const box  = document.getElementById('hero-typer');
  const slot = document.getElementById('typer-word');
  if (!box || !slot) return;

  const SLOVA   = ['swajp', 'klik', 'dotek'];   // tečka je v HTML za boxem, nevyměňuje se
  const KROK    = 28;    // ms mezi písmeny (vlnka)
  const ODCHOD  = 260;   // ms než staré písmeno zmizí — drží se .typer-char v CSS
  const PRICHOD = 420;   // ms než nové doletí — taky z CSS
  const DRZENI  = 2000;  // jak dlouho slovo stojí, než se vymění (celý cyklus ≈ 2,5 s)
  const START   = 1000;  // nechat dojet odhalení nadpisu (mkMask, hotová v 1,1 s od loadu)

  const h1 = box.closest('.hero-h1');
  const bezPohybu = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Odhalovací maska nadpisu (mkMask) dojede v 1,1 s. Sundat ji musíme hned pak:
  // písmena vylétávající nahoru přesahují nad výšku řádku a do té doby by je
  // overflow:hidden / clip-path ořezával.
  if (h1) setTimeout(() => h1.classList.add('mk-hotovo'), 1200);

  // Měřicí kopie: neviditelná, mimo tok, takže nic neposouvá.
  const merak = document.createElement('span');
  merak.className = 'typer-measure';
  merak.setAttribute('aria-hidden', 'true');
  box.appendChild(merak);

  let i = 0;

  // Měřák skládá slovo ze stejných boxů jako ostrá verze. Kdyby měřil slovo
  // jako jeden text, započítal by kerning mezi dvojicemi písmen — ten se ale
  // rozpadem na samostatné spany ztrácí a šířka by vyšla o kus jinak.
  function sirka(text) {
    merak.textContent = '';
    const radka = document.createElement('span');
    radka.className = 'typer-word';
    [...text].forEach(znak => {
      const s = document.createElement('span');
      s.className = 'typer-char';
      s.textContent = znak;
      radka.appendChild(s);
    });
    merak.appendChild(radka);
    box.style.width = radka.getBoundingClientRect().width + 'px';
  }

  function vykresli(text, animovat) {
    slot.textContent = '';
    [...text].forEach((znak, idx) => {
      const s = document.createElement('span');
      s.className = 'typer-char' + (animovat ? ' je-prichod' : '');
      s.textContent = znak;
      s.style.transitionDelay = animovat ? idx * KROK + 'ms' : '0ms';
      slot.appendChild(s);
    });
    // Dva rámce: první nechá prohlížeč uložit počáteční stav, druhý ho pustí.
    // Bez toho by se třída sundala dřív, než vznikne co animovat.
    if (animovat) requestAnimationFrame(() => requestAnimationFrame(() => {
      slot.querySelectorAll('.typer-char').forEach(s => s.classList.remove('je-prichod'));
    }));
  }

  function vymen(dalsi) {
    const znaky = [...slot.querySelectorAll('.typer-char')];
    znaky.forEach((s, idx) => {
      s.style.transitionDelay = idx * KROK + 'ms';
      s.classList.add('je-odchod');
    });
    sirka(dalsi);          // šířka jede souběžně s odchodem, ne až po něm
    const az = ODCHOD + znaky.length * KROK * 0.5;
    setTimeout(() => vykresli(dalsi, true), az);
    return az;
  }

  function cyklus() {
    setTimeout(() => {
      i = (i + 1) % SLOVA.length;
      const az = vymen(SLOVA[i]);
      setTimeout(cyklus, az + PRICHOD * 0.4);
    }, DRZENI);
  }

  function spust() {
    sirka(SLOVA[0]);
    vykresli(SLOVA[0], false);
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => sirka(SLOVA[i]), 150);
    });
    if (!bezPohybu) cyklus();
  }

  const pripraveno = (document.fonts && document.fonts.ready)
    ? document.fonts.ready.catch(() => {})
    : Promise.resolve();
  pripraveno.then(() => setTimeout(spust, START));
})();

/* ═══════════ BRZY SPOUŠTÍME — sběr e-mailů ═══════════
   Nahrazuje zrušený dvourolový čekací list. Ukládá se jen e-mail, a to přes RPC
   join_launch_list (SECURITY DEFINER) — tabulka launch_emails nemá žádnou RLS
   policy, takže z webu z ní nejde nic přečíst ani vyjmenovat. Opakované
   přihlášení stejné adresy projde tiše (on conflict do nothing v DB).
   Voláno přes fetch, ne přes supabase.createClient: druhý klient se stejným
   storageKey hlásí konflikt instancí GoTrue a pro jedno RPC ho není potřeba. */
(function launchEmails() {
  const form = document.querySelector('.soon-form');
  if (!form) return;
  const input = form.querySelector('.soon-input');
  const btn   = form.querySelector('.soon-btn');
  const msg   = document.getElementById('soon-msg');
  if (!input || !btn) return;

  function stav(text, druh) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'soon-msg' + (druh ? ' is-' + druh : '');
  }

  async function odesli() {
    const email = (input.value || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      stav('Zkontroluj prosím tvar e-mailu.', 'err');
      input.focus();
      return;
    }

    btn.disabled = true;
    stav('Odesílám…', '');

    try {
      const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/join_launch_list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ p_email: email, p_source: 'landing' })
      });
      if (!r.ok) throw new Error(await r.text());

      input.value = '';
      stav('Hotovo! Ozveme se ti na e-mail, jakmile spustíme.', 'ok');
    } catch (e) {
      console.error('[launch-emails]', e);
      stav('Nepovedlo se odeslat. Zkus to prosím za chvíli znovu.', 'err');
    } finally {
      btn.disabled = false;   // text nepřepisujeme — smazalo by to i SVG šipku uvnitř
    }
  }

  btn.addEventListener('click', odesli);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); odesli(); } });
  input.addEventListener('input', () => { if (msg && msg.textContent) stav('', ''); });
})();
