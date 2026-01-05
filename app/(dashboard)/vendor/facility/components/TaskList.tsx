'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TaskStatus, TaskPriority, TaskCategory } from '@/lib/types/enums';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import TaskStatusBadge from './TaskStatusBadge';
import TaskPriorityBadge from './TaskPriorityBadge';
import TaskActionsMenu from './TaskActionsMenu';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string;
  createdAt: string;
  assignedTo?: {
    id: string;
    user: {
      id: string;
      name: string;
    };
  } | null;
  room?: {
    id: string;
    name: string;
  } | null;
}

interface TaskListProps {
  hotelId: string;
  statusFilter: TaskStatus | null;
  priorityFilter: TaskPriority | null;
  categoryFilter: TaskCategory | null;
  assigneeFilter: string | null;
  searchQuery: string;
  onTaskUpdate: () => void;
}

export default function TaskList({
  hotelId,
  statusFilter,
  priorityFilter,
  categoryFilter,
  assigneeFilter,
  searchQuery,
  onTaskUpdate,
}: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = `/api/tasks?hotelId=${hotelId}&page=${page}&limit=${limit}`;
      
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (assigneeFilter) url += `&assignedToId=${assigneeFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data.tasks);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [hotelId, statusFilter, priorityFilter, categoryFilter, assigneeFilter, searchQuery, page]);
  
  useEffect(() => {
    fetchTasks();
  }, [hotelId, statusFilter, priorityFilter, categoryFilter, assigneeFilter, searchQuery, page, fetchTasks]);
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Format relative time with "ago" suffix
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading tasks</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTasks}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Skeleton loading state
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {Array.from({ length: 7 }).map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No tasks found. Create a new task to get started.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/vendor/facility/tasks/${task.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {task.title}
                  </Link>
                  {task.room && (
                    <div className="text-xs text-gray-500 mt-1">
                      Room: {task.room.name}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <TaskStatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  <TaskPriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell>
                  {task.assignedTo ? (
                    <div className="flex items-center">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs mr-2">
                        {task.assignedTo.user.name.charAt(0)}
                      </div>
                      <span className="text-sm">{task.assignedTo.user.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-sm">
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-sm">
                      {formatRelativeTime(task.createdAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <TaskActionsMenu
                    taskId={task.id}
                    taskStatus={task.status}
                    onTaskUpdate={() => {
                      fetchTasks();
                      onTaskUpdate();
                    }}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      {!isLoading && tasks.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, totalCount)} of {totalCount} tasks
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}