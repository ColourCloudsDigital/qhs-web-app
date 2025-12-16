'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DefaultSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/settings/general');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-32">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
}