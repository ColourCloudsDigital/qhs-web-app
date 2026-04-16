import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';

export const dynamic = 'force-dynamic';

async function getVendorGateway(vendorId: string) {
  const [rows] = await pool.query(
    `SELECT * FROM vendor_payment_gateways WHERE vendorId = ? AND isActive = 1 AND isDefault = 1 LIMIT 1`,
    [vendorId]
  );
  if (!(rows as any[]).length) {
    // fallback: any active gateway
    const [fallback] = await pool.query(
      `SELECT * FROM vendor_payment_gateways WHERE vendorId = ? AND isActive = 1 LIMIT 1`,
      [vendorId]
    );
    return (fallback as any[])[0] || null;
  }
  return (rows as any[])[0];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.STAFF)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, orderId, email, hotelId } = body;

    if (!amount || !orderId) {
      return NextResponse.json({ error: 'amount and orderId are required' }, { status: 400 });
    }

    // Get vendorId from hotel
    const [hotelRows] = await pool.query('SELECT vendorId FROM hotels WHERE id = ?', [hotelId]);
    const vendorId = (hotelRows as any[])[0]?.vendorId;
    if (!vendorId) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

    const gateway = await getVendorGateway(vendorId);
    if (!gateway) {
      return NextResponse.json({ error: 'No active payment gateway configured. Please configure one in Settings > Payment.' }, { status: 400 });
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vendor/pos/payment-callback?orderId=${orderId}&provider=${gateway.provider}`;
    const customerEmail = email || 'guest@hotel.com';
    const amountKobo = Math.round(parseFloat(amount) * 100); // Paystack/Flutterwave use smallest unit

    if (gateway.provider === 'paystack') {
      // Paystack: Initialize transaction
      // Docs: https://paystack.com/docs/api/transaction/#initialize
      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gateway.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customerEmail,
          amount: amountKobo,
          reference: `POS-${orderId.slice(0, 8)}-${Date.now()}`,
          callback_url: callbackUrl,
          metadata: { orderId, source: 'pos' },
        }),
      });
      const data = await res.json();
      if (!data.status) {
        return NextResponse.json({ error: data.message || 'Paystack initialization failed' }, { status: 400 });
      }
      return NextResponse.json({
        provider: 'paystack',
        checkoutUrl: data.data.authorization_url,
        reference: data.data.reference,
        accessCode: data.data.access_code,
      });

    } else if (gateway.provider === 'flutterwave') {
      // Flutterwave: Create payment link
      // Docs: https://developer.flutterwave.com/docs/collecting-payments/standard
      const txRef = `POS-${orderId.slice(0, 8)}-${Date.now()}`;
      const res = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gateway.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: parseFloat(amount),
          currency: 'NGN',
          redirect_url: callbackUrl,
          customer: { email: customerEmail },
          customizations: { title: 'POS Payment', description: `Order ${orderId.slice(0, 8).toUpperCase()}` },
          meta: { orderId, source: 'pos' },
        }),
      });
      const data = await res.json();
      if (data.status !== 'success') {
        return NextResponse.json({ error: data.message || 'Flutterwave initialization failed' }, { status: 400 });
      }
      return NextResponse.json({
        provider: 'flutterwave',
        checkoutUrl: data.data.link,
        reference: txRef,
      });

    } else if (gateway.provider === 'opay') {
      // OPay: Create order
      // Docs: https://documentation.opayweb.com/docs/payment/create-order
      const txRef = `POS-${orderId.slice(0, 8)}-${Date.now()}`;
      const res = await fetch('https://sandboxapi.opayweb.com/api/v3/native/cashier/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${gateway.secretKey}`,
          MerchantId: gateway.merchantId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference: txRef,
          mchShortName: 'Hotel POS',
          productName: `Order ${orderId.slice(0, 8).toUpperCase()}`,
          productDesc: 'POS Order Payment',
          supplierName: 'Hotel',
          callbackUrl,
          returnUrl: callbackUrl,
          currency: 'NGN',
          totalAmount: { total: amountKobo, currency: 'NGN' },
          expireAt: 30,
          userInfo: { userEmail: customerEmail },
        }),
      });
      const data = await res.json();
      if (data.code !== '00000') {
        return NextResponse.json({ error: data.message || 'OPay initialization failed' }, { status: 400 });
      }
      return NextResponse.json({
        provider: 'opay',
        checkoutUrl: data.data.cashierUrl,
        reference: txRef,
      });
    }

    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  } catch (err) {
    console.error('Error initiating transfer:', err);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}
