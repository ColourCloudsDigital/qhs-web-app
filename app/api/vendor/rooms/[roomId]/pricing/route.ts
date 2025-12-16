import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { getUserVendorId } from '@/lib/utils/vendor';

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor id
    const { vendorId } = await getUserVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = params;

    // Verify room belongs to vendor's hotel
    const [roomRows]: any = await pool.query(
      `SELECT r.id, r.pricePerNight, rt.basePrice
       FROM rooms r 
       JOIN hotels h ON r.hotelId = h.id
       LEFT JOIN room_types rt ON r.roomTypeId = rt.id
       WHERE r.id = ? AND h.vendorId = ?`,
      [roomId, vendorId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json(
        { error: 'Room not found or unauthorized' },
        { status: 404 }
      );
    }

    const room = roomRows[0];

    // Fetch pricing rules for the room
    const [rows]: any = await pool.query(
      `SELECT 
        id,
        startDate,
        endDate,
        priceAdjustment,
        adjustmentType,
        description,
        isActive,
        createdAt,
        updatedAt
      FROM room_pricing_rules
      WHERE roomId = ?
      ORDER BY startDate ASC`,
      [roomId]
    );

    return NextResponse.json({
      basePrice: room.pricePerNight || room.basePrice || 0,
      rules: rows.map((rule: any) => ({
        id: rule.id,
        startDate: rule.startDate,
        endDate: rule.endDate,
        priceAdjustment: rule.priceAdjustment,
        adjustmentType: rule.adjustmentType,
        description: rule.description,
        isActive: Boolean(rule.isActive),
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching room pricing rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room pricing rules' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor id
    const { vendorId } = await getUserVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = params;
    const {
      startDate,
      endDate,
      priceAdjustment,
      adjustmentType,
      description
    } = await request.json();

    // Validate required fields
    if (!startDate || !endDate || priceAdjustment === undefined || !adjustmentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify room belongs to vendor's hotel
    const [roomRows]: any = await pool.query(
      `SELECT r.id 
       FROM rooms r 
       JOIN hotels h ON r.hotelId = h.id 
       WHERE r.id = ? AND h.vendorId = ?`,
      [roomId, vendorId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json(
        { error: 'Room not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check for overlapping date ranges
    const [overlapRows]: any = await pool.query(
      `SELECT id 
       FROM room_pricing_rules 
       WHERE roomId = ? 
         AND isActive = 1
         AND (
           (startDate <= ? AND endDate >= ?)
           OR (startDate <= ? AND endDate >= ?)
           OR (startDate >= ? AND endDate <= ?)
         )`,
      [
        roomId,
        endDate, startDate,    // Existing rule overlaps start
        endDate, endDate,      // Existing rule overlaps end
        startDate, endDate     // New rule completely contains existing rule
      ]
    );

    if (overlapRows.length > 0) {
      return NextResponse.json(
        { error: 'Date range overlaps with existing pricing rule' },
        { status: 400 }
      );
    }

    // Insert new pricing rule
    const [result]: any = await pool.query(
      `INSERT INTO room_pricing_rules (
        roomId,
        startDate,
        endDate,
        priceAdjustment,
        adjustmentType,
        description,
        isActive,
        createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        roomId,
        new Date(startDate),
        new Date(endDate),
        priceAdjustment,
        adjustmentType,
        description || null,
        session.user.id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Pricing rule created successfully',
      ruleId: result.insertId
    });
  } catch (error) {
    console.error('Error creating room pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to create room pricing rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor id
    const { vendorId } = await getUserVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = params;
    const {
      ruleId,
      startDate,
      endDate,
      priceAdjustment,
      adjustmentType,
      description,
      isActive
    } = await request.json();

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // Verify room belongs to vendor's hotel
    const [roomRows]: any = await pool.query(
      `SELECT r.id 
       FROM rooms r 
       JOIN hotels h ON r.hotelId = h.id 
       WHERE r.id = ? AND h.vendorId = ?`,
      [roomId, vendorId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json(
        { error: 'Room not found or unauthorized' },
        { status: 404 }
      );
    }

    // Verify rule exists and belongs to this room
    const [ruleRows]: any = await pool.query(
      'SELECT id FROM room_pricing_rules WHERE id = ? AND roomId = ?',
      [ruleId, roomId]
    );

    if (ruleRows.length === 0) {
      return NextResponse.json(
        { error: 'Pricing rule not found' },
        { status: 404 }
      );
    }

    // Check for overlapping date ranges if dates are being updated
    if (startDate && endDate) {
      const [overlapRows]: any = await pool.query(
        `SELECT id 
         FROM room_pricing_rules 
         WHERE roomId = ? 
           AND id != ?
           AND isActive = 1
           AND (
             (startDate <= ? AND endDate >= ?)
             OR (startDate <= ? AND endDate >= ?)
             OR (startDate >= ? AND endDate <= ?)
           )`,
        [
          roomId,
          ruleId,
          endDate, startDate,    // Existing rule overlaps start
          endDate, endDate,      // Existing rule overlaps end
          startDate, endDate     // New rule completely contains existing rule
        ]
      );

      if (overlapRows.length > 0) {
        return NextResponse.json(
          { error: 'Date range overlaps with existing pricing rule' },
          { status: 400 }
        );
      }
    }

    // Update pricing rule
    await pool.query(
      `UPDATE room_pricing_rules 
       SET 
         startDate = COALESCE(?, startDate),
         endDate = COALESCE(?, endDate),
         priceAdjustment = COALESCE(?, priceAdjustment),
         adjustmentType = COALESCE(?, adjustmentType),
         description = COALESCE(?, description),
         isActive = COALESCE(?, isActive),
         updatedAt = NOW(),
         updatedBy = ?
       WHERE id = ?`,
      [
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null,
        priceAdjustment,
        adjustmentType,
        description,
        isActive === undefined ? null : isActive,
        session.user.id,
        ruleId
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Pricing rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating room pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to update room pricing rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor id
    const { vendorId } = await getUserVendorId(session);
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = params;
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // Verify room belongs to vendor's hotel
    const [roomRows]: any = await pool.query(
      `SELECT r.id 
       FROM rooms r 
       JOIN hotels h ON r.hotelId = h.id 
       WHERE r.id = ? AND h.vendorId = ?`,
      [roomId, vendorId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json(
        { error: 'Room not found or unauthorized' },
        { status: 404 }
      );
    }

    // Verify rule exists and belongs to this room
    const [ruleRows]: any = await pool.query(
      'SELECT id FROM room_pricing_rules WHERE id = ? AND roomId = ?',
      [ruleId, roomId]
    );

    if (ruleRows.length === 0) {
      return NextResponse.json(
        { error: 'Pricing rule not found' },
        { status: 404 }
      );
    }

    // Soft delete the pricing rule
    await pool.query(
      `UPDATE room_pricing_rules 
       SET 
         isActive = 0,
         updatedAt = NOW(),
         updatedBy = ?
       WHERE id = ?`,
      [session.user.id, ruleId]
    );

    return NextResponse.json({
      success: true,
      message: 'Pricing rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete room pricing rule' },
      { status: 500 }
    );
  }
} 