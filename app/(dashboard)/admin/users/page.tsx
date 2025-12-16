'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import DataTable from '@/components/admin/DataTable';
import { formatDate } from '@/lib/utils';
import { UserRole } from '@/lib/types/enums';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, searchQuery, sortColumn, sortDirection]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortColumn,
        sortDirection,
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      
      setUsers(data.users);
      setTotalItems(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Refresh the user list
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
        <Link 
          href="/admin/users/create" 
          className="flex items-center rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Add User
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/50">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                <p>{error}</p>
              </div>
              <button
                type="button"
                className="mt-2 rounded-md bg-red-50 text-sm font-medium text-red-800 hover:underline dark:bg-transparent dark:text-red-200"
                onClick={fetchUsers}
              >
                <div className="flex items-center">
                  <ArrowPathIcon className="mr-1 h-4 w-4" />
                  Retry
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        data={users}
        columns={[
          { key: 'name', title: 'Name', sortable: true },
          { key: 'email', title: 'Email', sortable: true },
          { 
            key: 'role', 
            title: 'Role', 
            sortable: true,
            render: (user) => (
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                {user.role.replace('_', ' ')}
              </span>
            )
          },
          { 
            key: 'createdAt', 
            title: 'Created At', 
            sortable: true,
            render: (user) => formatDate(user.createdAt)
          },
          { 
            key: 'lastLoginAt', 
            title: 'Last Login', 
            render: (user) => user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'
          },
          { 
            key: 'isActive', 
            title: 'Status', 
            render: (user) => (
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            )
          },
          { 
            key: 'actions', 
            title: 'Actions',
            render: (user) => (
              <div className="flex items-center space-x-2">
                <Link 
                  href={`/admin/users/${user.id}`}
                  className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                >
                  <EyeIcon className="h-5 w-5" />
                </Link>
                <Link 
                  href={`/admin/users/${user.id}/edit`}
                  className="rounded p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
                >
                  <PencilIcon className="h-5 w-5" />
                </Link>
                <button 
                  onClick={() => handleDeleteUser(user.id)}
                  className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            )
          },
        ]}
        pagination={true}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50, 100]}
        totalItems={totalItems}
        currentPage={page}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSort={handleSort}
        searchable={true}
        onSearch={handleSearch}
        loading={loading}
      />
    </div>
  );
}