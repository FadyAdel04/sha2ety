-- ====================================================================
-- منصة شقتي (Sha2ety) - Egyptian Real Estate Marketplace SaaS
-- Complete Supabase Database Schema (PostgreSQL + RLS + Triggers)
-- ====================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Custom Enum Types
create type user_role as enum ('buyer', 'seller', 'admin');
create type property_status as enum ('available', 'pending_review', 'reserved', 'sold', 'rejected');
create type appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type doc_review_status as enum ('pending', 'approved', 'rejected');

-- ====================================================================
-- 3. PROFILES TABLE (ملفات المستخدمين)
-- ====================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  phone text,
  role user_role not null default 'buyer',
  national_id text,
  is_verified boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ====================================================================
-- 4. PROPERTIES TABLE (العقارات المعروضة للبيع)
-- ====================================================================
create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(14, 2) not null check (price > 0), -- بالجنيه المصري (ج.م)
  area numeric(8, 2) not null check (area > 0),    -- بالمتر المربع (م²)
  type text not null, -- شقة، فيلا، منزل، دوبلكس، شاليه، تجاري، أرض
  city text not null, -- القاهرة، الجيزة، الإسكندرية، الساحل الشمالي، البحر الأحمر
  location text not null, -- التجمع الخامس، الشيخ زايد، المعادي...
  address text,
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  finishing text, -- ultra_super_lux, super_lux, semi_finished, core_shell
  floor_number integer,
  total_floors integer,
  features text[] default '{}',
  images text[] default '{}',
  cover_image text,
  status property_status not null default 'pending_review',
  is_verified boolean not null default false, -- يتم اعتمادها بواسطة المشرف بعد فحص المستندات
  is_featured boolean not null default false,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ====================================================================
-- 5. PROPERTY DOCUMENTS (مستندات الملكية الرسمية للفحص والتوثيق)
-- ====================================================================
create table if not exists public.property_documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null, -- عقد مسجل شهر عقاري، ترخيص بناء، توكيل رسمي، مخالصة مالية
  document_url text not null,
  status doc_review_status not null default 'pending',
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- 6. APPOINTMENTS TABLE (مواعيد المعاينات الميدانية)
-- ====================================================================
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  appointment_date date not null,
  time_slot text not null, -- صباحاً (١٠ ص - ١ م)، ظهراً (١ م - ٤ م)، مساءً (٤ م - ٧ م)
  buyer_phone text not null,
  notes text,
  status appointment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ====================================================================
-- 7. INQUIRIES TABLE (استفسارات المشترين ورسائل الملاك)
-- ====================================================================
create table if not exists public.inquiries (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  reply text,
  is_replied boolean not null default false,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- 8. FAVORITES TABLE (العقارات المفضلة)
-- ====================================================================
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

-- ====================================================================
-- 9. RECENTLY VIEWED (العقارات التي تمت مشاهدتها مؤخراً)
-- ====================================================================
create table if not exists public.recently_viewed (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

-- ====================================================================
-- 10. INDEXES FOR HIGH PERFORMANCE (فهارس الأداء السريع)
-- ====================================================================
create index if not exists idx_properties_city on public.properties(city);
create index if not exists idx_properties_type on public.properties(type);
create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_price on public.properties(price);
create index if not exists idx_properties_seller on public.properties(seller_id);
create index if not exists idx_appointments_property on public.appointments(property_id);
create index if not exists idx_appointments_buyer on public.appointments(buyer_id);
create index if not exists idx_appointments_seller on public.appointments(seller_id);
create index if not exists idx_favorites_user on public.favorites(user_id);

-- ====================================================================
-- 11. AUTOMATIC PROFILE CREATION TRIGGER (إنشاء ملف المستخدم عند التسجيل)
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  user_role_val public.user_role := 'buyer'::public.user_role;
  v_name text;
  v_phone text;
  v_email text;
begin
  -- Prevent privilege escalation: only allow 'buyer' or 'seller' from signup metadata
  if (new.raw_user_meta_data->>'role') = 'seller' then
    user_role_val := 'seller'::public.user_role;
  else
    user_role_val := 'buyer'::public.user_role;
  end if;

  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(coalesce(new.email, 'user@sha2ety.eg'), '@', 1),
    'مستخدم جديد'
  );

  v_phone := coalesce(new.raw_user_meta_data->>'phone', '');
  v_email := coalesce(new.email, '');

  insert into public.profiles (id, email, full_name, phone, role)
  values (new.id, v_email, v_name, v_phone, user_role_val)
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
    role = coalesce(excluded.role, public.profiles.role),
    updated_at = now();

  return new;
exception
  when others then
    -- Catch-all protection to prevent auth transaction failure
    begin
      insert into public.profiles (id, email, full_name, role)
      values (
        new.id,
        coalesce(new.email, ''),
        coalesce(new.raw_user_meta_data->>'full_name', 'مستخدم شقتي'),
        'buyer'::public.user_role
      )
      on conflict (id) do nothing;
    exception
      when others then
        null;
    end;
    return new;
end;
$$;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at timestamp trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_properties_updated_at
  before update on public.properties
  for each row execute procedure public.handle_updated_at();

create trigger set_appointments_updated_at
  before update on public.appointments
  for each row execute procedure public.handle_updated_at();

-- ====================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES (أمان وصلاحيات الصفوف)
-- ====================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_documents enable row level security;
alter table public.appointments enable row level security;
alter table public.inquiries enable row level security;
alter table public.favorites enable row level security;
alter table public.recently_viewed enable row level security;

-- Helper function: Is Admin?
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- ---- PROFILES POLICIES ----
create policy "Anyone can view basic public profile"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id or auth.uid() is null);

create policy "Admins can manage any profile"
  on public.profiles for all
  using (public.is_admin());

-- ---- PROPERTIES POLICIES ----
-- Anyone can view approved/available properties
create policy "Public can view published properties"
  on public.properties for select
  using (status in ('available', 'reserved', 'sold') or seller_id = auth.uid() or public.is_admin());

-- Sellers can insert their own properties
create policy "Sellers can create properties"
  on public.properties for insert
  with check (
    auth.uid() = seller_id and
    exists (select 1 from public.profiles where id = auth.uid() and role in ('seller', 'admin'))
  );

-- Sellers can update their own properties
create policy "Sellers can update their own properties"
  on public.properties for update
  using (auth.uid() = seller_id or public.is_admin());

-- Sellers can delete their own properties
create policy "Sellers can delete their own properties"
  on public.properties for delete
  using (auth.uid() = seller_id or public.is_admin());

-- ---- PROPERTY DOCUMENTS POLICIES (Strictly Private) ----
-- Only the seller of the property and Admins can view legal ownership documents
create policy "Sellers and Admins can view ownership documents"
  on public.property_documents for select
  using (auth.uid() = seller_id or public.is_admin());

create policy "Sellers can upload ownership documents"
  on public.property_documents for insert
  with check (auth.uid() = seller_id);

create policy "Admins can update document review status"
  on public.property_documents for update
  using (public.is_admin());

-- ---- APPOINTMENTS POLICIES ----
create policy "Buyers, Sellers and Admins can view their appointments"
  on public.appointments for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

create policy "Buyers can book appointments"
  on public.appointments for insert
  with check (auth.uid() = buyer_id);

create policy "Participants and Admins can update appointment status"
  on public.appointments for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

-- ---- INQUIRIES POLICIES ----
create policy "Participants and Admins can view inquiries"
  on public.inquiries for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

create policy "Buyers can send inquiries"
  on public.inquiries for insert
  with check (auth.uid() = buyer_id);

create policy "Sellers can reply to inquiries"
  on public.inquiries for update
  using (auth.uid() = seller_id or public.is_admin());

-- ---- FAVORITES POLICIES ----
create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can add to favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove from favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ---- RECENTLY VIEWED POLICIES ----
create policy "Users can view their recently viewed"
  on public.recently_viewed for select
  using (auth.uid() = user_id);

create policy "Users can insert recently viewed"
  on public.recently_viewed for insert
  with check (auth.uid() = user_id);

-- ====================================================================
-- 13. STORAGE BUCKETS SETUP (مجلدات التخزين للصور والمستندات)
-- ====================================================================
-- Insert storage buckets if not exists
insert into storage.buckets (id, name, public)
values 
  ('property-images', 'property-images', true),
  ('property-documents', 'property-documents', false)
on conflict (id) do nothing;

-- Storage Policies for property-images (صور العقارات - عامة للقراءة)
create policy "Public Access to Property Images"
  on storage.objects for select
  using (bucket_id = 'property-images');

create policy "Authenticated Users Can Upload Property Images"
  on storage.objects for insert
  with check (bucket_id = 'property-images' and auth.role() = 'authenticated');

-- Storage Policies for property-documents (مستندات الملكية - خاصة وسرية)
create policy "Owners and Admins Can View Documents"
  on storage.objects for select
  using (bucket_id = 'property-documents' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));

create policy "Authenticated Users Can Upload Ownership Documents"
  on storage.objects for insert
  with check (bucket_id = 'property-documents' and auth.role() = 'authenticated');

