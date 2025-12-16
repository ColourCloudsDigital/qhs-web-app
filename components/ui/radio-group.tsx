import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  orientation?: "horizontal" | "vertical";
  required?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  name,
  value,
  defaultValue,
  onChange,
  label,
  error,
  helperText,
  className,
  orientation = "vertical",
  required,
}) => {
  const id = React.useId();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        className={cn(
          "space-y-2",
          orientation === "horizontal" && "flex flex-wrap space-y-0 space-x-4"
        )}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="radio"
              id={`${id}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              defaultChecked={defaultValue === option.value}
              onChange={handleChange}
              disabled={option.disabled}
              className={cn(
                "h-4 w-4 border-gray-300 text-primary focus:ring-primary",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-900",
                error && "border-red-500 text-red-500 focus:ring-red-500"
              )}
            />
            <label
              htmlFor={`${id}-${option.value}`}
              className={cn(
                "ml-2 block text-sm font-medium text-gray-700",
                "dark:text-gray-300",
                option.disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      
      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
};

export { RadioGroup };