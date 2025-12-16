import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    console.log('[DEBUG] Fetching room data for ID:', roomId);

    // Query the database directly to get the raw room data
    const [roomRows] = await pool.query(
      `SELECT * FROM rooms WHERE id = ?`,
      [roomId]
    );

    if (!(roomRows as any[]).length) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const room = (roomRows as any[])[0];
    
    // Get the raw image JSON string
    const rawImagesString = room.images;
    
    // Try parsing it
    let parsedImages = [];
    let parseError = null;
    
    try {
      if (rawImagesString) {
        parsedImages = JSON.parse(rawImagesString);
      }
    } catch (e) {
      parseError = e instanceof Error ? e.message : String(e);
    }
    
    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        type: room.type,
        rawImages: rawImagesString,
        rawImagesType: typeof rawImagesString,
        parsedImages,
        parseError,
        hasImages: Array.isArray(parsedImages) && parsedImages.length > 0
      }
    });
  } catch (error) {
    console.error('[DEBUG] Error fetching room data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch room data' },
      { status: 500 }
    );
  }
} 