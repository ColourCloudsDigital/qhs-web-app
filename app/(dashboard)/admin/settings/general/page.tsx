'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/toast';
import { Form, FormSection, FormField, FormGroup, FormActions } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import SimpleSelect, { SelectItem } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  defaultLanguage: string;
  timezone: string;
  defaultCurrency: string;
  maintenanceMode: boolean;
  maintenanceMsg?: string;
}

// These would typically come from API
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
];

const CURRENCIES = [
  { value: 'NGN', label: 'Nigerian Naira (NGN)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
];

export default function GeneralSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SiteSettings>({
    siteName: 'Qaras Hotels',
    siteDescription: '',
    defaultLanguage: 'en',
    timezone: 'UTC',
    defaultCurrency: 'NGN',
    maintenanceMode: false,
    maintenanceMsg: '',
  });

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/settings/general');
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load settings. Please try again.');
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">General Settings</h2>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {isLoading && !formData.siteName ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          <FormSection title="Basic Information">
            <FormGroup cols={2}>
              <FormField 
                label="Site Name" 
                required
              >
                <Input
                  name="siteName"
                  value={formData.siteName}
                  onChange={handleInputChange}
                  placeholder="Qaras Hotels"
                  required
                />
              </FormField>

              <FormField 
                label="Default Currency"
              >
                <SimpleSelect
                  name="defaultCurrency"
                  value={formData.defaultCurrency}
                  onValueChange={(value) => handleSelectChange('defaultCurrency', value)}
                  placeholder="Select currency"
                >
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SimpleSelect>
              </FormField>
            </FormGroup>

            <FormField 
              label="Site Description" 
              helperText="A brief description of your site"
            >
              <Input
                name="siteDescription"
                value={formData.siteDescription || ''}
                onChange={handleInputChange}
                placeholder="Your ultimate hotel booking platform"
              />
            </FormField>

            <FormGroup cols={2}>
              <FormField 
                label="Default Language"
              >
                <SimpleSelect
                  name="defaultLanguage"
                  value={formData.defaultLanguage}
                  onValueChange={(value) => handleSelectChange('defaultLanguage', value)}
                  placeholder="Select language"
                >
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SimpleSelect>
              </FormField>

              <FormField 
                label="Timezone"
              >
                <SimpleSelect
                  name="timezone"
                  value={formData.timezone}
                  onValueChange={(value) => handleSelectChange('timezone', value)}
                  placeholder="Select timezone"
                >
                  {TIMEZONES.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </SelectItem>
                  ))}
                </SimpleSelect>
              </FormField>
            </FormGroup>
          </FormSection>

          <FormSection title="Maintenance Mode" className="mt-6">
            <FormField>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Maintenance Mode</div>
                  <div className="text-sm text-gray-500">
                    Enable to show a maintenance page to visitors
                  </div>
                </div>
                <Switch
                  name="maintenanceMode"
                  checked={formData.maintenanceMode}
                  onCheckedChange={(checked) => handleSwitchChange('maintenanceMode', checked)}
                />
              </div>
            </FormField>

            {formData.maintenanceMode && (
              <FormField 
                label="Maintenance Message" 
                helperText="Message to display during maintenance"
              >
                <Input
                  name="maintenanceMsg"
                  value={formData.maintenanceMsg || ''}
                  onChange={handleInputChange}
                  placeholder="We're currently performing maintenance. Please check back later."
                />
              </FormField>
            )}
          </FormSection>

          <FormActions className="mt-6">
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
      )}
    </div>
  );
}