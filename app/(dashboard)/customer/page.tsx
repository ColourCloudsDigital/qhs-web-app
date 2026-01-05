'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the customer dashboard
    router.replace('/customer/dashboard');
  }, [router]);

  return (
    <div className="flex h-48 items-center justify-center">
      <div>Redirecting to your dashboard...</div>
    </div>
  );
}
