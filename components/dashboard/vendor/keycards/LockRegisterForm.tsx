'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  type: string;
}

interface LockRegisterFormProps {
  hotelId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LockRegisterForm({
  hotelId,
  onSuccess,
  onCancel
}: LockRegisterFormProps) {
  const { toast } = useToast();
  const [serialNumber, setSerialNumber] = useState('');
  const [lockModel, setLockModel] = useState('');
  const [firmwareVersion, setFirmwareVersion] = useState('');
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [hotelId]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await fetch(`/api/rooms?hotelId=${hotelId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rooms. Please try again.',
      });
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serialNumber) {
      setError('Serial number is required');
      return;
    }
    
    if (!lockModel) {
      setError('Lock model is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/locks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId,
          serialNumber,
          lockModel,
          firmwareVersion: firmwareVersion || undefined,
          roomId: roomId || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register lock');
      }
      
      toast({
        title: 'Success',
        description: 'Lock has been registered successfully.',
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error registering lock:', error);
      setError(error.message);
      toast({
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="serialNumber" className="text-right">
            Serial Number
          </Label>
          <Input
            id="serialNumber"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            className="col-span-3"
            placeholder="Enter lock serial number"
            required
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lockModel" className="text-right">
            Lock Model
          </Label>
          <Input
            id="lockModel"
            value={lockModel}
            onChange={(e) => setLockModel(e.target.value)}
            className="col-span-3"
            placeholder="Enter lock model"
            required
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="firmwareVersion" className="text-right">
            Firmware Version
          </Label>
          <Input
            id="firmwareVersion"
            value={firmwareVersion}
            onChange={(e) => setFirmwareVersion(e.target.value)}
            className="col-span-3"
            placeholder="Enter firmware version (optional)"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="roomId" className="text-right">
            Assign to Room
          </Label>
          <Select
            value={roomId}
            onValueChange={setRoomId}
            disabled={loadingRooms}
          >
            <SelectTrigger id="roomId" className="col-span-3">
              <SelectValue placeholder="Select a room (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not assigned to a room</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} ({room.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {error && (
          <div className="col-span-4 flex items-center rounded-md bg-destructive/15 px-4 py-2 text-sm text-destructive">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register Lock
        </Button>
      </div>
    </form>
  );
}