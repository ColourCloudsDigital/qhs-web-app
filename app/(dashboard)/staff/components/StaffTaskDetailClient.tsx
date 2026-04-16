'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskStatus, TaskPriority, TaskCategory } from '@/lib/types/enums';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  FileText,
  MessageSquare,
  ListChecks,
  Clock,
  User,
  MapPin,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import TaskStatusBadge from '@/app/(dashboard)/vendor/facility/components/TaskStatusBadge';
import TaskPriorityBadge from '@/app/(dashboard)/vendor/facility/components/TaskPriorityBadge';

interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  order: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  costEstimate?: number;
  actualCost?: number;
  createdAt: string;
  assignedTo?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  room?: {
    id: string;
    name: string;
  } | null;
  hotel?: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  comments: TaskComment[];
  checklist: ChecklistItem[];
}

interface StaffTaskDetailClientProps {
  taskId: string;
  staffId: string;
}

export default function StaffTaskDetailClient({
  taskId,
  staffId,
}: StaffTaskDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Helper function to safely format currency
  const formatCurrency = (value: any): string => {
    if (value === null || value === undefined) return '0.00';
    const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
    return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
  };

  // Fetch task details from API
  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/staff/tasks/${taskId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Task not found or you don\'t have permission to view it.');
        }
        throw new Error('Failed to fetch task details');
      }
      
      const data = await response.json();
      setTask(data.task);
      setSelectedStatus(data.task.status);
      
    } catch (err) {
      console.error('Error fetching task details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch task on component mount
  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const isOverdue = task && new Date(task.dueDate) < new Date() && 
    task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
  
  const handleStatusUpdate = async () => {
    if (!task || !selectedStatus || selectedStatus === task.status) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/staff/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          ...(selectedStatus === TaskStatus.COMPLETED ? { 
            completedAt: new Date().toISOString()
          } : {}),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
      
      // Update local task state
      setTask(prev => prev ? { ...prev, status: selectedStatus } : null);
      
      toast({
        title: "Success",
        description: `Task status updated to ${selectedStatus.replace('_', ' ').toLowerCase()}`,
      });
      
      // Add a comment about the status change if provided
      if (comment.trim()) {
        await submitComment();
      }
      
      // Refresh task data
      await fetchTaskDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: 'Failed to update task status',
      });
      // Reset selected status to current task status
      setSelectedStatus(task.status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const submitComment = async () => {
    if (!comment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      toast({
        title: "Success",
        description: 'Comment added successfully',
      });
      setComment('');
      
      // Refresh task data to show new comment
      await fetchTaskDetails();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: 'Failed to add comment',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading task details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Task</h3>
            <p className="text-gray-500 mb-4">{error || 'Task not found'}</p>
            <Button onClick={fetchTaskDetails} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Button>
      </div>

      {/* Task Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                {task.hotel && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {task.hotel.name}
                  </span>
                )}
                {task.room && (
                  <span>Room Number: {task.room.name}</span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <TaskPriorityBadge priority={task.priority} />
              <TaskStatusBadge status={task.status} />
              {isOverdue && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Update Section - Moved to top */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Select New Status</Label>
              <Select
                value={selectedStatus || task.status}
                onValueChange={(value) => setSelectedStatus(value as TaskStatus)}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={TaskStatus.ON_HOLD}>On Hold</SelectItem>
                </SelectContent>
              </Select>
              {selectedStatus && selectedStatus !== task.status && (
                <p className="text-sm text-blue-600 mt-1">
                  Status will change from "{task.status.replace('_', ' ')}" to "{selectedStatus.replace('_', ' ')}"
                </p>
              )}
            </div>
            
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdatingStatus || !selectedStatus || selectedStatus === task.status}
              className="w-full"
            >
              {isUpdatingStatus ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">
            <FileText className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="mr-2 h-4 w-4" />
            Comments ({task.comments.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle>Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {task.description || 'No description provided'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Due Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {task.category.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{task.createdBy.name}</span>
                  </div>
                </div>
                
                {task.estimatedHours && (
                  <div>
                    <Label className="text-sm font-medium">Estimated Hours</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{task.estimatedHours} hours</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Task Info */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Created Date</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{formatDate(task.createdAt)}</span>
                  </div>
                </div>
                
                {task.actualHours && (
                  <div>
                    <Label className="text-sm font-medium">Actual Hours</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{task.actualHours} hours</span>
                    </div>
                  </div>
                )}
                
                {task.completedAt && (
                  <div>
                    <Label className="text-sm font-medium">Completed Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{formatDate(task.completedAt)}</span>
                    </div>
                  </div>
                )}

                {task.costEstimate && (
                  <div>
                    <Label className="text-sm font-medium">Cost Estimate</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      ${formatCurrency(task.costEstimate)}
                    </p>
                  </div>
                )}

                {task.actualCost && (
                  <div>
                    <Label className="text-sm font-medium">Actual Cost</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      ${formatCurrency(task.actualCost)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add Comment Form in Details Tab */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add Comment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="detailsComment">Comment</Label>
                <Textarea
                  id="detailsComment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment about this task..."
                  rows={4}
                />
              </div>
              <Button
                onClick={submitComment}
                disabled={isSubmittingComment || !comment.trim()}
                size="sm"
              >
                {isSubmittingComment ? 'Adding...' : 'Add Comment'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comments & Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comments List */}
              <div className="space-y-3">
                {task.comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No comments yet. Add a comment in the Details tab.</p>
                  </div>
                ) : (
                  task.comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{comment.user.name}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}