'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CameraList from './CameraList';
import CameraForm from './CameraForm';
import { Camera } from '@prisma/client';
import { useToast } from '@/components/ui/toast';

interface CctvDashboardClientProps {
  userId: string;
  hotels: {
    id: string;
    name: string;
  }[];
}

export default function CctvDashboardClient({ userId, hotels }: CctvDashboardClientProps) {
  const [selectedHotelId, setSelectedHotelId] = useState<string>(hotels[0]?.id || '');
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('manage');
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (selectedHotelId) {
      fetchCameras();
    }
  }, [selectedHotelId]);

  const fetchCameras = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cctv/cameras?hotelId=${selectedHotelId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cameras');
      }
      
      const data = await response.json();
      setCameras(data.data || []);
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to load cameras',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId);
  };

  const handleAddCamera = () => {
    setSelectedCamera(null);
    setActiveTab('add');
  };

  const handleEditCamera = (camera: Camera) => {
    setSelectedCamera(camera);
    setActiveTab('add');
  };

  const handleCameraCreated = () => {
    fetchCameras();
    setActiveTab('manage');
    addToast({
      title: 'Success',
      description: 'Camera added successfully',
      type: 'success',
    });
  };

  const handleCameraUpdated = () => {
    fetchCameras();
    setActiveTab('manage');
    setSelectedCamera(null);
    addToast({
      title: 'Success',
      description: 'Camera updated successfully',
      type: 'success',
    });
  };

  const handleCameraDeleted = async (cameraId: string) => {
    try {
      const response = await fetch(`/api/cctv/cameras/${cameraId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete camera');
      }

      fetchCameras();
      addToast({
        title: 'Success',
        description: 'Camera deleted successfully',
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to delete camera',
        type: 'error',
      });
    }
  };

  if (hotels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Hotels Found</CardTitle>
          <CardDescription>
            You need to create a hotel before you can manage CCTV cameras.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-1/3">
          <label htmlFor="hotel-select" className="block text-sm font-medium mb-1">
            Select Hotel
          </label>
          <select
            id="hotel-select"
            className="w-full px-3 py-2 border rounded-md"
            value={selectedHotelId}
            onChange={(e) => handleHotelChange(e.target.value)}
          >
            {hotels.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </div>
        
        {activeTab === 'manage' && (
          <button
            onClick={handleAddCamera}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition"
          >
            Add New Camera
          </button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="manage">Manage Cameras</TabsTrigger>
          <TabsTrigger value="add">
            {selectedCamera ? 'Edit Camera' : 'Add Camera'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <CameraList 
            cameras={cameras} 
            isLoading={isLoading} 
            onEdit={handleEditCamera} 
            onDelete={handleCameraDeleted}
            onRefresh={fetchCameras}
          />
        </TabsContent>

        <TabsContent value="add">
          <CameraForm 
            hotelId={selectedHotelId}
            camera={selectedCamera}
            onCreated={handleCameraCreated}
            onUpdated={handleCameraUpdated}
            onCancel={() => setActiveTab('manage')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}