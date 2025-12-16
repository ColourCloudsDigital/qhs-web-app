'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger, 
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import toast from '@/lib/services/toast.service';
import { cn } from '@/lib/utils';

interface BulkGenerateModalProps {
  hotelId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkGenerateModal({
  hotelId,
  open,
  onClose,
  onSuccess,
}: BulkGenerateModalProps) {
  // Form state
  const [quantity, setQuantity] = useState(10);
  const [prefix, setPrefix] = useState('guest');
  const [validFrom, setValidFrom] = useState<Date>(new Date());
  const [validTo, setValidTo] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 1 week from now
  const [isActive, setIsActive] = useState(true);
  
  // Form submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare data
      const data = {
        hotelId,
        quantity,
        prefix,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        isActive,
      };

      // Create credentials
      const response = await fetch('/api/wifi/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create credentials');
      }

      const credentials = await response.json();
      
      toast.success(`Successfully generated ${credentials.length} WiFi credentials`);
      
      // Reset form
      resetForm();
      
      // Notify parent
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create credentials');
      toast.error(err instanceof Error ? err.message : 'Failed to create credentials');
    } finally {
      setLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setQuantity(10);
    setPrefix('guest');
    setValidFrom(new Date());
    setValidTo(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setIsActive(true);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Generate WiFi Credentials</DialogTitle>
          <DialogDescription>
            Generate multiple WiFi credentials at once for your hotel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Quantity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="quantity">Quantity to generate</Label>
              <span className="text-sm font-medium">{quantity}</span>
            </div>
            <Slider
              id="quantity"
              value={[quantity]}
              min={1}
              max={100}
              step={1}
              onValueChange={(value) => setQuantity(value[0])}
              className="py-2"
            />
            <p className="text-xs text-gray-500">
              You can generate up to 100 credentials at once.
            </p>
          </div>

          {/* Prefix */}
          <div className="space-y-2">
            <Label htmlFor="prefix">Username prefix</Label>
            <Input
              id="prefix"
              placeholder="guest"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Usernames will be in the format {prefix}-[timestamp]-[number].
            </p>
          </div>

          {/* Valid date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valid from</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !validFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validFrom ? format(validFrom, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validFrom}
                    onSelect={(date) => date && setValidFrom(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Valid to</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !validTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validTo ? format(validTo, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={validTo}
                    onSelect={(date) => date && setValidTo(date)}
                    initialFocus
                    disabled={(date) => date < validFrom}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="isActive">Activate immediately</Label>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm font-medium text-destructive">{error}</div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Credentials'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}