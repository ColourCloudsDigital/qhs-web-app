import pool from '@/lib/db';
import { ModuleType } from '@/lib/types/enums';

// Define types for MySQL query results
type MySQLRow = Record<string, any>;

// Define TypeScript interfaces for our data
interface ModuleLimit {
  [key: string]: string | number;
}

// Features object with key-value pairs
interface FeaturesObject {
  [key: string]: boolean | string | number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  isActive: boolean;
  features: FeaturesObject;
  createdAt: Date;
  updatedAt: Date;
}

interface Module {
  id: string;
  type: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const subscriptionService = {
  /**
   * Get all subscription plans for display
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      // Get all active subscription plans
      const plans = await prisma.query(`
        SELECT * FROM subscription_plans 
        WHERE isActive = TRUE 
        ORDER BY price ASC
      `) as MySQLRow[];

      // Transform the subscription plans data
      const transformedPlans = plans.map((plan: MySQLRow) => {
        // Parse features JSON if it exists
        let featuresArray: FeaturesObject = {};
        try {
          if (plan.features) {
            featuresArray = typeof plan.features === 'string' 
              ? JSON.parse(plan.features)
              : plan.features;
          }
        } catch (error) {
          console.error('Error parsing features JSON:', error);
        }

        return {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: parseFloat(plan.price),
          billingCycle: plan.billingCycle,
          isActive: Boolean(plan.isActive),
          features: featuresArray || {},
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        };
      });

      return transformedPlans;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
  },

  /**
   * Get all active modules
   */
  async getModules(): Promise<Module[]> {
    try {
      const modules = await prisma.query(`
        SELECT * FROM modules 
        WHERE isActive = TRUE 
        ORDER BY name ASC
      `) as MySQLRow[];

      return modules.map((module: MySQLRow) => ({
        id: module.id,
        type: module.type,
        name: module.name,
        description: module.description,
        isActive: Boolean(module.isActive),
        createdAt: module.createdAt,
        updatedAt: module.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching modules:', error);
      return [];
    }
  },

  /**
   * Get subscription plan by ID
   */
  async getSubscriptionPlanById(id: string) {
    try {
      // Get the plan
      const plans = await prisma.query(`
        SELECT * FROM subscription_plans WHERE id = ? LIMIT 1
      `, [id]) as MySQLRow[];
      
      if (!plans || plans.length === 0) {
        return null;
      }
      
      const plan = plans[0];

      // Parse features JSON if it exists
      let featuresArray: FeaturesObject = {};
      try {
        if (plan.features) {
          featuresArray = typeof plan.features === 'string' 
            ? JSON.parse(plan.features)
            : plan.features;
        }
      } catch (error) {
        console.error('Error parsing features JSON:', error);
      }

      // Transform the plan data
      return {
        ...plan,
        price: parseFloat(plan.price),
        isActive: Boolean(plan.isActive),
        features: featuresArray || {},
      };
    } catch (error) {
      console.error(`Error fetching subscription plan with ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Get vendor's current subscription
   */
  async getVendorSubscription(vendorId: string) {
    try {
      // Get vendor with subscription plan
      const vendors = await prisma.query(`
        SELECT v.*, sp.* 
        FROM vendors v
        LEFT JOIN subscription_plans sp ON v.subscriptionPlanId = sp.id
        WHERE v.id = ? LIMIT 1
      `, [vendorId]) as MySQLRow[];
      
      if (!vendors || vendors.length === 0 || !vendors[0].subscriptionPlanId) {
        return null;
      }
      
      const vendor = vendors[0];

      // Parse features JSON if it exists
      let featuresArray: FeaturesObject = {};
      try {
        if (vendor.features) {
          featuresArray = typeof vendor.features === 'string' 
            ? JSON.parse(vendor.features)
            : vendor.features;
        }
      } catch (error) {
        console.error('Error parsing features JSON:', error);
      }

      // Add subscription status info
      const isActive = vendor.subscriptionStatus === 'active';
      const isExpired = vendor.subscriptionEndDate 
        ? new Date(vendor.subscriptionEndDate) < new Date() 
        : false;

      return {
        id: vendor.id,
        name: vendor.name,
        description: vendor.description,
        price: parseFloat(vendor.price || '0'),
        billingCycle: vendor.billingCycle,
        planIsActive: Boolean(vendor.isActive),
        features: featuresArray || {},
        subscriptionStatus: vendor.subscriptionStatus,
        subscriptionStartDate: vendor.subscriptionStartDate,
        subscriptionEndDate: vendor.subscriptionEndDate,
        isActive,
        isExpired,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
      };
    } catch (error) {
      console.error(`Error fetching subscription for vendor ${vendorId}:`, error);
      return null;
    }
  },

  /**
   * Update vendor's subscription
   */
  async updateVendorSubscription(
    vendorId: string,
    planId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
      paymentReference?: string;
    }
  ) {
    const { startDate, endDate, status, paymentReference } = options || {};
    
    try {
      // Begin transaction
      return await prisma.$transaction(async () => {
        // Verify the plan exists
        const plans = await prisma.query(`
          SELECT * FROM subscription_plans WHERE id = ? LIMIT 1
        `, [planId]) as MySQLRow[];

        if (!plans || plans.length === 0) {
          throw new Error('Subscription plan not found');
        }
        
        const plan = plans[0];

        // Update the vendor's subscription
        const updateFields = [];
        const updateValues = [];
        
        updateFields.push('subscriptionPlanId = ?');
        updateValues.push(planId);
        
        if (startDate) {
          updateFields.push('subscriptionStartDate = ?');
          updateValues.push(startDate);
        }
        
        if (endDate) {
          updateFields.push('subscriptionEndDate = ?');
          updateValues.push(endDate);
        }
        
        if (status) {
          updateFields.push('subscriptionStatus = ?');
          updateValues.push(status);
        }
        
        // Add vendor ID at the end of values for WHERE clause
        updateValues.push(vendorId);
        
        const updateQuery = `
          UPDATE vendors 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;
        
        await prisma.query(updateQuery, updateValues);

        // If there's a payment reference, log the subscription payment
        if (paymentReference) {
          await prisma.query(`
            INSERT INTO subscription_payments 
            (vendorId, subscriptionPlanId, amount, paymentReference, status, paymentDate)
            VALUES (?, ?, ?, ?, 'COMPLETED', NOW())
          `, [vendorId, planId, parseFloat(plan.price), paymentReference]);
        }

        // Get updated vendor data
        const updatedVendors = await prisma.query(`
          SELECT v.*, sp.* 
          FROM vendors v
          LEFT JOIN subscription_plans sp ON v.subscriptionPlanId = sp.id
          WHERE v.id = ? LIMIT 1
        `, [vendorId]) as MySQLRow[];
        
        return updatedVendors[0];
      });
    } catch (error) {
      console.error(`Error updating subscription for vendor ${vendorId}:`, error);
      throw error;
    }
  },

  /**
   * Calculate subscription end date based on billing cycle
   */
  calculateEndDate(startDate: Date, billingCycle: string): Date {
    const date = new Date(startDate);
    
    switch (billingCycle.toLowerCase()) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'biannually':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'annually':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default to monthly
    }
    
    return date;
  },

  /**
   * Cancel vendor's subscription
   */
  async cancelSubscription(vendorId: string, reason?: string) {
    try {
      // Update vendor's subscription status
      await prisma.query(`
        UPDATE vendors
        SET 
          subscriptionStatus = 'cancelled',
          cancelReason = ?
        WHERE id = ?
      `, [reason || null, vendorId]);

      // Log cancellation in subscription history
      await prisma.query(`
        INSERT INTO subscription_history
        (vendorId, action, notes, timestamp)
        VALUES (?, 'CANCELLED', ?, NOW())
      `, [vendorId, reason || 'Subscription cancelled']);

      return { success: true };
    } catch (error) {
      console.error(`Error cancelling subscription for vendor ${vendorId}:`, error);
      throw error;
    }
  },

  /**
   * Get vendor's payment history
   */
  async getVendorPaymentHistory(vendorId: string) {
    try {
      const payments = await prisma.query(`
        SELECT sp.*, p.name as planName
        FROM subscription_payments sp
        JOIN subscription_plans p ON sp.subscriptionPlanId = p.id
        WHERE sp.vendorId = ?
        ORDER BY sp.paymentDate DESC
      `, [vendorId]) as MySQLRow[];

      return payments.map((payment: MySQLRow) => ({
        id: payment.id,
        vendorId: payment.vendorId,
        subscriptionPlanId: payment.subscriptionPlanId,
        planName: payment.planName,
        amount: parseFloat(payment.amount),
        paymentReference: payment.paymentReference,
        status: payment.status,
        paymentDate: payment.paymentDate,
        createdAt: payment.createdAt,
      }));
    } catch (error) {
      console.error(`Error fetching payment history for vendor ${vendorId}:`, error);
      return [];
    }
  }
};

export const getSubscriptionPlans = subscriptionService.getSubscriptionPlans;
export const getModules = subscriptionService.getModules;
export const getSubscriptionPlanById = subscriptionService.getSubscriptionPlanById;
export const getVendorSubscription = subscriptionService.getVendorSubscription;
export const updateVendorSubscription = subscriptionService.updateVendorSubscription;
export const calculateEndDate = subscriptionService.calculateEndDate;
export const cancelSubscription = subscriptionService.cancelSubscription;
export const getVendorPaymentHistory = subscriptionService.getVendorPaymentHistory;