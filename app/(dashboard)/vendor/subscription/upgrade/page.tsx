'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckIcon, SparklesIcon, BoltIcon, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import toast from '@/lib/toast';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Feature {
  name: string;
  value: boolean | string | number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  description: string;
  features: Record<string, any>;
  highlighted?: boolean;
  isCurrent?: boolean;
}

export default function SubscriptionUpgradePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  
  // Fetch the current subscription plan
  useEffect(() => {
    const fetchCurrentSubscription = async () => {
      try {
        const response = await fetch('/api/subscriptions/vendor');
        
        if (!response.ok) {
          console.error('Failed to fetch current subscription');
          return;
        }
        
        const data = await response.json();
        if (data.subscription) {
          setCurrentPlan(data.subscription);
        }
      } catch (error) {
        console.error('Error fetching current subscription:', error);
      }
    };
    
    if (session?.user) {
      fetchCurrentSubscription();
    }
  }, [session]);
  
  // Fetch subscription plans from the API
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        setLoadingPlans(true);
        // Use the admin subscription-plans endpoint with listAll=true to get all active plans
        const response = await fetch('/api/admin/subscription-plans?listAll=true');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription plans');
        }
        
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          // Process the plans to add highlighted flag to the most popular plan
          const sortedPlans = data.data.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.price - b.price);
          
          // Mark the middle plan as highlighted if there are 3 or more plans
          if (sortedPlans.length >= 3) {
            const middleIndex = Math.floor(sortedPlans.length / 2);
            sortedPlans[middleIndex].highlighted = true;
          } else if (sortedPlans.length > 0) {
            // If there are fewer plans, highlight the first one
            sortedPlans[0].highlighted = true;
          }
          
          // Mark current plan if it exists
          if (currentPlan) {
            sortedPlans.forEach((plan: SubscriptionPlan) => {
              if (plan.id === currentPlan.id) {
                plan.isCurrent = true;
              }
            });
          }
          
          setPlans(sortedPlans);
        } else {
          setError('No subscription plans available');
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        setError('Unable to load subscription plans. Please try again later.');
        toast.error('Failed to load subscription plans');
      } finally {
        setLoadingPlans(false);
      }
    };
    
    if (session?.user) {
      fetchSubscriptionPlans();
    }
  }, [session, currentPlan]);
  
  const handleUpgrade = async (planId: string) => {
    setLoading({ ...loading, [planId]: true });
    
    try {
      // Call the API to update the subscription
      const response = await fetch('/api/subscriptions/vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId,
          startDate: new Date().toISOString(),
          paymentReference: `PAYMENT-${Date.now()}` // In a real app, this would come from a payment gateway
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to upgrade subscription');
      }
      
      const plan = plans.find(p => p.id === planId);
      toast.success(`Successfully upgraded to ${plan?.name} plan!`);
      
      // Redirect to the subscription page after successful upgrade
      window.location.href = '/vendor/subscription';
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to upgrade subscription');
    } finally {
      setLoading({ ...loading, [planId]: false });
    }
  };
  
  // Extract features from the plan for display
  const getFeaturesList = (plan: SubscriptionPlan): { title: string, icon: JSX.Element }[] => {
    const featuresArray: { title: string, icon: JSX.Element }[] = [];
    
    // Add plan name as first feature
    featuresArray.push({
      title: `${plan.name} Plan Access`,
      icon: <SparklesIcon className="h-5 w-5 flex-shrink-0 text-primary" />
    });
    
    // Add basic features based on plan price tier
    if (plan.features) {
      // Extract room limit
      const roomLimit = plan.features.roomLimit || 'Unlimited';
      featuresArray.push({
        title: `Up to ${roomLimit} Rooms`,
        icon: <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-500" />
      });
      
      // Extract booking limit
      const bookingLimit = plan.features.bookingLimit || 'Unlimited';
      featuresArray.push({
        title: `Up to ${bookingLimit} Bookings`,
        icon: <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-500" />
      });
      
      // Add other key features
      Object.entries(plan.features).forEach(([key, value]) => {
        if (value === true || value === 'true') {
          // Format the feature name with spaces and capitalization
          const formattedName = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/^./, str => str.toUpperCase())
            .trim();
          
          let icon = <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-500" />;
          
          // Use different icons for specific features
          if (key.toLowerCase().includes('wifi')) {
            icon = <BoltIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />;
          } else if (key.toLowerCase().includes('security') || key.toLowerCase().includes('protect')) {
            icon = <ShieldCheckIcon className="h-5 w-5 flex-shrink-0 text-indigo-500" />;
          }
          
          featuresArray.push({
            title: formattedName,
            icon
          });
        }
      });
    }
    
    return featuresArray;
  };
  
  if (loadingPlans) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="ml-2 text-gray-500">Loading subscription plans...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
          Upgrade Your Subscription
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
          Choose the plan that best fits your needs and take your hotel management to the next level
        </p>
        
        {currentPlan && (
          <div className="mt-6 inline-flex items-center">
            <Badge variant="outline" className="px-4 py-2 text-base border-primary">
              <StarIcon className="h-4 w-4 mr-2 text-primary" />
              <span>Current Plan: <span className="font-semibold text-primary">{currentPlan.name}</span></span>
            </Badge>
            <Link href="/vendor/subscription" className="ml-4 text-sm underline text-gray-500 hover:text-primary">
              View current plan details
            </Link>
          </div>
        )}
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative flex flex-col transition-all duration-300 hover:shadow-xl ${
              plan.highlighted 
                ? 'border-primary shadow-lg dark:border-primary scale-[1.03] z-10' 
                : plan.isCurrent
                  ? 'border-blue-300 dark:border-blue-700'
                  : 'hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-0 right-0 mx-auto w-fit">
                <Badge className="bg-primary text-white dark:bg-primary dark:text-white px-4 py-1 font-medium">
                  Most Popular
                </Badge>
              </div>
            )}
            
            {plan.isCurrent && (
              <div className="absolute -top-3 left-0 right-0 mx-auto w-fit">
                <Badge className="bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700 px-4 py-1 font-medium">
                  Current Plan
                </Badge>
              </div>
            )}
            
            <CardHeader className={`pb-0 ${plan.highlighted ? 'bg-primary/5 dark:bg-primary/10 rounded-t-lg' : plan.isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 rounded-t-lg' : ''}`}>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
              <div className="mt-4 flex items-end">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1 mb-1">
                  /{plan.billingCycle}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow pt-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Includes:</p>
              <ul className="space-y-4">
                {getFeaturesList(plan).map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-0.5">{feature.icon}</div>
                    <span className="text-sm">{feature.title}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4">
              <Button 
                className={`w-full py-6 font-semibold text-base transition-all ${plan.isCurrent ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50' : ''}`}
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading[plan.id] || plan.isCurrent}
                variant={plan.highlighted && !plan.isCurrent ? 'default' : 'outline'}
                size="lg"
              >
                {loading[plan.id] ? (
                  <div className="flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                    <span>Processing...</span>
                  </div>
                ) : plan.isCurrent ? (
                  'Current Plan'
                ) : (
                  `Upgrade to ${plan.name}`
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-16 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-8 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-semibold">Need a Custom Plan?</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-xl">
              If none of our standard plans fit your needs, we offer custom solutions for larger organizations with special requirements.
            </p>
          </div>
          <Button variant="outline" size="lg" className="font-medium">
            Contact Sales Team
          </Button>
        </div>
      </div>
    </div>
  );
}