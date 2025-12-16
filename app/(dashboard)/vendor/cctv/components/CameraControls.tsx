'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  ZoomIn, ZoomOut, RotateCw, Home, Maximize, Minimize 
} from 'lucide-react';

interface CameraControlsProps {
  cameraId: string;
  isMinimal?: boolean;
  onError: (message: string) => void;
}

export default function CameraControls({ 
  cameraId, 
  isMinimal = false,
  onError 
}: CameraControlsProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Function to send PTZ command
  const sendPTZCommand = async (command: string, params?: Record<string, any>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cctv/cameras/${cameraId}/ptz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          ...params,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'PTZ command failed');
      }
    } catch (error: any) {
      onError(error.message || 'Failed to control camera');
    } finally {
      setIsLoading(false);
    }
  };

  // Controls for minimal mode (used in fullscreen)
  if (isMinimal) {
    return (
      <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded-md">
        <button
          onClick={() => sendPTZCommand('left')}
          className="p-1.5 rounded-full hover:bg-gray-700"
          disabled={isLoading}
        >
          <ChevronLeft className="h-4 w-4 text-white" />
        </button>
        <button
          onClick={() => sendPTZCommand('up')}
          className="p-1.5 rounded-full hover:bg-gray-700"
          disabled={isLoading}
        >
          <ChevronUp className="h-4 w-4 text-white" />
        </button>
        <button
          onClick={() => sendPTZCommand('down')}
          className="p-1.5 rounded-full hover:bg-gray-700"
          disabled={isLoading}
        >
          <ChevronDown className="h-4 w-4 text-white" />
        </button>
        <button
          onClick={() => sendPTZCommand('right')}
          className="p-1.5 rounded-full hover:bg-gray-700"
          disabled={isLoading}
        >
          <ChevronRight className="h-4 w-4 text-white" />
        </button>
        <div className="h-6 border-l border-gray-600 mx-1"></div>
        <button
          onClick={() => sendPTZCommand('zoomin')}
          className="p-1.5 rounded-full hover:bg-gray-700"
          disabled={isLoading}
        >
          <ZoomIn className="h-4 w-4 text-white" />
        </button>
        <button
          onClick={() => sendPTZCommand('zoomout')}
          className="p-1.5 rounded-full hover:bg-gray-700"
          disabled={isLoading}
        >
          <ZoomOut className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  // Full controls
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-3">PTZ Controls</h3>
        
        <div className="space-y-4">
          {/* Directional controls */}
          <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
            <div></div>
            <button
              onClick={() => sendPTZCommand('up')}
              className="p-3 rounded-md bg-gray-100 hover:bg-gray-200 flex justify-center"
              disabled={isLoading}
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <div></div>
            
            <button
              onClick={() => sendPTZCommand('left')}
              className="p-3 rounded-md bg-gray-100 hover:bg-gray-200 flex justify-center"
              disabled={isLoading}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => sendPTZCommand('home')}
              className="p-3 rounded-md bg-gray-100 hover:bg-gray-200 flex justify-center"
              disabled={isLoading}
            >
              <Home className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => sendPTZCommand('right')}
              className="p-3 rounded-md bg-gray-100 hover:bg-gray-200 flex justify-center"
              disabled={isLoading}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            
            <div></div>
            <button
              onClick={() => sendPTZCommand('down')}
              className="p-3 rounded-md bg-gray-100 hover:bg-gray-200 flex justify-center"
              disabled={isLoading}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
            <div></div>
          </div>
          
          {/* Zoom controls */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => sendPTZCommand('zoomout')}
              className="p-3 rounded-md bg-gray-100 hover:bg-gray-200 flex-1 flex justify-center"
              disabled={isLoading}
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => sendPTZCommand('zoomin')}
              className="p-3 rounded-md bg-gray-100 hover:bg-gray-200 flex-1 flex justify-center"
              disabled={isLoading}
            >
              <ZoomIn className="h-5 w-5" />
            </button>
          </div>
          
          {/* Presets */}
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2">Presets</h4>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((preset) => (
                <button
                  key={preset}
                  onClick={() => sendPTZCommand('preset', { preset })}
                  className="px-3 py-1.5 rounded-md bg-primary text-white text-sm hover:bg-primary-dark"
                  disabled={isLoading}
                >
                  {preset}
                </button>
              ))}
              <button
                onClick={() => sendPTZCommand('savePreset', { preset: 1 })}
                className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 text-sm hover:bg-gray-300"
                disabled={isLoading}
                title="Save current position as Preset 1"
              >
                Save
              </button>
            </div>
          </div>
          
          {isLoading && (
            <div className="text-center py-2">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-gray-500">Sending command...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}