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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Key, RefreshCw } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import KeycardRegisterForm from './KeycardRegisterForm';
import KeycardDetailView from './KeycardDetailView';
import KeycardConfigureForm from './KeycardConfigureForm';
import KeycardAssignForm from './KeycardAssignForm';
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
}
  
interface Keycard {
    id: string;
    cardNumber: string;
    cardType: string;
    isActive: boolean;
    isConfigured: boolean;
    accessLevel: number;
    assignedToId: string | null;
    assignedTo: {
      id: string;
      customer: {
        user: {
          name: string;
        };
      };
    } | null;
    staffId: string | null;
    staff: {
      id: string;
      user: {
        name: string;
      };
    } | null;
    lock: Lock | null;
    validFrom: string | null;
    validTo: string | null;
    lastUsed: string | null;
    issueCount: number;
    createdAt: string;
    updatedAt: string;
}

interface KeycardManagementProps {
  hotelId: string;
  userRole: string;
  initialFilter?: string;
  initialPage: number;
  onFilterChange: (filter: string) => void;
  onPageChange: (page: number) => void;
}

export default function KeycardManagement({
  hotelId,
  userRole,
  initialFilter,
  initialPage,
  onFilterChange,
  onPageChange
}: KeycardManagementProps) {
  const [loading, setLoading] = useState(true);
  const [keycards, setKeycards] = useState<Keycard[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState(initialFilter || 'all');
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedKeycard, setSelectedKeycard] = useState<Keycard | null>(null);

  const limit = 10;

  useEffect(() => {
    fetchKeycards();
  }, [hotelId, currentPage, filter]);

  const fetchKeycards = async () => {
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
      } else if (filter === 'configured') {
        queryParams.set('isConfigured', 'true');
      } else if (filter === 'unconfigured') {
        queryParams.set('isConfigured', 'false');
      } else if (filter === 'assigned') {
        queryParams.set('assignedToId', 'not-null');
      }

      // Add search term if available
      if (searchTerm) {
        queryParams.set('searchTerm', searchTerm);
      }

      const response = await fetch(`/api/keycards?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch keycards');
      }

      const data = await response.json();
      setKeycards(data.keycards);
      setTotalCount(data.meta.totalCount);
      setPageCount(Math.ceil(data.meta.totalCount / limit));
    } catch (error) {
      console.error('Error fetching keycards:', error);
      toast.error('Failed to load keycards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeycards();
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
    fetchKeycards();
    toast.success('Keycards registered successfully.');
  };

  const handleConfigureSuccess = () => {
    setIsConfigureDialogOpen(false);
    fetchKeycards();
    toast.success('Keycard configured successfully.');
  };

  const handleAssignSuccess = () => {
    setIsAssignDialogOpen(false);
    fetchKeycards();
    toast.success('Keycard assigned successfully.');
  };

  const handleDeactivateKeycard = async (keycardId: string) => {
    try {
      const response = await fetch(`/api/keycards/${keycardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deactivate',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate keycard');
      }

      fetchKeycards();
      toast.success('Keycard deactivated successfully.');
    } catch (error) {
      console.error('Error deactivating keycard:', error);
      toast.error('Failed to deactivate keycard. Please try again.');
    }
  };

  const openConfigureDialog = (keycard: Keycard) => {
    setSelectedKeycard(keycard);
    setIsConfigureDialogOpen(true);
  };

  const openAssignDialog = (keycard: Keycard) => {
    setSelectedKeycard(keycard);
    setIsAssignDialogOpen(true);
  };

  const openDetailDialog = (keycard: Keycard) => {
    setSelectedKeycard(keycard);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Keycards</h2>
          <p className="text-muted-foreground">
            Manage RFID keycards for your hotel
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Register Keycards
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Register New Keycards</DialogTitle>
                <DialogDescription>
                  Add new RFID keycards to your system.
                </DialogDescription>
              </DialogHeader>
              <KeycardRegisterForm 
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
            placeholder="Search by card number or name..."
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
              <SelectItem value="all">All Keycards</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="configured">Configured</SelectItem>
              <SelectItem value="unconfigured">Unconfigured</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => fetchKeycards()}>
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
          ) : keycards.length === 0 ? (
            <div className="flex h-96 flex-col items-center justify-center space-y-3">
              <Key className="h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">No keycards found</h3>
              <p className="text-sm text-muted-foreground">
                {filter !== 'all'
                  ? 'Try changing your filter or register new keycards.'
                  : 'Get started by registering your first keycard.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lock / Room</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keycards.map((keycard) => (
                    <TableRow key={keycard.id}>
                      <TableCell className="font-medium">{keycard.cardNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {keycard.cardType.charAt(0).toUpperCase() + keycard.cardType.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge variant={keycard.isActive ? 'success' : 'destructive'}>
                            {keycard.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {keycard.isConfigured ? (
                            <Badge variant="secondary">Configured</Badge>
                          ) : (
                            <Badge variant="outline">Unconfigured</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {keycard.lock ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              {keycard.lock.serialNumber}
                            </span>
                            <span>
                              {keycard.lock.room ? keycard.lock.room.name : 'No Room'}
                            </span>
                          </div>
                        ) : (
                          'Not configured'
                        )}
                      </TableCell>
                      <TableCell>
                        {keycard.assignedTo ? (
                          keycard.assignedTo.customer.user.name
                        ) : keycard.staff ? (
                          <div className="flex flex-col">
                            <span>{keycard.staff.user.name}</span>
                            <span className="text-xs text-muted-foreground">Staff</span>
                          </div>
                        ) : (
                          'Unassigned'
                        )}
                      </TableCell>
                      <TableCell>
                        {keycard.validTo ? (
                          formatDate(keycard.validTo)
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailDialog(keycard)}
                          >
                            View
                          </Button>
                          
                          {!keycard.isConfigured && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openConfigureDialog(keycard)}
                            >
                              Configure
                            </Button>
                          )}
                          
                          {keycard.isConfigured && !keycard.assignedToId && !keycard.staffId && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openAssignDialog(keycard)}
                            >
                              Assign
                            </Button>
                          )}
                          
                          {keycard.isActive && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeactivateKeycard(keycard.id)}
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
            <DialogTitle>Keycard Details</DialogTitle>
          </DialogHeader>
          {selectedKeycard && (
            <KeycardDetailView 
              keycard={selectedKeycard} 
              hotelId={hotelId}
              onClose={() => setIsDetailDialogOpen(false)}
              onRefresh={fetchKeycards}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Configure Dialog */}
      <Dialog open={isConfigureDialogOpen} onOpenChange={setIsConfigureDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configure Keycard</DialogTitle>
            <DialogDescription>
              Configure this keycard for a specific lock.
            </DialogDescription>
          </DialogHeader>
          {selectedKeycard && (
            <KeycardConfigureForm 
              keycard={selectedKeycard} 
              hotelId={hotelId}
              onSuccess={handleConfigureSuccess}
              onCancel={() => setIsConfigureDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Assign Keycard</DialogTitle>
            <DialogDescription>
              Assign this keycard to a booking or staff member.
            </DialogDescription>
          </DialogHeader>
          {selectedKeycard && (
            <KeycardAssignForm 
              keycard={selectedKeycard} 
              hotelId={hotelId}
              onSuccess={handleAssignSuccess}
              onCancel={() => setIsAssignDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}