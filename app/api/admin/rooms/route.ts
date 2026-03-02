import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import { RoomService } from '@/services/rooms';

export const dynamic = 'force-dynamic';


// POST handler to create a new room
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication - only super admin can create rooms
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    
    try {
      // Use service to create room
      const room = await RoomService.createRoom(body);
      return NextResponse.json({ room }, { status: 201 });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('required fields')) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
        if (err.message === 'Hotel not found') {
          return NextResponse.json({ error: err.message }, { status: 404 });
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
