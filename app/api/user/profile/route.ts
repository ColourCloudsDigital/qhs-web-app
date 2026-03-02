import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user profile information
    const [userResults] = await pool.query(
      `SELECT 
        id,
        name,
        firstName,
        lastName,
        email,
        role,
        isActive,
        createdAt,
        updatedAt,
        lastLoginAt
      FROM users 
      WHERE id = ?`,
      [userId]
    );

    if ((userResults as any[]).length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = (userResults as any[])[0];

    return NextResponse.json({
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { firstName, lastName, email, name } = body;

    // Build update query based on provided fields
    const updateFields = [];
    const updateValues = [];

    if (firstName !== undefined) {
      updateFields.push('firstName = ?');
      updateValues.push(firstName);
    }

    if (lastName !== undefined) {
      updateFields.push('lastName = ?');
      updateValues.push(lastName);
    }

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    // Update name if firstName and lastName are provided
    if (firstName !== undefined && lastName !== undefined) {
      const fullName = `${firstName} ${lastName}`.trim();
      updateFields.push('name = ?');
      updateValues.push(fullName);
    } else if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(userId);

    // Update user record
    await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
