'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Copy, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight, 
  Trash2,
  Search,
  Loader2,
  Calendar,
  User
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import toast from '@/lib/services/toast.service';
import CredentialDetailModal from './CredentialDetailModal';
import Pagination from '@/components/ui/pagination';

interface Credential {
  id: string;
  username: string;
  password: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  booking?: {
    id: string;
    checkInDate: string;
    checkOutDate: string;
    customer: {
      user: {
        name: string;
      };
    };
  };
  room?: {
    id: string;
    name: string;
    type: string;
  };
}

interface CredentialsListProps {
  hotelId: string;
  isActive: boolean;
  networkId?: string;
  onCredentialChanged?: () => void;
}

export default function CredentialsList({
  hotelId,
  isActive = true,
  networkId,
  onCredentialChanged,
}: CredentialsListProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch credentials
  const fetchCredentials = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/hotels/${hotelId}/wifi/credentials?isActive=${isActive}&search=${search}&page=${page}&limit=10`;
      
      // Add networkId filter if provided
      if (networkId) {
        url += `&networkId=${networkId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credentials');
      }

      const data = await response.json();
      setCredentials(data.credentials || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error(err instanceof Error ? err.message : 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refetch on dependency changes
  useEffect(() => {
    if (hotelId) {
      fetchCredentials();
    }
  }, [hotelId, isActive, search, page, networkId]);

  // Copy to clipboard
  const copyToClipboard = (text: string, what: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${what} copied to clipboard`);
      },
      (err) => {
        toast.error('Failed to copy: ' + err);
      }
    );
  };

  // Toggle credential status
  const toggleCredentialStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/wifi/credentials/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle credential status');
      }

      // Refresh the list
      fetchCredentials();
      // Notify parent
      if (onCredentialChanged) {
        onCredentialChanged();
      }

      toast.success('Credential status updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update credential');
    }
  };

  // Regenerate password
  const regeneratePassword = async (id: string) => {
    try {
      const response = await fetch(`/api/wifi/credentials/${id}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate password');
      }

      const updatedCredential = await response.json();
      
      // Update the credential in the list
      setCredentials(prev => 
        prev.map(cred => 
          cred.id === id 
            ? { ...cred, password: updatedCredential.password } 
            : cred
        )
      );
      
      toast.success('Password regenerated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate password');
    }
  };

  // Delete credential
  const deleteCredential = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    try {
      const response = await fetch(`/api/wifi/credentials/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete credential');
      }

      // Remove from the list
      setCredentials(prev => prev.filter(cred => cred.id !== id));
      // Notify parent
      if (onCredentialChanged) {
        onCredentialChanged();
      }

      toast.success('Credential deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete credential');
    }
  };

  // View credential details
  const viewCredentialDetails = (credential: Credential) => {
    setSelectedCredential(credential);
    setIsDetailModalOpen(true);
  };

  // Placeholder for empty state
  if (loading) {
    return (
      <div className="flex h-40 flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
        <Input
          type="search"
          placeholder="Search by username or guest name..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Credentials table */}
      {credentials.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Guest / Room</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((credential) => (
                <TableRow key={credential.id} onClick={() => viewCredentialDetails(credential)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {credential.username}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8" 
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(credential.username, 'Username');
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy username</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">•••••••••</span>
                      <div className="flex items-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(credential.password, 'Password');
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy password</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  regeneratePassword(credential.id);
                                }}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Regenerate password</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-xs">From: {formatDate(credential.validFrom)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-xs">To: {formatDate(credential.validTo)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {credential.booking ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{credential.booking.customer.user.name}</span>
                      </div>
                    ) : (
                      credential.room && (
                        <Badge variant="outline">
                          Room: {credential.room.name}
                        </Badge>
                      )
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCredentialStatus(credential.id);
                              }}
                            >
                              {credential.isActive ? (
                                <ToggleRight className="h-5 w-5 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-5 w-5 text-gray-400" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{credential.isActive ? 'Deactivate' : 'Activate'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive" 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCredential(credential.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete credential</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <h3 className="mb-2 text-lg font-semibold">No credentials found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {search ? 'Try a different search term' : 'Generate new credentials to get started'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Credential detail modal */}
      {selectedCredential && (
        <CredentialDetailModal
          credential={selectedCredential}
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onCredentialDeleted={() => {
            fetchCredentials();
            if (onCredentialChanged) {
              onCredentialChanged();
            }
          }}
          onCredentialToggled={() => {
            fetchCredentials();
            if (onCredentialChanged) {
              onCredentialChanged();
            }
          }}
          onPasswordRegenerated={(newPassword) => {
            setSelectedCredential({
              ...selectedCredential,
              password: newPassword,
            });
          }}
        />
      )}
    </div>
  );
}