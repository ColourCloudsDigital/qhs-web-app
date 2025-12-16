import React from 'react';

interface DashboardSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function DashboardSection({
  title,
  description,
  children
}: DashboardSectionProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="mt-2 text-gray-600 dark:text-gray-300">{description}</p>
        )}
      </div>
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
} 