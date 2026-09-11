-- ═══════════════════════════════════════════════════════════════════════════
-- PODĚKOVÁNÍ ZA REGISTRACI (auth.users → Resend)
-- ───────────────────────────────────────────────────────────────────────────
-- Obálku dodává `makej_email_html` (migration_email_sablona.sql),
-- odeslání `makej_posli_email` (migration_posilani_emailu.sql).
--
-- VLASTNÍ TRIGGER, ne přípis do handle_new_user: ta zakládá profil a výpadek
-- Resendu nesmí rozhodovat o tom, jestli registrace projde. Odesílání je navíc
-- celé v exception bloku, takže účet vznikne i když se e-mail nepovede.
--
-- JMÉNO OD UŽIVATELE jde do HTML přes `html_escape`. Bez toho by si kdokoli
-- registrací pod jménem s „<" poslal do e-mailu vlastní značky.
--
-- BEZ List-Unsubscribe — je to potvrzení vlastního účtu, ne hromadná pošta;
-- odhlásit se z něj nedá.
--
-- POZOR: kdo projde předregistrací, dostane e-maily dva — „Seš na seznamu!"
-- po zadání adresy a „Díky za registraci!" po založení účtu. Je to záměr.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.registrace_email_podekovani()
returns trigger
language plpgsql
security definer
set search_path = public, net, vault, extensions
as $fn$
declare
  v_jmeno text;
  v_pod   text;
begin
  if new.email is null or btrim(new.email) = '' then
    return null;   -- registrace bez e-mailu (telefon) — není kam psát
  end if;

  v_jmeno := public.html_escape(nullif(btrim(coalesce(
               new.raw_user_meta_data->>'name',
               new.raw_user_meta_data->>'company_name', '')), ''));

  v_pod := case when v_jmeno is null or v_jmeno = ''
                then 'Účet máš založený. Přihlásíš se jím, jakmile Makej spustíme.'
                else 'Vítej, ' || v_jmeno || '. Účet máš založený a přihlásíš se jím, jakmile Makej spustíme.'
           end;

  perform public.makej_posli_email(
    new.email,
    'Díky za registraci!',
    public.makej_email_html('Díky za registraci!', v_pod,
      $telo$
        <tr>
          <td style="padding:34px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px dashed #b9c2ff;border-radius:14px;">
              <tr><td style="padding:24px 22px;text-align:center;">
                <div style="font-size:11px;font-weight:800;letter-spacing:1.6px;color:#0020f6;">ZAKLÁDAJÍCÍ ČLEN</div>
                <div style="margin-top:12px;font-size:19px;font-weight:800;line-height:1.3;color:#0a0d2e;">Jsi u toho od začátku</div>
                <p style="margin:12px 0 0;font-size:13.5px;line-height:1.65;color:#6b7394;">
                  Přihlásíš se stejným e-mailem a heslem, zbytek profilu doplníš rovnou v appce. Jako zakládající člen startuješ s lepšími podmínkami než lidi, co přijdou až po spuštění.
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 40px 30px;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" style="border-radius:999px;background-color:#0020f6;background-image:linear-gradient(135deg,#2a45ff,#0020f6);">
              <a href="https://makej.eu" style="display:inline-block;padding:16px 34px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.2px;">Mrknout na Makej</a>
            </td></tr></table>
            <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#4b5578;">
              <strong style="color:#0a0d2e;">Makej</strong> je apka na brigády ve tvém okolí — swajpuješ nabídky, matchuješ se s firmami a jdeš makat. Bez CV, bez pohovorů, zdarma.
            </p>
          </td>
        </tr>
      $telo$),
    false  -- potvrzení registrace není hromadná pošta
  );
  return null;
exception when others then
  -- Registrace má přednost: když Resend selže, účet stejně vznikne.
  raise warning 'registrace_email_podekovani: odeslání pro % selhalo — %', new.email, sqlerrm;
  return null;
end;
$fn$;

drop trigger if exists on_auth_user_created_email on auth.users;
create trigger on_auth_user_created_email
  after insert on auth.users
  for each row execute function public.registrace_email_podekovani();
