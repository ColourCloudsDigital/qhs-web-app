import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

// This is a catch-all route handler for marketing pages
export default function MarketingCatchAll({ params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  
  // If the path exists in our new structure, redirect to it
  // This handles any hardcoded links to the old structure
  try {
    redirect(`/marketing/${path}`);
  } catch (error) {
    notFound();
  }
} 