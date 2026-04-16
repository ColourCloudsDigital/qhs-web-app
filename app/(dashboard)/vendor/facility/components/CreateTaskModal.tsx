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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
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
import { CalendarIcon, Loader2, Plus } from 'lucide-react';

/** Format a Date as MySQL DATETIME in local time (no UTC shift) */
function formatLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

interface Room {
  id: string;
  name: string;
  roomNumber?: string;
  roomId?: string;
  roomName?: string;
}

interface Staff {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  staff: Staff[];
  onTaskCreated: () => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  hotelId,
  staff: initialStaff,
  onTaskCreated,
}: CreateTaskModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('GENERAL');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [roomUnitId, setRoomUnitId] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    return tomorrow;
  });
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined);
  const [isRecurring, setIsRecurring] = useState(false);
  const [costEstimate, setCostEstimate] = useState<number | undefined>(undefined);
  
  // Load room units when modal is opened
  useEffect(() => {
    if (isOpen && hotelId) {
      const fetchRoomUnits = async () => {
        setIsLoadingRooms(true);
        try {
          const response = await fetch(`/api/hotels/${hotelId}/room-units`);
          if (response.ok) {
            const data = await response.json();
            setRooms(data);
          } else {
            throw new Error('Failed to load room units');
          }
        } catch (error) {
          console.error('Error fetching room units:', error);
          toast({
            title: 'Error',
            description: 'Failed to load room units',
          });
        } finally {
          setIsLoadingRooms(false);
        }
      };
      
      fetchRoomUnits();
    }
  }, [isOpen, hotelId]);

  // Load staff when modal is opened
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
          // Keep initial staff as fallback
          setStaff(initialStaff);
        } finally {
          setIsLoadingStaff(false);
        }
      };
      
      fetchStaff();
    }
  }, [isOpen, hotelId]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('GENERAL');
    setPriority('MEDIUM');
    setAssignedToId('');
    setRoomUnitId('');
    setDueDate(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      return tomorrow;
    });
    setEstimatedHours(undefined);
    setIsRecurring(false);
    setCostEstimate(undefined);
  };
  
  const handleSubmit = async () => {
    // Validation
    if (!title) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title for the task',
      });
      return;
    }
    
    if (!dueDate) {
      toast({
        title: 'Missing information',
        description: 'Please select a due date',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          hotelId,
          category,
          priority,
          assignedToId: assignedToId && assignedToId !== 'unassigned' ? assignedToId : null,
          roomUnitId: roomUnitId && roomUnitId !== 'none' ? roomUnitId : null,
          dueDate: formatLocalDatetime(dueDate), // local datetime, no UTC shift
          status: 'PENDING',
          estimatedHours: estimatedHours || null,
          isRecurring,
          costEstimate: costEstimate || null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }
      
      toast({
        title: 'Task created',
        description: 'The task has been created successfully',
      });
      
      onTaskCreated();
      resetForm();
    } catch (error) {
      console.error('Error creating task:', error);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Maintenance Task</DialogTitle>
          <DialogDescription>
            Create a new task for facility maintenance and management.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
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
              placeholder="Describe the task and any relevant details"
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
          
          {/* Due Date */}
          <div className="grid gap-2">
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due Date *
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
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Assignee and Room */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="assignee" className="text-sm font-medium">
                Assign To
              </label>
              <Select value={assignedToId} onValueChange={setAssignedToId} disabled={isLoadingStaff}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder={isLoadingStaff ? "Loading staff..." : "Select staff member"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staff.map((staffMember) => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.user?.name || 'Unknown'} ({staffMember.user?.email || 'No email'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="room" className="text-sm font-medium">
                Room Unit (Optional)
              </label>
              <Select value={roomUnitId} onValueChange={setRoomUnitId} disabled={isLoadingRooms}>
                <SelectTrigger id="room">
                  <SelectValue placeholder={isLoadingRooms ? "Loading room units..." : "Select room unit"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific room unit</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Estimated Hours */}
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
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}