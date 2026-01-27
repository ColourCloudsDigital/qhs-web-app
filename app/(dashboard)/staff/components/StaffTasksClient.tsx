'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { formatDate } from '@/lib/utils';
import { TaskStatus, TaskPriority, TaskCategory } from '@/lib/types/enums';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  Wrench,
  HourglassIcon,
  BarChart4,
  Loader2,
} from 'lucide-react';
import TaskStatusBadge from '@/app/(dashboard)/vendor/facility/components/TaskStatusBadge';
import TaskPriorityBadge from '@/app/(dashboard)/vendor/facility/components/TaskPriorityBadge';

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string;
  createdAt: string;
  room?: {
    id: string;
    name: string;
  } | null;
  hotel?: {
    id: string;
    name: string;
  } | null;
}

interface TaskStats {
  totalAssigned: number;
  overdueTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completedTasks: number;
}

interface StaffTasksClientProps {
  staffId: string;
}

export default function StaffTasksClient({ staffId }: StaffTasksClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    totalAssigned: 0,
    overdueTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState<string>('Your Hotel');
  const [activeTab, setActiveTab] = useState('all');

  // Calculate stats from tasks
  const calculateStats = (taskList: Task[]): TaskStats => {
    const now = new Date();
    
    return {
      totalAssigned: taskList.length,
      pendingTasks: taskList.filter(task => task.status === TaskStatus.PENDING).length,
      inProgressTasks: taskList.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
      completedTasks: taskList.filter(task => task.status === TaskStatus.COMPLETED).length,
      overdueTasks: taskList.filter(task => 
        new Date(task.dueDate) < now && 
        task.status !== TaskStatus.COMPLETED && 
        task.status !== TaskStatus.CANCELLED
      ).length,
    };
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/staff/tasks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      
      setTasks(data.tasks || []);
      setHotelName(data.staffInfo?.hotelName || 'Your Hotel');
      
      // Calculate stats from the fetched tasks
      const calculatedStats = calculateStats(data.tasks || []);
      setStats(calculatedStats);
      
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);
  
  // Filter tasks based on search query and active tab
  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.room?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Format relative time with "ago" suffix
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Sort tasks by dueDate and priority
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Sort by overdue status (overdue first)
    const aIsOverdue = new Date(a.dueDate) < new Date();
    const bIsOverdue = new Date(b.dueDate) < new Date();
    
    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;
    
    // Then sort by priority
    const priorityOrder = {
      [TaskPriority.EMERGENCY]: 0,
      [TaskPriority.URGENT]: 1,
      [TaskPriority.HIGH]: 2,
      [TaskPriority.MEDIUM]: 3,
      [TaskPriority.LOW]: 4,
    };
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    // Finally sort by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading tasks...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tasks</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchTasks} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-gray-500 mt-1">
            Manage and track your assigned maintenance tasks
            {hotelName && ` for ${hotelName}`}
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssigned}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <HourglassIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
          </CardContent>
        </Card>
        
        <Card className={stats.overdueTasks > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.overdueTasks > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.overdueTasks > 0 ? "text-red-600" : ""}`}>
              {stats.overdueTasks}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Tabs */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="overdue" className={stats.overdueTasks > 0 ? "text-red-600" : ""}>
              Overdue ({stats.overdueTasks})
            </TabsTrigger>
            <TabsTrigger value="inprogress">In Progress ({stats.inProgressTasks})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pendingTasks})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderTaskList(sortedTasks)}
          </TabsContent>
          
          <TabsContent value="overdue">
            {renderTaskList(sortedTasks.filter(task => new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED))}
          </TabsContent>
          
          <TabsContent value="inprogress">
            {renderTaskList(sortedTasks.filter(task => task.status === TaskStatus.IN_PROGRESS))}
          </TabsContent>
          
          <TabsContent value="pending">
            {renderTaskList(sortedTasks.filter(task => task.status === TaskStatus.PENDING))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  function renderTaskList(tasks: Task[]) {
    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-gray-100 p-3 mb-3">
            <CheckCircle2 className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery
              ? "Try adjusting your search term"
              : "You don't have any assigned tasks"}
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {tasks.map((task) => (
          <Link href={`/staff/tasks/${task.id}`} key={task.id}>
            <Card className="h-full cursor-pointer transition-all hover:border-primary hover:shadow-md">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between">
                  <TaskPriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                </div>
                <CardTitle className="text-lg mt-2 line-clamp-1">{task.title}</CardTitle>
                {task.room && (
                  <CardDescription>
                    Room: {task.room.name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                
                <div className="mt-4 space-y-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="mr-1 h-3.5 w-3.5" />
                    Due: {formatDate(task.dueDate)}
                    {new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED && (
                      <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-700 border-red-200">
                        Overdue
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <BarChart4 className="mr-1 h-3.5 w-3.5" />
                    Category: {task.category.replace('_', ' ')}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Created {formatRelativeTime(task.createdAt)}
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    );
  }
}