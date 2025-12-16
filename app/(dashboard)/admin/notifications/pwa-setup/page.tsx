import { Metadata } from 'next';
import NotificationPWASetup from '@/components/client/NotificationPWASetup';

export const metadata: Metadata = {
  title: 'Push Notification Setup | Qaras Hotels',
  description: 'Set up push notifications for your account',
};

export default function NotificationPWASetupPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Push Notification Setup</h1>
        <p className="text-gray-600 dark:text-gray-300">Configure push notifications for your browser</p>
      </div>
      
      <NotificationPWASetup />
    </div>
  );
}