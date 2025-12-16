'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
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
  createdAt?: string;
  updatedAt?: string;
}

interface NetworkModalProps {
  hotelId: string;
  open: boolean;
  network?: WiFiNetwork | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NetworkModal({ 
  hotelId, 
  open, 
  network, 
  onClose, 
  onSuccess 
}: NetworkModalProps) {
  const isEditing = !!network;
  
  // Form state
  const [formData, setFormData] = useState<Partial<WiFiNetwork>>(
    network || {
      id: uuidv4(),
      hotelId,
      name: '',
      ssid: '',
      password: '',
      isPublic: false,
      bandwidthLimit: undefined,
      notes: ''
    }
  );
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field if exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle switch change
  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  // Handle number input change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (value === '') {
      setFormData((prev) => ({ ...prev, [name]: undefined }));
      return;
    }
    
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue)) {
      setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Network name is required';
    }
    
    if (!formData.ssid?.trim()) {
      newErrors.ssid = 'SSID is required';
    }
    
    if (!formData.password?.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const url = isEditing 
        ? `/api/hotels/${hotelId}/wifi/networks/${network.id}`
        : `/api/hotels/${hotelId}/wifi/networks`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save WiFi network');
      }
      
      toast.success(
        isEditing 
          ? 'WiFi network updated successfully' 
          : 'WiFi network created successfully'
      );
      
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save WiFi network');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit WiFi Network' : 'Add WiFi Network'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Network Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="e.g., Hotel Lobby WiFi"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="ssid">SSID (Network Name)</Label>
              <Input
                id="ssid"
                name="ssid"
                value={formData.ssid || ''}
                onChange={handleChange}
                placeholder="e.g., HOTEL_WIFI"
                className={errors.ssid ? 'border-red-500' : ''}
              />
              {errors.ssid && (
                <p className="text-xs text-red-500">{errors.ssid}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="text" 
                value={formData.password || ''}
                onChange={handleChange}
                placeholder="Network password"
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Switch 
                id="isPublic" 
                checked={!!formData.isPublic}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="isPublic">Public Network (No password required)</Label>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bandwidthLimit">
                Bandwidth Limit (Mbps - leave empty for unlimited)
              </Label>
              <Input
                id="bandwidthLimit"
                name="bandwidthLimit"
                type="number"
                value={formData.bandwidthLimit?.toString() || ''}
                onChange={handleNumberChange}
                placeholder="e.g., 10"
                min="1"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                placeholder="Any additional information about this WiFi network"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Network' : 'Create Network'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 