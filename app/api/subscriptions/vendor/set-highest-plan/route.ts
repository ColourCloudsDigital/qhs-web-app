import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';
import { updateVendorSubscription, calculateEndDate } from '@/lib/services/subscription.service';

// POST /api/subscriptions/vendor/set-highest-plan - Sets the highest plan for the vendor
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate role - allow vendors to set their highest plan
    // and super admins to do it for any vendor
    if (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For vendors, we only allow them to update their own subscription
    let vendorId = session.user.vendorId;
    
    // For admins, they can specify which vendor to update
    if (session.user.role === UserRole.SUPER_ADMIN) {
      const body = await req.json();
      if (body.vendorId) {
        vendorId = body.vendorId;
      }
    }

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Get the highest plan (most expensive)
    const [planRows] = await pool.query(
      'SELECT * FROM subscription_plans WHERE isActive = true ORDER BY price DESC LIMIT 1'
    );
    
    const highestPlan = (planRows as any[])[0];
    
    if (!highestPlan) {
      return NextResponse.json({ error: 'No active subscription plans found' }, { status: 404 });
    }

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, highestPlan.billingCycle);

    // Update the vendor's subscription to the highest plan
    const updatedVendor = await updateVendorSubscription(vendorId, highestPlan.id, {
      startDate,
      endDate,
      status: 'active',
      paymentReference: `UPGRADE-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Upgraded to highest subscription plan',
      subscription: {
        id: highestPlan.id,
        name: highestPlan.name,
        price: highestPlan.price,
        billingCycle: highestPlan.billingCycle,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Error setting highest subscription plan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 