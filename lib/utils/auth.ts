import { Session } from 'next-auth';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Check if user has permission to access a resource
export async function checkUserPermissions(
  session: Session | null,
  requiredRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.VENDOR]
): Promise<boolean> {
  if (!session?.user) {
    return false;
  }

  // If user is in one of the required roles, allow access
  if (requiredRoles.includes(session.user.role as UserRole)) {
    return true;
  }

  return false;
}

// Check if user has access to a specific hotel
export async function checkHotelAccess(
  session: Session | null,
  hotelId: string
): Promise<boolean> {
  if (!session?.user) {
    return false;
  }

  // Super admin has access to all hotels
  if (session.user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Vendor only has access to their own hotels
  if (session.user.role === UserRole.VENDOR) {
    try {
      // First get the vendor ID for this user
      const [vendorRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM vendors WHERE userId = ?`,
        [session.user.id]
      );

      if (vendorRows.length === 0) {
        return false;
      }

      const vendorId = vendorRows[0].id;

      // Then check if this vendor owns the hotel
      const [hotelRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM hotels WHERE id = ? AND vendorId = ?`,
        [hotelId, vendorId]
      );

      return hotelRows[0].count > 0;
    } catch (error) {
      console.error('[AUTH] Error checking hotel access:', error);
      return false;
    }
  }

  return false;
}

// Check if a user has access to a module based on their subscription
export async function checkModuleAccess(
  session: Session | null,
  moduleName: string
): Promise<boolean> {
  if (!session?.user) {
    return false;
  }

  // Super admin has access to all modules
  if (session.user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // For vendors, check their subscription
  if (session.user.role === UserRole.VENDOR) {
    try {
      // First get the vendor's subscription plan
      const [subscriptionRows] = await pool.query<RowDataPacket[]>(
        `SELECT sp.id as planId
         FROM vendors v
         JOIN subscription_plans sp ON v.subscriptionPlanId = sp.id
         WHERE v.userId = ?`,
        [session.user.id]
      );

      if (subscriptionRows.length === 0) {
        return false;
      }

      const planId = subscriptionRows[0].planId;

      // Check if the plan includes the requested module
      const [moduleRows] = await pool.query<RowDataPacket[]>(
        `SELECT pf.isIncluded
         FROM plan_features pf
         JOIN modules m ON pf.moduleId = m.id
         WHERE pf.planId = ? AND m.name = ?`,
        [planId, moduleName]
      );

      if (moduleRows.length === 0) {
        return false;
      }

      return moduleRows[0].isIncluded === 1;
    } catch (error) {
      console.error('[AUTH] Error checking module access:', error);
      return false;
    }
  }

  return false;
} 