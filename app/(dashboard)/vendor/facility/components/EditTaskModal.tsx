'use client';

import { useState, useEffect } from 'react';
import { TaskStatus, TaskPriority, TaskCategory, MaintenanceType } from '@/lib/types/enums';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

interface Task {
  taskId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  due_date: string;
  maintenance_type: string;
  estimated_hours?: number;
  cost_estimate?: number;
  is_recurring: boolean;
  hotelId: string;
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onTaskUpdated: () => void;
}

export default function EditTaskModal({
  isOpen,
  onClose,
  taskId,
  onTaskUpdated,
}: EditTaskModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>();
  const [maintenanceType, setMaintenanceType] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [costEstimate, setCostEstimate] = useState<number | undefined>();

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      onClose();
    }
  };

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form state when modal is closed
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('');
      setDueDate(undefined);
      setEstimatedHours(undefined);
      setMaintenanceType('');
      setIsRecurring(false);
      setCostEstimate(undefined);
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
          const task = await response.json();
          
          // Populate form with task data
          setTitle(task.title);
          setDescription(task.description);
          setCategory(task.category);
          setPriority(task.priority);
          setDueDate(new Date(task.dueDate));
          setEstimatedHours(task.estimatedHours);
          setMaintenanceType(task.maintenanceType);
          setIsRecurring(task.isRecurring);
          setCostEstimate(task.costEstimate);
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

  const handleSubmit = async () => {
    if (!title || !description) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          dueDate: dueDate?.toISOString(),
          estimatedHours: estimatedHours || null,
          maintenanceType,
          isRecurring,
          costEstimate: costEstimate || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      toast({
        title: 'Task updated',
        description: 'The task has been updated successfully',
      });

      onTaskUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details below
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
          <>
          {/* Title */}
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task"
              rows={3}
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLEANING">Cleaning</SelectItem>
                  <SelectItem value="REPAIR">Repair</SelectItem>
                  <SelectItem value="INSPECTION">Inspection</SelectItem>
                  <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                  <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                  <SelectItem value="GUEST_REQUEST">Guest Request</SelectItem>
                  <SelectItem value="IT_SUPPORT">IT Support</SelectItem>
                  <SelectItem value="PLUMBING">Plumbing</SelectItem>
                  <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="grid gap-2">
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Maintenance Type and Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="maintenanceType" className="text-sm font-medium">
                Maintenance Type
              </label>
              <Select value={maintenanceType} onValueChange={setMaintenanceType}>
                <SelectTrigger id="maintenanceType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                  <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                  <SelectItem value="PREDICTIVE">Predictive</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="estimatedHours" className="text-sm font-medium">
                Estimated Hours
              </label>
              <Input
                id="estimatedHours"
                type="number"
                value={estimatedHours === undefined ? '' : estimatedHours}
                onChange={(e) => setEstimatedHours(
                  e.target.value ? parseFloat(e.target.value) : undefined
                )}
                placeholder="Enter estimated hours"
                min="0.5"
                step="0.5"
              />
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="grid gap-2">
            <label htmlFor="costEstimate" className="text-sm font-medium">
              Cost Estimate (₦)
            </label>
            <Input
              id="costEstimate"
              type="number"
              value={costEstimate === undefined ? '' : costEstimate}
              onChange={(e) => setCostEstimate(
                e.target.value ? parseFloat(e.target.value) : undefined
              )}
              placeholder="Enter estimated cost"
              min="0"
            />
          </div>

          {/* Recurring Task */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isRecurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <label
              htmlFor="isRecurring"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              This is a recurring task
            </label>
          </div>
          </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting || isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Task'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
