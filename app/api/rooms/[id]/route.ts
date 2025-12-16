import { NextRequest, NextResponse } from 'next/server';
import { roomService } from '@/lib/services/room.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;

    try {
      const room = await roomService.getRoomById(roomId);
      return NextResponse.json(room);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'Room not found') {
          return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}