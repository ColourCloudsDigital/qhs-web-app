import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { UserRole } from '@/lib/types/enums';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

async function getVendorId(userId: string) {
  const [rows] = await pool.query('SELECT id FROM vendors WHERE userId = ?', [userId]);
  return (rows as any[])[0]?.id || null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const vendorId = await getVendorId(session.user.id);
    if (!vendorId) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    const [rows] = await pool.query(
      `SELECT id, vendorId, provider, publicKey, isActive, isDefault, isTest, merchantId, createdAt, updatedAt
       FROM vendor_payment_gateways WHERE vendorId = ?`,
      [vendorId]
    );
    // Never return secret keys in GET
    return NextResponse.json({ gateways: rows });
  } catch (err) {
    console.error('Error fetching gateways:', err);
    return NextResponse.json({ error: 'Failed to fetch payment gateways' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.VENDOR && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const vendorId = await getVendorId(session.user.id);
    if (!vendorId) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    const body = await request.json();
    const { provider, publicKey, secretKey, encryptionKey, webhookSecret, isActive, isDefault, isTest, merchantId } = body;

    if (!provider || !['paystack', 'flutterwave', 'opay'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider. Must be paystack, flutterwave, or opay' }, { status: 400 });
    }
    if (!secretKey) return NextResponse.json({ error: 'Secret key is required' }, { status: 400 });

    // If setting as default, unset others
    if (isDefault) {
      await pool.query('UPDATE vendor_payment_gateways SET isDefault = 0 WHERE vendorId = ?', [vendorId]);
    }

    // Upsert
    const [existing] = await pool.query(
      'SELECT id FROM vendor_payment_gateways WHERE vendorId = ? AND provider = ?',
      [vendorId, provider]
    );

    if ((existing as any[]).length > 0) {
      const existingId = (existing as any[])[0].id;
      await pool.query(
        `UPDATE vendor_payment_gateways SET publicKey=?, secretKey=?, encryptionKey=?, webhookSecret=?,
         isActive=?, isDefault=?, isTest=?, merchantId=?, updatedAt=NOW() WHERE id=?`,
        [publicKey || null, secretKey, encryptionKey || null, webhookSecret || null,
         isActive ? 1 : 0, isDefault ? 1 : 0, isTest !== false ? 1 : 0, merchantId || null, existingId]
      );
      return NextResponse.json({ success: true, id: existingId, message: `${provider} gateway updated` });
    } else {
      const id = randomUUID();
      await pool.query(
        `INSERT INTO vendor_payment_gateways (id, vendorId, provider, publicKey, secretKey, encryptionKey, webhookSecret, isActive, isDefault, isTest, merchantId, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [id, vendorId, provider, publicKey || null, secretKey, encryptionKey || null, webhookSecret || null,
         isActive ? 1 : 0, isDefault ? 1 : 0, isTest !== false ? 1 : 0, merchantId || null]
      );
      return NextResponse.json({ success: true, id, message: `${provider} gateway configured` });
    }
  } catch (err) {
    console.error('Error saving gateway:', err);
    return NextResponse.json({ error: 'Failed to save payment gateway' }, { status: 500 });
  }
}
