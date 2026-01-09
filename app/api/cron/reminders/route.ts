import { NextRequest, NextResponse } from 'next/server';
import { customerNotificationService } from '@/lib/services/customer-notification.service';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you might want to add authentication)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Send reminder notifications
    await customerNotificationService.sendReminderNotifications();

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder notifications sent successfully' 
    });
  } catch (error) {
    console.error('Error sending reminder notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder notifications' },
      { status: 500 }
    );
  }
}

// Allow GET for testing purposes
export async function GET(request: NextRequest) {
  try {
    // For testing - remove in production or add proper authentication
    await customerNotificationService.sendReminderNotifications();

    return NextResponse.json({ 
      success: true, 
      message: 'Reminder notifications sent successfully (test)' 
    });
  } catch (error) {
    console.error('Error sending reminder notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder notifications' },
      { status: 500 }
    );
  }
}