-- ═══════════════════════════════════════════════════════════════════════════
-- PODĚKOVÁNÍ ZA ZAPSÁNÍ NA ČEKACÍ LIST (launch_emails → Resend)
-- ───────────────────────────────────────────────────────────────────────────
-- Obálku dodává `makej_email_html` (migration_email_sablona.sql),
-- odeslání `makej_posli_email` (migration_posilani_emailu.sql).
--
-- JAK TO CHODÍ: web zavolá RPC join_launch_list → INSERT do launch_emails →
-- AFTER INSERT trigger → net.http_post na api.resend.com → e-mail.
--
-- DUPLICITY: opakovaná adresa končí v join_launch_list na `on conflict do
-- nothing`, takže žádný INSERT → trigger se nespustí → druhý e-mail nechodí.
--
-- ODKAZ NESE ADRESU (…/?e=<email>#predregistrace). Web pozná člověka jinak jen
-- podle localStorage, takže kliknutí na mobilu by ho poslalo znovu vyplňovat
-- e-mail, který nám před chvílí dal. Obsluha hashe je ve script.js — POZOR:
-- při změně odkazu je potřeba nasadit OBOJÍ, migraci i web.
--
-- Posílá se jako hromadná pošta (List-Unsubscribe), na rozdíl od potvrzení
-- registrace.
--
-- KONTROLA: select status_code, content from net._http_response
--           order by created desc limit 10;
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pg_net with schema extensions;

create or replace function public.launch_email_podekovani()
returns trigger
language plpgsql
security definer
set search_path = public, net, vault, extensions
as $fn$
declare
  v_odkaz text;
begin
  -- Procenta se kódují první, jinak by se zakódovala i ta právě vložená.
  v_odkaz := 'https://makej.eu/?e=' ||
    replace(replace(replace(replace(replace(replace(
      new.email, '%', '%25'), '+', '%2B'), '&', '%26'),
      '#', '%23'), '?', '%3F'), ' ', '%20') || '#predregistrace';

  perform public.makej_posli_email(
    new.email,
    'Seš na seznamu!',
    replace(public.makej_email_html(
      'Seš na seznamu!',
      'Až Makej spustíme, dáme ti vědět mezi prvními. Do té doby od nás nic nechodí.',
      $telo$
        <tr>
          <td style="padding:34px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px dashed #b9c2ff;border-radius:14px;">
              <tr><td style="padding:24px 22px;text-align:center;">
                <div style="font-size:11px;font-weight:800;letter-spacing:1.6px;color:#0020f6;">ZAKLÁDAJÍCÍ ČLEN</div>
                <div style="margin-top:12px;font-size:19px;font-weight:800;line-height:1.3;color:#0a0d2e;">Dokonči předregistraci a startuješ s náskokem</div>
                <p style="margin:12px 0 0;font-size:13.5px;line-height:1.65;color:#6b7394;">
                  Kdo je u toho od začátku, začíná s lepšími podmínkami než lidi, co přijdou až po spuštění. Zabere to minutu — stačí jméno a heslo.
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 40px 30px;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" style="border-radius:999px;background-color:#0020f6;background-image:linear-gradient(135deg,#2a45ff,#0020f6);">
              <a href="{{ODKAZ}}" style="display:inline-block;padding:16px 34px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.2px;">Dokončit předregistraci</a>
            </td></tr></table>
            <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#4b5578;">
              <strong style="color:#0a0d2e;">Makej</strong> je apka na brigády ve tvém okolí — swajpuješ nabídky, matchuješ se s firmami a jdeš makat. Bez CV, bez pohovorů, zdarma.
            </p>
          </td>
        </tr>
      $telo$), '{{ODKAZ}}', v_odkaz),
    true   -- hromadná pošta → List-Unsubscribe
  );
  return null;
exception when others then
  -- Zápis do seznamu má přednost před e-mailem: nikdy kvůli odeslání nespadne.
  raise warning 'launch_email_podekovani: odeslání pro % selhalo — %', new.email, sqlerrm;
  return null;
end;
$fn$;

drop trigger if exists launch_emails_podekovani on public.launch_emails;
create trigger launch_emails_podekovani
  after insert on public.launch_emails
  for each row execute function public.launch_email_podekovani();
