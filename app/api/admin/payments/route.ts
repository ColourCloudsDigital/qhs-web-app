import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sortColumn = searchParams.get('sortColumn') || 'created_at';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const search = searchParams.get('search') || '';
    // Normalize filters: accept any casing from frontend
    const typeRaw = searchParams.get('type') || 'all';
    const type = (typeRaw || 'all').toUpperCase(); // SUBSCRIPTION | BOOKING | OTHER | all
    const statusRaw = searchParams.get('status') || 'all';
    const status = (statusRaw || 'all').toLowerCase(); // compare status case-insensitively
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Check if vendors and subscription_plans tables exist
    const [tableCheckResult] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'vendors') as vendors_exists,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'subscription_plans') as plans_exists
    `);
    
    const { vendors_exists, plans_exists } = (tableCheckResult as any[])[0];

    // Build simpler query if related tables don't exist
    let query = `
      SELECT 
        p.id, 
        p.amount, 
        IFNULL(p.currency, 'NGN') as currency,
        p.status, 
        IFNULL(p.payment_method, 'card') as paymentMethod, 
        p.created_at as createdAt,
        IFNULL(p.transaction_reference, '') as transactionReference,
        IFNULL(p.description, '') as description,
    `;

    // Add vendor fields only if vendors table exists
    if (vendors_exists) {
      // Some schemas use `companyName` for vendors; use that column as vendorName
      query += `
        p.vendor_id as vendorId,
        v.companyName as vendorName,
      `;
    } else {
      query += `
        p.vendor_id as vendorId,
        NULL as vendorName,
      `;
    }

    // Add subscription plan fields only if subscription_plans table exists
    if (plans_exists) {
      query += `
        p.subscription_plan_id as planId,
        sp.name as planName,
      `;
    } else {
      query += `
        p.subscription_plan_id as planId,
        NULL as planName,
      `;
    }

    // Add payment type classification
    query += `
      CASE
        WHEN p.subscription_plan_id IS NOT NULL THEN 'SUBSCRIPTION'
        WHEN p.booking_id IS NOT NULL THEN 'BOOKING'
        ELSE 'OTHER'
      END as paymentType
      FROM payments p
    `;

    // Add joins only if the tables exist
    if (vendors_exists) {
      query += ` LEFT JOIN vendors v ON p.vendor_id = v.id `;
    }
    
    if (plans_exists) {
      query += ` LEFT JOIN subscription_plans sp ON p.subscription_plan_id = sp.id `;
    }

    query += ` WHERE 1=1 `;

    const queryParams: any[] = [];

    // Add search filter - adapt based on which fields are available
    if (search) {
      if (vendors_exists && plans_exists) {
        query += " AND (p.transaction_reference LIKE ? OR v.companyName LIKE ? OR sp.name LIKE ?)";
        queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      } else if (vendors_exists) {
        query += " AND (p.transaction_reference LIKE ? OR v.companyName LIKE ?)";
        queryParams.push(`%${search}%`, `%${search}%`);
      } else if (plans_exists) {
        query += " AND (p.transaction_reference LIKE ? OR sp.name LIKE ?)";
        queryParams.push(`%${search}%`, `%${search}%`);
      } else {
        query += " AND p.transaction_reference LIKE ?";
        queryParams.push(`%${search}%`);
      }
    }

    // Add type filter (type is uppercased)
    if (type !== 'ALL') {
      if (type === 'SUBSCRIPTION') {
        query += " AND p.subscription_plan_id IS NOT NULL";
      } else if (type === 'BOOKING') {
        query += " AND p.booking_id IS NOT NULL";
      } else if (type === 'OTHER') {
        query += " AND p.subscription_plan_id IS NULL AND p.booking_id IS NULL";
      }
    }

    // Add status filter (case-insensitive)
    if (status !== 'all') {
      query += " AND LOWER(p.status) = ?";
      queryParams.push(status);
    }

    // Add date range filter
    if (dateFrom) {
      query += " AND p.created_at >= ?";
      queryParams.push(`${dateFrom} 00:00:00`);
    }

    if (dateTo) {
      query += " AND p.created_at <= ?";
      queryParams.push(`${dateTo} 23:59:59`);
    }

    // Count total items (for pagination)
    try {
      const countQuery = `SELECT COUNT(*) as total FROM (${query}) as filtered_payments`;
      const [countRows] = await pool.query(countQuery, queryParams);
      const total = (countRows as any[])[0].total;

      // Add sorting and pagination
      // Map frontend sort column names to DB columns
      let sortField = sortColumn;
      switch (sortField) {
        case 'createdAt':
          sortField = 'created_at';
          break;
        case 'paymentMethod':
          sortField = 'payment_method';
          break;
        case 'paymentType':
          // paymentType is derived in the query, safe to order by the alias
          sortField = 'paymentType';
          break;
        default:
          // leave as provided; ensure no dangerous characters (basic whitelist)
          sortField = sortField.replace(/[^a-zA-Z0-9_]/g, '') || 'created_at';
      }

      // Make sure the sort column exists in the query
      query += ` ORDER BY ${sortField} ${sortDirection}`;
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(pageSize, offset);

      // Execute the query
      const [rows] = await pool.query(query, queryParams);

      // Return data
      return NextResponse.json({
        payments: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
    } catch (error) {
      console.error('SQL query error:', error);
      
      // Simplified query as fallback if we get errors
      const simpleQuery = `
        SELECT 
          id,
          amount,
          status,
          IFNULL(payment_method, 'card') as paymentMethod,
          created_at as createdAt,
          'SUBSCRIPTION' as paymentType
        FROM 
          payments
        ORDER BY 
          created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [simpleRows] = await pool.query(simpleQuery, [pageSize, offset]);
      const [simpleCountResult] = await pool.query('SELECT COUNT(*) as total FROM payments');
      const simpleTotal = (simpleCountResult as any[])[0].total;

      return NextResponse.json({
        payments: simpleRows,
        total: simpleTotal,
        page,
        pageSize,
        totalPages: Math.ceil(simpleTotal / pageSize)
      });
    }
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch payments',
      payments: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0
    }, { status: 500 });
  }
} 
