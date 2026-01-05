'use client';

import { useState } from 'react';
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
  Filter,
  Search,
  Wrench,
  HourglassIcon,
  BarChart4,
  BellRing,
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
}

interface StaffTasksClientProps {
  tasks: Task[];
  stats: TaskStats;
  staffId: string;
  hotelId?: string;
  hotelName?: string;
}

export default function StaffTasksClient({
  tasks: initialTasks,
  stats,
  staffId,
  hotelId,
  hotelName,
}: StaffTasksClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter tasks based on search query and active tab
  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.room?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab filter
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'overdue' && new Date(task.dueDate) < new Date()) ||
      (activeTab === 'inprogress' && task.status === 'IN_PROGRESS') ||
      (activeTab === 'pending' && task.status === 'PENDING');
    
    return matchesSearch && matchesTab;
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
      'EMERGENCY': 0,
      'URGENT': 1,
      'HIGH': 2,
      'MEDIUM': 3,
      'LOW': 4,
    };
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    // Finally sort by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  
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
                    Due: {formatDate(task.dueDate)}
            </TabsTrigger>
            <TabsTrigger value="inprogress">In Progress</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderTaskList(sortedTasks)}
          </TabsContent>
          
          <TabsContent value="overdue">
            {renderTaskList(sortedTasks)}
          </TabsContent>
          
          <TabsContent value="inprogress">
            {renderTaskList(sortedTasks)}
          </TabsContent>
          
          <TabsContent value="pending">
            {renderTaskList(sortedTasks)}
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
              : activeTab === "all"
              ? "You don't have any assigned tasks"
              : `You don't have any ${activeTab} tasks`}
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
                    {new Date(task.dueDate) < new Date() && (
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