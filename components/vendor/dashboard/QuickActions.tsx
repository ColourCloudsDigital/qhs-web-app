import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, LogIn, Key, CalendarDays, Settings } from 'lucide-react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from '@/lib/toast';
import CheckInForm from './CheckInForm';
import WalkInBookingForm from '@/app/(dashboard)/vendor/components/WalkInBookingForm';

interface QuickActionsProps {
  hotelId: string;
  hotels: { id: string; name: string; }[];
  vendorId: string;
}

export default function QuickActions({ hotelId, hotels, vendorId }: QuickActionsProps) {
  const [activeTab, setActiveTab] = useState('walkin');
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const router = useRouter();

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'bookings':
        router.push(`/vendor/bookings?hotelId=${hotelId}`);
        break;
      case 'rooms':
        router.push(`/vendor/hotels/${hotelId}/rooms`);
        break;
      case 'settings':
        router.push(`/vendor/hotels/${hotelId}/edit`);
        break;
      default:
        setActiveTab(action);
        setIsActionDialogOpen(true);
        break;
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <Button 
          variant="outline"
          className="flex flex-col items-center justify-center gap-1 p-3 h-auto" 
          onClick={() => handleQuickAction('walkin')}
        >
          <PlusCircle className="h-6 w-6" />
          <span className="text-xs">Walk-in</span>
        </Button>
        
        <Button 
          variant="outline"
          className="flex flex-col items-center justify-center gap-1 p-3 h-auto" 
          onClick={() => handleQuickAction('checkin')}
        >
          <LogIn className="h-6 w-6" />
          <span className="text-xs">Check-in</span>
        </Button>
        
        <Button 
          variant="outline"
          className="flex flex-col items-center justify-center gap-1 p-3 h-auto" 
          onClick={() => handleQuickAction('keycard')}
        >
          <Key className="h-6 w-6" />
          <span className="text-xs">Issue Key</span>
        </Button>
        
        <Button 
          variant="outline"
          className="flex flex-col items-center justify-center gap-1 p-3 h-auto" 
          onClick={() => handleQuickAction('bookings')}
        >
          <CalendarDays className="h-6 w-6" />
          <span className="text-xs">Bookings</span>
        </Button>
        
        <Button 
          variant="outline"
          className="flex flex-col items-center justify-center gap-1 p-3 h-auto" 
          onClick={() => handleQuickAction('settings')}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs">Settings</span>
        </Button>
      </div>
      
      {/* Quick Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'walkin' && 'Create Walk-in Booking'}
              {activeTab === 'checkin' && 'Check-in Guest'}
              {activeTab === 'keycard' && 'Issue Keycard'}
            </DialogTitle>
          </DialogHeader>
          
          {activeTab === 'walkin' && <WalkInBookingForm hotels={hotels} vendorId={vendorId} />}
          {activeTab === 'checkin' && <CheckInForm hotelId={hotelId} onSuccess={() => setIsActionDialogOpen(false)} />}
          {activeTab === 'keycard' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="booking-id">Booking ID or Guest Name</Label>
                <Input id="booking-id" placeholder="Enter booking ID or search by guest name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keycard-number">Keycard Number</Label>
                <Input id="keycard-number" placeholder="Scan or enter keycard number" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keycard-type">Keycard Type</Label>
                <Select defaultValue="GUEST">
                  <SelectTrigger>
                    <SelectValue placeholder="Select keycard type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GUEST">Guest Keycard</SelectItem>
                    <SelectItem value="MASTER">Master Keycard</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency Keycard</SelectItem>
                    <SelectItem value="STAFF">Staff Keycard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="access-level">Access Level</Label>
                <Select defaultValue="1">
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 - Room Only</SelectItem>
                    <SelectItem value="2">Level 2 - Floor Access</SelectItem>
                    <SelectItem value="3">Level 3 - Building Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => {
                  toast.success("Keycard has been successfully issued to the guest.");
                  setIsActionDialogOpen(false);
                }}>Issue Keycard</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}