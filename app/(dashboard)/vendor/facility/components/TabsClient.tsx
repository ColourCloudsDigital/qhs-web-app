"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import StaffTab from './StaffTab';
import RolesTab from './RolesTab';
import PermissionsTab from './PermissionsTab';
import { useHotel } from '@/contexts/HotelContext';

export default function TabsClient({hotels, vendorId}: {hotels: any[], vendorId: string}) {
  const { currentHotel, loading } = useHotel();
  console.log("Current Hotel: ", currentHotel);

  return (
    <Tabs defaultValue="staff">
      <TabsList className="flex border-b mb-4">
        <TabsTrigger value="staff" className="px-4 py-2 font-medium data-[state=active]:font-bold">Staff</TabsTrigger>
        <TabsTrigger value="roles" className="px-4 py-2 font-medium data-[state=active]:font-bold">Roles</TabsTrigger>
        {/* <TabsTrigger value="permissions" className="px-4 py-2 font-medium data-[state=active]:font-bold">Permissions</TabsTrigger> */}
      </TabsList>
      <TabsContent value="staff">
        <StaffTab hotelId={currentHotel?.id || ""} />
      </TabsContent>
      <TabsContent value="roles">
        <RolesTab hotelId={currentHotel?.id || ""} />
      </TabsContent>
      {/* <TabsContent value="permissions">
        <PermissionsTab />
      </TabsContent> */}
    </Tabs>
  );
} 