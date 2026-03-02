import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';


// GET /api/subscriptions/vendor - Get the current vendor's subscription
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a vendor
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Vendor access only' }, { status: 403 });
    }

    // Get the vendor ID from the session
    const vendorId = session.user.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    // Get search params
    const searchParams = req.nextUrl.searchParams;
    const includePayments = searchParams.get('includePayments') === 'true';

    try {
      // Modify the vendor subscription query to properly join and retrieve plan data
      const [vendors] = await pool.query(`
        SELECT v.*, 
               sp.id as planId, 
               sp.name as planName, 
               sp.description as planDescription, 
               sp.price as planPrice, 
               sp.billingCycle, 
               sp.features, 
               sp.isActive as planIsActive
        FROM vendors v
        LEFT JOIN subscription_plans sp ON v.subscriptionPlanId = sp.id
        WHERE v.id = ? LIMIT 1
      `, [vendorId]);
      
      if (!vendors || (vendors as any[]).length === 0) {
        // Return a default free plan if no subscription is found
        return NextResponse.json({
          subscription: {
            id: 'free',
            name: 'Free Plan',
            price: 0,
            billingCycle: 'monthly',
            description: 'Basic features to get you started',
            features: {
              bookingLimit: 10,
              roomLimit: 5,
              staffLimit: 2,
              wifiDevices: 5,
              qrMenuItems: 20
            },
            subscriptionStatus: 'active'
          }
        });
      }
      
      const vendor = (vendors as any[])[0];

      // Parse features JSON if it exists
      let features = {};
      try {
        if (vendor.features) {
          features = typeof vendor.features === 'string' 
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

      // Use plan data instead of vendor data for plan fields
      const subscription = {
        id: vendor.planId || vendor.subscriptionPlanId,
        name: vendor.planName || 'Default Plan',
        description: vendor.planDescription || 'No description available',
        price: parseFloat(vendor.planPrice || '0'),
        billingCycle: vendor.billingCycle || 'monthly',
        planIsActive: Boolean(vendor.planIsActive),
        features: features,
        subscriptionStatus: vendor.subscriptionStatus,
        subscriptionStartDate: vendor.subscriptionStartDate,
        subscriptionEndDate: vendor.subscriptionEndDate,
        isActive,
        isExpired,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
      };
      
      // Get payment history if requested
      let paymentHistory = [];
      if (includePayments) {
        try {
          // First check if the subscription_payments table exists
          const [tableCheck] = await pool.query(`
            SELECT COUNT(*) as table_exists 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'subscription_payments'
          `);
          
          const tableExists = (tableCheck as any[])[0]?.table_exists > 0;
          
          if (tableExists) {
            // If table exists, query the payment history
            const [payments] = await pool.query(`
              SELECT sp.*, p.name as planName, p.price as planPrice 
              FROM subscription_payments sp
              JOIN subscription_plans p ON sp.subscriptionPlanId = p.id
              WHERE sp.vendorId = ?
              ORDER BY sp.createdAt DESC
              LIMIT 10
            `, [vendorId]);
            
            paymentHistory = payments as any[];
          } else {
            console.log('The subscription_payments table does not exist yet');
          }
        } catch (error) {
          console.error('Error fetching payment history:', error);
          // Continue with empty payment history
        }
      }

      return NextResponse.json({ 
        subscription, 
        ...(includePayments && { paymentHistory }) 
      });
    } catch (error) {
      console.error('Database error fetching vendor subscription:', error);
      return NextResponse.json(
        { error: 'Database error fetching subscription data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching vendor subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions/vendor - Update vendor's subscription plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate role - allow vendors to update their own subscription
    // and super admins to update any vendor's subscription
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { 
      planId, 
      vendorId: requestedVendorId, 
      startDate: startDateStr,
      paymentReference 
    } = body;

    // For vendors, we only allow them to update their own subscription
    let vendorId = session.user.vendorId;
    
    // For admins, they can specify which vendor to update
    if (session.user.role === UserRole.SUPER_ADMIN && requestedVendorId) {
      vendorId = requestedVendorId;
    }

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    try {
      // Calculate start and end dates
      const startDate = startDateStr ? new Date(startDateStr) : new Date();
      
      // Get plan details to calculate end date based on billing cycle
      const [plans] = await pool.query(
        `SELECT * FROM subscription_plans WHERE id = ? LIMIT 1`,
        [planId]
      );
      
      if (!plans || (plans as any[]).length === 0) {
        return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
      }
      
      const plan = (plans as any[])[0];
      
      // Calculate end date based on billing cycle
      let endDate = new Date(startDate);
      if (plan.billingCycle.toLowerCase() === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.billingCycle.toLowerCase() === 'yearly' || plan.billingCycle.toLowerCase() === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (plan.billingCycle.toLowerCase() === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (plan.billingCycle.toLowerCase() === 'biannual' || plan.billingCycle.toLowerCase() === 'semiannual') {
        endDate.setMonth(endDate.getMonth() + 6);
      }

      // Update the vendor's subscription
      await pool.query(`
        UPDATE vendors 
        SET subscriptionPlanId = ?, 
            subscriptionStartDate = ?, 
            subscriptionEndDate = ?,
            subscriptionStatus = ?
        WHERE id = ?
      `, [planId, startDate, endDate, 'active', vendorId]);

      // If there's a payment reference, log the subscription payment
      if (paymentReference) {
        await pool.query(`
          INSERT INTO subscription_payments 
          (id, vendorId, subscriptionPlanId, amount, paymentReference, status, paymentDate)
          VALUES (UUID(), ?, ?, ?, ?, 'COMPLETED', NOW())
        `, [vendorId, planId, parseFloat(plan.price), paymentReference]);
      }

      return NextResponse.json({
        success: true,
        subscription: {
          planId,
          startDate,
          endDate,
          status: 'active',
        },
      });
    } catch (error) {
      console.error('Database error updating vendor subscription:', error);
      return NextResponse.json(
        { error: 'Database error updating subscription' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating vendor subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions/vendor - Cancel vendor's subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate role - allow vendors to cancel their own subscription
    // and super admins to cancel any vendor's subscription
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const requestedVendorId = searchParams.get('vendorId');
    const reason = searchParams.get('reason');

    // For vendors, we only allow them to cancel their own subscription
    let vendorId = session.user.vendorId;
    
    // For admins, they can specify which vendor to cancel
    if (session.user.role === UserRole.SUPER_ADMIN && requestedVendorId) {
      vendorId = requestedVendorId;
    }

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    try {
      // Update vendor subscription status to cancelled
      await pool.query(`
        UPDATE vendors 
        SET subscriptionStatus = ?, 
            cancellationReason = ?
        WHERE id = ?
      `, ['cancelled', reason || null, vendorId]);

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    } catch (error) {
      console.error('Database error cancelling subscription:', error);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error cancelling vendor subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
