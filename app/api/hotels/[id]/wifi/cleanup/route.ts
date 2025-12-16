import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wifiService } from '@/lib/services/wifi.service';

// DELETE: Delete inactive or expired WiFi credentials for a hotel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id: hotelId } = params;
  
  // Check if this is for inactive or expired credentials
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'inactive';
  
  try {
    let result;
    
    // Delete credentials based on type
    if (type === 'expired') {
      result = await wifiService.deleteExpiredCredentials(hotelId);
    } else {
      result = await wifiService.deleteInactiveCredentials(hotelId);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error cleaning up WiFi credentials for hotel ID ${hotelId}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clean up WiFi credentials' },
      { status: 500 }
    );
  }
}