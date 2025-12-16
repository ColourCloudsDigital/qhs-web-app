import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
  ...props
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const totalPageNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    
    // If total pages are less than the page numbers we want to show
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }
    
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
    
    // Only show right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 1 + 2 * siblingCount;
      return [...range(1, leftItemCount), -1, totalPages];
    }
    
    // Only show left dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 1 + 2 * siblingCount;
      return [1, -1, ...range(totalPages - rightItemCount + 1, totalPages)];
    }
    
    // Show both dots
    if (shouldShowLeftDots && shouldShowRightDots) {
      return [
        1,
        -1,
        ...range(leftSiblingIndex, rightSiblingIndex),
        -2,
        totalPages,
      ];
    }
    
    return [];
  };
  
  // Helper to create a range of numbers
  const range = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div
      className={cn("flex items-center justify-center space-x-1 md:space-x-2", className)}
      {...props}
    >
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm",
          currentPage === 1
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      {pageNumbers.map((pageNumber, i) => {
        // Render ellipsis
        if (pageNumber === -1 || pageNumber === -2) {
          return (
            <span
              key={`ellipsis-${i}`}
              className="flex h-9 w-9 items-center justify-center"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }
        
        // Render page number
        return (
          <button
            key={pageNumber}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm",
              pageNumber === currentPage
                ? "bg-primary text-white"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        );
      })}
      
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm",
          currentPage === totalPages
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export interface PaginationInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export function PaginationInfo({
  className,
  currentPage,
  pageSize,
  totalItems,
  ...props
}: PaginationInfoProps) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  
  return (
    <div
      className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    >
      Showing <span className="font-medium">{start}</span> to{" "}
      <span className="font-medium">{end}</span> of{" "}
      <span className="font-medium">{totalItems}</span> results
    </div>
  );
}

export interface PaginationLimitProps extends React.HTMLAttributes<HTMLDivElement> {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  options?: number[];
}

export function PaginationLimit({
  className,
  pageSize,
  onPageSizeChange,
  options = [10, 25, 50, 100],
  ...props
}: PaginationLimitProps) {
  return (
    <div
      className={cn("flex items-center space-x-2 text-sm", className)}
      {...props}
    >
      <span className="text-gray-500 dark:text-gray-400">Show</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="h-9 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-gray-500 dark:text-gray-400">per page</span>
    </div>
  );
}

export default Pagination;