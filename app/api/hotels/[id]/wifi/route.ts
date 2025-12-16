import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { wifiService } from '@/lib/services/wifi.service';

// GET: Get WiFi credentials for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id: bookingId } = params;
  
  try {
    // Get credentials for the booking
    const credentials = await wifiService.getCredentials('', {
      bookingId,
    });
    
    return NextResponse.json(credentials);
  } catch (error) {
    console.error(`Error fetching WiFi credentials for booking ID ${bookingId}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch WiFi credentials' },
      { status: 500 }
    );
  }
}

// POST: Generate WiFi credentials for a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id: bookingId } = params;
  
  try {
    // Generate credential for the booking
    const credential = await wifiService.generateCredentialsForBooking(bookingId);
    
    return NextResponse.json(credential);
  } catch (error) {
    console.error(`Error generating WiFi credentials for booking ID ${bookingId}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate WiFi credentials' },
      { status: 500 }
    );
  }
}

// DELETE: Deactivate WiFi credentials for a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Check authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id: bookingId } = params;
  
  try {
    // Deactivate credentials for the booking
    const result = await wifiService.deactivateBookingCredentials(bookingId);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error deactivating WiFi credentials for booking ID ${bookingId}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deactivate WiFi credentials' },
      { status: 500 }
    );
  }
}