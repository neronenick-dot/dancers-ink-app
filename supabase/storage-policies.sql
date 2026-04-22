-- ============================================================
-- DANCERS INK — Storage Policies
-- Run this in Supabase SQL Editor AFTER running schema.sql
-- and AFTER the "media" bucket has been created.
-- ============================================================

create policy "media: public read"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media: admins upload"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());

create policy "media: admins delete"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());
