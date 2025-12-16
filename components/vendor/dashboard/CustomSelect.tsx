import React from 'react';
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
}

export function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  loading = false,
  className,
}: CustomSelectProps) {
  // Find the selected option to display its label
  const selectedOption = options.find(option => option.value === value);
  
  return (
    <SelectPrimitive 
      value={value} 
      onValueChange={onChange}
      disabled={disabled || loading}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue>
          {selectedOption ? selectedOption.label : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <div className="flex items-center justify-center p-2">
            <span>Loading...</span>
          </div>
        ) : options.length === 0 ? (
          <div className="p-2 text-center text-sm text-gray-500">
            No options available
          </div>
        ) : (
          options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </SelectPrimitive>
  );
}