-- Perzistentní upozornění brigádníka (notifications) — 2026-07
-- ===========================================================================
-- Tabulka `notifications` už existuje (id, user_id→profiles, type,
-- match_id→matches, title, body, read, created_at). Tahle migrace zapne
-- KOMPLETNÍ notifikace, které fungují i když je appka zavřená:
--   1) rozšíření CHECK na `type` (6 typů dle W_NOTIF_STYLE)
--   2) RLS — uživatel čte/upravuje/maže jen svoje upozornění
--   3) index pro rychlé načtení historie
--   4) TRIGGERY — server sám vytvoří upozornění příjemci při:
--        • přijetí shody (match → accepted)   → 'match'
--        • nové zprávě / nabídce směny         → 'message' / 'shift'
--        • nové recenzi                         → 'review'
--   5) realtime publikace, ať appka dostane upozornění okamžitě
--
-- Idempotentní — jde spustit opakovaně. Žádná data nemaže.
-- Aplikuj v Supabase SQL Editoru.

-- 1) Rozšíření povolených hodnot `type` (jméno constraintu si najde samo) ------
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.notifications'::regclass
             and contype = 'c'
             and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
  end loop;

  alter table public.notifications add constraint notifications_type_check
    check (type in ('message','match','shift','review','success','info'));
end $$;

-- 2) RLS — uživatel spravuje jen svoje upozornění ---------------------------
-- DŮLEŽITÉ: upozornění vytváří VÝHRADNĚ serverové triggery níže (SECURITY
-- DEFINER → obchází RLS). Klientský INSERT je ZAKÁZANÝ (žádná insert policy),
-- aby stará/nacachovaná appka nemohla vytvořit duplicitní notifikace.
alter table public.notifications enable row level security;

drop policy if exists "Users read own notifications"   on public.notifications;
drop policy if exists "Users insert own notifications" on public.notifications;  -- záměrně nevytváříme znovu
drop policy if exists "System can insert notifications" on public.notifications; -- starší policy, taky pryč
drop policy if exists "Users update own notifications" on public.notifications;
drop policy if exists "Users delete own notifications" on public.notifications;

create policy "Users read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications
  for update using (auth.uid() = user_id);
create policy "Users delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

-- 3) Index pro načtení posledních upozornění uživatele ----------------------
create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

-- 4a) Trigger: nová zpráva / nabídka směny → upozornění příjemci -------------
create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m         record;
  recipient uuid;
  company   text;
  ntype     text;
  ntitle    text;
  nbody     text;
begin
  select mt.worker_id, j.employer_id,
         coalesce(ep.company_name, ep.name) as emp_company,
         wp.name as worker_name
    into m
    from public.matches mt
    join public.jobs j       on j.id  = mt.job_id
    left join public.profiles ep on ep.id = j.employer_id
    left join public.profiles wp on wp.id = mt.worker_id
   where mt.id = NEW.match_id;
  if not found then return NEW; end if;

  -- příjemce = účastník matche, který NENÍ odesílatel
  if NEW.sender_id = m.worker_id then
    recipient := m.employer_id;    -- brigádník píše → notifikuj firmu
  else
    recipient := m.worker_id;      -- firma píše → notifikuj brigádníka
  end if;
  if recipient is null or recipient = NEW.sender_id then return NEW; end if;

  company := coalesce(m.emp_company, 'Zaměstnavatel');

  if NEW.type = 'shift_offer' then
    ntype := 'shift'; ntitle := 'Nová nabídka směny';
    nbody := company || ' ti nabídl/a směnu. Otevři chat.';
  elsif NEW.type = 'interview_offer' then
    ntype := 'shift'; ntitle := 'Pozvánka na pohovor';
    nbody := company || ' tě zve na pohovor. Otevři chat.';
  else
    ntype := 'message';
    if NEW.sender_id = m.employer_id then
      ntitle := company;                                   -- firma → brigádníkovi
    else
      ntitle := coalesce(m.worker_name, 'Brigádník');      -- brigádník → firmě
    end if;
    nbody := coalesce(NEW.text, '');
  end if;

  insert into public.notifications (user_id, type, match_id, title, body, read)
  values (recipient, ntype, NEW.match_id, ntitle, nbody, false);
  return NEW;
end $$;

drop trigger if exists trg_notify_on_message on public.messages;
create trigger trg_notify_on_message
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- 4b) Trigger: shoda přijata (match → accepted) → 'match' brigádníkovi -------
create or replace function public.notify_on_match_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare company text;
begin
  if NEW.status = 'accepted' and coalesce(OLD.status, '') <> 'accepted' then
    select coalesce(ep.company_name, ep.name, 'Zaměstnavatel')
      into company
      from public.jobs j
      left join public.profiles ep on ep.id = j.employer_id
     where j.id = NEW.job_id;

    insert into public.notifications (user_id, type, match_id, title, body, read)
    values (NEW.worker_id, 'match', NEW.id, 'Máte shodu! 🎉',
            coalesce(company, 'Zaměstnavatel') || ' má zájem o tvůj profil. Napiš jim!', false);
  end if;
  return NEW;
end $$;

drop trigger if exists trg_notify_on_match_accepted on public.matches;
create trigger trg_notify_on_match_accepted
  after update on public.matches
  for each row execute function public.notify_on_match_accepted();

-- 4c) Trigger: nová recenze → 'review' hodnocenému -------------------------
create or replace function public.notify_on_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare rname text;
begin
  select coalesce(rp.company_name, rp.name, 'Někdo')
    into rname from public.profiles rp where rp.id = NEW.reviewer_id;

  insert into public.notifications (user_id, type, match_id, title, body, read)
  values (NEW.reviewed_id, 'review', NEW.match_id, 'Nová recenze ⭐',
          coalesce(rname, 'Někdo') || ' tě právě ohodnotil/a. Mrkni na profil.', false);
  return NEW;
end $$;

drop trigger if exists trg_notify_on_review on public.reviews;
create trigger trg_notify_on_review
  after insert on public.reviews
  for each row execute function public.notify_on_review();

-- 4d) Trigger: potvrzení směny (match → confirmed) → obě strany -------------
create or replace function public.notify_on_shift_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare company text; wname text; emp uuid;
begin
  if NEW.status = 'confirmed' and coalesce(OLD.status, '') <> 'confirmed' then
    select coalesce(ep.company_name, ep.name, 'Zaměstnavatel'),
           j.employer_id,
           coalesce(wp.name, 'Brigádník')
      into company, emp, wname
      from public.jobs j
      left join public.profiles ep on ep.id = j.employer_id
      left join public.profiles wp on wp.id = NEW.worker_id
     where j.id = NEW.job_id;

    -- brigádníkovi
    insert into public.notifications (user_id, type, match_id, title, body, read)
    values (NEW.worker_id, 'shift', NEW.id, 'Brigáda potvrzená ✅',
            'Tvoje směna u ' || coalesce(company, 'zaměstnavatele') || ' je potvrzená.', false);

    -- zaměstnavateli
    if emp is not null then
      insert into public.notifications (user_id, type, match_id, title, body, read)
      values (emp, 'shift', NEW.id, 'Směna potvrzená ✅',
              wname || ' potvrdil/a směnu.', false);
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_notify_on_shift_confirmed on public.matches;
create trigger trg_notify_on_shift_confirmed
  after update on public.matches
  for each row execute function public.notify_on_shift_confirmed();

-- 4e) Trigger: nový zájem/kandidát (match INSERT) → upozornění firmě ---------
-- Slouží i jako SPOLEHLIVÝ realtime signál pro employer dashboard (kanál
-- notifications má triviální RLS user_id=auth.uid(), na rozdíl od matches).
create or replace function public.notify_on_match_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare emp uuid; jtitle text; wname text;
begin
  select j.employer_id, j.title, coalesce(wp.name, 'Brigádník')
    into emp, jtitle, wname
    from public.jobs j
    left join public.profiles wp on wp.id = NEW.worker_id
   where j.id = NEW.job_id;

  if emp is null or emp = NEW.worker_id then return NEW; end if;

  insert into public.notifications (user_id, type, match_id, title, body, read)
  values (emp, 'match', NEW.id,
          case when NEW.super then 'Superzájem o brigádu ⭐' else 'Nový zájem o brigádu 👤' end,
          wname || ' má zájem o ' || coalesce(jtitle, 'tvou brigádu') || '.', false);
  return NEW;
end $$;

drop trigger if exists trg_notify_on_match_created on public.matches;
create trigger trg_notify_on_match_created
  after insert on public.matches
  for each row execute function public.notify_on_match_created();

-- 4f) Trigger: brigádník zrušil potvrzenou směnu (match → cancelled) → firmě -
create or replace function public.notify_on_shift_cancelled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare emp uuid; wname text;
begin
  if NEW.status = 'cancelled' and coalesce(OLD.status, '') <> 'cancelled' then
    select j.employer_id, coalesce(wp.name, 'Brigádník')
      into emp, wname
      from public.jobs j
      left join public.profiles wp on wp.id = NEW.worker_id
     where j.id = NEW.job_id;
    if emp is not null then
      insert into public.notifications (user_id, type, match_id, title, body, read)
      values (emp, 'info', NEW.id, 'Zrušená směna ⚠️', wname || ' zrušil/a potvrzenou směnu.', false);
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_notify_on_shift_cancelled on public.matches;
create trigger trg_notify_on_shift_cancelled
  after update on public.matches
  for each row execute function public.notify_on_shift_cancelled();

-- 5) Realtime — ať appka dostane nové upozornění okamžitě -------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
