'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Calendar, 
  Clock, 
  Copy, 
  RefreshCw, 
  Trash2, 
  User, 
  Wifi, 
  Home, 
  DoorClosed,
  ToggleLeft,
  ToggleRight,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from '@/lib/services/toast.service';

interface Credential {
  id: string;
  username: string;
  password: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string | null;
  booking?: {
    id: string;
    checkInDate: string;
    checkOutDate: string;
    customer: {
      user: {
        name: string;
        email?: string;
      };
    };
  };
  room?: {
    id: string;
    name: string;
    type: string;
  };
}

interface CredentialDetailModalProps {
  credential: Credential;
  open: boolean;
  onClose: () => void;
  onCredentialDeleted?: () => void;
  onCredentialToggled?: () => void;
  onPasswordRegenerated?: (newPassword: string) => void;
}

export default function CredentialDetailModal({
  credential,
  open,
  onClose,
  onCredentialDeleted,
  onCredentialToggled,
  onPasswordRegenerated,
}: CredentialDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Copy to clipboard
  const copyToClipboard = (text: string, what: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${what} copied to clipboard`);
      },
      (err) => {
        toast.error('Failed to copy: ' + err);
      }
    );
  };

  // Toggle credential status
  const toggleCredentialStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/wifi/credentials/${credential.id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle credential status');
      }

      toast.success(`Credential ${credential.isActive ? 'deactivated' : 'activated'}`);
      
      if (onCredentialToggled) {
        onCredentialToggled();
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update credential');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate password
  const regeneratePassword = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/wifi/credentials/${credential.id}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate password');
      }

      const updatedCredential = await response.json();
      
      toast.success('Password regenerated successfully');
      
      if (onPasswordRegenerated) {
        onPasswordRegenerated(updatedCredential.password);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate password');
    } finally {
      setLoading(false);
    }
  };

  // Delete credential
  const deleteCredential = async () => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/wifi/credentials/${credential.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete credential');
      }

      toast.success('Credential deleted successfully');
      
      if (onCredentialDeleted) {
        onCredentialDeleted();
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete credential');
    } finally {
      setLoading(false);
    }
  };

  // Generate a QR code
  const generateQRCodeDataUrl = () => {
    // This is just a placeholder. In a real application, you'd generate a proper QR code
    // with a library like qrcode.react or qrcode.
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `WIFI:S:Network;T:WPA;P:${credential.password};H:false;;`
    )}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            WiFi Credential Details
          </DialogTitle>
          <DialogDescription>
            Manage this WiFi credential and view related information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Credential status */}
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <span className={`font-medium ${credential.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {credential.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCredentialStatus}
              disabled={loading}
              className="h-8"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : credential.isActive ? (
                <ToggleRight className="mr-2 h-4 w-4" />
              ) : (
                <ToggleLeft className="mr-2 h-4 w-4" />
              )}
              {credential.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>

          {/* Credential info */}
          <div className="space-y-3 rounded-lg border p-4">
            {/* Username */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Username:</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {credential.username}
                </code>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(credential.username, 'Username')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy username</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Password:</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  {showPassword ? credential.password : '••••••••••'}
                </code>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(credential.password, 'Password')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy password</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={regeneratePassword}
                          disabled={loading}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Regenerate password</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Valid period */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Valid period:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded bg-muted px-3 py-2">
                  <span className="text-xs text-gray-500">From</span>
                  <div>{formatDate(credential.validFrom)}</div>
                </div>
                <div className="rounded bg-muted px-3 py-2">
                  <span className="text-xs text-gray-500">To</span>
                  <div>{formatDate(credential.validTo)}</div>
                </div>
              </div>
            </div>

            {/* Associated booking or room */}
            {credential.booking && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Guest information:</span>
                </div>
                <div className="rounded bg-muted px-3 py-2">
                  <div className="mb-1 text-sm font-medium">{credential.booking.customer.user.name}</div>
                  {credential.booking.customer.user.email && (
                    <div className="text-xs text-gray-500">{credential.booking.customer.user.email}</div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Stay: {formatDate(credential.booking.checkInDate)} to {formatDate(credential.booking.checkOutDate)}
                  </div>
                </div>
              </div>
            )}

            {credential.room && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DoorClosed className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Room:</span>
                </div>
                <div className="rounded bg-muted px-3 py-2">
                  <div className="text-sm">
                    <span className="font-medium">{credential.room.name}</span> ({credential.room.type})
                  </div>
                </div>
              </div>
            )}

            {/* Created date */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Created: {formatDate(credential.createdAt)}</span>
            </div>

            {/* Last used date if available */}
            {credential.lastUsed && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Last used: {formatDate(credential.lastUsed)}</span>
              </div>
            )}
          </div>

          {/* QR code for easy connection */}
          <div className="flex flex-col items-center space-y-3 rounded-lg border p-4 text-center">
            <h4 className="text-sm font-medium">Quick Connect QR Code</h4>
            <div className="overflow-hidden rounded-lg bg-white p-2">
              <img 
                src={generateQRCodeDataUrl()} 
                alt="WiFi QR Code" 
                className="h-40 w-40"
              />
            </div>
            <p className="text-xs text-gray-500">
              Scan this QR code to connect to WiFi without typing credentials
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:justify-between">
          <Button
            variant="danger"
            onClick={deleteCredential}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}