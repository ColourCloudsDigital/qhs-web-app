import { Metadata } from 'next';
import SendNotificationForm from '@/components/admin/notifications/SendNotificationForm';

export const metadata: Metadata = {
  title: 'Send Notifications | Qaras Hotels Admin',
  description: 'Send notifications to users of the platform',
};

export default function AdminSendNotificationPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Send Notifications</h1>
        <p className="text-gray-600 dark:text-gray-300">Create and send notifications to users of the platform</p>
      </div>
      
      <SendNotificationForm />
    </div>
  );
}