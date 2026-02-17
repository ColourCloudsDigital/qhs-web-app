import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserAvatar } from '@/lib/dashboard-utils';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Admin Profile | Admin Dashboard',
  description: 'Manage your admin account and profile settings',
};

async function getAdminProfile(userId: string) {
  try {
    const [rows] = await pool.query(`
      SELECT u.*, sa.id as superAdminId
      FROM users u
      LEFT JOIN super_admins sa ON u.id = sa.userId
      WHERE u.id = ? AND u.role = 'SUPER_ADMIN'
    `, [userId]);
    
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return null;
  }
}

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Please log in to view your profile</p>
      </div>
    );
  }
  
  const userId = session.user.id;
  const userRole = session.user.role;
  const adminProfile = await getAdminProfile(userId);
  
  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your admin account information and settings</p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Summary Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Admin Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-primary">
              <Image 
                src={getUserAvatar(userRole)}
                alt={adminProfile?.name || 'Admin'} 
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold">{adminProfile?.name || 'Admin Name'}</h2>
              <p className="text-sm text-muted-foreground">{adminProfile?.email || 'email@example.com'}</p>
              <p className="mt-1 text-xs text-muted-foreground">Admin ID: {adminProfile?.superAdminId || 'N/A'}</p>
              <p className="text-xs text-muted-foreground">
                Joined: {adminProfile?.createdAt ? formatDate(adminProfile.createdAt) : 'N/A'}
              </p>
            </div>
            
            <Button variant="outline" className="mt-4 w-full">
              Edit Profile
            </Button>
          </CardContent>
        </Card>
        
        {/* Profile Tabs Card */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <Tabs defaultValue="account">
              <TabsList className="mb-4 grid w-full grid-cols-3">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="activity">Activity Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account" className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Account Information</h3>
                    <div className="rounded-md border p-4">
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Name</div>
                          <div className="col-span-2">{adminProfile?.name || 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Email</div>
                          <div className="col-span-2">{adminProfile?.email || 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Role</div>
                          <div className="col-span-2">
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              Super Admin
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Update Information</Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Security Settings</h3>
                    <div className="rounded-md border p-4">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Email Address</div>
                          <div className="col-span-2">{adminProfile?.email || 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Password</div>
                          <div className="col-span-2">••••••••</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Two-Factor Auth</div>
                          <div className="col-span-2">
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              Enabled
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Change Password</Button>
                    <Button>Manage 2FA</Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Recent Activity</h3>
                    <div className="rounded-md border p-4">
                      <p className="text-sm text-muted-foreground">
                        Your recent actions and system activity will be shown here.
                      </p>
                      <div className="mt-4">
                        <p className="text-center text-muted-foreground">
                          Coming soon
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 