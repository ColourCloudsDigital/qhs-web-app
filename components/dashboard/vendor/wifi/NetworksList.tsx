'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Wifi, Lock, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import NetworkModal from '@/components/dashboard/vendor/wifi/NetworkModal';
import toast from '@/lib/services/toast.service';

interface WiFiNetwork {
  id: string;
  hotelId: string;
  name: string;
  ssid: string;
  password: string;
  isPublic: boolean;
  bandwidthLimit?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface NetworksListProps {
  hotelId: string;
  onNetworkChanged?: () => void;
  onNetworkSelected?: (networkId: string | undefined) => void;
}

export default function NetworksList({ 
  hotelId, 
  onNetworkChanged,
  onNetworkSelected
}: NetworksListProps) {
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editNetwork, setEditNetwork] = useState<WiFiNetwork | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | undefined>(undefined);

  // Fetch networks
  const fetchNetworks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/hotels/${hotelId}/wifi/networks`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch WiFi networks');
      }
      
      const data = await response.json();
      setNetworks(data.networks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching networks');
      toast.error('Failed to load WiFi networks');
    } finally {
      setLoading(false);
    }
  };

  // Delete network
  const handleDelete = async (networkId: string) => {
    if (!confirm('Are you sure you want to delete this WiFi network?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/hotels/${hotelId}/wifi/networks/${networkId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete WiFi network');
      }
      
      toast.success('WiFi network deleted successfully');
      fetchNetworks();
      
      if (onNetworkChanged) {
        onNetworkChanged();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete WiFi network');
    }
  };

  // Edit network
  const handleEdit = (network: WiFiNetwork) => {
    setEditNetwork(network);
    setEditModalOpen(true);
  };

  // Select network for filtering credentials
  const handleNetworkSelect = (networkId: string) => {
    // If clicking the same network again, clear the filter
    if (selectedNetworkId === networkId) {
      setSelectedNetworkId(undefined);
      if (onNetworkSelected) {
        onNetworkSelected(undefined);
      }
    } else {
      setSelectedNetworkId(networkId);
      if (onNetworkSelected) {
        onNetworkSelected(networkId);
      }
    }
  };

  // Load data on component mount or hotelId change
  useEffect(() => {
    if (hotelId) {
      fetchNetworks();
    }
  }, [hotelId]);

  // Render loading state
  if (loading && networks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="error">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Render empty state
  if (!loading && networks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Wifi className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold">No WiFi Networks</h3>
          <p className="mb-4 text-sm text-gray-500">
            You haven't added any WiFi networks for this hotel yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render networks table
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SSID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Bandwidth Limit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {networks.map((network) => (
              <TableRow 
                key={network.id} 
                className={`cursor-pointer hover:bg-muted/50 ${selectedNetworkId === network.id ? 'bg-muted/50' : ''}`}
                onClick={() => handleNetworkSelect(network.id)}
              >
                <TableCell className="font-medium">{network.name}</TableCell>
                <TableCell>{network.ssid}</TableCell>
                <TableCell>
                  {network.isPublic ? (
                    <Badge variant="secondary" className="flex w-fit items-center gap-1">
                      <Globe size={14} /> Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex w-fit items-center gap-1">
                      <Lock size={14} /> Secure
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {network.bandwidthLimit 
                    ? `${network.bandwidthLimit} Mbps` 
                    : "Unlimited"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(network);
                      }}
                    >
                      <Edit size={16} />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(network.id);
                      }}
                    >
                      <Trash2 size={16} />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit modal */}
      {editNetwork && (
        <NetworkModal
          hotelId={hotelId}
          open={editModalOpen}
          network={editNetwork}
          onClose={() => {
            setEditModalOpen(false);
            setEditNetwork(null);
          }}
          onSuccess={() => {
            setEditModalOpen(false);
            setEditNetwork(null);
            fetchNetworks();
            if (onNetworkChanged) {
              onNetworkChanged();
            }
          }}
        />
      )}
    </>
  );
} 