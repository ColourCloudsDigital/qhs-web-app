'use client';

import React, { useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface Column<T> {
  key: string;
  title: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  subtitle?: string;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  searchable?: boolean;
  onSearch?: (query: string) => void;
  actions?: React.ReactNode;
  loading?: boolean;
}

const DataTable = <T extends Record<string, any>>({
  data = [],
  columns = [],
  title,
  subtitle,
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  totalItems = 0,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  onSort,
  searchable = false,
  onSearch,
  actions,
  loading = false,
}: DataTableProps<T>) => {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (key: string) => {
    const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(direction);
    
    if (onSort) {
      onSort(key, direction);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (onSearch) {
      onSearch(query);
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;

    return (
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            className="form-select rounded-md border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-800"
            value={pageSize}
            onChange={(e) => onPageSizeChange && onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
          
          <div className="flex rounded-md">
            <button
              onClick={() => onPageChange && onPageChange(1)}
              disabled={currentPage === 1}
              className="rounded-l-md border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-y border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            
            <div className="flex border-y border-gray-300 bg-white px-4 py-1 text-sm dark:border-gray-700 dark:bg-gray-800">
              Page {currentPage} of {totalPages}
            </div>
            
            <button
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-y border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded-r-md border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <ChevronDoubleRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg bg-white shadow-md dark:bg-gray-800">
      {(title || searchable || actions) && (
        <div className="flex flex-col justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 md:flex-row md:items-center">
          <div>
            {title && <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
          </div>
          
          <div className="mt-3 flex flex-col items-stretch space-y-3 md:mt-0 md:flex-row md:items-center md:space-x-3 md:space-y-0">
            {searchable && (
              <div className="relative">
                <input
                  type="text"
                  className="form-input rounded-md border-gray-300 pr-10 text-sm dark:border-gray-700 dark:bg-gray-700"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            )}
            
            {actions}
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  scope="col" 
                  className="px-6 py-5 text-left text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  <div className="flex items-center h-8">
                    {column.title}
                    {column.sortable && (
                      <button 
                        className="ml-2 flex h-8 flex-col justify-center"
                        onClick={() => handleSort(column.key)}
                      >
                        <ChevronUpIcon 
                          className={`h-3.5 w-3.5 ${sortKey === column.key && sortDirection === 'asc' ? 'text-primary' : 'text-gray-400'}`} 
                        />
                        <ChevronDownIcon 
                          className={`h-3.5 w-3.5 ${sortKey === column.key && sortDirection === 'desc' ? 'text-primary' : 'text-gray-400'}`} 
                        />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-center">
                    <svg className="h-5 w-5 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {renderPagination()}
    </div>
  );
};

export default DataTable;