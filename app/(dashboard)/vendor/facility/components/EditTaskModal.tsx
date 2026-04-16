'use client';

import { useState, useEffect, useRef } from 'react';
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
import { isBoolean } from 'lodash';

/** Format a Date as MySQL DATETIME in local time (no UTC shift) */
function formatLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

// Utility function to clean up modal overlays
const cleanupModalOverlays = () => {
  try {
    // Remove all dialog overlays
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    overlays.forEach(overlay => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    
    // Remove all dialog contents
    const contents = document.querySelectorAll('[data-radix-dialog-content]');
    contents.forEach(content => {
      if (content.parentNode) {
        content.parentNode.removeChild(content);
      }
    });
    
    // Clean up any radix portals that are empty
    const portals = document.querySelectorAll('[data-radix-portal]');
    portals.forEach(portal => {
      if (!portal.hasChildNodes() && portal.parentNode) {
        portal.parentNode.removeChild(portal);
      }
    });
    
    // Reset body styles that might be stuck
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    // Remove any lingering backdrop classes
    document.body.classList.remove('overflow-hidden');
  } catch (error) {
    // Silently handle cleanup errors
    console.warn('Modal cleanup warning:', error);
  }
};

interface Staff {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Room {
  id: string;
  name: string;
  roomNumber?: string;
  roomId?: string;
  roomName?: string;
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
  const [isLoading, setIsLoading] = useState(true); // start loading immediately
  const fetchedTaskIdRef = useRef<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>();
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [costEstimate, setCostEstimate] = useState<number | undefined>();
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [roomUnitId, setRoomUnitId] = useState<string>('');
  
  // Data for dropdowns
  const [staff, setStaff] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const handleClose = () => {
    if (!isSubmitting) {
      cleanupModalOverlays();
      onClose();
      setTimeout(cleanupModalOverlays, 100);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      handleClose();
    }
  };

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset ref immediately so re-opening the same task always re-fetches
      fetchedTaskIdRef.current = null;
      const timer = setTimeout(() => {
        setTitle('');
        setDescription('');
        setCategory('');
        setPriority('');
        setStatus('');
        setDueDate(undefined);
        setEstimatedHours(undefined);
        setIsRecurring(false);
        setCostEstimate(undefined);
        setAssignedToId('unassigned');
        setRoomUnitId('no-room');
        setStaff([]);
        setRooms([]);
        setIsLoading(false);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupModalOverlays();
      setTimeout(cleanupModalOverlays, 200);
    };
  }, []);

  // Fetch task data when modal opens
  useEffect(() => {
    if (isOpen && taskId && fetchedTaskIdRef.current !== taskId) {
      const fetchTaskData = async () => {
        setIsLoading(true);
        fetchedTaskIdRef.current = taskId;
        
        try {
          // Fetch task data
          const taskResponse = await fetch(`/api/tasks/${taskId}`);
          if (!taskResponse.ok) {
            throw new Error('Failed to fetch task');
          }
          const task = await taskResponse.json();
          
          // Populate form with task data
          setTitle(task.title);
          setDescription(task.description);
          setCategory(task.category);
          setPriority(task.priority);
          setStatus(task.status);
          setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
          setEstimatedHours(task.estimatedHours);
          setIsRecurring(task.isRecurring);
          setCostEstimate(task.costEstimate);
          setAssignedToId(task.assignedToId || 'unassigned');
          setRoomUnitId(task.roomUnitId || 'no-room');
          
          // Fetch staff and room units for the hotel
          const [staffResponse, roomUnitsResponse] = await Promise.all([
            fetch(`/api/hotels/${task.hotelId}/staff`),
            fetch(`/api/hotels/${task.hotelId}/room-units`)
          ]);
          
          if (staffResponse.ok) {
            const staffData = await staffResponse.json();
            setStaff(staffData || []);
          }
          
          if (roomUnitsResponse.ok) {
            const roomUnitsData = await roomUnitsResponse.json();
            setRooms(roomUnitsData || []);
          }
          
        } catch (error) {
          console.error('Error fetching task:', error);
          toast({
            title: 'Error',
            description: 'Failed to load task data',
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTaskData();
    }
  }, [isOpen, taskId, toast]);

  const handleSubmit = async () => {
    if (!title) {
      toast({
        title: 'Missing information',
        description: 'Please enter a task title',
      });
      return;
    }

    setIsSubmitting(true);

    console.log("Is recurring: ", isRecurring, ".\n Type: ", typeof(isRecurring))

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
          status,
          dueDate: dueDate ? formatLocalDatetime(dueDate) : undefined,
          estimatedHours: isNaN(Number(estimatedHours)) ?  null : Number(estimatedHours),
          isRecurring: isBoolean(isRecurring) ? isRecurring : false,
          costEstimate: isNaN(Number(costEstimate)) ? null : Number(costEstimate),
          assignedToId: assignedToId === 'unassigned' ? null : assignedToId,
          roomUnitId: roomUnitId === 'no-room' ? null : roomUnitId,
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
      handleClose();
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details below
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-500">
                <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Loading task details...</span>
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
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
              Description
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
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
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

          {/* Status and Assigned To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="assignedTo" className="text-sm font-medium">
                Assign To
              </label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.user.name} ({member.user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Room and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="room" className="text-sm font-medium">
                Room Unit
              </label>
              <Select value={roomUnitId} onValueChange={setRoomUnitId}>
                <SelectTrigger id="room">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-room">No specific room</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                    {dueDate ? format(dueDate, "PPP p") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    showTimePicker
                    defaultHour={18}
                    defaultMinute={0}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Maintenance Type and Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onCheckedChange={(checked) => setIsRecurring(checked === true)}
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
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
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
