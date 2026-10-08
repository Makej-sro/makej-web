-- ═══════════════════════════════════════════════════════════════════════════
-- ZÁJEM O PARTNERSTVÍ  (/partneri → partner_zajem → oznámení Honzovi)
-- ───────────────────────────────────────────────────────────────────────────
-- JAK TO CHODÍ: web zavolá RPC `partner_zajem_pridat` → INSERT do
-- `partner_zajem` → AFTER INSERT trigger → `makej_posli_email` → Resend.
-- Adresát je `v_komu` ve funkci `partner_zajem_oznameni` níž.
--
-- OCHRANA PROTI BOTŮM je stejná jako u čekacího listu a ze stejného důvodu:
-- formulář visí na veřejné stránce bez přihlášení. Kontroluje se hlavička
-- `Origin` — prohlížeč ji při odeslání na jiný původ (makej.eu → supabase.co)
-- posílá vždy, skript ne.
--
-- POZOR NA NULL: bez hlavičky Origin vycházelo u čekacího listu `v_ok` jako
-- NULL, `if not NULL` se neprovedlo a zápis prošel — tedy přesně ten případ,
-- kvůli kterému to vzniklo. Proto i tady `coalesce(..., false)` a '' místo NULL.
--
-- `Origin` NENÍ bezpečnostní hranice — útočník si ji nastavit může. Je to
-- filtr na boty, ne autentizace. Zahozené pokusy se logují do
-- `partner_zajem_zahozene`, ať je vidět, kdyby se bot přizpůsobil.
--
-- DRUHÁ VRSTVA je na webu (partneri.html + script.js): skryté pole `pt-past`
-- a odmítnutí odeslání dřív než za 2 s.
--
-- NOVÝ KLIENT (jiná doména, appka): doplnit jeho původ do `v_povolene`,
-- jinak se jeho zápisy budou tiše zahazovat.
--
-- KONTROLA:
--   select * from public.partner_zajem order by created_at desc;
--   select duvod, count(*) from public.partner_zajem_zahozene group by 1;
--   select status_code, content from net._http_response order by created desc limit 5;
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1 · Tabulka ────────────────────────────────────────────────────────────
create table if not exists public.partner_zajem (
  id         uuid primary key default gen_random_uuid(),
  jmeno      text,
  organizace text,
  email      text not null,
  telefon    text,                      -- nepovinné, formulář ho nevyžaduje
  typ        text,                      -- firma | skola | neziskovka | medium
  zprava     text,
  origin     text,
  ip         text,
  vyrizeno   boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.partner_zajem is
  'Poptávky z formuláře na /partneri. Plní jen RPC partner_zajem_pridat.';
comment on column public.partner_zajem.vyrizeno is
  'Ruční příznak — že se s poptávkou někdo ozval. Nic ho nenastavuje samo.';

alter table public.partner_zajem enable row level security;
-- Žádná policy = přes PostgREST nikdo nečte ani nepíše. Zapisuje pouze
-- SECURITY DEFINER funkce níž, čte se z dashboardu Supabase.

create index if not exists partner_zajem_created_idx
  on public.partner_zajem (created_at desc);

-- ── 2 · Zahozené pokusy ────────────────────────────────────────────────────
create table if not exists public.partner_zajem_zahozene (
  id         uuid primary key default gen_random_uuid(),
  email      text,
  organizace text,
  telefon    text,
  origin     text,
  ip         text,
  ua         text,
  duvod      text not null,
  created_at timestamptz not null default now()
);

alter table public.partner_zajem_zahozene enable row level security;

-- ── 3 · Zápis poptávky ─────────────────────────────────────────────────────
create or replace function public.partner_zajem_pridat(
  p_jmeno      text default null,
  p_organizace text default null,
  p_email      text default null,
  p_typ        text default null,
  p_zprava     text default null,
  p_telefon    text default null
) returns boolean
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
  v_povolene text[] := array['https://makej.eu', 'https://www.makej.eu'];
begin
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'neplatny email' using errcode = '22023';
  end if;

  v_hlavicky := nullif(current_setting('request.headers', true), '')::json;
  if v_hlavicky is null then
    v_ok := true;                       -- mimo PostgREST (psql, migrace)
  else
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
    insert into public.partner_zajem_zahozene (email, organizace, telefon, origin, ip, ua, duvod)
    values (v_email, left(btrim(coalesce(p_organizace, '')), 200),
            left(btrim(coalesce(p_telefon, '')), 40),
            nullif(v_origin, ''), v_ip, v_ua,
            case when coalesce(v_origin, '') = '' then 'bez hlavicky Origin' else 'cizi Origin' end);
    -- Tváříme se jako úspěch, ať bot nepozná, že neprošel, a nepřizpůsobí se.
    return true;
  end if;

  -- Délky ořezané schválně: pole na webu limit nemají a do oznámení se to
  -- vypisuje, takže by se tudy dal poslat libovolně dlouhý text.
  insert into public.partner_zajem (jmeno, organizace, email, telefon, typ, zprava, origin, ip)
  values (
    nullif(left(btrim(coalesce(p_jmeno, '')), 200), ''),
    nullif(left(btrim(coalesce(p_organizace, '')), 200), ''),
    v_email,
    nullif(left(btrim(coalesce(p_telefon, '')), 40), ''),
    case when p_typ in ('firma', 'skola', 'neziskovka', 'medium') then p_typ end,
    nullif(left(btrim(coalesce(p_zprava, '')), 4000), ''),
    nullif(v_origin, ''),
    v_ip
  );

  return true;
end;
$function$;

comment on function public.partner_zajem_pridat is
  'Zápis poptávky z /partneri. Filtruje boty podle hlavičky Origin, zahozené loguje.';

revoke all on function public.partner_zajem_pridat(text, text, text, text, text, text) from public;
grant execute on function public.partner_zajem_pridat(text, text, text, text, text, text) to anon, authenticated;

-- ── 4 · Oznámení o poptávce ────────────────────────────────────────────────
-- Obálku dodává `makej_email_html` (migration_email_sablona.sql), odeslání
-- `makej_posli_email` (migration_posilani_emailu.sql).
--
-- POZOR, ŠABLONA CHCE CELÝ ŘÁDEK TABULKY. `makej_email_html` vkládá {{TELO}}
-- mezi `</tr>` a `<tr>`, takže tělo musí být `<tr><td>…</td></tr>`. Holé <p>
-- prohlížeč z tabulky vystrčí ven (foster parenting) a text se vykreslí mimo
-- kartu, nad ní — na tohle se přišlo až při kontrole hotového e-mailu.
--
-- Patička šablony je psaná pro poštu lidem („nechal/a jsi adresu na makej.eu“),
-- což u interního oznámení nesedí — věta se proto nahradí. Stejný postup
-- používá uvítací e-mail čekacího listu.
--
-- Skládání je ve VLASTNÍ FUNKCI, ne přímo v triggeru: jen tak jde vyrobit
-- náhled přesně toho, co se odesílá, bez opisování HTML (opsaná kopie by se
-- po první úpravě rozešla):
--   select public.partner_zajem_email_html(p) from public.partner_zajem p limit 1;
--
-- Nevyplněná pole se NEVYNECHÁVAJÍ, ale píšou jako „neuvedeno“ — jinak by
-- nebylo poznat, jestli to zájemce nedal, nebo se to cestou ztratilo.
create or replace function public.partner_zajem_email_html(p public.partner_zajem)
returns text
language sql
stable
as $fn$
  select replace(
    public.makej_email_html(
      'Nová poptávka partnerství',
      'Přišla z formuláře na makej.eu/partneri.',
      '<tr><td style="padding:30px 40px 26px;">' ||
        '<table width="100%" cellpadding="0" cellspacing="0" border="0">' ||
          '<tr><td style="padding:0 0 13px;font-size:13px;color:#8a93b2;width:104px;vertical-align:top;">Organizace</td>' ||
            '<td style="padding:0 0 13px;font-size:16px;font-weight:800;color:#0a0d2e;">' ||
            coalesce(p.organizace, '<span style="font-weight:400;color:#8a93b2;">neuvedeno</span>') || '</td></tr>' ||
          '<tr><td style="padding:0 0 13px;font-size:13px;color:#8a93b2;vertical-align:top;">Typ</td>' ||
            '<td style="padding:0 0 13px;font-size:15px;color:#0a0d2e;">' ||
            coalesce(p.typ, '<span style="color:#8a93b2;">neuvedeno</span>') || '</td></tr>' ||
          '<tr><td style="padding:0 0 13px;font-size:13px;color:#8a93b2;vertical-align:top;">Kontakt</td>' ||
            '<td style="padding:0 0 13px;font-size:15px;color:#0a0d2e;">' ||
            coalesce(p.jmeno, '<span style="color:#8a93b2;">neuvedeno</span>') || '</td></tr>' ||
          '<tr><td style="padding:0 0 13px;font-size:13px;color:#8a93b2;vertical-align:top;">E-mail</td>' ||
            '<td style="padding:0 0 13px;font-size:15px;"><a href="mailto:' || p.email ||
            '" style="color:#0020f6;font-weight:700;text-decoration:none;">' || p.email || '</a></td></tr>' ||
          '<tr><td style="padding:0 0 13px;font-size:13px;color:#8a93b2;vertical-align:top;">Telefon</td>' ||
            '<td style="padding:0 0 13px;font-size:15px;">' ||
            case when p.telefon is null
                 then '<span style="color:#8a93b2;">neuvedeno</span>'
                 -- Do tel: patří číslo bez mezer, zobrazuje se tak, jak ho napsal.
                 else '<a href="tel:' || regexp_replace(p.telefon, '[^0-9+]', '', 'g') ||
                      '" style="color:#0020f6;font-weight:700;text-decoration:none;">' || p.telefon || '</a>'
            end || '</td></tr>' ||
          '<tr><td style="padding:0;font-size:13px;color:#8a93b2;vertical-align:top;">Přišlo</td>' ||
            '<td style="padding:0;font-size:15px;color:#0a0d2e;">' ||
            to_char(p.created_at at time zone 'Europe/Prague', 'DD.MM.YYYY v HH24:MI') || '</td></tr>' ||
        '</table>' ||
        case when p.zprava is null then ''
             else '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;background:#f5f6fd;border-radius:12px;">' ||
                  '<tr><td style="padding:18px 20px;font-size:14.5px;line-height:1.65;color:#2d3350;white-space:pre-wrap;">' ||
                  replace(replace(replace(p.zprava, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') ||
                  '</td></tr></table>' end ||
      '</td></tr>'
    ),
    'Tenhle e-mail ti přišel, protože jsi svou adresu nechal/a na ',
    'Interní oznámení. Poptávka dorazila z formuláře na '
  );
$fn$;

-- Trigger už jen rozhodne, komu to poslat.
create or replace function public.partner_zajem_oznameni()
returns trigger
language plpgsql
security definer
set search_path = public, net, vault, extensions
as $fn$
declare
  -- KAM CHODÍ OZNÁMENÍ. Měnit jen tady. `reply_to` v `makej_posli_email` je
  -- natvrdo podpora@makej.eu, takže „Odpovědět“ by šlo na podporu — proto
  -- jsou e-mail i telefon v těle jako klikací odkazy.
  v_komu text := 'jan.weber@makej.eu';
begin
  perform public.makej_posli_email(
    v_komu,
    'Nová poptávka partnerství — ' || coalesce(new.organizace, new.email),
    public.partner_zajem_email_html(new),
    false
  );
  return new;
end;
$fn$;

drop trigger if exists trg_partner_zajem_oznameni on public.partner_zajem;
create trigger trg_partner_zajem_oznameni
  after insert on public.partner_zajem
  for each row execute function public.partner_zajem_oznameni();
