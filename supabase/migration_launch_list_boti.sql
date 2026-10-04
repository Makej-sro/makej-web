-- ═══════════════════════════════════════════════════════════════════════════
-- ČEKACÍ LIST: ochrana proti botům  (nasazeno 4. 10. 2026)
-- ───────────────────────────────────────────────────────────────────────────
-- CO SE DĚLO: od 29. 9. 2026 chodilo přes `join_launch_list` 15–17 zápisů
-- denně, rovnoměrně kolem dokola i ve 3 ráno — proti 0–3 za den předtím.
-- Šlo o vykradené zahraniční firemní adresy (@jmp.com, @vcu.edu, @ptvgroup.com…)
-- a gmaily s tečkovým trikem (ha.r.ry@gmail.com — Gmail tečky ignoruje, takže
-- stejná schránka projde znovu a obejde `on conflict`). Každému z nich odešel
-- uvítací e-mail „Seš na seznamu!", tedy nevyžádaná pošta skutečným lidem.
-- Riziko: stížnosti na spam → pokles reputace domény u Resendu → přestanou
-- chodit i e-maily, na kterých záleží (potvrzení registrace).
--
-- JAK SE TO POZNALO: edge logy ukázaly, že všechny ty požadavky chodí přes Tor
-- (Cloudflare je značí zemí `T1`, jeden z exitů se tak přímo jmenuje), pokaždé
-- z jiné IP — limit na IP by byl k ničemu. Mají ale společné, že nemají
-- hlavičku `Origin`. Prohlížeč ji při odeslání formuláře na jiný původ
-- (makej.eu → supabase.co) posílá vždy, skript ne.
--
-- POZOR: `Origin` NENÍ bezpečnostní hranice — útočník si ji nastavit může.
-- Je to filtr na boty, ne autentizace. Až se naučí hlavičku posílat, přijde
-- na řadu Turnstile; proto se zahozené pokusy logují, ať je to vidět.
--
-- NOVÝ KLIENT (mobilní appka apod.): doplnit jeho původ do `v_povolene`,
-- jinak se jeho zápisy budou tiše zahazovat.
--
-- DRUHÁ VRSTVA je na webu (index.html + 4 podstránky, script.js, style.css):
-- skryté pole `wl-past` a odmítnutí odeslání dřív než za 2 s.
--
-- KONTROLA, jestli se bot přizpůsobil:
--   select duvod, count(*) from public.launch_emails_zahozene group by 1;
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1 · Sloupce pro dohled ──────────────────────────────────────────────────
alter table public.launch_emails
  add column if not exists origin    text,
  add column if not exists ip        text,
  add column if not exists podezrele boolean not null default false,
  add column if not exists duvod     text;

comment on column public.launch_emails.podezrele is
  'true = zápis z vlny botů (29. 9.–4. 10. 2026). NEPOSÍLAT na ně hromadnou poštu.';

-- ── 2 · Zahozené pokusy ────────────────────────────────────────────────────
create table if not exists public.launch_emails_zahozene (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  source     text,
  origin     text,
  ip         text,
  ua         text,
  duvod      text not null,
  created_at timestamptz not null default now()
);

alter table public.launch_emails_zahozene enable row level security;
-- Žádná policy = přes PostgREST nikdo nečte ani nepíše; plní to jen
-- SECURITY DEFINER funkce níž.

-- ── 3 · Normalizovaný klíč (zabije tečkový trik u Gmailu) ──────────────────
create or replace function public.email_klic(p_email text)
returns text
language sql
immutable
as $$
  with e as (
    select lower(btrim(p_email)) as adr
  ), c as (
    select split_part(adr, '@', 1) as mistni,
           split_part(adr, '@', 2) as domena
    from e
  )
  select case
    when domena in ('gmail.com', 'googlemail.com')
      -- Gmail ignoruje tečky i vše za '+'; obojí vede do stejné schránky.
      then replace(split_part(mistni, '+', 1), '.', '') || '@gmail.com'
    else split_part(mistni, '+', 1) || '@' || domena
  end
  from c
$$;

-- Jen pro nepodezřelé řádky — mezi označenými boty duplicity jsou a schválně
-- se nechávají, ať je vidět, co se dělo.
create unique index if not exists launch_emails_klic_uniq
  on public.launch_emails (public.email_klic(email))
  where not podezrele;

-- ── 4 · Zápis na seznam ────────────────────────────────────────────────────
create or replace function public.join_launch_list(p_email text, p_source text default null)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_email    text := lower(btrim(coalesce(p_email, '')));
  v_hlavicky json;
  v_origin   text;
  v_ip       text;
  v_ua       text;
  v_ok       boolean;
  v_pocet    integer;
  v_povolene text[] := array['https://makej.eu', 'https://www.makej.eu'];
begin
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'neplatny email' using errcode = '22023';
  end if;

  v_hlavicky := nullif(current_setting('request.headers', true), '')::json;
  if v_hlavicky is null then
    v_ok := true;                       -- mimo PostgREST (psql, migrace)
  else
    -- POZOR na NULL: bez hlavičky Origin vycházelo `v_ok` jako NULL,
    -- `if not NULL` se neprovedlo a zápis prošel — tedy přesně ten případ,
    -- kvůli kterému to celé vzniklo. Proto coalesce a '' místo NULL.
    v_origin := coalesce(v_hlavicky ->> 'origin', '');
    v_ip     := coalesce(v_hlavicky ->> 'cf-connecting-ip', v_hlavicky ->> 'x-forwarded-for');
    v_ua     := v_hlavicky ->> 'user-agent';
    v_ok     := coalesce(
                  v_origin = any (v_povolene)
                  or v_origin like 'http://localhost:%'      -- vývoj
                  or v_origin like 'http://127.0.0.1:%'
                  or v_origin like 'https://%.netlify.app',  -- náhledy nasazení
                false);
  end if;

  if not v_ok then
    insert into public.launch_emails_zahozene (email, source, origin, ip, ua, duvod)
    values (v_email, p_source, nullif(v_origin, ''), v_ip, v_ua,
            case when coalesce(v_origin, '') = '' then 'bez hlavicky Origin' else 'cizi Origin' end);
    -- Tváříme se jako úspěch, ať bot nepozná, že neprošel, a nepřizpůsobí se.
    return true;
  end if;

  begin
    insert into public.launch_emails (email, source, origin, ip)
    values (v_email, nullif(btrim(coalesce(p_source, '')), ''), nullif(v_origin, ''), v_ip)
    on conflict (lower(email)) do nothing;
    get diagnostics v_pocet = row_count;
  exception when unique_violation then
    -- Stejná schránka zapsaná jinak (tečky u Gmailu, +štítek) → „už tě máme".
    return false;
  end;

  return v_pocet > 0;
end;
$function$;

-- ── 5 · Označení vlny botů (data, ne schéma) ───────────────────────────────
-- Neomazává se, jen se značí — kdyby se ukázalo, že mezi nimi je někdo
-- skutečný, dá se to vrátit.
update public.launch_emails l
set podezrele = true,
    duvod = case
      when l.email like '%@gmail.com'
       and length(split_part(l.email,'@',1)) - length(replace(split_part(l.email,'@',1),'.','')) >= 2
        then 'gmail tečkový trik'
      else 'vlna botů přes Tor od 29. 9. 2026'
    end
where not l.podezrele
  and (
    (l.email like '%@gmail.com'
     and length(split_part(l.email,'@',1)) - length(replace(split_part(l.email,'@',1),'.','')) >= 2)
 or (l.created_at >= '2026-09-29'
     and not (l.email ~* '\.cz$'
              or split_part(l.email,'@',2) in ('seznam.cz','atlas.cz','email.cz','centrum.cz','post.cz','volny.cz')))
  );
