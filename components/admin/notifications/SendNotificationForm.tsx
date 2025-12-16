'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { NotificationType, UserRole } from '@/lib/types/enums';
import { Send, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function SendNotificationForm() {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<string>('ANNOUNCEMENT');
  const [recipientType, setRecipientType] = useState<'ALL' | 'VENDOR' | 'CUSTOMER' | 'STAFF' | 'SUPER_ADMIN'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Additional filters
  const [filter, setFilter] = useState({
    roles: [] as UserRole[],
    hotelId: '',
    isActive: true
  });
  
  // List of hotels for filtering
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
  
  // Fetch hotels for the filter dropdown
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch('/api/hotels');
        const data = await response.json();
        setHotels(data.hotels || []);
      } catch (error) {
        console.error('Error fetching hotels:', error);
      }
    };
    
    fetchHotels();
  }, []);
  
  // Reset form
  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('ANNOUNCEMENT');
    setRecipientType('ALL');
    setFilter({
      roles: [],
      hotelId: '',
      isActive: true
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      setError('You must be logged in to send notifications');
      return;
    }
    
    if (!title || !content) {
      setError('Title and content are required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          type,
          recipientType,
          filter: {
            roles: filter.roles.length > 0 ? filter.roles : undefined,
            hotelId: filter.hotelId || undefined,
            isActive: filter.isActive
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notification');
      }
      
      const data = await response.json();
      
      setSuccess(true);
      resetForm();
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending the notification');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle role selection in filter
  const toggleRoleFilter = (role: UserRole) => {
    if (filter.roles.includes(role)) {
      setFilter({
        ...filter,
        roles: filter.roles.filter(r => r !== role)
      });
    } else {
      setFilter({
        ...filter,
        roles: [...filter.roles, role]
      });
    }
  };
  
  return (
    <div className="rounded-lg bg-white shadow dark:bg-gray-800">
      <div className="border-b border-gray-200 p-6 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Send New Notification</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create and send notifications to users of the platform
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {/* Success message */}
        {success && (
          <div className="mb-6 flex items-center rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="mr-2 h-5 w-5" />
            <span>Notification sent successfully!</span>
            <button
              type="button"
              className="ml-auto text-green-800 hover:text-green-900 dark:text-green-300 dark:hover:text-green-200"
              onClick={() => setSuccess(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-center rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>{error}</span>
            <button
              type="button"
              className="ml-auto text-red-800 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200"
              onClick={() => setError(null)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Notification Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notification Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
            >
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="SYSTEM">System</option>
              <option value="BOOKING">Booking</option>
              <option value="PAYMENT">Payment</option>
              <option value="SUBSCRIPTION">Subscription</option>
              <option value="MESSAGE">Message</option>
            </select>
          </div>
          
          {/* Recipient Type */}
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Recipients
            </label>
            <select
              id="recipient"
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value as any)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm"
            >
              <option value="ALL">All Users</option>
              <option value="VENDOR">Vendors Only</option>
              <option value="CUSTOMER">Customers Only</option>
              <option value="STAFF">Staff Only</option>
              <option value="SUPER_ADMIN">Admins Only</option>
            </select>
          </div>
          
          {/* Additional Filters */}
          <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
            <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional Filters (Optional)
            </h3>
            
            {recipientType === 'STAFF' && (
              <div className="mb-4">
                <label htmlFor="hotelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter by Hotel
                </label>
                <select
                  id="hotelId"
                  value={filter.hotelId}
                  onChange={(e) => setFilter({ ...filter, hotelId: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Hotels</option>
                  {hotels.map(hotel => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* User Status */}
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  id="active-users"
                  type="checkbox"
                  checked={filter.isActive}
                  onChange={() => setFilter({ ...filter, isActive: !filter.isActive })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary-dark"
                />
                <label htmlFor="active-users" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Only send to active users
                </label>
              </div>
            </div>
            
            {/* Role Filters - Only show if ALL is selected */}
            {recipientType === 'ALL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter by Role (optional)
                </label>
                <div className="mt-2 space-y-2">
                  {(['VENDOR', 'CUSTOMER', 'STAFF', 'SUPER_ADMIN'] as UserRole[]).map((role) => (
                    <div key={role} className="flex items-center">
                      <input
                        id={`role-${role}`}
                        type="checkbox"
                        checked={filter.roles.includes(role)}
                        onChange={() => toggleRoleFilter(role)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:focus:ring-primary-dark"
                      />
                      <label htmlFor={`role-${role}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        {role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notification Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Enter notification title"
            />
          </div>
          
          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notification Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Enter notification content"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isLoading || !title || !content}
              className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 dark:bg-primary-dark dark:hover:bg-primary-darker"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}