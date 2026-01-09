'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, ChevronDown, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { NotificationType, NotificationStatus, UserRole } from '@/lib/types/enums';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: string;
  metadata: any;
  sender?: {
    id: string;
    name: string;
    email: string;
  };
}

const roleNotificationTypes: Record<UserRole, NotificationType[]> = {
  [UserRole.ADMIN]: Object.values(NotificationType),
  [UserRole.SUPER_ADMIN]: Object.values(NotificationType),
  [UserRole.VENDOR]: [
    NotificationType.BOOKING,
    NotificationType.PAYMENT,
    NotificationType.SUBSCRIPTION,
    NotificationType.PROMOTION,
    NotificationType.ANNOUNCEMENT,
    NotificationType.MESSAGE,
    NotificationType.OTHER,
  ],
  [UserRole.STAFF]: [
    NotificationType.MAINTENANCE,
    NotificationType.ANNOUNCEMENT,
    NotificationType.SYSTEM,
    NotificationType.MESSAGE,
    NotificationType.OTHER,
  ],
  [UserRole.CUSTOMER]: [
    NotificationType.BOOKING,
    NotificationType.PAYMENT,
    NotificationType.PROMOTION,
    NotificationType.MESSAGE,
    NotificationType.ANNOUNCEMENT,
  ],
};

export default function NotificationCenter() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<Partial<Record<NotificationType, boolean>>>({});
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userRole = session?.user?.role as UserRole || UserRole.CUSTOMER; // Default to CUSTOMER if not set

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/count');
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?limit=5&status=UNREAD');
      const data = await response.json();
      setNotifications(data.notifications);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setIsLoading(false);
    }
  };

  // Fetch notification preferences
  const fetchPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const response = await fetch('/api/notifications/preferences');
      const data = await response.json();
      setPreferences(data.preferences || {});
      setPreferencesLoading(false);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      setPreferencesLoading(false);
    }
  };

  // Update preference
  const updatePreference = async (type: NotificationType, enabled: boolean) => {
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, enabled }),
      });
      setPreferences(prev => ({ ...prev, [type]: enabled }));
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'mark_read' }),
      });
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id
            ? { ...notification, status: NotificationStatus.READ }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          status: NotificationStatus.READ,
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate based on notification type and metadata
    if (notification.metadata) {
      if (notification.type === NotificationType.BOOKING && notification.metadata.bookingId) {
        router.push(`/dashboard/bookings/${notification.metadata.bookingId}`);
      } else if (notification.type === NotificationType.PAYMENT && notification.metadata.paymentId) {
        router.push(`/dashboard/payments/${notification.metadata.paymentId}`);
      } else if (notification.type === NotificationType.SUBSCRIPTION && notification.metadata.subscriptionId) {
        router.push(`/dashboard/subscription`);
      } else {
        // Default action for other types
        router.push(getViewAllPath());
      }
    } else {
      router.push(getViewAllPath());
    }
    
    setIsOpen(false);
  };

  // Get view all path based on role
  const getViewAllPath = () => {
    switch (userRole) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return '/admin/notifications';
      case UserRole.VENDOR:
        return '/vendor/notifications';
      case UserRole.STAFF:
        return '/staff/notifications';
      case UserRole.CUSTOMER:
        return '/customer/notifications';
      default:
        return '/notifications';
    }
  };

  // Initialize
  useEffect(() => {
    if (session) {
      fetchUnreadCount();
      
      // Set up polling for unread count (every 30 seconds)
      const countInterval = setInterval(fetchUnreadCount, 30000);
      
      return () => {
        clearInterval(countInterval);
      };
    }
  }, [session]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Load preferences when settings open
  useEffect(() => {
    if (isSettingsOpen) {
      fetchPreferences();
    }
  }, [isSettingsOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format notification time
  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BOOKING:
        return <span className="text-blue-500">🏨</span>;
      case NotificationType.PAYMENT:
        return <span className="text-green-500">💰</span>;
      case NotificationType.SUBSCRIPTION:
        return <span className="text-purple-500">🔄</span>;
      case NotificationType.MESSAGE:
        return <span className="text-yellow-500">✉️</span>;
      case NotificationType.ANNOUNCEMENT:
        return <span className="text-red-500">📢</span>;
      default:
        return <span className="text-gray-500">🔔</span>;
    }
  };

  // Get human-readable notification type
  const getNotificationTypeLabel = (type: NotificationType) => {
    return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        className="relative p-2 text-gray-700 hover:text-primary focus:outline-none dark:text-gray-300 dark:hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-md bg-white shadow-lg dark:bg-gray-800 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <p>No new notifications</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`cursor-pointer border-b border-gray-100 dark:border-gray-700 ${
                      notification.status === NotificationStatus.UNREAD
                        ? 'bg-blue-50 dark:bg-blue-900/10'
                        : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex p-4">
                      <div className="mr-3 pt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-start justify-between text-black dark:text-white">
                          <h4 className="font-medium text-black dark:text-white">{notification.title}</h4>
                          <span className="ml-2 shrink-0 text-xs text-black dark:text-white">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{notification.content}</p>
                        {notification.sender && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            From: {notification.sender.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-2 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <Link
                href={getViewAllPath()}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
                <ChevronDown className="ml-1 inline h-3 w-3 transform rotate-270" />
              </Link>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <Settings className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-md bg-white p-4 shadow-lg dark:bg-gray-800 sm:w-96">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Notification Settings</h3>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {preferencesLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {roleNotificationTypes[userRole].map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    {getNotificationTypeLabel(type)}
                  </label>
                  <input
                    type="checkbox"
                    checked={preferences[type] ?? true} // Default to enabled
                    onChange={(e) => updatePreference(type, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}