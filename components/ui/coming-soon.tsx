import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ComingSoonProps {
  title?: string;
  description?: string;
  moduleName?: string;
  backUrl?: string;
}

export default function ComingSoon({
  title = "Coming Soon",
  description = "This feature is currently under development and will be available soon.",
  moduleName,
  backUrl = "/vendor/dashboard"
}: ComingSoonProps) {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/assets/icons/coming-soon.png"
            alt="Coming Soon"
            width={200}
            height={200}
            className="opacity-80"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {moduleName ? `${moduleName} - ${title}` : title}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {description}
        </p>
        
        <Link href={backUrl}>
          <Button variant="default">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
} 