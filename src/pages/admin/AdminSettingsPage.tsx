import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  getPlatformSettings,
  savePlatformSettings,
  PlatformSettings,
} from '@/services/adminService';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  Bell,
  Save,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings>(() => getPlatformSettings());
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePlatformSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <DashboardLayout
      role="admin"
      title="إعدادات المنصة والسوق العقاري المصري"
      subtitle="إدارة العملة الرسمية، معايير التوثيق القانوني، سياسات التنبيهات والرقابة."
    >
      <div className="space-y-6 text-right max-w-3xl">
        {isSaved && (
          <div className="p-4 bg-emerald-50 border-[2px] border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2 shadow-hard-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-black text-sm">تم حفظ إعدادات المنصة بنجاح وتوثيق العملية في سجل التدقيق (Audit Log).</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: البيانات الأساسية والعملة */}
          <div className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-4">
            <h3 className="text-base font-black text-[var(--dp-color-ink)] pb-3 border-b-2 border-[#ece9db] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--dp-color-accent)]" />
              المعايير القياسية والسوقية
            </h3>

            <div className="space-y-4">
              <Input
                label="اسم المنصة الرسمي"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="العملة الرسمية المعتمدة"
                  value={settings.officialCurrency}
                  disabled
                  helperText="مثبتة قانونياً بالسوق المصري (الجنيه المصري EGP)"
                />

                <Input
                  label="وحدة قياس المساحات العقارية"
                  value={settings.areaUnit}
                  disabled
                  helperText="المعيار القياسي المصري (م²)"
                />
              </div>

              <Input
                label="البريد الإلكتروني للإشعارات الإدارية والرقابية"
                type="email"
                value={settings.adminNotificationEmail}
                onChange={(e) => setSettings({ ...settings, adminNotificationEmail: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Section 2: سياسات التوثيق والأمان */}
          <div className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-4">
            <h3 className="text-base font-black text-[var(--dp-color-ink)] pb-3 border-b-2 border-[#ece9db] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              سياسات التوثيق والرقابة القانونية
            </h3>

            <div className="space-y-4 pt-1">
              <Checkbox
                label="إلزامية رفع مستند ملكية لنشر أي عقار"
                description="عند التفعيل، لن يظهر أي عقار في السوق العام إلا بعد فحص الأوراق ومنح شارة 'موثق' من الإدارة."
                checked={settings.requireOwnershipDocs}
                onChange={(e) => setSettings({ ...settings, requireOwnershipDocs: e.target.checked })}
              />

              <Checkbox
                label="تفعيل الرسائل والتنبيهات النصية (SMS Gateway)"
                description="إرسال تنبيهات SMS فورية للملاك والمشترين عند حجز مواعيد المعاينة أو تعديل أوقات الزيارة."
                checked={settings.sendSmsAlerts}
                onChange={(e) => setSettings({ ...settings, sendSmsAlerts: e.target.checked })}
              />

              <Checkbox
                label="السماح بالحجز الفوري للمعاينة"
                description="تمكين المشترين من اختيار فترات المعاينة المتاحة مباشرة وتأكيدها من المالك."
                checked={settings.allowDirectBooking}
                onChange={(e) => setSettings({ ...settings, allowDirectBooking: e.target.checked })}
              />
            </div>
          </div>

          {/* Section 3: وضع الصيانة */}
          <div className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-4">
            <h3 className="text-base font-black text-[var(--dp-color-ink)] pb-3 border-b-2 border-[#ece9db] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              التحكم في وضع الصيانة
            </h3>

            <Checkbox
              label="تفعيل وضع الصيانة المؤقت للمنصة"
              description="حجب وصول الزوار وإظهار صفحة أعمال صيانة وتحديث قواعد البيانات (يظل لوحة الإشراف متاحة للمسؤولين)."
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="shadow-hard text-base font-black"
              rightIcon={<Save className="w-5 h-5 stroke-[2.3]" />}
            >
              حفظ وتطبيق الإعدادات
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};
