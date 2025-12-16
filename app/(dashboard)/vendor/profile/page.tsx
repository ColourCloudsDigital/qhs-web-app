import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserAvatar } from '@/lib/dashboard-utils';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';

export const metadata: Metadata = {
  title: 'My Profile | Vendor Dashboard',
  description: 'Manage your vendor account and profile settings',
};

async function getVendorProfile(userId: string) {
  try {
    const [rows] = await pool.query(`
      SELECT v.*, u.email, u.name, u.role, u.createdAt AS userCreatedAt
      FROM vendors v
      JOIN users u ON v.userId = u.id
      WHERE u.id = ?
    `, [userId]);
    
    return (rows as any[])[0] || null;
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return null;
  }
}

export default async function VendorProfilePage() {
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
  const vendorProfile = await getVendorProfile(userId);
  
  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your account information and settings</p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Summary Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={getUserAvatar(userRole)} alt={vendorProfile?.name || 'Vendor'} />
              <AvatarFallback>{vendorProfile?.name?.charAt(0) || 'V'}</AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold">{vendorProfile?.name || 'Vendor Name'}</h2>
              <p className="text-sm text-muted-foreground">{vendorProfile?.email || 'email@example.com'}</p>
              <p className="mt-1 text-xs text-muted-foreground">Vendor ID: {vendorProfile?.id || 'N/A'}</p>
              <p className="text-xs text-muted-foreground">
                Joined: {vendorProfile?.userCreatedAt 
                  ? new Date(vendorProfile.userCreatedAt).toLocaleDateString() 
                  : 'N/A'}
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
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account" className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Business Information</h3>
                    <div className="rounded-md border p-4">
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Business Name</div>
                          <div className="col-span-2">{vendorProfile?.businessName || 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Phone</div>
                          <div className="col-span-2">{vendorProfile?.phone || 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Address</div>
                          <div className="col-span-2">{vendorProfile?.address || 'N/A'}</div>
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
                          <div className="col-span-2">{vendorProfile?.email || 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Password</div>
                          <div className="col-span-2">••••••••</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Two-Factor Auth</div>
                          <div className="col-span-2">Not enabled</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Change Password</Button>
                    <Button>Enable 2FA</Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preferences" className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Notification Preferences</h3>
                    <div className="rounded-md border p-4">
                      <p className="text-sm text-muted-foreground">
                        Configure how you receive notifications and updates from the platform.
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