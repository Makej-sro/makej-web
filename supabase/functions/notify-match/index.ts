import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM_EMAIL        = 'Makej! <notifikace@makej.eu>';
const BASE_URL          = 'https://www.makej.eu';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors() });

  try {
    const body = await req.json();
    const { type, table, record, old_record } = body;

    // ── Employer: new interest (matches INSERT) ────────────────
    if (table === 'matches' && type === 'INSERT') {
      const { data: match } = await sb
        .from('matches')
        .select('*, worker:profiles!matches_worker_id_fkey(*), job:jobs(*, employer:profiles!jobs_employer_id_fkey(*))')
        .eq('id', record.id)
        .single();

      if (!match) return ok();

      const { data: { user: empUser } } = await sb.auth.admin.getUserById(match.job?.employer_id);
      const empEmail   = empUser?.email;
      const workerName = match.worker?.name || 'Brigádník';
      const jobTitle   = match.job?.title   || 'brigáda';

      if (empEmail) {
        await sendEmail({
          to: empEmail,
          subject: `👤 Nový zájem o brigádu: ${jobTitle}`,
          html: emailTemplate({
            heading: 'Nový zájem o brigádu',
            body: `<strong>${workerName}</strong> projevil/a zájem o tvou brigádu <strong>${jobTitle}</strong>.<br/>Přejdi do dashboardu, prohlédni si profil a přijmi nebo odmítni kandidáta.`,
            cta: { label: 'Otevřít dashboard', href: `${BASE_URL}/employer/` },
            accent: '#5B6BFF',
          }),
        });
      }
    }

    // ── Worker: accepted (matches UPDATE status → accepted) ────
    if (table === 'matches' && type === 'UPDATE' && record.status === 'accepted' && old_record?.status !== 'accepted') {
      const { data: match } = await sb
        .from('matches')
        .select('*, job:jobs(*, employer:profiles!jobs_employer_id_fkey(*))')
        .eq('id', record.id)
        .single();

      if (!match) return ok();

      const { data: { user: workerUser } } = await sb.auth.admin.getUserById(record.worker_id);
      const workerEmail = workerUser?.email;
      const companyName = match.job?.employer?.company_name || match.job?.employer?.name || 'Zaměstnavatel';
      const jobTitle    = match.job?.title || 'brigáda';

      if (workerEmail) {
        await sendEmail({
          to: workerEmail,
          subject: `🎉 ${companyName} tě přijal/a!`,
          html: emailTemplate({
            heading: 'Gratulujeme, přijat/a!',
            body: `<strong>${companyName}</strong> přijal/a tvůj zájem o brigádu <strong>${jobTitle}</strong>.<br/>Chat je teď otevřený — napiš jim a dohodněte detaily.`,
            cta: { label: 'Otevřít zprávy', href: `${BASE_URL}/worker/` },
            accent: '#5BD68A',
          }),
        });
      }
    }

    return ok();
  } catch (err) {
    console.error('notify-match error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors() });
  }
});

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) console.error('Resend error:', await res.text());
}

function emailTemplate({ heading, body, cta, accent }: {
  heading: string; body: string;
  cta: { label: string; href: string };
  accent: string;
}) {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07071a;font-family:'Segoe UI',Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07071a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#16163b;border-radius:20px;border:1px solid rgba(208,208,255,0.12);overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0020F6,#2D2CA7);padding:28px 32px;text-align:center;">
          <div style="font-size:32px;font-weight:900;color:#fff;letter-spacing:-1px;">makej!</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:2px;text-transform:uppercase;margin-top:4px;">for work</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:16px;">${heading}</div>
          <div style="font-size:15px;color:#c8c8e8;line-height:1.6;margin-bottom:28px;">${body}</div>
          <a href="${cta.href}" style="display:inline-block;padding:14px 28px;background:${accent};color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">${cta.label} →</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(208,208,255,0.1);text-align:center;">
          <div style="font-size:12px;color:#6e6ea8;">Makej! · <a href="${BASE_URL}" style="color:#8080ff;text-decoration:none;">makej.eu</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const ok  = () => new Response('ok', { headers: cors() });
const cors = () => ({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' });
