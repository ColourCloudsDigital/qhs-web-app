'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ModuleType } from '@/lib/types/enums';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Map module types to friendly names
const moduleNames: Partial<Record<ModuleType, string>> = {
  MENU: 'QR Menu',
  MAINTENANCE: 'Facility Management',
  ANALYTICS: 'Analytics',
  FACILITY_MANAGEMENT: 'Facility Management',
};

// Map module types to descriptions
const moduleDescriptions: Partial<Record<ModuleType, string>> = {
  MENU: "Create digital menus with QR codes for your restaurant",
  MAINTENANCE: "Manage maintenance tasks and track facility operations",
  ANALYTICS: "View detailed analytics and reports for your property",
  FACILITY_MANAGEMENT: "Manage maintenance tasks and track facility operations",
};

interface SubscriptionRequiredProps {
  moduleType: ModuleType;
}

export default function SubscriptionRequired({ moduleType }: SubscriptionRequiredProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUpgrade = () => {
    setIsLoading(true);
    router.push('/vendor/subscription/upgrade');
  };
  
  return (
    <div className="p-6 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl">Subscription Required</CardTitle>
          <CardDescription>
            {moduleNames[moduleType] || moduleType} module is not included in your current plan
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            {moduleDescriptions[moduleType] || 'This feature requires a subscription upgrade'}
          </p>
          <p className="text-sm text-gray-500">
            Upgrade your subscription to access this feature and much more
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={handleUpgrade} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>Loading...</>
            ) : (
              <>
                Upgrade Subscription
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Link href="/vendor/dashboard" className="w-full">
            <Button variant="outline" className="w-full">
              Return to Dashboard
            </Button>
          </Link>
          <Link 
            href="/pricing" 
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center mt-4"
          >
            View all plan options
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}