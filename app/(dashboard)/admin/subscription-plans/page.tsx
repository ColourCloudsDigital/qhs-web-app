'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import DataTable from '@/components/admin/DataTable';
import { formatCurrency } from '@/lib/utils';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  isActive: boolean;
  createdAt: string;
  featureCount: number;
  vendorCount: number;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchPlans();
  }, [page, pageSize, searchQuery, sortColumn, sortDirection]);

  const fetchPlans = async () => {
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
      
      const response = await fetch(`/api/admin/subscription-plans?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      
      const data = await response.json();
      
      setPlans(data.plans);
      setTotalItems(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Error fetching subscription plans:', err);
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

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan? This will affect all vendors using this plan.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/subscription-plans/${planId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete subscription plan');
      }
      
      // Refresh the plans list
      fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription plan');
      console.error('Error deleting subscription plan:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
        <Link 
          href="/admin/subscription-plans/new" 
          className="flex items-center rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Add Plan
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
                onClick={fetchPlans}
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
        data={plans}
        columns={[
          { key: 'name', title: 'Plan Name', sortable: true },
          { 
            key: 'price', 
            title: 'Price', 
            sortable: true,
            render: (plan) => formatCurrency(plan.price)
          },
          { 
            key: 'billingCycle', 
            title: 'Billing Cycle', 
            render: (plan) => plan.billingCycle.charAt(0).toUpperCase() + plan.billingCycle.slice(1)
          },
          { 
            key: 'featureCount', 
            title: 'Features', 
            sortable: true,
            render: (plan) => plan.featureCount
          },
          { 
            key: 'vendorCount', 
            title: 'Vendors', 
            sortable: true,
            render: (plan) => plan.vendorCount
          },
          { 
            key: 'isActive', 
            title: 'Status', 
            render: (plan) => (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {plan.isActive ? 
                  <><CheckIcon className="h-3 w-3" /> Active</> : 
                  <><XMarkIcon className="h-3 w-3" /> Inactive</>
                }
              </span>
            )
          },
          { 
            key: 'actions', 
            title: 'Actions',
            render: (plan) => (
              <div className="flex items-center space-x-2">
                <Link 
                  href={`/admin/subscription-plans/${plan.id}`}
                  className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50"
                >
                  <EyeIcon className="h-5 w-5" />
                </Link>
                <Link 
                  href={`/admin/subscription-plans/${plan.id}/edit`}
                  className="rounded p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
                >
                  <PencilIcon className="h-5 w-5" />
                </Link>
                <button 
                  onClick={() => handleDeletePlan(plan.id)}
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