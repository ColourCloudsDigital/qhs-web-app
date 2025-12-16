'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User } from 'lucide-react';

interface Staff {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  position: string;
}

interface AssignTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onAssigned: (success: boolean) => void;
}

export default function AssignTaskDialog({
  isOpen,
  onClose,
  taskId,
  onAssigned,
}: AssignTaskDialogProps) {
  const { toast } = useToast();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/staff?includeHotelDetails=true');
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      } else {
        throw new Error('Failed to load staff members');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const fetchCurrentAssignee = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.assignedToId) {
          setSelectedStaffId(data.assignedToId);
        } else {
          setSelectedStaffId('');
        }
      }
    } catch (error) {
      console.error('Error fetching current assignee:', error);
    }
  }, [taskId]);
  
  useEffect(() => {
    if (isOpen) {
      fetchStaff();
      fetchCurrentAssignee();
    }
  }, [isOpen, taskId, fetchStaff, fetchCurrentAssignee]);
  
  const handleAssign = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToId: selectedStaffId || null, // null means unassigned
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign task');
      }
      
      toast({
        title: 'Task assigned',
        description: selectedStaffId 
          ? `Task has been assigned successfully` 
          : 'Task has been unassigned',
      });
      
      onAssigned(true);
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
      onAssigned(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            Assign this task to a staff member or leave unassigned.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="staff" className="text-sm font-medium">
              Staff Member
            </label>
            
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading staff members...</span>
              </div>
            ) : (
              <Select 
                value={selectedStaffId} 
                onValueChange={setSelectedStaffId}
              >
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.user.name} ({staff.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isSubmitting || isLoading}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                {selectedStaffId ? 'Assign Task' : 'Unassign Task'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}