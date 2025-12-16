'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KeycardManagement from '@/components/dashboard/vendor/keycards/KeycardManagement';
import LockManagement from '@/components/dashboard/vendor/keycards/LockManagement';
import KeycardStats from '@/components/dashboard/vendor/keycards/KeycardStats';
import { HotelSelector } from '@/components/dashboard/vendor/HotelSelector';

interface Hotel {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface KeycardStats {
  totalKeycards: number;
  activeKeycards: number;
  configuredKeycards: number;
  assignedKeycards: number;
}

interface KeycardDashboardClientProps {
  userRole: string;
  hotels: Hotel[];
  selectedHotelId?: string;
  keycardStats: KeycardStats | null;
  initialView: string;
  initialFilter?: string;
  initialPage: number;
}

export default function KeycardDashboardClient({
  userRole,
  hotels,
  selectedHotelId,
  keycardStats,
  initialView,
  initialFilter,
  initialPage
}: KeycardDashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState(initialView);
  const [vendorId, setVendorId] = useState<string>('');
  
  // Update the URL when filters change
  const updateUrlParams = (params: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams();
    
    if (selectedHotelId) {
      searchParams.set('hotelId', selectedHotelId);
    }
    
    if (params.view) {
      searchParams.set('view', params.view);
    }
    
    if (params.filter) {
      searchParams.set('filter', params.filter);
    }
    
    if (params.page && params.page !== '1') {
      searchParams.set('page', params.page);
    }
    
    const search = searchParams.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };
  
  // Handle tab change
  const handleViewChange = (view: string) => {
    setCurrentView(view);
    updateUrlParams({ view, page: '1' });
  };
  
  // Handle hotel change
  const handleHotelChange = (hotelId: string) => {
    updateUrlParams({ hotelId, view: currentView, page: '1' });
  };

  // Fetch vendor ID on component mount
  useEffect(() => {
    if (hotels.length > 0 && hotels[0] && selectedHotelId) {
      // In a real implementation, you would fetch the vendorId associated with these hotels
      // For now, we're using a placeholder value
      setVendorId('vendor-id');
    }
  }, [hotels, selectedHotelId]);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Keycard Management</h1>
            <p className="text-muted-foreground">
              Manage RFID keycards and locks for your hotel rooms and staff
            </p>
          </div>
          
          {vendorId && (
            <div className="w-[250px]">
              <HotelSelector 
                vendorId={vendorId}
                value={selectedHotelId}
                onHotelChange={handleHotelChange}
              />
            </div>
          )}
        </div>
        
        {keycardStats && selectedHotelId && (
          <KeycardStats stats={keycardStats} />
        )}
        
        <Tabs value={currentView} onValueChange={handleViewChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keycards">Keycards</TabsTrigger>
            <TabsTrigger value="locks">Locks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="keycards" className="mt-6">
            {selectedHotelId && (
              <KeycardManagement 
                hotelId={selectedHotelId}
                userRole={userRole}
                initialFilter={initialFilter}
                initialPage={initialPage}
                onFilterChange={(filter: string) => updateUrlParams({ filter, view: 'keycards' })}
                onPageChange={(page: number) => updateUrlParams({ page: page.toString(), view: 'keycards' })}
              />
            )}
          </TabsContent>
          
          <TabsContent value="locks" className="mt-6">
            {selectedHotelId && (
              <LockManagement 
                hotelId={selectedHotelId}
                userRole={userRole}
                initialFilter={initialFilter}
                initialPage={initialPage}
                onFilterChange={(filter: string) => updateUrlParams({ filter, view: 'locks' })}
                onPageChange={(page: number) => updateUrlParams({ page: page.toString(), view: 'locks' })}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}