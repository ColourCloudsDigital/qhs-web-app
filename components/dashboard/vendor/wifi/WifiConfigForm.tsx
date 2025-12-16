'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, RefreshCw, ArrowLeft } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HotelSelector } from '@/components/dashboard/vendor/HotelSelector';
import toast from '@/lib/services/toast.service';

interface WiFiConfig {
  networkName: string;
  isEnabled: boolean;
  bandwidthLimit?: number;
  usernameFormat?: string;
  passwordFormat?: string;
  termsAndConditions?: string;
  landingPageUrl?: string;
  autoDeactivate?: boolean;
}

interface WifiConfigFormProps {
  vendorId: string;
}

export default function WifiConfigForm({ vendorId }: WifiConfigFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialHotelId = searchParams.get('hotelId');
  
  const [selectedHotel, setSelectedHotel] = useState<string | null>(initialHotelId);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [config, setConfig] = useState<WiFiConfig>({
    networkName: '',
    isEnabled: false,
  });

  // Handle hotel change
  const handleHotelChange = (hotelId: string) => {
    setSelectedHotel(hotelId);
    router.push(`/dashboard/vendor/wifi/configuration?hotelId=${hotelId}`);
  };

  // Fetch WiFi config when hotel changes
  useEffect(() => {
    if (selectedHotel) {
      fetchWiFiConfig();
    }
  }, [selectedHotel]);

  // Fetch WiFi configuration
  const fetchWiFiConfig = async () => {
    if (!selectedHotel) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/hotels/${selectedHotel}/wifi/configuration`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch WiFi configuration');
      }

      const data = await response.json();
      setConfig(data || {
        networkName: '',
        isEnabled: false,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load WiFi configuration');
    } finally {
      setLoading(false);
    }
  };

  // Save WiFi configuration
  const saveWiFiConfig = async () => {
    if (!selectedHotel) return;

    setSaveLoading(true);
    try {
      const response = await fetch(`/api/hotels/${selectedHotel}/wifi/configuration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to update WiFi configuration');
      }

      toast.success('WiFi configuration saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save WiFi configuration');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (field: keyof WiFiConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setConfig((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // Handle switch changes
  const handleSwitchChange = (field: keyof WiFiConfig) => (checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  // Handle back button
  const handleBack = () => {
    router.push('/dashboard/vendor/wifi');
  };

  return (
    <div className="space-y-6">
      {/* Hotel selector */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <HotelSelector 
          vendorId={vendorId} 
          onHotelChange={handleHotelChange}
          value={selectedHotel || undefined}
        />
      </div>

      {selectedHotel ? (
        <div className="space-y-6">
          {/* Back button */}
          <Button variant="outline" className="gap-2" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to WiFi Management
          </Button>

          {loading ? (
            <div className="flex h-40 flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading WiFi configuration...</p>
            </div>
          ) : (
            <>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="credentials">Credentials</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>General WiFi Settings</CardTitle>
                      <CardDescription>
                        Configure basic WiFi network settings for your hotel.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Network Name */}
                      <div className="space-y-2">
                        <Label htmlFor="networkName">Network Name (SSID)</Label>
                        <Input
                          id="networkName"
                          placeholder="Hotel Guest WiFi"
                          value={config.networkName || ''}
                          onChange={handleChange('networkName')}
                        />
                      </div>

                      {/* Enable/Disable WiFi */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="wifi-enabled">Enable WiFi Management</Label>
                          <p className="text-sm text-muted-foreground">
                            Turning this off will prevent generation of new credentials
                          </p>
                        </div>
                        <Switch
                          id="wifi-enabled"
                          checked={config.isEnabled}
                          onCheckedChange={handleSwitchChange('isEnabled')}
                        />
                      </div>

                      {/* Bandwidth Limit */}
                      <div className="space-y-2">
                        <Label htmlFor="bandwidthLimit">Bandwidth Limit (Mbps)</Label>
                        <Input
                          id="bandwidthLimit"
                          type="number"
                          placeholder="Unlimited"
                          value={config.bandwidthLimit || ''}
                          onChange={handleChange('bandwidthLimit')}
                        />
                        <p className="text-sm text-muted-foreground">
                          Leave blank for unlimited bandwidth
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Credential Settings */}
                <TabsContent value="credentials" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Credential Settings</CardTitle>
                      <CardDescription>
                        Configure how WiFi credentials are generated and formatted.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Username Format */}
                      <div className="space-y-2">
                        <Label htmlFor="usernameFormat">Username Format</Label>
                        <Input
                          id="usernameFormat"
                          placeholder="guest-{name}-{room}"
                          value={config.usernameFormat || ''}
                          onChange={handleChange('usernameFormat')}
                        />
                        <p className="text-sm text-muted-foreground">
                          Available placeholders: {'{name}'}, {'{firstname}'}, {'{initials}'}, {'{room}'}, {'{random}'}, {'{timestamp}'}
                        </p>
                      </div>

                      {/* Password Format */}
                      <div className="space-y-2">
                        <Label htmlFor="passwordFormat">Password Format</Label>
                        <Input
                          id="passwordFormat"
                          placeholder="pass-{room}-{random}"
                          value={config.passwordFormat || ''}
                          onChange={handleChange('passwordFormat')}
                        />
                        <p className="text-sm text-muted-foreground">
                          Available placeholders: {'{room}'}, {'{random}'}, {'{timestamp}'}
                        </p>
                      </div>

                      {/* Auto-deactivate */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-deactivate">Auto-deactivate on checkout</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically deactivate credentials when guests check out
                          </p>
                        </div>
                        <Switch
                          id="auto-deactivate"
                          checked={config.autoDeactivate || false}
                          onCheckedChange={handleSwitchChange('autoDeactivate')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Advanced Settings */}
                <TabsContent value="advanced" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Advanced Settings</CardTitle>
                      <CardDescription>
                        Configure advanced WiFi settings and portal customization.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Terms and Conditions */}
                      <div className="space-y-2">
                        <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                        <Textarea
                          id="termsAndConditions"
                          placeholder="Terms and conditions for using the WiFi service..."
                          className="min-h-32"
                          value={config.termsAndConditions || ''}
                          onChange={handleChange('termsAndConditions')}
                        />
                        <p className="text-sm text-muted-foreground">
                          These will be displayed on the captive portal login page
                        </p>
                      </div>

                      {/* Landing Page URL */}
                      <div className="space-y-2">
                        <Label htmlFor="landingPageUrl">Landing Page URL</Label>
                        <Input
                          id="landingPageUrl"
                          placeholder="https://example.com/welcome"
                          value={config.landingPageUrl || ''}
                          onChange={handleChange('landingPageUrl')}
                        />
                        <p className="text-sm text-muted-foreground">
                          Users will be redirected to this page after successful login
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Save button */}
              <div className="flex justify-end">
                <Button 
                  onClick={saveWiFiConfig} 
                  disabled={saveLoading} 
                  className="flex items-center gap-2"
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <h3 className="mb-2 text-lg font-semibold">Select a Hotel</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please select a hotel to configure WiFi settings
          </p>
        </div>
      )}
    </div>
  );
}