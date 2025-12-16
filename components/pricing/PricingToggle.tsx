'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PricingToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly'
  );

  const handleToggle = (cycle: 'monthly' | 'yearly') => {
    setBillingCycle(cycle);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('billing', cycle);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="mb-12 flex justify-center">
      <div className="rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <div className="flex items-center">
          <button
            onClick={() => handleToggle('monthly')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              billingCycle === 'monthly'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-700 hover:text-primary dark:text-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => handleToggle('yearly')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              billingCycle === 'yearly'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-700 hover:text-primary dark:text-gray-300'
            }`}
          >
            Yearly <span className="text-xs text-green-500 dark:text-green-400">Save 20%</span>
          </button>
        </div>
      </div>
    </div>
  );
}