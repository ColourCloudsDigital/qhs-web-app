import { useToast as useToastInternal, ToastOptions, ToastType } from "./toast";

export function useToast() {
  const { addToast, removeToast, toasts } = useToastInternal();

  return {
    toast: (options: ToastOptions) => {
      return addToast({ type: "default", ...options });
    },
    success: (message: string, options?: Omit<ToastOptions, "type" | "description">) => {
      return addToast({
        type: "success",
        title: options?.title || "Success",
        description: message,
        ...options,
      });
    },
    error: (message: string, options?: Omit<ToastOptions, "type" | "description">) => {
      return addToast({
        type: "error",
        title: options?.title || "Error",
        description: message,
        ...options,
      });
    },
    warning: (message: string, options?: Omit<ToastOptions, "type" | "description">) => {
      return addToast({
        type: "warning",
        title: options?.title || "Warning",
        description: message,
        ...options,
      });
    },
    info: (message: string, options?: Omit<ToastOptions, "type" | "description">) => {
      return addToast({
        type: "info",
        title: options?.title || "Info",
        description: message,
        ...options,
      });
    },
    dismiss: (toastId?: string) => {
      if (toastId) {
        removeToast(toastId);
      }
    },
    toasts,
  };
}