-- ============================================
-- Makej! — Security hardening (funkce & RPC)
-- Aplikováno na projekt cxegfwfbgcgpwerfbvra dne 2026-07-18
-- Řeší nálezy Supabase security advisora (0011, 0028, 0029).
-- ============================================

-- ── 1) Trigger funkce: odebrat přímé volání přes REST RPC ──────────
-- Běží jen jako databázové triggery, přes /rest/v1/rpc je nikdo volat nemá.
-- Trigger se spustí i bez EXECUTE práva, takže to nic nerozbije.
revoke execute on function
  public.handle_new_user(),
  public.fill_job_on_match_accepted(),
  public.on_review_created(),
  public.penalty_review_on_cancel(),
  public.enforce_active_job_limit()
from public, anon, authenticated;

-- ── 2) Pevný search_path u funkcí, kde chyběl (lint 0011) ──────────
alter function public.handle_new_user()            set search_path = public;
alter function public.fill_job_on_match_accepted() set search_path = public;
alter function public.on_review_created()          set search_path = public;
alter function public.penalty_review_on_cancel()   set search_path = public;
alter function public.delete_my_account()          set search_path = public;
alter function public.makej_level_from_xp(integer) set search_path = public;

-- ── 3) RPC jen pro přihlášené: odebrat anon i PUBLIC ───────────────
-- Tyto funkce volá jen přihlášený uživatel (mazání účtu, týmové pozvánky,
-- rozcestník workspace). anon je nepotřebuje. Nutné odebrat i PUBLIC,
-- protože anon dědí EXECUTE přes něj. authenticated má vlastní explicitní
-- grant, takže mu odebrání PUBLIC neublíží.
revoke execute on function
  public.delete_my_account(),
  public.claim_team_invite(uuid),
  public.my_workspaces()
from public, anon;

-- ── Záměrně PONECHÁNO ──────────────────────────────────────────────
-- can_act_as(uuid) a has_match_for_job(uuid) zůstávají volatelné pro
-- anon i authenticated — jsou zadrátované do RLS politik napříč DB
-- (jobs, matches, messages, profiles, team_members, candidate_notes, …).
-- Odebrání EXECUTE by rozbilo přístup k datům pro přihlášené uživatele.
-- Advisor je proto stále hlásí (0028/0029) — je to očekávané a bezpečné.

-- ── Zbývá zapnout ručně v dashboardu (nejde přes migraci) ──────────
-- Authentication → Policies → "Leaked password protection" (HaveIBeenPwned).
