'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/services/toast.service';
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
import { AlertCircle, Loader2 } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  type: string;
}

interface Lock {
  id: string;
  serialNumber: string;
  lockModel: string;
  roomId: string | null;
  room: {
    id: string;
    name: string;
  } | null;
  batteryLevel: number | null;
  lastMaintenance: string | null;
  firmwareVersion: string | null;
  isActive: boolean;
}

interface LockUpdateFormProps {
  lock: Lock;
  hotelId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LockUpdateForm({
  lock,
  hotelId,
  onSuccess,
  onCancel
}: LockUpdateFormProps) {
  const [lockModel, setLockModel] = useState(lock.lockModel);
  const [firmwareVersion, setFirmwareVersion] = useState(lock.firmwareVersion || '');
  const [batteryLevel, setBatteryLevel] = useState(lock.batteryLevel?.toString() || '');
  const [roomId, setRoomId] = useState(lock.roomId || '');
  const [lastMaintenance, setLastMaintenance] = useState(
    lock.lastMaintenance ? new Date(lock.lastMaintenance).toISOString().split('T')[0] : ''
  );
  const [isActive, setIsActive] = useState(lock.isActive);
  
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
      toast.error('Failed to load rooms. Please try again.');
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lockModel) {
      setError('Lock model is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/locks/${lock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lockModel,
          firmwareVersion: firmwareVersion || undefined,
          batteryLevel: batteryLevel ? parseInt(batteryLevel) : undefined,
          roomId: roomId || undefined,
          lastMaintenance: lastMaintenance || undefined,
          isActive
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lock');
      }
      
      toast.success('Lock has been updated successfully.');
      
      onSuccess();
    } catch (error: any) {
      console.error('Error updating lock:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
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
          <Label htmlFor="batteryLevel" className="text-right">
            Battery Level (%)
          </Label>
          <Input
            id="batteryLevel"
            type="number"
            min="0"
            max="100"
            value={batteryLevel}
            onChange={(e) => setBatteryLevel(e.target.value)}
            className="col-span-3"
            placeholder="Enter battery level (optional)"
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
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lastMaintenance" className="text-right">
            Last Maintenance
          </Label>
          <Input
            id="lastMaintenance"
            type="date"
            value={lastMaintenance}
            onChange={(e) => setLastMaintenance(e.target.value)}
            className="col-span-3"
            placeholder="Enter last maintenance date (optional)"
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="isActive" className="text-right">
            Status
          </Label>
          <Select
            value={isActive ? "true" : "false"}
            onValueChange={(value) => setIsActive(value === "true")}
          >
            <SelectTrigger id="isActive" className="col-span-3">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
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
          Update Lock
        </Button>
      </div>
    </form>
  );
}