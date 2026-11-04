import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export const BuyerNotificationsPage: React.FC = () => {
  return (
    <DashboardLayout
      role="buyer"
      title="الإشعارات والتنبيهات"
      subtitle="متابعة تحديثات مواعيد المعاينة، ردود الملاك، وتغيرات أسعار العقارات في مفضلتك."
    >
      <NotificationCenter
        role="buyer"
        title="إشعارات المشتري"
        subtitle="تنبيهات فورية بمواعيد المعاينة وردود الملاك وتحديثات الأسعار."
      />
    </DashboardLayout>
  );
};
