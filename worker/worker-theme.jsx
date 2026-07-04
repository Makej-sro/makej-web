// Makej Worker — Light theme
// Přepisuje sdílené tokeny T (z app.jsx) na světlý iOS-style vzhled.
// Běží jen na worker stránce → employer dashboard zůstává tmavý.

Object.assign(T, {
  bg:        '#f3f2ec',           // teplá off-white
  card:      '#ffffff',           // bílé karty
  cardSoft:  'rgba(18,18,26,0.04)',
  surfaceAlt:'#eeede6',           // jemně odlišená plocha
  primary:   '#0020F6',
  primaryDeep:'#1a1aa8',
  ink:       '#14141b',           // hlavní tmavý text
  inkSoft:   '#4a4a57',
  light:     '#3a3a45',           // sekundární tmavý text (dřív světlý)
  text:      '#ffffff',           // text NA barevných plochách (avatary, hero, černá tlačítka)
  muted:     '#71717f',
  mutedSoft: '#a6a6b2',
  destructive:'#f43f5e',
  super:     '#F5A623',           // amber (lépe čitelný na bílé)
  border:    'rgba(18,18,26,0.10)',
  black:     '#141414',           // primární (černé) tlačítko
});
