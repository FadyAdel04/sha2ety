-- ====================================================================
-- منصة شقتي (Sha2ety) — Egyptian Real Estate Marketplace SaaS
-- المرحلة 12: Backend, Database & Security Migration Script
-- ====================================================================
-- التعليمات:
-- افتح Supabase -> SQL Editor -> الصق هذا الكود كاملاً -> واضغط Run.
-- ====================================================================

-- 1. تفعيل الامتدادات الأساسية (Extensions)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ====================================================================
-- 2. أنواع البيانات المخصصة (ENUM TYPES)
-- ====================================================================

-- نوع دور المستخدم (User Roles)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('buyer', 'seller', 'admin');
  end if;
end $$;

-- حالات العقار (Property Workflow States - 8 states)
-- draft -> pending_review -> approved -> published | requires_changes | rejected | sold | archived
do $$
begin
  if not exists (select 1 from pg_type where typname = 'property_status') then
    create type public.property_status as enum (
      'draft',
      'pending_review',
      'approved',
      'published',
      'available',
      'requires_changes',
      'rejected',
      'sold',
      'archived'
    );
  else
    begin alter type public.property_status add value if not exists 'draft'; exception when others then null; end;
    begin alter type public.property_status add value if not exists 'pending_review'; exception when others then null; end;
    begin alter type public.property_status add value if not exists 'approved'; exception when others then null; end;
    begin alter type public.property_status add value if not exists 'published'; exception when others then null; end;
    begin alter type public.property_status add value if not exists 'available'; exception when others then null; end;
    begin alter type public.property_status add value if not exists 'requires_changes'; exception when others then null; end;
    begin alter type public.property_status add value if not exists 'rejected'; exception when others then null; end;
    begin alter type public.property_status add value if not exists 'sold'; exception when others then null; end;
    begin alter type public.property_status add value if not exists 'archived'; exception when others then null; end;
  end if;
end $$;

-- حالات المواعيد (Appointment Status)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum (
      'pending',
      'confirmed',
      'rescheduled',
      'completed',
      'cancelled',
      'rejected'
    );
  else
    begin alter type public.appointment_status add value if not exists 'rescheduled'; exception when others then null; end;
    begin alter type public.appointment_status add value if not exists 'rejected'; exception when others then null; end;
  end if;
end $$;

-- حالات فحص المستندات (Document Review Status)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'doc_review_status') then
    create type public.doc_review_status as enum ('pending', 'verified', 'rejected');
  end if;
end $$;

-- تصنيفات الإشعارات
do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_category') then
    create type public.notification_category as enum ('properties', 'appointments', 'inquiries', 'account');
  end if;
end $$;

-- ====================================================================
-- 3. جدول ملفات المستخدمين (PROFILES TABLE)
-- ====================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'buyer'::public.user_role,
  national_id text,
  is_verified boolean not null default false,
  is_suspended boolean not null default false,
  suspend_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ضمان وجود الأعمدة في profiles
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;
end $$;

-- ====================================================================
-- 4. جدول العقارات الرئيسي (PROPERTIES TABLE)
-- ====================================================================
create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  property_type text not null default 'شقة',
  purpose text not null default 'للبيع',
  price numeric(14, 2) not null check (price >= 0),
  currency text not null default 'EGP',
  area numeric(8, 2) not null check (area > 0),
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  floor_number text,
  total_floors integer,
  finishing_type text,
  furnishing_status text,
  property_age text,
  governorate text,
  city text not null,
  neighborhood text,
  street_address text,
  latitude double precision,
  longitude double precision,
  status public.property_status not null default 'pending_review'::public.property_status,
  rejection_reason text,
  admin_notes text,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- ضمان وجود كافة الأعمدة المطلوبة وتوافقها مع التسميات السابقة
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'property_type') then
    alter table public.properties add column property_type text not null default 'شقة';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'purpose') then
    alter table public.properties add column purpose text not null default 'للبيع';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'currency') then
    alter table public.properties add column currency text not null default 'EGP';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'finishing_type') then
    alter table public.properties add column finishing_type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'furnishing_status') then
    alter table public.properties add column furnishing_status text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'property_age') then
    alter table public.properties add column property_age text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'governorate') then
    alter table public.properties add column governorate text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'neighborhood') then
    alter table public.properties add column neighborhood text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'street_address') then
    alter table public.properties add column street_address text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'latitude') then
    alter table public.properties add column latitude double precision;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'longitude') then
    alter table public.properties add column longitude double precision;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'rejection_reason') then
    alter table public.properties add column rejection_reason text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'published_at') then
    alter table public.properties add column published_at timestamptz;
  end if;
  -- توافقية أسماء الأعمدة السابقة (type, location)
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'type') then
    alter table public.properties add column type text default 'شقة';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'location') then
    alter table public.properties add column location text default '';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'cover_image') then
    alter table public.properties add column cover_image text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'properties' and column_name = 'images') then
    alter table public.properties add column images text[] default '{}';
  end if;
end $$;

-- مزامنة أعمدة التوافقية (type <-> property_type, location <-> neighborhood)
create or replace function public.sync_property_compat_fields()
returns trigger as $$
begin
  if new.property_type is null or new.property_type = '' then
    new.property_type := coalesce(new.type, 'شقة');
  end if;
  if new.type is null or new.type = '' then
    new.type := new.property_type;
  end if;

  if new.neighborhood is null or new.neighborhood = '' then
    new.neighborhood := coalesce(new.location, new.city);
  end if;
  if new.location is null or new.location = '' then
    new.location := coalesce(new.neighborhood, new.city);
  end if;

  -- تعيين تاريخ النشر تلقائياً عند اعتماد العقار
  if (new.status in ('approved', 'published', 'available')) and (old.status is null or old.status not in ('approved', 'published', 'available')) then
    new.published_at := coalesce(new.published_at, now());
    new.is_verified := true;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists sync_properties_compat on public.properties;
create trigger sync_properties_compat
  before insert or update on public.properties
  for each row execute procedure public.sync_property_compat_fields();

-- ====================================================================
-- 5. جدول صور العقار (PROPERTY IMAGES TABLE)
-- ====================================================================
create table if not exists public.property_images (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  is_cover boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- 6. جدول مستندات الملكية (PROPERTY DOCUMENTS TABLE)
-- ====================================================================
create table if not exists public.property_documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null, -- deed, ownership_proof, license, power_of_attorney
  storage_path text not null,
  document_name text,
  file_size text,
  review_status public.doc_review_status not null default 'pending'::public.doc_review_status,
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  uploaded_at timestamptz not null default now()
);

-- ====================================================================
-- 7. جدول المفضلة (FAVORITES TABLE)
-- ====================================================================
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (buyer_id, property_id)
);

-- إضافة عمود التوافقية user_id إن لم يكن موجوداً
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'favorites' and column_name = 'user_id') then
    alter table public.favorites add column user_id uuid references public.profiles(id) on delete cascade;
    update public.favorites set user_id = buyer_id where user_id is null;
  end if;
end $$;

-- مزامنة user_id و buyer_id
create or replace function public.sync_favorite_user_id()
returns trigger as $$
begin
  if new.buyer_id is null then
    new.buyer_id := new.user_id;
  end if;
  if new.user_id is null then
    new.user_id := new.buyer_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists sync_favorite_user_id_trg on public.favorites;
create trigger sync_favorite_user_id_trg
  before insert or update on public.favorites
  for each row execute procedure public.sync_favorite_user_id();

-- ====================================================================
-- 8. جدول مواعيد المعاينة (APPOINTMENTS TABLE)
-- ====================================================================
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  appointment_date date not null,
  appointment_time text not null default '10:00',
  status public.appointment_status not null default 'pending'::public.appointment_status,
  buyer_message text,
  seller_response text,
  time_slot text,
  buyer_name text,
  buyer_phone text,
  notes text,
  rejection_reason text,
  alternative_proposal jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ====================================================================
-- 9. جدول الاستفسارات الفردية (INQUIRIES TABLE)
-- ====================================================================
create table if not exists public.inquiries (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  status text not null default 'new', -- new, replied, handled
  created_at timestamptz not null default now()
);

-- ====================================================================
-- 10. جدول المحادثات والرسائل (CONVERSATIONS & MESSAGES)
-- ====================================================================
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'new', -- new, replied, handled
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  unread_by_seller integer not null default 1,
  unread_by_buyer integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, buyer_id)
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- ====================================================================
-- 11. جدول الإشعارات (NOTIFICATIONS TABLE)
-- ====================================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'account', -- property, appointment, inquiry, account
  related_id text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- 12. جدول مشاهدات العقارات وشوهدت مؤخراً (PROPERTY VIEWS TABLE)
-- ====================================================================
create table if not exists public.property_views (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  viewed_at timestamptz not null default now()
);

-- ====================================================================
-- 13. جدول التدقيق والعمليات الإدارية (ADMIN AUDIT LOGS TABLE)
-- ====================================================================
create table if not exists public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null, -- property, user, platform
  entity_id text not null,
  previous_status text,
  new_status text,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- 14. جدول إعدادات أوقات وتوفر البائع (SELLER AVAILABILITY)
-- ====================================================================
create table if not exists public.seller_availabilities (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id) on delete cascade unique,
  available_weekdays integer[] not null default '{0,1,2,3,4,5,6}',
  slot_duration_minutes integer not null default 45,
  max_daily_appointments integer not null default 6,
  unavailable_dates text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ====================================================================
-- 15. جدول إعدادات المنصة العامة (PLATFORM SETTINGS)
-- ====================================================================
create table if not exists public.platform_settings (
  id text primary key default 'default_settings',
  site_name text not null default 'شقتي — منصة العقارات المصرية الموثوقة',
  official_currency text not null default 'الجنيه المصري (ج.م)',
  area_unit text not null default 'المتر المربع (م²)',
  admin_notification_email text not null default 'admin@sha2ety.eg',
  require_ownership_docs boolean not null default true,
  send_sms_alerts boolean not null default true,
  allow_direct_booking boolean not null default true,
  maintenance_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id)
values ('default_settings')
on conflict (id) do nothing;

-- ====================================================================
-- 16. الفهارس لقوة الأداء والسرعة (DATABASE INDEXES)
-- ====================================================================
create index if not exists idx_properties_city on public.properties(city);
create index if not exists idx_properties_prop_type on public.properties(property_type);
create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_price on public.properties(price);
create index if not exists idx_properties_seller on public.properties(seller_id);
create index if not exists idx_properties_published on public.properties(published_at desc);

create index if not exists idx_property_images_property on public.property_images(property_id);
create index if not exists idx_property_docs_property on public.property_documents(property_id);
create index if not exists idx_property_docs_seller on public.property_documents(seller_id);

create index if not exists idx_favorites_buyer on public.favorites(buyer_id);
create index if not exists idx_favorites_property on public.favorites(property_id);

create index if not exists idx_appointments_property on public.appointments(property_id);
create index if not exists idx_appointments_buyer on public.appointments(buyer_id);
create index if not exists idx_appointments_seller on public.appointments(seller_id);
create index if not exists idx_appointments_date on public.appointments(appointment_date);

create index if not exists idx_inquiries_property on public.inquiries(property_id);
create index if not exists idx_inquiries_seller on public.inquiries(seller_id);

create index if not exists idx_conversations_participants on public.conversations(buyer_id, seller_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_property_views_property on public.property_views(property_id);
create index if not exists idx_property_views_viewer on public.property_views(viewer_id);
create index if not exists idx_audit_logs_created on public.admin_audit_logs(created_at desc);

-- ====================================================================
-- 17. قواعد الأمان الخلفية والحماية من التجاوز (BACKEND SECURITY FUNCTIONS)
-- ====================================================================

-- دالة التحقق من أن المستخدم الحالي مشرف نظام معتمد
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) or (
    select lower(email) from auth.users where id = auth.uid()
  ) = 'admin@sha2ety.eg';
end;
$$ language plpgsql security definer;

-- قاعدة حظر اعتماد البائع لعقاراته بنفسه (Prevent Seller Self-Approval)
create or replace function public.enforce_property_security_transitions()
returns trigger as $$
begin
  -- إذا حاول مستخدم غير المشرف نشر أو اعتماد العقار مباشرة
  if (new.status in ('approved', 'published', 'available')) and not public.is_admin() then
    -- إذا كان السجل موجوداً مسبقاً ولم يكن منشوراً بالفعل
    if old.status is null or old.status not in ('approved', 'published', 'available') then
      raise exception 'غير مسموح للبائع باعتماد أو نشر العقار مباشرة. يجب إرساله للمراجعة القانونية من قبل المشرفين.';
    end if;
  end if;

  -- منع منح شارة التوثيق إلا بواسطة المشرف
  if (new.is_verified = true and (old.is_verified is null or old.is_verified = false)) and not public.is_admin() then
    raise exception 'شارة العقار الموثق لا تُمنح إلا بعد الفحص القانوني المعتمد من قبل الإدارة.';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_enforce_property_security on public.properties;
create trigger trg_enforce_property_security
  before insert or update on public.properties
  for each row execute procedure public.enforce_property_security_transitions();

-- منع التعدي على تضارب المواعيد (Prevent Appointment Double Booking)
create or replace function public.check_appointment_conflict()
returns trigger as $$
begin
  if new.status in ('pending', 'confirmed') then
    if exists (
      select 1 from public.appointments
      where seller_id = new.seller_id
        and appointment_date = new.appointment_date
        and time_slot = new.time_slot
        and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and status in ('confirmed')
    ) then
      raise exception 'هذا الموعد محجوز ومؤكد مسبقاً لدى المالك. يرجى اختيار موعد آخر.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_check_appointment_conflict on public.appointments;
create trigger trg_check_appointment_conflict
  before insert or update on public.appointments
  for each row execute procedure public.check_appointment_conflict();

-- معالج تسجيل المستخدمين الجدد (يمنع سرقة رتبة المشرف)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role public.user_role := 'buyer'::public.user_role;
  v_name text;
  v_phone text;
  v_email text;
begin
  v_email := lower(coalesce(new.email, ''));

  -- التحقق الحصري من حساب المشرف الرسمي (لا يُسمح لأي تسجيل عادي بتعيين نفسه مشيداً)
  if v_email = 'admin@sha2ety.eg' then
    v_role := 'admin'::public.user_role;
  elsif (new.raw_user_meta_data->>'role') = 'seller' then
    v_role := 'seller'::public.user_role;
  else
    v_role := 'buyer'::public.user_role;
  end if;

  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    case when v_email = 'admin@sha2ety.eg' then 'م. أحمد مهران (مشرف النظام)' else null end,
    split_part(v_email, '@', 1),
    'مستخدم شقتي'
  );

  v_phone := coalesce(new.raw_user_meta_data->>'phone', case when v_email = 'admin@sha2ety.eg' then '01222334455' else '' end);

  insert into public.profiles (id, email, full_name, phone, role)
  values (new.id, v_email, v_name, v_phone, v_role)
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
    role = case when public.profiles.role = 'admin' then 'admin'::public.user_role else excluded.role end,
    updated_at = now();

  return new;
exception
  when others then
    begin
      insert into public.profiles (id, email, full_name, role)
      values (
        new.id,
        coalesce(new.email, ''),
        coalesce(new.raw_user_meta_data->>'full_name', 'مستخدم شقتي'),
        'buyer'::public.user_role
      )
      on conflict (id) do nothing;
    exception when others then null;
    end;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================================
-- 18. سياسات الأمان على مستوى الصفوف الصارمة (ROW LEVEL SECURITY - RLS)
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_documents enable row level security;
alter table public.favorites enable row level security;
alter table public.appointments enable row level security;
alter table public.inquiries enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.property_views enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.seller_availabilities enable row level security;
alter table public.platform_settings enable row level security;

-- PROFILES RLS
drop policy if exists "Profiles are readable for platform needs" on public.profiles;
create policy "Profiles are readable for platform needs"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (
    -- منع المستخدم من ترقية نفسه لمشرف عبر تعديل الحساب
    (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()))
    or public.is_admin()
  );

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id or auth.uid() is null);

-- PROPERTIES RLS
drop policy if exists "Public can view published properties" on public.properties;
create policy "Public can view published properties"
  on public.properties for select
  using (
    status in ('published', 'available', 'approved', 'sold')
    or seller_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Sellers can insert their properties" on public.properties;
create policy "Sellers can insert their properties"
  on public.properties for insert
  with check (auth.uid() = seller_id or public.is_admin());

drop policy if exists "Sellers can update their own properties" on public.properties;
create policy "Sellers can update their own properties"
  on public.properties for update
  using (auth.uid() = seller_id or public.is_admin());

drop policy if exists "Sellers can delete their own properties" on public.properties;
create policy "Sellers can delete their own properties"
  on public.properties for delete
  using (auth.uid() = seller_id or public.is_admin());

-- PROPERTY IMAGES RLS
drop policy if exists "Property images viewable with properties" on public.property_images;
create policy "Property images viewable with properties"
  on public.property_images for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and (
        p.status in ('published', 'available', 'approved', 'sold')
        or p.seller_id = auth.uid()
        or public.is_admin()
      )
    )
  );

drop policy if exists "Sellers manage property images" on public.property_images;
create policy "Sellers manage property images"
  on public.property_images for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and (p.seller_id = auth.uid() or public.is_admin())
    )
  );

-- PROPERTY DOCUMENTS RLS (Strict Confidentiality!)
drop policy if exists "Confidential documents viewable only by owner and admin" on public.property_documents;
create policy "Confidential documents viewable only by owner and admin"
  on public.property_documents for select
  using (auth.uid() = seller_id or public.is_admin());

drop policy if exists "Sellers can upload documents for their properties" on public.property_documents;
create policy "Sellers can upload documents for their properties"
  on public.property_documents for insert
  with check (auth.uid() = seller_id or public.is_admin());

drop policy if exists "Only admins can update document review status" on public.property_documents;
create policy "Only admins can update document review status"
  on public.property_documents for update
  using (public.is_admin());

-- FAVORITES RLS
drop policy if exists "Users manage only their own favorites" on public.favorites;
create policy "Users manage only their own favorites"
  on public.favorites for all
  using (auth.uid() = buyer_id or auth.uid() = user_id);

-- APPOINTMENTS RLS
drop policy if exists "Appointments viewable by participants and admin" on public.appointments;
create policy "Appointments viewable by participants and admin"
  on public.appointments for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

drop policy if exists "Buyers can create appointment requests" on public.appointments;
create policy "Buyers can create appointment requests"
  on public.appointments for insert
  with check (auth.uid() = buyer_id or public.is_admin());

drop policy if exists "Participants and admin can update appointments" on public.appointments;
create policy "Participants and admin can update appointments"
  on public.appointments for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

-- INQUIRIES RLS
drop policy if exists "Inquiries viewable by participants and admin" on public.inquiries;
create policy "Inquiries viewable by participants and admin"
  on public.inquiries for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

drop policy if exists "Buyers can create inquiries" on public.inquiries;
create policy "Buyers can create inquiries"
  on public.inquiries for insert
  with check (auth.uid() = buyer_id or public.is_admin());

drop policy if exists "Participants can update inquiry status" on public.inquiries;
create policy "Participants can update inquiry status"
  on public.inquiries for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

-- CONVERSATIONS & MESSAGES RLS
drop policy if exists "Conversations private to participants and admin" on public.conversations;
create policy "Conversations private to participants and admin"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

drop policy if exists "Buyers can start conversations" on public.conversations;
create policy "Buyers can start conversations"
  on public.conversations for insert
  with check (auth.uid() = buyer_id or public.is_admin());

drop policy if exists "Participants can update conversations" on public.conversations;
create policy "Participants can update conversations"
  on public.conversations for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

drop policy if exists "Messages private to conversation participants" on public.messages;
create policy "Messages private to conversation participants"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    ) or public.is_admin()
  );

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    ) or public.is_admin()
  );

-- NOTIFICATIONS RLS
drop policy if exists "Notifications private to recipient" on public.notifications;
create policy "Notifications private to recipient"
  on public.notifications for all
  using (auth.uid() = user_id or public.is_admin());

-- PROPERTY VIEWS RLS
drop policy if exists "Property views can be recorded" on public.property_views;
create policy "Property views can be recorded"
  on public.property_views for insert
  with check (true);

drop policy if exists "Property views readable by seller and admin" on public.property_views;
create policy "Property views readable by seller and admin"
  on public.property_views for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and (p.seller_id = auth.uid() or public.is_admin())
    )
    or viewer_id = auth.uid()
  );

-- ADMIN AUDIT LOGS RLS
drop policy if exists "Audit logs managed by admin only" on public.admin_audit_logs;
create policy "Audit logs managed by admin only"
  on public.admin_audit_logs for all
  using (public.is_admin());

-- SELLER AVAILABILITY RLS
drop policy if exists "Availability readable by anyone for booking" on public.seller_availabilities;
create policy "Availability readable by anyone for booking"
  on public.seller_availabilities for select
  using (true);

drop policy if exists "Sellers manage their own availability" on public.seller_availabilities;
create policy "Sellers manage their own availability"
  on public.seller_availabilities for all
  using (auth.uid() = seller_id or public.is_admin());

-- PLATFORM SETTINGS RLS
drop policy if exists "Settings readable by all" on public.platform_settings;
create policy "Settings readable by all"
  on public.platform_settings for select
  using (true);

drop policy if exists "Settings editable by admin only" on public.platform_settings;
create policy "Settings editable by admin only"
  on public.platform_settings for update
  using (public.is_admin());

-- ====================================================================
-- 19. إعداد مجلدات التخزين السحابية الثلاثة (STORAGE BUCKETS)
-- ====================================================================
insert into storage.buckets (id, name, public)
values 
  ('property-images', 'property-images', true),
  ('property-documents', 'property-documents', false),
  ('user-avatars', 'user-avatars', true)
on conflict (id) do nothing;

-- Storage: Property Images
drop policy if exists "Public images access" on storage.objects;
create policy "Public images access"
  on storage.objects for select
  using (bucket_id = 'property-images');

drop policy if exists "Authenticated upload property images" on storage.objects;
create policy "Authenticated upload property images"
  on storage.objects for insert
  with check (bucket_id = 'property-images' and auth.role() = 'authenticated');

-- Storage: Property Documents (Private!)
drop policy if exists "Private documents access" on storage.objects;
create policy "Private documents access"
  on storage.objects for select
  using (
    bucket_id = 'property-documents' 
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

drop policy if exists "Private documents upload" on storage.objects;
create policy "Private documents upload"
  on storage.objects for insert
  with check (bucket_id = 'property-documents' and auth.role() = 'authenticated');

-- Storage: User Avatars
drop policy if exists "Public avatar access" on storage.objects;
create policy "Public avatar access"
  on storage.objects for select
  using (bucket_id = 'user-avatars');

drop policy if exists "Users upload their own avatar" on storage.objects;
create policy "Users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'user-avatars' and auth.role() = 'authenticated');

-- ====================================================================
-- 20. دوال الإجراءات الذكية والتحليلات (SMART RPC FUNCTIONS)
-- ====================================================================

-- دالة تسجيل مشاهدة عقار وتحديث العداد تلقائياً
create or replace function public.record_property_view(
  p_property_id uuid,
  p_viewer_id uuid default null
)
returns void as $$
begin
  insert into public.property_views (property_id, viewer_id)
  values (p_property_id, p_viewer_id);

  update public.properties
  set views_count = coalesce(views_count, 0) + 1
  where id = p_property_id;
end;
$$ language plpgsql security definer;

-- دالة مؤشرات السوق التقديرية الحقيقية (Real Market Insights)
create or replace function public.get_market_insights(
  p_city text default null,
  p_property_type text default null
)
returns table (
  sample_size bigint,
  average_price numeric,
  average_price_per_sqm numeric,
  min_price numeric,
  max_price numeric,
  disclaimer text
) as $$
begin
  return query
  select 
    count(*)::bigint as sample_size,
    coalesce(round(avg(price), 0), 0) as average_price,
    coalesce(round(avg(price / nullif(area, 0)), 0), 0) as average_price_per_sqm,
    coalesce(min(price), 0) as min_price,
    coalesce(max(price), 0) as max_price,
    'هذه المؤشرات محسوبة حصرياً من واقع إعلانات منصة شقتي المتاحة ولا تمثل السوق العقاري العام.'::text as disclaimer
  from public.properties
  where status in ('published', 'available', 'approved')
    and (p_city is null or p_city = 'all' or city = p_city)
    and (p_property_type is null or p_property_type = 'all' or property_type = p_property_type);
end;
$$ language plpgsql security definer;

