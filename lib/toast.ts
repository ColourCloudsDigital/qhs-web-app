// Non-hook based toast implementation

type ToastType = "default" | "success" | "error" | "warning" | "info";

interface ToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

// Global store for toast event handlers
let toastEventHandlers: {
  addToast?: (options: any) => string;
  removeToast?: (id: string) => void;
} = {};

// Function to register toast handlers from the ToastProvider component
export function registerToastHandlers(handlers: { 
  addToast: (options: any) => string; 
  removeToast: (id: string) => void;
}) {
  toastEventHandlers = handlers;
}

const toast = {
  // Basic toast with default styling
  custom: (options: ToastOptions) => {
    if (!toastEventHandlers.addToast) {
      console.warn("Toast provider not initialized yet.");
      return "";
    }
    
    return toastEventHandlers.addToast({
      title: options.title,
      description: options.description,
      type: options.type || "default",
      duration: options.duration,
    });
  },

  // Success toast
  success: (message: string, options?: Omit<ToastOptions, "type">) => {
    if (!toastEventHandlers.addToast) {
      console.warn("Toast provider not initialized yet.");
      return "";
    }
    
    return toastEventHandlers.addToast({
      title: options?.title || "Success",
      description: message,
      type: "success",
      duration: options?.duration,
    });
  },

  // Error toast
  error: (message: string, options?: Omit<ToastOptions, "type">) => {
    if (!toastEventHandlers.addToast) {
      console.warn("Toast provider not initialized yet.");
      return "";
    }
    
    return toastEventHandlers.addToast({
      title: options?.title || "Error",
      description: message,
      type: "error",
      duration: options?.duration,
    });
  },

  // Warning toast
  warning: (message: string, options?: Omit<ToastOptions, "type">) => {
    if (!toastEventHandlers.addToast) {
      console.warn("Toast provider not initialized yet.");
      return "";
    }
    
    return toastEventHandlers.addToast({
      title: options?.title || "Warning",
      description: message,
      type: "warning",
      duration: options?.duration,
    });
  },

  // Info toast
  info: (message: string, options?: Omit<ToastOptions, "type">) => {
    if (!toastEventHandlers.addToast) {
      console.warn("Toast provider not initialized yet.");
      return "";
    }
    
    return toastEventHandlers.addToast({
      title: options?.title || "Info",
      description: message,
      type: "info",
      duration: options?.duration,
    });
  },

  // Dismiss a specific toast by ID
  dismiss: (id: string) => {
    if (!toastEventHandlers.removeToast) {
      console.warn("Toast provider not initialized yet.");
      return;
    }
    
    toastEventHandlers.removeToast(id);
  },
};

export default toast;