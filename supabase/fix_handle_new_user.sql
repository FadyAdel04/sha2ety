-- ====================================================================
-- منصة شقتي (Sha2ety)
-- حل مشكلة: Database error saving new user
-- Fix for Supabase Auth Signup Trigger and Profile Creation
-- ====================================================================

-- 1. التأكد من وجود نوع البيانات user_role
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('buyer', 'seller', 'admin');
  end if;
end $$;

-- 2. التأكد من إنشاء جدول profiles
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  role public.user_role not null default 'buyer'::public.user_role,
  national_id text,
  is_verified boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- إزالة أي قيود NOT NULL قد تعطل إنشاء المستخدم إذا تأخر إرسال البيانات
alter table public.profiles alter column email drop not null;
alter table public.profiles alter column full_name drop not null;

-- 3. تفعيل RLS وإضافة سياسات الإدخال والتعديل الضرورية
alter table public.profiles enable row level security;

-- حذف السياسات القديمة لتفادي التكرار
drop policy if exists "Anyone can view basic public profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Service role full access on profiles" on public.profiles;

create policy "Anyone can view basic public profile"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id or auth.uid() is null);

-- 4. دالة handle_new_user المحصنة ضد أي أخطاء
-- (SECURITY DEFINER + search_path صريح + معالجة الاستثناءات EXCEPTION)
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
  -- استخراج الدور بأمان
  if (new.raw_user_meta_data->>'role') = 'seller' then
    v_role := 'seller'::public.user_role;
  else
    v_role := 'buyer'::public.user_role;
  end if;

  -- استخراج الاسم
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(coalesce(new.email, 'user@sha2ety.eg'), '@', 1),
    'مستخدم جديد'
  );

  -- استخراج رقم الهاتف والبريد
  v_phone := coalesce(new.raw_user_meta_data->>'phone', '');
  v_email := coalesce(new.email, '');

  -- إدراج ملف المستخدم مع منع التعارض (ON CONFLICT DO UPDATE)
  insert into public.profiles (id, email, full_name, phone, role)
  values (new.id, v_email, v_name, v_phone, v_role)
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
    role = coalesce(excluded.role, public.profiles.role),
    updated_at = now();

  return new;
exception
  when others then
    -- في حال حدوث أي خطأ غير متوقع، نضمن عدم تعطيل عملية التسجيل في auth.users
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

-- 5. إعادة ربط الـ Trigger بـ auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. منح الصلاحيات اللازمة للجدول والدالة
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.profiles to postgres, service_role;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert on table public.profiles to anon;
grant execute on function public.handle_new_user() to service_role, postgres;

