import { 
    Clock, 
    CheckCircle, 
    LogIn, 
    LogOut, 
    XCircle, 
    AlertTriangle
  } from 'lucide-react';
  
  interface BookingStatusBadgeProps {
    status: string;
    size?: 'sm' | 'md' | 'lg';
  }
  
  export default function BookingStatusBadge({ status, size = 'md' }: BookingStatusBadgeProps) {
    let bgColor = '';
    let textColor = '';
    let icon = null;
    let label = '';
    
    switch (status.toUpperCase()) {
      case 'PENDING':
        bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
        textColor = 'text-yellow-800 dark:text-yellow-300';
        icon = <Clock className="h-3.5 w-3.5" />;
        label = 'Pending';
        break;
      case 'CONFIRMED':
        bgColor = 'bg-blue-100 dark:bg-blue-900/30';
        textColor = 'text-blue-800 dark:text-blue-300';
        icon = <CheckCircle className="h-3.5 w-3.5" />;
        label = 'Confirmed';
        break;
      case 'CHECKED_IN':
        bgColor = 'bg-green-100 dark:bg-green-900/30';
        textColor = 'text-green-800 dark:text-green-300';
        icon = <LogIn className="h-3.5 w-3.5" />;
        label = 'Checked In';
        break;
      case 'CHECKED_OUT':
        bgColor = 'bg-purple-100 dark:bg-purple-900/30';
        textColor = 'text-purple-800 dark:text-purple-300';
        icon = <LogOut className="h-3.5 w-3.5" />;
        label = 'Checked Out';
        break;
      case 'CANCELLED':
        bgColor = 'bg-red-100 dark:bg-red-900/30';
        textColor = 'text-red-800 dark:text-red-300';
        icon = <XCircle className="h-3.5 w-3.5" />;
        label = 'Cancelled';
        break;
      case 'NO_SHOW':
        bgColor = 'bg-red-100 dark:bg-red-900/30';
        textColor = 'text-red-800 dark:text-red-300';
        icon = <AlertTriangle className="h-3.5 w-3.5" />;
        label = 'No Show';
        break;
      default:
        bgColor = 'bg-gray-100 dark:bg-gray-700/30';
        textColor = 'text-gray-800 dark:text-gray-300';
        label = status || 'Unknown';
    }
    
    // Set size classes
    let sizeClasses = '';
    switch (size) {
      case 'sm':
        sizeClasses = 'text-xs px-2 py-0.5';
        break;
      case 'lg':
        sizeClasses = 'text-sm px-3 py-1';
        break;
      case 'md':
      default:
        sizeClasses = 'text-xs px-2.5 py-0.5';
    }
    
    return (
      <span className={`inline-flex items-center rounded-full ${bgColor} ${textColor} ${sizeClasses} font-medium`}>
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </span>
    );
  }