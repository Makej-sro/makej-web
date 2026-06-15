// Makej — Employer side data + shared design tokens
// Reuses T, Icon, fmtKc from app.jsx

const ECOMPANY = {
  name: 'Kafe Punkt',
  logo: 'KP',
  logoColor: '#F4A261',
  plan: 'Premium',
  city: 'Brno',
  team: 'Anna · Petr · Michal',
};

// Raw profile row from Supabase — mutated in-place by employer-supabase.jsx
const EPROFILE = {};

const E_KPIS = [
  { id: 'views', label: 'Zhlédnutí', value: 12_847, delta: +18.4, spark: [12,18,15,22,19,28,24,31,29,35,33,40], unit: '', icon: 'eye-bold' },
  { id: 'right', label: 'Swajp right rate', value: 24.6, delta: +3.2, spark: [18,19,20,22,21,24,23,25,24,26,25,24.6], unit: '%', icon: 'heart-bold' },
  { id: 'matches', label: 'Matche', value: 312, delta: +12.1, spark: [10,12,18,22,28,32,35,40,42,48,52,55], unit: '', icon: 'users-group-rounded-bold' },
  { id: 'tth', label: 'Time-to-hire', value: 2.1, delta: -0.6, spark: [4.2, 4, 3.6, 3.4, 3.1, 2.9, 2.7, 2.5, 2.4, 2.3, 2.2, 2.1], unit: ' dne', icon: 'stopwatch-bold' },
  { id: 'cph', label: 'Cost per hire', value: 480, delta: -8.2, spark: [620, 600, 590, 575, 560, 540, 520, 510, 500, 495, 488, 480], unit: ' Kč', icon: 'dollar-bold' },
  { id: 'rating', label: 'Hodnocení firmy', value: 4.8, delta: +0.1, spark: [4.5,4.5,4.6,4.6,4.6,4.7,4.7,4.7,4.8,4.8,4.8,4.8], unit: '★', icon: 'star-bold' },
];


const E_JOBS = [
  { id: 'ej1', title: 'Barista do specialty kavárny', status: 'active', plan: 'Premium · Top', views: 4_280, swipes: 1_120, matches: 142, hired: 18, ctr: 26.1, daysLeft: 5, pay: 180, payUnit: 'Kč/h', accent: '#F4A261' },
  { id: 'ej2', title: 'Servírka — víkendová směna', status: 'active', plan: 'Standard', views: 2_140, swipes: 380, matches: 41, hired: 6, ctr: 17.8, daysLeft: 12, pay: 165, payUnit: 'Kč/h', accent: '#8AB4FF' },
  { id: 'ej3', title: 'Pomocník do kuchyně — ASAP', status: 'urgent', plan: 'ASAP · Boost', views: 3_910, swipes: 940, matches: 98, hired: 11, ctr: 24.0, daysLeft: 2, pay: 200, payUnit: 'Kč/h', accent: '#f43f5e' },
  { id: 'ej4', title: 'Cateringový tým — 14.5.', status: 'filled', plan: 'Standard', views: 1_530, swipes: 290, matches: 27, hired: 8, ctr: 18.9, daysLeft: 0, pay: 220, payUnit: 'Kč/h', accent: '#5BD68A' },
  { id: 'ej5', title: 'Brand ambassador', status: 'paused', plan: 'Premium', views: 980, swipes: 130, matches: 12, hired: 0, ctr: 13.2, daysLeft: 8, pay: 210, payUnit: 'Kč/h', accent: '#E0B0FF' },
];

const E_CANDIDATES = {
  new: [
    { id: 'c1', name: 'Tomáš Marek', avatar: 'TM', color: '#5B6BFF', age: 22, rating: 4.9, jobsDone: 23, distance: 1.2, level: 7, match: 96, tags: ['Gastro', 'Latte art', 'Auto'], lastSeen: 'právě teď' },
    { id: 'c2', name: 'Klára Novotná', avatar: 'KN', color: '#F4A261', age: 19, rating: 4.7, jobsDone: 11, distance: 2.4, level: 4, match: 91, tags: ['Gastro', 'Víkend'], lastSeen: 'před 4 min' },
    { id: 'c3', name: 'Petr Hájek', avatar: 'PH', color: '#5BD68A', age: 28, rating: 4.6, jobsDone: 47, distance: 3.7, level: 9, match: 88, tags: ['Sklad', 'Doprava'], lastSeen: 'před 12 min' },
    { id: 'c4', name: 'Eliška Š.', avatar: 'EŠ', color: '#E0B0FF', age: 24, rating: 5.0, jobsDone: 8, distance: 0.8, level: 3, match: 84, tags: ['Foto', 'Eventy'], lastSeen: 'před 1 h' },
  ],
  shortlist: [
    { id: 'c5', name: 'Adam Procházka', avatar: 'AP', color: '#FFD166', age: 25, rating: 4.8, jobsDone: 19, distance: 1.5, level: 6, match: 94, tags: ['Gastro', 'Bar', 'AJ'], lastSeen: 'před 2 h' },
    { id: 'c6', name: 'Markéta L.', avatar: 'ML', color: '#FF6B35', age: 21, rating: 4.7, jobsDone: 14, distance: 2.1, level: 5, match: 90, tags: ['Gastro', 'Latte art'], lastSeen: 'včera' },
  ],
  interview: [
    { id: 'c7', name: 'Jakub Veselý', avatar: 'JV', color: '#8AB4FF', age: 23, rating: 4.9, jobsDone: 31, distance: 1.0, level: 8, match: 95, tags: ['Gastro', 'Bar'], lastSeen: 'právě teď', interview: 'Pá 9.5. · 14:00' },
  ],
  hired: [
    { id: 'c8', name: 'Sára Dvořáková', avatar: 'SD', color: '#5BD68A', age: 20, rating: 5.0, jobsDone: 7, distance: 1.8, level: 3, match: 92, tags: ['Gastro'], lastSeen: 'včera', shift: 'Po-Pá · 7:00–15:00' },
  ],
};

const E_ACTIVITY = [
  { type: 'match', who: 'Klára Novotná', what: 'matchla na Servírka — víkend', when: 'před 4 min', icon: 'heart-bold', color: '#0020F6' },
  { type: 'msg', who: 'Tomáš Marek', what: 'poslal zprávu', when: 'před 12 min', icon: 'chat-round-line-bold', color: '#5BD68A' },
  { type: 'view', who: '78 brigádníků', what: 'vidělo Pomocník do kuchyně — ASAP', when: 'za poslední hodinu', icon: 'eye-bold', color: '#FFD166' },
  { type: 'hire', who: 'Sára Dvořáková', what: 'přijala směnu Po-Pá', when: 'včera', icon: 'check-circle-bold', color: '#5BD68A' },
  { type: 'review', who: 'Adam Procházka', what: 'dal recenzi 5★', when: 'včera', icon: 'star-bold', color: '#FFD166' },
  { type: 'sub', who: 'Tarif Premium', what: 'obnoven na 30 dní', when: 'před 2 dny', icon: 'shield-check-bold', color: '#5B6BFF' },
];

// Recenze firmy — přepsány reálnými daty z Supabase při načtení
const E_REVIEWS = [
  { id: 'r1', author: 'Adam Procházka', avatar: 'AP', color: '#FFD166', rating: 5, text: 'Super parta, férové jednání a výplata na čas. Určitě zase přijdu.', when: 'před 3 dny' },
  { id: 'r2', author: 'Markéta L.',     avatar: 'ML', color: '#FF6B35', rating: 5, text: 'Příjemné prostředí, jasné instrukce. Doporučuju.', when: 'před týdnem' },
  { id: 'r3', author: 'Jakub Veselý',   avatar: 'JV', color: '#8AB4FF', rating: 4, text: 'Dobrá zkušenost, jen občas chaos v rozpisu směn.', when: 'před 2 týdny' },
];

Object.assign(window, { ECOMPANY, EPROFILE, E_KPIS, E_JOBS, E_CANDIDATES, E_ACTIVITY, E_REVIEWS });
