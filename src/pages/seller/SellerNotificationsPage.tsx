import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export const SellerNotificationsPage: React.FC = () => {
  return (
    <DashboardLayout
      role="seller"
      title="مركز الإشعارات والتنبيهات"
      subtitle="متابعة حالة العقارات، طلبات المعاينة الميدانية، واستفسارات المشترين الفورية."
    >
      <NotificationCenter
        role="seller"
        title="إشعارات البائع"
        subtitle="تنبيهات فورية بحالة العقارات، المراجعة القانونية، ومواعيد المعاينة."
      />
    </DashboardLayout>
  );
};
