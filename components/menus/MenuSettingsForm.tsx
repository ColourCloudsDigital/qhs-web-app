'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface MenuSettings {
  id?: string;
  hotelId: string;
  isActive: boolean;
  title: string;
  subtitle?: string;
  description?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  showPrices: boolean;
  showIngredients: boolean;
  showAllergens: boolean;
  showNutrition: boolean;
  created?: string;
  updated?: string;
}

interface MenuSettingsFormProps {
  hotelId: string;
}

export default function MenuSettingsForm({ hotelId }: MenuSettingsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [settings, setSettings] = useState<MenuSettings>({
    hotelId,
    isActive: true,
    title: '',
    showPrices: true,
    showIngredients: true,
    showAllergens: true,
    showNutrition: false,
  });

  useEffect(() => {
    fetchSettings();
  }, [hotelId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/menus/settings?hotelId=${hotelId}`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data || {
          hotelId,
          isActive: true,
          title: '',
          showPrices: true,
          showIngredients: true,
          showAllergens: true,
          showNutrition: false,
        });
      } else {
        // If no settings exist yet, keep the default values
        console.log('No existing settings found, using defaults');
      }
    } catch (error) {
      console.error('Error fetching menu settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/vendor/menus/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!res.ok) {
        throw new Error('Failed to save settings');
      }
      
      const data = await res.json();
      setSettings(data);
      
      toast({
        title: 'Settings saved',
        description: 'Your menu settings have been updated successfully',
      });
    } catch (error) {
      console.error('Error saving menu settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save menu settings',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="content">Content Display</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic settings for your menu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isActive" 
                  checked={settings.isActive}
                  onCheckedChange={(checked) => handleCheckboxChange('isActive', checked as boolean)}
                />
                <Label htmlFor="isActive">Menu is active and visible to customers</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Menu Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={settings.title}
                  onChange={handleChange}
                  placeholder="e.g. Our Delicious Menu"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                <Input
                  id="subtitle"
                  name="subtitle"
                  value={settings.subtitle || ''}
                  onChange={handleChange}
                  placeholder="e.g. Serving since 1995"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={settings.description || ''}
                  onChange={handleChange}
                  placeholder="Brief description of your restaurant or menu"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how your menu looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  value={settings.logoUrl || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backgroundImageUrl">Background Image URL (Optional)</Label>
                <Input
                  id="backgroundImageUrl"
                  name="backgroundImageUrl"
                  value={settings.backgroundImageUrl || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/background.jpg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      className="w-12 h-10"
                      value={settings.primaryColor || '#000000'}
                      onChange={handleChange}
                    />
                    <Input
                      value={settings.primaryColor || '#000000'}
                      onChange={handleChange}
                      name="primaryColor"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      className="w-12 h-10"
                      value={settings.secondaryColor || '#ffffff'}
                      onChange={handleChange}
                    />
                    <Input
                      value={settings.secondaryColor || '#ffffff'}
                      onChange={handleChange}
                      name="secondaryColor"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <select
                  id="fontFamily"
                  name="fontFamily"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={settings.fontFamily || ''}
                  onChange={handleChange as any}
                >
                  <option value="">Default</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Display Settings</CardTitle>
              <CardDescription>
                Control what information is shown on your menu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showPrices" 
                  checked={settings.showPrices}
                  onCheckedChange={(checked) => handleCheckboxChange('showPrices', checked as boolean)}
                />
                <Label htmlFor="showPrices">Show item prices</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showIngredients" 
                  checked={settings.showIngredients}
                  onCheckedChange={(checked) => handleCheckboxChange('showIngredients', checked as boolean)}
                />
                <Label htmlFor="showIngredients">Show ingredients</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showAllergens" 
                  checked={settings.showAllergens}
                  onCheckedChange={(checked) => handleCheckboxChange('showAllergens', checked as boolean)}
                />
                <Label htmlFor="showAllergens">Show allergen information</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showNutrition" 
                  checked={settings.showNutrition}
                  onCheckedChange={(checked) => handleCheckboxChange('showNutrition', checked as boolean)}
                />
                <Label htmlFor="showNutrition">Show nutritional information (calories, etc.)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
} 