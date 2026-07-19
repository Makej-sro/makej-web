-- Města + radius místo filtru krajů — 2026-07-19
-- ===========================================================================
-- Brigádník si v onboardingu vybere kraj → město (ze seznamu) a radius (km).
-- Firma vybere u inzerátu město ze stejného seznamu → job dostane lat/lng.
-- Feed pak ukazuje jen brigády do zvoleného radiusu (haversine z uložených
-- souřadnic). Praha rozdělena na části (Praha 1–10), Brno jen Brno-město /
-- Brno-venkov. Ostatní města jednou položkou.

-- 1) Tabulka měst (jeden zdroj pravdy pro obě appky) ------------------------
create table if not exists public.cities (
  id    text primary key,          -- slug, např. 'praha-1', 'brno-mesto', 'plzen'
  name  text not null,             -- zobrazovaný název
  kraj  text not null,             -- id kraje (praha, jihomoravsky, …)
  lat   double precision not null,
  lng   double precision not null
);

alter table public.cities enable row level security;
drop policy if exists "Cities readable by all" on public.cities;
create policy "Cities readable by all" on public.cities for select using (true);

-- 2) Sloupce polohy/radiusu do profiles ------------------------------------
alter table public.profiles add column if not exists city           text;
alter table public.profiles add column if not exists lat            double precision;
alter table public.profiles add column if not exists lng            double precision;
alter table public.profiles add column if not exists work_radius_km integer;   -- NULL = celá ČR

-- 3) Seed měst (idempotentní) ----------------------------------------------
insert into public.cities (id, name, kraj, lat, lng) values
  -- Praha (městské části)
  ('praha-1','Praha 1','praha',50.0875,14.4213),
  ('praha-2','Praha 2','praha',50.0755,14.4378),
  ('praha-3','Praha 3','praha',50.0812,14.4550),
  ('praha-4','Praha 4','praha',50.0410,14.4520),
  ('praha-5','Praha 5','praha',50.0705,14.4010),
  ('praha-6','Praha 6','praha',50.0955,14.3520),
  ('praha-7','Praha 7','praha',50.1050,14.4300),
  ('praha-8','Praha 8','praha',50.1100,14.4600),
  ('praha-9','Praha 9','praha',50.1120,14.5030),
  ('praha-10','Praha 10','praha',50.0700,14.4700),
  -- Středočeský
  ('kladno','Kladno','stredocesky',50.1477,14.1027),
  ('mlada-boleslav','Mladá Boleslav','stredocesky',50.4114,14.9030),
  ('pribram','Příbram','stredocesky',49.6890,14.0104),
  ('kolin','Kolín','stredocesky',50.0274,15.2000),
  ('kutna-hora','Kutná Hora','stredocesky',49.9484,15.2680),
  ('beroun','Beroun','stredocesky',49.9639,14.0722),
  ('melnik','Mělník','stredocesky',50.3503,14.4741),
  ('benesov','Benešov','stredocesky',49.7826,14.6870),
  ('brandys-nad-labem','Brandýs nad Labem','stredocesky',50.1861,14.6641),
  -- Jihočeský
  ('ceske-budejovice','České Budějovice','jihocesky',48.9747,14.4744),
  ('tabor','Tábor','jihocesky',49.4144,14.6578),
  ('pisek','Písek','jihocesky',49.3088,14.1475),
  ('strakonice','Strakonice','jihocesky',49.2610,13.9027),
  ('jindrichuv-hradec','Jindřichův Hradec','jihocesky',49.1443,15.0027),
  ('cesky-krumlov','Český Krumlov','jihocesky',48.8127,14.3175),
  -- Plzeňský
  ('plzen','Plzeň','plzensky',49.7384,13.3736),
  ('klatovy','Klatovy','plzensky',49.3955,13.2952),
  ('rokycany','Rokycany','plzensky',49.7425,13.5947),
  ('domazlice','Domažlice','plzensky',49.4407,12.9312),
  ('tachov','Tachov','plzensky',49.7947,12.6335),
  -- Karlovarský
  ('karlovy-vary','Karlovy Vary','karlovarsky',50.2306,12.8712),
  ('cheb','Cheb','karlovarsky',50.0796,12.3731),
  ('sokolov','Sokolov','karlovarsky',50.1814,12.6402),
  ('ostrov','Ostrov','karlovarsky',50.3055,12.9407),
  -- Ústecký
  ('usti-nad-labem','Ústí nad Labem','ustecky',50.6607,14.0322),
  ('most','Most','ustecky',50.5030,13.6362),
  ('decin','Děčín','ustecky',50.7726,14.2120),
  ('teplice','Teplice','ustecky',50.6404,13.8245),
  ('chomutov','Chomutov','ustecky',50.4600,13.4177),
  ('litomerice','Litoměřice','ustecky',50.5344,14.1319),
  ('louny','Louny','ustecky',50.3568,13.7966),
  -- Liberecký
  ('liberec','Liberec','liberecky',50.7671,15.0562),
  ('jablonec-nad-nisou','Jablonec nad Nisou','liberecky',50.7243,15.1712),
  ('ceska-lipa','Česká Lípa','liberecky',50.6855,14.5378),
  ('turnov','Turnov','liberecky',50.5875,15.1575),
  -- Královéhradecký
  ('hradec-kralove','Hradec Králové','kralovehradecky',50.2092,15.8328),
  ('trutnov','Trutnov','kralovehradecky',50.5609,15.9127),
  ('nachod','Náchod','kralovehradecky',50.4155,16.1657),
  ('jicin','Jičín','kralovehradecky',50.4366,15.3517),
  ('rychnov-nad-kneznou','Rychnov nad Kněžnou','kralovehradecky',50.1636,16.2751),
  -- Pardubický
  ('pardubice','Pardubice','pardubicky',50.0343,15.7812),
  ('chrudim','Chrudim','pardubicky',49.9511,15.7956),
  ('svitavy','Svitavy','pardubicky',49.7555,16.4690),
  ('usti-nad-orlici','Ústí nad Orlicí','pardubicky',49.9738,16.3937),
  ('ceska-trebova','Česká Třebová','pardubicky',49.9033,16.4470),
  -- Vysočina
  ('jihlava','Jihlava','vysocina',49.3961,15.5912),
  ('trebic','Třebíč','vysocina',49.2148,15.8817),
  ('havlickuv-brod','Havlíčkův Brod','vysocina',49.6078,15.5800),
  ('zdar-nad-sazavou','Žďár nad Sázavou','vysocina',49.5630,15.9398),
  ('pelhrimov','Pelhřimov','vysocina',49.4310,15.2233),
  -- Jihomoravský
  ('brno-mesto','Brno-město','jihomoravsky',49.1951,16.6068),
  ('brno-venkov','Brno-venkov','jihomoravsky',49.1050,16.5550),
  ('znojmo','Znojmo','jihomoravsky',48.8555,16.0488),
  ('breclav','Břeclav','jihomoravsky',48.7591,16.8825),
  ('hodonin','Hodonín','jihomoravsky',48.8489,17.1327),
  ('vyskov','Vyškov','jihomoravsky',49.2775,16.9988),
  ('blansko','Blansko','jihomoravsky',49.3639,16.6444),
  ('kyjov','Kyjov','jihomoravsky',49.0102,17.1214),
  -- Olomoucký
  ('olomouc','Olomouc','olomoucky',49.5938,17.2509),
  ('prerov','Přerov','olomoucky',49.4550,17.4509),
  ('prostejov','Prostějov','olomoucky',49.4720,17.1118),
  ('sumperk','Šumperk','olomoucky',49.9653,16.9706),
  ('hranice','Hranice','olomoucky',49.5479,17.7343),
  ('jesenik','Jeseník','olomoucky',50.2294,17.2035),
  -- Zlínský
  ('zlin','Zlín','zlinsky',49.2264,17.6707),
  ('kromeriz','Kroměříž','zlinsky',49.3000,17.3931),
  ('vsetin','Vsetín','zlinsky',49.3388,17.9963),
  ('uherske-hradiste','Uherské Hradiště','zlinsky',49.0698,17.4597),
  ('valasske-mezirici','Valašské Meziříčí','zlinsky',49.4718,17.9709),
  -- Moravskoslezský
  ('ostrava','Ostrava','moravskoslezsky',49.8209,18.2625),
  ('opava','Opava','moravskoslezsky',49.9387,17.9026),
  ('havirov','Havířov','moravskoslezsky',49.7797,18.4372),
  ('frydek-mistek','Frýdek-Místek','moravskoslezsky',49.6835,18.3506),
  ('karvina','Karviná','moravskoslezsky',49.8540,18.5416),
  ('trinec','Třinec','moravskoslezsky',49.6776,18.6708),
  ('novy-jicin','Nový Jičín','moravskoslezsky',49.5942,18.0104),
  ('krnov','Krnov','moravskoslezsky',50.0894,17.7042)
on conflict (id) do update set name = excluded.name, kraj = excluded.kraj, lat = excluded.lat, lng = excluded.lng;
