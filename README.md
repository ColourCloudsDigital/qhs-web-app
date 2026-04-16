# Qaras Hospitality Solutions Management System

A comprehensive hotel management system built with Next.js, featuring booking management, QR menus, staff management, and more.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
mysql -u your_username -p your_database < scripts/add-verification-columns.sql

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## ✨ Features

- 🏨 **Hotel Management** - Multi-hotel support with vendor dashboard
- 📅 **Booking System** - Complete booking workflow with availability checking
- 📧 **Email Verification** - Secure registration with Brevo email templates
- 👥 **User Roles** - Super Admin, Vendor, Staff, and Customer roles
- 🍽️ **QR Menu System** - Digital menus with QR code generation
- 💳 **Payment Integration** - Paystack and Flutterwave support
- 📊 **Analytics Dashboard** - Booking statistics and revenue tracking
- 🔔 **Notifications** - Real-time notifications for bookings and updates
- 📱 **PWA Support** - Progressive Web App capabilities

## 📧 Email Verification Setup

The system uses Brevo for transactional emails. See detailed setup guides:

- **Quick Start**: [docs/QUICK_START.md](./docs/QUICK_START.md)
- **Full Brevo Setup**: [docs/BREVO_EMAIL_SETUP.md](./docs/BREVO_EMAIL_SETUP.md)

### Quick Setup

1. Create Brevo account and get API key
2. Create email templates in Brevo dashboard
3. Update `.env` with Brevo credentials and template IDs
4. Run database migration for verification columns

## 🗄️ Database Setup

```bash
# Run migrations
mysql -u username -p database < scripts/add-verification-columns.sql

# Or with Docker
docker exec -i qaras-mysql mysql -u qaras_user -pqaras_password qaras_hotel < scripts/add-verification-columns.sql
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker logs qaras-app

# Stop containers
docker-compose down
```

Access the application at http://localhost:8080

## 🔧 Environment Variables

Key environment variables (see `.env.example` for full list):

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/qaras_hotel

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Brevo Email
BREVO_API_KEY=your-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_TEMPLATE_EMAIL_VERIFICATION=1
BREVO_TEMPLATE_PASSWORD_RESET=2
BREVO_TEMPLATE_WELCOME_EMAIL=3

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📁 Project Structure

```
app/
├── (auth)/              # Authentication pages
├── (dashboard)/         # Dashboard pages
├── (marketing)/         # Public marketing pages
└── api/                 # API routes

components/
├── admin/              # Admin components
├── booking/            # Booking components
├── common/             # Shared components
└── ui/                 # UI components

lib/
├── services/           # Business logic services
├── utils/              # Utility functions
└── types/              # TypeScript types

docs/                   # Documentation
scripts/                # Database scripts
```

## 🔐 User Roles

- **Super Admin** - Full system access
- **Vendor** - Hotel owner/manager
- **Staff** - Hotel staff with limited permissions
- **Customer** - Guest/booking user

## 📚 Documentation

- [Quick Start Guide](./docs/QUICK_START.md)
- [Brevo Email Setup](./docs/BREVO_EMAIL_SETUP.md)
- [Staff Permissions](./docs/staff-permissions-system.md)
- [Docker Deployment](./DOCKER_QUICKSTART.md)

## 🧪 Testing

```bash
# Run tests
npm test

# Test email verification flow
npm run dev
# Navigate to /register and create account
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Database**: MySQL
- **Authentication**: NextAuth.js
- **Email**: Brevo API
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **Payment**: Paystack, Flutterwave
- **Deployment**: Docker, Vercel

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email` - Verify email
- `POST /api/auth/resend-verification` - Resend verification
- `POST /api/auth/forgot-password` - Password reset

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings/create` - Create booking
- `PATCH /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Cancel booking

### Hotels
- `GET /api/hotels` - List hotels
- `POST /api/hotels` - Create hotel
- `GET /api/hotels/[id]` - Get hotel details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

© 2026 Qaras Hospitality Solutions. All rights reserved.

## 🆘 Support

For support:
- Email: support@qarashotels.com
- Documentation: [docs/](./docs/)
- Issues: GitHub Issues
