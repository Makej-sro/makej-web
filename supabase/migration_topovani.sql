-- ════════════════════════════════════════════════════════════════════════════
-- Topování inzerátů — záznam o každém topování (2026-09-29)
-- ════════════════════════════════════════════════════════════════════════════
-- Co to je: firma v dashboardu klikne u inzerátu „Topovat" → inzerát je 72 hodin
-- v appce mezi prvními kartami (jobs.top_until; get_feed_jobs podle něj už řadí)
-- a má zlatou pilulku TOP. Kolikrát za kalendářní měsíc smí topovat, určuje tarif
-- (Základní 0, Výhodný 1, Dynamický 3, Maximální 5, Vlastní 5).
--
-- Proč tabulka: jobs.top_until drží jen poslední topování. Když firma topuje stejný
-- inzerát v měsíci podruhé, přepíše se a limit by nešel spočítat. Dashboard proto
-- každé topování zapíše sem a počítá řádky od začátku měsíce.
-- Dokud tabulka není, dashboard funguje dál a počítá odhadem z jobs.top_until.
--
-- Limit hlídá zatím jen dashboard (tarif firmy v DB ještě není). Až bude tarif
-- v databázi, patří kontrola do RPC (security definer), aby nešla obejít.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.job_topovani (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  employer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  started_at  timestamptz not null default now(),
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists job_topovani_employer_started
  on public.job_topovani (employer_id, started_at desc);

alter table public.job_topovani enable row level security;

-- Firma vidí jen svoje topování
drop policy if exists "job_topovani_select_own" on public.job_topovani;
create policy "job_topovani_select_own" on public.job_topovani
  for select using (employer_id = auth.uid());

-- Firma zapíše topování jen u vlastního inzerátu
drop policy if exists "job_topovani_insert_own" on public.job_topovani;
create policy "job_topovani_insert_own" on public.job_topovani
  for insert with check (
    employer_id = auth.uid()
    and exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = auth.uid())
  );

-- Mazat ani upravovat záznamy firma nemůže (jinak by si limit „vynulovala")
