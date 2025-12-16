import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getUserVendorId } from '@/lib/utils/vendor';

// GET /api/hotels/[id]/wifi/credentials
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vendorId } = await getUserVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    const networkId = searchParams.get('networkId');
    
    const hotelId = params.id;

    // Verify hotel belongs to vendor
    const [hotelRows] = await pool.query(
      'SELECT id FROM hotels WHERE id = ? AND vendorId = ?',
      [hotelId, vendorId]
    );

    const hotels = hotelRows as any[];
    if (hotels.length === 0) {
      return NextResponse.json(
        { error: 'Hotel not found or not authorized' },
        { status: 404 }
      );
    }

    // Base query
    let query = `
      SELECT c.*, n.name as networkName, n.ssid
      FROM wifi_credentials c
      LEFT JOIN wifi_networks n ON c.networkId = n.id
      WHERE c.hotelId = ?
    `;
    
    const queryParams: any[] = [hotelId];

    // Add isActive filter if provided
    if (isActive !== null) {
      query += ' AND c.isActive = ?';
      queryParams.push(isActive === 'true' ? 1 : 0);
    }

    // Add networkId filter if provided
    if (networkId) {
      query += ' AND c.networkId = ?';
      queryParams.push(networkId);
    }

    // Add ordering
    query += ' ORDER BY c.validFrom DESC';

    // Execute query
    const [credentialRows] = await pool.query(query, queryParams);

    return NextResponse.json({ credentials: credentialRows });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

// POST /api/hotels/[id]/wifi/credentials
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vendorId } = await getUserVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hotelId = params.id;

    // Verify hotel belongs to vendor
    const [hotelRows] = await pool.query(
      'SELECT id FROM hotels WHERE id = ? AND vendorId = ?',
      [hotelId, vendorId]
    );

    const hotels = hotelRows as any[];
    if (hotels.length === 0) {
      return NextResponse.json(
        { error: 'Hotel not found or not authorized' },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Generate a random username and password if not provided
    const username = data.username || generateRandomString(8);
    const password = data.password || generateRandomString(8);
    const validFrom = data.validFrom || new Date().toISOString();
    const validUntil = data.validUntil || null;
    const isActive = data.isActive !== undefined ? data.isActive : true;
    const networkId = data.networkId || null;

    // Verify network belongs to this hotel if provided
    if (networkId) {
      const [networkRows] = await pool.query(
        'SELECT id FROM wifi_networks WHERE id = ? AND hotelId = ?',
        [networkId, hotelId]
      );

      const networks = networkRows as any[];
      if (networks.length === 0) {
        return NextResponse.json(
          { error: 'Network not found or not associated with this hotel' },
          { status: 404 }
        );
      }
    }

    // Generate UUID for new credential
    const id = uuidv4();

    // Insert credential
    await pool.query(
      `INSERT INTO wifi_credentials (
        id, hotelId, username, password, validFrom, validUntil, isActive, networkId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        hotelId,
        username,
        password,
        validFrom,
        validUntil,
        isActive ? 1 : 0,
        networkId
      ]
    );

    return NextResponse.json({
      id,
      username,
      password,
      message: 'WiFi credential created successfully',
    });
  } catch (error) {
    console.error('Error creating credential:', error);
    return NextResponse.json(
      { error: 'Failed to create credential' },
      { status: 500 }
    );
  }
}

// Helper function to generate random string
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
} 