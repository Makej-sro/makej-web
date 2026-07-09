// Makej Employer — Light theme
// Přepisuje sdílené tokeny T (z app.jsx) na světlý vzhled dashboardu.
// Běží jen na employer stránce → worker appka má vlastní worker-theme.jsx.

Object.assign(T, {
  bg:         '#e8ecfb',            // světle modrá plocha dashboardu
  card:       '#ffffff',           // bílé karty
  cardSoft:   'rgba(0,32,246,0.05)',
  surfaceAlt: '#eaeefb',           // modře tónovaná plocha
  primary:    '#0020F6',
  primaryDeep:'#2D2CA7',
  ink:        '#0f1222',           // hlavní tmavý text
  inkSoft:    '#4a4a66',
  light:      '#374151',           // sekundární tmavý text (dřív světlý)
  text:       '#0f1222',           // text na kartách
  muted:      '#6b7280',
  mutedSoft:  '#9ca3af',
  destructive:'#f43f5e',
  super:      '#F5A623',
  border:     'rgba(0,32,246,0.12)',  // modré rámečky
  navBg:      '#ffffff',           // světlý topbar
});
