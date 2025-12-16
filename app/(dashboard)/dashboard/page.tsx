'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types/enums';
import { getDashboardPath } from '@/lib/dashboard-utils';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      const userRole = session.user.role as UserRole;
      const redirectPath = getDashboardPath(userRole);
      if (redirectPath && redirectPath !== '/') {
        router.push(redirectPath);
      } else if (redirectPath === '/') {
        console.warn(`DashboardPage: Role '${userRole}' resulted in default redirect path '/'. User might be stuck in a loop if '/' redirects back to '/dashboard'.`);
        router.push('/');
      }
    } else if (status === 'authenticated' && !session?.user?.role) {
      console.warn('DashboardPage: Authenticated, but user role not yet available in session.');
    }
  }, [status, session, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
}