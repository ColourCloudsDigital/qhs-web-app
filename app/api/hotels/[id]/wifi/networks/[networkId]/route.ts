import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getUserVendorId } from '@/lib/utils/vendor';

// GET /api/hotels/[id]/wifi/networks/[networkId]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; networkId: string } }
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

    const { id: hotelId, networkId } = params;

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

    // Get specific network
    const [networkRows] = await pool.query(
      'SELECT * FROM wifi_networks WHERE id = ? AND hotelId = ?',
      [networkId, hotelId]
    );

    const networks = networkRows as any[];
    if (networks.length === 0) {
      return NextResponse.json(
        { error: 'WiFi network not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ network: networks[0] });
  } catch (error) {
    console.error('Error fetching WiFi network:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WiFi network' },
      { status: 500 }
    );
  }
}

// PUT /api/hotels/[id]/wifi/networks/[networkId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; networkId: string } }
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

    const { id: hotelId, networkId } = params;

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

    // Verify network exists
    const [networkRows] = await pool.query(
      'SELECT id FROM wifi_networks WHERE id = ? AND hotelId = ?',
      [networkId, hotelId]
    );

    const networks = networkRows as any[];
    if (networks.length === 0) {
      return NextResponse.json(
        { error: 'WiFi network not found' },
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

    // Update network
    await pool.query(
      `UPDATE wifi_networks SET 
        name = ?, 
        ssid = ?, 
        password = ?, 
        isPublic = ?, 
        bandwidthLimit = ?, 
        notes = ?
      WHERE id = ? AND hotelId = ?`,
      [
        data.name,
        data.ssid,
        data.password,
        data.isPublic ? 1 : 0,
        data.bandwidthLimit || null,
        data.notes || null,
        networkId,
        hotelId
      ]
    );

    // Update related credentials if the network is updated
    if (data.updateCredentials) {
      await pool.query(
        'UPDATE wifi_credentials SET networkId = ? WHERE networkId = ?',
        [networkId, networkId]
      );
    }

    return NextResponse.json({
      message: 'WiFi network updated successfully'
    });
  } catch (error) {
    console.error('Error updating WiFi network:', error);
    return NextResponse.json(
      { error: 'Failed to update WiFi network' },
      { status: 500 }
    );
  }
}

// DELETE /api/hotels/[id]/wifi/networks/[networkId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; networkId: string } }
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

    const { id: hotelId, networkId } = params;

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

    // Verify network exists
    const [networkRows] = await pool.query(
      'SELECT id FROM wifi_networks WHERE id = ? AND hotelId = ?',
      [networkId, hotelId]
    );

    const networks = networkRows as any[];
    if (networks.length === 0) {
      return NextResponse.json(
        { error: 'WiFi network not found' },
        { status: 404 }
      );
    }

    // Set networkId to NULL for related credentials
    await pool.query(
      'UPDATE wifi_credentials SET networkId = NULL WHERE networkId = ?',
      [networkId]
    );

    // Delete network
    await pool.query(
      'DELETE FROM wifi_networks WHERE id = ? AND hotelId = ?',
      [networkId, hotelId]
    );

    return NextResponse.json({
      message: 'WiFi network deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting WiFi network:', error);
    return NextResponse.json(
      { error: 'Failed to delete WiFi network' },
      { status: 500 }
    );
  }
} 