import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { customerNotificationService } from '@/lib/services/customer-notification.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const subscriptionData = await request.json();
    const { userId, planId, action } = subscriptionData;

    // Get plan details
    const [planRows] = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [planId]
    );

    const plan = (planRows as any[])[0];
    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // Handle different subscription actions
    switch (action) {
      case 'create':
        // Create new subscription
        const [result] = await pool.query(
          `INSERT INTO subscriptions (userId, planId, status, startDate, expiryDate, createdAt, updatedAt)
           VALUES (?, ?, 'ACTIVE', NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), NOW(), NOW())`,
          [userId, planId, plan.durationDays || 30]
        );

        // Send notification
        await customerNotificationService.sendSubscriptionNotification('created', {
          subscriptionId: (result as any).insertId.toString(),
          userId,
          planName: plan.name,
          status: 'ACTIVE',
          amount: plan.price
        });
        break;

      case 'renew':
        // Renew existing subscription
        await pool.query(
          `UPDATE subscriptions 
           SET expiryDate = DATE_ADD(expiryDate, INTERVAL ? DAY), updatedAt = NOW()
           WHERE userId = ? AND planId = ? AND status = 'ACTIVE'`,
          [plan.durationDays || 30, userId, planId]
        );

        // Get updated subscription
        const [renewedSub] = await pool.query(
          'SELECT * FROM subscriptions WHERE userId = ? AND planId = ? AND status = "ACTIVE"',
          [userId, planId]
        );

        if ((renewedSub as any[]).length > 0) {
          await customerNotificationService.sendSubscriptionNotification('renewed', {
            subscriptionId: (renewedSub as any[])[0].id.toString(),
            userId,
            planName: plan.name,
            status: 'ACTIVE',
            expiryDate: (renewedSub as any[])[0].expiryDate,
            amount: plan.price
          });
        }
        break;

      case 'cancel':
        // Cancel subscription
        await pool.query(
          `UPDATE subscriptions 
           SET status = 'CANCELLED', updatedAt = NOW()
           WHERE userId = ? AND planId = ? AND status = 'ACTIVE'`,
          [userId, planId]
        );

        // Get cancelled subscription
        const [cancelledSub] = await pool.query(
          'SELECT * FROM subscriptions WHERE userId = ? AND planId = ? AND status = "CANCELLED"',
          [userId, planId]
        );

        if ((cancelledSub as any[]).length > 0) {
          await customerNotificationService.sendSubscriptionNotification('cancelled', {
            subscriptionId: (cancelledSub as any[])[0].id.toString(),
            userId,
            planName: plan.name,
            status: 'CANCELLED'
          });
        }
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to handle subscription' },
      { status: 500 }
    );
  }
}