import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getUserVendorId } from '@/lib/utils/vendor';

// GET /api/hotels/[id]/wifi/networks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Get all networks for this hotel
    const [networkRows] = await pool.query(
      'SELECT * FROM wifi_networks WHERE hotelId = ? ORDER BY name ASC',
      [hotelId]
    );

    return NextResponse.json({ networks: networkRows });
  } catch (error) {
    console.error('Error fetching WiFi networks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WiFi networks' },
      { status: 500 }
    );
  }
}

// POST /api/hotels/[id]/wifi/networks
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    
    // Validate required fields
    if (!data.name || !data.ssid || (!data.isPublic && !data.password)) {
      return NextResponse.json(
        { error: 'Name, SSID, and Password (for secured networks) are required' },
        { status: 400 }
      );
    }

    // Create network with UUID
    const networkId = data.id || uuidv4();
    
    await pool.query(
      `INSERT INTO wifi_networks (
        id, 
        hotelId, 
        name, 
        ssid, 
        password, 
        isPublic, 
        bandwidthLimit, 
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        networkId,
        hotelId,
        data.name,
        data.ssid,
        data.password,
        data.isPublic ? 1 : 0,
        data.bandwidthLimit || null,
        data.notes || null
      ]
    );

    return NextResponse.json({
      message: 'WiFi network created successfully',
      networkId
    });
  } catch (error) {
    console.error('Error creating WiFi network:', error);
    return NextResponse.json(
      { error: 'Failed to create WiFi network' },
      { status: 500 }
    );
  }
} 