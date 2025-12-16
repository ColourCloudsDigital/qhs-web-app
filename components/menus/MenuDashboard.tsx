'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import MenuCategoriesList from './MenuCategoriesList';
import MenuSettingsForm from './MenuSettingsForm';
import MenuQRCodeView from './MenuQRCodeView';
import MenuStatistics from './MenuStatistics';

// Menu dashboard component
export default function MenuDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<string>('categories');
  const { toast } = useToast();

  // Fetch menu data
  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching menu data from /api/vendor/menus');
      const res = await fetch('/api/vendor/menus');
      
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.message || errorData.error || `Failed with status: ${res.status}`;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      console.log('Menu data received:', data);
      setMenuData(data);
    } catch (error: any) {
      console.error('Error in fetchMenuData:', error);
      setError(error.message || 'Failed to load menu data');
      toast({
        title: 'Error loading menu data',
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleDataUpdate = (newData: any) => {
    setMenuData(newData);
  };

  const handleRetry = () => {
    fetchMenuData();
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading menu data...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col h-[50vh] w-full items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Failed to load menu data</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={handleRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="flex flex-col h-[50vh] w-full items-center justify-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">No menu data available</h2>
        <p className="text-muted-foreground mb-6">Please try again or contact support if the issue persists</p>
        <Button onClick={handleRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage your hotel menu with QR code access
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="categories">Menu Categories & Items</TabsTrigger>
          <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Categories & Items</CardTitle>
              <CardDescription>
                Organize your food and drinks into categories for easier navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuData && (
                <MenuCategoriesList
                  categories={menuData.categories}
                  hotelId={menuData.hotelId}
                  onDataUpdate={handleDataUpdate}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qrcode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Generator</CardTitle>
              <CardDescription>
                Generate a QR code that customers can scan to view your menu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuData && (
                <MenuQRCodeView hotelId={menuData.hotelId} settings={menuData.settings} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Settings</CardTitle>
              <CardDescription>
                Customize the appearance and behavior of your menu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuData && (
                <MenuSettingsForm
                  hotelId={menuData.hotelId}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Menu Access Statistics</CardTitle>
              <CardDescription>
                Track how often your menu QR code is scanned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuData && <MenuStatistics hotelId={menuData.hotelId} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 