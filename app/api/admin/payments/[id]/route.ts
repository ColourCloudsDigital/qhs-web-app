import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if vendors and subscription_plans tables exist
    const [tableCheckResult] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'vendors') as vendors_exists,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'subscription_plans') as plans_exists
    `);
    
    const { vendors_exists, plans_exists } = (tableCheckResult as any[])[0];

    // Build query for payment details based on available tables
    let query = `SELECT p.* `;
    
    // Add vendor fields if vendors table exists
    if (vendors_exists) {
      query += `, 
        v.id as vendor_id,
        v.name as vendor_name,
        v.email as vendor_email
      `;
    }
    
    // Add subscription plan fields if subscription_plans table exists
    if (plans_exists) {
      query += `, 
        sp.id as plan_id,
        sp.name as plan_name,
        sp.description as plan_description,
        sp.price as plan_price,
        sp.billing_cycle as plan_billing_cycle
      `;
    }
    
    query += ` FROM payments p `;
    
    // Add joins if tables exist
    if (vendors_exists) {
      query += ` LEFT JOIN vendors v ON p.vendor_id = v.id `;
    }
    
    if (plans_exists) {
      query += ` LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.id `;
    }
    
    query += ` WHERE p.id = ? `;

    try {
      const [rows] = await pool.query(query, [id]);
      
      if (!rows || (rows as any[]).length === 0) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      const payment = (rows as any[])[0];
      
      // Format the data for the response with null checks
      const formattedPayment = {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency || 'NGN',
        status: payment.status,
        paymentMethod: payment.payment_method || payment.paymentMethod || 'card',
        transactionReference: payment.transaction_reference || payment.transactionReference || '',
        description: payment.description || '',
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
        
        // Payment type
        paymentType: payment.subscription_plan_id ? 'SUBSCRIPTION' : 
                    payment.booking_id ? 'BOOKING' : 'OTHER',
        
        // Vendor information (if available)
        vendor: vendors_exists && payment.vendor_id ? {
          id: payment.vendor_id,
          name: payment.vendor_name,
          email: payment.vendor_email
        } : null,
        
        // Subscription plan information (if available)
        subscriptionPlan: plans_exists && payment.plan_id ? {
          id: payment.plan_id,
          name: payment.plan_name,
          description: payment.plan_description,
          price: payment.plan_price,
          billingCycle: payment.plan_billing_cycle
        } : null,
        
        // Booking information (if available)
        booking: payment.booking_id ? {
          id: payment.booking_id,
          // Add more booking fields here if needed
        } : null,
      };

      return NextResponse.json({ payment: formattedPayment });
    } catch (error) {
      console.error('SQL query error:', error);
      
      // Fallback to simpler query if join query fails
      const simpleQuery = `SELECT * FROM payments WHERE id = ?`;
      const [simpleRows] = await pool.query(simpleQuery, [id]);
      
      if (!simpleRows || (simpleRows as any[]).length === 0) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      
      const simplePayment = (simpleRows as any[])[0];
      
      // Format with minimal data
      const formattedSimplePayment = {
        id: simplePayment.id,
        amount: simplePayment.amount,
        currency: simplePayment.currency || 'NGN',
        status: simplePayment.status,
        paymentMethod: simplePayment.payment_method || simplePayment.paymentMethod || 'card',
        transactionReference: simplePayment.transaction_reference || simplePayment.transactionReference || '',
        description: simplePayment.description || '',
        createdAt: simplePayment.created_at,
        updatedAt: simplePayment.updated_at,
        paymentType: simplePayment.subscription_plan_id ? 'SUBSCRIPTION' : 
                     simplePayment.booking_id ? 'BOOKING' : 'OTHER',
        vendor: null,
        subscriptionPlan: null,
        booking: simplePayment.booking_id ? { id: simplePayment.booking_id } : null
      };
      
      return NextResponse.json({ payment: formattedSimplePayment });
    }
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Failed to fetch payment details' }, { status: 500 });
  }
} 