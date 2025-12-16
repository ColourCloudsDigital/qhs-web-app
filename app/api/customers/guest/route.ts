import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone } = await req.json();
    
    // Basic validation
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if user already exists with this email
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    let customerId;
    let userId;
    
    // Begin transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      if ((existingUsers as any[]).length > 0) {
        // Use existing user
        userId = (existingUsers as any[])[0].id;
        
        // Check if customer record exists
        const [existingCustomers] = await connection.query(
          'SELECT id FROM customers WHERE userId = ?',
          [userId]
        );
        
        if ((existingCustomers as any[]).length > 0) {
          // Use existing customer
          customerId = (existingCustomers as any[])[0].id;
          
          // Update the customer information
          await connection.query(
            `UPDATE customers 
             SET phone = ?, updatedAt = NOW() 
             WHERE id = ?`,
            [phone || null, customerId]
          );
        } else {
          // Create new customer record for existing user
          customerId = uuidv4();
          
          await connection.query(
            `INSERT INTO customers 
             (id, userId, phone, createdAt, updatedAt) 
             VALUES (?, ?, ?, NOW(), NOW())`,
            [customerId, userId, phone || null]
          );
        }
      } else {
        // Create new user
        userId = uuidv4();
        const name = `${firstName} ${lastName}`;
        // Generate a temporary password
        const tempPassword = uuidv4().substring(0, 8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        await connection.query(
          `INSERT INTO users 
           (id, name, email, password, role, isActive, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, 'CUSTOMER', 1, NOW(), NOW())`,
          [userId, name, email, hashedPassword]
        );
        
        // Create new customer
        customerId = uuidv4();
        
        await connection.query(
          `INSERT INTO customers 
           (id, userId, phone, createdAt, updatedAt) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          [customerId, userId, phone || null]
        );
      }
      
      // Commit transaction
      await connection.commit();
      
      return NextResponse.json({ 
        success: true, 
        customerId,
        userId,
        message: 'Guest customer created/updated successfully'
      });
      
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
    
  } catch (error) {
    console.error('Error creating guest customer:', error);
    return NextResponse.json(
      { error: 'Failed to create guest customer' },
      { status: 500 }
    );
  }
} 