'use client';

import { format } from 'date-fns';
import { TaskStatus, MaintenanceType } from '@/lib/types/enums';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  User,
  Wrench,
  BarChart4,
} from 'lucide-react';

interface TaskDetailsTabProps {
  description: string;
  dueDate: string;
  category: string;
  maintenanceType: MaintenanceType;
  creatorName: string;
  estimatedHours?: number;
  costEstimate?: number;
  actualHours: string;
  setActualHours: (value: string) => void;
  onActualHoursChange: () => void;
  status: TaskStatus;
  isUpdatingStatus: boolean;
  onStatusChange: (status: TaskStatus) => void;
  isOverdue: boolean;
}

export default function TaskDetailsTab({
  description,
  dueDate,
  category,
  maintenanceType,
  creatorName,
  estimatedHours,
  costEstimate,
  actualHours,
  setActualHours,
  onActualHoursChange,
  status,
  isUpdatingStatus,
  onStatusChange,
  isOverdue,
}: TaskDetailsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Wrench className="mr-2 h-5 w-5" />
          Task Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">Description</h3>
          <p className="text-sm text-gray-700 whitespace-pre-line">{description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Due Date</h3>
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
              {format(new Date(dueDate), 'PPP')}
              {isOverdue && (
                <span className="ml-2 text-red-500 font-medium">Overdue</span>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-1">Category</h3>
            <div className="flex items-center text-sm">
              <BarChart4 className="mr-2 h-4 w-4 text-gray-500" />
              {category.replace('_', ' ')}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-1">Maintenance Type</h3>
            <div className="flex items-center text-sm">
              <Wrench className="mr-2 h-4 w-4 text-gray-500" />
              {maintenanceType.replace('_', ' ')}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-1">Created By</h3>
            <div className="flex items-center text-sm">
              <User className="mr-2 h-4 w-4 text-gray-500" />
              {creatorName}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-1">Estimated Hours</h3>
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-gray-500" />
              {estimatedHours ?? 'Not specified'}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-1">Cost Estimate</h3>
            <div className="flex items-center text-sm">
              <span className="mr-2">₦</span>
              {costEstimate ? costEstimate.toLocaleString() : 'Not specified'}
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-sm font-semibold mb-2">Update Actual Hours Spent</h3>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="Enter hours"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              className="max-w-[150px]"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={onActualHoursChange}
            >
              Update
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-sm font-semibold mb-2">Change Status</h3>
          <div className="flex flex-wrap gap-2">
            {status !== 'PENDING' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onStatusChange('PENDING')}
                disabled={isUpdatingStatus}
              >
                Mark as Pending
              </Button>
            )}
            
            {status !== 'IN_PROGRESS' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onStatusChange('IN_PROGRESS')}
                disabled={isUpdatingStatus}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                Mark as In Progress
              </Button>
            )}
            
            {status !== 'ON_HOLD' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onStatusChange('ON_HOLD')}
                disabled={isUpdatingStatus}
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                Mark as On Hold
              </Button>
            )}
            
            {status !== 'COMPLETED' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onStatusChange('COMPLETED')}
                disabled={isUpdatingStatus}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                Mark as Completed
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}