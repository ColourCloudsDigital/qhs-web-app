'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, CheckCircle, AlertTriangle, Save } from 'lucide-react';
import { NotificationType } from '@/lib/types/enums';

interface NotificationPreferenceProps {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  subscribedTypes: NotificationType[];
  unsubscribedTypes: NotificationType[];
}

export default function NotificationSettings() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<NotificationPreferenceProps>({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    subscribedTypes: [],
    unsubscribedTypes: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all notification types dynamically from enum
  const allNotificationTypes: NotificationType[] = Object.values(NotificationType);

  // Fetch user preferences
  useEffect(() => {
    async function fetchPreferences() {
      if (!session) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/notifications/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch preferences');
        }
        const data = await response.json();
        
        setPreferences({
          emailEnabled: data.emailEnabled ?? true,
          pushEnabled: data.pushEnabled ?? true,
          inAppEnabled: data.inAppEnabled ?? true,
          subscribedTypes: data.subscribedTypes ?? [],
          unsubscribedTypes: data.unsubscribedTypes ?? []
        });
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
        setError('Failed to load notification preferences');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPreferences();
  }, [session]);

  // Toggle subscription for notification type
  const toggleNotificationType = (type: NotificationType) => {
    setPreferences(prev => {
      if (prev.subscribedTypes.includes(type)) {
        // Remove from subscribed, add to unsubscribed
        return {
          ...prev,
          subscribedTypes: prev.subscribedTypes.filter(t => t !== type),
          unsubscribedTypes: [...prev.unsubscribedTypes, type]
        };
      } else {
        // Add to subscribed, remove from unsubscribed
        return {
          ...prev,
          subscribedTypes: [...prev.subscribedTypes, type],
          unsubscribedTypes: prev.unsubscribedTypes.filter(t => t !== type)
        };
      }
    });
  };

  // Toggle channel preference
  const toggleChannel = (channel: 'emailEnabled' | 'pushEnabled' | 'inAppEnabled') => {
    setPreferences(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  // Get type name
  const getTypeName = (type: NotificationType) => {
    switch (type) {
      case 'SYSTEM': return 'System Notifications';
      case 'BOOKING': return 'Booking Updates';
      case 'PAYMENT': return 'Payment Notifications';
      case 'SUBSCRIPTION': return 'Subscription Alerts';
      case 'MESSAGE': return 'Messages';
      case 'ANNOUNCEMENT': return 'Announcements';
      default: return type;
    }
  };

  // Get type description
  const getTypeDescription = (type: NotificationType) => {
    switch (type) {
      case 'SYSTEM': 
        return 'Important system alerts and updates about the platform';
      case 'BOOKING': 
        return 'Updates about your bookings, check-ins, and check-outs';
      case 'PAYMENT': 
        return 'Payment confirmations, receipts, and billing alerts';
      case 'SUBSCRIPTION': 
        return 'Updates about your subscription status and renewals';
      case 'MESSAGE': 
        return 'Messages from hotels, staff, or other users';
      case 'ANNOUNCEMENT': 
        return 'News, promotions, and platform announcements';
      default: 
        return '';
    }
  };

  // Save preferences
  const savePreferences = async () => {
    if (!session) return;
    
    try {
      setIsSaving(true);
      setSuccess(false);
      setError(null);
      
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Notification Channels</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-blue-600 dark:text-blue-300" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={() => toggleChannel('emailEnabled')}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-700 dark:after:border-gray-600 dark:peer-checked:bg-primary-dark"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <Bell className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications in your browser</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={preferences.pushEnabled}
                onChange={() => toggleChannel('pushEnabled')}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-700 dark:after:border-gray-600 dark:peer-checked:bg-primary-dark"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-green-600 dark:text-green-300" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">In-App Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications within the application</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={() => toggleChannel('inAppEnabled')}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-700 dark:after:border-gray-600 dark:peer-checked:bg-primary-dark"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Notification Types</h2>
        {allNotificationTypes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No notification types available</p>
        ) : (
          <div className="space-y-4">
            {allNotificationTypes.map(type => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{getTypeName(type)}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getTypeDescription(type)}</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={preferences.subscribedTypes.includes(type)}
                    onChange={() => toggleNotificationType(type)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-700 dark:after:border-gray-600 dark:peer-checked:bg-primary-dark"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        {success && (
          <div className="mr-4 flex items-center text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="mr-1 h-4 w-4" />
            Preferences saved successfully
          </div>
        )}
        
        {error && (
          <div className="mr-4 flex items-center text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="mr-1 h-4 w-4" />
            {error}
          </div>
        )}
        
        <button
          onClick={savePreferences}
          disabled={isSaving}
          className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-darker"
        >
          {isSaving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}