'use client';

import { TaskStatus, TaskPriority, TaskCategory } from '@/lib/types/enums';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface Staff {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TaskFiltersProps {
  statusFilter: TaskStatus | null;
  setStatusFilter: (status: TaskStatus | null) => void;
  priorityFilter: TaskPriority | null;
  setPriorityFilter: (priority: TaskPriority | null) => void;
  categoryFilter: TaskCategory | null;
  setCategoryFilter: (category: TaskCategory | null) => void;
  assigneeFilter: string | null;
  setAssigneeFilter: (assigneeId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  staff: Staff[];
  onResetFilters: () => void;
}

export default function TaskFilters({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  assigneeFilter,
  setAssigneeFilter,
  searchQuery,
  setSearchQuery,
  staff,
  onResetFilters,
}: TaskFiltersProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-md mb-4 border">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={statusFilter || ''}
          onValueChange={(value) => setStatusFilter(value ? value as TaskStatus : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={priorityFilter || ''}
          onValueChange={(value) => setPriorityFilter(value ? value as TaskPriority : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
            <SelectItem value="EMERGENCY">Emergency</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={categoryFilter || ''}
          onValueChange={(value) => setCategoryFilter(value ? value as TaskCategory : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">All Categories</SelectItem>
            <SelectItem value="CLEANING">Cleaning</SelectItem>
            <SelectItem value="REPAIR">Repair</SelectItem>
            <SelectItem value="INSPECTION">Inspection</SelectItem>
            <SelectItem value="REPLACEMENT">Replacement</SelectItem>
            <SelectItem value="PREVENTIVE">Preventive</SelectItem>
            <SelectItem value="GUEST_REQUEST">Guest Request</SelectItem>
            <SelectItem value="IT_SUPPORT">IT Support</SelectItem>
            <SelectItem value="PLUMBING">Plumbing</SelectItem>
            <SelectItem value="ELECTRICAL">Electrical</SelectItem>
            <SelectItem value="HVAC">HVAC</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee Filter */}
        <Select
          value={assigneeFilter || ''}
          onValueChange={(value) => setAssigneeFilter(value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">All Staff</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {staff.map((staffMember) => (
              <SelectItem key={staffMember.id} value={staffMember.id}>
                {staffMember.user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset Button - Show only if at least one filter is active */}
      {(statusFilter || priorityFilter || categoryFilter || assigneeFilter || searchQuery) && (
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}