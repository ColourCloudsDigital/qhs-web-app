'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskStatus } from '@/lib/types/enums';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  MoreHorizontal,
  Pencil,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  PauseCircle,
  Trash2,
  Copy,
  User,
} from 'lucide-react';
import UpdateTaskStatusDialog from './UpdateTaskStatusDialog';
import AssignTaskDialog from './AssignTaskDialog';
import DeleteTaskModal from './DeleteTaskModal';
import ViewTaskModal from './ViewTaskModal';
import EditTaskModal from './EditTaskModal';

interface TaskActionsMenuProps {
  taskId: string;
  taskStatus: TaskStatus;
  taskTitle: string;
  onTaskUpdate: () => void;
}

export default function TaskActionsMenu({
  taskId,
  taskStatus,
  taskTitle,
  onTaskUpdate,
}: TaskActionsMenuProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };
  
  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/duplicate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Task duplicated',
          description: 'The task has been successfully duplicated.',
        });
        onTaskUpdate();
        
        // Navigate to the new task
        router.push(`/vendor/facility/tasks/${data.id}`);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to duplicate task');
      }
    } catch (error) {
      console.error('Error duplicating task:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to duplicate task',
      });
    }
  };
  
  const handleStatusUpdate = (success: boolean) => {
    setIsStatusDialogOpen(false);
    if (success) {
      onTaskUpdate();
    }
  };
  
  const handleAssignmentUpdate = (success: boolean) => {
    setIsAssignDialogOpen(false);
    if (success) {
      onTaskUpdate();
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => setIsViewModalOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Task
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsStatusDialogOpen(true)}>
            <Clock className="mr-2 h-4 w-4" />
            Update Status
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setIsAssignDialogOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Assign Task
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <UpdateTaskStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        taskId={taskId}
        currentStatus={taskStatus}
        onStatusUpdate={handleStatusUpdate}
      />
      
      <AssignTaskDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        taskId={taskId}
        onAssigned={handleAssignmentUpdate}
      />
      
      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        taskId={taskId}
        taskTitle={taskTitle}
        onTaskDeleted={() => {
          setIsDeleteModalOpen(false);
          onTaskUpdate();
        }}
      />

      <ViewTaskModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        taskId={taskId}
        onEdit={() => {
          setIsViewModalOpen(false);
          setIsEditModalOpen(true);
        }}
        onUpdateStatus={() => {
          setIsViewModalOpen(false);
          setIsStatusDialogOpen(true);
        }}
        onAssign={() => {
          setIsViewModalOpen(false);
          setIsAssignDialogOpen(true);
        }}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        taskId={taskId}
        onTaskUpdated={() => {
          setIsEditModalOpen(false);
          onTaskUpdate();
        }}
      />
    </>
  );
}