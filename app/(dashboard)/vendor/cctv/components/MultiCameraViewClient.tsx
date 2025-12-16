'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import CameraStream from './CameraStream';
import { ChevronLeft, RefreshCw, Grid2X2, Grid3X3, Maximize2, Minimize2 } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MultiCameraViewClientProps {
  userId: string;
  hotels: {
    id: string;
    name: string;
  }[];
  initialHotelId?: string;
  initialCameraIds?: string[];
}

type LayoutType = '2x2' | '3x3' | '4x4';

export default function MultiCameraViewClient({
  userId,
  hotels,
  initialHotelId,
  initialCameraIds = [],
}: MultiCameraViewClientProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const [selectedHotelId, setSelectedHotelId] = useState<string>(initialHotelId || '');
  const [availableCameras, setAvailableCameras] = useState<Camera[]>([]);
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>(initialCameraIds);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamUrls, setStreamUrls] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [layout, setLayout] = useState<LayoutType>('2x2');
  const [streamKeys, setStreamKeys] = useState<Record<string, number>>({});
  const [showCameraSelector, setShowCameraSelector] = useState<boolean>(false);

  useEffect(() => {
    if (selectedHotelId) {
      fetchCameras();
    }
  }, [selectedHotelId]);

  useEffect(() => {
    // Initialize stream keys for all cameras
    const keys: Record<string, number> = {};
    selectedCameraIds.forEach(id => {
      keys[id] = Date.now();
    });
    setStreamKeys(keys);
    
    // Fetch stream URLs for all selected cameras
    if (selectedCameraIds.length > 0) {
      fetchStreamUrls();
    }
  }, [selectedCameraIds]);

  const fetchCameras = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cctv/cameras?hotelId=${selectedHotelId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cameras');
      }
      
      const data = await response.json();
      setAvailableCameras(data.data || []);
      
      // If we have cameras but no selected cameras, select the first 4 active ones
      if (data.data.length > 0 && selectedCameraIds.length === 0) {
        const activeCameras = data.data.filter((camera: Camera) => camera.isActive);
        const cameraIdsToSelect = activeCameras.slice(0, 4).map((camera: Camera) => camera.id);
        setSelectedCameraIds(cameraIdsToSelect);
      }
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

  const fetchStreamUrls = async () => {
    const urls: Record<string, string> = {};
    
    await Promise.all(
      selectedCameraIds.map(async (cameraId) => {
        try {
          const response = await fetch(`/api/cctv/streams/${cameraId}`);
          
          if (response.ok) {
            const data = await response.json();
            urls[cameraId] = data.streamUrl || '';
          }
        } catch (error) {
          console.error(`Failed to fetch stream for camera ${cameraId}:`, error);
        }
      })
    );
    
    setStreamUrls(urls);
  };

  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setSelectedCameraIds([]);
    setStreamUrls({});
    
    // Update URL without full navigation
    router.push(`/dashboard/vendor/cctv/multi?hotelId=${hotelId}`);
  };

  const handleRefreshStreams = () => {
    fetchStreamUrls();
    
    // Update stream keys to force refresh
    const newKeys: Record<string, number> = {};
    selectedCameraIds.forEach(id => {
      newKeys[id] = Date.now();
    });
    setStreamKeys(newKeys);
  };

  const toggleCameraSelection = (cameraId: string) => {
    if (selectedCameraIds.includes(cameraId)) {
      setSelectedCameraIds(selectedCameraIds.filter(id => id !== cameraId));
    } else {
      // Limit selection based on layout
      const maxCameras = layout === '2x2' ? 4 : layout === '3x3' ? 9 : 16;
      if (selectedCameraIds.length >= maxCameras) {
        addToast({
          title: 'Maximum Cameras Reached',
          description: `You can only select up to ${maxCameras} cameras in ${layout} layout.`,
          type: 'warning',
        });
        return;
      }
      setSelectedCameraIds([...selectedCameraIds, cameraId]);
    }
  };

  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayout(newLayout);
    
    // If the new layout supports fewer cameras than currently selected, trim the selection
    const maxCameras = newLayout === '2x2' ? 4 : newLayout === '3x3' ? 9 : 16;
    if (selectedCameraIds.length > maxCameras) {
      setSelectedCameraIds(selectedCameraIds.slice(0, maxCameras));
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const saveSelectedCameras = () => {
    setShowCameraSelector(false);
    
    // Update URL with selected camera IDs
    router.push(`/dashboard/vendor/cctv/multi?hotelId=${selectedHotelId}&cameras=${selectedCameraIds.join(',')}`);
    
    // Refresh stream URLs
    fetchStreamUrls();
  };

  const getLayoutClass = () => {
    switch (layout) {
      case '2x2':
        return 'grid-cols-1 sm:grid-cols-2';
      case '3x3':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case '4x4':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2';
    }
  };

  if (hotels.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p>No hotels found. Please create a hotel first.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-black p-4' : ''}`}>
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center">
            <Link
              href="/dashboard/vendor/cctv"
              className="mr-4 p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="w-64">
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
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCameraSelector(true)}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition"
            >
              Select Cameras
            </button>
            
            <div className="border-l h-6 border-gray-300 mx-1"></div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleLayoutChange('2x2')}
                className={`p-2 rounded-md ${
                  layout === '2x2' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                title="2x2 Grid"
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => handleLayoutChange('3x3')}
                className={`p-2 rounded-md ${
                  layout === '3x3' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                title="3x3 Grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="border-l h-6 border-gray-300 mx-1"></div>
            
            <button
              onClick={handleRefreshStreams}
              className="p-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition"
              title="Refresh All Streams"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {selectedCameraIds.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <p className="mb-4">No cameras selected. Select cameras to view streams.</p>
              <button
                onClick={() => setShowCameraSelector(true)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition"
              >
                Select Cameras
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid ${getLayoutClass()} gap-2`}>
          {selectedCameraIds.map((cameraId) => {
            const camera = availableCameras.find(c => c.id === cameraId);
            return (
              <div key={cameraId} className="relative bg-black rounded-md overflow-hidden">
                <div className="aspect-video">
                  {streamUrls[cameraId] ? (
                    <CameraStream 
                      url={streamUrls[cameraId]} 
                      cameraId={cameraId}
                      name={camera?.name || 'Camera'}
                      key={streamKeys[cameraId]}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white px-2 py-1 text-sm truncate">
                  {camera?.name || 'Camera'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFullscreen && (
        <div className="absolute top-4 right-4 space-x-2 flex">
          <button
            onClick={handleRefreshStreams}
            className="p-2 bg-black bg-opacity-50 text-white rounded-md hover:bg-opacity-70 transition"
            title="Refresh All Streams"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black bg-opacity-50 text-white rounded-md hover:bg-opacity-70 transition"
            title="Exit Fullscreen"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <Dialog open={showCameraSelector} onOpenChange={setShowCameraSelector}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Cameras to View</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto my-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : availableCameras.length === 0 ? (
              <div className="text-center py-8">
                <p>No cameras found for this hotel</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {availableCameras.map((camera) => (
                  <div
                    key={camera.id}
                    className={`border rounded-md p-4 cursor-pointer transition ${
                      selectedCameraIds.includes(camera.id)
                        ? 'border-primary bg-primary bg-opacity-10'
                        : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => toggleCameraSelection(camera.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCameraIds.includes(camera.id)}
                        onChange={() => toggleCameraSelection(camera.id)}
                        className="h-4 w-4 text-primary"
                      />
                      <div>
                        <h3 className="font-medium">{camera.name}</h3>
                        {camera.location && (
                          <p className="text-sm text-gray-500">{camera.location}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>IP: {camera.ipAddress}</span>
                        <span className={camera.isActive ? 'text-green-500' : 'text-gray-400'}>
                          {camera.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                {selectedCameraIds.length} of {availableCameras.length} cameras selected
              </div>
              <div className="space-x-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={saveSelectedCameras}>Apply</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}