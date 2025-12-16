'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, ShoppingCart } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  showUpgrade?: boolean;
  upgradePath?: string;
  backPath?: string;
  featureName?: string;
}

export default function AccessDenied({
  title = 'Access Denied',
  message = 'You do not have access to this feature',
  showUpgrade = true,
  upgradePath = '/vendor/subscription/upgrade',
  backPath = '/vendor/dashboard',
  featureName,
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="mb-6 text-red-500">
        <ShieldAlert className="w-20 h-20" />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {featureName ? `${message}: ${featureName}` : message}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href={backPath}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </Link>
        
        {showUpgrade && (
          <Link href={upgradePath}>
            <Button>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Upgrade Your Plan
            </Button>
          </Link>
        )}
      </div>
      
      <div className="mt-12 text-sm text-muted-foreground">
        If you believe this is an error, please contact support.
      </div>
    </div>
  );
} 