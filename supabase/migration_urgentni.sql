-- ════════════════════════════════════════════════════════════════════════════
-- Urgentní inzeráty — firma je označuje sama, počet podle tarifu (2026-10-02)
-- ════════════════════════════════════════════════════════════════════════════
-- Co to je: dřív byl inzerát „urgentní" sám od sebe (směna do 2 dnů, počítal to
-- dashboard). Od 2. 10. ho firma v dashboardu označí tlačítkem „Označit urgentní".
-- Označení platí do začátku směny: jobs.urgent_until = datum + čas od. Do té doby
-- má inzerát v appce fialovou pilulku Urgentní a u termínu odpočet. Appka čte
-- sloupec z get_feed_jobs (vrací to_jsonb(j), takže nový sloupec jde sám, RPC
-- není potřeba měnit).
--
-- Kolikrát za kalendářní měsíc smí firma označit, určuje tarif (ceník „Notifikace
-- Urgent": Základní 0, Výhodný 0, Dynamický 1, Maximální 2, Vlastní 3). Každé
-- označení se zapíše do job_urgentni, dashboard počítá řádky od začátku měsíce.
-- Dokud tabulka není, počítá odhadem z jobs.urgent_until. Bez sloupce
-- jobs.urgent_until ale označení vůbec nejde uložit.
--
-- Limit hlídá zatím jen dashboard (tarif firmy v DB ještě není). Až bude tarif
-- v databázi, patří kontrola do RPC (security definer), aby nešla obejít.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.jobs add column if not exists urgent_until timestamptz;

create table if not exists public.job_urgentni (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  employer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  started_at  timestamptz not null default now(),
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists job_urgentni_employer_started
  on public.job_urgentni (employer_id, started_at desc);

alter table public.job_urgentni enable row level security;

-- Firma vidí jen svoje označení
drop policy if exists "job_urgentni_select_own" on public.job_urgentni;
create policy "job_urgentni_select_own" on public.job_urgentni
  for select using (employer_id = auth.uid());

-- Firma zapíše označení jen u vlastního inzerátu
drop policy if exists "job_urgentni_insert_own" on public.job_urgentni;
create policy "job_urgentni_insert_own" on public.job_urgentni
  for insert with check (
    employer_id = auth.uid()
    and exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
  );

-- Mazat ani upravovat záznamy firma nemůže (jinak by si limit „vynulovala")

-- Kontrola po spuštění:
--   select column_name from information_schema.columns where table_name = 'jobs' and column_name = 'urgent_until';
--   select count(*) from public.job_urgentni;
