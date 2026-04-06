'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Loader2, AlertCircle } from 'lucide-react';
import { useStaffPermissions } from '@/contexts/StaffPermissionsContext';

interface TaskStats {
  totalAssigned: number;
  overdueTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completedTasks: number;
}

interface StaffDashboardClientProps {
  staffId: string;
  staffName: string;
}

export default function StaffDashboardClient({ staffId, staffName }: StaffDashboardClientProps) {
  const { staffData, permissions, hasPermission, loading: permissionsLoading } = useStaffPermissions();
  const [stats, setStats] = useState<TaskStats>({
    totalAssigned: 0,
    overdueTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch task statistics from API
  const fetchTaskStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/staff/tasks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch task statistics');
      }
      
      const data = await response.json();
      setStats(data.stats || {
        totalAssigned: 0,
        overdueTasks: 0,
        inProgressTasks: 0,
        pendingTasks: 0,
        completedTasks: 0,
      });
      
    } catch (err) {
      console.error('Error fetching task stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch task statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchTaskStats();
  }, []);
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {staffName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading task statistics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {staffName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your tasks and assignments today.
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button 
              onClick={fetchTaskStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {staffName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your tasks and assignments today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Tasks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.totalAssigned}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Completed Tasks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.completedTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Pending Tasks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.pendingTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className={`overflow-hidden shadow rounded-lg ${stats.overdueTasks > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-gray-800'}`}>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className={`h-6 w-6 ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Overdue Tasks
                  </dt>
                  <dd className={`text-lg font-medium ${stats.overdueTasks > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {stats.overdueTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hasPermission('tasks') && (
              <a
                href="/staff/tasks"
                className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-4 ring-white dark:ring-gray-700">
                    <ClipboardDocumentListIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    View My Tasks
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Check and manage your assigned tasks ({stats.totalAssigned} total)
                  </p>
                </div>
              </a>
            )}

            {hasPermission('bookings') && (
              <a
                href="/staff/bookings"
                className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 ring-4 ring-white dark:ring-gray-700">
                    <CalendarIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Manage Bookings
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    View and manage hotel bookings
                  </p>
                </div>
              </a>
            )}

            <a
              href="/staff/profile"
              className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 ring-4 ring-white dark:ring-gray-700">
                  <CheckCircleIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  My Profile
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  View and update your profile information
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Task Summary */}
      {stats.totalAssigned > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Task Summary
            </h3>
            {(stats.overdueTasks === 0 && stats.inProgressTasks === 0 && stats.pendingTasks === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircleIcon className="h-12 w-12 text-green-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All caught up!</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No pending, in-progress, or overdue tasks right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.overdueTasks > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        You have {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}
                      </span>
                    </div>
                    <a href="/staff/tasks?tab=overdue" className="text-sm text-red-600 hover:text-red-800 font-medium">View →</a>
                  </div>
                )}
                {stats.inProgressTasks > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {stats.inProgressTasks} task{stats.inProgressTasks > 1 ? 's' : ''} in progress
                      </span>
                    </div>
                    <a href="/staff/tasks?tab=inprogress" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View →</a>
                  </div>
                )}
                {stats.pendingTasks > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                        {stats.pendingTasks} pending task{stats.pendingTasks > 1 ? 's' : ''} to start
                      </span>
                    </div>
                    <a href="/staff/tasks?tab=pending" className="text-sm text-yellow-600 hover:text-yellow-800 font-medium">View →</a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* No tasks at all */}
      {stats.totalAssigned === 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Task Summary</h3>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No tasks available</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                You have no tasks assigned yet.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}