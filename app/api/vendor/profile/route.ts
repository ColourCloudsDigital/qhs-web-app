import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';


// GET vendor profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== UserRole.VENDOR) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const userId = session.user.id;
    
    const [rows] = await pool.query(`
      SELECT v.*, u.email, u.name, u.role, u.createdAt AS userCreatedAt
      FROM vendors v
      JOIN users u ON v.userId = u.id
      WHERE u.id = ?
    `, [userId]);
    
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }
    
    return NextResponse.json((rows as any[])[0]);
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor profile' },
      { status: 500 }
    );
  }
}

// PUT to update vendor profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== UserRole.VENDOR) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const userId = session.user.id;
    const body = await req.json();
    
    // Extract vendor-specific fields
    const { companyName, businessAddress, businessPhone, taxId, name, email } = body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update user table if name or email is provided
      if (name || email) {
        const updateUserFields: string[] = [];
        const updateUserValues: any[] = [];
        
        if (name) {
          updateUserFields.push('name = ?');
          updateUserValues.push(name);
        }
        
        if (email) {
          // Check if email is already taken by another user
          const [emailCheck] = await connection.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, userId]
          );
          
          if ((emailCheck as any[]).length > 0) {
            await connection.rollback();
            return NextResponse.json(
              { error: 'Email is already taken' },
              { status: 409 }
            );
          }
          
          updateUserFields.push('email = ?');
          updateUserValues.push(email);
        }
        
        if (updateUserFields.length > 0) {
          updateUserValues.push(userId);
          await connection.query(
            `UPDATE users SET ${updateUserFields.join(', ')} WHERE id = ?`,
            updateUserValues
          );
        }
      }
      
      // Update vendor table
      const updateVendorFields: string[] = [];
      const updateVendorValues: any[] = [];
      
      if (companyName !== undefined) {
        updateVendorFields.push('companyName = ?');
        updateVendorValues.push(companyName);
      }
      
      if (businessAddress !== undefined) {
        updateVendorFields.push('businessAddress = ?');
        updateVendorValues.push(businessAddress);
      }
      
      if (businessPhone !== undefined) {
        updateVendorFields.push('businessPhone = ?');
        updateVendorValues.push(businessPhone);
      }
      
      if (taxId !== undefined) {
        updateVendorFields.push('taxId = ?');
        updateVendorValues.push(taxId);
      }
      
      if (updateVendorFields.length > 0) {
        updateVendorValues.push(userId);
        await connection.query(
          `UPDATE vendors SET ${updateVendorFields.join(', ')} WHERE userId = ?`,
          updateVendorValues
        );
      }
      
      await connection.commit();
      
      // Fetch updated profile
      const [updatedRows] = await connection.query(`
        SELECT v.*, u.email, u.name, u.role, u.createdAt AS userCreatedAt
        FROM vendors v
        JOIN users u ON v.userId = u.id
        WHERE u.id = ?
      `, [userId]);
      
      return NextResponse.json((updatedRows as any[])[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor profile' },
      { status: 500 }
    );
  }
}

