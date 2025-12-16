import Link from 'next/link';
import { Bookmark, PlusCircle } from 'lucide-react';

export default function CustomerBookingsHeader() {
  return (
    <div className="mb-8">
      <div className="flex flex-col items-start justify-between space-y-3 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Bookings
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            View and manage your hotel bookings
          </p>
        </div>
        
        <Link
          href="/hotels"
          className="flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Book a Hotel
        </Link>
      </div>
    </div>
  );
}