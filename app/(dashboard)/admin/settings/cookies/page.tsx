'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/toast';
import { Form, FormSection, FormField, FormGroup, FormActions } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import CookieConsentDialog from '@/components/common/CookieConsentDialog';

interface CookieSettings {
  cookieDialogTitle: string;
  cookieDialogContent: string;
  necessaryText: string;
  preferencesText: string;
  statisticsText: string;
  marketingText: string;
  acceptButtonText: string;
  rejectButtonText: string;
  settingsButtonText: string;
  saveButtonText: string;
  cookiePolicyUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  expiryDays: number;
  backgroundColorHex: string;
  textColorHex: string;
  accentColorHex: string;
}

export default function CookieSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState<CookieSettings>({
    cookieDialogTitle: 'We value your privacy',
    cookieDialogContent: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.',
    necessaryText: 'Necessary cookies help make a website usable by enabling basic functions like page navigation and access to secure areas of the website.',
    preferencesText: 'Preference cookies enable a website to remember information that changes the way the website behaves or looks.',
    statisticsText: 'Statistic cookies help website owners to understand how visitors interact with websites by collecting and reporting information anonymously.',
    marketingText: 'Marketing cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging.',
    acceptButtonText: 'Accept All',
    rejectButtonText: 'Reject All',
    settingsButtonText: 'Cookie Settings',
    saveButtonText: 'Save Preferences',
    cookiePolicyUrl: '',
    privacyPolicyUrl: '',
    termsOfServiceUrl: '',
    expiryDays: 365,
    backgroundColorHex: '#ffffff',
    textColorHex: '#000000',
    accentColorHex: '#1e3a8a',
  });

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/settings/cookies');
        
        if (!response.ok) {
          throw new Error('Failed to fetch cookie settings');
        }
        
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error('Error fetching cookie settings:', error);
        setError('Failed to load cookie settings. Please try again.');
        toast.error('Failed to load cookie settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle number conversion for number inputs
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value, 10) || 0,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/cookies', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save cookie settings');
      }

      toast.success('Cookie settings saved successfully');
    } catch (error) {
      console.error('Error saving cookie settings:', error);
      setError('Failed to save cookie settings. Please try again.');
      toast.error('Failed to save cookie settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getCookiePreviewData = () => {
    return {
      title: formData.cookieDialogTitle,
      content: formData.cookieDialogContent,
      categories: [
        {
          id: 'necessary',
          name: 'Necessary',
          description: formData.necessaryText,
          isRequired: true,
          isEnabled: true,
        },
        {
          id: 'preferences',
          name: 'Preferences',
          description: formData.preferencesText,
          isEnabled: false,
        },
        {
          id: 'statistics',
          name: 'Statistics',
          description: formData.statisticsText,
          isEnabled: false,
        },
        {
          id: 'marketing',
          name: 'Marketing',
          description: formData.marketingText,
          isEnabled: false,
        },
      ],
      acceptButtonText: formData.acceptButtonText,
      rejectButtonText: formData.rejectButtonText,
      settingsButtonText: formData.settingsButtonText,
      saveButtonText: formData.saveButtonText,
      privacyPolicyUrl: formData.privacyPolicyUrl || undefined,
      termsOfServiceUrl: formData.termsOfServiceUrl || undefined,
      backgroundColorHex: formData.backgroundColorHex,
      textColorHex: formData.textColorHex,
      accentColorHex: formData.accentColorHex,
    };
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">Cookie Consent Settings</h2>

      {showPreview && (
        <CookieConsentDialog 
          settings={getCookiePreviewData()}
          onAccept={() => setShowPreview(false)}
          onReject={() => setShowPreview(false)}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {isLoading && !formData.cookieDialogTitle ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="links">Links & Expiry</TabsTrigger>
          </TabsList>
          
          <Form onSubmit={handleSubmit}>
            <TabsContent value="content">
              <FormSection title="Dialog Content">
                <FormField 
                  label="Dialog Title" 
                  required
                >
                  <Input
                    name="cookieDialogTitle"
                    value={formData.cookieDialogTitle}
                    onChange={handleInputChange}
                    placeholder="We value your privacy"
                    required
                  />
                </FormField>

                <FormField 
                  label="Dialog Content" 
                  required
                >
                  <textarea
                    name="cookieDialogContent"
                    value={formData.cookieDialogContent}
                    onChange={handleInputChange}
                    placeholder="We use cookies to enhance your browsing experience..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-none h-24"
                    required
                  />
                </FormField>
              </FormSection>

              <FormSection title="Cookie Categories" className="mt-6">
                <FormField 
                  label="Necessary Cookies" 
                  helperText="These cookies are always enabled"
                  required
                >
                  <textarea
                    name="necessaryText"
                    value={formData.necessaryText}
                    onChange={handleInputChange}
                    placeholder="Necessary cookies help make a website usable..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-none h-24"
                    required
                  />
                </FormField>

                <FormField 
                  label="Preferences Cookies" 
                  required
                >
                  <textarea
                    name="preferencesText"
                    value={formData.preferencesText}
                    onChange={handleInputChange}
                    placeholder="Preference cookies enable a website to remember..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-none h-24"
                    required
                  />
                </FormField>

                <FormField 
                  label="Statistics Cookies" 
                  required
                >
                  <textarea
                    name="statisticsText"
                    value={formData.statisticsText}
                    onChange={handleInputChange}
                    placeholder="Statistic cookies help website owners..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-none h-24"
                    required
                  />
                </FormField>

                <FormField 
                  label="Marketing Cookies" 
                  required
                >
                  <textarea
                    name="marketingText"
                    value={formData.marketingText}
                    onChange={handleInputChange}
                    placeholder="Marketing cookies are used to track visitors..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-none h-24"
                    required
                  />
                </FormField>
              </FormSection>
            </TabsContent>

            <TabsContent value="appearance">
              <FormSection title="Button Text">
                <FormGroup cols={2}>
                  <FormField 
                    label="Accept Button Text" 
                    required
                  >
                    <Input
                      name="acceptButtonText"
                      value={formData.acceptButtonText}
                      onChange={handleInputChange}
                      placeholder="Accept All"
                      required
                    />
                  </FormField>

                  <FormField 
                    label="Reject Button Text" 
                    required
                  >
                    <Input
                      name="rejectButtonText"
                      value={formData.rejectButtonText}
                      onChange={handleInputChange}
                      placeholder="Reject All"
                      required
                    />
                  </FormField>
                </FormGroup>

                <FormGroup cols={2}>
                  <FormField 
                    label="Settings Button Text" 
                    required
                  >
                    <Input
                      name="settingsButtonText"
                      value={formData.settingsButtonText}
                      onChange={handleInputChange}
                      placeholder="Cookie Settings"
                      required
                    />
                  </FormField>

                  <FormField 
                    label="Save Preferences Button Text" 
                    required
                  >
                    <Input
                      name="saveButtonText"
                      value={formData.saveButtonText}
                      onChange={handleInputChange}
                      placeholder="Save Preferences"
                      required
                    />
                  </FormField>
                </FormGroup>
              </FormSection>

              <FormSection title="Colors" className="mt-6">
                <FormGroup cols={3}>
                  <FormField 
                    label="Background Color"
                    required
                  >
                    <div className="flex space-x-2">
                      <div 
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: formData.backgroundColorHex }}
                      />
                      <Input
                        name="backgroundColorHex"
                        value={formData.backgroundColorHex}
                        onChange={handleInputChange}
                        placeholder="#ffffff"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        title="Please enter a valid hex color (e.g. #ffffff)"
                        required
                      />
                    </div>
                  </FormField>

                  <FormField 
                    label="Text Color"
                    required
                  >
                    <div className="flex space-x-2">
                      <div 
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: formData.textColorHex }}
                      />
                      <Input
                        name="textColorHex"
                        value={formData.textColorHex}
                        onChange={handleInputChange}
                        placeholder="#000000"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        title="Please enter a valid hex color (e.g. #000000)"
                        required
                      />
                    </div>
                  </FormField>

                  <FormField 
                    label="Accent Color"
                    required
                  >
                    <div className="flex space-x-2">
                      <div 
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: formData.accentColorHex }}
                      />
                      <Input
                        name="accentColorHex"
                        value={formData.accentColorHex}
                        onChange={handleInputChange}
                        placeholder="#1e3a8a"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        title="Please enter a valid hex color (e.g. #1e3a8a)"
                        required
                      />
                    </div>
                  </FormField>
                </FormGroup>
              </FormSection>
            </TabsContent>

            <TabsContent value="links">
              <FormSection title="Policy Links">
                <FormGroup cols={2}>
                  <FormField 
                    label="Cookie Policy URL"
                    helperText="Leave empty to hide the link"
                  >
                    <Input
                      name="cookiePolicyUrl"
                      value={formData.cookiePolicyUrl || ''}
                      onChange={handleInputChange}
                      placeholder="/cookie-policy"
                    />
                  </FormField>

                  <FormField 
                    label="Privacy Policy URL"
                    helperText="Leave empty to hide the link"
                  >
                    <Input
                      name="privacyPolicyUrl"
                      value={formData.privacyPolicyUrl || ''}
                      onChange={handleInputChange}
                      placeholder="/privacy-policy"
                    />
                  </FormField>
                </FormGroup>

                <FormGroup cols={2}>
                  <FormField 
                    label="Terms of Service URL"
                    helperText="Leave empty to hide the link"
                  >
                    <Input
                      name="termsOfServiceUrl"
                      value={formData.termsOfServiceUrl || ''}
                      onChange={handleInputChange}
                      placeholder="/terms-of-service"
                    />
                  </FormField>

                  <FormField 
                    label="Cookie Consent Expiry (Days)"
                    helperText="Number of days before asking for consent again"
                    required
                  >
                    <Input
                      type="number"
                      min="1"
                      name="expiryDays"
                      value={formData.expiryDays}
                      onChange={handleInputChange}
                      placeholder="365"
                      required
                    />
                  </FormField>
                </FormGroup>
              </FormSection>
            </TabsContent>

            <FormActions className="mt-6">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="mr-2"
              >
                Preview
              </Button>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </FormActions>
          </Form>
        </Tabs>
      )}
    </div>
  );
}