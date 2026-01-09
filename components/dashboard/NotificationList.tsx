'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, Transition } from '@headlessui/react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Archive, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  InfoIcon,
  X,
  Eye,
  Calendar,
  CreditCard,
  MessageSquare,
  Megaphone,
  Settings as SettingsIcon
} from 'lucide-react';
import { NotificationType, NotificationStatus } from '@/lib/types/enums';
import { useSession } from 'next-auth/react';

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

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function NotificationList() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  
  // States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<NotificationStatus | 'ALL'>(
    (searchParams.get('status') as NotificationStatus) || 'ALL'
  );
  const [selectedType, setSelectedType] = useState<NotificationType | 'ALL'>(
    (searchParams.get('type') as NotificationType) || 'ALL'
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Get current page from URL or default to 1
  const currentPage = searchParams.get('page') 
    ? parseInt(searchParams.get('page') as string) 
    : 1;

  // Fetch notifications (optionally for a specific page)
  const fetchNotifications = async (pageParam?: number) => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const pageToUse = pageParam ?? currentPage;
      let url = `/api/notifications?page=${pageToUse}&limit=${pagination.limit}`;
      
      if (selectedStatus !== 'ALL') {
        url += `&status=${selectedStatus}`;
      }
      
      if (selectedType !== 'ALL') {
        url += `&type=${selectedType}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      setNotifications(data.notifications);
      setPagination(data.pagination);
      setSelectedIds([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [session, currentPage, selectedStatus, selectedType]);

  // Handle status filter change
  const handleStatusChange = (status: NotificationStatus | 'ALL') => {
    // Update UI state, update the URL without triggering a Next.js navigation,
    // and fetch page 1 of results directly to avoid layout/middleware redirects.
    setSelectedStatus(status);
    try {
      const newUrl = `/dashboard/notifications?page=1&status=${status}&type=${selectedType}`;
      window.history.replaceState(null, '', newUrl);
    } catch (e) {
      // ignore history errors in non-browser env (safe-guard)
    }
    fetchNotifications(1);
  };

  // Handle type filter change
  const handleTypeChange = (type: NotificationType | 'ALL') => {
    // Update UI state, update the URL without triggering a Next.js navigation,
    // and fetch page 1 of results directly to avoid layout/middleware redirects.
    setSelectedType(type);
    try {
      const newUrl = `/dashboard/notifications?page=1&status=${selectedStatus}&type=${type}`;
      window.history.replaceState(null, '', newUrl);
    } catch (e) {
      // ignore history errors in non-browser env (safe-guard)
    }
    fetchNotifications(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    router.push(`/dashboard/notifications?page=${page}&status=${selectedStatus}&type=${selectedType}`);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
    setSelectAll(!selectAll);
  };

  // Toggle select one notification
  const toggleSelectNotification = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      setSelectAll(false);
    } else {
      setSelectedIds([...selectedIds, id]);
      // Check if all are now selected
      if (selectedIds.length + 1 === notifications.length) {
        setSelectAll(true);
      }
    }
  };

  // Handle individual notification actions
  const handleNotificationAction = async (notificationId: string, action: 'mark_read' | 'archive' | 'delete') => {
    try {
      setActionLoading(notificationId);
      
      if (action === 'delete') {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete notification');
        }
        
        // Remove from local state
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification.id !== notificationId)
        );
      } else {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to ${action.replace('_', ' ')} notification`);
        }
        
        // Update local state
        if (action === 'mark_read') {
          setNotifications(prevNotifications =>
            prevNotifications.map(notification =>
              notification.id === notificationId
                ? { ...notification, status: NotificationStatus.READ }
                : notification
            )
          );
        } else if (action === 'archive') {
          if (selectedStatus !== NotificationStatus.ARCHIVED) {
            // Remove from list if not viewing archived
            setNotifications(prevNotifications =>
              prevNotifications.filter(notification => notification.id !== notificationId)
            );
          } else {
            // Update status if viewing archived
            setNotifications(prevNotifications =>
              prevNotifications.map(notification =>
                notification.id === notificationId
                  ? { ...notification, status: NotificationStatus.ARCHIVED }
                  : notification
              )
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error performing ${action} on notification:`, error);
      alert(`Failed to ${action.replace('_', ' ')} notification. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle viewing notification details
  const handleViewNotification = async (notification: Notification) => {
    setSelectedNotification(notification);
    setViewModalOpen(true);
    
    // Mark as read if it's unread
    if (notification.status === NotificationStatus.UNREAD) {
      await handleNotificationAction(notification.id, 'mark_read');
    }
  };
  // Bulk actions handler
  const handleBulkAction = async (action: 'mark_read' | 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;

    try {
      if (action === 'mark_read') {
        await Promise.all(selectedIds.map(id => 
          fetch(`/api/notifications/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_read' }),
          })
        ));
        
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            selectedIds.includes(notification.id)
              ? { ...notification, status: NotificationStatus.READ }
              : notification
          )
        );
      } else if (action === 'archive') {
        await Promise.all(selectedIds.map(id => 
          fetch(`/api/notifications/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'archive' }),
          })
        ));
        
        // Remove archived notifications from the list if we're not viewing archived
        if (selectedStatus !== NotificationStatus.ARCHIVED) {
          setNotifications(prevNotifications =>
            prevNotifications.filter(notification => !selectedIds.includes(notification.id))
          );
        } else {
          setNotifications(prevNotifications =>
            prevNotifications.map(notification =>
              selectedIds.includes(notification.id)
                ? { ...notification, status: NotificationStatus.ARCHIVED }
                : notification
            )
          );
        }
      } else if (action === 'delete') {
        await Promise.all(selectedIds.map(id => 
          fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
          })
        ));
        
        // Remove deleted notifications from the list
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => !selectedIds.includes(notification.id))
        );
      }
      
      // Clear selection
      setSelectedIds([]);
      setSelectAll(false);
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error);
      alert(`Failed to ${action.replace('_', ' ')} notifications. Please try again.`);
    }
  };

  // Format notification date
  const formatNotificationDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(date);
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Get notification type display name
  const getNotificationTypeName = (type: NotificationType) => {
    switch (type) {
      case 'BOOKING': return 'Booking';
      case 'PAYMENT': return 'Payment';
      case 'SUBSCRIPTION': return 'Subscription';
      case 'MESSAGE': return 'Message';
      case 'ANNOUNCEMENT': return 'Announcement';
      case 'SYSTEM': return 'System';
      default: return type;
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'BOOKING': return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'PAYMENT': return <CreditCard className="h-5 w-5 text-green-500" />;
      case 'SUBSCRIPTION': return <SettingsIcon className="h-5 w-5 text-purple-500" />;
      case 'MESSAGE': return <MessageSquare className="h-5 w-5 text-yellow-500" />;
      case 'ANNOUNCEMENT': return <Megaphone className="h-5 w-5 text-red-500" />;
      case 'SYSTEM': return <Bell className="h-5 w-5 text-gray-500" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: NotificationStatus) => {
    switch (status) {
      case 'UNREAD': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'READ': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'ARCHIVED': return <Archive className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and actions */}
      <div className="flex flex-col items-start justify-between space-y-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800 sm:flex-row sm:items-center sm:space-y-0">
        <div className="flex w-full flex-col space-y-2 sm:w-auto sm:flex-row sm:space-x-4 sm:space-y-0">
          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value as NotificationStatus | 'ALL')}
              className="block rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="ALL">All statuses</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          
          {/* Type filter */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value as NotificationType | 'ALL')}
              className="block rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="ALL">All types</option>
              <option value="SYSTEM">System</option>
              <option value="BOOKING">Booking</option>
              <option value="PAYMENT">Payment</option>
              <option value="SUBSCRIPTION">Subscription</option>
              <option value="MESSAGE">Message</option>
              <option value="ANNOUNCEMENT">Announcement</option>
            </select>
          </div>
        </div>
        
        <div className="flex w-full items-center justify-between space-x-2 sm:w-auto sm:justify-end">
          {/* Refresh button */}
          <button
            onClick={() => fetchNotifications()}
            className="inline-flex items-center rounded-md px-2 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="ml-1">Refresh</span>
          </button>
          
          {/* Bulk actions: Only show when items are selected */}
          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('mark_read')}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Mark Read
              </button>
              
              <button
                onClick={() => handleBulkAction('archive')}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                <Archive className="mr-1 h-3.5 w-3.5" />
                Archive
              </button>
              
              <button
                onClick={() => handleBulkAction('delete')}
                className="inline-flex items-center rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-700 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Notifications list */}
      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Bell className="mb-2 h-10 w-10 opacity-40" />
            <p>No notifications found</p>
            <p className="text-sm">Adjust filters or check back later</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary-dark"
                    />
                  </th>
                  <th className="w-[30%] px-2 py-2 text-left">Title</th>
                  <th className="w-[15%] px-2 py-2 text-left">Type</th>
                  <th className="hidden sm:table-cell w-[30%] px-2 py-2 text-left">Time</th>
                  <th className="w-[15%] px-2 py-2 text-left">Status</th>
                  <th className="w-[20%] px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      notification.status === 'UNREAD'
                        ? 'bg-blue-50 dark:bg-blue-900/10'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => toggleSelectNotification(notification.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary-dark"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="mr-3">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </div>
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                            {notification.content.length > 100
                              ? `${notification.content.substring(0, 100)}...`
                              : notification.content}
                          </div>
                          {notification.sender && (
                            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                              From: {notification.sender.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {getNotificationTypeName(notification.type)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 text-sm text-gray-500 dark:text-gray-400 sm:table-cell">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {formatNotificationDate(notification.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(notification.status)}
                        <span className="ml-1 text-sm capitalize">
                          {notification.status.toLowerCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewNotification(notification)}
                          className="rounded p-1 text-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Mark as Read Button */}
                        {notification.status === 'UNREAD' && (
                          <button
                            onClick={() => handleNotificationAction(notification.id, 'mark_read')}
                            disabled={actionLoading === notification.id}
                            className="rounded p-1 text-green-500 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300 disabled:opacity-50"
                            title="Mark as read"
                          >
                            {actionLoading === notification.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent"></div>
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        
                        {/* Archive Button */}
                        {notification.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleNotificationAction(notification.id, 'archive')}
                            disabled={actionLoading === notification.id}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
                            title="Archive"
                          >
                            {actionLoading === notification.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleNotificationAction(notification.id, 'delete')}
                          disabled={actionLoading === notification.id}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 disabled:opacity-50"
                          title="Delete"
                        >
                          {actionLoading === notification.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && notifications.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium ${
                      pagination.page === 1
                        ? 'text-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-600'
                        : 'text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === pagination.pages || 
                      (page >= pagination.page - 1 && page <= pagination.page + 1)
                    )
                    .map((page, i, array) => {
                      // Add ellipsis if needed
                      if (i > 0 && array[i - 1] !== page - 1) {
                        return (
                          <span
                            key={`ellipsis-${page}`}
                            className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          >
                            ...
                          </span>
                        );
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center border ${
                            page === pagination.page
                              ? 'z-10 border-primary bg-primary-50 text-primary dark:border-primary-dark dark:bg-primary-900/20 dark:text-primary-light'
                              : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                          } px-4 py-2 text-sm font-medium`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page === pagination.pages}
                    className={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium ${
                      pagination.page === pagination.pages
                        ? 'text-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-600'
                        : 'text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Mobile pagination */}
            <div className="flex w-full items-center justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                  pagination.page === 1
                    ? 'text-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-600'
                    : 'text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.pages}
              </div>
              <button
                onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                disabled={pagination.page === pagination.pages}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                  pagination.page === pagination.pages
                    ? 'text-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-600'
                    : 'text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Notification Detail Modal */}
      <Transition appear show={viewModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setViewModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                  {selectedNotification && (
                    <>
                      {/* Modal Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(selectedNotification.type)}
                          </div>
                          <div>
                            <Dialog.Title
                              as="h3"
                              className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                            >
                              {selectedNotification.title}
                            </Dialog.Title>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                {getNotificationTypeName(selectedNotification.type)}
                              </span>
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                {getStatusIcon(selectedNotification.status)}
                                <span className="ml-1 capitalize">
                                  {selectedNotification.status.toLowerCase()}
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="mr-1 h-4 w-4" />
                                {formatNotificationDate(selectedNotification.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-gray-500 dark:hover:text-gray-400"
                          onClick={() => setViewModalOpen(false)}
                        >
                          <span className="sr-only">Close</span>
                          <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Sender Information */}
                      {selectedNotification.sender && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">From:</span> {selectedNotification.sender.name}
                          </div>
                          {selectedNotification.sender.email && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {selectedNotification.sender.email}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notification Content */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Message</h4>
                        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                          <p className="whitespace-pre-wrap">{selectedNotification.content}</p>
                        </div>
                      </div>

                      {/* Metadata */}
                      {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Additional Details</h4>
                          <div className="bg-gray-50 rounded-lg p-3 dark:bg-gray-700">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                              {Object.entries(selectedNotification.metadata).map(([key, value]) => {
                                if (key === 'action' || key === 'notificationType') return null;
                                
                                let displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                let displayValue = value;
                                
                                // Format specific metadata fields
                                if (key === 'amount' && typeof value === 'number') {
                                  displayValue = `₦${value.toLocaleString()}`;
                                } else if (key.includes('Date') && typeof value === 'string') {
                                  displayValue = formatNotificationDate(value);
                                } else if (typeof value === 'object') {
                                  displayValue = JSON.stringify(value, null, 2);
                                }
                                
                                return (
                                  <div key={key}>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                      {displayKey}
                                    </dt>
                                    <dd className="text-sm text-gray-900 dark:text-white">
                                      {typeof displayValue === 'object' ? (
                                        <pre className="text-xs bg-gray-100 p-2 rounded dark:bg-gray-600 overflow-x-auto">
                                          {JSON.stringify(displayValue, null, 2)}
                                        </pre>
                                      ) : (
                                        displayValue?.toString() || 'N/A'
                                      )}
                                    </dd>
                                  </div>
                                );
                              })}
                            </dl>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end space-x-3">
                        {selectedNotification.status === 'UNREAD' && (
                          <button
                            type="button"
                            onClick={() => {
                              handleNotificationAction(selectedNotification.id, 'mark_read');
                              setViewModalOpen(false);
                            }}
                            className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Mark as Read
                          </button>
                        )}
                        
                        {selectedNotification.status !== 'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() => {
                              handleNotificationAction(selectedNotification.id, 'archive');
                              setViewModalOpen(false);
                            }}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => {
                            handleNotificationAction(selectedNotification.id, 'delete');
                            setViewModalOpen(false);
                          }}
                          className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setViewModalOpen(false)}
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}