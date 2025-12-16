'use client';

import React, { useState, useEffect } from 'react';
import { Form, FormSection, FormField, FormGroup, FormActions } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import toast from '@/lib/toast';
import { ThemeColorPicker } from '@/components/admin/settings/ThemeColorPicker';
import { ImageUploader } from '@/components/admin/settings/ImageUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSettings } from '@/lib/types/settings';
import { Palette, Type, Layout, Code, FileImage, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Default theme settings
const defaultSettings: ThemeSettings = {
  colorPalette: {
    primary: '#1e40af',
    secondary: '#4b5563',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFontFamily: null,
  },
  buttons: {
    borderRadius: '0.375rem',
    primaryBackground: '#1e40af',
    primaryText: '#ffffff',
    secondaryBackground: '#4b5563',
    secondaryText: '#ffffff',
  },
  layout: {
    containerWidth: '1200px',
    sidebarWidth: '250px',
  },
  customCSS: null,
  logoUrl: null,
  faviconUrl: null,
  loginBannerUrl: null,
};

export default function ThemeSettingsPage() {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('colors');

  // Fetch current theme settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/admin/settings/theme');
        
        if (!response.ok) {
          throw new Error('Failed to fetch theme settings');
        }
        
        const data = await response.json();
        setSettings(data);
      } catch (error: any) {
        console.error('Error fetching theme settings:', error);
        setError(error.message || 'Failed to load theme settings');
        toast.error('Failed to load theme settings');
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
      const response = await fetch('/api/admin/settings/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update theme settings');
      }
      
      toast.success('Theme settings updated successfully');
    } catch (error: any) {
      console.error('Error saving theme settings:', error);
      setError(error.message || 'Failed to save theme settings');
      toast.error('Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (colorName: keyof ThemeSettings['colorPalette'], value: string) => {
    setSettings({
      ...settings,
      colorPalette: {
        ...settings.colorPalette,
        [colorName]: value
      }
    });
  };

  const handleFontChange = (field: keyof ThemeSettings['typography'], value: string) => {
    setSettings({
      ...settings,
      typography: {
        ...settings.typography,
        [field]: value
      }
    });
  };

  const handleButtonChange = (field: keyof ThemeSettings['buttons'], value: string) => {
    setSettings({
      ...settings,
      buttons: {
        ...settings.buttons,
        [field]: value
      }
    });
  };

  const handleLayoutChange = (field: keyof ThemeSettings['layout'], value: string) => {
    setSettings({
      ...settings,
      layout: {
        ...settings.layout,
        [field]: value
      }
    });
  };

  const handleCustomCSSChange = (value: string) => {
    setSettings({
      ...settings,
      customCSS: value
    });
  };

  const handleLogoUpload = (url: string) => {
    setSettings({
      ...settings,
      logoUrl: url || null
    });
  };

  const handleFaviconUpload = (url: string) => {
    setSettings({
      ...settings,
      faviconUrl: url || null
    });
  };

  const handleLoginBannerUpload = (url: string) => {
    setSettings({
      ...settings,
      loginBannerUrl: url || null
    });
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info('Theme settings reset to default. Click Save Changes to apply.');
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Theme & Branding</h1>
        <p className="text-muted-foreground text-slate-800 dark:text-white">
          Customize the appearance of your application
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" /> Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="h-4 w-4" /> Typography
            </TabsTrigger>
            <TabsTrigger value="buttons" className="flex items-center gap-2">
              <div className="rounded-sm border border-current p-1 text-[8px]">BTN</div> Buttons
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Layout className="h-4 w-4" /> Layout
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <FileImage className="h-4 w-4" /> Branding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6">
            <FormSection title="Color Palette" description="Configure the color palette for your application">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField label="Primary Color">
                  <ThemeColorPicker 
                    color={settings.colorPalette.primary} 
                    onChange={(value) => handleColorChange('primary', value)} 
                  />
                </FormField>
                
                <FormField label="Secondary Color">
                  <ThemeColorPicker 
                    color={settings.colorPalette.secondary} 
                    onChange={(value) => handleColorChange('secondary', value)} 
                  />
                </FormField>
                
                <FormField label="Accent Color">
                  <ThemeColorPicker 
                    color={settings.colorPalette.accent} 
                    onChange={(value) => handleColorChange('accent', value)} 
                  />
                </FormField>
                
                <FormField label="Background Color">
                  <ThemeColorPicker 
                    color={settings.colorPalette.background} 
                    onChange={(value) => handleColorChange('background', value)} 
                  />
                </FormField>
                
                <FormField label="Text Color">
                  <ThemeColorPicker 
                    color={settings.colorPalette.text} 
                    onChange={(value) => handleColorChange('text', value)} 
                  />
                </FormField>
              </div>

              <div className="mt-6">
                <h3 className="mb-4 text-sm font-medium">Status Colors</h3>
                <div className="grid gap-6 md:grid-cols-2lg:grid-cols-4">
                  <FormField label="Success">
                    <ThemeColorPicker 
                      color={settings.colorPalette.success} 
                      onChange={(value) => handleColorChange('success', value)} 
                    />
                  </FormField>
                  
                  <FormField label="Warning">
                    <ThemeColorPicker 
                      color={settings.colorPalette.warning} 
                      onChange={(value) => handleColorChange('warning', value)} 
                    />
                  </FormField>
                  
                  <FormField label="Error">
                    <ThemeColorPicker 
                      color={settings.colorPalette.error} 
                      onChange={(value) => handleColorChange('error', value)} 
                    />
                  </FormField>
                  
                  <FormField label="Info">
                    <ThemeColorPicker 
                      color={settings.colorPalette.info} 
                      onChange={(value) => handleColorChange('info', value)} 
                    />
                  </FormField>
                </div>
              </div>
            </FormSection>

            <FormSection title="Preview" description="See how your color choices look">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="overflow-hidden">
                    <div 
                      className="h-20 w-full" 
                      style={{ backgroundColor: settings.colorPalette.primary }}
                    ></div>
                    <CardContent className="p-4">
                      <p className="text-center text-sm">Primary Color</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden">
                    <div 
                      className="h-20 w-full" 
                      style={{ backgroundColor: settings.colorPalette.secondary }}
                    ></div>
                    <CardContent className="p-4">
                      <p className="text-center text-sm">Secondary Color</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="rounded-lg border p-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium" style={{ color: settings.colorPalette.text }}>
                      Sample Heading
                    </h3>
                    <p style={{ color: settings.colorPalette.text }}>
                      This is sample text that shows how your text color will look on your site.
                    </p>
                    <div className="space-x-2">
                      <Button
                        type="button"
                        style={{ 
                          backgroundColor: settings.colorPalette.primary,
                          color: settings.buttons.primaryText
                        }}
                      >
                        Primary Button
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        style={{ 
                          backgroundColor: settings.colorPalette.secondary,
                          color: settings.buttons.secondaryText
                        }}
                      >
                        Secondary Button
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="typography" className="space-y-6">
            <FormSection title="Typography" description="Configure the typography for your application">
              <FormGroup cols={2}>
                <FormField
                  label="Base Font Family"
                  helperText="The primary font used throughout your application"
                >
                  <Input
                    value={settings.typography.fontFamily}
                    onChange={(e) => handleFontChange('fontFamily', e.target.value)}
                    placeholder="e.g., Inter, system-ui, sans-serif"
                  />
                </FormField>
                
                <FormField
                  label="Heading Font Family"
                  helperText="Optional separate font for headings (leave empty to use base font)"
                >
                  <Input
                    value={settings.typography.headingFontFamily || ''}
                    onChange={(e) => handleFontChange('headingFontFamily', e.target.value)}
                    placeholder="e.g., Poppins, sans-serif"
                  />
                </FormField>
              </FormGroup>
              
              <FormSection title="Preview" description="See how your typography choices look">
                <div 
                  className="rounded-lg border p-6"
                  style={{ 
                    fontFamily: settings.typography.fontFamily 
                  }}
                >
                  <div className="space-y-6">
                    <div>
                      <h1 
                        className="mb-2 text-3xl font-bold"
                        style={{ 
                          fontFamily: settings.typography.headingFontFamily || settings.typography.fontFamily 
                        }}
                      >
                        Heading 1
                      </h1>
                      <p>This is how your primary content will look with the selected fonts.</p>
                    </div>
                    
                    <div>
                      <h2 
                        className="mb-2 text-2xl font-semibold"
                        style={{ 
                          fontFamily: settings.typography.headingFontFamily || settings.typography.fontFamily 
                        }}
                      >
                        Heading 2
                      </h2>
                      <p>Secondary headings will appear like this in your application.</p>
                    </div>
                    
                    <div>
                      <h3 
                        className="mb-2 text-xl font-medium"
                        style={{ 
                          fontFamily: settings.typography.headingFontFamily || settings.typography.fontFamily 
                        }}
                      >
                        Heading 3
                      </h3>
                      <p>This is a sample paragraph of text that demonstrates how your body content will look with the selected font family. The text should be readable and maintain good visual hierarchy with the headings.</p>
                    </div>
                  </div>
                </div>
              </FormSection>
            </FormSection>
          </TabsContent>

          <TabsContent value="buttons" className="space-y-6">
            <FormSection title="Button Styling" description="Configure the appearance of buttons">
              <FormGroup cols={2}>
                <FormField
                  label="Border Radius"
                  helperText="Control the roundness of buttons"
                >
                  <Input
                    value={settings.buttons.borderRadius}
                    onChange={(e) => handleButtonChange('borderRadius', e.target.value)}
                    placeholder="e.g., 0.25rem, 4px, etc."
                  />
                </FormField>
                
                <FormField
                  label="Primary Text Color"
                  helperText="Text color for primary buttons"
                >
                  <ThemeColorPicker 
                    color={settings.buttons.primaryText} 
                    onChange={(value) => handleButtonChange('primaryText', value)} 
                  />
                </FormField>
                
                <FormField
                  label="Primary Background"
                  helperText="Background color for primary buttons"
                >
                  <ThemeColorPicker 
                    color={settings.buttons.primaryBackground} 
                    onChange={(value) => handleButtonChange('primaryBackground', value)} 
                  />
                </FormField>
                
                <FormField
                  label="Secondary Text Color"
                  helperText="Text color for secondary buttons"
                >
                  <ThemeColorPicker 
                    color={settings.buttons.secondaryText} 
                    onChange={(value) => handleButtonChange('secondaryText', value)} 
                  />
                </FormField>
                
                <FormField
                  label="Secondary Background"
                  helperText="Background color for secondary buttons"
                >
                  <ThemeColorPicker 
                    color={settings.buttons.secondaryBackground} 
                    onChange={(value) => handleButtonChange('secondaryBackground', value)} 
                  />
                </FormField>
              </FormGroup>
              
              <div className="mt-8">
                <h3 className="mb-4 text-sm font-medium">Button Preview</h3>
                <div className="flex flex-wrap gap-4 rounded-lg border p-6">
                  <Button
                    type="button"
                    style={{ 
                      backgroundColor: settings.buttons.primaryBackground,
                      color: settings.buttons.primaryText,
                      borderRadius: settings.buttons.borderRadius
                    }}
                  >
                    Primary Button
                  </Button>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    style={{ 
                      backgroundColor: settings.buttons.secondaryBackground,
                      color: settings.buttons.secondaryText,
                      borderRadius: settings.buttons.borderRadius
                    }}
                  >
                    Secondary Button
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    style={{ 
                      borderRadius: settings.buttons.borderRadius
                    }}
                  >
                    Outline Button
                  </Button>
                  
                  <Button
                    type="button"
                    disabled={true}
                    style={{ 
                      backgroundColor: settings.buttons.primaryBackground,
                      color: settings.buttons.primaryText,
                      borderRadius: settings.buttons.borderRadius
                    }}
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading
                  </Button>
                </div>
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <FormSection title="Layout Settings" description="Configure layout dimensions">
              <FormGroup cols={2}>
                <FormField
                  label="Container Width"
                  helperText="Maximum width of the content container"
                >
                  <Input
                    value={settings.layout.containerWidth}
                    onChange={(e) => handleLayoutChange('containerWidth', e.target.value)}
                    placeholder="e.g., 1200px, 80rem, etc."
                  />
                </FormField>
                
                <FormField
                  label="Sidebar Width"
                  helperText="Width of the sidebar in the dashboard"
                >
                  <Input
                    value={settings.layout.sidebarWidth}
                    onChange={(e) => handleLayoutChange('sidebarWidth', e.target.value)}
                    placeholder="e.g., 250px, 16rem, etc."
                  />
                </FormField>
              </FormGroup>
              
              <div className="mt-8">
                <h3 className="mb-4 text-sm font-medium">Layout Preview</h3>
                <div className="rounded-lg border p-4">
                  <div className="flex h-64 gap-4 rounded bg-gray-100 p-4 dark:bg-gray-800">
                    <div 
                      className="rounded bg-gray-200 dark:bg-gray-700" 
                      style={{ width: settings.layout.sidebarWidth }}
                    >
                      <div className="m-4 h-12 rounded-md bg-gray-300 dark:bg-gray-600"></div>
                      <div className="m-4 h-6 rounded-md bg-gray-300 dark:bg-gray-600"></div>
                      <div className="m-4 h-6 rounded-md bg-gray-300 dark:bg-gray-600"></div>
                      <div className="m-4 h-6 rounded-md bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                    <div 
                      className="flex-1 rounded bg-white p-4 dark:bg-gray-900" 
                      style={{ maxWidth: settings.layout.containerWidth }}
                    >
                      <div className="mb-4 h-8 rounded-md bg-gray-100 dark:bg-gray-800"></div>
                      <div className="mb-2 h-4 rounded-md bg-gray-100 dark:bg-gray-800"></div>
                      <div className="mb-2 h-4 rounded-md bg-gray-100 dark:bg-gray-800"></div>
                      <div className="mb-2 h-4 w-2/3 rounded-md bg-gray-100 dark:bg-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <FormSection title="Brand Assets" description="Upload your brand assets">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  label="Logo"
                  helperText="Recommended size: 200x60px, PNG or SVG format"
                >
                  <ImageUploader 
                    imageUrl={settings.logoUrl}
                    onUpload={handleLogoUpload}
                    uploadDir="theme"
                    entityId="logo"
                    size="medium"
                    aspect="landscape"
                  />
                </FormField>
                
                <FormField
                  label="Favicon"
                  helperText="Recommended size: 32x32px, PNG or ICO format"
                >
                  <ImageUploader 
                    imageUrl={settings.faviconUrl}
                    onUpload={handleFaviconUpload}
                    uploadDir="theme"
                    entityId="favicon"
                    size="small"
                    aspect="square"
                    allowedFileTypes={['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml']}
                  />
                </FormField>
              </div>
              
              <div className="mt-8">
                <FormField
                  label="Login Banner Image"
                  helperText="Recommended size: 1600x600px, displayed on the login page for a visually appealing experience"
                >
                  <ImageUploader 
                    imageUrl={settings.loginBannerUrl}
                    onUpload={handleLoginBannerUpload}
                    uploadDir="theme"
                    entityId="login-banner"
                    size="banner"
                    aspect="landscape"
                    maxSizeInMB={5}
                  />
                </FormField>
              </div>
              
              <FormSection title="Custom CSS" description="Add custom CSS to override the default styling">
                <FormField>
                  <div className="border rounded-md">
                    <textarea
                      className="w-full h-64 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none"
                      value={settings.customCSS || ''}
                      onChange={(e) => handleCustomCSSChange(e.target.value)}
                      placeholder="/* Add your custom CSS here */\n\n.custom-class {\n  property: value;\n}"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Custom CSS will be applied globally across your application. Use with caution.
                  </p>
                </FormField>
              </FormSection>
            </FormSection>
          </TabsContent>
        </Tabs>

        <FormActions>
          <Button type="button" variant="secondary" onClick={handleReset}>Reset Defaults</Button>
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