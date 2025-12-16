'use client';

import React, { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';
import toast from '@/lib/services/toast.service';

interface PlanComparisonProps {
  currentPlanId?: string;
  selectedPlanId: string;
}

export default function PlanComparison({ currentPlanId, selectedPlanId }: PlanComparisonProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedPlanId) {
      fetchPlans();
    }
  }, [selectedPlanId, currentPlanId]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      
      // Fetch all modules first
      const modulesResponse = await fetch('/api/modules');
      if (!modulesResponse.ok) {
        throw new Error('Failed to fetch modules');
      }
      const modulesData = await modulesResponse.json();
      
      // Fetch the selected plan
      const selectedPlanResponse = await fetch(`/api/subscriptions/plans/${selectedPlanId}`);
      if (!selectedPlanResponse.ok) {
        throw new Error('Failed to fetch selected plan');
      }
      const selectedPlanData = await selectedPlanResponse.json();
      
      let plansToCompare = [selectedPlanData.plan];
      
      // If there's a current plan and it's different from the selected one, fetch it as well
      if (currentPlanId && currentPlanId !== selectedPlanId) {
        const currentPlanResponse = await fetch(`/api/subscriptions/plans/${currentPlanId}`);
        if (currentPlanResponse.ok) {
          const currentPlanData = await currentPlanResponse.json();
          plansToCompare = [currentPlanData.plan, selectedPlanData.plan];
        }
      }
      
      setModules(modulesData.modules || []);
      setPlans(plansToCompare);
    } catch (error) {
      console.error('Error fetching plans for comparison:', error);
      toast.error('Failed to load plan details for comparison');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">No plan details available for comparison</p>
      </div>
    );
  }

  const getAllModules = () => {
    // Get all modules from all plans
    const moduleSet = new Set<string>();
    plans.forEach(plan => {
      plan.planFeatures.forEach((feature: any) => {
        moduleSet.add(feature.module.type);
      });
    });
    
    // Group modules by type
    const groupedModules: Record<string, any[]> = {};
    modules.forEach(module => {
      if (moduleSet.has(module.type)) {
        if (!groupedModules[module.type]) {
          groupedModules[module.type] = [];
        }
        groupedModules[module.type].push(module);
      }
    });
    
    return groupedModules;
  };

  const getModuleFeature = (plan: any, moduleId: string) => {
    return plan.planFeatures.find((feature: any) => feature.moduleId === moduleId);
  };

  const renderComparisonTable = () => {
    const groupedModules = getAllModules();
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-4 text-left font-medium text-gray-500 dark:text-gray-400">Feature</th>
              {plans.map((plan, index) => (
                <th 
                  key={plan.id} 
                  className={`py-4 text-center font-medium ${
                    plan.id === currentPlanId
                      ? 'text-blue-600 dark:text-blue-400'
                      : plan.id === selectedPlanId
                        ? 'text-primary'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {plan.name}
                  {plan.id === currentPlanId && <span> (Current)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price row */}
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <td className="py-4 font-medium text-gray-900 dark:text-white">Price</td>
              {plans.map(plan => (
                <td key={`${plan.id}-price`} className="py-4 text-center text-gray-900 dark:text-white">
                  {formatCurrency(plan.price)} / {plan.billingCycle}
                </td>
              ))}
            </tr>
            
            {/* Features by module type */}
            {Object.entries(groupedModules).map(([moduleType, modulesList]) => (
              <React.Fragment key={moduleType}>
                {/* Module type header */}
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <td 
                    colSpan={plans.length + 1} 
                    className="py-3 px-4 font-medium text-gray-900 dark:text-white"
                  >
                    {moduleType.replace(/_/g, ' ')}
                  </td>
                </tr>
                
                {/* Module rows */}
                {modulesList.map(module => (
                  <tr key={module.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-4 pl-8 text-gray-900 dark:text-white">
                      {module.name}
                    </td>
                    
                    {plans.map(plan => {
                      const feature = getModuleFeature(plan, module.id);
                      const isIncluded = feature && feature.isIncluded;
                      
                      return (
                        <td key={`${plan.id}-${module.id}`} className="py-4 text-center">
                          {isIncluded ? (
                            <div className="flex flex-col items-center">
                              <CheckIcon className="h-5 w-5 text-green-500" />
                              
                              {/* Show limits if any */}
                              {feature.limits && Object.keys(feature.limits).length > 0 && (
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {Object.entries(feature.limits).map(([key, value]: [string, any], i) => (
                                    <div key={key}>
                                      {i > 0 && ', '}
                                      {key}: {value}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <XMarkIcon className="mx-auto h-5 w-5 text-red-500" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {renderComparisonTable()}
    </div>
  );
}