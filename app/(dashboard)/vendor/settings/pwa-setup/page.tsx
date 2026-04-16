'use client';

import { useState } from 'react';
import NotificationPWASetup from '@/components/client/NotificationPWASetup';
import DashboardSection from '@/components/dashboard/DashboardSection';

export default function PWASetupPage() {
  return (
    <DashboardSection
      title="PWA & Offline Setup"
      description="Configure your application for offline use and push notifications"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Offline Mode</h2>
          
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            Qaras Hospitality Solutions is designed to work offline. When your device is offline:
          </p>
          
          <ul className="mb-4 list-inside list-disc space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>You can view previously loaded bookings and hotel data</li>
            <li>Any changes you make will be queued and synchronized when you&apos;re back online</li>
            <li>Check-ins and check-outs work offline and sync later</li>
            <li>You&apos;ll see an offline indicator when you lose connection</li>
          </ul>
          
          <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              For the best offline experience, install Qaras Hospitality Solutions as a PWA (Progressive Web App) using the install prompt or your browser&apos;s menu.
            </p>
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Push Notifications</h2>
          
          <NotificationPWASetup />
        </div>
      </div>
    </DashboardSection>
  );
} 