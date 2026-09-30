-- Stupeň důvěry brigádníka pro firemní dashboard (2026-09-28, Yasin + Claude)
--
-- Dashboard u kandidáta ukazuje stejný odznak jako appka v profilu
-- (Nový / Spolehlivý / Ověřený / Top). Appka ho počítá z VLASTNÍCH matches
-- (makejTrust ve www/worker-supabase.jsx): dokončené = potvrzená směna
-- (status 'confirmed'), jejíž den už uplynul; zrušené = status 'cancelled'.
-- Firma ale přes RLS vidí jen matches svých inzerátů, takže počty napříč
-- všemi firmami musí spočítat DB. Funkce vrací JEN dvě čísla na brigádníka,
-- žádné údaje o jiných firmách.
--
-- Dokud funkce neexistuje, dashboard odznak prostě nezobrazí.
--
-- Omezení: den směny se bere jen z jobs.date ve tvaru RRRR-MM-DD. Appka umí
-- i „So 5. 7." (dopočítá rok) — takové směny se tu zatím nezapočítají.

create or replace function public.worker_trust_stats(worker_ids uuid[])
returns table (worker_id uuid, dokoncene integer, zrusene integer)
language sql
stable
security definer
set search_path = public
as $$
  select w.id,
    (select count(*)::int
       from matches m
       join jobs j on j.id = m.job_id
      where m.worker_id = w.id
        and m.status = 'confirmed'
        and coalesce(m.kind, 'job') <> 'people'
        and j.date::text ~ '^\d{4}-\d{2}-\d{2}$'
        and (j.date::text)::date < current_date),
    (select count(*)::int
       from matches m
      where m.worker_id = w.id
        and m.status = 'cancelled')
  from unnest(worker_ids) as w(id)
$$;

revoke all on function public.worker_trust_stats(uuid[]) from public, anon;
grant execute on function public.worker_trust_stats(uuid[]) to authenticated;
