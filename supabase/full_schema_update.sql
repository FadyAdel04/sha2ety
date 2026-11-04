-- ====================================================================
-- منصة شقتي (Sha2ety) — Egyptian Real Estate Marketplace SaaS
-- Complete Production Database Schema & Fixes (Stages 1 through 11)
-- ====================================================================
-- التعليمات:
-- افتح لوحة تحكم مشروعك في Supabase -> اختر SQL Editor -> الصق هذا الكود بالكامل -> واضغط Run.
-- ====================================================================

-- 1. تفعيل الامتدادات الأساسية (Extensions)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ====================================================================
-- 2. إنشاء وتحديث أنواع البيانات المخصصة (Custom Enum Types)
-- ====================================================================

-- نوع دور المستخدم (User Roles)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('buyer', 'seller', 'admin');
  end if;
end $$;

-- حالات العقارات (Property Status)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'property_status') then
    create type public.property_status as enum ('available', 'pending_review', 'requires_changes', 'reserved', 'sold', 'rejected');
  else
    -- إضافة القيم الجديدة إن كانت ناقصة
    begin
      alter type public.property_status add value if not exists 'requires_changes';
    exception when others then null;
    end;
  end if;
end $$;

-- حالات المواعيد والمعاينة (Appointment Status - 6 حالات كاملة)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum ('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'rejected');
  else
    begin
      alter type public.appointment_status add value if not exists 'rescheduled';
      alter type public.appointment_status add value if not exists 'rejected';
    exception when others then null;
    end;
  end if;
end $$;

-- حالات فحص المستندات (Document Review Status)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'doc_review_status') then
    create type public.doc_review_status as enum ('pending', 'verified', 'rejected');
  end if;
end $$;

-- تصنيفات الإشعارات (Notification Categories)
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
  role public.user_role not null default 'buyer'::public.user_role,
  national_id text,
  is_verified boolean not null default false,
  is_suspended boolean not null default false,
  suspend_reason text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- إزالة أي قيود NOT NULL قد تعطل إنشاء المستخدم عند التسجيل لأول مرة
alter table public.profiles alter column email drop not null;
alter table public.profiles alter column full_name drop not null;

-- ====================================================================
-- 4. جدول العقارات (PROPERTIES TABLE)
-- ====================================================================
create table if not exists public.properties (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(14, 2) not null check (price > 0),
  area numeric(8, 2) not null check (area > 0),
  type text not null, -- شقة، فيلا، منزل، دوبلكس، شاليه، تجاري، أرض
  city text not null,
  location text not null,
  district text,
  street_name text,
  building_no text,
  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  finishing text,
  floor_number text,
  total_floors integer,
  features text[] default '{}',
  images text[] default '{}',
  cover_image text,
  status public.property_status not null default 'pending_review'::public.property_status,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  correction_notes text,
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ====================================================================
-- 5. جدول مستندات الملكية المشفرة (PROPERTY DOCUMENTS TABLE)
-- ====================================================================
create table if not exists public.property_documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  document_name text not null,
  document_type text not null, -- deed, license, power_of_attorney, national_id
  document_url text not null,
  file_size text,
  status public.doc_review_status not null default 'pending'::public.doc_review_status,
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- 6. جدول إعدادات أوقات وتوفر البائع (SELLER AVAILABILITY)
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
-- 7. جدول مواعيد المعاينة (APPOINTMENTS TABLE)
-- ====================================================================
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  appointment_date date not null,
  date_formatted text,
  time_slot text not null,
  time_slot_id text,
  buyer_name text not null,
  buyer_phone text not null,
  notes text,
  rejection_reason text,
  alternative_proposal jsonb,
  status public.appointment_status not null default 'pending'::public.appointment_status,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ====================================================================
-- 8. قنوات المحادثات والاستفسارات (CONVERSATIONS & MESSAGES)
-- ====================================================================
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'new', -- new, replied, handled
  last_message text not null,
  last_message_at timestamptz not null default now(),
  unread_by_seller integer not null default 1,
  unread_by_buyer integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (property_id, buyer_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  sender_role text not null, -- buyer, seller, admin
  sender_name text not null,
  message_text text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- 9. مركز الإشعارات والتنبيهات (NOTIFICATIONS TABLE)
-- ====================================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category public.notification_category not null default 'account'::public.notification_category,
  category_label text not null,
  title text not null,
  message text not null,
  action_url text,
  action_label text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- 10. سجل العمليات والتدقيق الإداري (AUDIT LOGS TABLE)
-- ====================================================================
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references public.profiles(id) on delete set null,
  admin_name text not null,
  admin_email text not null,
  action_type text not null,
  action_title text not null,
  target_type text not null, -- property, user, platform
  target_id text not null,
  target_title text not null,
  prev_status text,
  new_status text,
  reason_notes text,
  created_at timestamptz not null default now()
);

-- ====================================================================
-- 11. إعدادات المنصة (PLATFORM SETTINGS TABLE)
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
-- 12. المفضلة وشوهدت مؤخراً (FAVORITES & RECENTLY VIEWED)
-- ====================================================================
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create table if not exists public.recently_viewed (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

-- ====================================================================
-- 13. إنشاء الفهارس لتحقيق أعلى سرعة (INDEXES)
-- ====================================================================
create index if not exists idx_properties_city on public.properties(city);
create index if not exists idx_properties_type on public.properties(type);
create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_price on public.properties(price);
create index if not exists idx_properties_seller on public.properties(seller_id);
create index if not exists idx_appointments_property on public.appointments(property_id);
create index if not exists idx_appointments_buyer on public.appointments(buyer_id);
create index if not exists idx_appointments_seller on public.appointments(seller_id);
create index if not exists idx_appointments_date on public.appointments(appointment_date);
create index if not exists idx_chat_messages_conv on public.chat_messages(conversation_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- ====================================================================
-- 14. الدالة المعالجة لتسجيل المستخدمين الجدد (HANDLE NEW USER TRIGGER)
-- (معالجة الأخطاء الشاملة + تعيين رتبة المشرف التلقائية لـ admin@sha2ety.eg)
-- ====================================================================
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

  -- التحقق التلقائي من حساب المشرف الرسمي
  if v_email = 'admin@sha2ety.eg' or (new.raw_user_meta_data->>'role') = 'admin' then
    v_role := 'admin'::public.user_role;
  elsif (new.raw_user_meta_data->>'role') = 'seller' then
    v_role := 'seller'::public.user_role;
  else
    v_role := 'buyer'::public.user_role;
  end if;

  -- استخراج الاسم
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    case when v_email = 'admin@sha2ety.eg' then 'م. أحمد مهران (مشرف النظام)' else null end,
    split_part(v_email, '@', 1),
    'مستخدم شقتي'
  );

  -- استخراج الهاتف
  v_phone := coalesce(new.raw_user_meta_data->>'phone', case when v_email = 'admin@sha2ety.eg' then '01222334455' else '' end);

  -- الإدراج في جدول profiles
  insert into public.profiles (id, email, full_name, phone, role)
  values (new.id, v_email, v_name, v_phone, v_role)
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
    role = excluded.role,
    updated_at = now();

  return new;
exception
  when others then
    -- حماية من توقف معاملة التسجيل في حال وجود استثناء غير متوقع
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

-- إعادة ربط الـ Trigger بـ auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================================
-- 15. دالة تحديث الوقت التلقائي (HANDLE UPDATED AT)
-- ====================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_properties_updated_at on public.properties;
create trigger set_properties_updated_at
  before update on public.properties
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
  before update on public.appointments
  for each row execute procedure public.handle_updated_at();

drop trigger if exists set_conversations_updated_at on public.conversations;
create trigger set_conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.handle_updated_at();

-- ====================================================================
-- 16. قواعد وسياسات الأمان على مستوى الصفوف (ROW LEVEL SECURITY - RLS)
-- ====================================================================

-- تفعيل RLS على كافة الجداول
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_documents enable row level security;
alter table public.seller_availabilities enable row level security;
alter table public.appointments enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.platform_settings enable row level security;
alter table public.favorites enable row level security;
alter table public.recently_viewed enable row level security;

-- دالة مساعدة سريعة للتحقق من هوية المشرف
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

-- ---- سياسات ملفات المستخدمين (PROFILES) ----
drop policy if exists "Anyone can view basic public profile" on public.profiles;
create policy "Anyone can view basic public profile"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id or auth.uid() is null);

-- ---- سياسات العقارات (PROPERTIES) ----
drop policy if exists "Public can view published properties" on public.properties;
create policy "Public can view published properties"
  on public.properties for select
  using (status in ('available', 'reserved', 'sold') or seller_id = auth.uid() or public.is_admin());

drop policy if exists "Sellers can create properties" on public.properties;
create policy "Sellers can create properties"
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

-- ---- سياسات مستندات الملكية المشفرة (PROPERTY DOCUMENTS) ----
drop policy if exists "Sellers and Admins can view ownership documents" on public.property_documents;
create policy "Sellers and Admins can view ownership documents"
  on public.property_documents for select
  using (auth.uid() = seller_id or public.is_admin());

drop policy if exists "Sellers can upload ownership documents" on public.property_documents;
create policy "Sellers can upload ownership documents"
  on public.property_documents for insert
  with check (auth.uid() = seller_id or public.is_admin());

drop policy if exists "Admins can update document review status" on public.property_documents;
create policy "Admins can update document review status"
  on public.property_documents for update
  using (public.is_admin());

-- ---- سياسات مواعيد المعاينة (APPOINTMENTS) ----
drop policy if exists "Buyers Sellers and Admins can view their appointments" on public.appointments;
create policy "Buyers Sellers and Admins can view their appointments"
  on public.appointments for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

drop policy if exists "Buyers can book appointments" on public.appointments;
create policy "Buyers can book appointments"
  on public.appointments for insert
  with check (auth.uid() = buyer_id or public.is_admin());

drop policy if exists "Participants and Admins can update appointment status" on public.appointments;
create policy "Participants and Admins can update appointment status"
  on public.appointments for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

-- ---- سياسات المحادثات والرسائل (CONVERSATIONS & MESSAGES) ----
drop policy if exists "Participants and Admins can view conversations" on public.conversations;
create policy "Participants and Admins can view conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

drop policy if exists "Buyers can create conversations" on public.conversations;
create policy "Buyers can create conversations"
  on public.conversations for insert
  with check (auth.uid() = buyer_id or public.is_admin());

drop policy if exists "Participants and Admins can update conversations" on public.conversations;
create policy "Participants and Admins can update conversations"
  on public.conversations for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.is_admin());

drop policy if exists "Participants and Admins can view messages" on public.chat_messages;
create policy "Participants and Admins can view messages"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.conversations
      where id = conversation_id and (buyer_id = auth.uid() or seller_id = auth.uid())
    ) or public.is_admin()
  );

drop policy if exists "Participants can send messages" on public.chat_messages;
create policy "Participants can send messages"
  on public.chat_messages for insert
  with check (
    exists (
      select 1 from public.conversations
      where id = conversation_id and (buyer_id = auth.uid() or seller_id = auth.uid())
    ) or public.is_admin()
  );

-- ---- سياسات الإشعارات (NOTIFICATIONS) ----
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can update their notifications" on public.notifications;
create policy "Users can update their notifications"
  on public.notifications for update
  using (auth.uid() = user_id or public.is_admin());

-- ---- سياسات سجل العمليات (AUDIT LOGS) ----
drop policy if exists "Admins can view and manage audit logs" on public.audit_logs;
create policy "Admins can view and manage audit logs"
  on public.audit_logs for all
  using (public.is_admin());

-- ---- سياسات إعدادات المنصة (PLATFORM SETTINGS) ----
drop policy if exists "Anyone can read platform settings" on public.platform_settings;
create policy "Anyone can read platform settings"
  on public.platform_settings for select
  using (true);

drop policy if exists "Admins can update platform settings" on public.platform_settings;
create policy "Admins can update platform settings"
  on public.platform_settings for update
  using (public.is_admin());

-- ---- سياسات المفضلة (FAVORITES) ----
drop policy if exists "Users can manage their favorites" on public.favorites;
create policy "Users can manage their favorites"
  on public.favorites for all
  using (auth.uid() = user_id);

-- ====================================================================
-- 17. إعداد مجلدات التخزين السحابي (STORAGE BUCKETS)
-- ====================================================================
insert into storage.buckets (id, name, public)
values 
  ('property-images', 'property-images', true),
  ('property-documents', 'property-documents', false)
on conflict (id) do nothing;

drop policy if exists "Public Access to Property Images" on storage.objects;
create policy "Public Access to Property Images"
  on storage.objects for select
  using (bucket_id = 'property-images');

drop policy if exists "Authenticated Users Can Upload Property Images" on storage.objects;
create policy "Authenticated Users Can Upload Property Images"
  on storage.objects for insert
  with check (bucket_id = 'property-images' and auth.role() = 'authenticated');

drop policy if exists "Owners and Admins Can View Documents" on storage.objects;
create policy "Owners and Admins Can View Documents"
  on storage.objects for select
  using (bucket_id = 'property-documents' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));

drop policy if exists "Authenticated Users Can Upload Ownership Documents" on storage.objects;
create policy "Authenticated Users Can Upload Ownership Documents"
  on storage.objects for insert
  with check (bucket_id = 'property-documents' and auth.role() = 'authenticated');

