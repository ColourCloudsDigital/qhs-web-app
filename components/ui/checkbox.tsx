import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  helperText?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void; // Added for compatibility
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, id, onChange, onCheckedChange, checked, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      if (onChange) {
        onChange(isChecked);
      }
      if (onCheckedChange) {
        onCheckedChange(isChecked);
      }
    };
    
    return (
      <div className="space-y-2">
        <div className="flex items-center">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id={checkboxId}
              className={cn(
                "peer h-4 w-4 rounded border-gray-300 text-black focus:ring-1 focus:ring-gray-500 focus:ring-offset-0",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-900",
                error && "border-red-500 text-red-500 focus:ring-red-500",
                "appearance-none",
                "checked:bg-black dark:checked:bg-gray-300",
                className
              )}
              onChange={handleChange}
              checked={checked}
              ref={ref}
              {...props}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100">
              <Check className="h-3 w-3 text-white dark:text-gray-900" />
            </div>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                "ml-2 block text-sm font-medium text-gray-700",
                "dark:text-gray-300",
                props.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {label}
            </label>
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

Checkbox.displayName = "Checkbox";

export { Checkbox };