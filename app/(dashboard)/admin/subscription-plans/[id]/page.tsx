'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PencilIcon, ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from '@/lib/services/toast.service';

export default function SubscriptionPlanDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch both plan and modules data
        await Promise.all([
          fetchPlan(),
          fetchModules()
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const fetchPlan = async () => {
    try {
      const response = await fetch(`/api/admin/subscription-plans/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plan');
      }
      
      const data = await response.json();
      console.log('Fetched plan data:', data.plan);
      setPlan(data.plan);
      return data.plan;
    } catch (error) {
      console.error('Error fetching plan:', error);
      toast.error('Failed to load subscription plan');
      router.push('/admin/subscription-plans');
    }
  };
  
  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules');
      
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      
      const data = await response.json();
      console.log('Fetched modules:', data.modules);
      setModules(data.modules);
      return data.modules;
    } catch (error) {
      console.error('Error fetching modules:', error);
      // Don't redirect on modules fetch error, just show a toast
      toast.error('Failed to load modules data');
    }
  };
  
  // Helper function to get module name by ID
  const getModuleName = (moduleId: string) => {
    if (plan?.planFeatures) {
      const feature = plan.planFeatures.find((f: any) => f.moduleId === moduleId);
      if (feature) {
        return feature.moduleName;
      }
    }
    
    const foundModule = modules.find(m => m.id === moduleId);
    if (foundModule) {
      return foundModule.name;
    }
    
    // Fallback to predefined names
    const moduleNames: Record<string, string> = {
      "1": "Hotel Management",
      "2": "Bookings",
      "3": "POS System",
      "6": "QR Menu",
      "7": "Reports & Analytics",
      "8": "API Access",
      "ROOM_BOOKING": "Room Booking",
      "FACILITY_MANAGEMENT": "Facility Management",
      "QR_MENU": "QR Menu",
      "WHITE_LABEL": "WhiteLabel",
      "BLOG": "Blog",
      "POS": "POS System"
    };
    
    return moduleNames[moduleId] || `Module: ${moduleId}`;
  };
  
  // Helper function to get module description by ID
  const getModuleDescription = (moduleId: string) => {
    if (plan?.planFeatures) {
      const feature = plan.planFeatures.find((f: any) => f.moduleId === moduleId);
      if (feature) {
        return feature.moduleDescription;
      }
    }
    
    const foundModule = modules.find(m => m.id === moduleId);
    if (foundModule) {
      return foundModule.description;
    }
    
    return 'Feature enabled for this plan';
  };
  
  // Helper function to get module type by ID
  const getModuleType = (moduleId: string) => {
    if (plan?.planFeatures) {
      const feature = plan.planFeatures.find((f: any) => f.moduleId === moduleId);
      if (feature) {
        return feature.moduleType;
      }
    }
    
    const foundModule = modules.find(m => m.id === moduleId);
    if (foundModule) {
      return foundModule.type;
    }
    
    return 'MODULE';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/subscription-plans')}
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            plan.isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {plan.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <Link href={`/admin/subscription-plans/${params.id}/edit`}>
          <Button className="flex items-center gap-1">
            <PencilIcon className="h-4 w-4" />
            Edit Plan
          </Button>
        </Link>
      </div>

      {/* Plan details */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2 space-y-6">
          {/* Basic details card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Plan Details</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-gray-900 dark:text-white">{plan.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</p>
                <p className="text-gray-900 dark:text-white">{formatCurrency(plan.price)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Billing Cycle</p>
                <p className="text-gray-900 dark:text-white">
                  {plan.billingCycle.charAt(0).toUpperCase() + plan.billingCycle.slice(1)}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-gray-900 dark:text-white">{plan.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                <p className="text-gray-900 dark:text-white">{plan.description || 'No description provided'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-gray-900 dark:text-white">{formatDate(plan.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated</p>
                <p className="text-gray-900 dark:text-white">{formatDate(plan.updatedAt)}</p>
              </div>
            </div>
          </div>
          
          {/* Features card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Included Features</h2>
            
            <div className="space-y-4">
              {plan.features && Object.keys(plan.features).length > 0 ? (
                Object.entries(plan.features)
                  .filter(([moduleId, enabled]) => enabled === true)
                  .map(([moduleId, enabled]) => (
                    <div 
                      key={moduleId} 
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {getModuleName(moduleId)}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getModuleDescription(moduleId)}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {getModuleType(moduleId)}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No features included in this plan
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Plan usage stats */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Plan Usage</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Vendors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{plan.vendorCount || 0}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Features</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.features ? Object.values(plan.features).filter(v => v === true).length : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}