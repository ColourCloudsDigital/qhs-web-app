import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { RowDataPacket } from 'mysql2';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; roleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: hotelId, roleId } = params;

    if (!hotelId || !roleId) {
      return NextResponse.json(
        { error: 'Hotel ID and role ID are required' },
        { status: 400 }
      );
    }

    // Check if role exists and belongs to the hotel
    const [roleExists] = await pool.query(
      'SELECT id FROM roles WHERE id = ? AND hotelId = ?',
      [roleId, hotelId]
    ) as [RowDataPacket[], any];

    if (roleExists.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if role is assigned to any staff members
    const [staffWithRole] = await pool.query(
      'SELECT COUNT(*) as count FROM staff WHERE roleId = ?',
      [roleId]
    ) as [RowDataPacket[], any];

    if (staffWithRole[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role that is assigned to staff members' },
        { status: 400 }
      );
    }

    // Delete the role
    await pool.query(
      'DELETE FROM roles WHERE id = ? AND hotelId = ?',
      [roleId, hotelId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; roleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: hotelId, roleId } = params;
    const body = await request.json();
    const { name, description } = body;

    if (!hotelId || !roleId || !name) {
      return NextResponse.json(
        { error: 'Hotel ID, role ID, and name are required' },
        { status: 400 }
      );
    }

    // Check if role exists and belongs to the hotel
    const [roleExists] = await pool.query(
      'SELECT id FROM roles WHERE id = ? AND hotelId = ?',
      [roleId, hotelId]
    ) as [RowDataPacket[], any];

    if (roleExists.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if another role with same name/slug exists for this hotel
    const [duplicateRole] = await pool.query(
      'SELECT id FROM roles WHERE hotelId = ? AND (name = ? OR slug = ?) AND id != ?',
      [hotelId, name, slug, roleId]
    ) as [RowDataPacket[], any];

    if (duplicateRole.length > 0) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Update the role
    await pool.query(
      'UPDATE roles SET name = ?, slug = ?, description = ?, updatedAt = NOW() WHERE id = ? AND hotelId = ?',
      [name, slug, description || '', roleId, hotelId]
    );

    // Fetch the updated role
    const [updatedRole] = await pool.query(
      'SELECT id, name, slug, description, createdAt, updatedAt FROM roles WHERE id = ?',
      [roleId]
    ) as [RowDataPacket[], any];

    return NextResponse.json(updatedRole[0]);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}