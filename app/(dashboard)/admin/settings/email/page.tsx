'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/toast';
import { Form, FormSection, FormField, FormGroup, FormActions } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, InfoIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail?: string;
  fromName?: string;
}

export default function EmailSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState<SMTPConfig>({
    host: '',
    port: 587,
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
  });
  const [isConfigured, setIsConfigured] = useState(false);

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/admin/settings/smtp');
        
        if (!response.ok) {
          throw new Error('Failed to fetch SMTP settings');
        }
        
        const data = await response.json();
        
        // Check if we have existing configuration
        const hasExistingConfig = data.host && data.username;
        setIsConfigured(hasExistingConfig);
        
        // Set the form data with the fetched settings
        setFormData({
          host: data.host || '',
          port: data.port || 587,
          username: data.username || '',
          password: '', // Password is never returned from API
          fromEmail: data.fromEmail || '',
          fromName: data.fromName || '',
        });
      } catch (error: any) {
        console.error('Error fetching SMTP settings:', error);
        setError(error.message || 'Failed to load SMTP settings');
        toast.error('Failed to load SMTP settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate password for new configuration
    if (!isConfigured && !formData.password) {
      setError('Password is required for new SMTP configuration');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/settings/smtp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save SMTP settings');
      }

      toast.success('SMTP settings saved successfully');
      setIsConfigured(true);
      
      // Clear password field after successful save for security
      setFormData(prev => ({
        ...prev,
        password: '',
      }));
    } catch (error: any) {
      console.error('Error saving SMTP settings:', error);
      setError(error.message || 'Failed to save SMTP settings');
      toast.error('Failed to save SMTP settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setTestResult({
        success: false,
        message: 'Please enter a test email address',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/settings/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          testEmail,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Test email failed');
      }
      
      setTestResult(data);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Email Settings</h1>
        <p className="text-muted-foreground text-slate-800 dark:text-white">
          Configure SMTP settings for sending emails from the application
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && !formData.host ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          <FormSection title="SMTP Configuration">
            <div className="mb-4 text-sm text-gray-500 dark:text-white">
              Configure SMTP settings for sending emails from the application.
            </div>
            
            {isConfigured && (
              <Alert variant="info" className="mb-4">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  SMTP is already configured. If you don&apos;t want to change the password, leave the password field empty.
                </AlertDescription>
              </Alert>
            )}
            
            <FormGroup cols={2}>
              <FormField 
                label="SMTP Host" 
                required
              >
                <Input
                  name="host"
                  value={formData.host}
                  onChange={handleInputChange}
                  placeholder="e.g. smtp.gmail.com"
                  required
                />
              </FormField>

              <FormField 
                label="SMTP Port" 
                required
              >
                <Input
                  type="number"
                  name="port"
                  value={formData.port}
                  onChange={handleInputChange}
                  placeholder="e.g. 587 or 465"
                  required
                />
              </FormField>
            </FormGroup>

            <FormGroup cols={2}>
              <FormField 
                label="SMTP Username" 
                required
              >
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="e.g. user@example.com"
                  required
                />
              </FormField>

              <FormField 
                label="SMTP Password" 
                required={!isConfigured}
                helperText={isConfigured 
                  ? "Leave empty to keep the existing password. Enter a new value to update."
                  : "Password for SMTP authentication"}
              >
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isConfigured ? "Leave empty to keep existing password" : "Enter password"}
                />
              </FormField>
            </FormGroup>

            <FormGroup cols={2}>
              <FormField 
                label="From Email" 
                helperText="Email address that will appear as sender"
              >
                <Input
                  type="email"
                  name="fromEmail"
                  value={formData.fromEmail || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. noreply@qarashotels.com"
                />
              </FormField>

              <FormField 
                label="From Name" 
                helperText="Name that will appear as sender"
              >
                <Input
                  name="fromName"
                  value={formData.fromName || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Qaras Hotels"
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
              ) : 'Save Configuration'}
            </Button>
          </FormActions>
        </Form>
      )}

      <div className="mt-10 border-t pt-6">
        <FormSection title="Test Email Configuration">
          <div className="mb-4 text-sm text-gray-500">
            Send a test email to verify your SMTP configuration is working correctly.
          </div>
          
          {!isConfigured && !formData.password && (
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                To test the email, you need to either save a configuration first or provide a password.
              </AlertDescription>
            </Alert>
          )}
          
          <FormGroup cols={2}>
            <FormField 
              label="Test Email Address" 
              required
            >
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email to send test"
                required
              />
            </FormField>

            <div className="flex items-end">
              <Button 
                type="button"
                variant="outline"
                onClick={handleTestEmail}
                disabled={isTesting || (!isConfigured && !formData.password)}
                className="mb-2"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : 'Send Test Email'}
              </Button>
            </div>
          </FormGroup>

          {testResult && (
            <div className={`mt-4 p-4 rounded border ${
              testResult.success 
                ? 'bg-green-50 border-green-400 text-green-700' 
                : 'bg-red-50 border-red-400 text-red-700'
            }`}>
              <div className="flex items-start">
                {testResult.success 
                  ? <CheckCircle className="h-5 w-5 mr-2 mt-0.5" /> 
                  : <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
                }
                <p>{testResult.message}</p>
              </div>
            </div>
          )}
        </FormSection>
      </div>
    </div>
  );
}