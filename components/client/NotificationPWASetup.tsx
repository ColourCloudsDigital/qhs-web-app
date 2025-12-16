'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, BellOff, AlertTriangle, CheckCircle } from 'lucide-react';

// Notification permission status
type PermissionStatus = 'default' | 'granted' | 'denied';

export default function NotificationPWASetup() {
  const { data: session } = useSession();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [serviceWorkerAvailable, setServiceWorkerAvailable] = useState(false);

  // Check if push notifications are supported
  const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  };

  useEffect(() => {
    // Check service worker and permission status on load
    const checkServiceWorkerStatus = async () => {
      if (!isPushSupported()) {
        setServiceWorkerAvailable(false);
        return;
      }

      setServiceWorkerAvailable(true);
      const permission = Notification.permission as PermissionStatus;
      setPermissionStatus(permission);

      // If permission is already granted, check for existing subscription
      if (permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          const existingSubscription = await registration.pushManager.getSubscription();
          setSubscription(existingSubscription);
        } catch (error) {
          console.error('Error checking existing subscription:', error);
        }
      }
    };

    checkServiceWorkerStatus();
  }, []);

  // Register service worker
  const registerServiceWorker = async () => {
    try {
      await navigator.serviceWorker.register('/service-worker.js');
      return true;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return false;
    }
  };

  // Get VAPID public key from environment
  const getVapidPublicKey = () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('VAPID public key is not set');
    }
    return urlBase64ToUint8Array(publicKey);
  };

  // Convert base64 string to Uint8Array for push subscription
  const urlBase64ToUint8Array = (base64String: string) => {
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
  };

  // Subscribe to push notifications
  const subscribeToPush = async () => {
    if (!session?.user?.id) {
      setError('You need to be logged in to enable notifications');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Request permission if not already granted
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission as PermissionStatus);
        
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Register service worker if needed
      let swRegistration;
      try {
        swRegistration = await navigator.serviceWorker.ready;
      } catch (error) {
        const registered = await registerServiceWorker();
        if (!registered) {
          throw new Error('Failed to register service worker');
        }
        swRegistration = await navigator.serviceWorker.ready;
      }

      // Get subscription from push manager or create new one
      let currentSubscription = await swRegistration.pushManager.getSubscription();
      
      if (!currentSubscription) {
        // Create new subscription
        const subscriptionOptions = {
          userVisibleOnly: true,
          applicationServerKey: getVapidPublicKey()
        };
        
        currentSubscription = await swRegistration.pushManager.subscribe(subscriptionOptions);
      }
      
      setSubscription(currentSubscription);

      // Send subscription to server
      const response = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: currentSubscription,
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }

      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      setError(error.message || 'Failed to enable push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribeFromPush = async () => {
    if (!subscription) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();
      
      // Delete subscription from server
      await fetch(`/api/push-subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
        method: 'DELETE'
      });
      
      setSubscription(null);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error unsubscribing from push notifications:', error);
      setError(error.message || 'Failed to disable push notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // If push is not supported, show a message
  if (!serviceWorkerAvailable) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Push notifications not supported</h3>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              Your browser does not support push notifications. Please use a modern browser like Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white">Push Notifications</h2>
      
      <div className="mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Receive push notifications in your browser even when you&apos;re not using the app.
        </p>
        
        {/* Status and actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            {subscription ? (
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Bell className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
            ) : (
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <BellOff className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {subscription ? 'Push notifications are enabled' : 'Push notifications are disabled'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {permissionStatus === 'granted' 
                  ? 'Permission granted' 
                  : permissionStatus === 'denied' 
                    ? 'Permission denied - please reset permission in browser settings'
                    : 'Permission not requested yet'}
              </p>
            </div>
          </div>
          
          {subscription ? (
            <button
              type="button"
              onClick={unsubscribeFromPush}
              disabled={isLoading}
              className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              {isLoading ? 'Disabling...' : 'Disable Notifications'}
            </button>
          ) : (
            <button
              type="button"
              onClick={subscribeToPush}
              disabled={isLoading || permissionStatus === 'denied'}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-darker"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Success message */}
        {success && (
          <div className="mt-4 rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  {subscription ? 'Push notifications enabled successfully!' : 'Push notifications disabled successfully!'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Help text for denied permissions */}
        {permissionStatus === 'denied' && (
          <div className="mt-4 rounded-md bg-amber-50 p-3 dark:bg-amber-900/20">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <div className="ml-3">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Notification permission has been denied in your browser. To enable notifications, you need to reset 
                  permissions in your browser settings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}