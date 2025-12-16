import { TaskStatus, TaskPriority, TaskCategory, MaintenanceType } from '@/lib/types/enums';

export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: Date | string;
  completedAt?: Date | string | null;
  estimatedHours?: number;
  actualHours?: number;
  costEstimate?: number;
  actualCost?: number;
  maintenanceType: MaintenanceType;
  createdAt: Date | string;
  updatedAt: Date | string;
  assignedToId: string | null;
  assignedTo?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  roomId: string | null;
  room?: {
    id: string;
    name: string;
  } | null;
  hotelId: string;
  hotel?: {
    id: string;
    name: string;
  } | null;
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  lastUpdatedById?: string | null;
  lastUpdatedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  isRecurring?: boolean;
  recurringPattern?: string;
  parentTaskId?: string | null;
  parentTask?: Task | null;
  childTasks?: Task[];
  attachments?: string;
  comments: TaskComment[];
  checklist: ChecklistItem[];
}