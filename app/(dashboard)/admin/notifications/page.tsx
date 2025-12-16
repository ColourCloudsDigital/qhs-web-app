import { Metadata } from 'next';
import NotificationList from '@/components/dashboard/NotificationList';

export const metadata: Metadata = {
  title: 'Admin Notifications | Qaras Hotels',
  description: 'Manage and view notifications in the admin dashboard',
};

export default function AdminNotificationsPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p className="text-gray-600 dark:text-gray-300">View and manage your notifications</p>
      </div>
      
      <NotificationList />
    </div>
  );
}