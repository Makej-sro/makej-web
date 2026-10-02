// ═══════════════════════════════════════════════════════════════
// UKÁZKOVÉ INZERÁTY (jen dashboard, nic se neukládá do DB) — 28. 9. 2026
// ═══════════════════════════════════════════════════════════════
// Yasin chtěl vidět, jak vypadají karty inzerátů s fotkami, popisem a čísly,
// než firmy nahrají vlastní. Stejný princip jako demo inzeráty v appce
// (JOBS v www/app.jsx) — obsah i fotky jsou odtamtud, jen jako inzeráty
// přihlášené firmy.
//
// PŘED RELEASEM: E_DEMO_INZERATY = false (nebo soubor smazat i s <script>
// v index.html). Ukázky se přidávají jen do seznamu v záložce Inzeráty,
// do čísel (limit tarifu, zájemci, statistiky) se nezapočítávají.
const E_DEMO_INZERATY = true;

function eDemoInzeraty() {
  if (!E_DEMO_INZERATY) return [];
  const den = n => { const d = new Date(Date.now() + n * 86400000); return d.toISOString().slice(0, 10); };
  const pred = n => new Date(Date.now() - n * 86400000).toISOString();
  const U = id => 'https://images.unsplash.com/photo-' + id + '?w=900&q=70&auto=format&fit=crop';
  // Zhlédnutí po dnech pro graf v detailu — rozložené od zveřejnění do dneška
  // (víc na začátku, pak ubývá, o víkendu víc), součet sedí s „views".
  const poDnech = (celkem, zpet, semeno) => {
    const vahy = [], klice = [];
    for (let i = zpet; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      klice.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
      const vikend = d.getDay() === 0 || d.getDay() === 6 ? 1.35 : 1;
      const x = Math.sin(semeno * 97 + i * 13.7) * 0.5 + 1;          // pseudonáhoda, pořád stejná
      vahy.push((1.6 - 0.9 * (zpet - i) / Math.max(1, zpet)) * vikend * x);
    }
    const suma = vahy.reduce((a, b) => a + b, 0), out = {};
    let zbyva = celkem;
    klice.forEach((k, j) => { const v = j === klice.length - 1 ? zbyva : Math.min(zbyva, Math.round(celkem * vahy[j] / suma)); out[k] = v; zbyva -= v; });
    return out;
  };
  // Ukázkoví zájemci pro statistiky inzerátu (věk, vzdělání, kdy reagují) —
  // pseudonáhodně, ale pořád stejně; počet = „matches" inzerátu.
  const VZD = ['Základní', 'Středoškolské s výučním listem — Kuchař', 'Středoškolské s maturitou — Gymnázium', 'Vyšší odborné (VOŠ) — Ekonomika', 'Vysokoškolské — Bc.'];
  const zajemci = (n, zpet, semeno) => Array.from({ length: n }, (_, i) => {
    const r = k => { const x = Math.sin(semeno * 131 + i * 17.3 + k * 7.1) * 10000; return x - Math.floor(x); };
    const vek = 16 + Math.floor(Math.pow(r(1), 1.6) * 24);
    const nar = new Date(); nar.setFullYear(nar.getFullYear() - vek); nar.setMonth(Math.floor(r(2) * 12));
    const kdy = new Date(Date.now() - r(3) * zpet * 86400000);
    const hod = [7, 10, 13, 16, 19, 20, 21, 22, 23, 12][Math.floor(r(4) * 10)];
    kdy.setHours(hod, Math.floor(r(5) * 60), 0, 0);
    if (kdy.getTime() > Date.now()) kdy.setDate(kdy.getDate() - 1);
    return { worker_id: 'demo-w-' + semeno + '-' + i, matched_at: kdy.toISOString(), status: i === 0 ? 'accepted' : 'pending', birth_date: nar.toISOString().slice(0, 10), education: r(6) < 0.2 ? '' : VZD[Math.min(4, Math.floor(Math.pow(r(7), 1.3) * 5))] };
  });
  const zaklad = { _demo: true, candidates: [], plan: 'Standard', ctr: 0, accent: '#5C71FF', payUnit: 'Kč/h' };
  return [
    { ...zaklad, id: 'demo-1', title: 'Barista do specialty kavárny', status: 'active', views: 142, viewsByDay: poDnech(142, 4, 1), matches: 9, candidates: zajemci(9, 4, 1), swipes: 9, pending: 4, hired: 1, daysLeft: 12,
      kraj: 'jihomoravsky', payout: 'Týdně', positions: 2,
      expectations: ['Spolehlivost a dochvilnost', 'Chuť učit se a příjemné vystupování k hostům', 'Zvládneš tempo při ranním náporu', 'Věk 18+'],
      bonuses: ['Zkušenost z kavárny nebo gastra', 'Základy latte art'],
      offer: ['Zaučíme tě do všeho — kávu i obsluhu', 'Férový přístup a pohodový tým', 'Flexibilní domluva směn'],
      perks: ['Káva zdarma', 'Nástup ihned', 'Týmovka 1× měsíc'], requirements: ['Čeština'],
      pay: 180, location: 'Brno — Veveří', date: den(3), timeText: '7:00 – 15:00', contract: 'DPP', recurrence: 'Pravidelná', created_at: pred(4),
      tags: ['Gastro', 'Ranní směna', 'Bez zkušeností'], photos: [U('1495474472287-4d71bcdd2085'), U('1509042239860-f550ce710b93')],
      description: 'Hledáme parťáka do dopolední směny. Naučíme tě latte art, espresso a obsluhu hostů. Káva od pražírny Doubleshot.' },
    { ...zaklad, id: 'demo-2', title: 'Hosteska na hudební festival', status: 'urgent', urgentUntil: new Date(den(2) + 'T12:00:00').toISOString(), views: 310, viewsByDay: poDnech(310, 9, 2), matches: 18, candidates: zajemci(18, 9, 2), swipes: 18, pending: 7, hired: 3, daysLeft: 2,
      kraj: 'jihomoravsky', payout: 'Hned po akci', positions: 6,
      expectations: ['Příjemné a komunikativní vystupování', 'Spolehlivost a dochvilnost', 'Zvládneš celý den na nohou venku', 'Věk 18+'],
      bonuses: ['Angličtina pro zahraniční návštěvníky', 'Zkušenost z eventů'],
      offer: ['Zázemí a občerstvení po celou akci', 'Parta lidí a festivalová atmosféra', 'Reference na další eventy'],
      perks: ['Vstup na koncerty po směně', 'Festivalové tričko'], requirements: ['Čeština', 'Angličtina'],
      pay: 220, location: 'Brno — Výstaviště', date: den(2), timeText: '12:00 – 24:00', contract: 'DPP', recurrence: 'Jednorázová', created_at: pred(9), boosted: true, topUntil: new Date(Date.now() + 41 * 3600000).toISOString(),
      tags: ['Eventy', 'Víkend', 'Tým', 'Pro studenty'], photos: [U('1470229722913-7c0e2dbbafd3'), U('1533174072545-7a4b6ad7a6c3')],
      description: 'Vítání hostů, kontrola vstupenek a pásek, informace o programu. Dostaneš tričko festivalu a vstup na koncerty po směně.' },
    { ...zaklad, id: 'demo-3', title: 'Skladník na rampě — Po–Pá', status: 'active', views: 96, viewsByDay: poDnech(96, 2, 3), matches: 5, candidates: zajemci(5, 2, 3), swipes: 5, pending: 2, hired: 0, daysLeft: 20,
      kraj: 'jihomoravsky', payout: 'Měsíčně', positions: 3, hoursPerWeek: 40,
      expectations: ['Spolehlivost a dochvilnost', 'Fyzická zdatnost', 'Práce se čtečkou nevadí'],
      bonuses: ['Průkaz na VZV', 'Zkušenost ze skladu'],
      offer: ['Zaučíme tě na místě', 'Stabilní směny Po–Pá', 'Možnost dlouhodobé spolupráce'],
      perks: ['Doprava zdarma', 'Obědy za 40 Kč'], requirements: ['Pracovní obuv'],
      pay: 195, location: 'Modřice', date: den(6), timeText: '6:00 – 14:00', contract: 'HPP', recurrence: 'Pravidelná', created_at: pred(2),
      tags: ['Sklad', 'Dlouhodobě', 'Doprava ZDARMA'], photos: [U('1553413077-190dd305871c'), U('1586528116311-ad8dd3c8310d')],
      description: 'Příjem a vychystávání zboží na rampě, práce se čtečkou. Svozový autobus z Brna zdarma, obědy za 40 Kč.' },
    { ...zaklad, id: 'demo-4', title: 'Foto asistent na svatbu', status: 'paused', views: 58, viewsByDay: poDnech(58, 16, 4), matches: 3, candidates: zajemci(3, 16, 4), swipes: 3, pending: 0, hired: 0, daysLeft: 0,
      kraj: 'jihomoravsky', payout: 'Do 14 dní', positions: 1,
      expectations: ['Pečlivost a trpělivost', 'Věk 18+'],
      bonuses: ['Zkušenost s foťákem'],
      offer: ['Nahlédneš pod ruce profesionální fotografce', 'Oběd a pití na svatbě'],
      perks: ['Jídlo na směně'], requirements: ['Řidičák sk. B'],
      pay: 350, location: 'Slavkov u Brna', date: den(14), timeText: '10:00 – 18:00', contract: 'DPP', recurrence: 'Jednorázová', created_at: pred(16),
      tags: ['Foto', 'Víkend', 'Kreativní'], photos: [U('1519741497674-611481863552'), U('1519225421980-715cb0215aed')],
      description: 'Pomůžeš fotografce s technikou, světly a aranžováním skupinových fotek. Zkušenost s foťákem výhodou.' },
    { ...zaklad, id: 'demo-5', title: 'Promotér energetického nápoje', status: 'paused', views: 205, viewsByDay: poDnech(205, 21, 5), matches: 12, candidates: zajemci(12, 21, 5), swipes: 12, pending: 0, hired: 4, daysLeft: 0,
      kraj: 'jihomoravsky', payout: 'Týdně', positions: 4,
      expectations: ['Nebojíš se oslovit lidi', 'Spolehlivost a dochvilnost'],
      bonuses: ['Zkušenost s promo akcemi'],
      offer: ['Bonus 500 Kč za splněný denní cíl', 'Krátké zaškolení před akcí'],
      perks: ['Nápoje zdarma'], requirements: ['Čeština'],
      pay: 210, location: 'Brno — Galerie Vaňkovka', date: den(-3), timeText: '14:00 – 20:00', contract: 'DPP', recurrence: 'Jednorázová', created_at: pred(21),
      tags: ['Promo', 'Centrum', 'Bonus', 'Od 15 let'], photos: [U('1567620905732-2d1ec7ab7445'), U('1544145945-f90425340c7e')],
      description: 'Rozdávání vzorků a krátké povídání s lidmi v obchodním centru. Bonus 500 Kč za splněný denní cíl.' },
  ];
}

// ── Ukázkoví kandidáti (29. 9.) — ať je v záložce Kandidáti vidět, jak vypadají
// mini profily s fotkou. Jména a profilovky jsou z ukázkových lidí v appce
// (www/worker-people.jsx → www/demo-lide/p1–p13.jpg, zkopírováno do demo-kandidati/),
// popisy jsou napsané pro brigády. Reagují na ukázkové inzeráty výš (demo-1 až demo-5).
// Stejný vypínač jako ukázkové inzeráty. Do čísel nahoře se nepočítají, zprávu
// ani nabídku jim poslat nejde (dashboard to u _demo slušně odmítne).
function eDemoKandidati() {
  if (!E_DEMO_INZERATY) return [];
  const pred = h => new Date(Date.now() - h * 3600000).toISOString();
  const relTime = h => h < 1 ? 'před chvílí' : h < 24 ? 'před ' + Math.round(h) + ' h' : h < 48 ? 'včera' : 'před ' + Math.round(h / 24) + ' dny';
  const JOBY = { 'demo-1': 'Barista do specialty kavárny', 'demo-2': 'Hosteska na hudební festival', 'demo-3': 'Skladník na rampě — Po–Pá', 'demo-4': 'Foto asistent na svatbu', 'demo-5': 'Promotér energetického nápoje' };
  const L = [
    ['Petr Hlaváč', 24, 'Brno', 4.9, 34, 0, 'hired', 'demo-3', 330, 'Při studiu na VUT dělám brigády ve skladu i na akcích. Mám průkaz na vysokozdvižný vozík, nevadí mi ranní směny ani víkendy a na čas chodím vždycky.'],
    ['Tereza Nová', 21, 'Brno', 4.8, 16, 0, 'new', 'demo-1', 2, 'Studuju pedagogiku a třetím rokem dělám baristku v kavárně na Údolní. Latte art zvládám, s lidmi mě to baví a ranní směny mi sedí.'],
    ['Martin Kraus', 26, 'Brno', 5.0, 12, 0, 'new', 'demo-4', 20, 'Fotím pátým rokem, mám vlastní světla i objektivy. Na svatbách jsem asistoval už několikrát — vím, kdy být vidět a kdy ne.'],
    ['Adéla Pokorná', 19, 'Brno', 4.7, 6, 0, 'new', 'demo-2', 5, 'Hostesku jsem dělala na veletrhu na Výstavišti a na dvou festivalech. Jsem komunikativní, mluvím anglicky a německy a vydržím na nohou celý den.'],
    ['Jakub Souček', 22, 'Brno', 4.6, 9, 1, 'new', 'demo-3', 30, 'Studuju IT na VUT a přes léto jsem dělal ve skladu v Modřicích. Vychystávání přes čtečku znám, mám řidičák B.'],
    ['Klára Veselá', 23, 'Brno', 4.9, 28, 0, 'hired', 'demo-1', 260, 'V gastru dělám čtyři roky, zvládnu bar i obsluhu na place. Káva je moje srdcovka a nováčky ráda zaučím.'],
    ['Filip Marek', 18, 'Brno', 0, 0, 0, 'new', 'demo-3', 1, 'Jsem vyučený elektrikář a hledám brigády na víkendy. Nebojím se fyzické práce a rád se naučím něco nového.'],
    ['Nikol Urbanová', 17, 'Brno', 0, 1, 0, 'new', 'demo-2', 9, 'Chodím na gympl a hledám další brigádu na léto i víkendy. Jsem spolehlivá, usměvavá a ráda poznávám nové lidi.'],
    ['Lucie Horáková', 25, 'Brno', 4.9, 41, 0, 'hired', 'demo-2', 400, 'Na akcích a festivalech dělám šestou sezónu — hosteska, šatna, vstupy. Když je potřeba, vezmu na sebe i koordinaci ostatních.'],
    ['Jarda Beneš', 20, 'Blansko', 4.7, 7, 0, 'new', 'demo-5', 50, 'Rád jsem mezi lidmi a nebojím se je oslovit. Promo akce jsem dělal pro dvě značky, umím i s ochutnávkovým stánkem.'],
    ['Bára Němcová', 20, 'Brno', 5.0, 14, 0, 'new', 'demo-1', 12, 'Studuju a o víkendech pracuju v kavárně. Mám ráda pořádek za barem a kávu dělám s láskou. Volno mám hlavně odpoledne.'],
    ['Tomáš Král', 24, 'Kuřim', 4.8, 19, 1, 'new', 'demo-3', 70, 'Pracuju na směny a ve volných dnech beru brigády. Ve skladu jsem dělal dva roky, s paletovým vozíkem umím a nevadí mi ani noční.'],
    ['Denisa Fialová', 22, 'Brno', 4.9, 31, 0, 'new', 'demo-2', 26, 'Mám za sebou desítky akcí jako hosteska i promotérka. Působím reprezentativně, mluvím anglicky a na čase si dávám záležet.'],
  ];
  return L.map(([name, age, city, rating, dok, zru, stage, job_id, hod, bio], i) => ({
    id: 'demo-k-' + (i + 1), match_id: null, worker_id: null, _demo: true,
    name, age, city, bio, photo: 'demo-kandidati/p' + (i + 1) + '.jpg',
    rating: rating ? rating.toFixed(1) : '0.0',
    trust: { dokoncene: dok, zrusene: zru, hodnoceni: rating },
    stage, job_id, jobTitle: JOBY[job_id],
    createdAt: pred(hod), lastSeen: relTime(hod),
  }));
}

Object.assign(window, { E_DEMO_INZERATY, eDemoInzeraty, eDemoKandidati });
