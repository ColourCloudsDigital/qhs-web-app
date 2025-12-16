'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskStatus } from '@/lib/types/enums';
import { useToast } from '@/components/ui/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  FileText,
  MessageSquare,
  ListChecks,
} from 'lucide-react';

// Import sub-components
import TaskHeader from './task/TaskHeader';
import TaskDetailsTab from './task/TaskDetailsTab';
import TaskChecklistTab from './task/TaskChecklistTab';
import TaskCommentsTab from './task/TaskCommentsTab';

interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  order: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: any; // Using 'any' here to avoid enum issues
  category: any;
  dueDate: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  costEstimate?: number;
  actualCost?: number;
  maintenanceType: any;
  createdAt: string;
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
  hotel?: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  comments: TaskComment[];
  checklist: ChecklistItem[];
}

interface StaffTaskDetailClientProps {
  task: Task;
  staffId: string;
}

export default function StaffTaskDetailClient({
  task,
  staffId,
}: StaffTaskDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [actualHours, setActualHours] = useState<string>(
    task.actualHours?.toString() || ''
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklist || []);
  const [isUpdatingChecklist, setIsUpdatingChecklist] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Add fallbacks for various task properties
  const taskDescription = task.description || '';
  const taskMaintenanceType = task.maintenanceType || 'CORRECTIVE';
  const taskComments = task.comments || [];

  // Use optional chaining for nested objects
  const roomName = task.room?.name;
  const hotelName = task.hotel?.name;
  const creatorName = task.createdBy?.name || 'Unknown';
  
  const isOverdue = new Date(task.dueDate) < new Date() && 
    task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
  
  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === status) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === 'COMPLETED' ? { 
            completedAt: new Date().toISOString(),
            actualHours: actualHours ? parseFloat(actualHours) : undefined
          } : {}),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
      
      setStatus(newStatus);
      
      // Add a comment about the status change
      if (comment.trim()) {
        await submitComment();
      } else {
        await addSystemComment(`Status changed to ${newStatus.replace('_', ' ').toLowerCase()}.`);
      }
      
      toast({
        title: "Success",
        description: `Task status updated to ${newStatus.replace('_', ' ').toLowerCase()}`,
        type: "success"
      });
      
      // Refresh the page to get updated task data
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: 'Failed to update task status',
        type: "error"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const submitComment = async () => {
    if (!comment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      toast({
        title: "Success",
        description: 'Comment added successfully',
        type: "success"
      });
      setComment('');
      router.refresh();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: 'Failed to add comment',
        type: "error"
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  const addSystemComment = async (content: string) => {
    try {
      await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });
    } catch (error) {
      console.error('Error adding system comment:', error);
    }
  };
  
  const handleChecklistItemUpdate = async (itemId: string, isCompleted: boolean) => {
    setIsUpdatingChecklist(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/checklist/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isCompleted,
          completedBy: isCompleted ? staffId : null,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update checklist item');
      }
      
      // Update local state
      setChecklist(prev => 
        prev.map(item => 
          item.id === itemId ? 
            { ...item, isCompleted, completedAt: isCompleted ? new Date().toISOString() : undefined } : 
            item
        )
      );
      
      // Add system comment if item is checked
      if (isCompleted) {
        const item = checklist.find(i => i.id === itemId);
        if (item) {
          await addSystemComment(`Completed checklist item: "${item.description}"`);
        }
      }
      
      toast({
        title: "Success",
        description: `Checklist item ${isCompleted ? 'completed' : 'uncompleted'}`,
        type: "success"
      });
      
      // Check the response for additional info
      const data = await response.json();
      if (data.allCompleted) {
        toast({
          title: "Info",
          description: data.message,
          type: "info",
          duration: 8000
        });
      }
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast({
        title: "Error",
        description: 'Failed to update checklist item',
        type: "error"
      });
    } finally {
      setIsUpdatingChecklist(false);
    }
  };
  
  const handleActualHoursChange = async () => {
    if (!actualHours) return;
    
    try {
      const hours = parseFloat(actualHours);
      if (isNaN(hours) || hours <= 0) {
        toast({
          title: "Error",
          description: 'Please enter a valid number of hours',
          type: "error"
        });
        return;
      }
      
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actualHours: hours,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update actual hours');
      }
      
      toast({
        title: "Success",
        description: 'Actual hours updated successfully',
        type: "success"
      });
      
      // Add system comment
      await addSystemComment(`Updated actual hours to ${hours} hour(s).`);
      
      router.refresh();
    } catch (error) {
      console.error('Error updating actual hours:', error);
      toast({
        title: "Error",
        description: 'Failed to update actual hours',
        type: "error"
      });
    }
  };
  
  return (
    <div className="p-6">
      <TaskHeader
        title={task.title}
        status={status}
        priority={task.priority}
        hotelName={hotelName}
        roomName={roomName}
        isUpdatingStatus={isUpdatingStatus}
        onStatusChange={handleStatusChange}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="checklist">
            <ListChecks className="mr-2 h-4 w-4" />
            Checklist {checklist.length > 0 && `(${checklist.filter(item => item.isCompleted).length}/${checklist.length})`}
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="mr-2 h-4 w-4" />
            Comments {taskComments.length > 0 && `(${taskComments.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <TaskDetailsTab
            description={taskDescription}
            dueDate={task.dueDate}
            category={task.category}
            maintenanceType={taskMaintenanceType}
            creatorName={creatorName}
            estimatedHours={task.estimatedHours}
            costEstimate={task.costEstimate}
            actualHours={actualHours}
            setActualHours={setActualHours}
            onActualHoursChange={handleActualHoursChange}
            status={status}
            isUpdatingStatus={isUpdatingStatus}
            onStatusChange={handleStatusChange}
            isOverdue={isOverdue}
          />
        </TabsContent>
        
        <TabsContent value="checklist">
          <TaskChecklistTab
            checklist={checklist}
            isUpdatingChecklist={isUpdatingChecklist}
            onChecklistItemUpdate={handleChecklistItemUpdate}
          />
        </TabsContent>
        
        <TabsContent value="comments">
          <TaskCommentsTab
            comments={taskComments}
            comment={comment}
            setComment={setComment}
            isSubmittingComment={isSubmittingComment}
            onSubmitComment={submitComment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}