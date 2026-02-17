'use client';

import { useRouter } from 'next/navigation';
import { TaskStatus, TaskPriority } from '@/lib/types/enums';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import TaskStatusBadge from '@/app/(dashboard)/vendor/facility/components/TaskStatusBadge';
import TaskPriorityBadge from '@/app/(dashboard)/vendor/facility/components/TaskPriorityBadge';

interface TaskHeaderProps {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  hotelName?: string;
  roomName?: string;
  isUpdatingStatus: boolean;
  onStatusChange: (status: TaskStatus) => void;
}

export default function TaskHeader({
  title,
  status,
  priority,
  hotelName,
  roomName,
  isUpdatingStatus,
  onStatusChange,
}: TaskHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/staff/tasks')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tasks
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <TaskStatusBadge status={status} />
            <TaskPriorityBadge priority={priority} />
            <span className="text-sm text-gray-500">
              {hotelName} {roomName && `• Room ${roomName}`}
            </span>
          </div>
        </div>
        
        <div className="space-x-2">
          {status !== TaskStatus.COMPLETED && status !== TaskStatus.CANCELLED && (
            <Button 
              onClick={() => onStatusChange(TaskStatus.COMPLETED)} 
              disabled={isUpdatingStatus}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdatingStatus ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mark as Completed
            </Button>
          )}
          
          {status === TaskStatus.PENDING && (
            <Button 
              onClick={() => onStatusChange(TaskStatus.IN_PROGRESS)} 
              disabled={isUpdatingStatus}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdatingStatus ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Clock className="mr-2 h-4 w-4" />
              )}
              Start Working
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}