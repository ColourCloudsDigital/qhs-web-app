import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface MiniCalendarProps {
  hotelId: string;
  onDateSelect?: (date: Date) => void;
  roomUnitId?: string;
}

interface BookingData {
  date: string;
  count: number;
  occupancyRate: number;
}

export default function MiniCalendar({ hotelId, onDateSelect, roomUnitId }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [bookingData, setBookingData] = useState<Record<string, BookingData>>({});
  const [loading, setLoading] = useState(false);

  // Fetch booking data for the current month
  useEffect(() => {
    const fetchMonthData = async () => {
      try {
        setLoading(true);
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const response = await fetch(
          `/api/vendor/hotels/${hotelId}/bookings/calendar?` + 
          `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}` +
          (roomUnitId ? `&roomUnitId=${roomUnitId}` : '')
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch booking data');
        }
        
        const data = await response.json();
        
        // Convert array to record keyed by date string
        const dataMap: Record<string, BookingData> = {};
        data.bookings.forEach((item: BookingData) => {
          dataMap[item.date.split('T')[0]] = item;
        });
        
        setBookingData(dataMap);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (hotelId) {
      fetchMonthData();
    }
  }, [hotelId, currentMonth, roomUnitId]);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get which day of the week the month starts on
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate array of day numbers
  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Previous month's days to display
    const prevMonthDays = [];
    if (firstDay > 0) {
      const prevMonth = new Date(year, month, 0);
      const prevMonthDaysCount = prevMonth.getDate();
      
      for (let i = firstDay - 1; i >= 0; i--) {
        prevMonthDays.push({
          date: new Date(year, month - 1, prevMonthDaysCount - i),
          isCurrentMonth: false
        });
      }
    }
    
    // Current month's days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month's days to display
    const totalDisplayedDays = prevMonthDays.length + currentMonthDays.length;
    const nextMonthDaysToShow = (totalDisplayedDays <= 35) ? (35 - totalDisplayedDays) : (42 - totalDisplayedDays);
    
    const nextMonthDays = [];
    for (let i = 1; i <= nextMonthDaysToShow; i++) {
      nextMonthDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // Go to previous month
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Go to next month
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  // Get classes for day cell based on bookings
  const getDayClasses = (day: { date: Date; isCurrentMonth: boolean }) => {
    const dateStr = day.date.toISOString().split('T')[0];
    const dayData = bookingData[dateStr];
    const occupancyRate = dayData?.occupancyRate || 0;
    const isBooked = dayData && dayData.count > 0;
    
    let bgColor = 'bg-white dark:bg-gray-800';
    let textColor = day.isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600';
    
    if (isToday(day.date)) {
      bgColor = 'bg-blue-50 dark:bg-blue-900/20';
      textColor = 'text-blue-700 dark:text-blue-400 font-bold';
    }
    
    if (isSelected(day.date)) {
      bgColor = 'bg-primary text-white dark:bg-primary';
      textColor = 'text-white font-bold';
    } else if (day.isCurrentMonth && isBooked) {
      if (roomUnitId) {
        // Room-specific: just show as occupied (blue)
        bgColor = 'bg-blue-100 dark:bg-blue-900/40';
        textColor = 'text-blue-800 dark:text-blue-200 font-medium';
      } else {
        if (occupancyRate >= 90) bgColor = 'bg-red-100 dark:bg-red-900/30';
        else if (occupancyRate >= 70) bgColor = 'bg-orange-100 dark:bg-orange-900/30';
        else if (occupancyRate >= 40) bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
        else bgColor = 'bg-green-100 dark:bg-green-900/30';
      }
    }
    
    return `${bgColor} ${textColor}`;
  };

  const days = generateDays();
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          {roomUnitId && (
            <p className="text-xs text-primary">Showing room bookings</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
        
        {days.map((day, index) => {
          const dateStr = day.date.toISOString().split('T')[0];
          const dayData = bookingData[dateStr];
          
          return (
            <div
              key={index}
              className={`relative flex h-7 w-full cursor-pointer items-center justify-center rounded-sm text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${getDayClasses(day)}`}
              onClick={() => handleDateSelect(day.date)}
            >
              {day.date.getDate()}
              {day.isCurrentMonth && dayData && dayData.count > 0 && (
                <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"></div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-2 flex items-center justify-center text-xs">
        {roomUnitId ? (
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 rounded-full bg-blue-400"></div>
            <span className="text-gray-500">Booked</span>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <span>0-40%</span>
            </div>
            <div className="mx-2">|</div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
              <span>40-70%</span>
            </div>
            <div className="mx-2">|</div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-orange-400"></div>
              <span>70-90%</span>
            </div>
            <div className="mx-2">|</div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-red-400"></div>
              <span>90%+</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
