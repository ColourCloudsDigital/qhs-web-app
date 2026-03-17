# Quick Start - Email Verification System

## 1. Database Setup (5 minutes)

Run the migration to add verification columns:

```bash
# Connect to your database and run:
mysql -u your_username -p your_database < scripts/add-verification-columns.sql
```

Or if using Docker:
```bash
docker exec -i qaras-mysql mysql -u qaras_user -pqaras_password qaras_hotel < scripts/add-verification-columns.sql
```

## 2. Brevo Setup (10 minutes)

### Get API Key
1. Sign up at [Brevo](https://www.brevo.com/)
2. Go to Settings → SMTP & API → API Keys
3. Generate new API key
4. Copy the key

### Create Templates
Create 3 templates in Brevo dashboard:

**Template 1: Email Verification**
- Variables: `USER_NAME`, `VERIFICATION_URL`, `EXPIRY_HOURS`, `APP_NAME`
- Note the Template ID

**Template 2: Password Reset**
- Variables: `USER_NAME`, `RESET_URL`, `EXPIRY_HOURS`, `APP_NAME`
- Note the Template ID

**Template 3: Welcome Email**
- Variables: `USER_NAME`, `LOGIN_URL`, `APP_NAME`
- Note the Template ID

See [BREVO_EMAIL_SETUP.md](./BREVO_EMAIL_SETUP.md) for detailed template HTML.

## 3. Environment Configuration (2 minutes)

Update your `.env` file:

```env
# Brevo Configuration
BREVO_API_KEY=your-api-key-here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Qaras Hotels

# Template IDs from Brevo
BREVO_TEMPLATE_EMAIL_VERIFICATION=1
BREVO_TEMPLATE_PASSWORD_RESET=2
BREVO_TEMPLATE_WELCOME_EMAIL=3

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## 4. Test (3 minutes)

```bash
# Start the app
npm run dev

# Or with Docker
docker-compose up
```

1. Go to http://localhost:3000/register
2. Register a new account
3. Check your email for verification link
4. Click link to verify
5. Login at http://localhost:3000/login

## Features Implemented

✅ Email verification on registration
✅ Resend verification email
✅ Password reset via email
✅ Brevo template integration
✅ Token expiry (24 hours)
✅ Secure token generation
✅ Google sign-in removed from login

## File Structure

```
app/
├── api/
│   └── auth/
│       ├── register/route.ts          # Registration with email verification
│       ├── login/route.ts             # Login (requires verified email)
│       ├── verify-email/route.ts      # Email verification endpoint
│       ├── resend-verification/route.ts # Resend verification
│       └── forgot-password/route.ts   # Password reset
├── (auth)/
│   ├── login/page.tsx                 # Login page (Google removed)
│   └── register/page.tsx              # Registration page
└── verify-email/page.tsx              # Email verification page

lib/
└── services/
    └── brevo-email.service.ts         # Brevo email service

scripts/
└── add-verification-columns.sql       # Database migration

docs/
├── BREVO_EMAIL_SETUP.md              # Detailed Brevo setup
└── QUICK_START.md                     # This file
```

## Troubleshooting

**Emails not sending?**
- Check BREVO_API_KEY is correct
- Verify sender email in Brevo dashboard
- Check template IDs match

**Verification link not working?**
- Check NEXT_PUBLIC_APP_URL is correct
- Verify database has verificationToken column
- Check token hasn't expired

**Login fails?**
- Ensure email is verified (emailVerified column not NULL)
- Check account is active (isActive = 1)
- Verify password is correct

## Next Steps

- Customize Brevo templates with your branding
- Set up domain authentication in Brevo
- Configure SPF/DKIM records
- Add booking confirmation emails
- Monitor email delivery in Brevo dashboard

## Support

Need help? Check:
- [Full Brevo Setup Guide](./BREVO_EMAIL_SETUP.md)
- [Brevo Documentation](https://developers.brevo.com/)
- Application logs for errors
