import { TaskPriority } from '@/lib/types/enums';
import { Badge } from '@/components/ui/badge';
import {
  Flag,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

export default function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  let color: string;
  let icon: JSX.Element;
  let label: string;

  switch (priority) {
    case 'LOW':
      color = 'bg-blue-50 text-blue-700 border-blue-200';
      icon = <Flag className="h-3.5 w-3.5 mr-1" />;
      label = 'Low';
      break;
    case 'MEDIUM':
      color = 'bg-yellow-50 text-yellow-700 border-yellow-200';
      icon = <Flag className="h-3.5 w-3.5 mr-1" />;
      label = 'Medium';
      break;
    case 'HIGH':
      color = 'bg-orange-50 text-orange-700 border-orange-200';
      icon = <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
      label = 'High';
      break;
    case 'URGENT':
      color = 'bg-red-50 text-red-700 border-red-200';
      icon = <AlertOctagon className="h-3.5 w-3.5 mr-1" />;
      label = 'Urgent';
      break;
    case 'EMERGENCY':
      color = 'bg-red-100 text-red-800 border-red-300 font-medium';
      icon = <AlertOctagon className="h-3.5 w-3.5 mr-1" />;
      label = 'Emergency';
      break;
    default:
      color = 'bg-gray-50 text-gray-700 border-gray-200';
      icon = <Flag className="h-3.5 w-3.5 mr-1" />;
      label = priority;
  }

  return (
    <Badge variant="outline" className={`${color} flex items-center`}>
      {icon}
      {label}
    </Badge>
  );
}