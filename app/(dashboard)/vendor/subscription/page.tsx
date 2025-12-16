'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/solid';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import toast from '@/lib/toast';

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
  subscriptionStatus?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  isActive?: boolean;
  isExpired?: boolean;
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the vendor's subscription plan from the API
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subscriptions/vendor');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription data');
        }
        
        const data = await response.json();
        
        if (data.subscription) {
          setSubscriptionPlan(data.subscription);
        } else {
          // Set default free plan if no subscription is found
          setSubscriptionPlan({
            id: 'free',
            name: 'Free Plan',
            price: 0,
            billingCycle: 'monthly',
            description: 'Basic features to get you started',
            features: {
              bookingLimit: 10,
              roomLimit: 5,
              staffLimit: 2,
              wifiDevices: 5,
              qrMenuItems: 20
            },
            subscriptionStatus: 'active'
          });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setError('Unable to load your subscription details. Please try again later.');
        toast.error('Failed to load subscription information');
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user) {
      fetchSubscription();
    }
  }, [session]);
  
  // Convert features object to array for display
  const getFeaturesList = (features: Record<string, any>): Feature[] => {
    if (!features) return [];
    
    return Object.entries(features).map(([key, value]) => {
      // Format the feature name with spaces and capitalization
      const formattedName = key
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Handle camelCase
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .replace(/([L]imit)/g, ' Limit') // Add space before "Limit"
        .trim();
      
      return { 
        name: formattedName, 
        value 
      };
    });
  };
  
  // Format feature value for display
  const formatFeatureValue = (value: boolean | string | number): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === 'unlimited' || value === null) {
      return 'Unlimited';
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    return String(value);
  };
  
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="ml-2 text-gray-500">Loading your subscription details...</span>
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
      <h1 className="text-2xl font-bold">Your Subscription</h1>
      
      {subscriptionPlan && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{subscriptionPlan.name}</CardTitle>
                  <CardDescription>Your current subscription</CardDescription>
                </div>
                <Badge className={subscriptionPlan.isExpired ? 'bg-red-500 text-white' : 'bg-primary text-white'}>
                  {formatCurrency(subscriptionPlan.price)} / {subscriptionPlan.billingCycle}
                </Badge>
              </div>
              {subscriptionPlan.subscriptionStatus && (
                <div className="mt-2">
                  <Badge variant={subscriptionPlan.isExpired ? "destructive" : "outline"}>
                    {subscriptionPlan.isExpired ? 'Expired' : 
                     subscriptionPlan.subscriptionStatus.charAt(0).toUpperCase() + 
                     subscriptionPlan.subscriptionStatus.slice(1)}
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">{subscriptionPlan.description}</p>
              
              <div className="mt-6">
                <h3 className="mb-4 font-semibold">Plan Features</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {getFeaturesList(subscriptionPlan.features).map((feature, index) => (
                    <div 
                      key={index} 
                      className="flex items-start space-x-2 rounded-md border p-3 dark:border-gray-700"
                    >
                      {feature.value ? (
                        <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 flex-shrink-0 text-gray-300" />
                      )}
                      
                      <div>
                        <div className="font-medium">{feature.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatFeatureValue(feature.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex space-x-4">
                <Link href="/vendor/subscription/upgrade">
                  <Button variant="outline">Upgrade Plan</Button>
                </Link>
                <Link href="/vendor/subscription/history">
                  <Button variant="ghost">Billing History</Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>Questions about your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                If you have any questions about your subscription or would like to make changes,
                our support team is here to help.
              </p>
              
              <div className="space-y-4">
                {subscriptionPlan.subscriptionEndDate && (
                  <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                    <h4 className="font-medium">Renewal Date</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your subscription {subscriptionPlan.isExpired ? 'expired on' : 'renews on'}{' '}
                      <span className="font-medium">
                        {new Date(subscriptionPlan.subscriptionEndDate).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                )}
                
                {subscriptionPlan.subscriptionStartDate && (
                  <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                    <h4 className="font-medium">Subscription Started</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">
                        {new Date(subscriptionPlan.subscriptionStartDate).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="default">Contact Support</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}