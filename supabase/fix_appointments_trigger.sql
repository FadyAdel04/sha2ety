-- ====================================================================
-- منصة شقتي (Sha2ety)
-- حل مشكلة تضارب أسماء الأعمدة في تريجر المواعيد:
-- Fix: column "appointment_time" does not exist in public.appointments
-- ====================================================================

-- 1. تحديث دالة التحقق من تضارب المواعيد لاستخدام time_slot بدلاً من appointment_time
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

-- 2. إعادة ربط التريجر بالجدول
drop trigger if exists trg_check_appointment_conflict on public.appointments;
create trigger trg_check_appointment_conflict
  before insert or update on public.appointments
  for each row execute procedure public.check_appointment_conflict();

