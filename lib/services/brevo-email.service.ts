/**
 * Brevo Email Service
 * Uses Brevo's transactional email API with pre-configured templates
 */

interface BrevoEmailParams {
  to: string;
  templateId: number;
  params: Record<string, any>;
  subject?: string;
}

interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

class BrevoEmailService {
  private config: BrevoConfig;
  private apiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor() {
    this.config = {
      apiKey: process.env.BREVO_API_KEY || '',
      senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@qarashotels.com',
      senderName: process.env.BREVO_SENDER_NAME || 'Qaras Hotels',
    };
  }

  /**
   * Send email using Brevo template
   */
  private async sendTemplatedEmail({ to, templateId, params, subject }: BrevoEmailParams) {
    if (!this.config.apiKey) {
      console.error('Brevo API key not configured');
      throw new Error('Email service not configured');
    }

    // Log the email details for debugging
    console.log('=== Brevo Email Debug ===');
    console.log('Sending email to:', to);
    console.log('Template ID:', templateId);
    console.log('Sender:', this.config.senderEmail);
    console.log('Params:', JSON.stringify(params, null, 2));
    console.log('========================');

    try {
      const emailPayload = {
        sender: {
          name: this.config.senderName,
          email: this.config.senderEmail,
        },
        to: [
          {
            email: to,
          },
        ],
        templateId,
        params,
        ...(subject && { subject }),
      };

      console.log('Email payload:', JSON.stringify(emailPayload, null, 2));

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.config.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Brevo API error:', error);
        throw new Error(`Failed to send email: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('Email sent successfully to:', to);
      console.log('Message ID:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending email via Brevo:', error);
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail({
    to,
    name,
    token,
  }: {
    to: string;
    name: string;
    token: string;
  }) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    const templateId = parseInt(process.env.BREVO_TEMPLATE_EMAIL_VERIFICATION || '1');

    return this.sendTemplatedEmail({
      to,
      templateId,
      params: {
        USER_NAME: name,
        VERIFICATION_URL: verificationUrl,
        VERIFICATION_TOKEN: token,
        EXPIRY_HOURS: '3',
        APP_NAME: 'Qaras Hotels',
        APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail({
    to,
    name,
    token,
  }: {
    to: string;
    name: string;
    token: string;
  }) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    const templateId = parseInt(process.env.BREVO_TEMPLATE_PASSWORD_RESET || '2');

    return this.sendTemplatedEmail({
      to,
      templateId,
      params: {
        USER_NAME: name,
        RESET_URL: resetUrl,
        RESET_TOKEN: token,
        EXPIRY_HOURS: '24',
        APP_NAME: 'Qaras Hotels',
        APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string) {
    const templateId = parseInt(process.env.BREVO_TEMPLATE_WELCOME_EMAIL || '3');
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;

    return this.sendTemplatedEmail({
      to: email,
      templateId,
      params: {
        USER_NAME: name,
        LOGIN_URL: loginUrl,
        APP_NAME: 'Qaras Hotels',
        APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
    });
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation({
    to,
    guestName,
    bookingDetails,
    hotelDetails,
  }: {
    to: string;
    guestName: string;
    bookingDetails: any;
    hotelDetails: any;
  }) {
    const templateId = parseInt(process.env.BREVO_TEMPLATE_BOOKING_CONFIRMATION || '4');

    return this.sendTemplatedEmail({
      to,
      templateId,
      params: {
        GUEST_NAME: guestName,
        BOOKING_REFERENCE: bookingDetails.id?.substring(0, 8).toUpperCase() || 'N/A',
        CHECK_IN_DATE: bookingDetails.checkInDate,
        CHECK_OUT_DATE: bookingDetails.checkOutDate,
        ROOM_TYPE: bookingDetails.roomType || 'Standard Room',
        GUEST_COUNT: bookingDetails.numberOfGuests || 1,
        TOTAL_AMOUNT: bookingDetails.totalAmount?.toFixed(2) || '0.00',
        PAYMENT_STATUS: bookingDetails.paymentStatus || 'Pending',
        BOOKING_URL: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingDetails.id}`,
        HOTEL_NAME: hotelDetails.name,
        HOTEL_ADDRESS: hotelDetails.address,
        HOTEL_PHONE: hotelDetails.phone,
        HOTEL_EMAIL: hotelDetails.email,
        APP_NAME: 'Qaras Hotels',
      },
    });
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string) {
    return this.sendTemplatedEmail({
      to,
      templateId: parseInt(process.env.BREVO_TEMPLATE_EMAIL_VERIFICATION || '1'),
      params: {
        USER_NAME: 'Test User',
        VERIFICATION_URL: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=test`,
        VERIFICATION_TOKEN: 'test-token',
        EXPIRY_HOURS: '24',
        APP_NAME: 'Qaras Hotels',
        APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      subject: 'Test Email from Qaras Hotels',
    });
  }
}

export const brevoEmailService = new BrevoEmailService();
