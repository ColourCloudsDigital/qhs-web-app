import { NextRequest, NextResponse } from "next/server";
import { brevoEmailService } from "@/lib/services/brevo-email.service";

export const dynamic = 'force-dynamic';

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

    // Send test email
    const result = await brevoEmailService.sendTestEmail(email);

    return NextResponse.json({
      message: "Test email sent successfully!",
      result,
      instructions: [
        "1. Check your inbox (and spam folder)",
        "2. If not received, check Brevo dashboard → Transactional → Logs",
        "3. Verify sender email is verified in Brevo dashboard",
        "4. Verify template ID exists in Brevo"
      ]
    }, { status: 200 });

  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { 
        message: "Failed to send test email",
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
