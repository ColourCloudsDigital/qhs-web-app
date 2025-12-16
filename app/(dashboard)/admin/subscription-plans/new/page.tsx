'use client';

import PlanForm from '@/components/admin/subscriptions/PlanForm';

export default function NewSubscriptionPlanPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Subscription Plan</h1>
      
      <PlanForm mode="create" />
    </div>
  );
}