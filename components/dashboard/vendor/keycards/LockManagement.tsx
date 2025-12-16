'use client';

import { useState, useEffect } from 'react';
import toast from '@/lib/services/toast.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Lock, RefreshCw, AlertCircle, Battery } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import LockRegisterForm from './LockRegisterForm';
import LockDetailView from './LockDetailView';
import LockUpdateForm from './LockUpdateForm';
import LockHistoryView from './LockHistoryView';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface Lock {
  id: string;
  serialNumber: string;
  lockModel: string;
  roomId: string | null;
  room: {
    id: string;
    name: string;
  } | null;
  isActive: boolean;
  batteryLevel: number | null;
  lastMaintenance: string | null;
  firmwareVersion: string | null;
  installDate: string;
  _count: {
    keycards: number;
    lockHistory: number;
    lockErrors: number;
  };
}

interface LockManagementProps {
  hotelId: string;
  userRole: string; // Added this prop explicitly
  initialFilter?: string;
  initialPage: number;
  onFilterChange: (filter: string) => void;
  onPageChange: (page: number) => void;
}

export default function LockManagement({
  hotelId,
  userRole,
  initialFilter,
  initialPage,
  onFilterChange,
  onPageChange
}: LockManagementProps) {
  const [loading, setLoading] = useState(true);
  const [locks, setLocks] = useState<Lock[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState(initialFilter || 'all');
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedLock, setSelectedLock] = useState<Lock | null>(null);

  const limit = 10;

  useEffect(() => {
    fetchLocks();
  }, [hotelId, currentPage, filter]);

  const fetchLocks = async () => {
    setLoading(true);
    try {
      // Build the query params
      const queryParams = new URLSearchParams({
        hotelId,
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString()
      });

      // Add filter parameters if needed
      if (filter === 'active') {
        queryParams.set('isActive', 'true');
      } else if (filter === 'inactive') {
        queryParams.set('isActive', 'false');
      } else if (filter === 'withRoom') {
        queryParams.set('roomId', 'not-null');
      } else if (filter === 'withoutRoom') {
        queryParams.set('roomId', 'null');
      } else if (filter === 'lowBattery') {
        // This would need a custom API endpoint handling, we can simulate this on the frontend for now
      }

      // Add search term if available
      if (searchTerm) {
        queryParams.set('searchTerm', searchTerm);
      }

      const response = await fetch(`/api/locks?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch locks');
      }

      const data = await response.json();
      setLocks(data.locks);
      setTotalCount(data.meta.totalCount);
      setPageCount(Math.ceil(data.meta.totalCount / limit));
    } catch (error) {
      console.error('Error fetching locks:', error);
      toast.error('Failed to load locks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLocks();
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
    onFilterChange(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onPageChange(page);
  };

  const handleRegisterSuccess = () => {
    setIsRegisterDialogOpen(false);
    fetchLocks();
    toast.success('Lock registered successfully.');
  };

  const handleUpdateSuccess = () => {
    setIsUpdateDialogOpen(false);
    fetchLocks();
    toast.success('Lock updated successfully.');
  };

  const handleDeactivateLock = async (lockId: string) => {
    try {
      const response = await fetch(`/api/locks/${lockId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate lock');
      }

      fetchLocks();
      toast.success('Lock deactivated successfully.');
    } catch (error) {
      console.error('Error deactivating lock:', error);
      toast.error('Failed to deactivate lock. Please try again.');
    }
  };

  const openDetailDialog = (lock: Lock) => {
    setSelectedLock(lock);
    setIsDetailDialogOpen(true);
  };

  const openUpdateDialog = (lock: Lock) => {
    setSelectedLock(lock);
    setIsUpdateDialogOpen(true);
  };

  const openHistoryDialog = (lock: Lock) => {
    setSelectedLock(lock);
    setIsHistoryDialogOpen(true);
  };

  // Helper function to render the battery level indicator
  const renderBatteryLevel = (level: number | null) => {
    if (level === null) return 'Unknown';
    
    let color = 'text-green-500';
    if (level < 20) color = 'text-red-500';
    else if (level < 50) color = 'text-yellow-500';
    
    return (
      <div className="flex items-center">
        <Battery className={`h-4 w-4 mr-1 ${color}`} />
        <span>{level}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Door Locks</h2>
          <p className="text-muted-foreground">
            Manage door locks for your hotel rooms
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Register Lock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Register New Lock</DialogTitle>
                <DialogDescription>
                  Add a new door lock to your system.
                </DialogDescription>
              </DialogHeader>
              <LockRegisterForm 
                hotelId={hotelId} 
                onSuccess={handleRegisterSuccess} 
                onCancel={() => setIsRegisterDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
        <form onSubmit={handleSearch} className="flex flex-1 items-center space-x-2">
          <Input
            type="search"
            placeholder="Search by serial number or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="flex items-center space-x-2">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locks</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="withRoom">Assigned to Room</SelectItem>
              <SelectItem value="withoutRoom">Unassigned</SelectItem>
              <SelectItem value="lowBattery">Low Battery</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => fetchLocks()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : locks.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center space-y-3">
              <Lock className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">No locks found</h3>
              <p className="text-sm text-muted-foreground">
                {filter !== 'all'
                  ? 'Try changing your filter or register new locks.'
                  : 'Get started by registering your first door lock.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Battery</TableHead>
                    <TableHead>Keys</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locks.map((lock) => (
                    <TableRow key={lock.id}>
                      <TableCell className="font-medium">{lock.serialNumber}</TableCell>
                      <TableCell>{lock.lockModel}</TableCell>
                      <TableCell>
                        {lock.room ? (
                          lock.room.name
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={lock.isActive ? 'success' : 'destructive'}>
                          {lock.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {renderBatteryLevel(lock.batteryLevel)}
                      </TableCell>
                      <TableCell>
                        {lock._count.keycards} keycard{lock._count.keycards !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell>
                        {lock._count.lockErrors > 0 ? (
                          <div className="flex items-center text-red-500">
                            <AlertCircle className="mr-1 h-4 w-4" />
                            {lock._count.lockErrors}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailDialog(lock)}
                          >
                            View
                          </Button>
                          
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openUpdateDialog(lock)}
                          >
                            Update
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openHistoryDialog(lock)}
                          >
                            History
                          </Button>
                          
                          {lock.isActive && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeactivateLock(lock.id)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {!loading && pageCount > 1 && (
          <CardFooter className="flex items-center justify-center py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={pageCount}
              onPageChange={handlePageChange}
            />
          </CardFooter>
        )}
      </Card>
      
      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lock Details</DialogTitle>
          </DialogHeader>
          {selectedLock && (
            <LockDetailView 
              lock={selectedLock} 
              hotelId={hotelId}
              onClose={() => setIsDetailDialogOpen(false)}
              onRefresh={fetchLocks}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Lock</DialogTitle>
            <DialogDescription>
              Update the lock details and configuration.
            </DialogDescription>
          </DialogHeader>
          {selectedLock && (
            <LockUpdateForm 
              lock={selectedLock} 
              hotelId={hotelId}
              onSuccess={handleUpdateSuccess}
              onCancel={() => setIsUpdateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Lock Access History</DialogTitle>
            <DialogDescription>
              View the access history for this lock.
            </DialogDescription>
          </DialogHeader>
          {selectedLock && (
            <LockHistoryView 
              lockId={selectedLock.id}
              onClose={() => setIsHistoryDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}