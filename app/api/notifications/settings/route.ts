import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/services/notification.service';
import pool from '@/lib/db';
import { NotificationType } from '@/lib/types/enums';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's notification preferences using pool
    const [preferences] = await pool.query(
      `SELECT * FROM notification_preferences WHERE userId = ?`,
      [session.user.id]
    );

    // If no preferences found, return defaults
    if (!preferences || (preferences as any[]).length === 0) {
      // Get all notification types from the enum
      const allNotificationTypes = Object.values(NotificationType);
      
      return NextResponse.json({
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        subscribedTypes: allNotificationTypes,
        unsubscribedTypes: []
      });
    }

    const userPreferences = (preferences as any[])[0];

    // Parse subscribedTypes (handle JSON or fallback to comma-separated string)
    let subscribedTypes: string[];
    if (userPreferences.subscribedTypes) {
      try {
        subscribedTypes = JSON.parse(userPreferences.subscribedTypes);
      } catch {
        // Fallback: Split comma-separated string
        subscribedTypes = userPreferences.subscribedTypes
          .split(',')
          .map((type: string) => type.trim())
          .filter(Boolean);
      }
    } else {
      subscribedTypes = Object.values(NotificationType);
    }

    // Parse unsubscribedTypes (handle JSON or fallback to comma-separated string)
    let unsubscribedTypes: string[];
    if (userPreferences.unsubscribedTypes) {
      try {
        unsubscribedTypes = JSON.parse(userPreferences.unsubscribedTypes);
      } catch {
        // Fallback: Split comma-separated string
        unsubscribedTypes = userPreferences.unsubscribedTypes
          .split(',')
          .map((type: string) => type.trim())
          .filter(Boolean);
      }
    } else {
      unsubscribedTypes = [];
    }

    return NextResponse.json({
      emailEnabled: userPreferences.emailEnabled === 1,
      pushEnabled: userPreferences.pushEnabled === 1,
      inAppEnabled: userPreferences.inAppEnabled === 1,
      subscribedTypes,
      unsubscribedTypes
    });
  } catch (error: any) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { emailEnabled, pushEnabled, inAppEnabled, subscribedTypes, unsubscribedTypes } = body;

    const preferences = await notificationService.updateNotificationPreferences(
      session.user.id,
      {
        emailEnabled,
        pushEnabled,
        inAppEnabled,
        subscribedTypes,
        unsubscribedTypes
      }
    );

    return NextResponse.json({
      success: true,
      preferences: {
        emailEnabled: preferences.emailEnabled === 1,
        pushEnabled: preferences.pushEnabled === 1,
        inAppEnabled: preferences.inAppEnabled === 1,
        subscribedTypes: preferences.subscribedTypes,
        unsubscribedTypes: preferences.unsubscribedTypes
      }
    });
  } catch (error: any) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
