-- Profil firmy — nové údaje (2026-09-26, Yasin + Claude)
-- Dashboard má od 26. 9. samostatnou záložku „Profil firmy" (employer-firma.jsx).
-- Tyhle sloupce ukládá navíc k těm, které v profiles už jsou (company_name,
-- industry, bio, ic, address, website, kraj, logo_url, photos, socials…).
-- Všechno additivní, nic stávajícího se nemění. Fotky jdou do bucketu
-- `uploads`, do DB jen veřejná URL.
alter table public.profiles add column if not exists cover_url     text;   -- velká fotka pozadí profilu
alter table public.profiles add column if not exists founded       text;   -- rok založení (appka ho už čte)
alter table public.profiles add column if not exists career_url    text;   -- odkaz na kariérní stránku
alter table public.profiles add column if not exists phone         text;   -- telefon pro uchazeče
alter table public.profiles add column if not exists contact_email text;   -- e-mail pro uchazeče (≠ přihlašovací)
alter table public.profiles add column if not exists opening_hours jsonb;  -- { po: "8:00–16:30", …, ne: "" }
