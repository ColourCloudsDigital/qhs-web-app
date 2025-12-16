import { NextRequest, NextResponse } from 'next/server';
import { RoomService } from '@/services/rooms';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    console.log('[DEBUG IMAGES] Fetching room data for ID:', roomId);

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
    let imagesExist = [];
    let imagesInfo = [];
    
    try {
      if (rawImagesString) {
        parsedImages = JSON.parse(rawImagesString);
        
        // Check if the image files actually exist
        if (Array.isArray(parsedImages)) {
          for (const imagePath of parsedImages) {
            const fullPath = path.join(process.cwd(), 'public', imagePath.replace(/^\//, ''));
            const exists = fs.existsSync(fullPath);
            imagesExist.push(exists);
            imagesInfo.push({
              url: imagePath,
              fullPath,
              exists,
              size: exists ? fs.statSync(fullPath).size : 0
            });
          }
        }
      }
    } catch (e) {
      parseError = e instanceof Error ? e.message : String(e);
    }
    
    // Now also get the room using the service
    const roomFromService = await RoomService.getRoomById(roomId);
    
    return NextResponse.json({
      success: true,
      roomFromDb: {
        id: room.id,
        name: room.name,
        type: room.type,
        rawImages: rawImagesString,
        rawImagesType: typeof rawImagesString,
        parsedImages,
        parseError,
        imagesExist, 
        imagesInfo
      },
      roomFromService: {
        ...roomFromService,
        images: roomFromService.images,
        imagesLength: roomFromService.images ? roomFromService.images.length : 0
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