import pool from '@/lib/db';
import { ModuleType } from '@/lib/types/enums';
import { RowDataPacket } from 'mysql2';

/**
 * Check if a user has access to a specific module
 * This works for all user types (vendor, staff, admin)
 */
export async function canAccessModule(
  userId: string,
  moduleType: ModuleType
): Promise<boolean> {
  try {
    // Get user role
    const [userRows] = await pool.query(
      `SELECT role FROM users WHERE id = ?`,
      [userId]
    ) as [RowDataPacket[], any];

    if (userRows.length === 0) return false;

    const user = userRows[0];

    // Super admins always have access to all modules
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // For vendors, check their subscription plan
    if (user.role === 'VENDOR') {
      const [vendorRows] = await pool.query(
        `SELECT subscriptionPlanId, subscriptionStatus FROM vendors WHERE userId = ?`,
        [userId]
      ) as [RowDataPacket[], any];

      if (vendorRows.length === 0 || !vendorRows[0].subscriptionPlanId) {
        return false;
      }

      const vendor = vendorRows[0];

      // If subscription is not active, no access
      if (vendor.subscriptionStatus !== 'active') {
        return false;
      }

      // For now, if they have an active subscription plan, they have access to all modules
      // In the future, you can check plan_features for specific module limits
      return true;
    }

    // For staff, check if their vendor has access
    if (user.role === 'STAFF') {
      const [staffRows] = await pool.query(
        `SELECT vendorId FROM staff WHERE userId = ?`,
        [userId]
      ) as [RowDataPacket[], any];

      if (staffRows.length === 0) return false;

      const staff = staffRows[0];

      // Get vendor info and check module access
      const [vendorRows] = await pool.query(
        `SELECT userId FROM vendors WHERE id = ?`,
        [staff.vendorId]
      ) as [RowDataPacket[], any];

      if (vendorRows.length === 0) return false;

      return await canAccessModule(vendorRows[0].userId, moduleType);
    }

    // By default, customer users don't have access to any module
    return false;
  } catch (error) {
    console.error(`Error checking module access for userId: ${userId}, moduleType: ${moduleType}`, error);
    return false;
  }
}

export const moduleAccessService = {
  /**
   * Check if a vendor has access to a specific module
   */
  async hasModuleAccess(vendorIdOrUserId: string, moduleType: ModuleType): Promise<boolean> {
    try {
      // Get vendor data - can be called with either vendorId or userId
      let [vendorRows] = await pool.query(
        `SELECT subscriptionPlanId, subscriptionStatus FROM vendors WHERE id = ?`,
        [vendorIdOrUserId]
      ) as [RowDataPacket[], any];

      // If not found by id, try by userId
      if (vendorRows.length === 0) {
        [vendorRows] = await pool.query(
          `SELECT subscriptionPlanId, subscriptionStatus FROM vendors WHERE userId = ?`,
          [vendorIdOrUserId]
        ) as [RowDataPacket[], any];
      }

      if (vendorRows.length === 0 || !vendorRows[0].subscriptionPlanId) {
        return false;
      }

      const vendor = vendorRows[0];

      // If subscription is not active, no access
      if (vendor.subscriptionStatus !== 'active') {
        return false;
      }

      // Check if the subscription plan includes this module
      const [planFeatureRows] = await pool.query(
        `SELECT pf.isIncluded, m.name 
         FROM plan_features pf
         JOIN modules m ON pf.moduleId = m.id
         WHERE pf.planId = ? AND m.name = ?`,
        [vendor.subscriptionPlanId, moduleType]
      ) as [RowDataPacket[], any];

      if (planFeatureRows.length === 0) {
        return false;
      }

      const planFeature = planFeatureRows[0];
      return planFeature.isIncluded === 1 || planFeature.isIncluded === true;
    } catch (error) {
      console.error(`Error checking module access for vendorIdOrUserId: ${vendorIdOrUserId}, moduleType: ${moduleType}`, error);
      return false;
    }
  },

  /**
   * Get module limits for a vendor based on their subscription plan
   */
  async getModuleLimits(vendorIdOrUserId: string, moduleType: ModuleType): Promise<Record<string, any> | null> {
    try {
      // Get vendor data
      let [vendorRows] = await pool.query(
        `SELECT subscriptionPlanId FROM vendors WHERE id = ?`,
        [vendorIdOrUserId]
      ) as [RowDataPacket[], any];

      if (vendorRows.length === 0) {
        [vendorRows] = await pool.query(
          `SELECT subscriptionPlanId FROM vendors WHERE userId = ?`,
          [vendorIdOrUserId]
        ) as [RowDataPacket[], any];
      }

      if (vendorRows.length === 0 || !vendorRows[0].subscriptionPlanId) {
        return null;
      }

      // Get module limits from plan features
      const [planFeatureRows] = await pool.query(
        `SELECT pf.limits 
         FROM plan_features pf
         JOIN modules m ON pf.moduleId = m.id
         WHERE pf.planId = ? AND m.name = ?`,
        [vendorRows[0].subscriptionPlanId, moduleType]
      ) as [RowDataPacket[], any];

      if (planFeatureRows.length === 0 || !planFeatureRows[0].limits) {
        return null;
      }

      // Parse and return the limits
      try {
        return JSON.parse(planFeatureRows[0].limits as string);
      } catch {
        return planFeatureRows[0].limits as Record<string, any>;
      }
    } catch (error) {
      console.error(`Error getting module limits for vendorIdOrUserId: ${vendorIdOrUserId}, moduleType: ${moduleType}`, error);
      return null;
    }
  },

  /**
   * Check if a vendor has reached their limit for a specific resource
   */
  async hasReachedLimit(
    vendorIdOrUserId: string,
    moduleType: ModuleType,
    resourceType: string,
    currentCount: number
  ): Promise<boolean> {
    try {
      const limits = await this.getModuleLimits(vendorIdOrUserId, moduleType);

      // If no limits defined, assume unlimited
      if (!limits) {
        return false;
      }

      // Check if the specific resource has a limit
      if (limits[resourceType] === undefined) {
        return false; // No limit defined for this resource
      }

      // Check if the current count exceeds the limit
      return currentCount >= limits[resourceType];
    } catch (error) {
      console.error(
        `Error checking limit for vendorIdOrUserId: ${vendorIdOrUserId}, moduleType: ${moduleType}, resourceType: ${resourceType}`,
        error
      );
      return true; // Fail safe - assume limit reached on error
    }
  },

  /**
   * Get all modules with access status for a vendor
   */
  async getVendorModuleAccess(vendorIdOrUserId: string) {
    try {
      // Get vendor data
      let [vendorRows] = await pool.query(
        `SELECT id, subscriptionPlanId, subscriptionStatus FROM vendors WHERE id = ?`,
        [vendorIdOrUserId]
      ) as [RowDataPacket[], any];

      if (vendorRows.length === 0) {
        [vendorRows] = await pool.query(
          `SELECT id, subscriptionPlanId, subscriptionStatus FROM vendors WHERE userId = ?`,
          [vendorIdOrUserId]
        ) as [RowDataPacket[], any];
      }

      if (vendorRows.length === 0) {
        return [];
      }

      const vendor = vendorRows[0];

      // Get all active modules
      const [allModules] = await pool.query(
        `SELECT id, name, displayName FROM modules WHERE isActive = 1`
      ) as [RowDataPacket[], any];

      // If no active subscription, all modules are inaccessible
      if (!vendor.subscriptionPlanId || vendor.subscriptionStatus !== 'active') {
        return allModules.map((module: any) => ({
          ...module,
          hasAccess: false,
          limits: null,
        }));
      }

      // Get plan features for this vendor's subscription
      const [planFeatures] = await pool.query(
        `SELECT pf.moduleId, pf.isIncluded, pf.limits
         FROM plan_features pf
         WHERE pf.planId = ?`,
        [vendor.subscriptionPlanId]
      ) as [RowDataPacket[], any];

      // Map modules with access status and limits
      return allModules.map((module: any) => {
        const feature = planFeatures.find((f: any) => f.moduleId === module.id);
        const hasAccess = feature && feature.isIncluded === 1;
        const limits = feature && feature.limits ? JSON.parse(feature.limits as string) : null;

        return {
          ...module,
          hasAccess,
          limits,
        };
      });
    } catch (error) {
      console.error(`Error getting module access for vendorIdOrUserId: ${vendorIdOrUserId}`, error);
      return [];
    }
  },
};

export default moduleAccessService;