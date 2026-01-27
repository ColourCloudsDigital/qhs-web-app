'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';

interface Role {
  id: string;
  name: string;
}

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
  setEmail: (email: string) => void;
  isSubmitting: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  selectedRole: string;
  setSelectedRole: (roleId: string) => void;
  hotelId: string;
}

export default function AddStaffModal({
  open,
  onClose,
  email,
  setEmail,
  isSubmitting,
  error,
  onSubmit,
  selectedRole,
  setSelectedRole,
  hotelId,
}: AddStaffModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Fetch roles when modal opens
  useEffect(() => {
    if (open && hotelId) {
      const fetchRoles = async () => {
        setIsLoadingRoles(true);
        try {
          const response = await fetch(`/api/hotels/${hotelId}/roles?pageSize=1000`);
          if (response.ok) {
            const data = await response.json();
            setRoles(data.roles || []);
          }
        } catch (error) {
          console.error('Error fetching roles:', error);
        } finally {
          setIsLoadingRoles(false);
        }
      };

      fetchRoles();
    }
  }, [open, hotelId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setEmail('');
      setSelectedRole('');
    }
  }, [open, setEmail, setSelectedRole]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
          <DialogDescription>
            Invite a new staff member to join your hotel team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter staff member's email"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role *
            </label>
            {isLoadingRoles ? (
              <div className="flex items-center space-x-2 p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading roles...</span>
              </div>
            ) : (
              <Select value={selectedRole} onValueChange={setSelectedRole} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !email || !selectedRole}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inviting...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Staff
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}