import pool from '@/lib/db';
import { ModuleType } from '@/lib/types/enums';

/**
 * Check if a user has access to a specific module
 * This works for all user types (vendor, staff, admin)
 */
export async function canAccessModule(
  userId: string,
  moduleType: ModuleType
): Promise<boolean> {
  try {
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        vendor: {
          include: {
            subscriptionPlan: {
              include: {
                planFeatures: {
                  include: {
                    module: true,
                  },
                },
              },
            },
          },
        },
        staff: {
          include: {
            vendor: true,
            permissions: {
              include: {
                module: true
              }
            }
          }
        },
        superAdmin: true
      },
    });

    if (!user) return false;

    // Super admins always have access to all modules
    if (user.role === 'SUPER_ADMIN' && user.superAdmin) {
      return true;
    }

    // For vendors, check their subscription plan
    if (user.role === 'VENDOR' && user.vendor) {
      // If vendor has no subscription, they have no access
      if (!user.vendor.subscriptionPlan) {
        return false;
      }

      // If subscription is not active, no access
      if (user.vendor.subscriptionStatus !== 'active') {
        return false;
      }

      // If subscription has expired, no access
      if (user.vendor.subscriptionEndDate && user.vendor.subscriptionEndDate < new Date()) {
        return false;
      }

      // Check if the requested module is included in their plan
      const moduleFeature = user.vendor.subscriptionPlan.planFeatures.find(
        (feature) => feature.module.type === moduleType && feature.isIncluded
      );

      return !!moduleFeature;
    }

    // For staff, check if their vendor has access and if they have permission
    if (user.role === 'STAFF' && user.staff) {
      // First, check if staff has explicit permission for this module
      const hasPermission = user.staff.permissions.some(
        permission => permission.module.type === moduleType && permission.canView
      );

      // If staff doesn't have explicit permission, check their vendor's access
      if (!hasPermission && user.staff.vendor) {
        return await canAccessModule(user.staff.vendor.userId, moduleType);
      }

      return hasPermission;
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
  async hasModuleAccess(vendorId: string, moduleType: ModuleType): Promise<boolean> {
    try {
      // Get vendor with subscription plan
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          subscriptionPlan: {
            include: {
              planFeatures: {
                include: {
                  module: true,
                },
              },
            },
          },
        },
      });

      // If vendor has no subscription, they have no access
      if (!vendor || !vendor.subscriptionPlan) {
        return false;
      }

      // If subscription is not active, no access
      if (vendor.subscriptionStatus !== 'active') {
        return false;
      }

      // If subscription has expired, no access
      if (vendor.subscriptionEndDate && vendor.subscriptionEndDate < new Date()) {
        return false;
      }

      // Check if the requested module is included in their plan
      const moduleFeature = vendor.subscriptionPlan.planFeatures.find(
        (feature) => feature.module.type === moduleType && feature.isIncluded
      );

      return !!moduleFeature;
    } catch (error) {
      console.error(`Error checking module access for vendorId: ${vendorId}, moduleType: ${moduleType}`, error);
      return false;
    }
  },

  /**
   * Get module limits for a vendor
   */
  async getModuleLimits(vendorId: string, moduleType: ModuleType): Promise<Record<string, any> | null> {
    try {
      // Get vendor with subscription plan
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          subscriptionPlan: {
            include: {
              planFeatures: {
                include: {
                  module: true,
                },
              },
            },
          },
        },
      });

      // If vendor has no subscription or inactive, they have no limits defined
      if (
        !vendor ||
        !vendor.subscriptionPlan ||
        vendor.subscriptionStatus !== 'active' ||
        (vendor.subscriptionEndDate && vendor.subscriptionEndDate < new Date())
      ) {
        return null;
      }

      // Find the module feature
      const moduleFeature = vendor.subscriptionPlan.planFeatures.find(
        (feature) => feature.module.type === moduleType && feature.isIncluded
      );

      if (!moduleFeature || !moduleFeature.limits) {
        return null;
      }

      // Parse and return the limits
      return JSON.parse(moduleFeature.limits as string);
    } catch (error) {
      console.error(`Error getting module limits for vendorId: ${vendorId}, moduleType: ${moduleType}`, error);
      return null;
    }
  },

  /**
   * Check if a vendor has reached their limit for a specific resource
   */
  async hasReachedLimit(
    vendorId: string,
    moduleType: ModuleType,
    resourceType: string,
    currentCount: number
  ): Promise<boolean> {
    try {
      const limits = await this.getModuleLimits(vendorId, moduleType);

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
        `Error checking limit for vendorId: ${vendorId}, moduleType: ${moduleType}, resourceType: ${resourceType}`,
        error
      );
      return true; // Fail safe - assume limit reached on error
    }
  },

  /**
   * Get all modules with access status for a vendor
   */
  async getVendorModuleAccess(vendorId: string) {
    try {
      // Get all modules
      const allModules = await prisma.module.findMany({
        where: { isActive: true },
      });

      // Get vendor with subscription plan
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          subscriptionPlan: {
            include: {
              planFeatures: {
                include: {
                  module: true,
                },
              },
            },
          },
        },
      });

      // Check if subscription is active
      const isSubscriptionActive =
        vendor?.subscriptionStatus === 'active' &&
        (!vendor.subscriptionEndDate || vendor.subscriptionEndDate > new Date());

      // If vendor has no active subscription, all modules are inaccessible
      if (!vendor || !vendor.subscriptionPlan || !isSubscriptionActive) {
        return allModules.map((module) => ({
          ...module,
          hasAccess: false,
          limits: null,
        }));
      }

      // Map modules with access status and limits
      return allModules.map((module) => {
        const moduleFeature = vendor.subscriptionPlan!.planFeatures.find(
          (feature) => feature.moduleId === module.id && feature.isIncluded
        );

        const hasAccess = !!moduleFeature;
        const limits = moduleFeature?.limits ? JSON.parse(moduleFeature.limits as string) : null;

        return {
          ...module,
          hasAccess,
          limits,
        };
      });
    } catch (error) {
      console.error(`Error getting module access for vendorId: ${vendorId}`, error);
      throw new Error('Failed to retrieve module access information');
    }
  },
  
  // Export the canAccessModule function as part of the service
  canAccessModule
};

export default moduleAccessService;