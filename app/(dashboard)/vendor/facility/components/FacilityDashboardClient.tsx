'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Calendar,
  Settings,
  Key,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
}

interface FacilityStats {
  staff: {
    totalStaff: number;
    activeStaff: number;
    onDutyStaff: number;
  };
  tasks: {
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    overdueTasks: number;
  };
  rooms: {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'EMERGENCY';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate: string;
  assignedTo?: {
    id: string;
    name: string;
  };
  room?: {
    id: string;
    name: string;
  };
  hotel?: {
    id: string;
    name: string;
  };
}

interface FacilityDashboardClientProps {
  hotels: Hotel[];
  stats: {
    staff: {
      totalStaff: number;
      activeStaff: number;
    };
    tasks: {
      totalTasks: number;
      pendingTasks: number;
      inProgressTasks: number;
      completedTasks: number;
      overdueTasks: number;
    };
    recentTasks: any[];
  };
}

export default function FacilityDashboardClient({ hotels, stats: initialStats }: FacilityDashboardClientProps) {
  const [stats, setStats] = useState<FacilityStats>({
    staff: {
      totalStaff: initialStats.staff.totalStaff || 0,
      activeStaff: initialStats.staff.activeStaff || 0,
      onDutyStaff: initialStats.staff.activeStaff || 0,
    },
    tasks: {
      totalTasks: initialStats.tasks.totalTasks || 0,
      pendingTasks: initialStats.tasks.pendingTasks || 0,
      inProgressTasks: initialStats.tasks.inProgressTasks || 0,
      completedTasks: initialStats.tasks.completedTasks || 0,
      overdueTasks: initialStats.tasks.overdueTasks || 0,
    },
    rooms: {
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      maintenanceRooms: 0,
    },
  });

  const [recentTasks, setRecentTasks] = useState<Task[]>(initialStats.recentTasks || []);
  const [loading, setLoading] = useState(false);

  // Get the primary hotel name for display
  const primaryHotel = hotels && hotels.length > 0 ? hotels[0] : null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'URGENT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'HIGH':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Facility Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage maintenance tasks and facility operations for {primaryHotel?.name || 'your properties'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/vendor/facility/tasks/create">
            <Button>
              <ClipboardList className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </Link>
          <Link href="/vendor/facility/settings">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Staff Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staff.totalStaff}</div>
            <p className="text-xs text-muted-foreground">
              {stats.staff.activeStaff} active
            </p>
          </CardContent>
        </Card>

        {/* Tasks Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasks.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.tasks.pendingTasks} pending
            </p>
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.tasks.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        {/* Maintenance Rooms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rooms.maintenanceRooms}</div>
            <p className="text-xs text-muted-foreground">
              Rooms under maintenance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/vendor/facility/tasks">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="h-4 w-4 mr-2" />
                View All Tasks
              </Button>
            </Link>
            <Link href="/vendor/facility/staff">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Staff
              </Button>
            </Link>
            <Link href="/vendor/facility/rooms">
              <Button variant="outline" className="w-full justify-start">
                <Key className="h-4 w-4 mr-2" />
                Room Status
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
            <CardDescription>Latest facility maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent tasks</p>
            ) : (
              <div className="space-y-2">
                {recentTasks.slice(0, 3).map((task, index) => (
                  <div key={task.id || index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title || 'Untitled Task'}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.hotel?.name || 'Hotel'} • Due {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                      </p>
                    </div>
                    <Badge className={getPriorityColor(task.priority || 'MEDIUM')}>
                      {task.priority || 'MEDIUM'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
            <CardDescription>Overall facility health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Task Completion Rate</span>
              <span className="text-sm font-medium">
                {stats.tasks.totalTasks > 0 
                  ? Math.round((stats.tasks.completedTasks / stats.tasks.totalTasks) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Staff Utilization</span>
              <span className="text-sm font-medium">
                {stats.staff.totalStaff > 0 
                  ? Math.round((stats.staff.onDutyStaff / stats.staff.totalStaff) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Room Availability</span>
              <span className="text-sm font-medium">
                {stats.rooms.totalRooms > 0 
                  ? Math.round((stats.rooms.availableRooms / stats.rooms.totalRooms) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}