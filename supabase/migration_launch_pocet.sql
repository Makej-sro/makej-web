-- ═══════════════════════════════════════════════════════════════════════════
-- POČET LIDÍ NA ČEKACÍM LISTU
-- ───────────────────────────────────────────────────────────────────────────
-- Čekací list na webu ukazuje „X lidí už u nás je" a po zápisu „jsi X. v řadě".
-- Musí to být SKUTEČNÉ číslo — vymyšlené číslo na veřejném webu je slib, který
-- nemáme čím krýt, a první, kdo si ho ověří, ztratí důvěru ve zbytek.
--
-- Přečíst `launch_emails` napřímo z webu nejde a nemá: tabulka má zapnuté RLS
-- bez čtecí policy, takže by se přes ni daly vytáhnout cizí e-maily. Funkce
-- proto běží jako vlastník a vrací JEN počet, nic jiného.
--
-- Dokud tahle funkce neexistuje, web ten řádek s počtem vůbec nezobrazí.
--
-- Spustit v Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.launch_list_pocet()
returns integer
language sql
security definer
stable
set search_path = public
as $$
  select count(*)::int from public.launch_emails;
$$;

-- Vystavit jen to, co web opravdu volá.
revoke all on function public.launch_list_pocet() from public;
grant execute on function public.launch_list_pocet() to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- KONTROLA: má vrátit jedno číslo, ne seznam adres.
-- ═══════════════════════════════════════════════════════════════════════════
-- select public.launch_list_pocet();
