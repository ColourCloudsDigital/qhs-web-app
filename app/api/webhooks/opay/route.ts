/**
 * OPay Webhook
 * Docs: https://documentation.opayweb.com/docs/payment/webhook
 * Register URL: https://yourdomain.com/api/webhooks/opay
 * OPay sends HMAC-SHA512 in header: sign
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sign = request.headers.get('sign');

    if (!sign) {
      return NextResponse.json({ error: 'Missing sign header' }, { status: 401 });
    }

    const [gateways] = await pool.query(
      `SELECT secretKey, vendorId FROM vendor_payment_gateways WHERE provider = 'opay' AND isActive = 1`
    );

    let verified = false;
    for (const gw of gateways as any[]) {
      const hash = crypto.createHmac('sha512', gw.secretKey).update(rawBody).digest('hex');
      if (hash === sign) { verified = true; break; }
    }

    if (!verified) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // OPay sends status: 'SUCCESS' on successful payment
    if (event.status === 'SUCCESS') {
      const { reference, amount } = event;
      // reference format: POS-{orderId8}-{timestamp}
      const orderIdPart = reference?.split('-')[1];
      if (orderIdPart) {
        const [orderRows] = await pool.query(
          `SELECT id FROM orders WHERE id LIKE ? LIMIT 1`,
          [`${orderIdPart}%`]
        );
        const orderId = (orderRows as any[])[0]?.id;
        if (orderId) {
          await pool.query(
            `UPDATE orders SET paymentStatus = 'Paid', transferReference = ?, updatedAt = NOW() WHERE id = ?`,
            [reference, orderId]
          );
          await linkOrderToBill(orderId, parseFloat(amount?.total || 0) / 100);
        }
      }
    }

    return NextResponse.json({ result: '00000', message: 'success' });
  } catch (err) {
    console.error('OPay webhook error:', err);
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
