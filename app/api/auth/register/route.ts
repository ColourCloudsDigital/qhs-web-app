import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import pool from "@/lib/db";
import { UserRole, SubscriptionPlan } from "@/lib/types/enums";
import crypto from "crypto";
import { emailService } from "@/lib/services/email.service";
import { calculateEndDate } from "@/lib/services/subscription.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      role,
      // Vendor information
      companyName,
      businessAddress,
      businessPhone,
      taxId
    } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingRows] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((existingRows as any[]).length > 0) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Only allow VENDOR role for new registrations
    const userRole = UserRole.VENDOR;

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // If vendor, get the free plan for default assignment
    let freePlan = null;
    const [freePlanRows] = await pool.query(
      'SELECT * FROM subscription_plans WHERE name = ? AND isActive = 1 LIMIT 1',
      ['Free Plan']
    );
    freePlan = (freePlanRows as any[])[0] || null;

    if (!freePlan) {
      // Fallback to the cheapest plan if Free Plan doesn't exist
      const [cheapestPlanRows] = await pool.query(
        'SELECT * FROM subscription_plans WHERE isActive = 1 ORDER BY price ASC LIMIT 1'
      );
      freePlan = (cheapestPlanRows as any[])[0] || null;
    }

    if (!freePlan) {
      console.warn("No active subscription plan found. Creating vendor without a plan.");
    }

    // Start transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Create the base user with verification fields
      const [userResult] = await connection.query(
        `INSERT INTO users (id, name, email, password, role, verificationToken, verificationExpires, createdAt, updatedAt) 
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, email, hashedPassword, userRole, verificationToken, verificationExpires]
      );

      const userId = (userResult as any).insertId;

      // Get the created user
      const [userRows] = await connection.query(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      const user = (userRows as any[])[0];

      // Create vendor record with the provided hotel information
      const now = new Date();
      const endDate = freePlan ? calculateEndDate(now, freePlan.billingCycle) : undefined;
      
      await connection.query(
        `INSERT INTO vendors (id, userId, companyName, businessAddress, businessPhone, taxId, subscriptionPlanId, subscriptionStatus, subscriptionStartDate, subscriptionEndDate, createdAt, updatedAt) 
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [user.id, companyName || name, businessAddress, businessPhone, taxId, freePlan?.id, 'active', now, endDate]
      );

      await connection.commit();
      connection.release();

      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.name);

      // Return the created user (without password)
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword, { status: 201 });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}