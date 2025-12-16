'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Wifi, RefreshCw, Trash2, Network } from 'lucide-react';
import HotelSelector from '@/components/dashboard/vendor/HotelSelector';
import CredentialsList from '@/components/dashboard/vendor/wifi/CredentialsList';
import NetworksList from '@/components/dashboard/vendor/wifi/NetworksList';
import GenerateCredentialsModal from '@/components/dashboard/vendor/wifi/GenerateCredentialsModal';
import BulkGenerateModal from '@/components/dashboard/vendor/wifi/BulkGenerateModal';
import NetworkModal from '@/components/dashboard/vendor/wifi/NetworkModal';
import toast from '@/lib/services/toast.service';

interface WifiDashboardProps {
  vendorId: string;
}

export default function WifiDashboard({ vendorId }: WifiDashboardProps) {
  const router = useRouter();
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
  const [createNetworkModalOpen, setCreateNetworkModalOpen] = useState(false);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('credentials');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | undefined>(undefined);

  // Handle hotel change
  const handleHotelChange = (hotelId: string) => {
    setSelectedHotel(hotelId);
  };

  // Add a function to handle network selection for filtering
  const handleNetworkFilter = (networkId: string | undefined) => {
    setSelectedNetworkId(networkId);
  };

  // Delete inactive credentials
  const deleteInactiveCredentials = async () => {
    if (!selectedHotel) return;

    if (!confirm('Are you sure you want to delete all inactive credentials?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/hotels/${selectedHotel}/wifi/cleanup?type=inactive`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete inactive credentials');
      }

      const result = await response.json();
      toast.success(`Successfully deleted ${result.count} inactive credentials`);
      
      // Refresh the list
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete inactive credentials');
    } finally {
      setLoading(false);
    }
  };

  // Delete expired credentials
  const deleteExpiredCredentials = async () => {
    if (!selectedHotel) return;

    if (!confirm('Are you sure you want to delete all expired credentials?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/hotels/${selectedHotel}/wifi/cleanup?type=expired`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete expired credentials');
      }

      const result = await response.json();
      toast.success(`Successfully deleted ${result.count} expired credentials`);
      
      // Refresh the list
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete expired credentials');
    } finally {
      setLoading(false);
    }
  };

  // Render action buttons based on active tab
  const renderActionButtons = () => {
    if (activeTab === 'credentials') {
      return (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Generate Credential</span>
            </Button>
            
            <Button 
              onClick={() => setBulkCreateModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Bulk Generate</span>
            </Button>
            
            <Link href={`/dashboard/vendor/wifi/configuration?hotelId=${selectedHotel}`}>
              <Button 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings size={16} />
                <span>WiFi Settings</span>
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={deleteExpiredCredentials}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Trash2 size={16} />
              <span>Delete Expired</span>
            </Button>
            
            <Button 
              onClick={deleteInactiveCredentials}
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Trash2 size={16} />
              <span>Delete Inactive</span>
            </Button>
          </div>
        </>
      );
    } else if (activeTab === 'networks') {
      return (
        <Button 
          onClick={() => setCreateNetworkModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Add WiFi Network</span>
        </Button>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Hotel selector */}
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <HotelSelector 
          vendorId={vendorId} 
          onHotelChange={handleHotelChange} 
        />
      </div>

      {selectedHotel ? (
        <>
          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {renderActionButtons()}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="credentials" onClick={() => setActiveTab('credentials')}>
                Credentials
              </TabsTrigger>
              <TabsTrigger value="networks" onClick={() => setActiveTab('networks')}>
                Networks
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="credentials" className="mt-4">
              <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="active" onClick={() => setIsActive(true)}>
                    Active Credentials
                  </TabsTrigger>
                  <TabsTrigger value="inactive" onClick={() => setIsActive(false)}>
                    Inactive Credentials
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="mt-4">
                  <CredentialsList 
                    hotelId={selectedHotel}
                    isActive={true}
                    networkId={selectedNetworkId}
                    key={`active-${refreshKey}`}
                    onCredentialChanged={() => setRefreshKey(prev => prev + 1)}
                  />
                </TabsContent>
                
                <TabsContent value="inactive" className="mt-4">
                  <CredentialsList 
                    hotelId={selectedHotel}
                    isActive={false}
                    networkId={selectedNetworkId}
                    key={`inactive-${refreshKey}`}
                    onCredentialChanged={() => setRefreshKey(prev => prev + 1)}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="networks" className="mt-4">
              <NetworksList 
                hotelId={selectedHotel}
                key={`networks-${refreshKey}`}
                onNetworkChanged={() => setRefreshKey(prev => prev + 1)}
                onNetworkSelected={handleNetworkFilter}
              />
            </TabsContent>
          </Tabs>
          
          {/* Generate credential modal */}
          <GenerateCredentialsModal
            hotelId={selectedHotel}
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={() => {
              setCreateModalOpen(false);
              setRefreshKey(prev => prev + 1);
            }}
          />
          
          {/* Bulk generate modal */}
          <BulkGenerateModal
            hotelId={selectedHotel}
            open={bulkCreateModalOpen}
            onClose={() => setBulkCreateModalOpen(false)}
            onSuccess={() => {
              setBulkCreateModalOpen(false);
              setRefreshKey(prev => prev + 1);
            }}
          />

          {/* Create network modal */}
          <NetworkModal
            hotelId={selectedHotel}
            open={createNetworkModalOpen}
            onClose={() => setCreateNetworkModalOpen(false)}
            onSuccess={() => {
              setCreateNetworkModalOpen(false);
              setRefreshKey(prev => prev + 1);
            }}
          />
        </>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <Wifi className="mb-4 h-10 w-10 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold">Select a Hotel</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please select a hotel to manage WiFi credentials
          </p>
        </div>
      )}
    </div>
  );
}