import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Vendor API - Session:", session?.user);

    // Check authentication and authorization - allow both SUPER_ADMIN and ADMIN roles
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== 'ADMIN')) {
      console.log("Vendor API - Unauthorized - User role:", session?.user?.role);
      return NextResponse.json({ error: 'Unauthorized - Requires SUPER_ADMIN or ADMIN role' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const simple = searchParams.get('simple') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';

    console.log("Vendor API - Request params:", { simple, page, pageSize, search });

    // If simple mode is requested, return a basic list of vendors for dropdown selectors
    if (simple) {
      try {
        const [vendors] = await pool.query(
          `SELECT v.id, v.companyName, u.id as userId, u.name, u.email
           FROM vendors v
           JOIN users u ON v.userId = u.id
           ORDER BY v.companyName ASC`
        ) as [RowDataPacket[], any];

        console.log("Vendor API - Simple mode - Found vendors:", vendors.length);

        // Format the vendors for use in dropdowns
        const formattedVendors = vendors.map(vendor => ({
          id: vendor.id,
          name: vendor.companyName || vendor.name,
          email: vendor.email
        }));

        return NextResponse.json({ vendors: formattedVendors });
      } catch (error) {
        console.error("Vendor API - Error in simple mode query:", error);
        throw error; // Re-throw to be caught by the outer try/catch
      }
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Build query for MySQL
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    // Add search filter if provided
    if (search) {
      whereClause += ' AND (v.companyName LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Count total vendors matching filter for pagination
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM vendors v
       JOIN users u ON v.userId = u.id
       ${whereClause}`,
      params
    ) as [RowDataPacket[], any];
    
    const totalVendors = countRows[0].total;

    // Fetch vendors with relationships
    const [vendors] = await pool.query(
      `SELECT v.*, u.name, u.email, u.isActive, u.createdAt,
              (SELECT COUNT(*) FROM hotels h WHERE h.vendorId = v.id) as hotelCount,
              (SELECT COUNT(*) FROM staff s WHERE s.vendorId = v.id) as staffCount,
              sp.id as subscriptionPlanId, sp.name as subscriptionPlanName, sp.price as subscriptionPlanPrice
       FROM vendors v
       JOIN users u ON v.userId = u.id
       LEFT JOIN subscription_plans sp ON v.subscriptionPlanId = sp.id
       ${whereClause}
       ORDER BY v.companyName ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, skip]
    ) as [RowDataPacket[], any];

    // Format vendors for the response
    const formattedVendors = vendors.map(vendor => ({
      id: vendor.id,
      userId: vendor.userId,
      name: vendor.name,
      email: vendor.email,
      businessName: vendor.companyName,
      isActive: Boolean(vendor.isActive),
      createdAt: vendor.createdAt,
      subscriptionStatus: vendor.subscriptionStatus,
      subscriptionPlan: vendor.subscriptionPlanId ? {
        id: vendor.subscriptionPlanId,
        name: vendor.subscriptionPlanName,
        price: parseFloat(vendor.subscriptionPlanPrice || '0')
      } : null,
      hotelCount: vendor.hotelCount,
      staffCount: vendor.staffCount
    }));

    return NextResponse.json({
      vendors: formattedVendors,
      total: totalVendors,
      page,
      pageSize,
      totalPages: Math.ceil(totalVendors / pageSize)
    });
    
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}