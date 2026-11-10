-- ====================================================================
-- منصة شقتي (Sha2ety) — إعداد حاويات التخزين في Supabase Storage
-- ====================================================================

-- 1. إنشاء الحاويات (Buckets) لتخزين المستندات والصور
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values 
  (
    'property-documents',
    'property-documents',
    true,
    20971520, -- 20 MB
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'property-images',
    'property-images',
    true,
    15728640, -- 15 MB
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'user-avatars',
    'user-avatars',
    true,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. إتاحة سياسات القراءة والرفع في storage.objects لحاوية property-documents
drop policy if exists "Anyone can read property documents" on storage.objects;
create policy "Anyone can read property documents"
  on storage.objects for select
  using (bucket_id = 'property-documents');

drop policy if exists "Anyone can upload property documents" on storage.objects;
create policy "Anyone can upload property documents"
  on storage.objects for insert
  with check (bucket_id = 'property-documents');

drop policy if exists "Anyone can update property documents" on storage.objects;
create policy "Anyone can update property documents"
  on storage.objects for update
  using (bucket_id = 'property-documents');

-- 3. سياسات حاوية property-images
drop policy if exists "Anyone can read property images" on storage.objects;
create policy "Anyone can read property images"
  on storage.objects for select
  using (bucket_id = 'property-images');

drop policy if exists "Anyone can upload property images" on storage.objects;
create policy "Anyone can upload property images"
  on storage.objects for insert
  with check (bucket_id = 'property-images');

