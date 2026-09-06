-- ═══════════════════════════════════════════════════════════════════════════
-- EVIDENCE SOUHLASŮ S COOKIES (consent_log + RPC log_consent)
-- ───────────────────────────────────────────────────────────────────────────
-- Web makej.eu má lištu cookies (consent.js). GDPR čl. 7 odst. 1 chce, abychom
-- uměli doložit, že jsme se ptali a co člověk odpověděl. Každé rozhodnutí
-- proto web pošle sem — přes RPC, ne přímým zápisem do tabulky.
--
-- Co se NEUKLÁDÁ: IP adresa ani plný user-agent. Jen solený sha256 otisk
-- (sůl leží v private.consent_salt, mimo API), ze kterého se návštěvník nedá
-- zpětně určit, ale při sporu lze ověřit, že rozhodnutí z daného zařízení
-- přišlo. Bez soli se otisk neukládá — nesolený hash IP by byl osobní údaj.
--
-- Tabulka má RLS bez policy: přes API ji nikdo nečte ani nepíše, zapisuje jen
-- funkce níže (security definer). Dokud funkce neexistuje, web volání tiše
-- zahodí a lišta funguje dál — jen chybí doklad.
--
-- Spustit v Supabase → SQL Editor. Po spuštění VLOŽIT SŮL (krok 2).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) sha256 z pgcrypto (v Supabase žije ve schématu extensions)
create extension if not exists pgcrypto with schema extensions;

-- Schéma, které PostgREST nevystavuje — sůl se přes API nedá přečíst.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.consent_salt (
  id   int  primary key default 1 check (id = 1),   -- jediný řádek
  salt text not null
);

-- 2) SŮL — spustit jednou, ručně (náhodných 32 bajtů). Kdo ji zná, může
--    otisk dopočítat, proto nikdy do repa ani do logu.
-- insert into private.consent_salt (salt)
--   values (encode(extensions.gen_random_bytes(32), 'hex'))
--   on conflict (id) do nothing;

-- 3) evidence
create table if not exists public.consent_log (
  id               bigserial primary key,
  consent_id       text        not null,               -- náhodné UUID z prohlížeče, bez vazby na účet
  policy_version   text        not null,               -- verze textu /zasady-cookies
  consent_version  text        not null,               -- verze kategorií/inventáře v consent.js
  decided_at       timestamptz not null,               -- kdy se člověk rozhodl (z prohlížeče)
  received_at      timestamptz not null default now(), -- kdy to došlo na server
  method           text        not null check (method in ('accept_all', 'reject_all', 'custom', 'withdraw')),
  necessary        boolean     not null default true,
  analytics        boolean     not null,
  marketing        boolean     not null,
  preferences      boolean     not null,
  subject_hash     text        not null default '',    -- sha256(sůl|ip|ua), prázdné bez soli
  ua_family        text        not null default 'other'
);
comment on table  public.consent_log is 'Doložitelnost souhlasu s cookies (§ 89 odst. 3 zák. 127/2005 Sb., GDPR čl. 7). Bez IP, bez plného UA.';
comment on column public.consent_log.subject_hash is 'Solený nevratný otisk IP + UA. Bez soli v private.consent_salt se neukládá.';

-- historie jednoho zařízení (co povolilo, co odvolalo) a dotazy podle data
create index if not exists consent_log_consent_id_idx on public.consent_log (consent_id, decided_at desc);
create index if not exists consent_log_decided_at_idx on public.consent_log (decided_at desc);

alter table public.consent_log enable row level security;
revoke all on public.consent_log from anon, authenticated;
-- žádná policy = přes REST se do tabulky nikdo nedostane

-- 4) zápis přes RPC
create or replace function public.log_consent(
  p_consent_id      text,
  p_consent_version text,
  p_policy_version  text,
  p_decided_at      timestamptz,
  p_method          text,
  p_analytics       boolean,
  p_marketing       boolean,
  p_preferences     boolean
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  hlavicky json;
  ip   text := '';
  ua   text := '';
  sul  text;
  otisk text := '';
  rodina text := 'other';
begin
  -- validace: zprávy neprozrazují nic, jen odmítnou nesmysl
  if p_consent_id is null or length(p_consent_id) = 0 or length(p_consent_id) > 64
     or p_consent_version is null or length(p_consent_version) > 32
     or p_policy_version is null or length(p_policy_version) > 32
     or p_decided_at is null
     or p_decided_at > now() + interval '10 minutes'
     or p_method not in ('accept_all', 'reject_all', 'custom', 'withdraw') then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  -- IP a UA z hlaviček požadavku (PostgREST je dává do request.headers)
  begin
    hlavicky := current_setting('request.headers', true)::json;
  exception when others then
    hlavicky := null;
  end;
  if hlavicky is not null then
    ip := coalesce(split_part(hlavicky ->> 'x-forwarded-for', ',', 1), '');
    ua := coalesce(hlavicky ->> 'user-agent', '');
  end if;

  select salt into sul from private.consent_salt where id = 1;
  if sul is not null and sul <> '' and ip <> '' then
    otisk := encode(extensions.digest(sul || '|' || ip || '|' || ua, 'sha256'), 'hex');
  end if;

  -- jen rodina prohlížeče, plný UA je příliš identifikující
  ua := lower(ua);
  rodina := case
    when ua like '%edg/%' then 'edge'
    when ua like '%opr/%' or ua like '%opera%' then 'opera'
    when ua like '%chrome%' and ua not like '%chromium%' then 'chrome'
    when ua like '%firefox%' then 'firefox'
    when ua like '%safari%' then 'safari'
    else 'other'
  end;

  insert into public.consent_log
    (consent_id, policy_version, consent_version, decided_at, method,
     necessary, analytics, marketing, preferences, subject_hash, ua_family)
  values
    (p_consent_id, p_policy_version, p_consent_version, p_decided_at, p_method,
     true, coalesce(p_analytics, false), coalesce(p_marketing, false), coalesce(p_preferences, false),
     otisk, rodina);
end;
$$;

-- Vystavit jen to, co web opravdu volá.
revoke all on function public.log_consent(text, text, text, timestamptz, text, boolean, boolean, boolean) from public;
grant execute on function public.log_consent(text, text, text, timestamptz, text, boolean, boolean, boolean) to anon, authenticated;

-- 5) Skartace: zásady slibují 3 roky. Bez pg_cron stačí spouštět ručně:
-- delete from public.consent_log where decided_at < now() - interval '3 years';

-- ═══════════════════════════════════════════════════════════════════════════
-- KONTROLA (SQL Editor):
--   select public.log_consent('test-1', '2026-09-06.1', '2026-09-06', now(), 'accept_all', true, false, true);
--   select id, method, analytics, preferences, ua_family, left(subject_hash, 8) from public.consent_log order by id desc limit 3;
--   delete from public.consent_log where consent_id = 'test-1';
-- Z webu (anon klíč) musí `select * from consent_log` vrátit chybu/0 řádků.
-- ═══════════════════════════════════════════════════════════════════════════
