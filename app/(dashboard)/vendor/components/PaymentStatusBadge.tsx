import { 
    Clock, 
    CheckCircle, 
    CreditCard, 
    XCircle, 
    RefreshCcw
  } from 'lucide-react';
  
  interface PaymentStatusBadgeProps {
    status: string;
    size?: 'sm' | 'md' | 'lg';
  }
  
  export default function PaymentStatusBadge({ status, size = 'sm' }: PaymentStatusBadgeProps) {
    let bgColor = '';
    let textColor = '';
    let icon = null;
    let label = '';
    
    switch (status.toUpperCase()) {
      case 'PENDING':
        bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
        textColor = 'text-yellow-800 dark:text-yellow-300';
        icon = <Clock className="h-3 w-3" />;
        label = 'Pending';
        break;
      case 'PAID':
        bgColor = 'bg-green-100 dark:bg-green-900/30';
        textColor = 'text-green-800 dark:text-green-300';
        icon = <CheckCircle className="h-3 w-3" />;
        label = 'Paid';
        break;
      case 'PARTIALLY_PAID':
        bgColor = 'bg-blue-100 dark:bg-blue-900/30';
        textColor = 'text-blue-800 dark:text-blue-300';
        icon = <CreditCard className="h-3 w-3" />;
        label = 'Partially Paid';
        break;
      case 'REFUNDED':
        bgColor = 'bg-purple-100 dark:bg-purple-900/30';
        textColor = 'text-purple-800 dark:text-purple-300';
        icon = <RefreshCcw className="h-3 w-3" />;
        label = 'Refunded';
        break;
      case 'FAILED':
        bgColor = 'bg-red-100 dark:bg-red-900/30';
        textColor = 'text-red-800 dark:text-red-300';
        icon = <XCircle className="h-3 w-3" />;
        label = 'Failed';
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
        sizeClasses = 'text-2xs px-1.5 py-0.5';
        break;
      case 'lg':
        sizeClasses = 'text-sm px-3 py-1';
        break;
      case 'md':
      default:
        sizeClasses = 'text-xs px-2 py-0.5';
    }
    
    return (
      <span className={`inline-flex items-center rounded-full ${bgColor} ${textColor} ${sizeClasses} font-medium`}>
        {icon && <span className="mr-0.5">{icon}</span>}
        {label}
      </span>
    );
  }