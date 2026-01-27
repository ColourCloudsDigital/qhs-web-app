import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = params.id;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    const offset = (page - 1) * pageSize;

    // Build WHERE clause
    let whereClause = 'WHERE r.hotelId = ?';
    const params: any[] = [hotelId];

    if (search) {
      whereClause += ' AND (r.name LIKE ? OR r.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM roles r ${whereClause}`,
      params
    ) as [RowDataPacket[], any];

    const total = countResult[0]?.total || 0;

    // Get roles with pagination
    const [roles] = await pool.query(
      `SELECT r.id, r.name, r.slug, r.description, r.createdAt, r.updatedAt
       FROM roles r
       ${whereClause}
       ORDER BY r.name ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ) as [RowDataPacket[], any];

    return NextResponse.json({
      roles: roles || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = params.id;
    const body = await request.json();
    const { name, description } = body;

    if (!hotelId || !name) {
      return NextResponse.json(
        { error: 'Hotel ID and role name are required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const roleId = crypto.randomUUID();

    // Check if role with same name already exists for this hotel
    const [existingRole] = await pool.query(
      'SELECT id FROM roles WHERE hotelId = ? AND (name = ? OR slug = ?)',
      [hotelId, name, slug]
    ) as [RowDataPacket[], any];

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 }
      );
    }

    // Create the role
    await pool.query(
      `INSERT INTO roles (id, hotelId, name, slug, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [roleId, hotelId, name, slug, description || '']
    );

    // Fetch the created role
    const [newRole] = await pool.query(
      'SELECT id, name, slug, description, createdAt, updatedAt FROM roles WHERE id = ?',
      [roleId]
    ) as [RowDataPacket[], any];

    return NextResponse.json(newRole[0], { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
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

    const hotelId = params.id;
    const body = await request.json();
    const { ids } = body;

    if (!hotelId || !ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Hotel ID and role IDs are required' },
        { status: 400 }
      );
    }

    // Delete multiple roles
    await pool.query(
      `DELETE FROM roles WHERE hotelId = ? AND id IN (${ids.map(() => '?').join(',')})`,
      [hotelId, ...ids]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}