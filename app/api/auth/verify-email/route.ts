import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const [userRows] = await pool.query(
      `SELECT id, name, email, verificationToken, verificationExpires, emailVerified 
       FROM users 
       WHERE verificationToken = ? 
       LIMIT 1`,
      [token]
    );

    const users = userRows as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    const user = users[0];

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { 
          message: "Email already verified. You can now login.",
          alreadyVerified: true
        },
        { status: 200 }
      );
    }

    // Check if token has expired
    if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
      return NextResponse.json(
        { 
          message: "Verification token has expired. Please request a new one.",
          expired: true,
          email: user.email
        },
        { status: 400 }
      );
    }

    // Verify the email
    await pool.query(
      `UPDATE users 
       SET emailVerified = NOW(), 
           verificationToken = NULL, 
           verificationExpires = NULL,
           updatedAt = NOW()
       WHERE id = ?`,
      [user.id]
    );

    return NextResponse.json(
      { 
        message: "Email verified successfully! You can now login.",
        success: true,
        user: {
          name: user.name,
          email: user.email
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { message: "An error occurred during email verification" },
      { status: 500 }
    );
  }
}

// GET method for verifying via URL query parameter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const [userRows] = await pool.query(
      `SELECT id, name, email, verificationToken, verificationExpires, emailVerified 
       FROM users 
       WHERE verificationToken = ? 
       LIMIT 1`,
      [token]
    );

    const users = userRows as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    const user = users[0];

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { 
          message: "Email already verified. You can now login.",
          alreadyVerified: true
        },
        { status: 200 }
      );
    }

    // Check if token has expired
    if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
      return NextResponse.json(
        { 
          message: "Verification token has expired. Please request a new one.",
          expired: true,
          email: user.email
        },
        { status: 400 }
      );
    }

    // Verify the email
    await pool.query(
      `UPDATE users 
       SET emailVerified = NOW(), 
           verificationToken = NULL, 
           verificationExpires = NULL,
           updatedAt = NOW()
       WHERE id = ?`,
      [user.id]
    );

    return NextResponse.json(
      { 
        message: "Email verified successfully! You can now login.",
        success: true,
        user: {
          name: user.name,
          email: user.email
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { message: "An error occurred during email verification" },
      { status: 500 }
    );
  }
}
