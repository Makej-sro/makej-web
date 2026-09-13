-- ═══════════════════════════════════════════════════════════════════════════
-- ODESÍLÁNÍ E-MAILŮ NA JEDNOM MÍSTĚ (makej_posli_email)
-- ───────────────────────────────────────────────────────────────────────────
-- Migrace `makej_posli_email_reply_to_a_odhlaseni` (2026-09-11).
--
-- PROČ: dosud si každý trigger sám četl klíč z Vaultu a skládal volání
-- Resendu. Přidání jediné hlavičky znamenalo přepsat obě funkce — a při
-- třetím e-mailu tři.
--
-- REPLY-TO: odesílatel `ahoj@makej.eu` je schránka, kterou nikdo nečte.
-- Odpovědi směrujeme na podpora@makej.eu, ať dotaz nespadne do díry.
--
-- LIST-UNSUBSCRIBE jen u hromadné pošty (p_seznam = true). Schránka pak vedle
-- odesílatele ukáže vlastní tlačítko Odhlásit. Je to obrana reputace domény:
-- kdo e-maily nechce, jinak sáhne po tlačítku Spam, a jedna stížnost váží víc
-- než stovky doručených zpráv. U potvrzení registrace hlavička nedává smysl —
-- z vlastního účtu se odhlásit nejde.
--
-- Zatím `mailto:` — odhlašovací stránka neexistuje, odhlášení musí někdo
-- vyřídit ručně. `List-Unsubscribe-Post` (one-click) SCHVÁLNĚ nepřidáváme:
-- patří jen k HTTPS odkazu, který umí POST.
--
-- POZOR PŘI OVĚŘOVÁNÍ: Resend v GET /emails/<id> vlastní hlavičky **nevrací**
-- (nejsou ani mezi klíči odpovědi), takže se jejich odeslání přes API ověřit
-- nedá. Kontrola jde jen ve schránce — „Zobrazit originál" nebo tlačítko
-- Odhlásit vedle odesílatele.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.makej_posli_email(
  p_to      text,
  p_subject text,
  p_html    text,
  p_seznam  boolean default false
) returns void
language plpgsql
security definer
set search_path = public, net, vault, extensions
as $fn$
declare
  v_klic text;
  v_telo jsonb;
begin
  select decrypted_secret into v_klic
    from vault.decrypted_secrets where name = 'resend_api_key';
  if v_klic is null or btrim(v_klic) = '' then
    raise warning 'makej_posli_email: ve Vaultu chybí resend_api_key, e-mail pro % neodeslán', p_to;
    return;
  end if;

  v_telo := jsonb_build_object(
    'from',     'Makej <ahoj@makej.eu>',
    'reply_to', 'podpora@makej.eu',
    'to',       p_to,
    'subject',  p_subject,
    'html',     p_html
  );

  if p_seznam then
    v_telo := v_telo || jsonb_build_object('headers', jsonb_build_object(
      'List-Unsubscribe', '<mailto:podpora@makej.eu?subject=Odhlasit>'
    ));
  end if;

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_klic,
                                  'Content-Type',  'application/json'),
    body    := v_telo
  );
end;
$fn$;

comment on function public.makej_posli_email(text, text, text, boolean) is
  'Odešle e-mail přes Resend (klíč z Vaultu). p_seznam = hromadná pošta → přidá List-Unsubscribe.';
