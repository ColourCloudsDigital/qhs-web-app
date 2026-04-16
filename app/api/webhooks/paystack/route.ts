/**
 * Paystack Webhook
 * Docs: https://paystack.com/docs/payments/webhooks
 * Register URL: https://yourdomain.com/api/webhooks/paystack
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const reference = event.data?.reference || '';

    // Find the vendor gateway by matching the secret key via HMAC
    // We try all active paystack gateways and verify signature
    const [gateways] = await pool.query(
      `SELECT secretKey, vendorId FROM vendor_payment_gateways WHERE provider = 'paystack' AND isActive = 1`
    );

    let verified = false;
    for (const gw of gateways as any[]) {
      const hash = crypto.createHmac('sha512', gw.secretKey).update(rawBody).digest('hex');
      if (hash === signature) { verified = true; break; }
    }

    if (!verified) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (event.event === 'charge.success') {
      const { reference: ref, amount, metadata } = event.data;
      const orderId = metadata?.orderId;

      if (orderId) {
        await pool.query(
          `UPDATE orders SET paymentStatus = 'Paid', transferReference = ?, updatedAt = NOW() WHERE id = ?`,
          [ref, orderId]
        );
        // Link to bill if order has billId
        await linkOrderToBill(orderId, amount / 100);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Paystack webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function linkOrderToBill(orderId: string, amount: number) {
  try {
    const [orderRows] = await pool.query('SELECT billId FROM orders WHERE id = ?', [orderId]);
    const billId = (orderRows as any[])[0]?.billId;
    if (!billId) return;

    const { randomUUID } = await import('crypto');
    await pool.query(
      `INSERT INTO bill_payments (id, billId, orderId, amount, paymentType, createdAt) VALUES (?, ?, ?, ?, 'order', NOW())`,
      [randomUUID(), billId, orderId, amount]
    );
    await pool.query(
      `UPDATE customer_bills SET totalAmount = totalAmount + ?, updatedAt = NOW() WHERE id = ?`,
      [amount, billId]
    );
  } catch (err) {
    console.error('Error linking order to bill:', err);
  }
}
