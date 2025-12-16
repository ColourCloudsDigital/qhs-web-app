'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface NotificationPromptProps {
  onClose: () => void;
}

export default function NotificationPrompt({ onClose }: NotificationPromptProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  
  const requestPermission = async () => {
    setIsRequesting(true);
    
    try {
      if (typeof Notification !== 'undefined') {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Permission granted, you could subscribe the user to push notifications here
          // This would involve registering a subscription with your backend
          console.log('Notification permission granted');
          
          // Check if service worker is ready
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            
            // You would typically send this subscription to your server
            // for later use when sending push notifications
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(
                // This is your VAPID public key from your server
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
              )
            });
            
            console.log('Push subscription:', subscription);
            
            // Here you would send the subscription to your server
            // await fetch('/api/notifications/subscribe', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(subscription)
            // });
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
      onClose();
    }
  };
  
  return (
    <div className="fixed bottom-20 left-4 z-40 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3 h-10 w-10 relative">
            <Image
              src="/assets/icons/notification.png"
              alt="Enable Notifications"
              fill
              className="object-contain"
            />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Enable Notifications
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Get notified about new bookings, check-ins, and important updates to stay on top of your hotel operations.
      </p>
      
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Not now
        </button>
        <button
          onClick={requestPermission}
          disabled={isRequesting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:bg-primary-light disabled:cursor-not-allowed"
        >
          {isRequesting ? 'Requesting...' : 'Allow'}
        </button>
      </div>
    </div>
  );
}

// Helper function to convert a base64 string to a Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
} 