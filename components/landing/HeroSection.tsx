'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, User } from 'lucide-react';
import ModernDatePicker, { DateRange } from '@/components/ui/ModernDatePicker';

export default function HeroSection() {
  const router = useRouter();
  const [searchLocation, setSearchLocation] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  });
  const [guests, setGuests] = useState(1);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Format dates for display
  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateForUrl = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare search parameters
    const params = new URLSearchParams();
    
    if (searchLocation) {
      params.append('location', searchLocation);
    }
    
    if (dateRange.startDate) {
      params.append('checkIn', formatDateForUrl(dateRange.startDate));
    }
    
    if (dateRange.endDate) {
      params.append('checkOut', formatDateForUrl(dateRange.endDate));
    }
    
    if (guests > 1) {
      params.append('guests', guests.toString());
    }
    
    // Redirect to search page with params
    router.push(`/hotels?${params.toString()}`);
  };

  return (
    <section className="relative flex min-h-[600px] items-center justify-center px-4 py-20 text-white">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image 
          src="/assets/images/sliders/slider-1.jpg" 
          alt="Hotel Background"
          fill
          sizes="100vw"
          className="object-cover"
          quality={90}
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 to-transparent z-10"></div>
      </div>

      <div className="container relative z-20 mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Qaras Hospitality Solutions
          </h1>
          <p className="mx-auto mb-2 max-w-2xl text-2xl font-semibold text-white/90">
            Hotel Booking & Management SaaS
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
            The complete solution for hotel owners and travelers
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto max-w-4xl rounded-lg bg-white/95 p-4 shadow-lg dark:bg-gray-800/95">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex flex-col gap-4">
              {/* Top Row: Location and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location */}
                <div className="group flex h-full flex-col rounded-lg border border-gray-300 p-3 transition-all focus-within:border-primary dark:border-gray-600">
                  <label htmlFor="location" className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Location
                  </label>
                  <div className="flex flex-1 items-center">
                    <MapPin className="mr-2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="location"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      placeholder="Where are you going?"
                      className="flex-1 border-0 bg-transparent p-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div 
                  className="group flex h-full cursor-pointer flex-col rounded-lg border border-gray-300 p-3 transition-all hover:border-gray-400 focus-within:border-primary dark:border-gray-600 dark:hover:border-gray-500"
                  onClick={() => setIsDatePickerOpen(true)}
                >
                  <label className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Dates
                  </label>
                  <div className="flex flex-1 items-center">
                    <Calendar className="mr-2 h-5 w-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {dateRange.startDate && dateRange.endDate 
                        ? `${formatDisplayDate(dateRange.startDate)} - ${formatDisplayDate(dateRange.endDate)}`
                        : "Add dates"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Guests and Search Button */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guests */}
                <div className="group flex h-full flex-col rounded-lg border border-gray-300 p-3 transition-all focus-within:border-primary dark:border-gray-600">
                  <label htmlFor="guests" className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Guests
                  </label>
                  <div className="flex flex-1 items-center">
                    <User className="mr-2 h-5 w-5 text-gray-400" />
                    <select
                      id="guests"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full border-0 bg-transparent p-0 text-gray-900 focus:outline-none focus:ring-0 dark:text-white"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="flex h-full items-center justify-center rounded-lg bg-primary p-3 text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Search hotels"
                >
                  <Search className="h-5 w-5 mr-2" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Date Picker Popup */}
            {isDatePickerOpen && (
              <ModernDatePicker
                onChange={handleDateChange}
                onClose={() => setIsDatePickerOpen(false)}
                initialStartDate={dateRange.startDate}
                initialEndDate={dateRange.endDate}
                minDate={new Date()}
                label="Select dates"
              />
            )}
          </form>
        </div>
      </div>
    </section>
  );
}