'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/services/toast.service';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Calendar, Check, X, Filter, ArrowUpDown } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface LockHistoryEntry {
  id: string;
  lockId: string;
  keycardId: string | null;
  keycard: {
    cardNumber: string;
    cardType: string;
  } | null;
  isSuccess: boolean;
  timestamp: string;
  accessType: string;
  entryData: string | null;
}

interface LockHistoryViewProps {
  lockId: string;
  onClose: () => void;
}

export default function LockHistoryView({
  lockId,
  onClose
}: LockHistoryViewProps) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<LockHistoryEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const limit = 10;

  useEffect(() => {
    fetchHistory();
  }, [lockId, currentPage, filter, sortOrder, startDate, endDate]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Build the query params
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString()
      });

      // Add filter parameters if needed
      if (filter === 'success') {
        queryParams.set('isSuccess', 'true');
      } else if (filter === 'failure') {
        queryParams.set('isSuccess', 'false');
      }

      // Add date filters if available
      if (startDate) {
        queryParams.set('startDate', new Date(startDate).toISOString());
      }
      if (endDate) {
        // Set end date to end of day
        const date = new Date(endDate);
        date.setHours(23, 59, 59, 999);
        queryParams.set('endDate', date.toISOString());
      }

      const response = await fetch(`/api/locks/${lockId}/history?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lock history');
      }

      const data = await response.json();
      
      // Sort the data based on timestamp
      let sortedData = [...data.history];
      if (sortOrder === 'asc') {
        sortedData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      } else {
        sortedData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      
      setHistory(sortedData);
      setTotalCount(data.meta.totalCount);
      setPageCount(Math.ceil(data.meta.totalCount / limit));
    } catch (error) {
      console.error('Error fetching lock history:', error);
      toast.error('Failed to load lock history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDateFilterApply = () => {
    setCurrentPage(1);
    fetchHistory();
  };

  const handleClearFilters = () => {
    setFilter('all');
    setSortOrder('desc');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Format the access type to be more readable
  const formatAccessType = (type: string) => {
    if (!type) return 'Unknown';
    // Convert CHECK_IN to "Check In"
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="success">Successful</SelectItem>
              <SelectItem value="failure">Failed</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSortChange}
            className="flex items-center"
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
              placeholder="Start Date"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
              placeholder="End Date"
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDateFilterApply}
              disabled={!startDate && !endDate}
            >
              Apply
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : history.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-3">
          <Calendar className="h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-medium">No access history found</h3>
          <p className="text-sm text-muted-foreground">
            {filter !== 'all' || startDate || endDate
              ? 'Try adjusting your filters.'
              : 'No access events have been recorded for this lock yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Access Type</TableHead>
                <TableHead>Keycard</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatTimestamp(entry.timestamp)}
                  </TableCell>
                  <TableCell>{formatAccessType(entry.accessType)}</TableCell>
                  <TableCell>
                    {entry.keycard ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{entry.keycard.cardNumber}</span>
                        <Badge variant="outline" className="w-fit">
                          {entry.keycard.cardType.charAt(0).toUpperCase() + 
                           entry.keycard.cardType.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.isSuccess ? (
                      <div className="flex items-center text-green-500">
                        <Check className="mr-1 h-4 w-4" />
                        <span>Success</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500">
                        <X className="mr-1 h-4 w-4" />
                        <span>Failed</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.entryData ? (
                      <span className="text-sm">{entry.entryData}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No details</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {!loading && pageCount > 1 && (
        <div className="flex items-center justify-center py-4">
          <Pagination
            currentPage={currentPage}
            totalPages={pageCount}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}