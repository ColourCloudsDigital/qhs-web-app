'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, required, ...props }, ref) => {
    // Always call useId, regardless of whether id is provided
    const generatedId = React.useId();
    // Use the provided id or fall back to the generated one
    const textareaId = id || generatedId;
    
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-base font-medium text-gray-700 dark:text-gray-300"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "block w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base text-gray-900",
            "placeholder:text-gray-400",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "resize-y min-h-[120px]",
            "dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };