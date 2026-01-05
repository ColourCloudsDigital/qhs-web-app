'use client';

import { useState } from 'react';
import { TaskStatus } from '@/lib/types/enums';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface UpdateTaskStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  currentStatus: TaskStatus;
  onStatusUpdate: (success: boolean) => void;
}

export default function UpdateTaskStatusDialog({
  isOpen,
  onClose,
  taskId,
  currentStatus,
  onStatusUpdate,
}: UpdateTaskStatusDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<TaskStatus>(currentStatus);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!status) {
      toast({
        title: 'Error',
        description: 'Please select a status',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Update the task status
      const statusResponse = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          // If completing the task, set completedAt
          ...(status === 'COMPLETED' && { completedAt: new Date().toISOString() }),
        }),
      });
      
      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(errorData.error || 'Failed to update task status');
      }
      
      // 2. Add a comment if provided
      if (comment.trim()) {
        const commentResponse = await fetch(`/api/tasks/${taskId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: comment,
          }),
        });
        
        if (!commentResponse.ok) {
          const errorData = await commentResponse.json();
          throw new Error(errorData.error || 'Failed to add comment');
        }
      }
      
      toast({
        title: 'Status updated',
        description: `Task status has been updated to ${status.toLowerCase().replace('_', ' ')}`,
      });
      
      onStatusUpdate(true);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
      onStatusUpdate(false);
    } finally {
      setIsSubmitting(false);
      setComment('');
    }
  };
  
  const handleStatusChange = (value: string) => {
    setStatus(value as TaskStatus);
    
    // Set a default comment based on the status
    if (value !== currentStatus) {
      let defaultComment = '';
      
      switch (value) {
        case 'COMPLETED':
          defaultComment = 'Task has been completed successfully.';
          break;
        case 'IN_PROGRESS':
          defaultComment = 'Working on this task now.';
          break;
        case 'ON_HOLD':
          defaultComment = 'Task is on hold.';
          break;
        case 'CANCELLED':
          defaultComment = 'Task has been cancelled.';
          break;
      }
      
      setComment(defaultComment);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Task Status</DialogTitle>
          <DialogDescription>
            Change the status of this task and leave an optional comment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comment (Optional)
            </label>
            <Textarea
              id="comment"
              placeholder="Add a comment about this status change"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}