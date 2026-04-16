/**
 * Flutterwave Webhook
 * Docs: https://developer.flutterwave.com/docs/integration-guides/webhooks
 * Register URL: https://yourdomain.com/api/webhooks/flutterwave
 * Header: verif-hash (set in Flutterwave dashboard)
 */
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const verifHash = request.headers.get('verif-hash');

    if (!verifHash) {
      return NextResponse.json({ error: 'Missing verif-hash header' }, { status: 401 });
    }

    // Verify against all active flutterwave gateways
    const [gateways] = await pool.query(
      `SELECT webhookSecret, vendorId FROM vendor_payment_gateways WHERE provider = 'flutterwave' AND isActive = 1`
    );

    let verified = false;
    for (const gw of gateways as any[]) {
      if (gw.webhookSecret && gw.webhookSecret === verifHash) { verified = true; break; }
    }

    if (!verified) {
      return NextResponse.json({ error: 'Invalid verif-hash' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    if (event.event === 'charge.completed' && event.data?.status === 'successful') {
      const { tx_ref, amount, meta } = event.data;
      const orderId = meta?.orderId;

      if (orderId) {
        await pool.query(
          `UPDATE orders SET paymentStatus = 'Paid', transferReference = ?, updatedAt = NOW() WHERE id = ?`,
          [tx_ref, orderId]
        );
        await linkOrderToBill(orderId, parseFloat(amount));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Flutterwave webhook error:', err);
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
