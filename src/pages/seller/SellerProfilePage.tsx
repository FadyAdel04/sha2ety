import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, UserCheck } from 'lucide-react';

export const SellerProfilePage: React.FC = () => {
  return (
    <DashboardLayout
      role="seller"
      title="الملف الشخصي وإثبات الهوية"
      subtitle="إدارة بياناتك الشخصية وحالة توثيق الهوية الوطنية للمالك."
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-right">
        <div className="md:col-span-8 bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard space-y-5">
          <h3 className="text-lg font-black text-[var(--dp-color-ink)] border-b-2 border-[#ece9db] pb-3">
            البيانات الأساسية
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="الاسم بالكامل" defaultValue="محمد السيد أحمد" />
            <Input label="رقم الهاتف المسجل" defaultValue="01001234567" />
            <Input label="البريد الإلكتروني" defaultValue="mohamed.elsayed@example.eg" />
            <Input label="المحافظة المقيم بها" defaultValue="القاهرة" />
          </div>
          <div className="pt-2">
            <Button variant="primary" size="md" onClick={() => alert('تم حفظ التعديلات!')}>
              حفظ التعديلات
            </Button>
          </div>
        </div>

        <div className="md:col-span-4 bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--dp-color-accent-fresh)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-emerald-800 shadow-hard-sm">
            <UserCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-base font-black text-[var(--dp-color-ink)]">
              توثيق الهوية الوطنية
            </h4>
            <Badge variant="fresh" size="sm" className="mt-1">
              تم التحقق من بطاقة الرقم القومي
            </Badge>
          </div>
          <p className="text-xs text-[#626d84] leading-relaxed">
            حسابك موثق بهوية رسمية. يمنح هذا عقاراتك أولوية الظهور في نتائج البحث ويزيد من ثقة المشترين في التعامل المباشر معك.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

