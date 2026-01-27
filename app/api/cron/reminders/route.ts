import { NextRequest, NextResponse } from 'next/server';
import { customerNotificationService } from '@/lib/services/customer-notification.service';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret-key';
    
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
      { 
        error: 'Failed to send reminder notifications',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Allow GET requests for testing purposes
    const searchParams = request.nextUrl.searchParams;
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret-key';
    
    if (secret !== cronSecret) {
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
      { 
        error: 'Failed to send reminder notifications',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}