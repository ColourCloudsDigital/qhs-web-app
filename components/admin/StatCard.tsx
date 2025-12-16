'use client';

import React, { ReactNode } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  changeText?: string;
  chartComponent?: ReactNode;
}

export default function StatCard({ title, value, icon, change, changeText, chartComponent }: StatCardProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <div className="flex justify-between">
        <div className="text-lg font-semibold text-gray-600 dark:text-gray-300">{title}</div>
        <div className="text-gray-500 dark:text-gray-400">{icon}</div>
      </div>
      
      <div className="mt-5 flex items-center">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
        {change !== undefined && (
          <div className={`ml-3 flex items-center rounded-full px-2 py-1 text-sm ${
            change >= 0 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {change >= 0 ? <ArrowUpIcon className="mr-1 h-3 w-3" /> : <ArrowDownIcon className="mr-1 h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      {changeText && (
        <div className="mt-5 flex items-center text-sm font-medium">
          {change !== undefined && change >= 0 ? 
            <ArrowUpIcon className="mr-2 h-4 w-4 text-green-500" /> : 
            <ArrowDownIcon className="mr-2 h-4 w-4 text-red-500" />
          }
          <span className={`${change !== undefined && change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {changeText}
          </span>
        </div>
      )}
      
      {chartComponent && <div className="mt-5">{chartComponent}</div>}
    </div>
  );
}