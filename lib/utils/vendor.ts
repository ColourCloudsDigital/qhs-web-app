import { Session } from 'next-auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { RowDataPacket } from 'mysql2';

// Get the vendor ID for the current user
export async function getUserVendorId(session: Session | null): Promise<{ vendorId: string | null, selectedHotelId: string | null }> {
  if (!session?.user) {
    console.log('No session or user');
    return { vendorId: null, selectedHotelId: null };
  }

  try {
    // Log useful debug info
    console.log(`User role: ${session.user.role}`);
    console.log(`Is impersonating: ${(session.user as any).isImpersonating ? 'yes' : 'no'}`);
    
    // Get all hotels for testing purposes
    const [allHotels] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, vendorId FROM hotels LIMIT 5`
    );
    
    if (allHotels.length > 0) {
      console.log(`Found ${allHotels.length} hotels in database:`);
      allHotels.forEach((hotel: any) => {
        console.log(`Hotel: ${hotel.name}, ID: ${hotel.id}, VendorID: ${hotel.vendorId}`);
      });
    } else {
      console.log('No hotels found in system');
    }
    
    // If we're a super admin (impersonating or not), just use the first hotel
    if (session.user.role === UserRole.SUPER_ADMIN || 
       ((session.user as any).isImpersonating && (session.user as any).originalRole === UserRole.SUPER_ADMIN)) {
      console.log('Super admin is accessing vendor features - using first hotel');
      
      if (allHotels.length > 0) {
        return {
          vendorId: allHotels[0].vendorId,
          selectedHotelId: allHotels[0].id
        };
      }
      
      // Fallback for testing/development
      console.warn('No hotels found - using example ID from schema');
      return { 
        vendorId: '06a129c4-348f-11f0-b65f-9f7e9986d28a', 
        selectedHotelId: '06a129c4-348f-11f0-b65f-9f7e9986d28a'
      };
    }
    
    // For vendor users, get their vendor ID
    if (session.user.role === UserRole.VENDOR) {
      const [vendorRows] = await pool.query<RowDataPacket[]>(
        `SELECT v.id FROM vendors v
         WHERE v.userId = ?`,
        [session.user.id]
      );
      
      if (vendorRows.length === 0) {
        console.warn(`No vendor found for user ID: ${session.user.id}`);
        return { vendorId: null, selectedHotelId: null };
      }
      
      const vendorId = vendorRows[0].id;
      console.log(`Found vendor ID: ${vendorId}`);
      
      // Get the first hotel for this vendor
      const [hotelRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM hotels
         WHERE vendorId = ?
         ORDER BY createdAt ASC
         LIMIT 1`,
        [vendorId]
      );
      
      if (hotelRows.length === 0) {
        console.warn(`No hotels found for vendor ID: ${vendorId}`);
        return { vendorId, selectedHotelId: null };
      }
      
      console.log(`Found hotel ID: ${hotelRows[0].id}`);
      return { 
        vendorId, 
        selectedHotelId: hotelRows[0].id 
      };
    }
    
    console.warn(`User role ${session.user.role} is not supported for this operation`);
    return { vendorId: null, selectedHotelId: null };
  } catch (error) {
    console.error('[UTILS] Error getting vendor ID:', error);
    return { vendorId: null, selectedHotelId: null };
  }
}

// Check if a vendor has access to a specific hotel
export async function checkVendorHotelAccess(vendorId: string, hotelId: string): Promise<boolean> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM hotels
       WHERE id = ? AND vendorId = ?`,
      [hotelId, vendorId]
    );
    
    return rows[0].count > 0;
  } catch (error) {
    console.error('[UTILS] Error checking vendor hotel access:', error);
    return false;
  }
} 