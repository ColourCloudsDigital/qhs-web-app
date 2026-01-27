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

// Utility function to clean up modal overlays
const cleanupModalOverlays = () => {
  // Remove all dialog overlays
  const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
  overlays.forEach(overlay => overlay.remove());
  
  // Remove all dialog contents
  const contents = document.querySelectorAll('[data-radix-dialog-content]');
  contents.forEach(content => content.remove());
  
  // Clean up any radix portals that are empty
  const portals = document.querySelectorAll('[data-radix-portal]');
  portals.forEach(portal => {
    if (!portal.hasChildNodes()) {
      portal.remove();
    }
  });
  
  // Reset body styles that might be stuck
  document.body.style.pointerEvents = '';
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  
  // Remove any lingering backdrop classes
  document.body.classList.remove('overflow-hidden');
};

interface TaskActionsMenuProps {
  taskId: string;
  taskStatus: TaskStatus;
  taskTitle: string;
  onTaskUpdate: () => void;
}

type ModalType = 'view' | 'edit' | 'status' | 'assign' | 'delete' | null;

export default function TaskActionsMenu({
  taskId,
  taskStatus,
  taskTitle,
  onTaskUpdate,
}: TaskActionsMenuProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Single modal state to prevent conflicts
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  const closeAllModals = () => {
    setActiveModal(null);
    // Force cleanup of any lingering overlays
    cleanupModalOverlays();
    setTimeout(cleanupModalOverlays, 100);
  };
  
  const openModal = (modalType: ModalType) => {
    // Close any existing modal first
    closeAllModals();
    // Small delay to ensure previous modal is fully closed
    setTimeout(() => {
      setActiveModal(modalType);
    }, 150);
  };
  
  const handleDelete = () => {
    openModal('delete');
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
  
  const handleModalSuccess = () => {
    closeAllModals();
    onTaskUpdate();
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
          
          <DropdownMenuItem onClick={() => openModal('view')}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => openModal('edit')}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Task
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => openModal('status')}>
            <Clock className="mr-2 h-4 w-4" />
            Update Status
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => openModal('assign')}>
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
        isOpen={activeModal === 'status'}
        onClose={closeAllModals}
        taskId={taskId}
        currentStatus={taskStatus}
        onStatusUpdate={(success) => {
          if (success) handleModalSuccess();
          else closeAllModals();
        }}
      />
      
      <AssignTaskDialog
        isOpen={activeModal === 'assign'}
        onClose={closeAllModals}
        taskId={taskId}
        onAssigned={(success) => {
          if (success) handleModalSuccess();
          else closeAllModals();
        }}
      />
      
      <DeleteTaskModal
        isOpen={activeModal === 'delete'}
        onClose={closeAllModals}
        taskId={taskId}
        taskTitle={taskTitle}
        onTaskDeleted={handleModalSuccess}
      />

      <ViewTaskModal
        isOpen={activeModal === 'view'}
        onClose={closeAllModals}
        taskId={taskId}
        onEdit={() => openModal('edit')}
        onUpdateStatus={() => openModal('status')}
        onAssign={() => openModal('assign')}
      />

      <EditTaskModal
        isOpen={activeModal === 'edit'}
        onClose={closeAllModals}
        taskId={taskId}
        onTaskUpdated={handleModalSuccess}
      />
    </>
  );
}