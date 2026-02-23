import nodemailer from 'nodemailer';
// Import only the compile function from handlebars to avoid require.extensions issues
// We use dynamic import for better Next.js compatibility
import pool from '@/lib/db';
import { formatDate } from '@/lib/utils';

/**
 * Interface for SMTP configuration
 */
interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail?: string;
  fromName?: string;
}

/**
 * Interface for email data
 */
interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  text?: string;
  attachments?: any[];
}

/**
 * Interface for test email request
 */
interface TestEmailRequest {
  to: string;
  smtpConfig: SMTPConfig;
}

// Simplified handlebars template compiler that works in Next.js
const compileTemplate = (template: string) => {
  return (data: Record<string, any>) => {
    let result = template;
    // Basic variable replacement using regex
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(data[key] || ''));
    });
    return result;
  };
};

// Email service for sending various notifications and messages
class EmailService {
  private async getTransporter(vendorId?: string) {
    try {
      // If vendorId is provided, try to get vendor-specific SMTP settings first
      if (vendorId) {
        const [vendorSmtpResults] = await pool.query(
          'SELECT * FROM smtp_settings WHERE vendorId = ? AND isActive = 1 LIMIT 1',
          [vendorId]
        );
        
        const vendorSmtp = (vendorSmtpResults as any[])[0];
        
        if (vendorSmtp) {
          console.log('Using vendor-specific SMTP settings');
          return nodemailer.createTransport({
            host: vendorSmtp.host,
            port: parseInt(vendorSmtp.port.toString()) || 587,
            secure: vendorSmtp.encryption === 'ssl' || parseInt(vendorSmtp.port.toString()) === 465,
            auth: {
              user: vendorSmtp.username,
              pass: vendorSmtp.password,
            },
            from: `"${vendorSmtp.fromName}" <${vendorSmtp.fromEmail}>`,
          });
        }
      }
      
      // If no vendor settings or vendorId not provided, use default settings
      const [defaultSmtpResults] = await pool.query(
        'SELECT * FROM smtp_settings WHERE isDefault = 1 AND isActive = 1 LIMIT 1'
      );
      
      const defaultSmtp = (defaultSmtpResults as any[])[0];
      
      if (defaultSmtp) {
        console.log('Using default SMTP settings');
        return nodemailer.createTransport({
          host: defaultSmtp.host,
          port: parseInt(defaultSmtp.port.toString()) || 587,
          secure: defaultSmtp.encryption === 'ssl' || parseInt(defaultSmtp.port.toString()) === 465,
          auth: {
            user: defaultSmtp.username,
            pass: defaultSmtp.password,
          },
          from: `"${defaultSmtp.fromName}" <${defaultSmtp.fromEmail}>`,
        });
      }
      
      // Fallback to environment variables if no settings found in the database
      console.log('Falling back to environment variables for SMTP settings');
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      });
    } catch (error) {
      console.error('Error creating email transporter:', error);
      
      // Fallback to environment variables if error occurs
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      });
    }
  }

  private async getEmailTemplate(templateKey: string, vendorId?: string) {
    try {
      let query;
      let params;
      
      if (vendorId) {
        // Try to get vendor-specific template first, then fall back to global template
        query = `
          SELECT * FROM email_templates
          WHERE template_key = ? AND (vendorId = ? OR vendorId IS NULL)
          ORDER BY vendorId DESC
          LIMIT 1
        `;
        params = [templateKey, vendorId];
      } else {
        // Get global template only
        query = `
          SELECT * FROM email_templates
          WHERE template_key = ? AND vendorId IS NULL
          LIMIT 1
        `;
        params = [templateKey];
      }
      
      const [rows] = await pool.query(query, params);
      
      if ((rows as any[]).length === 0) {
        throw new Error(`Email template "${templateKey}" not found`);
      }
      
      return (rows as any[])[0];
    } catch (error) {
      console.error(`Error fetching email template "${templateKey}":`, error);
      throw error;
    }
  }

  private async getGlobalSettings(keys: string[] = []) {
    try {
      const query = `
        SELECT \`key\`, value 
        FROM settings 
        WHERE tenantId IS NULL
        ${keys.length > 0 ? 'AND `key` IN (?)' : ''}
      `;
      
      const [rows]: [any[], any] = await pool.query(
        query, 
        keys.length > 0 ? [keys] : []
      );
      
      return rows.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error fetching global settings:', error);
      return {};
    }
  }

  /**
   * Send an email using a template from the database
   */
  public async sendTemplatedEmail({
    to,
    templateKey,
    data = {},
    vendorId,
  }: {
    to: string | string[];
    templateKey: string;
    data?: Record<string, any>;
    vendorId?: string;
  }) {
    try {
      // Get the email template
      const template = await this.getEmailTemplate(templateKey, vendorId);
      
      // Get global settings for template variables
      const globalSettings = await this.getGlobalSettings([
        'site_name', 
        'primary_color',
        'logo',
        'contact_email',
        'email_footer_text'
      ]);
      
      // Merge template data with global settings
      const mergedData = {
        ...globalSettings,
        ...data,
        year: new Date().getFullYear().toString(),
      };
      
      // Compile templates with Handlebars
      const compiledSubject = compileTemplate(template.subject);
      const compiledBody = compileTemplate(template.body);
      
      // Populate templates with data
      const subject = compiledSubject(mergedData);
      const html = compiledBody(mergedData);
      
      // Get text version if available, or generate from HTML
      let text;
      if (template.bodyText) {
        const compiledText = compileTemplate(template.bodyText);
        text = compiledText(mergedData);
      }
      
      // Get transporter - pass vendorId if available
      const transporter = await this.getTransporter(vendorId);
      
      // Send email
      const info = await transporter.sendMail({
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        html,
        text,
      });
      
      console.log(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Error sending templated email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   */
  public async sendWelcomeEmail(email: string, name: string) {
    return this.sendTemplatedEmail({
      to: email,
      templateKey: 'welcome_email',
      data: {
        user_name: name,
        login_url: `${process.env.NEXT_PUBLIC_APP_URL}/login`
      }
    });
  }

  /**
   * Send email verification link
   */
  public async sendVerificationEmail({
    to,
    name,
    token,
  }: {
    to: string;
    name: string;
    token: string;
  }) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    
    return this.sendTemplatedEmail({
      to,
      templateKey: 'email_verification',
      data: {
        user_name: name,
        verification_url: verificationUrl,
        verification_code: token.substring(0, 6).toUpperCase(),
        expiry_time: '24'
      }
    });
  }

  /**
   * Send password reset email
   */
  public async sendPasswordResetEmail({
    to,
    name,
    token,
  }: {
    to: string;
    name: string;
    token: string;
  }) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    return this.sendTemplatedEmail({
      to,
      templateKey: 'password_reset',
      data: {
        user_name: name,
        reset_url: resetUrl,
        expiry_time: '24'
      }
    });
  }

  /**
   * Send booking confirmation email
   */
  public async sendBookingConfirmation({
    to,
    guestName,
    bookingDetails,
    hotelDetails,
    vendorId,
  }: {
    to: string;
    guestName: string;
    bookingDetails: any;
    hotelDetails: any;
    vendorId?: string;
  }) {
    // use shared formatDate from utils (returns YYYY-MM-DD hh:mmAM)

    // Get currency symbol
    const getCurrencySymbol = (currency: string = 'NGN') => {
      const symbols: Record<string, string> = {
        'NGN': '₦',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
      };
      return symbols[currency] || currency;
    };

    // Prepare template data
    const templateData = {
      guest_name: guestName,
      booking_reference: bookingDetails.id.substring(0, 8).toUpperCase(),
      check_in_date: formatDate(bookingDetails.checkInDate),
      check_out_date: formatDate(bookingDetails.checkOutDate),
      room_type: bookingDetails.roomType || 'Standard Room',
      guest_count: bookingDetails.numberOfGuests || 1,
      currency_symbol: getCurrencySymbol(hotelDetails.currency),
      total_amount: bookingDetails.totalAmount.toFixed(2),
      payment_status: bookingDetails.paymentStatus || 'Pending',
      booking_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/bookings/${bookingDetails.id}/confirmation`,
      hotel_name: hotelDetails.name,
      hotel_address: hotelDetails.address,
      hotel_phone: hotelDetails.phone,
      hotel_email: hotelDetails.email,
      cancellation_policy: hotelDetails.cancellationPolicy || 'Please contact the hotel for cancellation details.',
      contact_email: hotelDetails.email,
      contact_phone: hotelDetails.phone,
      primary_color: hotelDetails.primaryColor || '#1e3a8a',
    };

    return this.sendTemplatedEmail({
      to,
      templateKey: 'booking_confirmation',
      data: templateData,
      vendorId
    });
  }

  /**
   * Get SMTP configuration from database
   */
  private async getSmtpConfig(): Promise<SMTPConfig | null> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM smtp_configurations WHERE isDefault = true LIMIT 1'
      );

      const config = (rows as any[])[0];

      if (!config) {
        console.error('No SMTP configuration found');
        return null;
      }

      return {
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        fromEmail: config.fromEmail || undefined,
        fromName: config.fromName || undefined,
      };
    } catch (error) {
      console.error('Error fetching SMTP configuration:', error);
      return null;
    }
  }

  /**
   * Create a nodemailer transporter using SMTP config
   */
  private createTransporter(smtpConfig: SMTPConfig) {
    return nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    });
  }

  /**
   * Format the From header with name and email
   */
  private formatFromAddress(smtpConfig: SMTPConfig): string {
    if (smtpConfig.fromName && smtpConfig.fromEmail) {
      return `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`;
    } else if (smtpConfig.fromEmail) {
      return smtpConfig.fromEmail;
    } else {
      return smtpConfig.username;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    const smtpConfig = await this.getSmtpConfig();
    
    if (!smtpConfig) {
      throw new Error('SMTP configuration not found');
    }

    const transporter = this.createTransporter(smtpConfig);
    const from = emailData.from || this.formatFromAddress(smtpConfig);

    try {
      await transporter.sendMail({
        from,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        attachments: emailData.attachments,
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send a test email using provided SMTP configuration
   */
  async sendTestEmail(request: TestEmailRequest): Promise<boolean> {
    const { to, smtpConfig } = request;
    
    if (!smtpConfig) {
      throw new Error('SMTP configuration not provided');
    }

    const transporter = this.createTransporter(smtpConfig);
    const from = this.formatFromAddress(smtpConfig);

    try {
      await transporter.sendMail({
        from,
        to,
        subject: 'Test Email from Qaras Hotels',
        text: 'This is a test email from Qaras Hotels system. If you received this email, your SMTP configuration is working correctly.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #1e3a8a;">Qaras Hotels - SMTP Test</h2>
            <p>This is a test email from the Qaras Hotels system.</p>
            <p>If you're seeing this email, your SMTP configuration is working correctly!</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `,
      });

      return true;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();