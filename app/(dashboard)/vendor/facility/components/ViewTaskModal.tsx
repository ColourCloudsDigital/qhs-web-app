'use client';

import { useState, useEffect } from 'react';
import { TaskStatus, TaskPriority, TaskCategory, MaintenanceType } from '@/lib/types/enums';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  dueDate: string;
  assignedTo?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  room?: {
    id: string;
    name: string;
  } | null;
  maintenanceType: string;
  estimatedHours?: number;
  costEstimate?: number;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ViewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onEdit: () => void;
  onUpdateStatus: () => void;
  onAssign: () => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
  EMERGENCY: 'bg-red-200 text-red-900',
};

export default function ViewTaskModal({
  isOpen,
  onClose,
  taskId,
  onEdit,
  onUpdateStatus,
  onAssign,
}: ViewTaskModalProps) {
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTask(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Fetch task data when modal opens
  useEffect(() => {
    if (isOpen && taskId) {
      const fetchTaskData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/tasks/${taskId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch task');
          }
          const taskData = await response.json();
          setTask(taskData);
        } catch (error) {
          console.error('Error fetching task:', error);
          toast({
            title: 'Error',
            description: 'Failed to load task data',
          });
          onClose();
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTaskData();
    }
  }, [isOpen, taskId, onClose, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isLoading ? 'Loading...' : task?.title || 'Task Details'}</span>
          </DialogTitle>
          <DialogDescription>
            {isLoading ? 'Loading task details...' : `Task ID: ${taskId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ) : task ? (
            <>
              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Status</label>
                  <div className="mt-2">
                    <Badge className={statusColors[task.status] || 'bg-gray-100'}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Priority</label>
                  <div className="mt-2">
                    <Badge className={priorityColors[task.priority] || 'bg-gray-100'}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-gray-600">Description</label>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>

              {/* Category and Maintenance Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Category</label>
                  <p className="mt-2 text-sm text-gray-700">{task.category}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Maintenance Type</label>
                  <p className="mt-2 text-sm text-gray-700">{task.maintenanceType}</p>
                </div>
              </div>

              {/* Due Date and Staff */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Due Date</label>
                  <p className="mt-2 text-sm text-gray-700">
                    {task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Assigned To</label>
                  <p className="mt-2 text-sm text-gray-700">
                    {task.assignedTo ? (
                      <span>{task.assignedTo.user.name} ({task.assignedTo.user.email})</span>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Room */}
              {task.room && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Room</label>
                  <p className="mt-2 text-sm text-gray-700">{task.room.name}</p>
                </div>
              )}

              {/* Estimated Hours and Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Estimated Hours</label>
                  <p className="mt-2 text-sm text-gray-700">
                    {task.estimatedHours ? `${task.estimatedHours} hours` : 'Not estimated'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Cost Estimate</label>
                  <p className="mt-2 text-sm text-gray-700">
                    {task.costEstimate ? `₦${task.costEstimate.toLocaleString()}` : 'Not estimated'}
                  </p>
                </div>
              </div>

              {/* Recurring */}
              <div>
                <label className="text-sm font-semibold text-gray-600">Recurring Task</label>
                <p className="mt-2 text-sm text-gray-700">
                  {task.isRecurring ? 'Yes' : 'No'}
                </p>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Created</label>
                  <p className="mt-1 text-xs text-gray-600">
                    {format(new Date(task.createdAt), 'PPpp')}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Last Updated</label>
                  <p className="mt-1 text-xs text-gray-600">
                    {format(new Date(task.updatedAt), 'PPpp')}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Failed to load task details
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex-1"
            disabled={isLoading}
          >
            Edit Task
          </Button>
          <Button
            variant="outline"
            onClick={onUpdateStatus}
            className="flex-1"
            disabled={isLoading}
          >
            Update Status
          </Button>
          <Button
            variant="outline"
            onClick={onAssign}
            className="flex-1"
            disabled={isLoading}
          >
            Assign
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
