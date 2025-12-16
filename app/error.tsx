'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
          <h1 className="mb-4 text-3xl font-bold">Something went wrong</h1>
          <p className="mb-6 max-w-md text-gray-600">
            We encountered an error loading the page. This might be due to a temporary network issue or a problem with our application.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => reset()}
              className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Try again
            </button>
            <Link 
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
} 