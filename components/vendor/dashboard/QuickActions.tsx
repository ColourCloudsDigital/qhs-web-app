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
      case 'walkin':
        router.push('/vendor/bookings/new');
        break;
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
              {activeTab === 'checkin' && 'Check-in Guest'}
            </DialogTitle>
          </DialogHeader>
          
          {activeTab === 'checkin' && <CheckInForm hotelId={hotelId} onSuccess={() => setIsActionDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}