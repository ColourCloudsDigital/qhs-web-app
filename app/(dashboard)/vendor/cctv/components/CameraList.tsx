'use client';

import { useState } from 'react';
import { Camera } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { AlertCircle, Edit, Eye, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CameraListProps {
  cameras: Camera[];
  isLoading: boolean;
  onEdit: (camera: Camera) => void;
  onDelete: (cameraId: string) => void;
  onRefresh: () => void;
}

export default function CameraList({ cameras, isLoading, onEdit, onDelete, onRefresh }: CameraListProps) {
  const { addToast } = useToast();
  const [testingCameraId, setTestingCameraId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null);

  const handleTestConnection = async (cameraId: string) => {
    setTestingCameraId(cameraId);
    try {
      const response = await fetch(`/api/cctv/streams/${cameraId}`);
      
      if (!response.ok) {
        throw new Error('Failed to connect to camera');
      }
      
      const data = await response.json();
      
      addToast({
        title: 'Success',
        description: 'Successfully connected to camera',
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Error',
        description: 'Failed to connect to camera',
        type: 'error',
      });
    } finally {
      setTestingCameraId(null);
    }
  };

  const confirmDelete = (camera: Camera) => {
    setCameraToDelete(camera);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (cameraToDelete) {
      onDelete(cameraToDelete.id);
      setDeleteDialogOpen(false);
      setCameraToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cameras.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No Cameras Found</h3>
            <p className="text-gray-500 mt-2">
              You haven&apos;t added any cameras yet. Click the &quot;Add New Camera&quot; button to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cameras ({cameras.length})</h2>
        <button 
          onClick={onRefresh}
          className="flex items-center text-sm text-gray-600 hover:text-primary"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cameras.map((camera) => (
          <Card key={camera.id} className={camera.isActive ? '' : 'opacity-70'}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg truncate" title={camera.name}>
                  {camera.name}
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onEdit(camera)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Edit Camera"
                  >
                    <Edit className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => confirmDelete(camera)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Delete Camera"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="flex items-center mt-1">
                <span 
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    camera.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                ></span>
                <span className="text-xs text-gray-500">
                  {camera.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-gray-500">IP Address</div>
                  <div className="col-span-2 font-medium">{camera.ipAddress}:{camera.port}</div>
                </div>
                {camera.location && (
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-gray-500">Location</div>
                    <div className="col-span-2">{camera.location}</div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-gray-500">Last Connected</div>
                  <div className="col-span-2">
                    {camera.lastConnected ? formatDate(camera.lastConnected) : 'Never'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-gray-500">Type</div>
                  <div className="col-span-2">{camera.type}</div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-gray-500">PTZ Controls</div>
                  <div className="col-span-2">{camera.ptzEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
                
                <div className="flex space-x-2 pt-3">
                  <Link
                    href={`/dashboard/vendor/cctv/view?cameraId=${camera.id}`}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-primary text-white rounded hover:bg-primary-dark transition"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Stream
                  </Link>
                  <button
                    onClick={() => handleTestConnection(camera.id)}
                    disabled={testingCameraId === camera.id}
                    className="flex items-center justify-center px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    {testingCameraId === camera.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-1"></div>
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Test
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete camera &quot;{cameraToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="warning" onClick={handleDeleteConfirmed}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}