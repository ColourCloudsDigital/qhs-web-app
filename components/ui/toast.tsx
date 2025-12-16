import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export type ToastType = "default" | "success" | "error" | "warning" | "info";
type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  position: ToastPosition;
  setPosition: (position: ToastPosition) => void;
}

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  toast: Toast;
  onClose: () => void;
}

interface ToastProviderProps {
  children: React.ReactNode;
  defaultPosition?: ToastPosition;
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProviderComponent({
  children,
  defaultPosition = "bottom-right",
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [position, setPosition] = React.useState<ToastPosition>(defaultPosition);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { ...toast, id }]);
      
      // Auto-dismiss
      if (toast.duration !== Infinity) {
        const duration = toast.duration || 5000;
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      
      return id;
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider 
      value={{ 
        toasts, 
        addToast, 
        removeToast, 
        position, 
        setPosition 
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function Toast({ toast, onClose, className, ...props }: ToastProps) {
  const typeClasses = {
    default: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50",
  };

  const iconClasses = {
    default: "text-gray-400 dark:text-gray-500",
    success: "text-green-500 dark:text-green-400",
    error: "text-red-500 dark:text-red-400",
    warning: "text-amber-500 dark:text-amber-400",
    info: "text-blue-500 dark:text-blue-400",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm rounded-lg border shadow-lg",
        "transform transition-all duration-300 ease-in-out",
        typeClasses[toast.type],
        className
      )}
      {...props}
    >
      <div className="flex-1 p-4">
        {toast.title && (
          <h3 className={cn("font-medium", iconClasses[toast.type])}>
            {toast.title}
          </h3>
        )}
        {toast.description && (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {toast.description}
          </div>
        )}
      </div>
      <div className="flex">
        <button
          type="button"
          className="flex shrink-0 items-center justify-center rounded-tr-lg rounded-br-lg border-l p-2 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}

function ToastContainer() {
  const { toasts, removeToast, position } = useToast();

  const positionClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "top-center": "top-0 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
  };

  const getAnimationClasses = () => {
    if (position.includes("top")) {
      return "animate-in fade-in slide-in-from-top-5 duration-300";
    }
    return "animate-in fade-in slide-in-from-bottom-5 duration-300";
  };

  if (!toasts.length) return null;

  return (
    <div
      className={cn(
        "fixed z-50 m-4 flex flex-col gap-2",
        positionClasses[position]
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className={getAnimationClasses()}>
          <Toast toast={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}

export interface ToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  action?: React.ReactNode;
}