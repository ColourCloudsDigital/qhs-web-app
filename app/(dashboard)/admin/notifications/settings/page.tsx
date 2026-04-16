import { Metadata } from 'next';
import NotificationSettings from '@/components/dashboard/NotificationSettings';

export const metadata: Metadata = {
  title: 'Admin Notification Settings | Qaras Hospitality Solutions',
  description: 'Manage your notification preferences',
};

export default function AdminNotificationSettingsPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Settings</h1>
        <p className="text-gray-600 dark:text-gray-300">Customize your notification preferences</p>
      </div>
      
      <NotificationSettings />
    </div>
  );
}