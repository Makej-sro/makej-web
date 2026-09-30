// Makej Employer — Předplatné: matice funkcí + helpery
// JEDNO místo pravdy pro to, co který tarif smí.
// Používá se přes globální helpery: can('analytics'), planLimit('maxActiveJobs'), planId()
//
// Tarif se čte z ECOMPANY.plan (nastaveno z DB v employer-supabase.jsx,
// nebo z ceníku po zaplacení). Hodnoty v DB: starter | standard | business | enterprise.

// Limity podle webového ceníku (/cenik.html). Id jsou historická (DB je tak
// ukládá), názvy jsou nové: starter = Základní, standard = Výhodný,
// dynamicky = Dynamický, business = Maximální, enterprise = Vlastní.
const PLAN_LIMITS = {
  starter:    { rank: 0, label: 'Základní',  maxActiveJobs: 1,        outreach: 1,        users: 2,  analytics: false, csvExport: false, verified: false, topJob: false, smsUrgent: false, templates: false, teamRoles: false, scheduleJobs: false },
  standard:   { rank: 1, label: 'Výhodný',   maxActiveJobs: 2,        outreach: 3,        users: 3,  analytics: false, csvExport: false, verified: true,  topJob: true,  smsUrgent: false, templates: false, teamRoles: false, scheduleJobs: false },
  dynamicky:  { rank: 2, label: 'Dynamický', maxActiveJobs: 5,        outreach: 10,       users: 5,  analytics: true,  csvExport: true,  verified: true,  topJob: true,  smsUrgent: true,  templates: true,  teamRoles: false, scheduleJobs: true  },
  business:   { rank: 3, label: 'Maximální', maxActiveJobs: 10,       outreach: 20,       users: 10, analytics: true,  csvExport: true,  verified: true,  topJob: true,  smsUrgent: true,  templates: true,  teamRoles: true,  scheduleJobs: true  },
  enterprise: { rank: 4, label: 'Vlastní',   maxActiveJobs: Infinity, outreach: Infinity, users: 20, analytics: true,  csvExport: true,  verified: true,  topJob: true,  smsUrgent: true,  templates: true,  teamRoles: true,  scheduleJobs: true  },
};

// Normalizace názvu tarifu na id (funguje pro 'Standard', 'business', 'Premium', legacy 'Pro'…)
function planId() {
  const raw = String(
    (typeof ECOMPANY !== 'undefined' && ECOMPANY.plan) ||
    (typeof EPROFILE !== 'undefined' && EPROFILE.plan) ||
    'starter'
  ).toLowerCase();
  if (raw.includes('enterprise') || raw.includes('vlastn')) return 'enterprise';
  if (raw.includes('business') || raw.includes('premium') || raw.includes('maxim') || raw === 'pro') return 'business';
  if (raw.includes('dynamick')) return 'dynamicky';
  if (raw.includes('standard') || raw.includes('výhodn') || raw.includes('vyhodn')) return 'standard';
  return 'starter';
}

function planFeatures() { return PLAN_LIMITS[planId()] || PLAN_LIMITS.starter; }

// Má aktuální tarif danou funkci?  can('analytics') → true/false
function can(feature) { return !!planFeatures()[feature]; }

// Číselný limit tarifu.  planLimit('maxActiveJobs') → 1 / 2 / 10 / Infinity
function planLimit(key) { return planFeatures()[key]; }

// Nejnižší tarif, který danou funkci odemyká (pro CTA „Odemknout v Business")
function requiredPlanLabel(feature) {
  for (const id of ['starter', 'standard', 'dynamicky', 'business', 'enterprise']) {
    if (PLAN_LIMITS[id][feature]) return PLAN_LIMITS[id].label;
  }
  return 'Maximální';
}

Object.assign(window, { PLAN_LIMITS, planId, planFeatures, can, planLimit, requiredPlanLabel });
