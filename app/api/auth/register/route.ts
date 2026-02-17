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
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {} // Add empty include to satisfy type requirements
    });

    if (existingUser) {
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
      `SELECT * FROM subscription_plans WHERE name = ? AND isActive = 1 LIMIT 1`,
      ['Free Plan']
    );
    freePlan = (freePlanRows as any[])[0] || null;

    if (!freePlan) {
      // Fallback to the cheapest plan if Free Plan doesn't exist
      const [cheapestPlanRows] = await pool.query(
        `SELECT * FROM subscription_plans WHERE isActive = 1 ORDER BY price ASC LIMIT 1`
      );
      freePlan = (cheapestPlanRows as any[])[0] || null;
    }

    if (!freePlan) {
      console.warn("No active subscription plan found. Creating vendor without a plan.");
    }

    // Create user in a transaction to ensure all related records are created
    const result = await prisma.$transaction(async () => {
      // Create the base user with verification fields
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: userRole,
          // Add verification fields
          verificationToken,
          verificationExpires,
        },
      });

      // Create vendor record with the provided hotel information
      const now = new Date();
      const endDate = freePlan ? calculateEndDate(now, freePlan.billingCycle) : undefined;
      
      await prisma.query(
        'INSERT INTO vendors (userId, companyName, businessAddress, businessPhone, taxId, subscriptionPlanId, subscriptionStatus, subscriptionStartDate, subscriptionEndDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, companyName || name, businessAddress, businessPhone, taxId, freePlan?.id, 'active', now, endDate]
      );

      return user;
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(result.email, result.name);

    // Return the created user (without password)
    const { password: _, ...userWithoutPassword } = result;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}