'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type: initialType, label, error, helperText, id, required, showPasswordToggle, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const [showPassword, setShowPassword] = React.useState(false);
    const type = showPasswordToggle && initialType === "password" 
      ? (showPassword ? "text" : "password") 
      : initialType;
    
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-900 mb-1.5 dark:text-gray-300"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            id={inputId}
            className={cn(
              "block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900",
              "placeholder:text-gray-400",
              "focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500",
              "transition-all duration-200",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              showPasswordToggle && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {showPasswordToggle && initialType === "password" && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-300"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };