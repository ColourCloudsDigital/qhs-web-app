'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/services/toast.service';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Lock {
  id: string;
  serialNumber: string;
  lockModel: string;
  room: {
    id: string;
    name: string;
  } | null;
}

interface Keycard {
  id: string;
  cardNumber: string;
  cardType: string;
  isConfigured: boolean;
  lock: Lock | null;
}

interface KeycardConfigureFormProps {
  keycard: Keycard;
  hotelId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function KeycardConfigureForm({
  keycard,
  hotelId,
  onSuccess,
  onCancel
}: KeycardConfigureFormProps) {
  const [lockId, setLockId] = useState('');
  const [locks, setLocks] = useState<Lock[]>([]);
  const [loadingLocks, setLoadingLocks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocks();
  }, [hotelId]);

  const fetchLocks = async () => {
    setLoadingLocks(true);
    try {
      const response = await fetch(`/api/locks?hotelId=${hotelId}&isActive=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch locks');
      }
      
      const data = await response.json();
      setLocks(data.locks || []);
    } catch (error) {
      console.error('Error fetching locks:', error);
      toast.error('Failed to load locks. Please try again.');
    } finally {
      setLoadingLocks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lockId) {
      setError('Please select a lock');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/keycards/${keycard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'configure',
          lockId: lockId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to configure keycard');
      }
      
      toast.success('Keycard has been configured successfully.');
      
      onSuccess();
    } catch (error: any) {
      console.error('Error configuring keycard:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Keycard:</span>
            <span>{keycard.cardNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Type:</span>
            <span>{keycard.cardType.charAt(0).toUpperCase() + keycard.cardType.slice(1).toLowerCase()}</span>
          </div>
          {keycard.isConfigured && keycard.lock && (
            <div className="flex items-center space-x-2">
              <span className="font-medium">Currently configured for:</span>
              <span>
                {keycard.lock.serialNumber} 
                {keycard.lock.room ? ` (Room: ${keycard.lock.room.name})` : ''}
              </span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lockId" className="text-right">
            Configure for Lock
          </Label>
          <Select
            value={lockId}
            onValueChange={setLockId}
            disabled={loadingLocks}
          >
            <SelectTrigger id="lockId" className="col-span-3">
              <SelectValue placeholder="Select a lock" />
            </SelectTrigger>
            <SelectContent>
              {locks.map((lock) => (
                <SelectItem key={lock.id} value={lock.id}>
                  {lock.serialNumber}
                  {lock.room ? ` (Room: ${lock.room.name})` : ' (No Room)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {error && (
          <div className="flex items-center rounded-md bg-destructive/15 px-4 py-2 text-sm text-destructive">
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
        <Button type="submit" disabled={loading || loadingLocks || !lockId}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Configure Keycard
        </Button>
      </div>
    </form>
  );
}