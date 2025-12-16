'use client';

import { useState, useEffect } from 'react';
import { Camera } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { AlertCircle, Info } from 'lucide-react';

interface CameraFormProps {
  hotelId: string;
  camera?: Camera | null;
  onCreated: () => void;
  onUpdated: () => void;
  onCancel: () => void;
}

export default function CameraForm({
  hotelId,
  camera,
  onCreated,
  onUpdated,
  onCancel,
}: CameraFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('554');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cameraType, setCameraType] = useState('IP');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [ptzEnabled, setPtzEnabled] = useState(false);
  const [onvifCompliant, setOnvifCompliant] = useState(false);
  const [rtspUrl, setRtspUrl] = useState('');
  const [httpUrl, setHttpUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);

  useEffect(() => {
    if (camera) {
      setName(camera.name);
      setDescription(camera.description || '');
      setIpAddress(camera.ipAddress);
      setPort(camera.port.toString());
      setUsername(camera.username || '');
      setPassword(''); // Don't populate password for security
      setCameraType(camera.type);
      setBrand(camera.brand || '');
      setModel(camera.model || '');
      setLocation(camera.location || '');
      setIsActive(camera.isActive);
      setPtzEnabled(camera.ptzEnabled);
      setOnvifCompliant(camera.onvifCompliant);
      setRtspUrl(camera.rtspUrl || '');
      setHttpUrl(camera.httpUrl || '');
      setStreamUrl(camera.streamUrl || '');
      
      // If any advanced fields are populated, show advanced mode
      if (
        camera.rtspUrl || 
        camera.httpUrl || 
        camera.streamUrl || 
        camera.onvifCompliant || 
        camera.ptzEnabled
      ) {
        setAdvancedMode(true);
      }
    }
  }, [camera]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!ipAddress.trim()) {
      newErrors.ipAddress = 'IP Address is required';
    } else if (!/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress)) {
      newErrors.ipAddress = 'Invalid IP Address format';
    }
    
    if (!port.trim()) {
      newErrors.port = 'Port is required';
    } else if (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535) {
      newErrors.port = 'Port must be a number between 1 and 65535';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    const cameraData = {
      hotelId,
      name,
      description: description || undefined,
      ipAddress,
      port: Number(port),
      username: username || undefined,
      password: password || undefined,
      type: cameraType,
      brand: brand || undefined,
      model: model || undefined,
      location: location || undefined,
      isActive,
      ptzEnabled,
      onvifCompliant,
      rtspUrl: rtspUrl || undefined,
      httpUrl: httpUrl || undefined,
      streamUrl: streamUrl || undefined,
    };
    
    try {
      let response;
      
      if (camera) {
        // Update existing camera
        response = await fetch(`/api/cctv/cameras/${camera.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cameraData),
        });
      } else {
        // Create new camera
        response = await fetch('/api/cctv/cameras', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cameraData),
        });
      }
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save camera');
      }
      
      if (camera) {
        onUpdated();
      } else {
        onCreated();
      }
    } catch (error: any) {
      addToast({
        title: 'Error',
        description: error.message,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{camera ? 'Edit Camera' : 'Add New Camera'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Camera Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Main Entrance Camera"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Camera covering the main entrance area"
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Main Entrance"
                />
              </div>
              
              <div>
                <label htmlFor="cameraType" className="block text-sm font-medium mb-1">
                  Camera Type
                </label>
                <select
                  id="cameraType"
                  value={cameraType}
                  onChange={(e) => setCameraType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="IP">IP Camera</option>
                  <option value="RTSP">RTSP Camera</option>
                  <option value="ONVIF">ONVIF Camera</option>
                  <option value="HTTP">HTTP Stream</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Camera Active</span>
                </label>
              </div>
            </div>
            
            {/* Connection Settings */}
            <div className="space-y-4">
              <div>
                <label htmlFor="ipAddress" className="block text-sm font-medium mb-1">
                  IP Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="ipAddress"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.ipAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="192.168.1.100"
                />
                {errors.ipAddress && (
                  <p className="mt-1 text-sm text-red-500">{errors.ipAddress}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="port" className="block text-sm font-medium mb-1">
                  Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="port"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.port ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="554"
                />
                {errors.port && (
                  <p className="mt-1 text-sm text-red-500">{errors.port}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="admin"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder={camera ? '••••••••' : 'Enter password'}
                />
                {camera && (
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to keep current password
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="brand" className="block text-sm font-medium mb-1">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Hikvision, Dahua, etc."
                />
              </div>
              
              <div>
                <label htmlFor="model" className="block text-sm font-medium mb-1">
                  Model (Optional)
                </label>
                <input
                  type="text"
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="DS-2CD2385G1-I, etc."
                />
              </div>
            </div>
          </div>
          
          {/* Advanced Settings Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setAdvancedMode(!advancedMode)}
              className="text-sm text-primary flex items-center"
            >
              <Info className="h-4 w-4 mr-1" />
              {advancedMode ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
            </button>
          </div>
          
          {/* Advanced Settings */}
          {advancedMode && (
            <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="rtspUrl" className="block text-sm font-medium mb-1">
                    RTSP URL (Optional)
                  </label>
                  <input
                    type="text"
                    id="rtspUrl"
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="rtsp://username:password@192.168.1.100:554/stream"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Override default RTSP URL construction
                  </p>
                </div>
                
                <div>
                  <label htmlFor="httpUrl" className="block text-sm font-medium mb-1">
                    HTTP URL (Optional)
                  </label>
                  <input
                    type="text"
                    id="httpUrl"
                    value={httpUrl}
                    onChange={(e) => setHttpUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="http://192.168.1.100/video/mjpg.cgi"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Direct HTTP stream URL if available
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="streamUrl" className="block text-sm font-medium mb-1">
                    Custom Stream URL (Optional)
                  </label>
                  <input
                    type="text"
                    id="streamUrl"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://stream.example.com/camera1"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Custom stream URL that bypasses our system
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={onvifCompliant}
                      onChange={(e) => setOnvifCompliant(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">ONVIF Compliant</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={ptzEnabled}
                      onChange={(e) => setPtzEnabled(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Enable PTZ Controls</span>
                  </label>
                  
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> PTZ controls and ONVIF features require a compatible camera and may need additional configuration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : camera ? (
                'Update Camera'
              ) : (
                'Add Camera'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}