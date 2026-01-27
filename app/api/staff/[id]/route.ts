import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffId = params.id;

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    // Get staff details with user information
    const [staffResults] = await pool.query(
      `SELECT 
        s.id,
        s.position,
        s.permissions,
        s.hotelId,
        s.vendorId,
        s.createdAt,
        s.updatedAt,
        u.id as userId,
        u.firstName,
        u.lastName,
        u.email,
        u.isActive,
        h.name as hotelName,
        v.companyName as vendorName
      FROM staff s
      JOIN users u ON s.userId = u.id
      LEFT JOIN hotels h ON s.hotelId = h.id
      LEFT JOIN vendors v ON s.vendorId = v.id
      WHERE s.id = ?`,
      [staffId]
    );

    if ((staffResults as any[]).length === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const staff = (staffResults as any[])[0];

    // Parse permissions if they exist
    let permissions = [];
    if (staff.permissions) {
      try {
        permissions = JSON.parse(staff.permissions);
      } catch (error) {
        console.error('Error parsing permissions:', error);
        permissions = [];
      }
    }

    const staffData = {
      id: staff.id,
      userId: staff.userId,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      position: staff.position,
      permissions,
      hotelId: staff.hotelId,
      hotelName: staff.hotelName,
      vendorId: staff.vendorId,
      vendorName: staff.vendorName,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt
    };

    return NextResponse.json(staffData);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffId = params.id;
    const body = await request.json();
    const { position, permissions, hotelId, vendorId } = body;

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    // Build update query based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(position);
    }

    if (permissions !== undefined) {
      updateFields.push('permissions = ?');
      updateValues.push(JSON.stringify(permissions));
    }

    if (hotelId !== undefined) {
      updateFields.push('hotelId = ?');
      updateValues.push(hotelId);
    }

    if (vendorId !== undefined) {
      updateFields.push('vendorId = ?');
      updateValues.push(vendorId);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(staffId);

    // Update staff record
    await pool.query(
      `UPDATE staff SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffId = params.id;

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    // Deactivate staff member
    await pool.query(
      `UPDATE users u 
       JOIN staff s ON u.id = s.userId 
       SET u.isActive = 0 
       WHERE s.id = ?`,
      [staffId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffId = params.id;

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    // Delete staff member and associated user
    await pool.query(
      `DELETE s, u FROM staff s 
       JOIN users u ON s.userId = u.id 
       WHERE s.id = ?`,
      [staffId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}