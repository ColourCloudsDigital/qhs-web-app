import React from 'react';

interface PageHeadingProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeading({ title, description, actions }: PageHeadingProps) {
  return (
    <div className="mb-6 flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl dark:text-white">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
}