'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { getUserAvatar } from '@/lib/dashboard-utils';
import { UserRole } from '@/lib/types/enums';

export default function CustomerProfilePage() {
  const { data: session } = useSession();

  if (!session || !session.user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading user data...</p>
      </div>
    );
  }

  const user = session.user;
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : '?';
  const avatarPath = getUserAvatar(user.role as UserRole | undefined);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <Card className="overflow-hidden shadow-xl dark:bg-gray-800">
        <CardHeader className="bg-primary/10 dark:bg-primary/20 p-6 border-b dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-2 border-primary dark:border-primary-light">
              <AvatarImage src={avatarPath} alt={user.name || 'User'} />
              <AvatarFallback className="text-2xl bg-gray-200 dark:bg-gray-700 text-primary dark:text-primary-light">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {user.name || 'Customer Profile'}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <span className="font-medium text-gray-600 dark:text-gray-400">User ID:</span>
                <span className="ml-2 text-gray-800 dark:text-gray-200">{user.id}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <span className="font-medium text-gray-600 dark:text-gray-400">Role:</span>
                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-700 dark:text-green-100">
                  <ShieldCheckIcon className="mr-1 h-3 w-3" />
                  {user.role || 'Customer'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Placeholder for more profile information */}
          <div className="text-center text-gray-500 dark:text-gray-400 pt-4">
            <p>More profile information and editing options will be available here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 