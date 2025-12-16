'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import PricingToggle from '@/components/pricing/PricingToggle';

// Define types
interface ModuleLimit {
  [key: string]: string | number;
}

// Features object with key-value pairs
interface FeaturesObject {
  [key: string]: boolean | string | number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  isActive: boolean;
  features: FeaturesObject;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Module {
  id: string;
  name: string;
  type: string;
  description: string;
}

// Function to fetch subscription plans from API
async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('Fetching plans from:', `${baseUrl}/api/public/subscription-plans`);
    
    const response = await fetch(`${baseUrl}/api/public/subscription-plans`, {
      // Use only cache option to avoid the warning
      cache: 'no-store'
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      // Log detailed error info
      console.error('API response error:', {
        status: response.status,
        statusText: response.statusText
      });
      
      // Try to get error message from response
      try {
        const errorData = await response.json();
        console.error('API error details:', errorData);
      } catch (e) {
        // If we can't parse the error response body, just log that
        console.error('Could not parse error response body');
      }
      
      return [];
    }

    const data = await response.json();
    console.log('Fetched plans data:', data);
    
    // Make sure features are objects, not strings
    const plans = (data.data || []).map((plan: any) => {
      // If features is a string, parse it
      if (typeof plan.features === 'string') {
        try {
          plan.features = JSON.parse(plan.features);
        } catch (e) {
          console.error('Error parsing features JSON:', e);
          plan.features = {};
        }
      }
      return plan;
    });
    
    return plans;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

// Function to extract unique modules from plans
function extractModulesFromPlans(plans: SubscriptionPlan[]): Module[] {
  const uniqueModules = new Map<string, Module>();
  
  // Get all unique feature keys across all plans
  const allFeatureKeys = new Set<string>();
  plans.forEach((plan: SubscriptionPlan) => {
    if (plan.features) {
      Object.keys(plan.features).forEach(key => {
        allFeatureKeys.add(key);
      });
    }
  });
  
  // Create a module for each feature key
  allFeatureKeys.forEach(key => {
    // Format the key for display (capitalize, replace underscores with spaces)
    const displayName = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    uniqueModules.set(key, {
      id: key,
      name: displayName,
      type: 'feature',
      description: `${displayName} feature`
    });
  });
  
  return Array.from(uniqueModules.values());
}

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const billingCycle = searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly';

  // Calculate yearly price with 20% discount
  const getPrice = (monthlyPrice: number, cycle: string) => {
    if (cycle === 'yearly') {
      // Apply 20% discount to yearly price (12 months)
      return (monthlyPrice * 12 * 0.8);
    }
    return monthlyPrice;
  };

  // Format price with appropriate currency
  const formatPrice = (price: number) => {
    return `₦${Math.round(price).toLocaleString()}`;
  };

  useEffect(() => {
    const loadPlans = async () => {
      setIsLoading(true);
      const loadedPlans = await fetchSubscriptionPlans();
      setPlans(loadedPlans);
      setModules(extractModulesFromPlans(loadedPlans));
      setIsLoading(false);
    };
    
    loadPlans();
  }, []);

  // Sort plans by price
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);
  
  // Find most popular plan (usually middle plan or tagged as "popular")
  const popularPlanIndex = sortedPlans.length > 2 ? Math.floor(sortedPlans.length / 2) : 0;

  // If no plans were returned, show fallback content
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
            Select the perfect subscription plan to streamline your hotel management and boost your business.
          </p>
        </div>
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (sortedPlans.length === 0) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
            Select the perfect subscription plan to streamline your hotel management and boost your business.
          </p>
        </div>

        {/* Fallback content */}
        <div className="rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans Coming Soon</h2>
            <p className="mx-auto max-w-2xl text-gray-700 dark:text-gray-300">
              We&apos;re currently updating our subscription plans. Please check back soon or contact us for more information.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dark"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">What types of plans will be available?</h3>
              <p className="text-gray-700 dark:text-gray-300">
                We&apos;ll offer plans for small hotels, medium properties, and large enterprise establishments with features tailored to each segment.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Do you offer a free trial?</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Yes, we offer a 14-day free trial for all subscription plans. No credit card required to start your trial.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Page Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-700 dark:text-gray-300">
          Select the perfect subscription plan to streamline your hotel management and boost your business.
        </p>
      </div>

      {/* Billing Toggle */}
      <PricingToggle />

      {/* Pricing Cards */}
      <div className={`grid gap-4 sm:gap-6 md:grid-cols-2 ${
        sortedPlans.length === 3 
          ? 'lg:grid-cols-3' 
          : sortedPlans.length >= 4 
            ? 'lg:grid-cols-4' 
            : 'lg:grid-cols-2'
      }`}>
        {sortedPlans.map((plan, index) => {
          const isPopular = index === popularPlanIndex; 
          const price = getPrice(plan.price, billingCycle);
          
          return (
            <div 
              key={plan.id}
              className={`group flex flex-col overflow-hidden rounded-lg border bg-white shadow-md transition-all hover:shadow-lg dark:bg-gray-800 ${
                isPopular 
                  ? 'relative border-2 border-primary' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {isPopular && (
                <div className="absolute -right-12 top-6 rotate-45 bg-primary px-10 py-1 text-xs font-semibold text-white">Popular</div>
              )}
              
              <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-primary">
                    {formatPrice(price)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                <Link
                  href={`/register?plan=${plan.id}&billing=${billingCycle}`}
                  className="block w-full rounded-md bg-primary py-2 text-center font-medium text-white hover:bg-primary-dark"
                >
                  Get Started
                </Link>
              </div>
              
              <div className="flex-1 p-6">
                <ul className="space-y-3">
                  {Object.entries(plan.features || {}).map(([key, value]) => {
                    // Only show features that are included (true, non-zero value or string)
                    if (value === false) {
                      return null;
                    }
                    
                    // Format the key for display (capitalize, replace underscores with spaces)
                    const featureName = key
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');
                    
                    return (
                      <li key={key} className="flex items-start">
                        <Check className="mr-2 h-5 w-5 flex-shrink-0 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {featureName}
                          {value !== true && (
                            <span className="ml-1 text-xs text-gray-500">
                              ({String(value)})
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div className="mt-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border border-gray-200 px-6 py-3 text-left font-semibold text-gray-900 dark:border-gray-700 dark:text-white">Feature</th>
                {sortedPlans.map((plan) => (
                  <th key={plan.id} className="border border-gray-200 px-6 py-3 text-center font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((module, idx) => (
                <tr key={module.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}>
                  <td className="border border-gray-200 px-6 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    {module.name}
                  </td>
                  
                  {sortedPlans.map((plan) => {
                    const featureValue = plan.features ? plan.features[module.id] : null;
                    const isIncluded = featureValue !== undefined && featureValue !== false;
                      
                    return (
                      <td key={`${plan.id}-${module.id}`} className="border border-gray-200 px-6 py-3 text-center text-gray-700 dark:border-gray-700 dark:text-gray-300">
                        {isIncluded ? (
                          <div>
                            <Check className="mx-auto h-5 w-5 text-green-500" />
                            {featureValue !== true && (
                              <div className="mt-1 text-xs">
                                {String(featureValue)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <X className="mx-auto h-5 w-5 text-red-500" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Can I upgrade my plan later?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Yes, you can upgrade your subscription at any time. The difference will be prorated for the remainder of your billing cycle.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Do you offer a free trial?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Yes, we offer a 14-day free trial for all subscription plans. No credit card required to start your trial.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">How does billing work?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              We bill you either monthly or annually depending on your preference. You can switch between billing cycles at any time.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Can I cancel my subscription?</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your current billing period.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-16">
        <div className="rounded-lg bg-primary p-8 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">Ready to get started?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-lg">
            Join thousands of hotels worldwide using Qaras Hotels to manage their operations and delight their guests.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-md bg-white px-6 py-3 font-semibold text-primary hover:bg-gray-100"
          >
            Sign Up Now
          </Link>
        </div>
      </div>
    </div>
  );
}