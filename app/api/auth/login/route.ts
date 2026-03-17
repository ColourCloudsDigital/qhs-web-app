import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcrypt";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get user from database
    const [userRows] = await pool.query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    const users = userRows as any[];
    
    if (users.length === 0) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { message: "Your account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          message: "Please verify your email address before logging in.",
          code: "EMAIL_NOT_VERIFIED",
          email: user.email
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last login time
    await pool.query(
      'UPDATE users SET lastLoginAt = NOW() WHERE id = ?',
      [user.id]
    );

    // Return user data (without password)
    const { password: _, verificationToken, resetToken, ...userWithoutSensitiveData } = user;
    
    return NextResponse.json({
      message: "Login successful",
      user: userWithoutSensitiveData
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
