'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
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
  InfoIcon
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
      case 'BOOKING': return <Bell className="h-5 w-5 text-blue-500" />;
      case 'PAYMENT': return <Bell className="h-5 w-5 text-green-500" />;
      case 'SUBSCRIPTION': return <Bell className="h-5 w-5 text-purple-500" />;
      case 'MESSAGE': return <Bell className="h-5 w-5 text-yellow-500" />;
      case 'ANNOUNCEMENT': return <Bell className="h-5 w-5 text-red-500" />;
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
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Time</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
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
                        <div>
                          <div className="font-medium">
                            {notification.title}
                          </div>
                          <div className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                            {notification.content.length > 100
                              ? `${notification.content.substring(0, 100)}...`
                              : notification.content}
                          </div>
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
                        {notification.status === 'UNREAD' && (
                          <button
                            onClick={() => handleBulkAction('mark_read')}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {notification.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleBulkAction('archive')}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleBulkAction('delete')}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}