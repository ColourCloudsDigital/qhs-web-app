'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUserAvatar } from '@/lib/dashboard-utils';
import { UserRole } from '@/lib/types/enums';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Shield, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react';

interface VendorProfile {
  id: string;
  userId: string;
  companyName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  taxId: string | null;
  email: string;
  name: string;
  role: string;
  userCreatedAt: string;
}

export default function VendorProfileClient() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    businessAddress: '',
    businessPhone: '',
    taxId: '',
  });
  
  // 2FA state
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    secret: null as string | null,
    qrCode: null as string | null,
    backupCodes: [] as string[],
  });
  const [isLoading2FA, setIsLoading2FA] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetch2FAStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/vendor/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        companyName: data.companyName || '',
        businessAddress: data.businessAddress || '',
        businessPhone: data.businessPhone || '',
        taxId: data.taxId || '',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      showError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/vendor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      success('Profile updated successfully');
      
      // Refresh the page to ensure session data is updated
      router.refresh();
    } catch (err) {
      console.error('Error updating profile:', err);
      showError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        companyName: profile.companyName || '',
        businessAddress: profile.businessAddress || '',
        businessPhone: profile.businessPhone || '',
        taxId: profile.taxId || '',
      });
    }
    setIsEditing(false);
  };

  const fetch2FAStatus = async () => {
    try {
      setIsLoading2FA(true);
      const response = await fetch('/api/vendor/profile/2fa');
      if (response.ok) {
        const data = await response.json();
        setTwoFactorStatus(data);
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    } finally {
      setIsLoading2FA(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setIsSettingUp2FA(true);
      const response = await fetch('/api/vendor/profile/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup 2FA');
      }

      const data = await response.json();
      setTwoFactorStatus({
        ...twoFactorStatus,
        secret: data.secret,
        qrCode: data.qrCode,
        backupCodes: data.backupCodes,
      });
      setShowBackupCodes(true);
      success('2FA setup initiated. Please scan the QR code and enter the verification code.');
    } catch (err) {
      console.error('Error setting up 2FA:', err);
      showError(err instanceof Error ? err.message : 'Failed to setup 2FA');
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsSettingUp2FA(true);
      const response = await fetch('/api/vendor/profile/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token: verificationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify 2FA');
      }

      success('2FA enabled successfully');
      setVerificationCode('');
      setShowBackupCodes(false);
      await fetch2FAStatus();
    } catch (err) {
      console.error('Error verifying 2FA:', err);
      showError(err instanceof Error ? err.message : 'Failed to verify 2FA');
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showError('Please enter a valid 6-digit code or backup code');
      return;
    }

    try {
      setIsSettingUp2FA(true);
      const response = await fetch('/api/vendor/profile/2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable', token: verificationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disable 2FA');
      }

      success('2FA disabled successfully');
      setVerificationCode('');
      await fetch2FAStatus();
    } catch (err) {
      console.error('Error disabling 2FA:', err);
      showError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Failed to load profile data</p>
      </div>
    );
  }

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
              <AvatarImage src={getUserAvatar(UserRole.VENDOR)} alt={profile.name || 'Vendor'} />
              <AvatarFallback>{profile.name?.charAt(0) || 'V'}</AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold">{profile.name || 'Vendor Name'}</h2>
              <p className="text-sm text-muted-foreground">{profile.email || 'email@example.com'}</p>
              <p className="mt-1 text-xs text-muted-foreground">Vendor ID: {profile.id || 'N/A'}</p>
              <p className="text-xs text-muted-foreground">
                Joined: {profile.userCreatedAt ? formatDate(profile.userCreatedAt) : 'N/A'}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel Editing' : 'Edit Profile'}
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
                    <div className="rounded-md border p-4 space-y-4">
                      {isEditing ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Your full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="your.email@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="companyName">Business Name</Label>
                            <Input
                              id="companyName"
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleInputChange}
                              placeholder="Your business name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="businessPhone">Phone</Label>
                            <Input
                              id="businessPhone"
                              name="businessPhone"
                              value={formData.businessPhone}
                              onChange={handleInputChange}
                              placeholder="+234 123 456 7890"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="businessAddress">Address</Label>
                            <textarea
                              id="businessAddress"
                              name="businessAddress"
                              value={formData.businessAddress}
                              onChange={handleInputChange}
                              placeholder="Your business address"
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="taxId">Tax ID</Label>
                            <Input
                              id="taxId"
                              name="taxId"
                              value={formData.taxId}
                              onChange={handleInputChange}
                              placeholder="Tax identification number"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="font-medium">Business Name</div>
                            <div className="col-span-2">{profile.companyName || 'N/A'}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="font-medium">Phone</div>
                            <div className="col-span-2">{profile.businessPhone || 'N/A'}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="font-medium">Address</div>
                            <div className="col-span-2">{profile.businessAddress || 'N/A'}</div>
                          </div>
                          {profile.taxId && (
                            <div className="grid grid-cols-3 gap-4">
                              <div className="font-medium">Tax ID</div>
                              <div className="col-span-2">{profile.taxId}</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Update Information'}
                      </Button>
                    </div>
                  )}
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
                          <div className="col-span-2">{profile.email || 'N/A'}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Password</div>
                          <div className="col-span-2">••••••••</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-medium">Two-Factor Auth</div>
                          <div className="col-span-2">
                            {twoFactorStatus.enabled ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                <ShieldCheck className="mr-1 h-3 w-3" />
                                Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                                <ShieldOff className="mr-1 h-3 w-3" />
                                Not enabled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2FA Setup Section */}
                  {!twoFactorStatus.enabled && !twoFactorStatus.qrCode && (
                    <div className="rounded-md border p-4 bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                        You'll need an authenticator app like Google Authenticator or Authy.
                      </p>
                      <Button 
                        onClick={handleSetup2FA} 
                        disabled={isSettingUp2FA || isLoading2FA}
                        className="w-full sm:w-auto"
                      >
                        {isSettingUp2FA ? 'Setting up...' : 'Enable 2FA'}
                      </Button>
                    </div>
                  )}

                  {/* QR Code and Verification */}
                  {twoFactorStatus.qrCode && !twoFactorStatus.enabled && (
                    <div className="rounded-md border p-4 space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Scan QR Code</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                        <div className="flex justify-center mb-4">
                          <img 
                            src={twoFactorStatus.qrCode} 
                            alt="2FA QR Code" 
                            className="border rounded-lg p-2 bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="verificationCode">Enter Verification Code</Label>
                          <Input
                            id="verificationCode"
                            type="text"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="text-center text-lg tracking-widest"
                          />
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            onClick={handleVerify2FA}
                            disabled={isSettingUp2FA || verificationCode.length !== 6}
                            className="flex-1"
                          >
                            Verify & Enable
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setTwoFactorStatus({ ...twoFactorStatus, qrCode: null, secret: null });
                              setVerificationCode('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>

                      {/* Backup Codes */}
                      {showBackupCodes && twoFactorStatus.backupCodes.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Backup Codes</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                          </p>
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {twoFactorStatus.backupCodes.map((code, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
                              >
                                <span>{code}</span>
                                <button
                                  onClick={() => copyBackupCode(code)}
                                  className="ml-2 text-gray-500 hover:text-gray-700"
                                >
                                  {copiedCode === code ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Disable 2FA */}
                  {twoFactorStatus.enabled && (
                    <div className="rounded-md border p-4 bg-red-50 dark:bg-red-900/20">
                      <h4 className="font-medium mb-2 flex items-center text-red-800 dark:text-red-200">
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Disable Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enter a verification code from your authenticator app or use a backup code to disable 2FA.
                      </p>
                      <div className="space-y-2 mb-4">
                        <Label htmlFor="disableCode">Verification Code or Backup Code</Label>
                        <Input
                          id="disableCode"
                          type="text"
                          maxLength={8}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase())}
                          placeholder="000000 or BACKUPCODE"
                        />
                      </div>
                      <Button 
                        variant="danger"
                        onClick={handleDisable2FA}
                        disabled={isSettingUp2FA || !verificationCode}
                      >
                        {isSettingUp2FA ? 'Disabling...' : 'Disable 2FA'}
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Change Password</Button>
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

