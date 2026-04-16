import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// PATCH /api/orders/[orderId] — update payment fields (billId, cardReference, paymentStatus, transferReference)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'VENDOR' && session.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = params;
    const body = await request.json();
    const { billId, cardReference, paymentStatus, transferReference, customerId } = body;

    const fields: string[] = ['updatedAt = NOW()'];
    const values: any[] = [];

    if (paymentStatus !== undefined) { fields.push('paymentStatus = ?'); values.push(paymentStatus); }
    if (cardReference !== undefined) { fields.push('cardReference = ?'); values.push(cardReference); }
    if (transferReference !== undefined) { fields.push('transferReference = ?'); values.push(transferReference); }
    if (billId !== undefined) { fields.push('billId = ?'); values.push(billId); }
    if (customerId !== undefined) { fields.push('customerId = ?'); values.push(customerId); }

    if (fields.length === 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(orderId);
    await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);

    // If billId provided, create bill_payment entry and update bill total
    if (billId) {
      const [orderRows] = await pool.query('SELECT totalAmount FROM orders WHERE id = ?', [orderId]);
      const amount = parseFloat((orderRows as any[])[0]?.totalAmount || 0);

      // Check if already linked
      const [existing] = await pool.query('SELECT id FROM bill_payments WHERE orderId = ?', [orderId]);
      if ((existing as any[]).length === 0) {
        await pool.query(
          `INSERT INTO bill_payments (id, billId, orderId, amount, paymentType, createdAt) VALUES (?, ?, ?, ?, 'order', NOW())`,
          [randomUUID(), billId, orderId, amount]
        );
        await pool.query(
          `UPDATE customer_bills SET totalAmount = totalAmount + ?, updatedAt = NOW() WHERE id = ?`,
          [amount, billId]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating order:', err);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
