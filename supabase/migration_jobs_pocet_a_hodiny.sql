-- Inzerát: počet volných míst + hodiny týdně (2026-09-28, Yasin + Claude)
--
-- Okno Nový / Upravit inzerát v dashboardu je teď postavené přesně podle
-- detailu inzerátu v appce. Appka umí ukázat ještě dvě věci, na které
-- v tabulce jobs chybí sloupec:
--   positions       → v detailu inzerátu „3 volných míst" (jobToCard: job.positions)
--   hours_per_week  → u pracovní smlouvy štítek Plný / Zkrácený / Částečný úvazek
--                     a „30 h/týden" na kartě (makej-badge.jsx: normalizeHours)
-- Dashboard je posílá už teď; dokud sloupce nejsou, zápis je sám vynechá
-- (_jobsZapis v employer/employer-supabase.jsx) a inzerát se uloží bez nich.

alter table public.jobs
  add column if not exists positions      integer default 1,
  add column if not exists hours_per_week integer;

-- Volitelný úklid: starší okno „Nový inzerát" ukládalo kraj jako název
-- („Jihomoravský"), appka ale filtruje podle id („jihomoravsky") — takové
-- inzeráty brigádník ve filtru krajů nenašel.
update public.jobs set kraj = case kraj
  when 'Praha' then 'praha' when 'Středočeský' then 'stredocesky' when 'Jihočeský' then 'jihocesky'
  when 'Plzeňský' then 'plzensky' when 'Karlovarský' then 'karlovarsky' when 'Ústecký' then 'ustecky'
  when 'Liberecký' then 'liberecky' when 'Královéhradecký' then 'kralovehradecky' when 'Pardubický' then 'pardubicky'
  when 'Vysočina' then 'vysocina' when 'Jihomoravský' then 'jihomoravsky' when 'Olomoucký' then 'olomoucky'
  when 'Zlínský' then 'zlinsky' when 'Moravskoslezský' then 'moravskoslezsky' else kraj end
where kraj in ('Praha','Středočeský','Jihočeský','Plzeňský','Karlovarský','Ústecký','Liberecký',
  'Královéhradecký','Pardubický','Vysočina','Jihomoravský','Olomoucký','Zlínský','Moravskoslezský');
