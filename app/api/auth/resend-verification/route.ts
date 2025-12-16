import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import crypto from "crypto";
import { emailService } from "@/lib/services/email.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email address is required" },
        { status: 400 }
      );
    }

    // Check if user exists and needs verification
    const query = `
      SELECT id, name, email, emailVerified 
      FROM User 
      WHERE email = ? 
      LIMIT 1
    `;
    
    const [rows]: [any[], any] = await pool.query(query, [email]);
    
    if (rows.length === 0) {
      // Don't disclose whether the email exists or not for security
      return NextResponse.json(
        { message: "If your email exists in our system, a verification email has been sent." },
        { status: 200 }
      );
    }
    
    const user = rows[0];
    
    // If already verified, no need to resend
    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Your email is already verified. You can login now." },
        { status: 200 }
      );
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Update user with new verification token
    const updateQuery = `
      UPDATE User 
      SET verificationToken = ?, verificationExpires = ? 
      WHERE id = ?
    `;
    
    await pool.query(updateQuery, [verificationToken, verificationExpires, user.id]);
    
    // Send verification email
    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken,
    });
    
    return NextResponse.json(
      { message: "Verification email has been sent." },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
} 