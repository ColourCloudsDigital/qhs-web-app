'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/services/toast.service';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Battery,
  Wrench,
  Calendar, 
  DoorClosed, 
  Key, 
  AlertCircle, 
  CheckCircle, 
  Clock 
} from 'lucide-react';

interface Lock {
  id: string;
  serialNumber: string;
  lockModel: string;
  room: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  batteryLevel: number | null;
  lastMaintenance: string | null;
  firmwareVersion: string | null;
  installDate: string;
  _count: {
    keycards: number;
    lockHistory: number;
    lockErrors: number;
  };
}

interface LockDetailViewProps {
  lock: Lock;
  hotelId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function LockDetailView({
  lock,
  hotelId,
  onClose,
  onRefresh
}: LockDetailViewProps) {
  const [loading, setLoading] = useState(false);
  const [keycards, setKeycards] = useState<any[]>([]);
  const [loadingKeycards, setLoadingKeycards] = useState(false);

  useEffect(() => {
    fetchKeycards();
  }, [lock.id]);

  const fetchKeycards = async () => {
    setLoadingKeycards(true);
    try {
      const response = await fetch(`/api/keycards?lockId=${lock.id}&limit=5`);
      if (!response.ok) {
        throw new Error('Failed to fetch keycards');
      }
      
      const data = await response.json();
      setKeycards(data.keycards || []);
    } catch (error) {
      console.error('Error fetching keycards:', error);
      toast.error('Failed to load keycards');
    } finally {
      setLoadingKeycards(false);
    }
  };

  // Helper function to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Helper function for battery level display
  const renderBatteryLevel = (level: number | null) => {
    if (level === null) return 'Unknown';
    
    let color = 'text-green-500';
    if (level < 20) color = 'text-red-500';
    else if (level < 50) color = 'text-yellow-500';
    
    return (
      <div className="flex items-center">
        <Battery className={`mr-2 h-5 w-5 ${color}`} />
        <span>{level}%</span>
      </div>
    );
  };
  
  const handleDeactivate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/locks/${lock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to deactivate lock');
      }
      
      toast.success('Lock deactivated successfully.');
      onRefresh();
      onClose();
    } catch (error: any) {
      console.error('Error deactivating lock:', error);
      toast.error(error.message || 'Failed to deactivate lock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Lock Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serial Number:</span>
              <span className="font-medium">{lock.serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span>{lock.lockModel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={lock.isActive ? 'success' : 'destructive'}>
                {lock.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Firmware:</span>
              <span>{lock.firmwareVersion || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Installed:</span>
              <span>{formatDate(lock.installDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room Assignment:</span>
              <span>{lock.room ? lock.room.name : 'Not assigned'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Status Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Status Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 text-sm text-muted-foreground">Battery Level</div>
              <div className="flex items-center">
                {renderBatteryLevel(lock.batteryLevel)}
              </div>
            </div>
            
            <div>
              <div className="mb-1 text-sm text-muted-foreground">Last Maintenance</div>
              <div className="flex items-center">
                <Wrench className="mr-2 h-5 w-5 text-muted-foreground" />
                <span>{lock.lastMaintenance ? formatDate(lock.lastMaintenance) : 'No maintenance recorded'}</span>
              </div>
            </div>
            
            <div>
              <div className="mb-1 text-sm text-muted-foreground">Assigned Keycards</div>
              <div className="flex items-center">
                <Key className="mr-2 h-5 w-5 text-muted-foreground" />
                <span>{lock._count.keycards} keycard{lock._count.keycards !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div>
              <div className="mb-1 text-sm text-muted-foreground">Recent Issues</div>
              {lock._count.lockErrors > 0 ? (
                <div className="flex items-center text-red-500">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  <span>{lock._count.lockErrors} issue{lock._count.lockErrors !== 1 ? 's' : ''} reported</span>
                </div>
              ) : (
                <div className="flex items-center text-green-500">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  <span>No issues reported</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Room Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Room Information</CardTitle>
          </CardHeader>
          <CardContent>
            {lock.room ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <DoorClosed className="mr-2 h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{lock.room.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This lock is installed on room {lock.room.name}. You can update the room assignment from the lock update form.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <DoorClosed className="h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  This lock is not assigned to any room.
                </p>
                <p className="text-sm text-center text-muted-foreground">
                  You can assign this lock to a room from the lock update form.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Associated Keycards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Associated Keycards</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingKeycards ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Loading keycards...
              </div>
            ) : keycards.length > 0 ? (
              <ul className="space-y-2">
                {keycards.map(keycard => (
                  <li key={keycard.id} className="flex items-center justify-between py-1 border-b last:border-0">
                    <div className="flex items-center">
                      <Key className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{keycard.cardNumber}</span>
                    </div>
                    <Badge variant={keycard.isActive ? 'success' : 'destructive'}>
                      {keycard.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </li>
                ))}
                {lock._count.keycards > keycards.length && (
                  <li className="text-sm text-center text-muted-foreground pt-2">
                    ...and {lock._count.keycards - keycards.length} more
                  </li>
                )}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <Key className="h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  No keycards are configured for this lock.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-2">
        {lock.isActive && (
          <Button 
            variant="danger" 
            onClick={handleDeactivate}
            disabled={loading}
          >
            Deactivate Lock
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}