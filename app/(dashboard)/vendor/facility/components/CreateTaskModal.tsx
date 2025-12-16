'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface Room {
  id: string;
  name: string;
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
  staff,
  onTaskCreated,
}: CreateTaskModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('GENERAL');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 1))
  );
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined);
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('CORRECTIVE');
  const [isRecurring, setIsRecurring] = useState(false);
  const [costEstimate, setCostEstimate] = useState<number | undefined>(undefined);
  
  // Load rooms when modal is opened
  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const response = await fetch(`/api/hotels/${hotelId}/rooms`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      } else {
        throw new Error('Failed to load rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rooms',
      });
    } finally {
      setIsLoadingRooms(false);
    }
  }, [hotelId, toast]);

  useEffect(() => {
    if (isOpen && hotelId) {
      fetchRooms();
    }
  }, [isOpen, hotelId, fetchRooms]);

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
    setRoomId('');
    setDueDate(new Date(new Date().setDate(new Date().getDate() + 1)));
    setEstimatedHours(undefined);
    setMaintenanceType('CORRECTIVE');
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
          assignedToId: assignedToId || null,
          roomId: roomId || null,
          dueDate: dueDate.toISOString(),
          status: 'PENDING',
          estimatedHours: estimatedHours || null,
          maintenanceType,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
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
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
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
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
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
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {staff.map((staffMember) => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="room" className="text-sm font-medium">
                Room (Optional)
              </label>
              <Select value={roomId} onValueChange={setRoomId} disabled={isLoadingRooms}>
                <SelectTrigger id="room">
                  <SelectValue placeholder={isLoadingRooms ? "Loading rooms..." : "Select room"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific room</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Maintenance Type and Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="maintenanceType" className="text-sm font-medium">
                Maintenance Type
              </label>
              <Select 
                value={maintenanceType} 
                onValueChange={(v) => setMaintenanceType(v as MaintenanceType)}
              >
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