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
    'pro-zamestnavatele.html': [
      ['Jak to funguje', '/pro-zamestnavatele.html#jak-to-funguje'],
      ['Dashboard',      '/pro-zamestnavatele.html#dashboard'],
      ['Ceník',          '/pro-zamestnavatele.html#pricing'],
      ['Časté dotazy',   '/pro-zamestnavatele.html#faq'],
    ],
    'hledam-si-praci.html': [
      ['Jak to funguje', '/hledam-si-praci.html#how-it-works'],
      ['Vyzkoušej appku','/hledam-si-praci.html#features'],
      ['Stáhnout',       '/hledam-si-praci.html#download'],
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
setupNavDropdowns();

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
const menuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
menuBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('active');
});
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('active'));
});

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
  const revealElements = document.querySelectorAll(
    '.step-card, .feature-card, .testimonial-card, .download-card, .section-header, .cn-plan'
  );
  revealElements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

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

// ═══════════ INIT ═══════════
document.addEventListener('DOMContentLoaded', () => {
  setupReveal();
  initAuth();
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
      if (role) {
        applyRole(role);
        showRegStep(2);
      } else {
        showRegStep(1);
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
    document.getElementById('reg-role-subtitle').textContent =
      role === 'worker' ? 'Brigádník' : 'Zaměstnavatel';
    document.getElementById('reg-company-group').style.display =
      role === 'employer' ? 'block' : 'none';
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
        <span class="nav-user-greeting">Ahoj, ${name}!</span>
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
      navActions.innerHTML = `
        <a href="javascript:void(0)" class="btn-ghost" id="nav-login-btn">Přihlásit se</a>
        <a href="javascript:void(0)" class="btn-primary" id="nav-register-btn">Vytvořit účet</a>
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
        if (el) el.addEventListener('click', e => { e.preventDefault(); openModal(type); });
      });

      // Hero CTA: show auth buttons, hide dashboard/worker
      if (heroCTAAuth)     heroCTAAuth.style.display     = 'flex';
      if (heroCTALoggedin) heroCTALoggedin.style.display = 'none';
    }
  }

  // ─── Statická tlačítka (nejsou nikdy přepisována) — bindujeme jen jednou ───
  document.querySelectorAll('.employer-cta-register').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); openModal('register', 'employer'); });
  });
  document.querySelectorAll('.worker-cta-register').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); openModal('register', 'worker'); });
  });

  // Hero CTA buttons (Vytvořit účet zdarma / Přihlásit se)
  const heroRegisterBtn = document.getElementById('hero-register-btn');
  const heroLoginBtn    = document.getElementById('hero-login-btn');
  if (heroRegisterBtn) heroRegisterBtn.addEventListener('click', e => { e.preventDefault(); openModal('register'); });
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
  document.getElementById('reg-back').addEventListener('click', () => showRegStep(1));

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
  function setupPwToggle(toggleId, inputId, iconId) {
    document.getElementById(toggleId).addEventListener('click', () => {
      const input = document.getElementById(inputId);
      const icon  = document.getElementById(iconId);
      const show  = input.type === 'password';
      input.type  = show ? 'text' : 'password';
      icon.setAttribute('icon', show ? 'solar:eye-closed-bold' : 'solar:eye-bold');
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

    if (!name) {
      showError('register-error', 'Zadejte své jméno.');
      return;
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

    btn.disabled = true;
    btn.textContent = 'Registrace...';

    const { error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: selectedRole,
          company_name: selectedRole === 'employer' ? company : null,
        }
      }
    });

    if (error) {
      showError('register-error', translateAuthError(error.message));
      btn.disabled = false;
      btn.textContent = 'Vytvořit účet';
    } else {
      closeModals();
      showToast('Registrace proběhla! Zkontroluj svůj email pro potvrzení.');
    }
  });

  // ─── Google OAuth — stejný provider jako v makej ───
  document.getElementById('login-google').addEventListener('click', async () => {
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
    banner.classList.remove('visible');
  });

  document.getElementById('cookie-reject').addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'rejected');
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

