'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun, 
  Monitor,
  Save,
  Eye,
  EyeOff,
  CreditCard,
  Settings as SettingsIcon,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showBookingHistory: boolean;
  allowDataCollection: boolean;
  marketingConsent: boolean;
}

interface PreferenceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
}

export default function CustomerSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the active tab from URL params or default to 'security'
  const activeTab = searchParams?.get('tab') || 'security';
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'private',
    showBookingHistory: false,
    allowDataCollection: true,
    marketingConsent: false
  });
  
  const [preferences, setPreferences] = useState<PreferenceSettings>({
    theme: 'system',
    language: 'en',
    currency: 'NGN'
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, [session]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const loadUserData = async () => {
    if (!session?.user) return;
    
    try {
      setIsLoading(true);
      
      // Load privacy settings
      const privacyResponse = await fetch('/api/settings/privacy');
      if (privacyResponse.ok) {
        const privacyData = await privacyResponse.json();
        setPrivacy(prev => ({ ...prev, ...privacyData }));
      }

      // Load preference settings
      const preferencesResponse = await fetch('/api/settings/preferences');
      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json();
        setPreferences(prev => ({ ...prev, ...preferencesData }));
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      setErrorMessage('Failed to load settings. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    router.push(`/customer/settings?tab=${tab}`);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setSaving(true);
      setErrorMessage('');
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Password changed successfully!');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacySave = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      
      const response = await fetch('/api/settings/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privacy)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }
      
      setSuccessMessage('Privacy settings updated successfully!');
    } catch (error) {
      setErrorMessage('Failed to update privacy settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      
      setSuccessMessage('Preferences updated successfully!');
      
      // Apply theme change immediately
      if (preferences.theme !== 'system') {
        document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
      }
    } catch (error) {
      setErrorMessage('Failed to update preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, external: true, href: '/dashboard/profile' },
    { id: 'notifications', label: 'Notifications', icon: Bell, external: true, href: '/customer/notifications/settings' },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon }
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="flex items-center rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="mr-3 h-5 w-5" />
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="flex items-center rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="mr-3 h-5 w-5" />
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              
              if (tab.external) {
                return (
                  <Link
                    key={tab.id}
                    href={tab.href!}
                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {tab.label}
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Link>
                );
              }
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.label}
                  <ChevronRight className="ml-auto h-4 w-4" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            
            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage your password and account security.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Password
                    </label>
                    <div className="relative mt-1">
                      <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Password
                    </label>
                    <div className="relative mt-1">
                      <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter your new password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm New Password
                    </label>
                    <div className="relative mt-1">
                      <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Confirm your new password"
                      />
                    </div>
                  </div>

                  <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">
                          Password Requirements
                        </h3>
                        <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                          <ul className="list-disc space-y-1 pl-5">
                            <li>At least 8 characters long</li>
                            <li>Include uppercase and lowercase letters</li>
                            <li>Include at least one number</li>
                            <li>Include at least one special character</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePasswordChange}
                    disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Settings</h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Control your privacy and data sharing preferences.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Profile Visibility</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Control who can see your profile information</p>
                    </div>
                    <select
                      value={privacy.profileVisibility}
                      onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value as 'public' | 'private' }))}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Show Booking History</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Allow others to see your booking history</p>
                    </div>
                    <button
                      onClick={() => setPrivacy(prev => ({ ...prev, showBookingHistory: !prev.showBookingHistory }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacy.showBookingHistory ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          privacy.showBookingHistory ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Allow Data Collection</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Help us improve our services by sharing usage data</p>
                    </div>
                    <button
                      onClick={() => setPrivacy(prev => ({ ...prev, allowDataCollection: !prev.allowDataCollection }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacy.allowDataCollection ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          privacy.allowDataCollection ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Marketing Consent</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive marketing communications and offers</p>
                    </div>
                    <button
                      onClick={() => setPrivacy(prev => ({ ...prev, marketingConsent: !prev.marketingConsent }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacy.marketingConsent ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          privacy.marketingConsent ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePrivacySave}
                    disabled={isSaving}
                    className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Privacy Settings
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">App Preferences</h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Customize your app experience and display preferences.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Theme Preference</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
                        className={`flex flex-col items-center rounded-lg border-2 p-4 transition-colors ${
                          preferences.theme === 'light'
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        }`}
                      >
                        <Sun className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">Light</span>
                      </button>
                      
                      <button
                        onClick={() => setPreferences(prev => ({ ...prev, theme: 'dark' }))}
                        className={`flex flex-col items-center rounded-lg border-2 p-4 transition-colors ${
                          preferences.theme === 'dark'
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        }`}
                      >
                        <Moon className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">Dark</span>
                      </button>
                      
                      <button
                        onClick={() => setPreferences(prev => ({ ...prev, theme: 'system' }))}
                        className={`flex flex-col items-center rounded-lg border-2 p-4 transition-colors ${
                          preferences.theme === 'system'
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        }`}
                      >
                        <Monitor className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">System</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Language & Region</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Language
                        </label>
                        <div className="relative mt-1">
                          <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <select 
                            value={preferences.language}
                            onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                            className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Currency
                        </label>
                        <div className="relative mt-1">
                          <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <select 
                            value={preferences.currency}
                            onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                            className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="NGN">Nigerian Naira (₦)</option>
                            <option value="USD">US Dollar ($)</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="GBP">British Pound (£)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePreferencesSave}
                    disabled={isSaving}
                    className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
