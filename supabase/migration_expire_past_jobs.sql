-- Automatické stažení inzerátů po datu konání — 2026-07-19
-- ===========================================================================
-- Když je brigáda po datu konání, přepne se na status 'expired' → je neaktivní
-- pro OBĚ strany: brigádník ji ve swipe feedu nevidí (feed bere jen 'active'),
-- firma ji v dashboardu vidí jako „paused" (employer-supabase.jsx mapuje
-- 'expired' → 'paused'). Běží jako naplánovaná úloha (pg_cron) každý den.
--
-- Aplikováno přes Supabase Management API (2026-07-19). pg_cron zapnut.

create extension if not exists pg_cron;

-- Bezpečně odvodí datum konání: event_date → ISO 'YYYY-MM-DD' date → legacy 'D.M'
-- (letošní rok, s ošetřením neplatných dat). Vrátí NULL, když nelze určit.
create or replace function public._job_event_date(p_event date, p_date text)
returns date
language plpgsql
stable
as $$
declare m int; d int;
begin
  if p_event is not null then return p_event; end if;
  if p_date ~ '^\d{4}-\d{2}-\d{2}$' then
    begin return p_date::date; exception when others then return null; end;
  end if;
  if p_date ~ '(\d{1,2})\s*\.\s*(\d{1,2})' then
    d := (regexp_match(p_date, '(\d{1,2})\s*\.\s*(\d{1,2})'))[1]::int;
    m := (regexp_match(p_date, '(\d{1,2})\s*\.\s*(\d{1,2})'))[2]::int;
    begin
      return make_date(extract(year from current_date)::int, m, d);
    exception when others then return null;
    end;
  end if;
  return null;
end $$;

-- Aktivní joby po datu → 'expired'. Vrací počet přepnutých.
create or replace function public.expire_past_jobs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  update public.jobs
  set status = 'expired'
  where status = 'active'
    and public._job_event_date(event_date, date) < current_date;
  get diagnostics n = row_count;
  return n;
end $$;

-- Naplánovat denně 00:10 UTC (job platí celý svůj den, druhý den ráno se stáhne)
select cron.schedule('expire-past-jobs', '10 0 * * *', 'select public.expire_past_jobs();');

-- Jednorázově teď na existující data
select public.expire_past_jobs();
