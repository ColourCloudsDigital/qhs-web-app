'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/toast';
import { Form, FormSection, FormField, FormGroup, FormActions } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  ogImageUrl?: string;
  twitterCardType: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  sitemapEnabled: boolean;
  robotsTxtContent?: string;
  structuredData?: string;
}

export default function SEOSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('meta');
  const [formData, setFormData] = useState<SEOSettings>({
    metaTitle: 'Qaras Hospitality Solutions - Hotel Booking Platform',
    metaDescription: 'Find and book hotels across Nigeria with Qaras Hospitality Solutions, the leading hotel booking platform.',
    twitterCardType: 'summary_large_image',
    sitemapEnabled: true,
  });

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/settings/seo');
        
        if (!response.ok) {
          throw new Error('Failed to fetch SEO settings');
        }
        
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error('Error fetching SEO settings:', error);
        setError('Failed to load SEO settings. Please try again.');
        toast.error('Failed to load SEO settings');
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
      const response = await fetch('/api/admin/settings/seo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save SEO settings');
      }

      toast.success('SEO settings saved successfully');
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      setError('Failed to save SEO settings. Please try again.');
      toast.error('Failed to save SEO settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-slate-800 dark:text-white">SEO Settings</h2>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {isLoading && !formData.metaTitle ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="meta">Meta Tags</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <Form onSubmit={handleSubmit}>
            <TabsContent value="meta">
              <FormSection title="Meta Information">
                <FormField 
                  label="Meta Title" 
                  required
                  helperText="The title that appears in search engine results (50-60 characters recommended)"
                >
                  <Input
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    placeholder="Qaras Hospitality Solutions - Hotel Booking Platform"
                    required
                  />
                </FormField>

                <FormField 
                  label="Meta Description" 
                  required
                  helperText="The description that appears in search engine results (150-160 characters recommended)"
                >
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    placeholder="Find and book hotels across Nigeria with Qaras Hospitality Solutions..."
                    className="w-full p-2 border border-gray-300 rounded-md resize-none h-24"
                    required
                  />
                </FormField>

                <FormField>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Enable Sitemap</div>
                      <div className="text-sm text-gray-500">
                        Automatically generate and update a sitemap.xml file
                      </div>
                    </div>
                    <Switch
                      name="sitemapEnabled"
                      checked={formData.sitemapEnabled}
                      onCheckedChange={(checked) => handleSwitchChange('sitemapEnabled', checked)}
                    />
                  </div>
                </FormField>
              </FormSection>
            </TabsContent>

            <TabsContent value="social">
              <FormSection title="Social Media Cards">
                <FormField 
                  label="Open Graph Image URL" 
                  helperText="The image that appears when your site is shared on social media (1200x630 pixels recommended)"
                >
                  <Input
                    name="ogImageUrl"
                    value={formData.ogImageUrl || ''}
                    onChange={handleInputChange}
                    placeholder="/images/og-image.jpg"
                  />
                </FormField>

                <FormField 
                  label="Twitter Card Type" 
                  required
                  helperText="The type of Twitter card to display when shared on Twitter"
                >
                  <Select
                    name="twitterCardType"
                    value={formData.twitterCardType}
                    onValueChange={(value) => handleSelectChange('twitterCardType', value)}
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="app">App</option>
                    <option value="player">Player</option>
                  </Select>
                </FormField>
              </FormSection>
            </TabsContent>

            <TabsContent value="tracking">
              <FormSection title="Analytics and Tracking">
                <FormField 
                  label="Google Analytics ID" 
                  helperText="Your Google Analytics measurement ID (G-XXXXXXXXXX) or tracking ID (UA-XXXXXXXX-X)"
                >
                  <Input
                    name="googleAnalyticsId"
                    value={formData.googleAnalyticsId || ''}
                    onChange={handleInputChange}
                    placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                  />
                </FormField>

                <FormField 
                  label="Facebook Pixel ID" 
                  helperText="Your Facebook Pixel ID for tracking conversions"
                >
                  <Input
                    name="facebookPixelId"
                    value={formData.facebookPixelId || ''}
                    onChange={handleInputChange}
                    placeholder="XXXXXXXXXXXXXXXXXXX"
                  />
                </FormField>
              </FormSection>
            </TabsContent>

            <TabsContent value="advanced">
              <FormSection title="Advanced SEO">
                <FormField 
                  label="Robots.txt Content" 
                  helperText="Custom robots.txt content to control search engine crawling"
                >
                  <textarea
                    name="robotsTxtContent"
                    value={formData.robotsTxtContent || ''}
                    onChange={handleInputChange}
                    placeholder="User-agent: *\nAllow: /\nDisallow: /admin/"
                    className="w-full p-2 border border-gray-300 rounded-md resize-none h-32 font-mono"
                  />
                </FormField>

                <FormField 
                  label="Structured Data (JSON-LD)" 
                  helperText="JSON-LD structured data for rich results in search engines"
                >
                  <textarea
                    name="structuredData"
                    value={formData.structuredData || ''}
                    onChange={handleInputChange}
                    placeholder='{"@context": "https://schema.org", "@type": "Organization", "name": "Qaras Hospitality Solutions"}'
                    className="w-full p-2 border border-gray-300 rounded-md resize-none h-40 font-mono"
                  />
                </FormField>
              </FormSection>
            </TabsContent>

            <FormActions className="mt-6">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save SEO Settings'}
              </Button>
            </FormActions>
          </Form>
        </Tabs>
      )}
    </div>
  );
}