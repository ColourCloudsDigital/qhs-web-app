'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void; // Added for compatibility
  disabled?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  size?: "sm" | "md" | "lg";
  name?: string;
  required?: boolean;
  className?: string;
  id?: string; // Added for compatibility
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ 
    checked, 
    defaultChecked, 
    onChange, 
    onCheckedChange,
    disabled, 
    className, 
    label, 
    error, 
    helperText, 
    size = "md", 
    name,
    required,
    id: providedId
  }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked || false);
    // Always call useId, regardless of whether id is provided
    const generatedId = React.useId();
    // Use the provided id or fall back to the generated one
    const id = providedId || generatedId;
    
    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      
      if (checked === undefined) {
        setIsChecked(newChecked);
      }
      
      onChange?.(newChecked);
      onCheckedChange?.(newChecked);
    };
    
    const sizeClasses = {
      sm: "h-5 w-9 after:h-3.5 after:w-3.5",
      md: "h-6 w-11 after:h-5 after:w-5",
      lg: "h-7 w-14 after:h-6 after:w-6",
    };
    
    const thumbPosition = {
      sm: isChecked ? "after:translate-x-4" : "after:translate-x-0.5",
      md: isChecked ? "after:translate-x-5" : "after:translate-x-0.5",
      lg: isChecked ? "after:translate-x-7" : "after:translate-x-0.5",
    };
    
    return (
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={id}
            ref={ref}
            name={name}
            checked={isChecked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
            required={required}
          />
          <label 
            htmlFor={id}
            className={cn(
              "relative inline-flex cursor-pointer rounded-full bg-gray-300 transition-colors duration-200 ease-in-out",
              isChecked && "bg-primary",
              disabled && "cursor-not-allowed opacity-50",
              sizeClasses[size],
              thumbPosition[size],
              `after:absolute after:top-0.5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 after:ease-in-out`,
              className
            )}
          />
          {label && (
            <span 
              className={cn(
                "ml-3 text-sm font-medium text-gray-700 dark:text-gray-300",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {label} {required && <span className="text-red-500">*</span>}
            </span>
          )}
        </div>
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : helperText ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };