import { TaskStatus } from '@/lib/types/enums';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  PauseCircle,
} from 'lucide-react';

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  let color: string;
  let icon: JSX.Element;
  let label: string;

  switch (status) {
    case 'PENDING':
      color = 'bg-yellow-50 text-yellow-700 border-yellow-200';
      icon = <Clock className="h-3.5 w-3.5 mr-1" />;
      label = 'Pending';
      break;
    case 'IN_PROGRESS':
      color = 'bg-blue-50 text-blue-700 border-blue-200';
      icon = <Clock className="h-3.5 w-3.5 mr-1" />;
      label = 'In Progress';
      break;
    case 'COMPLETED':
      color = 'bg-green-50 text-green-700 border-green-200';
      icon = <CheckCircle2 className="h-3.5 w-3.5 mr-1" />;
      label = 'Completed';
      break;
    case 'CANCELLED':
      color = 'bg-gray-50 text-gray-700 border-gray-200';
      icon = <XCircle className="h-3.5 w-3.5 mr-1" />;
      label = 'Cancelled';
      break;
    case 'ON_HOLD':
      color = 'bg-purple-50 text-purple-700 border-purple-200';
      icon = <PauseCircle className="h-3.5 w-3.5 mr-1" />;
      label = 'On Hold';
      break;
    case 'OVERDUE':
      color = 'bg-red-50 text-red-700 border-red-200';
      icon = <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      label = 'Overdue';
      break;
    default:
      color = 'bg-gray-50 text-gray-700 border-gray-200';
      icon = <Clock className="h-3.5 w-3.5 mr-1" />;
      label = status;
  }

  return (
    <Badge variant="outline" className={`${color} flex items-center`}>
      {icon}
      {label}
    </Badge>
  );
}