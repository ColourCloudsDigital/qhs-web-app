'use client';

import React, { useState, useEffect } from 'react';
import { Form, FormSection, FormField, FormGroup, FormActions } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SimpleSelect, { SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import toast from '@/lib/toast';
import { AdminSecuritySettings } from '@/lib/types/settings';

// Default settings
const defaultSettings: AdminSecuritySettings = {
  passwordStrength: 'medium',
  passwordExpiryDays: 0,
  maxLoginAttempts: 5,
  twoFactorRequiredFor: ['SUPER_ADMIN'],
  sessionTimeoutMinutes: 60,
  rememberMeDays: 30,
  apiRateLimit: 100,
  apiSecurityMode: 'standard',
  corsEnabled: true,
  corsAllowedDomains: []
};

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState<AdminSecuritySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current security settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching security settings...");
        const response = await fetch('/api/admin/settings/security');
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error response:", errorData);
          throw new Error(`Failed to fetch security settings: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Received settings:", data);
        
        setSettings(data);
      } catch (error: any) {
        console.error('Error fetching security settings:', error);
        setError('Failed to load security settings: ' + (error.message || 'Unknown error'));
        toast.error('Failed to load security settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handler for form submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      console.log("Saving security settings:", settings);
      
      const response = await fetch('/api/admin/settings/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      console.log("Save response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(errorData.error || 'Failed to update security settings');
      }
      
      const result = await response.json();
      console.log("Save result:", result);
      
      toast.success('Security settings updated successfully');
    } catch (error: any) {
      console.error('Error saving security settings:', error);
      setError('Failed to save security settings: ' + (error.message || 'Unknown error'));
      toast.error('Failed to save security settings');
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Security Settings</h1>
        <p className="text-muted-foreground text-slate-800 dark:text-white">
          Configure security settings for your application.
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form onSubmit={handleSave}>
        <div className="grid gap-6">
          {/* Authentication Settings */}
          <FormSection title="Authentication" description="Configure authentication settings">
            <FormGroup cols={2}>
              <FormField
                label="Password Requirements"
                helperText="Set minimum password requirements for all users"
              >
                <SimpleSelect
                  value={settings.passwordStrength}
                  onValueChange={(value) => 
                    setSettings({...settings, passwordStrength: value as 'basic' | 'medium' | 'strong'})
                  }
                >
                  <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                  <SelectItem value="medium">Medium (8+ chars, letters & numbers)</SelectItem>
                  <SelectItem value="strong">Strong (8+ chars, uppercase, lowercase, number, symbol)</SelectItem>
                </SimpleSelect>
              </FormField>
              
              <FormField
                label="Password Expiry"
                helperText="Days before users need to reset their password (0 = never)"
              >
                <Input
                  type="number"
                  min="0"
                  max="365"
                  value={settings.passwordExpiryDays}
                  onChange={(e) => 
                    setSettings({...settings, passwordExpiryDays: parseInt(e.target.value) || 0})
                  }
                />
              </FormField>
            </FormGroup>

            <FormGroup>
              <FormField
                label="Maximum Login Attempts"
                helperText="Number of failed login attempts before temporary lockout"
              >
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => 
                    setSettings({...settings, maxLoginAttempts: parseInt(e.target.value) || 5})
                  }
                />
              </FormField>
            </FormGroup>

            <FormGroup>
              <FormField
                label="Enable Two-Factor Authentication"
                helperText="Require two-factor authentication for the specified user roles"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.twoFactorRequiredFor.includes('SUPER_ADMIN')}
                      onCheckedChange={(checked) => {
                        const roles = checked 
                          ? [...settings.twoFactorRequiredFor, 'SUPER_ADMIN']
                          : settings.twoFactorRequiredFor.filter(r => r !== 'SUPER_ADMIN');
                        setSettings({...settings, twoFactorRequiredFor: roles});
                      }}
                    />
                    <span>Super Admins</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.twoFactorRequiredFor.includes('VENDOR')}
                      onCheckedChange={(checked) => {
                        const roles = checked 
                          ? [...settings.twoFactorRequiredFor, 'VENDOR']
                          : settings.twoFactorRequiredFor.filter(r => r !== 'VENDOR');
                        setSettings({...settings, twoFactorRequiredFor: roles});
                      }}
                    />
                    <span>Vendors</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.twoFactorRequiredFor.includes('STAFF')}
                      onCheckedChange={(checked) => {
                        const roles = checked 
                          ? [...settings.twoFactorRequiredFor, 'STAFF']
                          : settings.twoFactorRequiredFor.filter(r => r !== 'STAFF');
                        setSettings({...settings, twoFactorRequiredFor: roles});
                      }}
                    />
                    <span>Staff</span>
                  </div>
                </div>
              </FormField>
            </FormGroup>
          </FormSection>

          {/* Session Settings */}
          <FormSection title="Sessions" description="Configure user session settings">
            <FormGroup cols={2}>
              <FormField
                label="Session Timeout"
                helperText="Minutes of inactivity before automatic logout (0 = never)"
              >
                <Input
                  type="number"
                  min="0"
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) => 
                    setSettings({...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 0})
                  }
                />
              </FormField>
              
              <FormField
                label="Remember Me Duration"
                helperText="Days to remember a user's login (0 = session only)"
              >
                <Input
                  type="number"
                  min="0"
                  max="90"
                  value={settings.rememberMeDays}
                  onChange={(e) => 
                    setSettings({...settings, rememberMeDays: parseInt(e.target.value) || 0})
                  }
                />
              </FormField>
            </FormGroup>
          </FormSection>

          {/* API Security */}
          <FormSection title="API Security" description="Configure API security settings">
            <FormGroup>
              <FormField
                label="API Rate Limiting"
                helperText="Maximum requests per minute per IP address (0 = unlimited)"
              >
                <Input
                  type="number"
                  min="0"
                  value={settings.apiRateLimit}
                  onChange={(e) => 
                    setSettings({...settings, apiRateLimit: parseInt(e.target.value) || 0})
                  }
                />
              </FormField>
            </FormGroup>
            
            <FormGroup>
              <FormField
                label="API Security Mode"
              >
                <SimpleSelect
                  value={settings.apiSecurityMode}
                  onValueChange={(value) => 
                    setSettings({...settings, apiSecurityMode: value as 'standard' | 'enhanced' | 'strict'})
                  }
                >
                  <SelectItem value="standard">Standard (JWT authentication)</SelectItem>
                  <SelectItem value="enhanced">Enhanced (JWT + API key)</SelectItem>
                  <SelectItem value="strict">Strict (JWT + API key + IP restrictions)</SelectItem>
                </SimpleSelect>
              </FormField>
            </FormGroup>

            <FormGroup>
              <FormField
                label="Enable CORS"
                helperText="Configure Cross-Origin Resource Sharing settings"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.corsEnabled}
                      onCheckedChange={(checked) => 
                        setSettings({...settings, corsEnabled: checked})
                      }
                    />
                    <span>Enable CORS</span>
                  </div>
                  {settings.corsEnabled && (
                    <Input
                      placeholder="Enter allowed domains (comma separated)"
                      value={settings.corsAllowedDomains.join(',')}
                      onChange={(e) => 
                        setSettings({
                          ...settings, 
                          corsAllowedDomains: e.target.value ? e.target.value.split(',').map(d => d.trim()) : []
                        })
                      }
                    />
                  )}
                </div>
              </FormField>
            </FormGroup>
          </FormSection>

          <FormActions>
            <Button variant="secondary" type="button">Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Changes'}
            </Button>
          </FormActions>
        </div>
      </Form>
    </div>
  );
}