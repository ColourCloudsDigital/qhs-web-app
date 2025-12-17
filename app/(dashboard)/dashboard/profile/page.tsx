'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UserIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  CreditCardIcon,
  BriefcaseIcon,
  IdentificationIcon,
  PhoneIcon,
  MapPinIcon,
  AtSymbolIcon,
  SparklesIcon,
  UserCircleIcon,
  UsersIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { getUserAvatar } from '@/lib/dashboard-utils';
import { UserRole } from '@/lib/types/enums';
import { useToast } from "@/components/ui/use-toast";

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Role-specific fields (optional)
  vendorInfoId?: string;
  companyName?: string;
  businessAddress?: string;
  businessPhone?: string;
  taxId?: string;
  subscriptionPlanId?: string;
  subscriptionStatus?: string;
  subscriptionPlanName?: string;
  subscriptionPlanPrice?: number;
  subscriptionPlanBillingCycle?: string;
  customerInfoId?: string;
  phone?: string; // Can be customer or staff phone
  address?: string; // Can be customer or staff address
  staffInfoId?: string;
  position?: string;
  permissions?: string; // JSON string
  hotelId?: string;
  hotelName?: string;
  managingVendorName?: string;
  // Super admin has no extra table fields in super_admins other than userId and id
}

export default function UnifiedProfilePage() {
  const { data: session, status: authStatus, update: updateSession } = useSession();
  const { impersonation } = useImpersonation();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState<Partial<ProfileData>>({});
  const router = useRouter();

  const targetUserId = impersonation.isImpersonating && impersonation.userId 
    ? impersonation.userId 
    : session?.user?.id;

  useEffect(() => {
    if (authStatus === 'authenticated' && targetUserId) {
      setIsLoading(true);
      fetch(`/api/profile/${targetUserId}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(errorData.error || `Failed to fetch profile: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data: ProfileData) => {
          setProfileData(data);
          setEditableProfile(data); // Initialize editable profile with fetched data
          setError(null);
        })
        .catch((err) => {
          console.error(err);
          setError(err.message);
          const { error } = useToast();
          error("Failed to load profile data: " + err.message, { title: "Load Error" });
        })
        .finally(() => setIsLoading(false));
    } else if (authStatus === 'unauthenticated') {
      setError("User not authenticated.");
      setIsLoading(false);
    }
  }, [authStatus, targetUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!targetUserId) return;
    // Here you would typically call an API to update the profile
    // For now, we'll just simulate it and update the local state.
    // In a real app: PUT /api/profile/${targetUserId}
    console.log("Saving changes: ", editableProfile);
    const { info, success, error: saveError } = useToast();
    info("Data logged to console. Actual API call not implemented.", { title: "Simulating Save" });
    // Simulate API call
    setIsLoading(true);
    try {
      // const response = await fetch(`/api/profile/${targetUserId}`, { 
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(editableProfile),
      // });
      // if (!response.ok) throw new Error('Failed to save profile');
      // const updatedData = await response.json();
      // setProfileData(updatedData);
      // setEditableProfile(updatedData);
      // if (targetUserId === session?.user?.id) { // If updating own profile
      //    await updateSession({ user: { ...session.user, ...updatedData }});
      // }
      // toast.success("Profile updated successfully!");
      
      // For demonstration, just update local state
      setProfileData(prev => ({ ...prev, ...editableProfile }) as ProfileData);
      success("Profile changes applied locally (simulation).", { title: "Profile Updated" });
      setIsEditing(false);
    } catch (err: any) {
      saveError("Failed to save profile: " + err.message, { title: "Save Error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && authStatus !== 'unauthenticated') {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <p>No profile data available.</p>
      </div>
    );
  }

  const userInitial = profileData.name ? profileData.name.charAt(0).toUpperCase() : '?';
  const avatarPath = getUserAvatar(profileData.role);
  let permissionsArray: string[] = [];
  if (profileData.role === UserRole.STAFF && profileData.permissions) {
    try {
      permissionsArray = JSON.parse(profileData.permissions);
    } catch (e) {
      console.error("Failed to parse staff permissions", e);
    }
  }

  const renderDetailItem = (IconComponent: React.ElementType, label: string, value?: string | number | null, isBadge: boolean = false, badgeColor: string = 'bg-gray-100 text-gray-800') => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex items-start space-x-3">
        <IconComponent className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
          {isBadge ? (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}>{value}</span>
          ) : (
            <p className="text-sm text-gray-800 dark:text-gray-100">{String(value)}</p>
          )}
        </div>
      </div>
    );
  };
  
  const renderEditableItem = (label: string, name: keyof ProfileData, type: string = 'text') => (
    <div>
      <Label htmlFor={name} className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</Label>
      <Input 
        id={name} 
        name={name} 
        type={type} 
        value={(editableProfile as any)[name] || ''} 
        onChange={handleInputChange} 
        className="mt-1 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" 
      />
    </div>
  );

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
  <Button variant="ghost" onClick={() => router.back()} className="mb-4">
    <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
  </Button>
      <Card className="overflow-hidden shadow-lg dark:bg-gray-800">
        <CardHeader className="bg-gradient-to-r from-primary/80 to-primary/90 dark:from-primary/70 dark:to-primary/80 p-6 sm:p-8 border-b border-primary/50 dark:border-primary/40">
          <div className="flex flex-col sm:flex-row items-center sm:space-x-6">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white dark:border-gray-700 shadow-md">
              <AvatarImage src={avatarPath} alt={profileData.name || 'User'} />
              <AvatarFallback className="text-4xl bg-gray-200 dark:bg-gray-600 text-primary dark:text-primary-light">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <CardTitle className="text-3xl font-bold text-white dark:text-gray-50">
                {profileData.name}
              </CardTitle>
              <CardDescription className="text-base text-primary-foreground/80 dark:text-primary-light/80 flex items-center justify-center sm:justify-start mt-1">
                <ShieldCheckIcon className="h-5 w-5 mr-1.5" />
                Role: {profileData.role}
                {impersonation.isImpersonating && targetUserId === impersonation.userId && (
                  <span className="ml-2 text-xs font-semibold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">Impersonating</span>
                )}
              </CardDescription>
            </div>
            {!impersonation.isImpersonating && session?.user?.id === profileData.id && (
                 <div className="sm:ml-auto mt-4 sm:mt-0">
                    {isEditing ? (
                        <Button onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white">
                            <SparklesIcon className="h-4 w-4 mr-2" /> Save Changes
                        </Button>
                    ) : (
                        <Button onClick={() => setIsEditing(true)} variant="outline" className="border-white/50 text-white hover:bg-white/10 dark:border-gray-300/50 dark:text-gray-200 dark:hover:bg-gray-700/50">
                            Edit Profile
                        </Button>
                    )}
                </div>
            )}
          </div>
        </CardHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 rounded-none border-b border-gray-200 dark:border-gray-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {profileData.role === UserRole.VENDOR && <TabsTrigger value="vendor">Vendor Details</TabsTrigger>}
            {profileData.role === UserRole.STAFF && <TabsTrigger value="staff">Staff Details</TabsTrigger>}
            <TabsTrigger value="activity">Activity</TabsTrigger>
            {/* Add more tabs as needed */}
          </TabsList>

          <TabsContent value="overview" className="p-6 sm:p-8 space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-xl flex items-center"><UserCircleIcon className='h-5 w-5 mr-2'/>Basic Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {isEditing ? renderEditableItem('Full Name', 'name') : renderDetailItem(UserIcon, 'Full Name', profileData.name)}
                  {isEditing ? renderEditableItem('Email Address', 'email', 'email') : renderDetailItem(AtSymbolIcon, 'Email Address', profileData.email)}
                  {profileData.role === UserRole.CUSTOMER && (
                    isEditing ? renderEditableItem('Phone Number', 'phone') : renderDetailItem(PhoneIcon, 'Phone Number', profileData.phone)
                  )}
                  {profileData.role === UserRole.CUSTOMER && (
                    isEditing ? renderEditableItem('Address', 'address') : renderDetailItem(MapPinIcon, 'Address', profileData.address)
                  )}
                  {renderDetailItem(ShieldCheckIcon, 'Role', profileData.role, true, 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100')}
                  {renderDetailItem(IdentificationIcon, 'User ID', profileData.id)}
                  {renderDetailItem(SparklesIcon, 'Account Status', profileData.isActive ? 'Active' : 'Inactive', true, profileData.isActive ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100')}
                  {renderDetailItem(AtSymbolIcon, 'Email Verified', profileData.emailVerified ? new Date(profileData.emailVerified).toLocaleDateString() : 'Not Verified')}
                </CardContent>
            </Card>
          </TabsContent>

          {profileData.role === UserRole.VENDOR && (
            <TabsContent value="vendor" className="p-6 sm:p-8 space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-xl flex items-center"><BuildingOffice2Icon className='h-5 w-5 mr-2'/>Business Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {isEditing ? renderEditableItem('Company Name', 'companyName') : renderDetailItem(BuildingOffice2Icon, 'Company Name', profileData.companyName)}
                  {isEditing ? renderEditableItem('Business Phone', 'businessPhone') : renderDetailItem(PhoneIcon, 'Business Phone', profileData.businessPhone)}
                  {isEditing ? renderEditableItem('Business Address', 'businessAddress') : renderDetailItem(MapPinIcon, 'Business Address', profileData.businessAddress)}
                  {isEditing ? renderEditableItem('Tax ID', 'taxId') : renderDetailItem(IdentificationIcon, 'Tax ID', profileData.taxId)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-xl flex items-center"><CreditCardIcon className='h-5 w-5 mr-2'/>Subscription Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {renderDetailItem(ClipboardDocumentListIcon, 'Plan Name', profileData.subscriptionPlanName)}
                  {renderDetailItem(CreditCardIcon, 'Plan Price', profileData.subscriptionPlanPrice ? `N${profileData.subscriptionPlanPrice}` : 'N/A')}
                  {renderDetailItem(SparklesIcon, 'Plan Cycle', profileData.subscriptionPlanBillingCycle)}
                  {renderDetailItem(SparklesIcon, 'Subscription Status', profileData.subscriptionStatus, true, profileData.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100')}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {profileData.role === UserRole.STAFF && (
            <TabsContent value="staff" className="p-6 sm:p-8 space-y-6">
               <Card>
                <CardHeader><CardTitle className="text-xl flex items-center"><BriefcaseIcon className='h-5 w-5 mr-2'/>Staff Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {isEditing ? renderEditableItem('Position', 'position') : renderDetailItem(BriefcaseIcon, 'Position', profileData.position)}
                  {isEditing ? renderEditableItem('Phone Number', 'phone') : renderDetailItem(PhoneIcon, 'Phone Number', profileData.phone)}
                  {profileData.hotelName && renderDetailItem(BuildingOffice2Icon, 'Works at Hotel', profileData.hotelName)}
                  {profileData.managingVendorName && renderDetailItem(UsersIcon, 'Managed by Vendor', profileData.managingVendorName)}
                  {permissionsArray.length > 0 && (
                    <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Permissions</p>
                        <div className="flex flex-wrap gap-2">
                        {permissionsArray.map(permission => (
                            <span key={permission} className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100">
                            {permission}
                            </span>
                        ))}
                        </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="activity" className="p-6 sm:p-8">
            <Card>
                <CardHeader><CardTitle className="text-xl">Recent Activity</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Joined on: {new Date(profileData.createdAt).toLocaleDateString()}
                    </p>
                    {profileData.lastLoginAt && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        Last login: {new Date(profileData.lastLoginAt).toLocaleString()}
                        </p>
                    )}
                    <p className="mt-4 italic text-gray-500 dark:text-gray-400">Further activity details will be shown here.</p>
                </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </Card>
    </div>
  );
} 