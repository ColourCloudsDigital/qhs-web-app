import { NextRequest, NextResponse } from 'next/server';
import { KeycardService } from '@/lib/services/keycard.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract query parameters
    const searchParams = req.nextUrl.searchParams;
    const hotelId = searchParams.get('hotelId') || undefined;
    const isActive = searchParams.has('isActive') 
      ? searchParams.get('isActive') === 'true' 
      : undefined;
    const cardType = searchParams.get('cardType') || undefined;
    const isConfigured = searchParams.has('isConfigured') 
      ? searchParams.get('isConfigured') === 'true' 
      : undefined;
    const lockId = searchParams.get('lockId') || undefined;
    const assignedToId = searchParams.get('assignedToId') || undefined;
    const staffId = searchParams.get('staffId') || undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;
    const limit = searchParams.has('limit') 
      ? parseInt(searchParams.get('limit') as string, 10) 
      : 20;
    const offset = searchParams.has('offset') 
      ? parseInt(searchParams.get('offset') as string, 10) 
      : 0;

    // Check for hotelId if user is a vendor or staff
    if ((session.user.role === 'VENDOR' || session.user.role === 'STAFF') && !hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Get keycards
    const result = await KeycardService.getKeycards({
      hotelId,
      isActive,
      cardType: cardType as any,
      isConfigured,
      lockId,
      assignedToId,
      staffId,
      searchTerm,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error getting keycards:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only vendors and super admins can register keycards
    if (session.user.role !== 'VENDOR' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }
    
    if (!body.cardNumbers || !Array.isArray(body.cardNumbers) || body.cardNumbers.length === 0) {
      return NextResponse.json({ error: 'Card numbers array is required' }, { status: 400 });
    }

    // Register keycards
    const result = await KeycardService.registerKeycards({
      hotelId: body.hotelId,
      cardType: body.cardType,
      cardNumbers: body.cardNumbers
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error registering keycards:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}