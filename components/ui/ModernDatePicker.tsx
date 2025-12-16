'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';

// Export the DateRange interface as a named export
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface ModernDatePickerProps {
  onChange: (range: DateRange) => void;
  onClose: () => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  minDate?: Date;
  label?: string;
  inline?: boolean;
}

export default function ModernDatePicker({
  onChange,
  onClose,
  initialStartDate = null,
  initialEndDate = null,
  minDate = new Date(),
  label = 'Select dates',
  inline = false
}: ModernDatePickerProps) {
  const [tempSelectedRange, setTempSelectedRange] = useState<DateRange>({
    startDate: initialStartDate,
    endDate: initialEndDate
  });
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nextMonth, setNextMonth] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));

  useEffect(() => {
    if (initialStartDate) {
      setCurrentMonth(new Date(initialStartDate));
      setNextMonth(new Date(new Date(initialStartDate).setMonth(initialStartDate.getMonth() + 1)));
    }
  }, [initialStartDate]);

  const handleDateClick = (date: Date) => {
    if (!tempSelectedRange.startDate || (tempSelectedRange.startDate && tempSelectedRange.endDate)) {
      // Start a new selection
      setTempSelectedRange({
        startDate: date,
        endDate: null
      });
    } else {
      // Complete the selection
      if (date < tempSelectedRange.startDate) {
        setTempSelectedRange({
          startDate: date,
          endDate: tempSelectedRange.startDate
        });
      } else {
        setTempSelectedRange({
          startDate: tempSelectedRange.startDate,
          endDate: date
        });
      }
    }
  };

  const resetSelection = () => {
    setTempSelectedRange({ startDate: null, endDate: null });
  };

  const handleDateHover = (date: Date) => {
    if (tempSelectedRange.startDate && !tempSelectedRange.endDate) {
      setHoveredDate(date);
    }
  };

  const navigateToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
    
    const newNextMonth = new Date(nextMonth);
    newNextMonth.setMonth(newNextMonth.getMonth() - 1);
    setNextMonth(newNextMonth);
  };

  const navigateToNextMonth = () => {
    const nextMonthDate = new Date(currentMonth);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    setCurrentMonth(nextMonthDate);
    
    const newNextMonth = new Date(nextMonth);
    newNextMonth.setMonth(newNextMonth.getMonth() + 1);
    setNextMonth(newNextMonth);
  };

  const handleDone = () => {
    onChange(tempSelectedRange);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const generateMonthDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // First day of month
    const firstDay = new Date(year, monthIndex, 1);
    // Day of week (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Last day of month
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Previous month's days to show
    const prevMonthDays = [];
    const prevMonth = new Date(year, monthIndex, 0);
    const prevMonthTotalDays = prevMonth.getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push(new Date(year, monthIndex - 1, prevMonthTotalDays - i));
    }
    
    // Current month's days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push(new Date(year, monthIndex, i));
    }
    
    // Next month's days to show (to complete the grid)
    const nextMonthDays = [];
    const totalDaysToShow = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
    const nextMonthDaysToShow = totalDaysToShow - (prevMonthDays.length + currentMonthDays.length);
    
    for (let i = 1; i <= nextMonthDaysToShow; i++) {
      nextMonthDays.push(new Date(year, monthIndex + 1, i));
    }
    
    return { prevMonthDays, currentMonthDays, nextMonthDays };
  };

  const isDateInRange = (date: Date) => {
    if (!tempSelectedRange.startDate) return false;
    if (!tempSelectedRange.endDate && !hoveredDate) return false;
    
    const end = tempSelectedRange.endDate || hoveredDate;
    if (!end) return false;
    
    return date >= tempSelectedRange.startDate && date <= end;
  };

  const isStartDate = (date: Date) => {
    return tempSelectedRange.startDate && date.toDateString() === tempSelectedRange.startDate.toDateString();
  };

  const isEndDate = (date: Date) => {
    return tempSelectedRange.endDate && date.toDateString() === tempSelectedRange.endDate.toDateString();
  };

  const isDisabled = (date: Date) => {
    if (!minDate) return false;
    return date < new Date(minDate.setHours(0, 0, 0, 0));
  };

  const renderCalendarMonth = (month: Date) => {
    const { prevMonthDays, currentMonthDays, nextMonthDays } = generateMonthDays(month);
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    const weeks = [];
    
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    return (
      <div className="calendar-month">
        <div className="mb-2 md:mb-4 text-center font-medium text-sm md:text-base">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <div className="grid grid-cols-7 gap-0 md:gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
          
          {weeks.map((week, weekIndex) => (
            week.map((date, dayIndex) => {
              const isCurrentMonth = date.getMonth() === month.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              const isStart = isStartDate(date);
              const isEnd = isEndDate(date);
              const inRange = isDateInRange(date);
              const disabled = isDisabled(date);
              
              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    relative h-8 w-8 md:h-10 md:w-10 p-0 md:p-1
                    ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  `}
                  onClick={() => !disabled && isCurrentMonth && handleDateClick(date)}
                  onMouseEnter={() => handleDateHover(date)}
                >
                  <div className={`
                    flex h-full w-full items-center justify-center rounded-full text-xs md:text-sm
                    ${isToday && !isStart && !isEnd ? 'border border-primary' : ''}
                    ${isStart || isEnd ? 'bg-primary text-white' : ''}
                    ${inRange && !isStart && !isEnd ? 'bg-primary/10 text-gray-900 dark:text-white' : ''}
                    ${isCurrentMonth && !disabled && !isStart && !isEnd && !inRange ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white' : ''}
                    ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}
                  `}>
                    {date.getDate()}
                  </div>
                  
                  {/* Range background effect */}
                  {inRange && (
                    <>
                      {isStart && <div className="absolute inset-y-0 right-0 w-1/2 bg-primary/10" />}
                      {isEnd && <div className="absolute inset-y-0 left-0 w-1/2 bg-primary/10" />}
                      {!isStart && !isEnd && <div className="absolute inset-0 bg-primary/10" />}
                    </>
                  )}
                </div>
              );
            })
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`
      z-50 rounded-lg border border-gray-200 bg-white p-2 md:p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800
      ${inline ? '' : 'fixed md:absolute inset-x-2 md:inset-x-auto top-16 md:top-auto md:mt-2 md:left-0 md:right-0 min-w-[300px] md:min-w-[42rem] max-w-[calc(100%-1rem)] md:max-w-[42rem]'}
    `}>
      <div className="mb-2 md:mb-4 flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Select dates</h3>
        <div className="flex items-center gap-2">
          {(tempSelectedRange.startDate || tempSelectedRange.endDate) && (
            <button
              type="button"
              onClick={resetSelection}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              aria-label="Reset selection"
            >
              <X className="h-4 md:h-5 w-4 md:w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Date selection tabs (like Marriott) */}
      <div className="mb-4 md:mb-6 grid grid-cols-2 rounded-lg border border-gray-200 dark:border-gray-700">
        <button 
          className="rounded-l-lg bg-gray-50 py-1 md:py-2 text-xs md:text-sm font-medium text-gray-900 dark:bg-gray-800 dark:text-white"
          type="button"
        >
          Specific Dates
        </button>
        <button 
          className="rounded-r-lg py-1 md:py-2 text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400"
          type="button"
        >
          Flexible Dates
        </button>
      </div>

      <div className="flex gap-2 md:gap-4">
        <button
          type="button"
          onClick={navigateToPreviousMonth}
          className="self-center rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* On mobile, only show current month */}
          {renderCalendarMonth(currentMonth)}
          {/* Show next month on larger screens */}
          <div className="hidden md:block">
            {renderCalendarMonth(nextMonth)}
          </div>
        </div>

        <button
          type="button"
          onClick={navigateToNextMonth}
          className="self-center rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2 md:mt-4 flex items-center justify-between">
        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
          {tempSelectedRange.startDate && tempSelectedRange.endDate && (
            <>
              {Math.ceil(
                (tempSelectedRange.endDate.getTime() - tempSelectedRange.startDate.getTime()) / 
                (1000 * 60 * 60 * 24)
              )} {Math.ceil(
                (tempSelectedRange.endDate.getTime() - tempSelectedRange.startDate.getTime()) / 
                (1000 * 60 * 60 * 24)
              ) === 1 ? 'night' : 'nights'}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-gray-300 px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="rounded-md bg-primary px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm text-white hover:bg-primary-dark"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}