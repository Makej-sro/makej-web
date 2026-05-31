# Employer Dashboard — Prémiové funkce (zatím skryté)

Tato složka obsahuje kompletní kód funkcí, které byly odstraněny z dashboardu před launchem.
Jsou připravené k nasazení — stačí je zapojit zpět dle návodu níže.

---

## Přehled funkcí

| Soubor | Funkce | Doporučený tarif |
|---|---|---|
| `analytics.jsx` | Pokročilá analytika (4 sekce) + Plán směn | Premium / Pro |
| `team-billing.jsx` | Správa týmu + Fakturace | Business / Pro |
| `settings-extended.jsx` | Veřejný profil + Integrace (Slack, Calendar, API…) | Premium / Business |
| `dashboard-advanced.jsx` | Heatmapa, Funnel, Geo mapa, Benchmark | Premium |

---

## Jak zapojit funkci zpět

### 1. Přidat script tag do `employer/index.html`

```html
<!-- za employer-pages3.jsx -->
<script type="text/babel" src="_premium/analytics.jsx"></script>
<script type="text/babel" src="_premium/team-billing.jsx"></script>
<script type="text/babel" src="_premium/settings-extended.jsx"></script>
```

### 2. Přidat nav položky do `employer-shell.jsx`

```js
// Sekce "Přehled"
{ k: 'analytics', label: 'Analytika', icon: 'graph-up-bold', iconLine: 'graph-up-linear', badge: 'PRO' },

// Sekce "Nábor"
{ k: 'calendar', label: 'Plán směn', icon: 'calendar-bold', iconLine: 'calendar-linear' },

// Sekce "Firma"
{ k: 'team', label: 'Tým', icon: 'users-group-two-rounded-bold', iconLine: 'users-group-two-rounded-linear' },
{ k: 'billing', label: 'Fakturace', icon: 'card-bold', iconLine: 'card-linear' },
```

### 3. Přidat TITLES do `employer-main.jsx`

```js
analytics:  { title: 'Analytika',  subtitle: 'Pokročilé reporty a segmentace' },
calendar:   { title: 'Plán směn',  subtitle: 'Kalendář a obsazení' },
team:       { title: 'Tým',        subtitle: 'Vaši kolegové a oprávnění' },
billing:    { title: 'Fakturace',  subtitle: 'Tarify, faktury a platby' },
```

### 4. Přidat tab routing do `employer-main.jsx`

```js
else if (tab === 'analytics')     body = <EAnalytics key={tick} />;
else if (tab === 'calendar')      body = <ECalendar key={tick} />;
else if (tab === 'team')          body = <ETeam key={tick} />;
else if (tab === 'billing')       body = <EBilling key={tick} />;
```

### 5. Rozšířené nastavení — přidat do `employer-pages3.jsx`

V `ESettings` přidat do nav pole:
```js
{ k: 'public', l: 'Veřejný profil', i: 'eye-bold' },
{ k: 'integ', l: 'Integrace', i: 'plug-circle-bold' },
```

A do renderingu:
```js
{seg === 'public' && <SettingsPublic />}
{seg === 'integ' && <SettingsIntegrations />}
```

### 6. Dashboard rozšíření — přidat do `employer-dashboard.jsx`

Viz komentáře v `dashboard-advanced.jsx`.
Data konstanty (E_FUNNEL, E_HEATMAP, E_GEO, E_BENCH) přidat do `employer-data.jsx`.

---

## Poznámky

- Veškerý kód referencuje globální `T`, `Icon`, `ECard`, `SectionHeader` z app.jsx / employer-shell.jsx — ty jsou stále dostupné.
- Mock data jsou v souborech přímo nebo v sekci dat — při reálném nasazení napojit na Supabase queries.
- `employer-pages2.jsx` v kořenové složce `/employer/` je původní soubor — je stále na disku, jen se nenačítá.
