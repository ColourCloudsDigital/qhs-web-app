'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlanForm from '@/components/admin/subscriptions/PlanForm';
import toast from '@/lib/services/toast.service';

export default function EditSubscriptionPlanPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/subscription-plans/${params.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch subscription plan');
      }
      
      const data = await response.json();
      console.log('Fetched plan data for editing:', data.plan);
      setPlan(data.plan);
    } catch (error: any) {
      console.error('Error fetching plan:', error);
      setError(error.message || 'Failed to load subscription plan');
      toast.error(error.message || 'Failed to load subscription plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Error</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {error}
        </p>
        <button
          onClick={() => router.push('/admin/subscription-plans')}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          Back to Plans
        </button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plan Not Found</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          The subscription plan you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <button
          onClick={() => router.push('/admin/subscription-plans')}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
        >
          Back to Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Edit Subscription Plan
      </h1>
      
      <PlanForm
        mode="edit"
        planId={params.id}
        initialData={plan}
      />
    </div>
  );
}