'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  minStartDate?: string;
  maxEndDate?: string;
  label?: {
    start?: string;
    end?: string;
  };
  disabled?: boolean;
  className?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minStartDate,
  maxEndDate,
  label = {
    start: 'Check-in',
    end: 'Check-out',
  },
  disabled = false,
  className = '',
}: DateRangePickerProps) {
  const [minEndDate, setMinEndDate] = useState<string>('');

  // Initialize defaults for min dates
  useEffect(() => {
    // If no minStartDate is provided, default to today
    if (!minStartDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const formattedToday = formatDateForInput(today);
      
      if (startDate && new Date(startDate) < today) {
        onStartDateChange(formattedToday);
      }
    }
    
    // Update minEndDate whenever startDate changes
    updateMinEndDate();
  }, [startDate, minStartDate]);

  // Update minimum end date based on start date
  const updateMinEndDate = () => {
    if (startDate) {
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setMinEndDate(formatDateForInput(nextDay));
      
      // Clear end date if it's before new min end date
      if (endDate && new Date(endDate) < nextDay) {
        onEndDateChange('');
      }
    } else {
      // If no start date, minimum end date is tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setMinEndDate(formatDateForInput(tomorrow));
    }
  };

  // Format date for input value
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Calculate default min start date if not provided
  const getMinStartDate = (): string => {
    if (minStartDate) return minStartDate;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return formatDateForInput(today);
  };

  // Calculate default max end date if not provided
  const getMaxEndDate = (): string => {
    if (maxEndDate) return maxEndDate;
    
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return formatDateForInput(oneYearFromNow);
  };

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      <div>
        <label
          htmlFor="startDate"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label.start}
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            min={getMinStartDate()}
            max={getMaxEndDate()}
            required
            disabled={disabled}
            className="block w-full rounded-md border border-gray-300 bg-white p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="endDate"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label.end}
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={minEndDate}
            max={getMaxEndDate()}
            required
            disabled={disabled || !startDate}
            className="block w-full rounded-md border border-gray-300 bg-white p-2.5 pl-10 text-gray-900 focus:border-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}