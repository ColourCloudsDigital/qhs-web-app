import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Fetch base user data
    const [userRows]: any = await connection.query(
      'SELECT id, name, email, role, isActive, emailVerified, lastLoginAt, createdAt, updatedAt FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];
    let roleSpecificData = {};

    // Fetch role-specific data
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        const [superAdminRows]: any = await connection.query(
          'SELECT sa.* FROM super_admins sa WHERE sa.userId = ?',
          [userId]
        );
        if (superAdminRows.length > 0) {
          roleSpecificData = { ...superAdminRows[0] };
        }
        break;
      case UserRole.VENDOR:
        const [vendorRows]: any = await connection.query(
          `
            SELECT 
              v.id as vendorInfoId, v.companyName, v.businessAddress, v.businessPhone, v.taxId, 
              v.subscriptionPlanId, v.subscriptionStatus,
              sp.name as subscriptionPlanName, sp.price as subscriptionPlanPrice, sp.billingCycle as subscriptionPlanBillingCycle
            FROM vendors v 
            LEFT JOIN subscription_plans sp ON v.subscriptionPlanId = sp.id
            WHERE v.userId = ?
          `,
          [userId]
        );
        if (vendorRows.length > 0) {
          roleSpecificData = { ...vendorRows[0] };
        }
        break;
      case UserRole.CUSTOMER:
        const [customerRows]: any = await connection.query(
          'SELECT c.id as customerInfoId, c.phone, c.address FROM customers c WHERE c.userId = ?',
          [userId]
        );
        if (customerRows.length > 0) {
          roleSpecificData = { ...customerRows[0] };
        }
        break;
      case UserRole.STAFF:
        const [staffRows]: any = await connection.query(
          `
            SELECT 
              s.id as staffInfoId, s.position, s.permissions, 
              s.hotelId, h.name as hotelName,
              s.vendorId, v.companyName as managingVendorName
            FROM staff s
            LEFT JOIN hotels h ON s.hotelId = h.id
            LEFT JOIN vendors v ON s.vendorId = v.id
            WHERE s.userId = ?
          `,
          [userId]
        );
        if (staffRows.length > 0) {
          roleSpecificData = { ...staffRows[0] };
        }
        break;
      default:
        // No specific role data to fetch or unknown role
        break;
    }

    const combinedData = { ...user, ...roleSpecificData };

    return NextResponse.json(combinedData);

  } catch (error) {
    console.error('API Error fetching profile data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 