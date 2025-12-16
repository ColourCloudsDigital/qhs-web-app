import pool from '@/lib/db';
import webpush from 'web-push';

// Initialize web-push with VAPID keys
// These should be stored in environment variables
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.CONTACT_EMAIL || 'info@qarashotels.com'),
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  // Try to get VAPID keys from database if not in env
  const getVapidKeysFromDb = async () => {
    try {
      const [rows] = await pool.query(`
        SELECT publicKey, privateKey FROM vapid_keys
        WHERE isDefault = TRUE
        LIMIT 1
      `);
      
      if (rows && (rows as any[]).length > 0) {
        const keys = (rows as any[])[0];
        webpush.setVapidDetails(
          'mailto:' + (process.env.CONTACT_EMAIL || 'info@qarashotels.com'),
          keys.publicKey,
          keys.privateKey
        );
      } else {
        console.warn('No VAPID keys found in environment or database. Push notifications will not work.');
      }
    } catch (err) {
      console.error('Failed to get VAPID keys from database:', err);
    }
  };
  
  getVapidKeysFromDb();
}

// Define types
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number;
}

interface SendPushParams {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
  timestamp?: number;
}


export async function saveSubscription(userId: string, subscription: PushSubscription, userAgent?: string) {
  try {
    // Check if the subscription already exists
    const [existing] = await pool.query(
      `SELECT * FROM push_subscriptions WHERE endpoint = ?`,
      [subscription.endpoint]
    );

    if (existing && (existing as any[]).length > 0) {
      // Update the existing subscription
      await pool.query(
        `UPDATE push_subscriptions 
         SET userId = ?, p256dh = ?, auth = ?, userAgent = ?, updatedAt = NOW()
         WHERE endpoint = ?`,
        [userId, subscription.keys.p256dh, subscription.keys.auth, userAgent, subscription.endpoint]
      );
      
      const [updated] = await pool.query(
        `SELECT * FROM push_subscriptions WHERE endpoint = ?`,
        [subscription.endpoint]
      );
      
      return (updated as any[])[0];
    } else {
      // Create a new subscription
      const [result] = await pool.query(
        `INSERT INTO push_subscriptions 
         (id, userId, endpoint, expirationTime, p256dh, auth, userAgent)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
        [
          userId, 
          subscription.endpoint, 
          subscription.expirationTime || null, 
          subscription.keys.p256dh, 
          subscription.keys.auth,
          userAgent
        ]
      );
      
      const insertId = (result as any).insertId;
      
      const [inserted] = await pool.query(
        `SELECT * FROM push_subscriptions WHERE id = ?`,
        [insertId]
      );
      
      return (inserted as any[])[0];
    }
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
}

export async function deleteSubscription(endpoint: string) {
  try {
    await pool.query(
      `DELETE FROM push_subscriptions WHERE endpoint = ?`,
      [endpoint]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    throw error;
  }
}

export async function sendPushNotification({
  userId,
  title,
  body,
  icon = '/favicon.ico',
  badge,
  image,
  data = {},
  actions = [],
  tag,
  requireInteraction = false,
  renotify = false,
  silent = false,
  timestamp
}: SendPushParams) {
  try {
    // Get all subscriptions for this user
    const [subscriptions] = await pool.query(
      `SELECT * FROM push_subscriptions WHERE userId = ?`,
      [userId]
    );

    if (!(subscriptions as any[]).length) {
      return { success: false, message: 'No push subscriptions found for user' };
    }

    // Prepare the notification payload
    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon,
        badge,
        image,
        actions,
        tag,
        requireInteraction,
        renotify,
        silent,
        timestamp: timestamp || Date.now()
      },
      data: {
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://app.qarashotels.com',
        ...data
      }
    });

    // Send push notifications to all subscriptions
    const results = await Promise.allSettled(
      (subscriptions as any[]).map(async (subscription: any) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          return await webpush.sendNotification(pushSubscription, payload);
        } catch (error: any) {
          // If subscription is expired or invalid, delete it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await pool.query(
              `DELETE FROM push_subscriptions WHERE id = ?`,
              [subscription.id]
            );
          }
          throw error;
        }
      })
    );

    // Count successes and failures
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    return {
      success: successful > 0,
      sent: successful,
      failed,
      total: (subscriptions as any[]).length
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

export async function getUserPushSubscriptions(userId: string) {
  try {
    const [subscriptions] = await pool.query(
      `SELECT id, endpoint, userAgent, createdAt, updatedAt
       FROM push_subscriptions 
       WHERE userId = ?`,
      [userId]
    );
    
    return subscriptions;
  } catch (error) {
    console.error('Error getting user push subscriptions:', error);
    throw error;
  }
}

// Generate VAPID keys utility function
export function generateVAPIDKeys() {
  return webpush.generateVAPIDKeys();
}