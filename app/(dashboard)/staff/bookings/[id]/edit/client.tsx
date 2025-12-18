'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar,
  Users,
  PenSquare,
  Save,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface BookingEditClientProps {
  booking: any;
  vendorId: string;
}

export default function BookingEditClient({ 
  booking,
  vendorId
}: BookingEditClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    checkInDate: booking.checkInDate ? new Date(booking.checkInDate).toISOString().split('T')[0] : '',
    checkOutDate: booking.checkOutDate ? new Date(booking.checkOutDate).toISOString().split('T')[0] : '',
    numberOfGuests: booking.numberOfGuests || 1,
    specialRequests: booking.specialRequests || ''
  });
  
  const [formErrors, setFormErrors] = useState({
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: ''
  });
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is changed
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {
      checkInDate: '',
      checkOutDate: '',
      numberOfGuests: ''
    };
    let isValid = true;
    
    // Check if dates are selected
    if (!formData.checkInDate) {
      errors.checkInDate = 'Check-in date is required';
      isValid = false;
    }
    
    if (!formData.checkOutDate) {
      errors.checkOutDate = 'Check-out date is required';
      isValid = false;
    }
    
    // Check if check-out is after check-in
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      
      if (checkOut <= checkIn) {
        errors.checkOutDate = 'Check-out date must be after check-in date';
        isValid = false;
      }
    }
    
    // Check number of guests
    const guests = Number(formData.numberOfGuests);
    if (isNaN(guests) || guests < 1) {
      errors.numberOfGuests = 'At least 1 guest is required';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkInDate: formData.checkInDate,
          checkOutDate: formData.checkOutDate,
          numberOfGuests: Number(formData.numberOfGuests),
          specialRequests: formData.specialRequests
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update booking');
      }
      
      router.push(`/vendor/bookings/${booking.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating booking:', error);
      // Handle error state
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Booking Information
          </h2>
          
          <div className="flex space-x-2">
            <Link
              href={`/vendor/bookings/${booking.id}`}
              className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Link>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking dates */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label 
                htmlFor="checkInDate" 
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Check-in Date *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="checkInDate"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${
                    formErrors.checkInDate 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white pl-10 pr-3 py-2 text-gray-900 focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white dark:focus:border-primary-light dark:focus:ring-primary-light sm:text-sm`}
                  required
                />
              </div>
              {formErrors.checkInDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {formErrors.checkInDate}
                </p>
              )}
            </div>
            
            <div>
              <label 
                htmlFor="checkOutDate" 
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Check-out Date *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="checkOutDate"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${
                    formErrors.checkOutDate 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white pl-10 pr-3 py-2 text-gray-900 focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white dark:focus:border-primary-light dark:focus:ring-primary-light sm:text-sm`}
                  required
                />
              </div>
              {formErrors.checkOutDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {formErrors.checkOutDate}
                </p>
              )}
            </div>
          </div>
          
          {/* Number of guests */}
          <div>
            <label 
              htmlFor="numberOfGuests" 
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Number of Guests *
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="numberOfGuests"
                name="numberOfGuests"
                min="1"
                value={formData.numberOfGuests}
                onChange={handleChange}
                className={`block w-full rounded-md border ${
                  formErrors.numberOfGuests 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white pl-10 pr-3 py-2 text-gray-900 focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white dark:focus:border-primary-light dark:focus:ring-primary-light sm:text-sm`}
                required
              />
            </div>
            {formErrors.numberOfGuests && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {formErrors.numberOfGuests}
              </p>
            )}
          </div>
          
          {/* Special Requests */}
          <div>
            <label 
              htmlFor="specialRequests" 
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Special Requests
            </label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              rows={4}
              value={formData.specialRequests}
              onChange={handleChange}
              className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-primary-light dark:focus:ring-primary-light sm:text-sm"
              placeholder="Enter any special requests or requirements"
            />
          </div>
          
          {/* Submit buttons */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6 dark:border-gray-700">
            <Link
              href={`/vendor/bookings/${booking.id}`}
              className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-primary dark:hover:bg-primary-dark dark:focus:ring-primary-light"
            >
              {isSubmitting ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 