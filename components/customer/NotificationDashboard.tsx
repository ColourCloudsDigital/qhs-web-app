'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Bell, 
  CreditCard, 
  Calendar, 
  MessageSquare, 
  Megaphone, 
  Settings,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { NotificationType, NotificationStatus } from '@/lib/types/enums';

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byStatus: Record<NotificationStatus, number>;
  recent: Array<{
    id: string;
    title: string;
    content: string;
    type: NotificationType;
    status: NotificationStatus;
    createdAt: string;
  }>;
}

export default function NotificationDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchNotificationStats();
    }
  }, [session]);

  const fetchNotificationStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'BOOKING': return <Calendar className="h-5 w-5" />;
      case 'PAYMENT': return <CreditCard className="h-5 w-5" />;
      case 'MESSAGE': return <MessageSquare className="h-5 w-5" />;
      case 'ANNOUNCEMENT': return <Megaphone className="h-5 w-5" />;
      case 'SUBSCRIPTION': return <TrendingUp className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'BOOKING': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'PAYMENT': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'MESSAGE': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'ANNOUNCEMENT': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'SUBSCRIPTION': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: NotificationStatus) => {
    switch (status) {
      case 'UNREAD': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'READ': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ARCHIVED': return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return 'Unknown date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Failed to load notification statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unread</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.unread}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Read</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.byStatus.READ || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Archived</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.byStatus.ARCHIVED || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Notifications</h3>
          <a
            href="/dashboard/notifications"
            className="text-sm text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
          >
            View all
          </a>
        </div>
        
        {stats.recent.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No recent notifications</p>
        ) : (
          <div className="space-y-3">
            {stats.recent.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-3 rounded-lg p-3 ${
                  notification.status === 'UNREAD'
                    ? 'bg-blue-50 dark:bg-blue-900/10'
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getTypeColor(notification.type)}`}>
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {notification.title}
                    </p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(notification.status)}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {notification.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}