'use client';

import React, { useState, useEffect } from 'react';
import { Form, FormSection, FormField, FormGroup, FormActions } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from '@/lib/toast';
import { AlertTriangle, BarChart3, Globe, Code, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnalyticsSettings {
  googleAnalytics: {
    enabled: boolean;
    measurementId: string;
    enableDemographics: boolean;
    enableEnhancedLinkAttribution: boolean;
    anonymizeIp: boolean;
  };
  metaTags: {
    googleSiteVerification: string;
    bingSiteVerification: string;
    yandexSiteVerification: string;
  };
  customTracking: {
    enabled: boolean;
    headScripts: string;
    bodyStartScripts: string;
    bodyEndScripts: string;
  };
}

// Default settings
const defaultSettings: AnalyticsSettings = {
  googleAnalytics: {
    enabled: false,
    measurementId: '',
    enableDemographics: false,
    enableEnhancedLinkAttribution: true,
    anonymizeIp: true,
  },
  metaTags: {
    googleSiteVerification: '',
    bingSiteVerification: '',
    yandexSiteVerification: '',
  },
  customTracking: {
    enabled: false,
    headScripts: '',
    bodyStartScripts: '',
    bodyEndScripts: '',
  },
};

export default function AnalyticsSettingsPage() {
  const [settings, setSettings] = useState<AnalyticsSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('google-analytics');

  // Fetch current analytics settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/admin/settings/analytics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics settings');
        }
        
        const data = await response.json();
        setSettings(data);
      } catch (error: any) {
        console.error('Error fetching analytics settings:', error);
        setError(error.message || 'Failed to load analytics settings');
        toast.error('Failed to load analytics settings. Using default settings.');
        // Still use default settings to allow configuration
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/settings/analytics', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update analytics settings');
      }
      
      toast.success('Analytics settings updated successfully');
    } catch (error: any) {
      console.error('Error saving analytics settings:', error);
      setError(error.message || 'Failed to save analytics settings');
      toast.error('Failed to save analytics settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    section: keyof AnalyticsSettings,
    field: string,
    value: string | boolean
  ) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info('Settings reset to default. Click Save Changes to apply.');
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Analytics & Tracking</h1>
        <p className="text-muted-foreground text-slate-800 dark:text-white">
          Configure analytics and tracking for your application
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form onSubmit={handleSave}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="google-analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Google Analytics
            </TabsTrigger>
            <TabsTrigger value="meta-tags" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Site Verification
            </TabsTrigger>
            <TabsTrigger value="custom-tracking" className="flex items-center gap-2">
              <Code className="h-4 w-4" /> Custom Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google-analytics" className="space-y-6">
            <FormSection title="Google Analytics" description="Configure Google Analytics 4 tracking">
              <FormGroup>
                <FormField
                  label="Enable Google Analytics"
                  helperText="Turn on Google Analytics tracking"
                >
                  <div className="flex items-center pt-2">
                    <Switch
                      checked={settings.googleAnalytics.enabled}
                      onCheckedChange={(checked) => 
                        handleChange('googleAnalytics', 'enabled', checked)
                      }
                    />
                    <span className="ml-2">
                      {settings.googleAnalytics.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </FormField>
              </FormGroup>

              {settings.googleAnalytics.enabled && (
                <>
                  <FormGroup>
                    <FormField
                      label="Measurement ID"
                      helperText="Your Google Analytics 4 Measurement ID (e.g., G-XXXXXXXXXX)"
                      required
                    >
                      <Input
                        value={settings.googleAnalytics.measurementId}
                        onChange={(e) => 
                          handleChange('googleAnalytics', 'measurementId', e.target.value)
                        }
                        placeholder="G-XXXXXXXXXX"
                      />
                    </FormField>
                  </FormGroup>

                  <FormGroup cols={2}>
                    <FormField
                      label="Enable Demographics"
                      helperText="Collect demographics and interest reports"
                    >
                      <div className="flex items-center pt-2">
                        <Switch
                          checked={settings.googleAnalytics.enableDemographics}
                          onCheckedChange={(checked) => 
                            handleChange('googleAnalytics', 'enableDemographics', checked)
                          }
                        />
                        <span className="ml-2">
                          {settings.googleAnalytics.enableDemographics ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </FormField>

                    <FormField
                      label="Enhanced Link Attribution"
                      helperText="Distinguishes between multiple links to the same URL"
                    >
                      <div className="flex items-center pt-2">
                        <Switch
                          checked={settings.googleAnalytics.enableEnhancedLinkAttribution}
                          onCheckedChange={(checked) => 
                            handleChange('googleAnalytics', 'enableEnhancedLinkAttribution', checked)
                          }
                        />
                        <span className="ml-2">
                          {settings.googleAnalytics.enableEnhancedLinkAttribution ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </FormField>
                  </FormGroup>

                  <FormGroup>
                    <FormField
                      label="Anonymize IP"
                      helperText="Masks the last octet of the user's IP address (GDPR compliance)"
                    >
                      <div className="flex items-center pt-2">
                        <Switch
                          checked={settings.googleAnalytics.anonymizeIp}
                          onCheckedChange={(checked) => 
                            handleChange('googleAnalytics', 'anonymizeIp', checked)
                          }
                        />
                        <span className="ml-2">
                          {settings.googleAnalytics.anonymizeIp ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </FormField>
                  </FormGroup>
                </>
              )}
            </FormSection>
          </TabsContent>

          <TabsContent value="meta-tags" className="space-y-6">
            <FormSection title="Site Verification" description="Add verification meta tags for search engines">
              <FormGroup>
                <FormField
                  label="Google Search Console"
                  helperText="Google site verification meta tag content"
                >
                  <Input
                    value={settings.metaTags.googleSiteVerification}
                    onChange={(e) => 
                      handleChange('metaTags', 'googleSiteVerification', e.target.value)
                    }
                    placeholder="Enter meta content value"
                  />
                </FormField>
              </FormGroup>

              <FormGroup>
                <FormField
                  label="Bing Webmaster Tools"
                  helperText="Microsoft Bing site verification meta tag content"
                >
                  <Input
                    value={settings.metaTags.bingSiteVerification}
                    onChange={(e) => 
                      handleChange('metaTags', 'bingSiteVerification', e.target.value)
                    }
                    placeholder="Enter meta content value"
                  />
                </FormField>
              </FormGroup>

              <FormGroup>
                <FormField
                  label="Yandex Webmaster"
                  helperText="Yandex site verification meta tag content"
                >
                  <Input
                    value={settings.metaTags.yandexSiteVerification}
                    onChange={(e) => 
                      handleChange('metaTags', 'yandexSiteVerification', e.target.value)
                    }
                    placeholder="Enter meta content value"
                  />
                </FormField>
              </FormGroup>
            </FormSection>
          </TabsContent>

          <TabsContent value="custom-tracking" className="space-y-6">
            <FormSection title="Custom Tracking Scripts" description="Add custom tracking or analytics scripts">
              <FormGroup>
                <FormField
                  label="Enable Custom Scripts"
                  helperText="Enable or disable all custom tracking scripts"
                >
                  <div className="flex items-center pt-2">
                    <Switch
                      checked={settings.customTracking.enabled}
                      onCheckedChange={(checked) => 
                        handleChange('customTracking', 'enabled', checked)
                      }
                    />
                    <span className="ml-2">
                      {settings.customTracking.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </FormField>
              </FormGroup>

              {settings.customTracking.enabled && (
                <>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Custom tracking scripts are injected directly into your site. Make sure you trust the source and understand the implications. Invalid scripts may break your site.
                    </AlertDescription>
                  </Alert>

                  <FormGroup>
                    <FormField
                      label="Head Scripts"
                      helperText="Scripts to be injected into the <head> section"
                    >
                      <textarea
                        value={settings.customTracking.headScripts}
                        onChange={(e) => 
                          handleChange('customTracking', 'headScripts', e.target.value)
                        }
                        className="h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono dark:border-gray-700 dark:bg-gray-800"
                        placeholder="<!-- Add your head scripts here -->"
                      />
                    </FormField>
                  </FormGroup>

                  <FormGroup>
                    <FormField
                      label="Body Start Scripts"
                      helperText="Scripts to be injected at the start of the <body> section"
                    >
                      <textarea
                        value={settings.customTracking.bodyStartScripts}
                        onChange={(e) => 
                          handleChange('customTracking', 'bodyStartScripts', e.target.value)
                        }
                        className="h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono dark:border-gray-700 dark:bg-gray-800"
                        placeholder="<!-- Add your body start scripts here -->"
                      />
                    </FormField>
                  </FormGroup>

                  <FormGroup>
                    <FormField
                      label="Body End Scripts"
                      helperText="Scripts to be injected at the end of the <body> section"
                    >
                      <textarea
                        value={settings.customTracking.bodyEndScripts}
                        onChange={(e) => 
                          handleChange('customTracking', 'bodyEndScripts', e.target.value)
                        }
                        className="h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono dark:border-gray-700 dark:bg-gray-800"
                        placeholder="<!-- Add your body end scripts here -->"
                      />
                    </FormField>
                  </FormGroup>
                </>
              )}
            </FormSection>
          </TabsContent>
        </Tabs>

        <FormActions>
          <Button type="button" variant="secondary" onClick={handleReset}>Reset</Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </FormActions>
      </Form>
    </div>
  );
}