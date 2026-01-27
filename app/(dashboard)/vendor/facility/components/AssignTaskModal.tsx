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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface Staff {
  id: string;
  userId: string;
  position: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Task {
  taskId: string;
  title: string;
  staffId?: string;
  staffName?: string;
  hotelId: string;
}

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  hotelId: string;
  onTaskUpdated: () => void;
}

export default function AssignTaskModal({
  isOpen,
  onClose,
  task,
  hotelId,
  onTaskUpdated,
}: AssignTaskModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch staff when modal opens
  useEffect(() => {
    if (isOpen && hotelId) {
      const fetchStaff = async () => {
        setIsLoadingStaff(true);
        try {
          const response = await fetch(`/api/hotels/${hotelId}/staff`);
          if (response.ok) {
            const data = await response.json();
            setStaff(data);
          } else {
            throw new Error('Failed to load staff');
          }
        } catch (error) {
          console.error('Error fetching staff:', error);
          toast({
            title: 'Error',
            description: 'Failed to load staff members',
          });
        } finally {
          setIsLoadingStaff(false);
        }
      };

      fetchStaff();
    }
  }, [isOpen, hotelId, toast]);

  useEffect(() => {
    if (task && isOpen) {
      setAssignedStaffId(task.staffId || 'unassigned');
      setNotes('');
    }
  }, [task, isOpen]);

  const handleSubmit = async () => {
    if (!assignedStaffId || assignedStaffId === 'unassigned') {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/tasks/${task?.taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignedToId: null,
            notes,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to unassign task');
        }

        toast({
          title: 'Task unassigned',
          description: 'The task has been unassigned successfully',
        });

        onTaskUpdated();
        onClose();
      } catch (error) {
        console.error('Error unassigning task:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'An error occurred',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${task?.taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToId: assignedStaffId,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign task');
      }

      const selectedStaff = staff.find(s => s.id === assignedStaffId);
      toast({
        title: 'Task assigned',
        description: `Task assigned to ${selectedStaff?.user.name}`,
      });

      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            Assign &quot;{task?.title}&quot; to a staff member
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Current Assignment */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-600">Currently Assigned To</label>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm">
                {task?.staffName ? (
                  <span>{task.staffName}</span>
                ) : (
                  <span className="text-gray-500">Unassigned</span>
                )}
              </p>
            </div>
          </div>

          {/* Staff Selection */}
          <div className="grid gap-2">
            <label htmlFor="staff" className="text-sm font-medium">
              Assign To *
            </label>
            <Select value={assignedStaffId} onValueChange={setAssignedStaffId} disabled={isLoadingStaff}>
              <SelectTrigger id="staff">
                <SelectValue placeholder={isLoadingStaff ? "Loading staff..." : "Select staff member"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staff.map((staffMember) => (
                  <SelectItem key={staffMember.id} value={staffMember.id}>
                    {staffMember.user?.name || 'Unknown'} ({staffMember.position})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this assignment..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
