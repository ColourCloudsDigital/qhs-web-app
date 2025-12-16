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
import { Check, X, Key, Lock, User, Calendar, Clock, AlertCircle } from 'lucide-react';

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
  isActive: boolean;
  isConfigured: boolean;
  accessLevel: number;
  assignedToId: string | null;
  assignedTo: {
    id: string;
    customer: {
      user: {
        name: string;
        email: string;
      };
    };
  } | null;
  staffId: string | null;
  staff: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    position: string;
  } | null;
  lock: Lock | null;
  validFrom: string | null;
  validTo: string | null;
  lastUsed: string | null;
  issueCount: number;
  createdAt: string;
  updatedAt: string;
}

interface KeycardDetailViewProps {
  keycard: Keycard;
  hotelId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function KeycardDetailView({
  keycard,
  hotelId,
  onClose,
  onRefresh
}: KeycardDetailViewProps) {
  const [loading, setLoading] = useState(false);

  // Helper function to format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Helper function to get access level description
  const getAccessLevelDescription = (level: number) => {
    switch (level) {
      case 1: return 'Basic Access (Guest)';
      case 2: return 'Floor Access';
      case 3: return 'Area Access';
      case 4: return 'Building Access';
      case 5: return 'Full Access (Master)';
      default: return 'Unknown';
    }
  };
  
  const handleDeactivate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/keycards/${keycard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deactivate',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to deactivate keycard');
      }
      
      toast.success('Keycard deactivated successfully.');
      onRefresh();
      onClose();
    } catch (error: any) {
      console.error('Error deactivating keycard:', error);
      toast.error(error.message || 'Failed to deactivate keycard');
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
            <CardTitle className="text-lg">Keycard Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Card Number:</span>
              <span className="font-medium">{keycard.cardNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <Badge variant="outline">
                {keycard.cardType.charAt(0).toUpperCase() + keycard.cardType.slice(1).toLowerCase()}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={keycard.isActive ? 'success' : 'destructive'}>
                {keycard.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Configured:</span>
              <span>{keycard.isConfigured ? 
                <Check className="h-5 w-5 text-green-500" /> : 
                <X className="h-5 w-5 text-red-500" />}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Access Level:</span>
              <span>{getAccessLevelDescription(keycard.accessLevel)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{formatDate(keycard.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated:</span>
              <span>{formatDate(keycard.updatedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issue Count:</span>
              <span>{keycard.issueCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Lock Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Lock Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {keycard.lock ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lock ID:</span>
                  <span className="font-medium">{keycard.lock.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lock Model:</span>
                  <span>{keycard.lock.lockModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room:</span>
                  <span>
                    {keycard.lock.room ? 
                      keycard.lock.room.name : 
                      <span className="text-muted-foreground italic">No room assigned</span>
                    }
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  This keycard is not configured for any lock.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Assignment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {keycard.assignedTo || keycard.staff ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned To:</span>
                  <span className="font-medium">
                    {keycard.assignedTo ? 
                      keycard.assignedTo.customer.user.name : 
                      keycard.staff?.user.name
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge>
                    {keycard.assignedTo ? 'Guest' : 'Staff'}
                  </Badge>
                </div>
                {keycard.staff && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <span>{keycard.staff.position}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid From:</span>
                  <span>{formatDate(keycard.validFrom)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid To:</span>
                  <span>{formatDate(keycard.validTo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Used:</span>
                  <span>{formatDate(keycard.lastUsed)}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <User className="h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  This keycard is not assigned to anyone.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Validity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Status & Validity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Status:</span>
              <div className="flex items-center">
                <div className={`mr-2 h-3 w-3 rounded-full ${keycard.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{keycard.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            
            {(keycard.validFrom || keycard.validTo) && (
              <>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center mb-2">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Validity Period</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-sm text-muted-foreground">From:</span>
                      <div>{formatDate(keycard.validFrom)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">To:</span>
                      <div>{formatDate(keycard.validTo)}</div>
                    </div>
                  </div>
                  
                  {keycard.validTo && new Date(keycard.validTo) < new Date() && (
                    <div className="mt-2 flex items-center text-amber-600">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      <span className="text-sm">This keycard has expired.</span>
                    </div>
                  )}
                </div>
                
                {keycard.lastUsed && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Last Used:</span>
                    </div>
                    <div className="mt-1">{formatDate(keycard.lastUsed)}</div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-2">
        {keycard.isActive && (
          <Button 
            variant="danger" 
            onClick={handleDeactivate}
            disabled={loading}
          >
            Deactivate Keycard
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