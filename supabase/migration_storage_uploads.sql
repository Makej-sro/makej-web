-- Nahrávání obrázků (profilovky, fotky inzerátů, logo/fotky firmy) — 2026-07-19
-- ===========================================================================
-- Public bucket `uploads`. Do DB ukládáme jen veřejnou URL. Cesta souboru
-- vždy začíná složkou = user id (`{uid}/…`), aby nikdo nemohl přepsat cizí
-- soubory. Veřejné čtení (obrázky se zobrazují přes URL), zápis/mazání jen do
-- vlastní složky.

-- 1) Bucket (obrázky do 5 MB) ------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) RLS policies na storage.objects pro bucket 'uploads' --------------------
drop policy if exists "uploads public read"  on storage.objects;
drop policy if exists "uploads own insert"   on storage.objects;
drop policy if exists "uploads own update"   on storage.objects;
drop policy if exists "uploads own delete"   on storage.objects;

create policy "uploads public read" on storage.objects
  for select using (bucket_id = 'uploads');

create policy "uploads own insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "uploads own update" on storage.objects
  for update to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "uploads own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3) Galerie fotek u inzerátu (víc fotek) -----------------------------------
alter table public.jobs add column if not exists photos jsonb default '[]';
