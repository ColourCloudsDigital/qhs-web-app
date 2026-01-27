# Automated Checkout System

## Overview
This system automatically processes expired bookings and frees up room units when guests' checkout time has passed. It includes both automated scheduled processing and manual management capabilities.

## Components

### 1. Automated Checkout Service
**File**: `lib/services/automated-checkout.service.ts`

**Features**:
- Process all expired bookings in batch
- Process specific bookings individually
- Get statistics about expired bookings
- Send checkout notifications and emails
- Clean up old archived bookings

**Key Functions**:
- `processExpiredBookings()` - Main batch processing function
- `processSpecificBooking(bookingId)` - Process individual booking
- `getExpiredBookingsStats()` - Get counts and details of expired bookings

### 2. API Endpoints

#### Automated Checkout API
**Endpoint**: `/api/bookings/automated-checkout`
- `GET` - Get statistics about expired bookings
- `POST` - Process all expired bookings

**Authentication**: Requires `Authorization: Bearer {CRON_SECRET}` header

#### Individual Checkout API
**Endpoint**: `/api/bookings/[id]/checkout`
- `POST` - Manually checkout a specific booking

**Authentication**: Requires valid session with ADMIN, VENDOR, or STAFF role

### 3. Cron Job Script
**File**: `scripts/automated-checkout-cron.js`

**Usage**:
```bash
# Run manually
node scripts/automated-checkout-cron.js

# Add to crontab (runs every 2 hours)
0 */2 * * * /path/to/node /path/to/scripts/automated-checkout-cron.js
```

### 4. Dashboard Component
**File**: `components/dashboard/AutomatedCheckoutPanel.tsx`

**Features**:
- View expired bookings statistics
- Manually process all expired bookings
- Checkout individual bookings
- Real-time status updates

## Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:

```env
# Required for cron job authentication
CRON_SECRET=your-secure-random-secret-key

# Optional: Logging
LOG_FILE=/path/to/checkout.log
ERROR_LOG_FILE=/path/to/checkout-errors.log

# Your application URL
NEXT_PUBLIC_API_URL=https://your-domain.com
# or for local development
API_URL=http://localhost:3000
```

### 2. Database Schema
The system uses existing tables but relies on these key fields:

**bookings table**:
- `checkOutDate` - Used to identify expired bookings
- `status` - Updated to 'CHECKED_OUT'

**room_units table**:
- `status` - Updated from 'reserved'/'occupied' to 'available'
- `currentBookingId` - Cleared when room is freed
- `lastCleanedAt` - Updated when room becomes available

### 3. Cron Job Setup

#### Option A: System Crontab
```bash
# Edit crontab
crontab -e

# Add this line to run every 2 hours
0 */2 * * * /usr/bin/node /path/to/your/app/scripts/automated-checkout-cron.js

# Or run daily at 2 AM
0 2 * * * /usr/bin/node /path/to/your/app/scripts/automated-checkout-cron.js
```

#### Option B: Vercel Cron (for Vercel deployments)
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/bookings/automated-checkout",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

#### Option C: External Cron Service
Use services like:
- **Cron-job.org**: Free web-based cron service
- **EasyCron**: Paid cron service with monitoring
- **GitHub Actions**: For GitHub-hosted projects

Example GitHub Action (`.github/workflows/automated-checkout.yml`):
```yaml
name: Automated Checkout
on:
  schedule:
    - cron: '0 */2 * * *'  # Every 2 hours
  workflow_dispatch:  # Allow manual trigger

jobs:
  checkout:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Automated Checkout
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.API_URL }}/api/bookings/automated-checkout"
```

### 4. Dashboard Integration
Add the AutomatedCheckoutPanel to your admin/vendor dashboard:

```tsx
import AutomatedCheckoutPanel from '@/components/dashboard/AutomatedCheckoutPanel';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Other dashboard components */}
      <AutomatedCheckoutPanel />
    </div>
  );
}
```

## How It Works

### Automatic Processing Flow
1. **Identification**: System finds bookings where `checkOutDate < CURDATE()` and status is 'CHECKED_IN' or 'CONFIRMED'
2. **Status Update**: Changes booking status to 'CHECKED_OUT'
3. **Room Liberation**: Updates room_units to 'available' and clears `currentBookingId`
4. **Notifications**: Sends checkout notifications to customers
5. **Email Confirmation**: Sends checkout confirmation emails
6. **Logging**: Records processing results and any errors

### Manual Processing
Hotel staff can:
- View expired bookings in the dashboard
- Process all expired bookings at once
- Checkout individual bookings manually
- Monitor processing statistics

### Room State Transitions
```
BOOKING CREATED:
room_units.status: 'available' → 'reserved'
room_units.currentBookingId: NULL → booking_id

CHECK-IN (manual):
room_units.status: 'reserved' → 'occupied'

AUTOMATED CHECKOUT:
room_units.status: 'occupied'/'reserved' → 'available'
room_units.currentBookingId: booking_id → NULL
room_units.lastCleanedAt: updated to NOW()
```

## Monitoring and Maintenance

### Logs and Monitoring
- Check cron job logs regularly
- Monitor error rates in checkout processing
- Set up alerts for failed automated checkouts

### Performance Considerations
- The system processes bookings in batches
- Large hotels should consider running more frequently (every hour)
- Database indexes on `checkOutDate` and `status` improve performance

### Error Handling
- Individual booking failures don't stop batch processing
- All errors are logged and reported
- Failed checkouts can be retried manually

### Maintenance Tasks
- Archive old checked-out bookings periodically
- Clean up orphaned room_units records
- Monitor room availability accuracy

## Customization Options

### Checkout Grace Period
Modify the date comparison to add a grace period:
```sql
-- Instead of: WHERE b.checkOutDate < CURDATE()
-- Use: WHERE b.checkOutDate < DATE_SUB(CURDATE(), INTERVAL -2 HOUR)
```

### Notification Customization
- Modify email templates in the email service
- Add SMS notifications
- Integrate with hotel management systems

### Business Rules
- Add late checkout fees
- Implement different checkout times per room type
- Handle VIP guests differently

## Troubleshooting

### Common Issues
1. **Cron job not running**: Check crontab syntax and file permissions
2. **Authentication failures**: Verify CRON_SECRET matches
3. **Database connection issues**: Check connection pool settings
4. **Email delivery failures**: Verify SMTP configuration

### Manual Recovery
If automated checkout fails, you can:
1. Use the dashboard to process bookings manually
2. Run the cron script manually
3. Execute SQL directly to free room units

### Testing
Test the system with:
```bash
# Test API endpoint
curl -X POST \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json" \
  http://localhost:3000/api/bookings/automated-checkout

# Test specific booking checkout
curl -X POST \
  -H "Authorization: Bearer your-session-token" \
  http://localhost:3000/api/bookings/booking-id/checkout
```

## Security Considerations
- Use strong CRON_SECRET values
- Limit API access to authorized systems only
- Monitor for unusual checkout patterns
- Implement rate limiting on checkout endpoints
- Log all automated actions for audit trails

This system ensures your hotel rooms are automatically freed up when bookings expire, maintaining accurate availability and preventing overbooking issues.