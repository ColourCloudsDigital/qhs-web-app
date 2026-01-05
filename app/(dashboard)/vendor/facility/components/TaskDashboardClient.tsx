'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TaskStatus, TaskPriority, TaskCategory } from '@/lib/types/enums';
import { ChevronDown, Plus, Filter, RefreshCw } from 'lucide-react';
import TaskList from './TaskList';
import TaskStatsCards from './TaskStatsCards';
import TaskFilters from './TaskFilters';
import CreateTaskModal from './CreateTaskModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Hotel {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TaskStats {
  statusCounts: Array<{ status: TaskStatus; _count: number }>;
  priorityCounts: Array<{ priority: TaskPriority; _count: number }>;
  overdueTasks: number;
  totalTasks: number;
}

interface TaskDashboardClientProps {
  hotels: Hotel[];
  initialStats: TaskStats;
  staff: Staff[];
}

export default function TaskDashboardClient({
  hotels,
  initialStats,
  staff,
}: TaskDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get hotelId from query params or use the first hotel
  const initialHotelId = searchParams.get('hotelId') || hotels[0]?.id;
  
  const [selectedHotelId, setSelectedHotelId] = useState<string>(initialHotelId);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(
    hotels.find(h => h.id === initialHotelId) || null
  );
  
  const [stats, setStats] = useState<TaskStats>(initialStats);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch tasks and stats when hotel changes
  const fetchTaskStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks/stats?hotelId=${selectedHotelId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching task stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedHotelId]);
  
  useEffect(() => {
    if (selectedHotelId) {
      fetchTaskStats();
      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set('hotelId', selectedHotelId);
      router.push(`/vendor/facility/tasks?${params.toString()}`);
      
      // Update selected hotel object
      const hotel = hotels.find(h => h.id === selectedHotelId);
      if (hotel) {
        setSelectedHotel(hotel);
      }
    }
  }, [selectedHotelId, fetchTaskStats, hotels, router, searchParams]);
  
  const handleHotelChange = (hotelId: string) => {
    setSelectedHotelId(hotelId);
  };
  
  const handleCreateTask = () => {
    setIsCreateModalOpen(true);
  };
  
  const handleTaskCreated = () => {
    fetchTaskStats();
    setIsCreateModalOpen(false);
  };
  
  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };
  
  const handleResetFilters = () => {
    setStatusFilter(null);
    setPriorityFilter(null);
    setCategoryFilter(null);
    setAssigneeFilter(null);
    setSearchQuery('');
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Facility Management</h1>
          <p className="text-gray-500 mt-1">
            Manage maintenance tasks and track facility operations
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-dashed">
                {selectedHotel?.name || 'Select Hotel'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hotels.map((hotel) => (
                <DropdownMenuItem
                  key={hotel.id}
                  onClick={() => handleHotelChange(hotel.id)}
                >
                  {hotel.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleCreateTask}>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <TaskStatsCards stats={stats} isLoading={isLoading} />
      
      {/* Filters and Task List */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-lg font-semibold">Maintenance Tasks</h2>
          
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFilterToggle}
              className={showFilters ? "bg-gray-100" : ""}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTaskStats}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <TaskFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            assigneeFilter={assigneeFilter}
            setAssigneeFilter={setAssigneeFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            staff={staff}
            onResetFilters={handleResetFilters}
          />
        )}
        
        <TaskList
          hotelId={selectedHotelId}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          categoryFilter={categoryFilter}
          assigneeFilter={assigneeFilter}
          searchQuery={searchQuery}
          onTaskUpdate={fetchTaskStats}
        />
      </div>
      
      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        hotelId={selectedHotelId}
        staff={staff}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}