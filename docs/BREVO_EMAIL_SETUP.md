# Brevo Email Verification Setup Guide

Complete guide for setting up email verification using Brevo templates.

## Table of Contents
1. [Database Setup](#database-setup)
2. [Brevo Account Setup](#brevo-account-setup)
3. [Create Email Templates in Brevo](#create-email-templates-in-brevo)
4. [Environment Configuration](#environment-configuration)
5. [Testing](#testing)

---

## Database Setup

### Step 1: Add Verification Columns

Run this SQL script to add required columns to the users table:

```bash
# Using MySQL command line
mysql -u your_username -p your_database < scripts/add-verification-columns.sql
```

Or execute directly in your database:

```sql
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `verificationToken` VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `verificationExpires` DATETIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `resetToken` VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `resetExpires` DATETIME DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_verification_token ON users(verificationToken);
CREATE INDEX IF NOT EXISTS idx_reset_token ON users(resetToken);
```

---

## Brevo Account Setup

### Step 1: Create Brevo Account

1. Go to [Brevo](https://www.brevo.com/)
2. Sign up for a free account
3. Verify your email address
4. Complete account setup

### Step 2: Get API Key

1. Login to Brevo dashboard
2. Go to **Settings** → **SMTP & API** → **API Keys**
3. Click **Generate a new API key**
4. Name it: `Qaras Hospitality Solutions Production`
5. Copy the API key (you won't see it again!)

### Step 3: Verify Sender Email/Domain

1. Go to **Senders & IP** → **Senders**
2. Add your sender email (e.g., `noreply@yourdomain.com`)
3. Verify the email by clicking the link sent to your inbox
4. (Optional) Set up domain authentication for better deliverability

---

## Create Email Templates in Brevo

### Template 1: Email Verification

1. Go to **Campaigns** → **Templates** → **Create a new template**
2. Choose **Transactional template**
3. Name: `Email Verification`
4. Design your template with these variables:

**Required Variables:**
- `{{params.USER_NAME}}` - User's name
- `{{params.VERIFICATION_URL}}` - Verification link
- `{{params.EXPIRY_HOURS}}` - Token expiry time
- `{{params.APP_NAME}}` - Application name

**Sample HTML:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e3a8a;">Welcome to {{params.APP_NAME}}!</h1>
        
        <p>Hi {{params.USER_NAME}},</p>
        
        <p>Thank you for registering! Please verify your email address to activate your account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{params.VERIFICATION_URL}}" 
               style="background-color: #1e3a8a; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
            </a>
        </div>
        
        <p><strong>Note:</strong> This link expires in {{params.EXPIRY_HOURS}} hours.</p>
        
        <p>If the button doesn't work, copy and paste this link:</p>
        <p style="word-break: break-all; color: #666;">{{params.VERIFICATION_URL}}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <p style="font-size: 12px; color: #666;">
            If you didn't create this account, please ignore this email.
        </p>
    </div>
</body>
</html>
```

4. Save and note the **Template ID** (e.g., `1`)

### Template 2: Password Reset

1. Create another template: `Password Reset`
2. Use these variables:

**Required Variables:**
- `{{params.USER_NAME}}` - User's name
- `{{params.RESET_URL}}` - Password reset link
- `{{params.EXPIRY_HOURS}}` - Token expiry time
- `{{params.APP_NAME}}` - Application name

**Sample HTML:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e3a8a;">Password Reset Request</h1>
        
        <p>Hi {{params.USER_NAME}},</p>
        
        <p>We received a request to reset your password for your {{params.APP_NAME}} account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{params.RESET_URL}}" 
               style="background-color: #1e3a8a; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
            </a>
        </div>
        
        <p><strong>Important:</strong> This link expires in {{params.EXPIRY_HOURS}} hours.</p>
        
        <p>If the button doesn't work, copy and paste this link:</p>
        <p style="word-break: break-all; color: #666;">{{params.RESET_URL}}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <p style="font-size: 12px; color: #666;">
            If you didn't request this, please ignore this email or contact support.
        </p>
    </div>
</body>
</html>
```

3. Save and note the **Template ID** (e.g., `2`)

### Template 3: Welcome Email

1. Create template: `Welcome Email`
2. Use these variables:

**Required Variables:**
- `{{params.USER_NAME}}` - User's name
- `{{params.LOGIN_URL}}` - Login page link
- `{{params.APP_NAME}}` - Application name

**Sample HTML:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome!</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1e3a8a;">🎉 Welcome to {{params.APP_NAME}}!</h1>
        
        <p>Hi {{params.USER_NAME}},</p>
        
        <p>Your email has been verified successfully! You're all set to start using {{params.APP_NAME}}.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{params.LOGIN_URL}}" 
               style="background-color: #1e3a8a; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Dashboard
            </a>
        </div>
        
        <p>If you have any questions, our support team is here to help.</p>
        
        <p>Best regards,<br>The {{params.APP_NAME}} Team</p>
    </div>
</body>
</html>
```

3. Save and note the **Template ID** (e.g., `3`)

### Template 4: Booking Confirmation (Optional)

Create a booking confirmation template with variables like:
- `{{params.GUEST_NAME}}`
- `{{params.BOOKING_REFERENCE}}`
- `{{params.CHECK_IN_DATE}}`
- `{{params.CHECK_OUT_DATE}}`
- `{{params.HOTEL_NAME}}`
- etc.

---

## Environment Configuration

### Step 1: Update .env File

Add these variables to your `.env` file:

```env
# Brevo Email Service Configuration
BREVO_API_KEY=your-brevo-api-key-here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Qaras Hospitality Solutions

# Brevo Template IDs (from Brevo dashboard)
BREVO_TEMPLATE_EMAIL_VERIFICATION=1
BREVO_TEMPLATE_PASSWORD_RESET=2
BREVO_TEMPLATE_WELCOME_EMAIL=3
BREVO_TEMPLATE_BOOKING_CONFIRMATION=4

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### Step 2: Update Docker Environment (if using Docker)

Add to `.env.docker`:

```env
BREVO_API_KEY=your-brevo-api-key-here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Qaras Hospitality Solutions
BREVO_TEMPLATE_EMAIL_VERIFICATION=1
BREVO_TEMPLATE_PASSWORD_RESET=2
BREVO_TEMPLATE_WELCOME_EMAIL=3
BREVO_TEMPLATE_BOOKING_CONFIRMATION=4
```

---

## Testing

### Test 1: Register New User

1. Start the application:
```bash
npm run dev
```

2. Navigate to `/register`
3. Fill in registration form
4. Submit and check email inbox
5. Click verification link
6. Verify redirect to login

### Test 2: Resend Verification

1. Try to login with unverified account
2. Click "Resend verification email"
3. Check inbox for new email
4. Verify new link works

### Test 3: Password Reset

1. Go to `/forgot-password`
2. Enter email address
3. Check inbox for reset email
4. Click reset link
5. Set new password

### Test 4: Brevo Dashboard Monitoring

1. Go to Brevo dashboard
2. Navigate to **Statistics** → **Transactional**
3. View email delivery status
4. Check open rates and click rates

---

## API Endpoints

### POST /api/auth/register
Register new user and send verification email

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "companyName": "My Hotel"
}
```

### GET /api/auth/verify-email?token=xxx
Verify email with token

### POST /api/auth/resend-verification
Resend verification email

**Request:**
```json
{
  "email": "john@example.com"
}
```

### POST /api/auth/forgot-password
Request password reset

**Request:**
```json
{
  "email": "john@example.com"
}
```

---

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Verify `BREVO_API_KEY` is correct
2. **Check Template IDs**: Ensure template IDs match Brevo dashboard
3. **Check Sender Email**: Verify sender email is verified in Brevo
4. **Check Logs**: Look for errors in application logs
5. **Check Brevo Dashboard**: View delivery status in Statistics

### Template Variables Not Working

1. Ensure variable names match exactly (case-sensitive)
2. Use `{{params.VARIABLE_NAME}}` format in Brevo templates
3. Check service sends correct parameter names

### Verification Link Not Working

1. Check `NEXT_PUBLIC_APP_URL` is correct
2. Verify token hasn't expired (24 hours)
3. Check database for token match
4. Ensure `/verify-email` page exists

---

## Production Checklist

- [ ] Brevo account created and verified
- [ ] API key generated and secured
- [ ] Sender email/domain verified
- [ ] All 4 templates created in Brevo
- [ ] Template IDs noted and configured
- [ ] Environment variables set
- [ ] Database migration run
- [ ] Test emails sent successfully
- [ ] SPF/DKIM records configured (optional but recommended)
- [ ] Monitoring set up in Brevo dashboard

---

## Support

For issues:
- Check Brevo documentation: https://developers.brevo.com/
- Review application logs
- Contact support@qarashotels.com

---

© 2026 Qaras Hospitality Solutions. All rights reserved.
