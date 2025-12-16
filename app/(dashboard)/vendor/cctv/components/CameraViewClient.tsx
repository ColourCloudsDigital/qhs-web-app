'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import CameraStream from './CameraStream';
import CameraControls from './CameraControls';
import { RefreshCw, ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';
import Link from 'next/link';

interface CameraViewClientProps {
  userId: string;
  hotels: {
    id: string;
    name: string;
  }[];
  initialHotelId?: string;
  initialCameraId?: string;
  initialCamera?: any; // Using any here because we don't want to rely on passing full camera data
}

export default function CameraViewClient({
  userId,
  hotels,
  initialHotelId,
  initialCameraId,
  initialCamera,
}: CameraViewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const [selectedHotelId, setSelectedHotelId] = useState<string>(initialHotelId || '');
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(initialCamera || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [streamKey, setStreamKey] = useState<number>(0); // Used to force stream refresh

  useEffect(() => {
    if (selectedHotelId) {
      fetchCameras();
    }
  }, [selectedHotelId]);

  useEffect(() => {
    if (initialCameraId && cameras.length > 0) {
      const camera = cameras.find(c => c.id === initialCameraId);
      if (camera) {
        setSelectedCamera(camera);
        fetchStreamUrl(camera.id);
      }
    }
  }, [initialCameraId, cameras]);

  const fetchCameras = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cctv/cameras?hotelId=${selectedHotelId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cameras');
      }
      
      const data = await response.json();
      setCameras(data.data || []);
      
      // If we have cameras but no selected camera, select the first one
      if (data.data.length > 0 && !selectedCamera) {
        setSelectedCamera(data.data[0]);
        fetchStreamUrl(data.data[0].id);
      } else if (data.data.length === 0) {
        setSelectedCamera(null);
        setStreamUrl('');
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

  const fetchStreamUrl = async (cameraId: string) => {
    try {
      const response = await fetch(`/api/cctv/streams/${cameraId}`);
      
      if (!response.ok) {
        throw new Error('Failed to connect to camera');
      }
      
      const data = await response.json();
      setStreamUrl(data.streamUrl || '');
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to connect to camera stream',
        type: 'error',
      });
      setStreamUrl('');
    }
  };

  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setSelectedCamera(null);
    setStreamUrl('');
    
    // Update URL without full navigation
    router.push(`/dashboard/vendor/cctv/view?hotelId=${hotelId}`);
  };

  const handleCameraChange = (camera: Camera) => {
    setSelectedCamera(camera);
    fetchStreamUrl(camera.id);
    
    // Update URL without full navigation
    router.push(`/dashboard/vendor/cctv/view?hotelId=${selectedHotelId}&cameraId=${camera.id}`);
  };

  const handleRefreshStream = () => {
    if (selectedCamera) {
      fetchStreamUrl(selectedCamera.id);
      setStreamKey(prev => prev + 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
        </div>
      )}

      <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4'} gap-4`}>
        {!isFullscreen && (
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-3">Cameras</h3>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : cameras.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No cameras found for this hotel</p>
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                    {cameras.map((camera) => (
                      <li key={camera.id}>
                        <button
                          onClick={() => handleCameraChange(camera)}
                          className={`w-full text-left px-3 py-2 rounded-md ${
                            selectedCamera?.id === camera.id
                              ? 'bg-primary text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center">
                            <span 
                              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                camera.isActive ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            ></span>
                            <span className="truncate">{camera.name}</span>
                          </div>
                          {camera.location && (
                            <div className={`text-xs mt-1 ${
                              selectedCamera?.id === camera.id
                                ? 'text-white opacity-80'
                                : 'text-gray-500'
                            }`}>
                              {camera.location}
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            
            {selectedCamera && selectedCamera.ptzEnabled && (
              <CameraControls 
                cameraId={selectedCamera.id}
                onError={(message) => {
                  addToast({
                    title: 'PTZ Control Error',
                    description: message,
                    type: 'error',
                  });
                }}
              />
            )}
          </div>
        )}

        <div className={isFullscreen ? 'col-span-1' : 'md:col-span-3'}>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                {selectedCamera ? (
                  <>
                    <div className="bg-black aspect-video relative">
                      <CameraStream 
                        url={streamUrl} 
                        cameraId={selectedCamera.id}
                        name={selectedCamera.name}
                        key={streamKey}
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        onClick={handleRefreshStream}
                        className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition"
                        title="Refresh Stream"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                      >
                        {isFullscreen ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="bg-gray-900 text-white p-3 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{selectedCamera.name}</h3>
                        {selectedCamera.location && (
                          <p className="text-sm text-gray-300">{selectedCamera.location}</p>
                        )}
                      </div>
                      {isFullscreen && selectedCamera.ptzEnabled && (
                        <CameraControls 
                          cameraId={selectedCamera.id}
                          isMinimal={true}
                          onError={(message) => {
                            addToast({
                              title: 'PTZ Control Error',
                              description: message,
                              type: 'error',
                            });
                          }}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-black aspect-video flex items-center justify-center text-white">
                    {cameras.length === 0 ? (
                      <div className="text-center p-8">
                        <p className="mb-2">No cameras found for this hotel</p>
                        <Link
                          href="/dashboard/vendor/cctv"
                          className="text-primary hover:underline"
                        >
                          Add a camera
                        </Link>
                      </div>
                    ) : (
                      <p>Select a camera to view the stream</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}