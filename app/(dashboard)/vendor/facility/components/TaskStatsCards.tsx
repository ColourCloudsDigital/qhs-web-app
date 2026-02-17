'use client';

import { TaskStatus, TaskPriority } from '@/lib/types/enums';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CircleCheck,
  Clock,
  AlarmClock,
  AlertTriangle,
  Pencil,
} from 'lucide-react';

interface TaskStats {
  statusCounts: Array<{ status: TaskStatus; _count: number }>;
  priorityCounts: Array<{ priority: TaskPriority; _count: number }>;
  overdueTasks: number;
  totalTasks: number;
}

interface TaskStatsCardsProps {
  stats: TaskStats;
  isLoading: boolean;
}

export default function TaskStatsCards({ stats, isLoading }: TaskStatsCardsProps) {
  // Helper to get count for a specific status
  const getStatusCount = (status: TaskStatus) => {
    const found = stats.statusCounts.find(s => s.status === status);
    return found?._count || 0;
  };

  // Helper to get count for a specific priority
  const getPriorityCount = (priority: TaskPriority) => {
    const found = stats.priorityCounts.find(p => p.priority === priority);
    return found?._count || 0;
  };
  
  // Calculate stats
  const totalCount = stats.totalTasks;
  const pendingCount = getStatusCount(TaskStatus.PENDING);
  const inProgressCount = getStatusCount(TaskStatus.IN_PROGRESS);
  const completedCount = getStatusCount(TaskStatus.COMPLETED);
  const overdueCount = stats.overdueTasks;
  const highPriorityCount = getPriorityCount(TaskPriority.HIGH) + getPriorityCount(TaskPriority.URGENT) + getPriorityCount(TaskPriority.EMERGENCY);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {/* Total Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{totalCount}</div>
          )}
        </CardContent>
      </Card>

      {/* Pending Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{pendingCount}</div>
          )}
        </CardContent>
      </Card>

      {/* In Progress Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <AlarmClock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{inProgressCount}</div>
          )}
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CircleCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{completedCount}</div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Tasks */}
      <Card className={overdueCount > 0 ? "border-red-200 bg-red-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${overdueCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : ""}`}>
              {overdueCount}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}