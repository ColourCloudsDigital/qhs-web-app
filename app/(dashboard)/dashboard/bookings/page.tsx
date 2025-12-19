'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const roleToBookingsPath = (role?: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/bookings';
    case 'VENDOR':
      return '/vendor/bookings';
    case 'CUSTOMER':
      return '/customer/bookings';
    case 'STAFF':
      return '/staff/bookings';
    default:
      return '/dashboard';
  }
};

export default function DashboardBookingsRedirect() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || !session?.user) {
      // Send to login with callback
      router.replace('/login?callbackUrl=/dashboard/bookings');
      return;
    }

    const role = session.user.role as string | undefined;
    const target = roleToBookingsPath(role);

    // Redirect to role-specific bookings
    router.replace(target);
  }, [status, session, router]);

  return (
    <div className="flex h-48 items-center justify-center p-6">
      <div className="text-center">
        <p className="mb-2">Redirecting to your bookings...</p>
      </div>
    </div>
  );
}
