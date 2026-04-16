import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// Handles redirect after payment (Paystack/Flutterwave/OPay redirect back here)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const orderId = searchParams.get('orderId');
  const provider = searchParams.get('provider');
  const reference = searchParams.get('reference') || searchParams.get('tx_ref') || searchParams.get('trxref');
  const status = searchParams.get('status'); // flutterwave sends 'successful' | 'cancelled'

  if (!orderId) {
    return NextResponse.redirect(new URL('/staff/pos?payment=error', request.url));
  }

  try {
    // Mark order as transfer-pending — webhook will confirm
    // For Flutterwave, status comes in redirect
    if (provider === 'flutterwave' && status === 'successful' && reference) {
      await pool.query(
        `UPDATE orders SET paymentStatus = 'Paid', transferReference = ?, updatedAt = NOW() WHERE id = ?`,
        [reference, orderId]
      );
    } else if (provider === 'paystack' && reference) {
      // Paystack: verify via API
      const [gwRows] = await pool.query(
        `SELECT vpg.secretKey FROM orders o
         JOIN hotels h ON o.hotelId = h.id
         JOIN vendor_payment_gateways vpg ON vpg.vendorId = h.vendorId AND vpg.provider = 'paystack'
         WHERE o.id = ? LIMIT 1`,
        [orderId]
      );
      const secretKey = (gwRows as any[])[0]?.secretKey;
      if (secretKey) {
        const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        const data = await res.json();
        if (data.data?.status === 'success') {
          await pool.query(
            `UPDATE orders SET paymentStatus = 'Paid', transferReference = ?, updatedAt = NOW() WHERE id = ?`,
            [reference, orderId]
          );
        }
      }
    }

    return NextResponse.redirect(new URL(`/staff/pos?payment=success&orderId=${orderId}`, request.url));
  } catch (err) {
    console.error('Payment callback error:', err);
    return NextResponse.redirect(new URL('/staff/pos?payment=error', request.url));
  }
}
