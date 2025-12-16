'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/toast';
import { Form, FormSection, FormField, FormGroup, FormActions } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle } from 'lucide-react';

interface GeneralSettings {
  defaultTaxRate: number;
  defaultCommissionRate: number;
}

interface PaystackSettings {
  publicKey: string;
  secretKey: string;
  webhookSecret?: string;
  callbackUrl?: string;
  splitPaymentCode?: string;
  subaccountCode?: string;
  isLive: boolean;
  isDefault: boolean;
  chargeCardEnabled: boolean;
  transferEnabled: boolean;
  subscriptionEnabled: boolean;
}

interface FlutterwaveSettings {
  publicKey: string;
  secretKey: string;
  encryptionKey?: string;
  webhookSecret?: string;
  callbackUrl?: string;
  isLive: boolean;
  isDefault: boolean;
  chargeCardEnabled: boolean;
  transferEnabled: boolean;
}

export default function PaymentSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    defaultTaxRate: 5.0,
    defaultCommissionRate: 10.0,
  });
  
  const [paystackSettings, setPaystackSettings] = useState<PaystackSettings>({
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    callbackUrl: '',
    splitPaymentCode: '',
    subaccountCode: '',
    isLive: false,
    isDefault: true,
    chargeCardEnabled: true,
    transferEnabled: false,
    subscriptionEnabled: false,
  });
  
  const [flutterwaveSettings, setFlutterwaveSettings] = useState<FlutterwaveSettings>({
    publicKey: '',
    secretKey: '',
    encryptionKey: '',
    webhookSecret: '',
    callbackUrl: '',
    isLive: false,
    isDefault: false,
    chargeCardEnabled: true,
    transferEnabled: false,
  });

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch general payment settings
        const generalResponse = await fetch('/api/admin/settings/payment/general');
        if (generalResponse.ok) {
          const generalData = await generalResponse.json();
          setGeneralSettings(generalData);
        } else {
          throw new Error('Failed to fetch general payment settings');
        }

        // Fetch Paystack settings
        const paystackResponse = await fetch('/api/admin/settings/paystack');
        if (paystackResponse.ok) {
          const paystackData = await paystackResponse.json();
          if (paystackData) {
            // Don't include the secretKey in the form data, as it's not returned for security
            setPaystackSettings({
              ...paystackData,
              secretKey: '',
            });
          }
        }

        // Fetch Flutterwave settings
        const flutterwaveResponse = await fetch('/api/admin/settings/flutterwave');
        if (flutterwaveResponse.ok) {
          const flutterwaveData = await flutterwaveResponse.json();
          if (flutterwaveData) {
            // Don't include the secretKey and encryptionKey in the form data, as they're not returned for security
            setFlutterwaveSettings({
              ...flutterwaveData,
              secretKey: '',
              encryptionKey: '',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
        setError('Failed to load payment settings. Please try again.');
        toast.error('Failed to load payment settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleGeneralInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setGeneralSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handlePaystackInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setPaystackSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFlutterwaveInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFlutterwaveSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSwitchChange = (settingsType: 'paystack' | 'flutterwave', name: string, checked: boolean) => {
    if (settingsType === 'paystack') {
      setPaystackSettings(prev => ({
        ...prev,
        [name]: checked,
      }));

      // If setting this as default, unset the other
      if (name === 'isDefault' && checked) {
        setFlutterwaveSettings(prev => ({
          ...prev,
          isDefault: false,
        }));
      }
    } else {
      setFlutterwaveSettings(prev => ({
        ...prev,
        [name]: checked,
      }));

      // If setting this as default, unset the other
      if (name === 'isDefault' && checked) {
        setPaystackSettings(prev => ({
          ...prev,
          isDefault: false,
        }));
      }
    }
  };

  const saveGeneralSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/payment/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generalSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save general payment settings');
      }

      toast.success('General payment settings saved successfully');
    } catch (error) {
      console.error('Error saving general payment settings:', error);
      setError('Failed to save general payment settings. Please try again.');
      toast.error('Failed to save general payment settings');
    } finally {
      setIsLoading(false);
    }
  };

  const savePaystackSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/paystack', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paystackSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save Paystack settings');
      }

      toast.success('Paystack settings saved successfully');
    } catch (error) {
      console.error('Error saving Paystack settings:', error);
      setError('Failed to save Paystack settings. Please try again.');
      toast.error('Failed to save Paystack settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveFlutterwaveSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/flutterwave', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flutterwaveSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save Flutterwave settings');
      }

      toast.success('Flutterwave settings saved successfully');
    } catch (error) {
      console.error('Error saving Flutterwave settings:', error);
      setError('Failed to save Flutterwave settings. Please try again.');
      toast.error('Failed to save Flutterwave settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeneralSettings();
  };

  const handlePaystackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePaystackSettings();
  };

  const handleFlutterwaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveFlutterwaveSettings();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-slate-800 dark:text-white">Payment Gateway Settings</h2>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {isLoading && Object.keys(generalSettings).length <= 2 ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="paystack">Paystack</TabsTrigger>
            <TabsTrigger value="flutterwave">Flutterwave</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Form onSubmit={handleGeneralSubmit}>
              <FormSection title="General Payment Settings">
                <div className="mb-4 text-sm text-gray-500">
                  Configure the default tax and commission rates for all transactions.
                </div>
                
                <FormGroup cols={2}>
                  <FormField 
                    label="Default Tax Rate (%)" 
                    required
                  >
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      name="defaultTaxRate"
                      value={generalSettings.defaultTaxRate}
                      onChange={handleGeneralInputChange}
                      placeholder="5.0"
                      required
                    />
                  </FormField>

                  <FormField 
                    label="Default Commission Rate (%)" 
                    required
                  >
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      name="defaultCommissionRate"
                      value={generalSettings.defaultCommissionRate}
                      onChange={handleGeneralInputChange}
                      placeholder="10.0"
                      required
                    />
                  </FormField>
                </FormGroup>
              </FormSection>

              <FormActions className="mt-6">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save General Settings'}
                </Button>
              </FormActions>
            </Form>
          </TabsContent>
          
          <TabsContent value="paystack">
            <div className="flex items-center bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>API keys are sensitive information. Never share them publicly or commit them to version control.</p>
            </div>
            
            <Form onSubmit={handlePaystackSubmit}>
              <FormSection title="Paystack Configuration">
                <div className="mb-4 text-sm text-gray-500">
                  Configure Paystack payment gateway for processing payments.
                </div>
                
                <FormGroup cols={2}>
                  <FormField 
                    label="Public Key" 
                    required
                  >
                    <Input
                      name="publicKey"
                      value={paystackSettings.publicKey}
                      onChange={handlePaystackInputChange}
                      placeholder="pk_test_..."
                      required
                    />
                  </FormField>

                  <FormField 
                    label="Secret Key" 
                    required
                    helperText="Leave empty to keep existing secret key"
                  >
                    <Input
                      type="password"
                      name="secretKey"
                      value={paystackSettings.secretKey}
                      onChange={handlePaystackInputChange}
                      placeholder="sk_test_..."
                    />
                  </FormField>
                </FormGroup>

                <FormGroup cols={2}>
                  <FormField 
                    label="Webhook Secret" 
                    helperText="For verifying webhook signatures"
                  >
                    <Input
                      name="webhookSecret"
                      value={paystackSettings.webhookSecret || ''}
                      onChange={handlePaystackInputChange}
                      placeholder="whsec_..."
                    />
                  </FormField>

                  <FormField 
                    label="Callback URL" 
                    helperText="URL to redirect after payment"
                  >
                    <Input
                      name="callbackUrl"
                      value={paystackSettings.callbackUrl || ''}
                      onChange={handlePaystackInputChange}
                      placeholder="https://yourdomain.com/paystack/callback"
                    />
                  </FormField>
                </FormGroup>

                <FormGroup cols={2}>
                  <FormField 
                    label="Split Payment Code" 
                    helperText="For marketplace setup (optional)"
                  >
                    <Input
                      name="splitPaymentCode"
                      value={paystackSettings.splitPaymentCode || ''}
                      onChange={handlePaystackInputChange}
                      placeholder="SPL_..."
                    />
                  </FormField>

                  <FormField 
                    label="Subaccount Code" 
                    helperText="For subaccount payments (optional)"
                  >
                    <Input
                      name="subaccountCode"
                      value={paystackSettings.subaccountCode || ''}
                      onChange={handlePaystackInputChange}
                      placeholder="ACCT_..."
                    />
                  </FormField>
                </FormGroup>

                <FormSection title="Paystack Options" className="mt-6">
                  <FormField>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Default Payment Gateway</div>
                        <div className="text-sm text-gray-500">
                          Make Paystack the default payment gateway
                        </div>
                      </div>
                      <Switch
                        name="isDefault"
                        checked={paystackSettings.isDefault}
                        onCheckedChange={(checked) => handleSwitchChange('paystack', 'isDefault', checked)}
                      />
                    </div>
                  </FormField>

                  <FormField>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Live Mode</div>
                        <div className="text-sm text-gray-500">
                          Switch between test and live environments
                        </div>
                      </div>
                      <Switch
                        name="isLive"
                        checked={paystackSettings.isLive}
                        onCheckedChange={(checked) => handleSwitchChange('paystack', 'isLive', checked)}
                      />
                    </div>
                  </FormField>

                  <FormField>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enable Card Payments</div>
                        <div className="text-sm text-gray-500">
                          Allow customers to pay with credit/debit cards
                        </div>
                      </div>
                      <Switch
                        name="chargeCardEnabled"
                        checked={paystackSettings.chargeCardEnabled}
                        onCheckedChange={(checked) => handleSwitchChange('paystack', 'chargeCardEnabled', checked)}
                      />
                    </div>
                  </FormField>

                  <FormField>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enable Transfers</div>
                        <div className="text-sm text-gray-500">
                          Allow automated transfers to vendors
                        </div>
                      </div>
                      <Switch
                        name="transferEnabled"
                        checked={paystackSettings.transferEnabled}
                        onCheckedChange={(checked) => handleSwitchChange('paystack', 'transferEnabled', checked)}
                      />
                    </div>
                  </FormField>

                  <FormField>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enable Subscriptions</div>
                        <div className="text-sm text-gray-500">
                          Allow recurring subscription payments
                        </div>
                      </div>
                      <Switch
                        name="subscriptionEnabled"
                        checked={paystackSettings.subscriptionEnabled}
                        onCheckedChange={(checked) => handleSwitchChange('paystack', 'subscriptionEnabled', checked)}
                      />
                    </div>
                  </FormField>
                </FormSection>
              </FormSection>

              <FormActions className="mt-6">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Paystack Settings'}
                </Button>
              </FormActions>
            </Form>
          </TabsContent>
          
          <TabsContent value="flutterwave">
            <div className="flex items-center bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>API keys are sensitive information. Never share them publicly or commit them to version control.</p>
            </div>
            
            <Form onSubmit={handleFlutterwaveSubmit}>
              <FormSection title="Flutterwave Configuration">
                <div className="mb-4 text-sm text-gray-500">
                  Configure Flutterwave payment gateway for processing payments.
                </div>
                
                <FormGroup cols={2}>
                  <FormField 
                    label="Public Key" 
                    required
                  >
                    <Input
                      name="publicKey"
                      value={flutterwaveSettings.publicKey}
                      onChange={handleFlutterwaveInputChange}
                      placeholder="FLWPUBK_TEST-..."
                      required
                    />
                  </FormField>

                  <FormField 
                    label="Secret Key" 
                    required
                    helperText="Leave empty to keep existing secret key"
                  >
                    <Input
                      type="password"
                      name="secretKey"
                      value={flutterwaveSettings.secretKey}
                      onChange={handleFlutterwaveInputChange}
                      placeholder="FLWSECK_TEST-..."
                    />
                  </FormField>
                </FormGroup>

                <FormGroup cols={2}>
                  <FormField 
                    label="Encryption Key" 
                    helperText="Leave empty to keep existing encryption key"
                  >
                    <Input
                      type="password"
                      name="encryptionKey"
                      value={flutterwaveSettings.encryptionKey || ''}
                      onChange={handleFlutterwaveInputChange}
                      placeholder="FLWSECK_..."
                    />
                  </FormField>

                  <FormField 
                    label="Webhook Secret" 
                    helperText="For verifying webhook signatures"
                  >
                    <Input
                      name="webhookSecret"
                      value={flutterwaveSettings.webhookSecret || ''}
                      onChange={handleFlutterwaveInputChange}
                      placeholder="whsec_..."
                    />
                  </FormField>
                </FormGroup>

                <FormField 
                  label="Callback URL" 
                  helperText="URL to redirect after payment"
                >
                  <Input
                    name="callbackUrl"
                    value={flutterwaveSettings.callbackUrl || ''}
                    onChange={handleFlutterwaveInputChange}
                    placeholder="https://yourdomain.com/flutterwave/callback"
                  />
                </FormField>

                <FormSection title="Flutterwave Options" className="mt-6">
                  <FormField>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Default Payment Gateway</div>
                        <div className="text-sm text-gray-500">
                          Make Flutterwave the default payment gateway
                        </div>
                      </div>
                      <Switch
                        name="isDefault"
                        checked={flutterwaveSettings.isDefault}
                        onCheckedChange={(checked) => handleSwitchChange('flutterwave', 'isDefault', checked)}
                      />
                    </div>
                  </FormField>

                  <FormField>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Live Mode</div>
                        <div className="text-sm text-gray-500">
                          Switch between test and live environments
                        </div>
                      </div>
                      <Switch
                        name="isLive"
                        checked={flutterwaveSettings.isLive}
                        onCheckedChange={(checked) => handleSwitchChange('flutterwave', 'isLive', checked)}
                      />
                    </div>
                  </FormField>

                  <FormField>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enable Card Payments</div>
                        <div className="text-sm text-gray-500">
                          Allow customers to pay with credit/debit cards
                        </div>
                      </div>
                      <Switch
                        name="chargeCardEnabled"
                        checked={flutterwaveSettings.chargeCardEnabled}
                        onCheckedChange={(checked) => handleSwitchChange('flutterwave', 'chargeCardEnabled', checked)}
                      />
                    </div>
                  </FormField>

                  <FormField>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enable Transfers</div>
                        <div className="text-sm text-gray-500">
                          Allow automated transfers to vendors
                        </div>
                      </div>
                      <Switch
                        name="transferEnabled"
                        checked={flutterwaveSettings.transferEnabled}
                        onCheckedChange={(checked) => handleSwitchChange('flutterwave', 'transferEnabled', checked)}
                      />
                    </div>
                  </FormField>
                </FormSection>
              </FormSection>

              <FormActions className="mt-6">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Flutterwave Settings'}
                </Button>
              </FormActions>
            </Form>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}