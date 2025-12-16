import Link from "next/link";

export default function MarketingNotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Page Not Found</h1>
        <p className="mb-8 text-lg text-gray-600">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/marketing"
          className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Go back to home
        </Link>
      </div>
    </div>
  );
} 