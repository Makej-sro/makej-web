-- Přílohy a hlasovky v chatu — 2026-07-22
-- ===========================================================================
-- Neveřejný bucket `chat-prilohy`. K souboru mají přístup JEN účastníci daného
-- matche (brigádník nebo firma, přes can_act_as). Cesta souboru vždy začíná
-- složkou = match_id (`{match_id}/…`). Bucket je private → appka zobrazuje
-- soubory přes podepsané (signed) URL s omezenou platností; do messages.file_url
-- se ukládá cesta v bucketu (ne veřejná URL).

-- 1) Sloupce v messages ------------------------------------------------------
alter table public.messages
  add column if not exists file_url   text,
  add column if not exists file_type  text,     -- 'image' | 'file' | 'audio'
  add column if not exists file_name  text,
  add column if not exists file_size  bigint,
  add column if not exists duration   integer;  -- délka hlasovky v sekundách

-- 2) Neveřejný bucket (do 25 MB) --------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-prilohy', 'chat-prilohy', false, 26214400)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

-- 3) RLS na storage.objects — přístup jen účastníci matche ------------------
-- match_id je první složka v cestě: '{match_id}/soubor.jpg'
drop policy if exists "chat prilohy read participants"   on storage.objects;
drop policy if exists "chat prilohy insert participants" on storage.objects;
drop policy if exists "chat prilohy delete participants" on storage.objects;

create policy "chat prilohy read participants" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'chat-prilohy'
    and exists (
      select 1 from public.matches m
      join public.jobs j on j.id = m.job_id
      where m.id::text = (storage.foldername(name))[1]
        and (m.worker_id = auth.uid() or public.can_act_as(j.employer_id))
    )
  );

create policy "chat prilohy insert participants" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-prilohy'
    and exists (
      select 1 from public.matches m
      join public.jobs j on j.id = m.job_id
      where m.id::text = (storage.foldername(name))[1]
        and (m.worker_id = auth.uid() or public.can_act_as(j.employer_id))
    )
  );

create policy "chat prilohy delete participants" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'chat-prilohy'
    and exists (
      select 1 from public.matches m
      join public.jobs j on j.id = m.job_id
      where m.id::text = (storage.foldername(name))[1]
        and (m.worker_id = auth.uid() or public.can_act_as(j.employer_id))
    )
  );
