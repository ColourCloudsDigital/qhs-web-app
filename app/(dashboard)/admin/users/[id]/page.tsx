'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { PencilIcon, TrashIcon, ArrowLeftIcon, UserIcon } from '@heroicons/react/24/outline';
import { UserRole } from '@/lib/types/enums';
import { useRouter } from 'next/navigation';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  updatedAt: string;
  emailVerified?: string;
  verificationToken?: string;
  verificationExpires?: string;
  userPhoto?: string;
  customer?: {
    id: string;
    phone?: string;
    address?: string;
  };
  vendor?: {
    id: string;
    companyName: string;
    businessAddress?: string;
    businessPhone?: string;
    taxId?: string;
    subscriptionStatus: string;
    subscriptionPlanId?: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    subscriptionPlanName?: string;
  };
  staff?: {
    id: string;
    position: string;
    hotelId?: string;
    hotel?: {
      id: string;
      name: string;
    };
    vendorId?: string;
    vendor?: {
      id: string;
      companyName: string;
    };
    permissions?: string;
  };
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const userId = params.id;
  const router = useRouter();
  
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    fetchUserData();
  }, []);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const { user } = await response.json();
      setUserData(user);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }
      
      // Redirect to users list on success
      router.push('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleImpersonateUser = async () => {
    try {
      setImpersonating(true);
      const response = await fetch('/api/admin/users/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userData?.id }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to impersonate user');
      }
      
      const data = await response.json();
      
      // Force a complete page refresh instead of client-side navigation
      window.location.href = data.redirectPath;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to impersonate user');
      console.error('Error impersonating user:', err);
    } finally {
      setImpersonating(false);
      setShowImpersonateModal(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  if (error || !userData) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="mb-4 text-red-500">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Error</h2>
        <p className="mb-4 text-center text-gray-600 dark:text-gray-400">{error || 'Failed to load user data'}</p>
        <div className="flex space-x-3">
          <Link 
            href="/admin/users" 
            className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Back to Users
          </Link>
          <button
            onClick={fetchUserData}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
      case UserRole.VENDOR:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case UserRole.STAFF:
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case UserRole.CUSTOMER:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      case UserRole.ADMIN:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
  };
  
  // Parse permissions if available for staff users
  const userPermissions = userData.staff?.permissions 
    ? JSON.parse(userData.staff.permissions) 
    : [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/admin/users" 
            className="mr-4 rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowImpersonateModal(true)}
            disabled={impersonating}
            className="flex items-center rounded-md bg-blue-100 px-4 py-2 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-900/75 disabled:opacity-50"
          >
            <UserIcon className="mr-1.5 h-4 w-4" />
            Impersonate User
          </button>
          <Link 
            href={`/admin/users/${userId}/edit`}
            className="flex items-center rounded-md bg-amber-100 px-4 py-2 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-900/75"
          >
            <PencilIcon className="mr-1.5 h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center rounded-md bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900/75"
          >
            <TrashIcon className="mr-1.5 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Basic User Information */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeColor(userData.role)}`}>
                  {userData.role.replace('_', ' ')}
                </span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeColor(userData.isActive)}`}>
                  {userData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{userData.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                <p className="mt-1 text-base text-gray-900 dark:text-white">{userData.email}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</p>
                <p className="mt-1 text-base text-gray-900 dark:text-white">{formatDate(userData.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                <p className="mt-1 text-base text-gray-900 dark:text-white">{userData.lastLoginAt ? formatDate(userData.lastLoginAt) : 'Never'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</p>
                <p className="mt-1 text-base text-gray-900 dark:text-white">
                  {userData.emailVerified ? formatDate(userData.emailVerified) : 'Not verified'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="mt-1 text-base text-gray-900 dark:text-white">{formatDate(userData.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* User Photo/Avatar */}
        <div>
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <div className="flex flex-col items-center justify-center">
              {userData.userPhoto ? (
                <div className="h-32 w-32 overflow-hidden rounded-full">
                  <img 
                    src={userData.userPhoto} 
                    alt={`${userData.name}'s profile photo`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-4xl font-bold">{userData.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{userData.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{userData.email}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Role-specific Information */}
      {userData.role === UserRole.VENDOR && userData.vendor && (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Vendor Information</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{userData.vendor.companyName}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Phone</p>
              <p className="mt-1 text-base text-gray-900 dark:text-white">{userData.vendor.businessPhone || 'Not set'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tax ID</p>
              <p className="mt-1 text-base text-gray-900 dark:text-white">{userData.vendor.taxId || 'Not set'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Address</p>
              <p className="mt-1 text-base text-gray-900 dark:text-white">{userData.vendor.businessAddress || 'Not set'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription Status</p>
              <p className="mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                {userData.vendor.subscriptionStatus}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription Plan</p>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-base text-gray-900 dark:text-white">
                  {userData.vendor.subscriptionPlanName || 'No Plan'}
                </span>
                <Link 
                  href={`/admin/users/${userId}/edit`}
                  className="rounded-full p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
                  title="Edit subscription plan"
                >
                  <PencilIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {userData.vendor.subscriptionStartDate && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription Start</p>
                <p className="mt-1 text-base text-gray-900 dark:text-white">{formatDate(userData.vendor.subscriptionStartDate)}</p>
              </div>
            )}
            
            {userData.vendor.subscriptionEndDate && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription End</p>
                <p className="mt-1 text-base text-gray-900 dark:text-white">{formatDate(userData.vendor.subscriptionEndDate)}</p>
              </div>
            )}
          </div>
          
          {/* Quick actions for vendor */}
          <div className="mt-6">
            <Link 
              href={`/admin/vendors/${userData.vendor.id}`}
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              View Vendor Dashboard
            </Link>
          </div>
        </div>
      )}
      
      {userData.role === UserRole.CUSTOMER && userData.customer && (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Customer Information</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
              <p className="mt-1 text-base text-gray-900 dark:text-white">{userData.customer.phone || 'Not set'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
              <p className="mt-1 text-base text-gray-900 dark:text-white">{userData.customer.address || 'Not set'}</p>
            </div>
          </div>
          
          {/* Quick actions for customer */}
          <div className="mt-6">
            <Link 
              href={`/admin/bookings?customer=${userData.customer.id}`}
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              View Customer Bookings
            </Link>
          </div>
        </div>
      )}
      
      {userData.role === UserRole.STAFF && userData.staff && (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Staff Information</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Position</p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{userData.staff.position}</p>
            </div>
            
            {userData.staff.vendorId && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor</p>
                <p className="mt-1">
                  {userData.staff.vendor ? (
                    <Link 
                      href={`/admin/vendors/${userData.staff.vendorId}`}
                      className="text-primary hover:underline"
                    >
                      {userData.staff.vendor.companyName}
                    </Link>
                  ) : (
                    <span className="text-gray-900 dark:text-white">Vendor ID: {userData.staff.vendorId}</span>
                  )}
                </p>
              </div>
            )}
            
            {userData.staff.hotelId && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hotel</p>
                <p className="mt-1">
                  {userData.staff.hotel ? (
                    <Link 
                      href={`/admin/hotels/${userData.staff.hotelId}`}
                      className="text-primary hover:underline"
                    >
                      {userData.staff.hotel.name}
                    </Link>
                  ) : (
                    <span className="text-gray-900 dark:text-white">Hotel ID: {userData.staff.hotelId}</span>
                  )}
                </p>
              </div>
            )}
          </div>
          
          {/* Staff permissions */}
          {userPermissions.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-md font-medium text-gray-700 dark:text-gray-300">Permissions</h3>
              <div className="flex flex-wrap gap-2">
                {userPermissions.map((permission: string) => (
                  <span 
                    key={permission}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 bg-white p-6 dark:border-red-900/50 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Deleting this user will permanently remove their account and all associated data.
          This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteUser}
          className="flex items-center rounded-md bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900/75"
        >
          <TrashIcon className="mr-1.5 h-4 w-4" />
          Delete User Account
        </button>
      </div>
      
      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showImpersonateModal}
        onClose={() => setShowImpersonateModal(false)}
        onConfirm={handleImpersonateUser}
        title="Impersonate User"
        message={`Are you sure you want to impersonate ${userData?.name}? You will be logged in as this user.`}
        confirmText="Impersonate"
        cancelText="Cancel"
        isLoading={impersonating}
        confirmButtonClass="bg-blue-600 hover:bg-blue-700 text-white"
      />
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </div>
  );
}