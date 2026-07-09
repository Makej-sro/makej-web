// Makej Employer — Předplatné: matice funkcí + helpery
// JEDNO místo pravdy pro to, co který tarif smí.
// Používá se přes globální helpery: can('analytics'), planLimit('maxActiveJobs'), planId()
//
// Tarif se čte z ECOMPANY.plan (nastaveno z DB v employer-supabase.jsx,
// nebo z ceníku po zaplacení). Hodnoty v DB: starter | standard | business | enterprise.

const PLAN_LIMITS = {
  starter:    { rank: 0, label: 'Starter',    maxActiveJobs: 1,        outreach: 1,        analytics: false, csvExport: false, verified: false, topJob: false, smsUrgent: false, templates: false, teamRoles: false, scheduleJobs: false },
  standard:   { rank: 1, label: 'Standard',   maxActiveJobs: 2,        outreach: 10,       analytics: false, csvExport: true,  verified: true,  topJob: true,  smsUrgent: false, templates: true,  teamRoles: false, scheduleJobs: false },
  business:   { rank: 2, label: 'Business',   maxActiveJobs: 10,       outreach: 100,      analytics: true,  csvExport: true,  verified: true,  topJob: true,  smsUrgent: true,  templates: true,  teamRoles: true,  scheduleJobs: true  },
  enterprise: { rank: 3, label: 'Enterprise', maxActiveJobs: Infinity, outreach: Infinity, analytics: true,  csvExport: true,  verified: true,  topJob: true,  smsUrgent: true,  templates: true,  teamRoles: true,  scheduleJobs: true  },
};

// Normalizace názvu tarifu na id (funguje pro 'Standard', 'business', 'Premium', legacy 'Pro'…)
function planId() {
  const raw = String(
    (typeof ECOMPANY !== 'undefined' && ECOMPANY.plan) ||
    (typeof EPROFILE !== 'undefined' && EPROFILE.plan) ||
    'starter'
  ).toLowerCase();
  if (raw.includes('enterprise')) return 'enterprise';
  if (raw.includes('business') || raw.includes('premium') || raw === 'pro') return 'business';
  if (raw.includes('standard')) return 'standard';
  return 'starter';
}

function planFeatures() { return PLAN_LIMITS[planId()] || PLAN_LIMITS.starter; }

// Má aktuální tarif danou funkci?  can('analytics') → true/false
function can(feature) { return !!planFeatures()[feature]; }

// Číselný limit tarifu.  planLimit('maxActiveJobs') → 1 / 2 / 10 / Infinity
function planLimit(key) { return planFeatures()[key]; }

// Nejnižší tarif, který danou funkci odemyká (pro CTA „Odemknout v Business")
function requiredPlanLabel(feature) {
  for (const id of ['starter', 'standard', 'business', 'enterprise']) {
    if (PLAN_LIMITS[id][feature]) return PLAN_LIMITS[id].label;
  }
  return 'Business';
}

Object.assign(window, { PLAN_LIMITS, planId, planFeatures, can, planLimit, requiredPlanLabel });
